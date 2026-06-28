import type { SupabaseClient } from "@supabase/supabase-js";
import { assertMutableManagedProfile } from "@/lib/auth/profileGuards";
import type { Facility } from "@/types/facility";
import type { AssignedTeam, Team, TeamType } from "@/types/team";
import { isTeamType } from "@/types/team";

type FacilityRow = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
};

type TeamRow = {
  id: string;
  name: string;
  facilityId: string;
  teamType: string;
  createdAt: string;
};

type TeamAssignmentRow = {
  userProfileId: string;
  teamId: string;
};

async function fetchFacilityNameMap(
  supabase: SupabaseClient,
  facilityIds: string[],
): Promise<Map<string, string>> {
  const nameById = new Map<string, string>();

  if (facilityIds.length === 0) {
    return nameById;
  }

  const { data, error } = await supabase
    .from("facilities")
    .select("id, name")
    .in("id", facilityIds);

  if (error) {
    throw new Error(`Failed to fetch facility names: ${error.message}`);
  }

  for (const row of data ?? []) {
    nameById.set(row.id as string, row.name as string);
  }

  return nameById;
}

function mapFacility(row: FacilityRow): Facility {
  return {
    id: row.id,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}

function mapTeam(row: TeamRow, facilityName: string): Team {
  const teamType = row.teamType;

  if (!isTeamType(teamType)) {
    throw new Error(`Unknown team type: ${teamType}`);
  }

  return {
    id: row.id,
    name: row.name,
    facilityId: row.facilityId,
    facilityName,
    teamType,
    createdAt: row.createdAt,
  };
}

export async function fetchAllFacilities(supabase: SupabaseClient): Promise<Facility[]> {
  const { data, error } = await supabase
    .from("facilities")
    .select('id, name, "isActive", "createdAt"')
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch facilities: ${error.message}`);
  }

  return (data ?? []).map((row) => mapFacility(row as FacilityRow));
}

export async function fetchAllTeams(supabase: SupabaseClient): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select('id, name, "facilityId", "teamType", "createdAt"')
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch teams: ${error.message}`);
  }

  const rows = (data ?? []) as TeamRow[];

  if (rows.length === 0) {
    return [];
  }

  const facilityNames = await fetchFacilityNameMap(
    supabase,
    [...new Set(rows.map((row) => row.facilityId))],
  );

  return rows.map((row) => mapTeam(row, facilityNames.get(row.facilityId) ?? ""));
}

export async function fetchTeamAssignmentsForProfileIds(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<Map<string, AssignedTeam[]>> {
  const assignmentsByProfileId = new Map<string, AssignedTeam[]>();

  if (profileIds.length === 0) {
    return assignmentsByProfileId;
  }

  const { data, error } = await supabase
    .from("user_team_assignments")
    .select('"userProfileId", "teamId"')
    .in("userProfileId", profileIds);

  if (error) {
    throw new Error(`Failed to fetch team assignments: ${error.message}`);
  }

  const assignmentRows = (data ?? []) as TeamAssignmentRow[];

  if (assignmentRows.length === 0) {
    return assignmentsByProfileId;
  }

  const teamIds = [...new Set(assignmentRows.map((row) => row.teamId))];
  const { data: teamRows, error: teamError } = await supabase
    .from("teams")
    .select('id, name, "facilityId", "teamType"')
    .in("id", teamIds);

  if (teamError) {
    throw new Error(`Failed to fetch assigned teams: ${teamError.message}`);
  }

  const teams = (teamRows ?? []) as Omit<TeamRow, "createdAt">[];
  const facilityNames = await fetchFacilityNameMap(
    supabase,
    [...new Set(teams.map((team) => team.facilityId))],
  );

  const teamById = new Map(
    teams.map((team) => {
      const teamType = team.teamType;

      return [
        team.id,
        {
          id: team.id,
          name: team.name,
          facilityName: facilityNames.get(team.facilityId) ?? "",
          teamType: isTeamType(teamType) ? (teamType as TeamType) : ("Admissions" as TeamType),
        },
      ] as const;
    }),
  );

  for (const row of assignmentRows) {
    const team = teamById.get(row.teamId);

    if (!team || !isTeamType(team.teamType)) {
      continue;
    }

    const existing = assignmentsByProfileId.get(row.userProfileId) ?? [];
    existing.push(team);
    assignmentsByProfileId.set(row.userProfileId, existing);
  }

  return assignmentsByProfileId;
}

export async function replaceUserTeamAssignments(
  supabase: SupabaseClient,
  profileId: string,
  teamIds: string[],
): Promise<void> {
  const guard = await assertMutableManagedProfile(supabase, profileId);

  if (!guard.ok) {
    throw new Error(guard.error);
  }

  const uniqueTeamIds = [...new Set(teamIds)];

  await supabase.from("user_team_assignments").delete().eq("userProfileId", profileId);

  if (uniqueTeamIds.length === 0) {
    return;
  }

  const { error } = await supabase.from("user_team_assignments").insert(
    uniqueTeamIds.map((teamId) => ({
      userProfileId: profileId,
      teamId,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}
