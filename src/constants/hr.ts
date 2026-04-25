export const SYSTEM_MODULE_OPTIONS = [
  "products",
  "inventory",
  "warehouses",
  "customers",
  "vendors",
  "purchasing",
  "sales",
  "hr",
  "reports",
  "udhaar"
] as const;

export const EMPLOYMENT_TYPE_OPTIONS = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
  "TEMPORARY",
  "FREELANCE"
] as const;

export const SALARY_TYPE_OPTIONS = ["MONTHLY", "DAILY", "HOURLY"] as const;

export const LEAVE_TYPE_OPTIONS = [
  "ANNUAL",
  "CASUAL",
  "SICK",
  "UNPAID",
  "MATERNITY",
  "PATERNITY",
  "BEREAVEMENT",
  "COMP_OFF",
  "OTHER"
] as const;

export const LEAVE_DURATION_OPTIONS = ["FULL_DAY", "HALF_DAY_AM", "HALF_DAY_PM"] as const;

export const LEAVE_STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;

export function humanizeToken(value?: string | null) {
  if (!value) return "-";
  return String(value)
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function labelizeModule(value: string) {
  return value === "hr" ? "HR" : humanizeToken(value);
}
