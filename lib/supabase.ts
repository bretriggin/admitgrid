import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/** Browser Supabase client for client components. Use `getSupabaseClient()` for server-aware access. */
export const supabase = createBrowserSupabaseClient();
