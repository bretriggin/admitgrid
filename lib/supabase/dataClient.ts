import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient, shouldUseRegularSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Primary data client for server actions and route handlers.
 * Uses the authenticated server client during local development.
 */
export async function getDataSupabaseClient(): Promise<SupabaseClient> {
  return createServerSupabaseClient();
}

/**
 * Service-role client when configured in non-development environments.
 * Returns null during local development or when the service role key is missing.
 */
export function getAdminSupabaseClientIfAvailable(): SupabaseClient | null {
  if (shouldUseRegularSupabaseClient()) {
    return null;
  }

  return createAdminSupabaseClient();
}

/** Prefer service role for auth admin APIs; fall back to null in development. */
export async function getSupabaseClientForMutation(): Promise<SupabaseClient> {
  const admin = getAdminSupabaseClientIfAvailable();
  return admin ?? (await getDataSupabaseClient());
}
