import { HttpError } from "../../../lib/http-error.js";
import { loanModel, type LoanModel } from "../../../models/index.js";
import type {
  CreateLoanBody,
  ListLoansQuery,
  RemoveLoanBody,
  UpdateLoanBody,
} from "./loan.request.js";

export class LoanService {
  constructor(private readonly model: LoanModel = loanModel) {}

  list(userId: string, query: ListLoansQuery) {
    return this.model.paginate(
      { userId, isActive: 1 },
      query.page ?? 1,
      query.limit ?? 25,
      { orderBy: { createdAt: "desc" } },
    );
  }

  async getById(userId: string, id: string) {
    return this.requireOwned(userId, id);
  }

  create(userId: string, input: CreateLoanBody) {
    return this.model.create({
      userId,
      title: input.title,
      type: input.type,
      principalPendingAmount: input.principalPendingAmount,
      roi: input.roi,
      remainingMonths: input.remainingMonths,
      emiAmount: input.emiAmount,
      emiDay: input.emiDay,
    });
  }

  async update(userId: string, id: string, input: UpdateLoanBody) {
    await this.requireOwned(userId, id);
    return this.model.update({ id }, input);
  }

  async remove(userId: string, input: RemoveLoanBody) {
    await this.requireOwned(userId, input.id);
    await this.model.update(
      { id: input.id },
      { isActive: 0, deletedAt: new Date() },
    );
    return { id: input.id, removed: true };
  }

  private async requireOwned(userId: string, id: string) {
    const loan = await this.model.readOne({ id });
    if (!loan || loan.userId !== userId || loan.isActive !== 1) {
      throw new HttpError(404, "Loan not found");
    }
    return loan;
  }
}

export const loanService = new LoanService();
