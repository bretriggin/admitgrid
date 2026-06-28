import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** True when we should use the regular authenticated Supabase client instead of the service role. */
export function shouldUseRegularSupabaseClient(): boolean {
  return process.env.NODE_ENV === "development" || !hasServiceRoleKey();
}

/**
 * Service-role client for production-only admin operations (auth user creation, etc.).
 * Returns null during local development or when SUPABASE_SERVICE_ROLE_KEY is not set.
 */
export function createAdminSupabaseClient(): SupabaseClient | null {
  if (shouldUseRegularSupabaseClient()) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

export async function isBrandNewSystem(supabase: SupabaseClient): Promise<boolean> {
  const { count, error } = await supabase
    .from("user_profiles")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(`Failed to check user profiles: ${error.message}`);
  }

  return (count ?? 0) === 0;
}
