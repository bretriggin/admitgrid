export type SlaDepartment = "DON" | "MDS" | "Case Manager" | "Business Office";

export type SlaStatus = "green" | "yellow" | "red" | "none";

export type SlaConfig = {
  departmentGoalsMinutes: Record<SlaDepartment, number>;
  statusThresholdsMinutes: {
    greenMax: number;
    yellowMax: number;
  };
};

/**
 * Default SLA configuration.
 * Update these values when wiring an Administration settings page.
 */
export const DEFAULT_SLA_CONFIG: SlaConfig = {
  departmentGoalsMinutes: {
    DON: 15,
    MDS: 15,
    "Case Manager": 15,
    "Business Office": 15,
  },
  statusThresholdsMinutes: {
    greenMax: 15,
    yellowMax: 30,
  },
};

export function getSlaStatus(
  actualMinutes: number | null,
  config: SlaConfig = DEFAULT_SLA_CONFIG,
): SlaStatus {
  if (actualMinutes === null) {
    return "none";
  }

  if (actualMinutes <= config.statusThresholdsMinutes.greenMax) {
    return "green";
  }

  if (actualMinutes <= config.statusThresholdsMinutes.yellowMax) {
    return "yellow";
  }

  return "red";
}

export function formatSlaGoal(minutes: number): string {
  return `${minutes} min`;
}

export function getSlaStatusLabel(status: SlaStatus): string {
  switch (status) {
    case "green":
      return "On Track";
    case "yellow":
      return "At Risk";
    case "red":
      return "Over SLA";
    default:
      return "No Data";
  }
}

export const SLA_DEPARTMENTS: SlaDepartment[] = [
  "DON",
  "MDS",
  "Case Manager",
  "Business Office",
];
