import Link from "next/link";

export const dynamic = "force-static";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">AdmitGrid</p>
        <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          The page you requested does not exist or may have moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Back to AdmitGrid
        </Link>
      </div>
    </main>
  );
}
