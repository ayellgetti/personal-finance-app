import { userModel, type AiReportQuota, type UserModel } from "../../../models/shared/user.model.js";

export type AdvisorQuota = AiReportQuota;

/** Quota as the client sees it; `unlimited` is true while the dev override is on. */
export type AdvisorQuotaView = AdvisorQuota & { unlimited: boolean };

export interface AdvisorQuotaStore {
  read(userId: string): Promise<AdvisorQuota>;
  consume(userId: string): Promise<AdvisorQuota>;
  grant(userId: string, extra?: number): Promise<AdvisorQuota>;
}

export class UserAdvisorQuotaStore implements AdvisorQuotaStore {
  constructor(private readonly users: UserModel = userModel) {}

  read(userId: string): Promise<AdvisorQuota> {
    return this.users.readAiReportQuota(userId);
  }

  consume(userId: string): Promise<AdvisorQuota> {
    return this.users.consumeAiReport(userId);
  }

  grant(userId: string, extra = 1): Promise<AdvisorQuota> {
    return this.users.incrementAiReportLimit(userId, extra);
  }
}

export const userAdvisorQuotaStore = new UserAdvisorQuotaStore();
