import type { BreakdownItem } from "@/lib/executiveDashboardMetrics";

type BreakdownPanelProps = {
  title: string;
  description: string;
  items: BreakdownItem[];
  emptyMessage?: string;
  barClassName?: string;
};

export function BreakdownPanel({
  title,
  description,
  items,
  emptyMessage = "No data available yet.",
  barClassName = "bg-blue-700",
}: BreakdownPanelProps) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="border-b p-5">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {items.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-4">Label</th>
                <th className="p-4">Count</th>
                <th className="p-4">Share</th>
                <th className="p-4">Chart</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.label} className="border-t border-slate-200">
                  <td className="p-4 font-medium text-slate-900">{item.label}</td>
                  <td className="p-4 text-slate-700">{item.count}</td>
                  <td className="p-4 text-slate-700">{item.percentage}%</td>
                  <td className="p-4">
                    <div className="h-2 w-full max-w-[220px] rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full ${barClassName}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
