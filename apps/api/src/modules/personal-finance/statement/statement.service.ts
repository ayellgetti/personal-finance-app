import { readFile, unlink } from "node:fs/promises";
import type { Prisma } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import { prisma } from "../../../utils/prisma.util";
import {
  statementImportModel,
  statementLineModel,
  type StatementImportModel,
  type StatementLineModel,
} from "../../../models/index";
import type {
  CreateStatementBody,
  ListStatementLinesQuery,
  ListStatementsQuery,
  RemoveStatementBody,
  UpdateStatementLineBody,
} from "./statement.request";
import { parseStatementText } from "./statement.parser";
import { extractStatementText } from "./statement.extract";

export type UploadedStatementFile = {
  path: string;
  originalname: string;
};

export class StatementService {
  constructor(
    private readonly imports: StatementImportModel = statementImportModel,
    private readonly lines: StatementLineModel = statementLineModel,
  ) {}

  list(userId: string, query: ListStatementsQuery) {
    return this.imports.paginate(
      {
        userId,
        isActive: 1,
        ...(query.sourceType ? { sourceType: query.sourceType } : {}),
      },
      query.page ?? 1,
      query.limit ?? 25,
      { orderBy: { createdAt: "desc" } },
    );
  }

  async getById(userId: string, id: string) {
    return this.requireImport(userId, id);
  }

  listLines(userId: string, importId: string, query: ListStatementLinesQuery) {
    return this.requireImport(userId, importId).then(() =>
      this.lines.paginate(
        { userId, importId, isActive: 1 },
        query.page ?? 1,
        query.limit ?? 50,
        { orderBy: [{ postedOn: "desc" }, { createdAt: "desc" }] },
      ),
    );
  }

  async create(
    userId: string,
    input: CreateStatementBody,
    file?: UploadedStatementFile,
  ) {
    const text = await this.resolveText(input, file);
    const parsed = parseStatementText(text);
    if (parsed.lines.length === 0) {
      throw new HttpError(422, "No transactions could be parsed from the statement");
    }

    const fileName = input.fileName ?? file?.originalname ?? null;
    const periodFrom = parsed.summary.periodFrom ? new Date(parsed.summary.periodFrom) : null;
    const periodTo = parsed.summary.periodTo ? new Date(parsed.summary.periodTo) : null;

    return prisma.$transaction(async (tx) => {
      const created = await tx.statementImport.create({
        data: {
          userId,
          sourceType: input.sourceType,
          fileName,
          periodFrom,
          periodTo,
          currency: "INR",
          status: "parsed",
          summary: parsed.summary as Prisma.InputJsonValue,
          lineCount: parsed.lines.length,
        },
      });

      await tx.statementLine.createMany({
        data: parsed.lines.map((line) => ({
          userId,
          importId: created.id,
          postedOn: line.postedOn,
          description: line.description.slice(0, 500),
          amount: line.amount,
          direction: line.direction,
          category: line.category,
          merchant: line.merchant,
        })),
      });

      return created;
    });
  }

  async updateLine(
    userId: string,
    importId: string,
    lineId: string,
    input: UpdateStatementLineBody,
  ) {
    await this.requireImport(userId, importId);
    const line = await this.lines.readOne({ id: lineId });
    if (!line || line.userId !== userId || line.importId !== importId || line.isActive !== 1) {
      throw new HttpError(404, "Statement line not found");
    }
    return this.lines.update({ id: lineId }, { category: input.category });
  }

  async remove(userId: string, input: RemoveStatementBody) {
    await this.requireImport(userId, input.id);
    await this.imports.update(
      { id: input.id },
      { isActive: 0, deletedAt: new Date() },
    );
    await this.lines.updateMany({ importId: input.id, userId }, { isActive: 0 });
    return { id: input.id, removed: true };
  }

  private async requireImport(userId: string, id: string) {
    const record = await this.imports.readOne({ id });
    if (!record || record.userId !== userId || record.isActive !== 1) {
      throw new HttpError(404, "Statement import not found");
    }
    return record;
  }

  private async resolveText(
    input: CreateStatementBody,
    file?: UploadedStatementFile,
  ): Promise<string> {
    if (file) {
      try {
        const buffer = await readFile(file.path);
        return await extractStatementText({
          buffer,
          fileName: file.originalname,
          password: input.password,
        });
      } finally {
        await unlink(file.path).catch(() => undefined);
      }
    }

    if (input.text && input.text.trim().length > 0) {
      return input.text;
    }

    throw new HttpError(422, "Paste statement text or upload a PDF, CSV, Excel or text file");
  }
}

export const statementService = new StatementService();
