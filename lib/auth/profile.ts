import type { SupabaseClient } from "@supabase/supabase-js";
import { isBenignAuthError } from "@/lib/auth/errors";
import { resolveUserProfileForAuthUser } from "@/lib/auth/bootstrap";
import type { ApprovalStatus, UserProfile, UserRole } from "@/types/userProfile";
import { isApprovedActiveProfile, USER_ROLES } from "@/types/userProfile";

const profileSelect =
  "id, authUserId, firstName, lastName, email, facility, jobTitle, approvalStatus, isActive, isExecutive, isSystemOwner, createdAt";

type ProfileRow = {
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  facility: string;
  jobTitle: string;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  isExecutive: boolean;
  isSystemOwner: boolean;
  createdAt: string;
};

export function getUserDisplayName(
  profile: Pick<UserProfile, "firstName" | "lastName" | "email">,
): string {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  return profile.email || "User";
}

function mapProfile(row: ProfileRow, roles: UserRole[]): UserProfile {
  return {
    id: row.id,
    authUserId: row.authUserId,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    facility: row.facility,
    jobTitle: row.jobTitle,
    approvalStatus: row.approvalStatus,
    isActive: row.isActive,
    isExecutive: row.isExecutive,
    isSystemOwner: row.isSystemOwner,
    createdAt: row.createdAt,
    roles,
  };
}


async function fetchRolesForProfileIds(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<Map<string, UserRole[]>> {
  const rolesByProfileId = new Map<string, UserRole[]>();

  if (profileIds.length === 0) {
    return rolesByProfileId;
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("userProfileId, role")
    .in("userProfileId", profileIds);

  if (error) {
    throw new Error(`Failed to fetch user roles: ${error.message}`);
  }

  for (const row of data ?? []) {
    const profileId = row.userProfileId as string;
    const role = row.role as string;

    if (!USER_ROLES.includes(role as UserRole)) {
      continue;
    }

    const existing = rolesByProfileId.get(profileId) ?? [];
    existing.push(role as UserRole);
    rolesByProfileId.set(profileId, existing);
  }

  return rolesByProfileId;
}

async function fetchRolesForProfile(
  supabase: SupabaseClient,
  profileId: string,
): Promise<UserRole[]> {
  const rolesByProfileId = await fetchRolesForProfileIds(supabase, [profileId]);
  return rolesByProfileId.get(profileId) ?? [];
}

export async function fetchUserProfileByAuthUserId(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(profileSelect)
    .eq("authUserId", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as ProfileRow;
  const roles = await fetchRolesForProfile(supabase, row.id);

  return mapProfile(row, roles);
}

export async function fetchProfileGateInfo(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<
  Pick<UserProfile, "approvalStatus" | "isActive" | "isExecutive" | "isSystemOwner"> | null
> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("approvalStatus, isActive, isExecutive, isSystemOwner")
    .eq("authUserId", authUserId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Pick<
    UserProfile,
    "approvalStatus" | "isActive" | "isExecutive" | "isSystemOwner"
  >;
}

/** @deprecated Use fetchProfileGateInfo */
export async function fetchProfileAccessStatus(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<Pick<UserProfile, "approvalStatus" | "isActive"> | null> {
  const gate = await fetchProfileGateInfo(supabase, authUserId);

  if (!gate) {
    return null;
  }

  return {
    approvalStatus: gate.approvalStatus,
    isActive: gate.isActive,
  };
}

export async function getAuthenticatedUserProfile(
  supabase: SupabaseClient,
): Promise<UserProfile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    if (isBenignAuthError(authError)) {
      return null;
    }

    console.error("Auth error while loading user profile:", authError.message);
    return null;
  }

  if (!user) {
    return null;
  }

  const profile = await resolveUserProfileForAuthUser(supabase, user);

  if (!profile || !isApprovedActiveProfile(profile)) {
    return null;
  }

  return profile;
}

export async function getAuthenticatedUserProfileAnyStatus(
  supabase: SupabaseClient,
): Promise<UserProfile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  return resolveUserProfileForAuthUser(supabase, user);
}

export async function fetchAllUserProfiles(
  supabase: SupabaseClient,
): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(profileSelect)
    .order("createdAt", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user profiles: ${error.message}`);
  }

  const rows = (data ?? []) as ProfileRow[];

  if (rows.length === 0) {
    return [];
  }

  const rolesByProfileId = await fetchRolesForProfileIds(
    supabase,
    rows.map((row) => row.id),
  );

  return rows.map((row) => mapProfile(row, rolesByProfileId.get(row.id) ?? []));
}
