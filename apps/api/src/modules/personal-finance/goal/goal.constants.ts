export const EMERGENCY_FUND_CATEGORY = "emergency";
export const EMERGENCY_FUND_SUBCATEGORY = "emergency_fund";
export const EMERGENCY_FUND_TITLE = "Emergency Fund";

export function emergencyFundTargetMonths(employmentType?: string): number {
  return employmentType === "Salaried" ? 6 : 12;
}

export function isEmergencyFundGoal(goal: {
  category?: string | null;
  subcategory?: string | null;
}): boolean {
  return (
    goal.category === EMERGENCY_FUND_CATEGORY ||
    goal.subcategory === EMERGENCY_FUND_SUBCATEGORY
  );
}
