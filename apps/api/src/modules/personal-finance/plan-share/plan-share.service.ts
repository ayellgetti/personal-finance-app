import { createHash, randomBytes } from "node:crypto";
import { planShareModel, type PlanShareModel } from "../../../models/index";
import { HttpError } from "../../../utils/http-error.util";
import { advisoryUserLock, type UserLock } from "../../../utils/user-lock.util";
import {
  MAX_ACTIVE_PLAN_SHARES,
  type CreatePlanShareBody,
  type RemovePlanShareBody,
} from "./plan-share.request";
import type { Prisma } from "@prisma/client";

const planShareLock = advisoryUserLock("plan-share");
const DAY_MS = 24 * 60 * 60 * 1000;

/** Only this hash is stored, so a database leak does not expose working links. */
export function hashPlanShareToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newPlanShareToken(): string {
  return randomBytes(32).toString("base64url");
}

export class PlanShareService {
  constructor(
    private readonly model: PlanShareModel = planShareModel,
    private readonly withUserLock: UserLock = planShareLock,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private liveWhere(userId: string) {
    return { userId, isActive: 1, expiresAt: { gt: this.now() } };
  }

  /** The owner's links, without tokens or snapshots. */
  async list(userId: string) {
    const rows = await this.model.read(this.liveWhere(userId), {
      orderBy: { createdAt: "desc" },
      take: MAX_ACTIVE_PLAN_SHARES,
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        label: row.label,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        viewCount: row.viewCount,
        lastViewedAt: row.lastViewedAt,
      })),
    };
  }

  /** Returns the token once. It cannot be recovered afterwards, only revoked. */
  create(userId: string, body: CreatePlanShareBody) {
    return this.withUserLock(userId, async () => {
      const active = await this.model.count(this.liveWhere(userId));
      if (active >= MAX_ACTIVE_PLAN_SHARES) {
        throw new HttpError(
          409,
          `You can have up to ${MAX_ACTIVE_PLAN_SHARES} active share links. Revoke one to create another.`,
        );
      }
      const token = newPlanShareToken();
      const expiresAt = new Date(this.now().getTime() + body.expiresInDays * DAY_MS);
      const row = await this.model.create({
        userId,
        label: body.label,
        tokenHash: hashPlanShareToken(token),
        snapshot: body.snapshot as Prisma.InputJsonValue,
        expiresAt,
        createdBy: userId,
        updatedBy: userId,
      });
      return { token, share: { id: row.id, label: row.label, createdAt: row.createdAt, expiresAt: row.expiresAt, viewCount: 0 } };
    });
  }

  async revoke(userId: string, body: RemovePlanShareBody) {
    const existing = await this.model.readOne({ id: body.id, userId, isActive: 1 });
    if (!existing) {
      throw new HttpError(404, "Share link not found");
    }
    await this.model.update({ id: body.id }, { isActive: 0, deletedAt: this.now(), deletedBy: userId });
    return { id: body.id, revoked: true };
  }

  /**
   * Public read. Unknown, expired and revoked links all give the same answer,
   * so a caller cannot tell which tokens ever existed.
   */
  async view(token: string) {
    const row = await this.model.readOne({
      tokenHash: hashPlanShareToken(token),
      isActive: 1,
      expiresAt: { gt: this.now() },
    });
    if (!row) {
      throw new HttpError(404, "This link is no longer available");
    }
    await this.model.update({ id: row.id }, { viewCount: { increment: 1 }, lastViewedAt: this.now() });
    return { label: row.label, expiresAt: row.expiresAt, snapshot: row.snapshot };
  }
}

export const planShareService = new PlanShareService();
