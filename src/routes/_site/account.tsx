import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut, Package, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerAuthPopup } from "@/components/customer/CustomerAuthPopup";
import { getCustomerAccount } from "@/lib/customer.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/account")({
  component: AccountPage,
});

function money(value: unknown) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function date(value: unknown) {
  if (!value) return "";
  return new Date(String(value)).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AccountPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const accountQuery = useQuery({
    queryKey: ["customer-account"],
    queryFn: () => getCustomerAccount(),
    enabled: loggedIn,
    retry: false,
  });

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setLoggedIn(Boolean(data.session));
      if (!data.session) setShowLogin(true);
    };

    void check();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
      if (session) setShowLogin(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    setLoggedIn(false);
    toast.success("You have been logged out.");
  };

  if (!loggedIn) {
    return (
      <main className="min-h-[70vh] bg-background">
        <div className="container-luxe flex min-h-[70vh] items-center justify-center py-20">
          <div className="max-w-md text-center">
            <UserRound className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="eyebrow mt-5">My Account</p>
            <h1 className="mt-3 font-serif text-4xl">Welcome back</h1>
            <p className="mt-4 text-muted-foreground">
              Login to view your profile and order history.
            </p>
            <Button variant="gold" size="lg" className="mt-8" onClick={() => setShowLogin(true)}>
              Login / Sign Up
            </Button>
          </div>
        </div>

        <CustomerAuthPopup
          open={showLogin}
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setLoggedIn(true);
            void accountQuery.refetch();
          }}
        />
      </main>
    );
  }

  if (accountQuery.isLoading) {
    return (
      <main className="min-h-[70vh]">
        <div className="container-luxe py-20">
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </main>
    );
  }

  if (accountQuery.isError) {
    return (
      <main className="min-h-[70vh]">
        <div className="container-luxe py-20">
          <p className="text-sm text-destructive">Unable to load your account.</p>
          <Button className="mt-4" onClick={() => void accountQuery.refetch()}>
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  const account = accountQuery.data;
  const profile = account?.profile;
  const orders = account?.orders ?? [];

  return (
    <main className="min-h-screen bg-background">
      <div className="container-luxe py-12 sm:py-16">
        <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">My Account</p>
            <h1 className="mt-2 font-serif text-4xl sm:text-5xl">
              {profile?.full_name || "Welcome"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile?.email || ""}{profile?.phone ? ` • ${profile.phone}` : ""}
            </p>
          </div>

          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <section className="mt-10">
          <div className="mb-5 flex items-center gap-3">
            <Package className="h-5 w-5" />
            <h2 className="font-serif text-2xl">My Orders</h2>
          </div>

          {orders.length === 0 ? (
            <div className="border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">You have no orders yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {orders.map((order: any) => (
                <article key={order.id} className="border border-border bg-card p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{date(order.created_at)}</p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="font-semibold">{money(order.total_amount)}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                        {order.payment_status || "pending"} • {order.order_status || "pending"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {(order.items ?? []).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name || "Jewellery"}
                            className="h-14 w-14 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>

                        <p className="text-sm font-medium">{money(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
