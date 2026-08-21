export const EMERGENCY_FUND_CATEGORY = "emergency";
export const EMERGENCY_FUND_SUBCATEGORY = "emergency_fund";
export const EMERGENCY_FUND_TITLE = "Emergency Fund";

export const FIRE_GOAL_CATEGORY = "retirement";
export const FIRE_GOAL_TYPES = ["lean_fire", "fat_fire", "coast_fire"] as const;
export type FireGoalType = (typeof FIRE_GOAL_TYPES)[number];
export const FIRE_GOAL_SUBCATEGORIES = [
  ...FIRE_GOAL_TYPES,
  "full_fire",
  "wealth_fire",
] as const;

export function isFireGoal(goal: {
  category?: string | null;
  subcategory?: string | null;
}): boolean {
  return (
    goal.category === FIRE_GOAL_CATEGORY &&
    FIRE_GOAL_SUBCATEGORIES.includes(
      goal.subcategory as (typeof FIRE_GOAL_SUBCATEGORIES)[number],
    )
  );
}

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
