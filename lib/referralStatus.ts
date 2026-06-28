import type { CurrentOwner, Referral, ReferralWorkflowStatus } from "@/types/referral";

function isEmpty(value: string): boolean {
  return !value?.trim();
}

function isHighCostMedsCompleted(value: string): boolean {
  return !isEmpty(value) && value !== "Pending DON";
}

function isEquipmentCompleted(value: string): boolean {
  return !isEmpty(value) && value !== "Pending DON";
}

function isMdsCompleted(value: string): boolean {
  return !isEmpty(value) && value !== "Pending MDS";
}

function isCaseManagerFieldCompleted(value: string): boolean {
  return !isEmpty(value) && value !== "Pending CM";
}

function isWaitingOnDon(referral: Referral): boolean {
  return (
    referral.clinical !== "Yes" ||
    !isHighCostMedsCompleted(referral.highCostMeds) ||
    !isEquipmentCompleted(referral.equipment)
  );
}

function isWaitingOnMds(referral: Referral): boolean {
  return !isMdsCompleted(referral.mds);
}

function isWaitingOnCaseManager(referral: Referral): boolean {
  return (
    !isCaseManagerFieldCompleted(referral.payer) ||
    !isCaseManagerFieldCompleted(referral.benefits) ||
    !isCaseManagerFieldCompleted(referral.authNumber) ||
    !isCaseManagerFieldCompleted(referral.authDates)
  );
}

function isWaitingOnBusinessOffice(referral: Referral): boolean {
  return referral.cwf !== "Yes" || referral.financialApproval !== "Yes";
}

function isNewReferralIntake(referral: Referral): boolean {
  return (
    referral.clinical === "Pending DON" &&
    referral.highCostMeds === "Pending DON" &&
    referral.equipment === "Pending DON"
  );
}

export function isReadyToAdmit(referral: Referral): boolean {
  return (
    referral.clinical === "Yes" &&
    isHighCostMedsCompleted(referral.highCostMeds) &&
    isEquipmentCompleted(referral.equipment) &&
    isMdsCompleted(referral.mds) &&
    isCaseManagerFieldCompleted(referral.payer) &&
    isCaseManagerFieldCompleted(referral.benefits) &&
    isCaseManagerFieldCompleted(referral.authNumber) &&
    isCaseManagerFieldCompleted(referral.authDates) &&
    referral.cwf === "Yes" &&
    referral.financialApproval === "Yes"
  );
}

export type ReferralWorkflow = {
  status: ReferralWorkflowStatus;
  currentOwner: CurrentOwner;
};

export function calculateReferralWorkflow(referral: Referral): ReferralWorkflow {
  if (referral.status === "Completed") {
    return { status: "Completed", currentOwner: "None" };
  }

  if (isReadyToAdmit(referral)) {
    return { status: "Ready to Admit", currentOwner: "Administrator" };
  }

  if (isNewReferralIntake(referral)) {
    return { status: "New Referral", currentOwner: "Marketer" };
  }

  if (isWaitingOnDon(referral)) {
    return { status: "In Review", currentOwner: "DON" };
  }

  if (isWaitingOnMds(referral)) {
    return { status: "In Review", currentOwner: "MDS" };
  }

  if (isWaitingOnCaseManager(referral)) {
    return { status: "In Review", currentOwner: "Case Manager" };
  }

  if (isWaitingOnBusinessOffice(referral)) {
    return { status: "In Review", currentOwner: "Business Office" };
  }

  return { status: "In Review", currentOwner: "DON" };
}

export function getReferralWorkflowUpdate(referral: Referral): ReferralWorkflow {
  return calculateReferralWorkflow(referral);
}
