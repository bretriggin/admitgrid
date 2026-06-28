import { getReferralStatusBadgeClassName } from "@/lib/referralStatusDisplay";

type ReferralStatusBadgeProps = {
  label: string;
};

export function ReferralStatusBadge({ label }: ReferralStatusBadgeProps) {
  const color = getReferralStatusBadgeClassName(label);

  return (
    <span
      className={`inline-flex w-36 items-center justify-center rounded-full px-3 py-1 text-center text-xs font-semibold ${color}`}
    >
      {label}
    </span>
  );
}
