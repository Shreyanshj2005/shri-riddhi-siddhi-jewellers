import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { CartProvider } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { CustomerAuthPopup } from "@/components/customer/CustomerAuthPopup";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkCustomerLogin = async () => {
      // The customer popup is intended for the homepage.
      if (location.pathname !== "/") {
        setShowLogin(false);
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      // Already logged in: do not show the popup.
      if (data.session) {
        setShowLogin(false);
        return;
      }

      // Ignore the old localStorage flag so the popup can appear again.
      localStorage.removeItem("srsj_login_popup_skipped");
      setShowLogin(true);
    };

    void checkCustomerLogin();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  const closeLogin = () => {
    setShowLogin(false);
  };

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />

        <main className="flex-1">
          <Outlet />
        </main>

        <SiteFooter />
        <FloatingWhatsApp />

        <CustomerAuthPopup
          open={showLogin}
          onClose={closeLogin}
          onSuccess={() => setShowLogin(false)}
        />
      </div>
    </CartProvider>
  );
}
