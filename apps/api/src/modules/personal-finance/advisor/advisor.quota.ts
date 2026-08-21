import { userModel, type AiReportQuota, type UserModel } from "../../../models/shared/user.model.js";

export type AdvisorQuota = AiReportQuota;

export interface AdvisorQuotaStore {
  read(userId: string): Promise<AdvisorQuota>;
  consume(userId: string): Promise<AdvisorQuota>;
}

export class UserAdvisorQuotaStore implements AdvisorQuotaStore {
  constructor(private readonly users: UserModel = userModel) {}

  read(userId: string): Promise<AdvisorQuota> {
    return this.users.readAiReportQuota(userId);
  }

  consume(userId: string): Promise<AdvisorQuota> {
    return this.users.consumeAiReport(userId);
  }
}

export const userAdvisorQuotaStore = new UserAdvisorQuotaStore();
