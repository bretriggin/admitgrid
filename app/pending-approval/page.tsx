import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { getAuthenticatedUserProfileAnyStatus } from "@/lib/auth/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isApprovedActiveProfile } from "@/types/userProfile";

export const dynamic = "force-dynamic";

function getStatusMessage(
  approvalStatus: string,
  isActive: boolean,
): { title: string; body: string; tone: "yellow" | "red" | "slate" } {
  if (approvalStatus === "Pending") {
    return {
      title: "Access request pending",
      body: "Your request has been submitted and is waiting for executive approval. You cannot access AdmitGrid until it is approved.",
      tone: "yellow",
    };
  }

  if (approvalStatus === "Rejected") {
    return {
      title: "Access request rejected",
      body: "An executive rejected your access request. Contact your administrator if you believe this was a mistake.",
      tone: "red",
    };
  }

  if (approvalStatus === "Approved" && !isActive) {
    return {
      title: "Account inactive",
      body: "Your account was approved but is currently inactive. Contact an executive to restore access.",
      tone: "slate",
    };
  }

  return {
    title: "Access not available",
    body: "Your account is not approved for AdmitGrid access.",
    tone: "slate",
  };
}

export default async function PendingApprovalPage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getAuthenticatedUserProfileAnyStatus(supabase);

  if (profile && isApprovedActiveProfile(profile)) {
    redirect("/");
  }

  const status = profile
    ? getStatusMessage(profile.approvalStatus, profile.isActive)
    : {
        title: "Profile not found",
        body: "Sign in credentials exist, but no AdmitGrid profile was found. Submit an access request to continue.",
        tone: "slate" as const,
      };

  const toneClasses = {
    yellow: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-red-200 bg-red-50 text-red-900",
    slate: "border-slate-200 bg-slate-50 text-slate-900",
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">AdmitGrid</p>
        <h1 className="mt-2 text-3xl font-bold">{status.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{status.body}</p>

        {profile ? (
          <div className={`mt-6 rounded-xl border p-4 ${toneClasses[status.tone]}`}>
            <p className="text-sm font-semibold">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="mt-1 text-sm">{profile.email}</p>
            <p className="mt-2 text-sm">
              Facility: {profile.facility || "—"} · Job title: {profile.jobTitle || "—"}
            </p>
            <p className="mt-2 text-sm">Status: {profile.approvalStatus}</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <SignOutButton />
          {!profile ? (
            <Link
              href="/request-access"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Submit access request
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
