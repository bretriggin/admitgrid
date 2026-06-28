export type ReferralActivityLogEntry = {
  id: string;
  referralId: string;
  action: string;
  details: string;
  createdBy?: string;
  createdAt: string;
};

export type ReferralActivityAction =
  | "Referral created"
  | "Document uploaded"
  | "DON review saved"
  | "MDS review saved"
  | "Case Manager review saved"
  | "BOM review saved"
  | "Referral completed";
