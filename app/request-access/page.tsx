import Link from "next/link";
import { AccessRequestForm } from "@/components/AccessRequestForm";

export const dynamic = "force-dynamic";

export default function RequestAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          SNF Admissions Command Center
        </p>
        <h1 className="mt-2 text-3xl font-bold">Request AdmitGrid Access</h1>
        <p className="mt-2 text-sm text-slate-500">
          Submit your details for executive review. The first user to sign in on a new system
          becomes the initial executive automatically.
        </p>

        <div className="mt-6">
          <AccessRequestForm />
        </div>
      </div>
    </main>
  );
}
