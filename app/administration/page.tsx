import { AppHeader } from "@/components/AppHeader";
import { AdministrationPanel } from "@/components/AdministrationPanel";
import { FacilitiesSection } from "@/components/admin/FacilitiesSection";
import { TeamsSection } from "@/components/admin/TeamsSection";
import { fetchAdministrationData } from "@/lib/auth/userManagement";
import { requireSystemOwnerUserProfile } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdministrationPage() {
  await requireSystemOwnerUserProfile();

  const data = await fetchAdministrationData();

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <AppHeader activeNav="administration" />
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              System Owner
            </p>
            <h2 className="text-xl font-bold">Administration</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage facilities, teams, access requests, and users across AdmitGrid.
            </p>
          </div>
          <div className="space-y-8 p-5">
            <FacilitiesSection facilities={data.facilities} />
            <TeamsSection teams={data.teams} facilities={data.facilities} />
            <AdministrationPanel
              pendingRequests={data.pendingRequests}
              activeUsers={data.activeUsers}
              inactiveUsers={data.inactiveUsers}
              teams={data.teams}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
