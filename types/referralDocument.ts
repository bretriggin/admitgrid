export type ReferralDocumentType =
  | "Clinical Packet"
  | "Updated Clinical"
  | "Facesheet"
  | "Insurance Cards"
  | "ID Cards"
  | "MAR"
  | "Medication List"
  | "Therapy Notes"
  | "H&P"
  | "Physician Orders"
  | "Labs"
  | "Authorization"
  | "CWF"
  | "Financial"
  | "Other";

export const REFERRAL_DOCUMENT_TYPES: ReferralDocumentType[] = [
  "Clinical Packet",
  "Updated Clinical",
  "Facesheet",
  "Insurance Cards",
  "ID Cards",
  "MAR",
  "Medication List",
  "Therapy Notes",
  "H&P",
  "Physician Orders",
  "Labs",
  "Authorization",
  "CWF",
  "Financial",
  "Other",
];

export type ReferralDocument = {
  id: string;
  referralId: string;
  fileName: string;
  filePath: string;
  documentType: ReferralDocumentType | string;
  uploadedAt: string;
  uploadedBy: string;
};
