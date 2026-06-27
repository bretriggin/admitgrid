export type ReferralType = "SNF" | "LTC";

export type ReviewStatus =
  | "Pending"
  | "Approved"
  | "Denied"
  | "Review"
  | "Hold"
  | "Uploaded"
  | "Needed"
  | "N/A";

export type Referral = {
  id: string;
  patient: string;
  type: ReferralType;
  source: string;
  clinical: ReviewStatus;
  highCostMeds: string;
  equipment: string;
  mds: string;
  medicalNecessity: ReviewStatus | "Yes";
  payer: string;
  benefits: string;
  authNumber: string;
  authDates: string;
  cwf: ReviewStatus;
  financialApproval: ReviewStatus;
  status: string;
};