"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, CheckCircle, UsersRound } from "lucide-react";

// Underlined, label-less "long line" field style for this page only —
// no box, no fill, just a placeholder and a bottom rule that lights up
// on focus. Overrides the shared Input's default pill/shadow-inset look.
const fieldClassName =
  "h-12 rounded-none border-b-2 border-border bg-transparent px-1 text-center text-lg shadow-none backdrop-blur-none transition-colors placeholder:text-center placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-primary";

// `useSearchParams` opts the component out of static prerendering
// unless wrapped in Suspense — same pattern as /login.
export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const searchParams = useSearchParams();
  // When the user lands here from `/join/<token>` we carry the
  // invite token in the query so it survives the signup → email
  // verification → redirect round-trip. `emailRedirectTo` below
  // points back at /join/<token> so the user lands on the redeem
  // step after verifying instead of being dropped on /dashboard.
  const inviteToken = searchParams.get("invite");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    // If we have an invite token, point Supabase's verification
    // email back at the join page so the user can accept after
    // verifying. Without a token, Supabase uses its default
    // redirect (the app root).
    const emailRedirectTo = inviteToken
      ? `${window.location.origin}/join/${encodeURIComponent(inviteToken)}`
      : undefined;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
        <Card className="w-full max-w-xl gap-8 border-white/15 bg-white/10 py-10 backdrop-blur-[var(--blur-glass-strong)]">
          <CardHeader className="items-center gap-3 px-8 text-center sm:px-12">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-semibold text-foreground sm:text-4xl">
              Check your email
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              We&apos;ve sent a confirmation link to{" "}
              <span className="text-foreground">{email}</span>. Please check your
              inbox and click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 sm:px-12">
            <Link
              href={
                inviteToken
                  ? `/login?invite=${encodeURIComponent(inviteToken)}`
                  : "/login"
              }
            >
              <Button
                variant="outline"
                className="h-12 w-full text-base text-foreground hover:bg-surface-sunken hover:text-foreground"
              >
                Back to sign in
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
      <Card className="w-full max-w-xl gap-8 border-white/15 bg-white/10 py-10 backdrop-blur-[var(--blur-glass-strong)]">
        <CardHeader className="items-center gap-3 px-8 text-center sm:px-12">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            {inviteToken ? (
              <UsersRound className="h-8 w-8 text-primary" />
            ) : (
              <MessageSquare className="h-8 w-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-3xl font-semibold text-foreground sm:text-4xl">
            {inviteToken ? "Create account & join" : "Create account"}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {inviteToken
              ? "Verify your email, then accept the invitation to join your team."
              : "Get started with CRM Template for WhatsApp"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 sm:px-12">
          <form onSubmit={handleSignup} className="flex flex-col gap-6">
            {error && (
              <div className="rounded-lg  border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Input
              id="fullName"
              type="text"
              aria-label="Full name"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={fieldClassName}
            />

            <Input
              id="email"
              type="email"
              aria-label="Email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={fieldClassName}
            />

            <Input
              id="password"
              type="password"
              aria-label="Password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={fieldClassName}
            />

            <Input
              id="confirmPassword"
              type="password"
              aria-label="Confirm password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={fieldClassName}
            />

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-12 w-full text-base bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-base text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={
                inviteToken
                  ? `/login?invite=${encodeURIComponent(inviteToken)}`
                  : "/login"
              }
              className="text-primary hover:text-primary/80"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
