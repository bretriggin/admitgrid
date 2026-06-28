export const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

export const primaryButtonClassName =
  "rounded-xl bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60";

export const secondaryButtonClassName =
  "rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60";

export const dangerButtonClassName =
  "rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60";

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "slate" | "amber" | "blue" | "red";
}) {
  const tones = {
    green: "bg-green-50 text-green-800 ring-green-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    blue: "bg-blue-50 text-blue-800 ring-blue-200",
    red: "bg-red-50 text-red-800 ring-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

export function AdminSection({
  title,
  description,
  count,
  children,
}: {
  title: string;
  description: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            {count}
          </span>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function AdminCard({
  title,
  subtitle,
  badge,
  fields,
  actions,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  fields: { label: string; value: React.ReactNode }[];
  actions?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold text-slate-900">{title}</h3>
          {badge}
        </div>
        {subtitle ? <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p> : null}
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {field.label}
            </dt>
            <dd className="mt-1 text-sm text-slate-900">{field.value}</dd>
          </div>
        ))}
      </dl>

      {actions ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">{actions}</div>
      ) : null}
    </article>
  );
}

export function AdminFeedback({
  message,
  error,
}: {
  message: string | null;
  error: string | null;
}) {
  return (
    <>
      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
    </>
  );
}
