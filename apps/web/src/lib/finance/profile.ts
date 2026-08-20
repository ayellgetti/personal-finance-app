import { Profile } from "@/types/finance";

export type AccountIdentity = {
  name: string;
  dob: string;
  email?: string;
};

const PROFILE_EXTRAS: (keyof Profile)[] = [
  "emergencyFund",
  "monthlyEssentialExpenses",
  "liquidAssets",
  "emergencyMonthlyContribution",
  "dailyBudget",
];

export function ageFromDob(dob: string | Date | null | undefined): number {
  if (!dob) return 0;
  const birth = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function accountName(user: { firstName?: string; lastName?: string; name?: string } | null | undefined): string {
  if (!user) return "";
  if (user.name?.trim()) return user.name.trim();
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
}

export function toAccountIdentity(user: {
  firstName?: string;
  lastName?: string;
  name?: string;
  dob: string;
  email?: string;
}): AccountIdentity {
  return {
    name: accountName(user),
    dob: user.dob,
    email: user.email,
  };
}

export function defaultProfile(account?: AccountIdentity | null): Profile {
  return {
    name: account?.name ?? "",
    age: ageFromDob(account?.dob),
    retirementAge: 60,
    currency: "₹",
    inflationRate: 6,
    emergencyFund: 0,
    dependents: 0,
    employmentType: "Salaried",
    monthlyEssentialExpenses: 0,
    liquidAssets: 0,
    emergencyMonthlyContribution: 0,
    dailyBudget: 0,
  };
}

export function pickProfileExtras(profile?: Partial<Profile> | null): Partial<Profile> {
  if (!profile) return {};
  const extras: Partial<Profile> = {};
  for (const key of PROFILE_EXTRAS) {
    if (profile[key] !== undefined) {
      (extras as Record<string, unknown>)[key] = profile[key];
    }
  }
  return extras;
}

export function applyProfilePatch(profile: Profile, patch: Partial<Profile>): Profile {
  return {
    ...profile,
    ...pickProfileExtras(patch),
    ...(patch.retirementAge != null ? { retirementAge: patch.retirementAge } : {}),
    ...(patch.dependents != null ? { dependents: patch.dependents } : {}),
    ...(patch.inflationRate != null ? { inflationRate: patch.inflationRate } : {}),
    ...(patch.employmentType ? { employmentType: patch.employmentType } : {}),
    ...(patch.currency ? { currency: patch.currency } : {}),
  };
}

export function applyAccountIdentity(profile: Profile, account?: AccountIdentity | null): Profile {
  if (!account) return profile;
  return {
    ...profile,
    name: account.name,
    age: ageFromDob(account.dob),
  };
}
