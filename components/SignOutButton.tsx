"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const buttonClassName =
  "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";

export function SignOutButton() {
  const router = useRouter();
  const { displayName } = useAuth();

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-slate-600 sm:inline">{displayName}</span>
      <button type="button" onClick={() => void handleSignOut()} className={buttonClassName}>
        Sign out
      </button>
    </div>
  );
}
