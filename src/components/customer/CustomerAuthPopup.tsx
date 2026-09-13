import { useState } from "react";
import { X, Mail, User, Phone, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CustomerAuthPopupProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CustomerAuthPopup({
  open,
  onClose,
  onSuccess,
}: CustomerAuthPopupProps) {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!phone.trim()) {
      toast.error("Please enter your mobile number");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      setStep("otp");
      toast.success("OTP sent to your email");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to send OTP"
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("Please enter the OTP");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: "email",
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Unable to create customer session");
      }

      localStorage.setItem(
        "srsj_customer_profile",
        JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
        })
      );

      toast.success("Welcome to Shri Riddhi Siddhi Jewellers");

      onSuccess?.();
      onClose();

      setStep("details");
      setOtp("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Invalid OTP"
      );
    } finally {
      setLoading(false);
    }
  }

  function closePopup() {
    if (loading) return;

    setStep("details");
    setOtp("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <button
          type="button"
          onClick={closePopup}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 pr-8">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            SHRI RIDDHI SIDDHI
          </p>

          <h2 className="mt-2 font-display text-2xl">
            {step === "details"
              ? "Welcome to our showroom"
              : "Verify your email"}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {step === "details"
              ? "Login to continue shopping and track your orders."
              : `Enter the OTP sent to ${email}.`}
          </p>
        </div>

        {step === "details" ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Full Name</Label>

              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  id="customer-name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-phone">Mobile Number</Label>

              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  id="customer-phone"
                  type="tel"
                  placeholder="10 digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-email">Email Address</Label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  id="customer-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {loading ? "Sending OTP..." : "Continue"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-otp">Email OTP</Label>

              <Input
                id="customer-otp"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, ""))
                }
                className="text-center text-lg tracking-[0.4em]"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStep("details");
                setOtp("");
              }}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Change email
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          Your information is used to manage your account and orders.
        </p>
      </div>
    </div>
  );
}