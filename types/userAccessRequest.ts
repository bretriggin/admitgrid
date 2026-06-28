export const ACCESS_REQUEST_STATUSES = ["Pending", "Approved", "Rejected"] as const;

export type AccessRequestStatus = (typeof ACCESS_REQUEST_STATUSES)[number];

export type UserAccessRequest = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  facility: string;
  jobTitle: string;
  requestedAt: string;
  status: AccessRequestStatus;
  authUserId?: string | null;
  reviewedAt?: string | null;
  reviewedByProfileId?: string | null;
};

export type AccessRequestInput = {
  firstName: string;
  lastName: string;
  email: string;
  facility: string;
  jobTitle: string;
};

export type ApproveAccessRequestInput = {
  requestId: string;
  facility: string;
  roles: string[];
  isExecutive: boolean;
  initialPassword: string;
};

export type UpdateManagedUserInput = {
  profileId: string;
  facility: string;
  roles: string[];
  isExecutive: boolean;
};
