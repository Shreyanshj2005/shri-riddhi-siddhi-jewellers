import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { claimAdmin, checkAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock, Mail, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      {
        title: "Admin Sign In — Shri Riddhi Siddhi Jewellers",
      },
      {
        name: "description",
        content:
          "Secure sign in for the Shri Riddhi Siddhi Jewellers store management panel.",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
      {
        property: "og:title",
        content: "Admin Sign In — Shri Riddhi Siddhi Jewellers",
      },
      {
        property: "og:description",
        content: "Secure store management sign in.",
      },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [step, setStep] = useState<"email" | "otp">("email");

  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;

    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();

        if (!alive) return;

        if (data.session) {
          const res = await checkAdmin().catch(() => ({
            isAdmin: false,
          }));

          if (res.isAdmin) {
            navigate({
              to: "/admin",
              replace: true,
            });
            return;
          }
        }
      } finally {
        if (alive) {
          setChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      alive = false;
    };
  }, [navigate]);

  async function afterAuth() {
    const res = await claimAdmin().catch(() => ({
      isAdmin: false,
    }));

    if (res.isAdmin) {
      toast.success("Welcome to SRSJ Admin");

      navigate({
        to: "/admin",
        replace: true,
      });
    } else {
      await supabase.auth.signOut();

      toast.error(
        "This account does not have store access. Ask the owner to invite it first.",
      );
    }
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      toast.error("Please enter your email");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }

      setEmail(cleanEmail);
      setStep("otp");

      toast.success("Verification code sent to your email");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to send verification code",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      toast.error("Please enter the verification code");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: "email",
      });

      if (error) {
        throw error;
      }

      await afterAuth();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Invalid or expired verification code",
      );
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      toast.error("Please enter your email");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("New verification code sent");
      setOtp("");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to resend verification code",
      );
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="font-display text-xl tracking-widest text-foreground"
          >
            SHRI RIDDHI SIDDHI
          </Link>

          <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Jewellers
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            {step === "email" ? (
              <Mail className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}

            <h1 className="font-display text-lg">
              {step === "email"
                ? "Store Sign In"
                : "Enter Verification Code"}
            </h1>
          </div>

          {step === "email" ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Admin Email</Label>

                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={busy}
              >
                {busy && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {busy ? "Sending code..." : "Send verification code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                Verification code sent to:
                <div className="mt-1 font-medium break-all">
                  {email}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="otp">6-digit code</Label>

                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  required
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={busy || otp.length !== 6}
              >
                {busy && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {busy ? "Verifying..." : "Verify & Sign in"}
              </Button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  disabled={busy}
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" />
                    Change email
                  </span>
                </button>

                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  disabled={busy}
                  onClick={resendOtp}
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Only invited accounts can manage the store.
        </p>
      </div>
    </div>
  );
}