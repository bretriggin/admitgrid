export const TEAM_TYPES = [
  "Admissions",
  "Clinical/DON",
  "MDS",
  "Case Management",
  "Business Office",
  "Administration",
] as const;

export type TeamType = (typeof TEAM_TYPES)[number];

export type Team = {
  id: string;
  name: string;
  facilityId: string;
  facilityName: string;
  teamType: TeamType;
  createdAt: string;
};

export type AssignedTeam = Pick<Team, "id" | "name" | "facilityName" | "teamType">;

export function isTeamType(value: string): value is TeamType {
  return TEAM_TYPES.includes(value as TeamType);
}
