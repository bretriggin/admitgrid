import type { ReferralDocument } from "@/types/referralDocument";

export type ReferralType = "SNF" | "LTC" | "Respite" | "Hospice";

export type ClinicalOption = "Yes" | "No" | "Pending More Info";

export type MedicalNecessityOption = "Yes" | "No" | "Pending More Info" | "N/A";

export type CwfOption = "Yes" | "No" | "Pending More Info" | "N/A";

export type FinancialApprovalOption = "Yes" | "No" | "Pending More Info";

export type PayerOption =
  | "Traditional Medicare"
  | "UHC"
  | "WellMed"
  | "Humana"
  | "Aetna"
  | "BCBS"
  | "Cigna"
  | "Molina"
  | "Superior"
  | "MCD"
  | "MCD Pending"
  | "Private Pay"
  | "Hospice"
  | "Other";

export type ReferralOutcome =
  | "Admitted"
  | "Clinical Denied"
  | "Financial Denied"
  | "Chose Another Facility"
  | "Hospital Discharged Home"
  | "Family Declined"
  | "Hospice"
  | "Expired"
  | "Duplicate Referral"
  | "Other";

export type ReferralWorkflowStatus =
  | "New Referral"
  | "In Review"
  | "Ready to Admit"
  | "Completed";

export type CurrentOwner =
  | "Marketer"
  | "DON"
  | "MDS"
  | "Case Manager"
  | "Business Office"
  | "Administrator"
  | "None";

export type ClinicalDenialReason =
  | "IV Antibiotics"
  | "Ventilator"
  | "Dialysis"
  | "Behavioral"
  | "Isolation"
  | "Bariatric"
  | "High Cost Medication"
  | "No Appropriate Bed"
  | "Staffing"
  | "Physician Declined"
  | "Other";

export type Referral = {
  id?: string;
  patient: string;
  type: ReferralType;
  source: string;
  clinical: string;
  clinicalDenialReason?: ClinicalDenialReason | string;
  clinicalDenialNotes?: string;
  highCostMeds: string;
  equipment: string;
  mds: string;
  medicalNecessity: string;
  payer: string;
  benefits: string;
  authNumber: string;
  authDates: string;
  cwf: string;
  financialApproval: string;
  status: string;
  currentOwner?: CurrentOwner | string;
  outcome?: ReferralOutcome | string;
  completedDate?: string;
  created_at?: string;
  marketerNotes?: string;
  referralPriority?: string;
  referralDate?: string;
  hospital?: string;
  referringCaseManager?: string;
  referringPhysician?: string;
  documents?: ReferralDocument[];
};
