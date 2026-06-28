import type { Facility } from "@/types/facility";
import type { Team } from "@/types/team";
import type { UserAccessRequest } from "@/types/userAccessRequest";
import type { ManagedUserProfile, UserProfile } from "@/types/userProfile";
import { isApprovedActiveProfile } from "@/types/userProfile";
import { fetchAllUserProfiles } from "@/lib/auth/profile";
import {
  fetchAllFacilities,
  fetchAllTeams,
  fetchTeamAssignmentsForProfileIds,
} from "@/lib/administration/queries";
import { getDataSupabaseClient } from "@/lib/supabase/dataClient";

type AccessRequestRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  facility: string;
  jobTitle: string;
  requestedAt: string;
  status: UserAccessRequest["status"];
  authUserId: string | null;
  reviewedAt: string | null;
  reviewedByProfileId: string | null;
};

function mapAccessRequest(row: AccessRequestRow): UserAccessRequest {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    facility: row.facility,
    jobTitle: row.jobTitle,
    requestedAt: row.requestedAt,
    status: row.status,
    authUserId: row.authUserId,
    reviewedAt: row.reviewedAt,
    reviewedByProfileId: row.reviewedByProfileId,
  };
}

export async function fetchPendingAccessRequests(): Promise<UserAccessRequest[]> {
  const supabase = await getDataSupabaseClient();
  const { data, error } = await supabase
    .from("user_access_requests")
    .select(
      "id, firstName, lastName, email, facility, jobTitle, requestedAt, status, authUserId, reviewedAt, reviewedByProfileId",
    )
    .eq("status", "Pending")
    .order("requestedAt", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch pending access requests: ${error.message}`);
  }

  return (data ?? []).map((row) => mapAccessRequest(row as AccessRequestRow));
}

export type UserManagementData = {
  pendingRequests: UserAccessRequest[];
  activeUsers: ManagedUserProfile[];
  inactiveUsers: ManagedUserProfile[];
};

export type AdministrationData = UserManagementData & {
  facilities: Facility[];
  teams: Team[];
};

async function attachTeamsToProfiles(profiles: UserProfile[]): Promise<ManagedUserProfile[]> {
  if (profiles.length === 0) {
    return [];
  }

  const supabase = await getDataSupabaseClient();
  const assignmentsByProfileId = await fetchTeamAssignmentsForProfileIds(
    supabase,
    profiles.map((profile) => profile.id),
  );

  return profiles.map((profile) => ({
    ...profile,
    teams: assignmentsByProfileId.get(profile.id) ?? [],
  }));
}

export async function fetchUserManagementData(): Promise<UserManagementData> {
  const data = await fetchAdministrationData();

  return {
    pendingRequests: data.pendingRequests,
    activeUsers: data.activeUsers,
    inactiveUsers: data.inactiveUsers,
  };
}

export async function fetchAdministrationData(): Promise<AdministrationData> {
  const supabase = await getDataSupabaseClient();
  const [pendingRequests, profiles, facilities, teams] = await Promise.all([
    fetchPendingAccessRequests(),
    fetchAllUserProfiles(supabase),
    fetchAllFacilities(supabase),
    fetchAllTeams(supabase),
  ]);

  const managedProfiles = await attachTeamsToProfiles(profiles);
  const activeUsers = managedProfiles.filter(isApprovedActiveProfile);
  const inactiveUsers = managedProfiles.filter((profile) => !isApprovedActiveProfile(profile));

  return {
    pendingRequests,
    activeUsers,
    inactiveUsers,
    facilities,
    teams,
  };
}

export function getLoginBlockMessage(
  profile: UserProfile | null,
  pendingAccessRequest = false,
): string | null {
  if (!profile) {
    if (pendingAccessRequest) {
      return "Your access request is pending executive approval.";
    }

    return "No approved AdmitGrid profile found. Submit an access request and wait for executive approval.";
  }

  if (profile.approvalStatus === "Pending") {
    return "Your access request is pending executive approval.";
  }

  if (profile.approvalStatus === "Rejected") {
    return "Your access request was rejected. Contact your administrator for help.";
  }

  if (profile.approvalStatus === "Approved" && !profile.isActive) {
    return "Your account is inactive. Contact your administrator to restore access.";
  }

  return null;
}

export async function hasPendingAccessRequestForEmail(email: string): Promise<boolean> {
  const supabase = await getDataSupabaseClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from("user_access_requests")
    .select("id")
    .eq("email", normalizedEmail)
    .eq("status", "Pending")
    .maybeSingle();

  if (error) {
    console.error("Error checking pending access request:", error.message);
    return false;
  }

  return Boolean(data);
}
