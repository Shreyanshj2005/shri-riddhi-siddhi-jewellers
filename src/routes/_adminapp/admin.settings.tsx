import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { PageHeader } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_adminapp/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [email, setEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  // Change email
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Password recovery mode
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] =
    useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Load current logged-in user
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error) {
        toast.error(error.message);
        setLoadingUser(false);
        return;
      }

      const currentEmail = data.user?.email ?? "";

      setEmail(currentEmail);
      setForgotEmail(currentEmail);
      setLoadingUser(false);
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for Supabase password recovery event
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }

      if (event === "USER_UPDATED") {
        // Refresh current email after an update
        supabase.auth.getUser().then(({ data }) => {
          setEmail(data.user?.email ?? "");
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --------------------------------------------------
  // CHANGE EMAIL
  // --------------------------------------------------

  async function handleChangeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Please enter a new email address.");
      return;
    }

    if (trimmedEmail === email.toLowerCase()) {
      toast.error("This is already your current email.");
      return;
    }

    setEmailLoading(true);

    const { error } = await supabase.auth.updateUser({
      email: trimmedEmail,
    });

    setEmailLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setNewEmail("");

    toast.success(
      "Email change requested. Check your email for confirmation."
    );
  }

  // --------------------------------------------------
  // CHANGE PASSWORD
  // --------------------------------------------------

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword) {
      toast.error("Enter your current password.");
      return;
    }

    if (!newPassword) {
      toast.error("Enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (!email) {
      toast.error("Could not determine your current email.");
      return;
    }

    setPasswordLoading(true);

    // Re-authenticate before changing password
    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

    if (loginError) {
      setPasswordLoading(false);
      toast.error("Current password is incorrect.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setPasswordLoading(false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    toast.success("Password changed successfully.");
  }

  // --------------------------------------------------
  // FORGOT PASSWORD
  // --------------------------------------------------

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = forgotEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Enter your email address.");
      return;
    }

    setForgotLoading(true);

    const redirectTo = `${window.location.origin}/admin/settings`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      trimmedEmail,
      {
        redirectTo,
      }
    );

    setForgotLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(
      "Password reset email sent. Check your inbox."
    );
  }

  // --------------------------------------------------
  // RECOVERY PASSWORD
  // --------------------------------------------------

  async function handleRecoveryPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!recoveryPassword) {
      toast.error("Enter your new password.");
      return;
    }

    if (recoveryPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (recoveryPassword !== recoveryConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setRecoveryLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: recoveryPassword,
    });

    setRecoveryLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setRecoveryPassword("");
    setRecoveryConfirmPassword("");
    setRecoveryMode(false);

    toast.success("Your password has been reset successfully.");
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loadingUser) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading account...
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // PASSWORD RECOVERY SCREEN
  // --------------------------------------------------

  if (recoveryMode) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Reset Password"
          description="Create a new password for your SRSJ admin account."
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Create New Password
            </CardTitle>

            <CardDescription>
              Choose a strong password with at least 8 characters.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleRecoveryPassword}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label
                  htmlFor="recovery-password"
                  className="text-sm font-medium"
                >
                  New password
                </label>

                <Input
                  id="recovery-password"
                  type="password"
                  value={recoveryPassword}
                  onChange={(e) =>
                    setRecoveryPassword(e.target.value)
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="recovery-confirm-password"
                  className="text-sm font-medium"
                >
                  Confirm new password
                </label>

                <Input
                  id="recovery-confirm-password"
                  type="password"
                  value={recoveryConfirmPassword}
                  onChange={(e) =>
                    setRecoveryConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                disabled={recoveryLoading}
                className="w-full"
              >
                {recoveryLoading
                  ? "Updating password..."
                  : "Set New Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --------------------------------------------------
  // NORMAL SETTINGS PAGE
  // --------------------------------------------------

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Account Settings"
        description="Manage your SRSJ admin email and password."
      />

      <div className="grid gap-6">
        {/* ACCOUNT INFORMATION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Account Information
            </CardTitle>

            <CardDescription>
              Your current administrator account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                Current admin email
              </p>

              <p className="mt-1 font-medium">
                {email || "No email found"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CHANGE EMAIL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Change Email
            </CardTitle>

            <CardDescription>
              Update the email address used to log into the admin
              panel.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleChangeEmail}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label
                  htmlFor="current-email"
                  className="text-sm font-medium"
                >
                  Current email
                </label>

                <Input
                  id="current-email"
                  value={email}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="new-email"
                  className="text-sm font-medium"
                >
                  New email
                </label>

                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) =>
                    setNewEmail(e.target.value)
                  }
                  placeholder="new@email.com"
                  autoComplete="email"
                />
              </div>

              <Button
                type="submit"
                disabled={emailLoading}
              >
                {emailLoading
                  ? "Updating..."
                  : "Change Email"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* CHANGE PASSWORD */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Change Password
            </CardTitle>

            <CardDescription>
              Enter your current password before creating a new one.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleChangePassword}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label
                  htmlFor="current-password"
                  className="text-sm font-medium"
                >
                  Current password
                </label>

                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(e.target.value)
                  }
                  placeholder="Current password"
                  autoComplete="current-password"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="new-password"
                  className="text-sm font-medium"
                >
                  New password
                </label>

                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="New password"
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium"
                >
                  Confirm new password
                </label>

                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                disabled={passwordLoading}
              >
                {passwordLoading
                  ? "Changing password..."
                  : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FORGOT PASSWORD */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Forgot Password
            </CardTitle>

            <CardDescription>
              Send a password-reset link to your admin email.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleForgotPassword}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label
                  htmlFor="forgot-email"
                  className="text-sm font-medium"
                >
                  Admin email
                </label>

                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) =>
                    setForgotEmail(e.target.value)
                  }
                  placeholder="admin@email.com"
                  autoComplete="email"
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                disabled={forgotLoading}
              >
                {forgotLoading
                  ? "Sending..."
                  : "Send Reset Link"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* SECURITY NOTE */}
        <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              Security
            </p>

            <p className="mt-1">
              Your password is managed securely by Supabase
              Authentication. It is never stored in this website's
              database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}