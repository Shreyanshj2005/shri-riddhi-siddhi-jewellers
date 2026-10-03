import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CustomerProfileInput = {
  full_name: string;
  phone: string;
  email: string;
};

/* =========================================================
   CUSTOMER PROFILE
========================================================= */

export const upsertCustomerProfile = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .validator(
    (data: CustomerProfileInput) => data,
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;

    const { error } = await sb
      .from("customer_profiles")
      .upsert(
        {
          id: context.userId,
          full_name: data.full_name.trim(),
          phone: data.phone.trim(),
          email: data.email.trim().toLowerCase(),
        },
        {
          onConflict: "id",
        },
      );

    if (error) {
      console.error(
        "Customer profile save failed:",
        error,
      );

      throw new Error(
        "Unable to save your customer profile.",
      );
    }

    return {
      success: true,
      userId: context.userId,
    };
  });


/* =========================================================
   GET CUSTOMER ACCOUNT
========================================================= */

export const getCustomerAccount = createServerFn({
  method: "GET",
})
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;

    /* -----------------------------------------
       Get profile + orders
    ----------------------------------------- */

    const [
      {
        data: profile,
        error: profileError,
      },
      {
        data: orders,
        error: ordersError,
      },
    ] = await Promise.all([
      sb
        .from("customer_profiles")
        .select(
          "id,full_name,phone,email,created_at,updated_at",
        )
        .eq(
          "id",
          context.userId,
        )
        .maybeSingle(),

      sb
        .from("orders")
        .select("*")
        .eq(
          "customer_id",
          context.userId,
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        ),
    ]);

    /* -----------------------------------------
       Profile error
    ----------------------------------------- */

    if (profileError) {
      console.error(
        "Customer profile load failed:",
        profileError,
      );

      throw new Error(
        "Unable to load your account.",
      );
    }

    /* -----------------------------------------
       Orders error
    ----------------------------------------- */

    if (ordersError) {
      console.error(
        "Customer orders load failed:",
        ordersError,
      );

      throw new Error(
        "Unable to load your orders.",
      );
    }

    const orderRows =
      orders ?? [];

    const orderIds =
      orderRows
        .map(
          (order: any) =>
            order.id,
        )
        .filter(Boolean);

    /* -----------------------------------------
       Get order items
    ----------------------------------------- */

    let itemRows: any[] = [];

    if (orderIds.length) {
      const {
        data,
        error,
      } = await sb
        .from("order_items")
        .select("*")
        .in(
          "order_id",
          orderIds,
        );

      if (error) {
        console.error(
          "Customer order items load failed:",
          error,
        );

        throw new Error(
          "Unable to load your order items.",
        );
      }

      itemRows =
        data ?? [];
    }

    /* -----------------------------------------
       Group items by order
    ----------------------------------------- */

    const itemsByOrder =
      new Map<
        string,
        any[]
      >();

    for (const item of itemRows) {
      const list =
        itemsByOrder.get(
          item.order_id,
        ) ?? [];

      list.push(item);

      itemsByOrder.set(
        item.order_id,
        list,
      );
    }

    /* -----------------------------------------
       Return customer account
    ----------------------------------------- */

    return {
      userId:
        context.userId,

      profile,

      orders:
        orderRows.map(
          (order: any) => ({
            ...order,

            items:
              itemsByOrder.get(
                order.id,
              ) ?? [],
          }),
        ),
    };
  });


/* =========================================================
   VERIFY CUSTOMER PAYMENT
========================================================= */

export const verifyCustomerPayment =
  createServerFn({
    method: "POST",
  })
    .middleware([
      requireSupabaseAuth,
    ])
    .validator(
      (data: {
        orderId: string;
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
      }) => data,
    )
    .handler(
      async ({
        context,
        data,
      }) => {
        const sb =
          context.supabase as any;

        /* -----------------------------------------
           Razorpay secret
        ----------------------------------------- */

        const keySecret =
          process.env
            .RAZORPAY_KEY_SECRET;

        if (!keySecret) {
          throw new Error(
            "Razorpay server secret is not configured.",
          );
        }

        /* -----------------------------------------
           1. Find customer's order
        ----------------------------------------- */

        const {
          data: order,
          error: orderError,
        } = await sb
          .from("orders")
          .select(
            "id,order_number,customer_id,razorpay_order_id,payment_status,order_status",
          )
          .eq(
            "id",
            data.orderId,
          )
          .eq(
            "customer_id",
            context.userId,
          )
          .maybeSingle();

        if (orderError) {
          console.error(
            "Order lookup failed:",
            orderError,
          );

          throw new Error(
            "Unable to find your order.",
          );
        }

        if (!order) {
          throw new Error(
            "Order not found.",
          );
        }

        /* -----------------------------------------
           2. Verify Razorpay Order ID
        ----------------------------------------- */

        if (
          order.razorpay_order_id !==
          data.razorpayOrderId
        ) {
          throw new Error(
            "Razorpay order mismatch.",
          );
        }

        /* -----------------------------------------
           3. Prevent duplicate verification
        ----------------------------------------- */

        if (
          order.payment_status ===
          "paid"
        ) {
          return {
            success: true,
            orderId:
              order.id,
            orderNumber:
              order.order_number,
            paymentStatus:
              order.payment_status,
            orderStatus:
              order.order_status,
            razorpayPaymentId:
              data.razorpayPaymentId,
          };
        }

        /* -----------------------------------------
           4. Generate expected signature
        ----------------------------------------- */

        const {
          createHmac,
          timingSafeEqual,
        } = await import(
          "node:crypto"
        );

        const expectedSignature =
          createHmac(
            "sha256",
            keySecret,
          )
            .update(
              `${data.razorpayOrderId}|${data.razorpayPaymentId}`,
            )
            .digest("hex");

        /* -----------------------------------------
           5. Compare signatures securely
        ----------------------------------------- */

        const expectedBuffer =
          Buffer.from(
            expectedSignature,
            "utf8",
          );

        const receivedBuffer =
          Buffer.from(
            data.razorpaySignature,
            "utf8",
          );

        if (
          expectedBuffer.length !==
            receivedBuffer.length ||
          !timingSafeEqual(
            expectedBuffer,
            receivedBuffer,
          )
        ) {
          throw new Error(
            "Payment verification failed.",
          );
        }

        /* -----------------------------------------
           6. Update order as PAID
        ----------------------------------------- */

        const {
          data: updatedOrder,
          error: updateError,
        } = await sb
          .from("orders")
          .update({
            payment_status:
              "paid",

            order_status:
              "confirmed",

            razorpay_payment_id:
              data.razorpayPaymentId,

            razorpay_signature:
              data.razorpaySignature,
          })
          .eq(
            "id",
            order.id,
          )
          .eq(
            "customer_id",
            context.userId,
          )
          .select(
            "id,order_number,payment_status,order_status,razorpay_payment_id",
          )
          .single();

        if (
          updateError ||
          !updatedOrder
        ) {
          console.error(
            "Payment status update failed:",
            updateError,
          );

          throw new Error(
            "Payment was verified but order update failed.",
          );
        }

        /* -----------------------------------------
           7. Return success
        ----------------------------------------- */

        return {
          success: true,

          orderId:
            updatedOrder.id,

          orderNumber:
            updatedOrder.order_number,

          paymentStatus:
            updatedOrder.payment_status,

          orderStatus:
            updatedOrder.order_status,

          razorpayPaymentId:
            updatedOrder.razorpay_payment_id,
        };
      },
    );