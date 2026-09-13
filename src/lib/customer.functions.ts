import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CustomerProfileInput = {
  full_name: string;
  phone: string;
  email: string;
};

export const upsertCustomerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: CustomerProfileInput) => data)
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;

    const { error } = await sb.from("customer_profiles").upsert(
      {
        id: context.userId,
        full_name: data.full_name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("Customer profile save failed:", error);
      throw new Error("Unable to save your customer profile.");
    }

    return { success: true, userId: context.userId };
  });

export const getCustomerAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;

    const [{ data: profile, error: profileError }, { data: orders, error: ordersError }] =
      await Promise.all([
        sb.from("customer_profiles").select("id,full_name,phone,email,created_at,updated_at").eq("id", context.userId).maybeSingle(),
        sb
          .from("orders")
          .select("*")
          .eq("user_id", context.userId)
          .order("created_at", { ascending: false }),
      ]);

    if (profileError) {
      console.error("Customer profile load failed:", profileError);
      throw new Error("Unable to load your account.");
    }

    if (ordersError) {
      console.error("Customer orders load failed:", ordersError);
      throw new Error("Unable to load your orders.");
    }

    const orderRows = orders ?? [];
    const orderIds = orderRows.map((order: any) => order.id).filter(Boolean);

    let itemRows: any[] = [];
    if (orderIds.length) {
      const { data, error } = await sb
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (error) {
        console.error("Customer order items load failed:", error);
        throw new Error("Unable to load your order items.");
      }

      itemRows = data ?? [];
    }

    const itemsByOrder = new Map<string, any[]>();
    for (const item of itemRows) {
      const list = itemsByOrder.get(item.order_id) ?? [];
      list.push(item);
      itemsByOrder.set(item.order_id, list);
    }

    return {
      userId: context.userId,
      profile,
      orders: orderRows.map((order: any) => ({
        ...order,
        items: itemsByOrder.get(order.id) ?? [],
      })),
    };
  });

export const verifyCustomerPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      orderId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => data,
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      throw new Error("Razorpay server secret is not configured.");
    }

    const { data: order, error: orderError } = await sb
      .from("orders")
      .select("id,order_number,user_id,razorpay_order_id,payment_status,order_status")
      .eq("id", data.orderId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (orderError || !order) {
      throw new Error("Order not found.");
    }

    if (order.razorpay_order_id !== data.razorpayOrderId) {
      throw new Error("Razorpay order mismatch.");
    }

    const { createHmac, timingSafeEqual } = await import("node:crypto");
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expected, "utf8");
    const receivedBuffer = Buffer.from(data.razorpaySignature, "utf8");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new Error("Payment verification failed.");
    }

    const { error: updateError } = await sb
      .from("orders")
      .update({
        payment_status: "paid",
        order_status: "confirmed",
        razorpay_payment_id: data.razorpayPaymentId,
        razorpay_signature: data.razorpaySignature,
      })
      .eq("id", order.id)
      .eq("user_id", context.userId);

    if (updateError) {
      console.error("Payment status update failed:", updateError);
      throw new Error("Payment was verified but order update failed.");
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
    };
  });
