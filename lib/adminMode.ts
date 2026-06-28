/**
 * Temporary executive visibility gate.
 * Set NEXT_PUBLIC_ADMIN_MODE=true to show the Executive Dashboard.
 * Facility users should leave this unset so they only see the main AdmitGrid board.
 */
export function isAdminMode(): boolean {
  return process.env.NEXT_PUBLIC_ADMIN_MODE === "true";
}
