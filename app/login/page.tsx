import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          SNF Admissions Command Center
        </p>
        <h1 className="mt-2 text-3xl font-bold">Sign in to AdmitGrid</h1>
        <p className="mt-2 text-sm text-slate-500">
          Only approved users can sign in. On a new system, the first authenticated user becomes the
          initial executive. Everyone else must submit an access request first.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
