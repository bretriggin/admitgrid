type DashboardCardProps = {
  label: string;
  value: string;
  tone?: "default" | "green" | "yellow" | "red" | "blue";
};

const tones = {
  default: "text-slate-900",
  green: "text-green-700",
  yellow: "text-yellow-600",
  red: "text-red-700",
  blue: "text-blue-700",
};

export default function DashboardCard({
  label,
  value,
  tone = "default",
}: DashboardCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}