"use client";

import Link from "next/link";
import { ActivityFeed } from "@/components/ActivityFeed";
import { RealtimeConnectionIndicator } from "@/components/RealtimeConnectionIndicator";
import { useAuth } from "@/components/AuthProvider";
import { SignOutButton } from "@/components/SignOutButton";

type AppHeaderProps = {
  activeNav?: "board" | "executive" | "administration";
};

const primaryLinkClassName =
  "rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800";

const secondaryLinkClassName =
  "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";

export function AppHeader({ activeNav = "board" }: AppHeaderProps) {
  const { profile } = useAuth();
  const showExecutiveNav = profile?.isExecutive === true;
  const showAdministrationNav = profile?.isSystemOwner === true;

  return (
    <header>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            SNF Admissions Command Center
          </p>
          <h1 className="text-4xl font-bold">AdmitGrid</h1>
          <p className="mt-2 text-slate-600">
            Intake, clinical approval, MDS, benefits, authorization, CWF, and financial clearance in
            one grid.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <RealtimeConnectionIndicator />
          {activeNav === "board" ? <ActivityFeed /> : null}
          {showAdministrationNav ? (
            <Link
              href="/administration"
              className={
                activeNav === "administration" ? primaryLinkClassName : secondaryLinkClassName
              }
            >
              Administration
            </Link>
          ) : null}
          {showExecutiveNav ? (
            <>
              {activeNav === "board" ? (
                <Link href="/executive" className={primaryLinkClassName}>
                  Executive Dashboard
                </Link>
              ) : activeNav === "executive" ? (
                <Link href="/" className={secondaryLinkClassName}>
                  AdmitGrid Board
                </Link>
              ) : (
                <>
                  <Link href="/" className={secondaryLinkClassName}>
                    AdmitGrid Board
                  </Link>
                  <Link href="/executive" className={secondaryLinkClassName}>
                    Executive Dashboard
                  </Link>
                </>
              )}
            </>
          ) : activeNav === "administration" ? (
            <Link href="/" className={secondaryLinkClassName}>
              AdmitGrid Board
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
