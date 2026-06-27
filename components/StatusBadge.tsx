type StatusBadgeProps = {
  value: string;
};

export default function StatusBadge({ value }: StatusBadgeProps) {
  let color = "bg-gray-100 text-gray-700";

  if (
    value === "Approved" ||
    value === "Yes" ||
    value === "Uploaded" ||
    value === "Ready"
  ) {
    color = "bg-green-100 text-green-800";
  } else if (
    value === "Pending" ||
    value === "Review" ||
    value === "Submitted"
  ) {
    color = "bg-yellow-100 text-yellow-800";
  } else if (
    value === "Denied" ||
    value === "Hold" ||
    value === "Needed"
  ) {
    color = "bg-red-100 text-red-800";
  } else if (value === "SNF") {
    color = "bg-blue-100 text-blue-800";
  } else if (value === "LTC") {
    color = "bg-purple-100 text-purple-800";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${color}`}
    >
      {value}
    </span>
  );
}