import type { Facility } from "@/types/facility";

export type FacilityInsertDebug = {
  serverActionCalled: boolean;
  steps: string[];
  insertStatement: string;
  insertPayload: { name: string } | null;
  selectColumns: string;
  profileId: string | null;
  supabaseData: unknown;
  supabaseError: unknown;
};

export type CreateFacilityResult = {
  success: boolean;
  facility?: Facility;
  error?: string;
  debug: FacilityInsertDebug;
};
