"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkLoginAllowed } from "@/lib/auth/accessActions";
import {
  getAuthErrorMessage,
  logServerAuthException,
  logSupabaseAuthError,
} from "@/lib/auth/errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const primaryButtonClassName =
  "w-full rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        logSupabaseAuthError("LoginForm.signInWithPassword", signInError);
        setError(getAuthErrorMessage(signInError, "Unable to sign in. Check your email and password."));
        return;
      }

      console.info("[LoginForm] signInWithPassword succeeded:", {
        userId: signInData.user?.id,
        email: signInData.user?.email,
        sessionPresent: Boolean(signInData.session),
      });

      const accessCheck = await checkLoginAllowed();

      if (accessCheck.checkError) {
        setError(accessCheck.checkError);
        return;
      }

      if (!accessCheck.allowed) {
        await supabase.auth.signOut();
        setError(accessCheck.message ?? "Your account is not approved for AdmitGrid access.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (submitError) {
      logServerAuthException("LoginForm.handleSubmit", submitError);
      logSupabaseAuthError("LoginForm.handleSubmit", submitError);
      setError(
        getAuthErrorMessage(submitError, "Unable to sign in. Check your email and password."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-slate-600">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-slate-600">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
          />
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button type="submit" disabled={isSubmitting} className={primaryButtonClassName}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Need access?{" "}
        <Link href="/request-access" className="font-semibold text-blue-700 hover:text-blue-800">
          Submit an access request
        </Link>
      </p>
    </div>
  );
}
