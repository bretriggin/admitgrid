import type { AssignedTeam } from "@/types/team";

export const USER_ROLES = [
  "Marketer",
  "DON",
  "MDS",
  "Case Manager",
  "Business Office",
  "Administrator",
  "Executive",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const APPROVAL_STATUSES = ["Pending", "Approved", "Rejected"] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export type UserProfile = {
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
  roles: UserRole[];
};

export type ManagedUserProfile = UserProfile & {
  accessRequestId?: string | null;
  teams: AssignedTeam[];
};

export function isApprovedActiveProfile(
  profile: Pick<UserProfile, "approvalStatus" | "isActive">,
): boolean {
  return profile.approvalStatus === "Approved" && profile.isActive;
}
