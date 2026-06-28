export const OPEN_REFERRAL_EVENT = "admitgrid-open-referral";

export function dispatchOpenReferral(referralId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(OPEN_REFERRAL_EVENT, {
      detail: { referralId },
    }),
  );
}
