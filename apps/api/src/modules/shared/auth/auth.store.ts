import { createHash } from "node:crypto";
import { Prisma, type RefreshSession } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import {
  Model,
  type PrismaModelDelegate,
} from "../../../utils/model.util.js";

export type RefreshSessionRecord = {
  jti: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class RefreshSessionModel extends Model<
  RefreshSession,
  RefreshSessionRecord,
  Prisma.RefreshSessionUncheckedUpdateInput,
  Prisma.RefreshSessionWhereInput,
  Prisma.RefreshSessionWhereUniqueInput,
  Prisma.RefreshSessionOrderByWithRelationInput
> {
  constructor() {
    super(
      prisma.refreshSession as unknown as PrismaModelDelegate<
        RefreshSession,
        RefreshSessionRecord,
        Prisma.RefreshSessionUncheckedUpdateInput,
        Prisma.RefreshSessionWhereInput,
        Prisma.RefreshSessionWhereUniqueInput,
        Prisma.RefreshSessionOrderByWithRelationInput
      >,
      "RefreshSession",
    );
  }

  async save(session: RefreshSessionRecord): Promise<void> {
    await this.create(session);
  }

  async find(jti: string): Promise<RefreshSessionRecord | null> {
    return this.readOne({ jti });
  }

  async delete(jti: string): Promise<void> {
    await this.hardDeleteMany({ jti });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.hardDeleteMany({ userId });
  }
}

export const refreshSessionModel = new RefreshSessionModel();
