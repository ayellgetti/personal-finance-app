import { Prisma } from "@prisma/client";
import { HttpError } from "./http-error.util";
import { logger } from "./logger.util";

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export const GLOBAL_HIDDEN_FIELDS = ["password", "oldPasswords"] as const;

export type GlobalHiddenField = (typeof GLOBAL_HIDDEN_FIELDS)[number];

export type PublicRecord<T> = Omit<T, GlobalHiddenField>;

type QueryOptions<TOrderBy> = {
  skip?: number;
  take?: number;
  orderBy?: TOrderBy | TOrderBy[];
  select?: unknown;
  include?: unknown;
  includeHidden?: boolean;
};

type HiddenOptions = {
  includeHidden?: boolean;
};

type RelationOptions<TOrderBy> = Pick<
  QueryOptions<TOrderBy>,
  "select" | "include" | "includeHidden"
>;

type ModelDelegate<TEntity, TCreate, TUpdate, TWhere, TWhereUnique, TOrderBy> = {
  create(args: { data: TCreate; select?: unknown; include?: unknown }): Promise<TEntity>;
  createMany(args: { data: TCreate[]; skipDuplicates?: boolean }): Promise<{ count: number }>;
  createManyAndReturn?(args: {
    data: TCreate[];
    skipDuplicates?: boolean;
    select?: unknown;
    include?: unknown;
  }): Promise<TEntity[]>;
  findMany(args: {
    where?: TWhere;
    skip?: number;
    take?: number;
    orderBy?: TOrderBy | TOrderBy[];
    select?: unknown;
    include?: unknown;
  }): Promise<TEntity[]>;
  findUnique(args: {
    where: TWhereUnique;
    select?: unknown;
    include?: unknown;
  }): Promise<TEntity | null>;
  findFirst(args: {
    where?: TWhere;
    orderBy?: TOrderBy | TOrderBy[];
    select?: unknown;
    include?: unknown;
  }): Promise<TEntity | null>;
  count(args: { where?: TWhere }): Promise<number>;
  update(args: {
    where: TWhereUnique;
    data: TUpdate;
    select?: unknown;
    include?: unknown;
  }): Promise<TEntity>;
  updateMany(args: { where?: TWhere; data: TUpdate }): Promise<{ count: number }>;
  upsert(args: {
    where: TWhereUnique;
    create: TCreate;
    update: TUpdate;
    select?: unknown;
    include?: unknown;
  }): Promise<TEntity>;
  delete(args: { where: TWhereUnique }): Promise<TEntity>;
  deleteMany(args: { where?: TWhere }): Promise<{ count: number }>;
  groupBy(args: Record<string, unknown>): Promise<unknown[]>;
};

export type PaginatedResult<TEntity> = {
  items: TEntity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

/**
 * Prisma/PostgreSQL counterpart of a Mongoose model wrapper.
 *
 * Mongo → Postgres
 * - populate → `include` (set `this.include` on a subclass)
 * - lean() → Prisma already returns plain objects
 * - insertMany → `createMany` / `bulkCreateAndReturn`
 * - findOneAndUpdate + upsert → explicit `upsert` (not on every update)
 * - duplicate key 11000 → Prisma P2002
 * - aggregate → `groupBy`
 */
export abstract class Model<
  TEntity,
  TCreate,
  TUpdate,
  TWhere,
  TWhereUnique,
  TOrderBy,
> {
  protected hidden: string[] = [];
  protected include: unknown | undefined;
  protected defaultOrderBy: TOrderBy | TOrderBy[] | undefined;

  protected constructor(
    protected readonly model: ModelDelegate<
      TEntity,
      TCreate,
      TUpdate,
      TWhere,
      TWhereUnique,
      TOrderBy
    >,
    private readonly modelName: string,
  ) {}

  withoutHidden<T>(value: T): PublicRecord<T> {
    return this.conceal(value, false) as PublicRecord<T>;
  }

  async create(data: TCreate, options: RelationOptions<TOrderBy> = {}): Promise<TEntity> {
    return this.execute(
      () => this.model.create({ data, ...this.relationArgs(options) }),
      options.includeHidden,
    );
  }

  async bulkCreate(data: TCreate[], skipDuplicates = true): Promise<number> {
    const result = await this.execute(() =>
      this.model.createMany({ data, skipDuplicates }),
    );
    return result.count;
  }

  async bulkCreateAndReturn(
    data: TCreate[],
    skipDuplicates = true,
    options: RelationOptions<TOrderBy> = {},
  ): Promise<TEntity[]> {
    if (!this.model.createManyAndReturn) {
      throw new HttpError(500, `${this.modelName} does not support bulkCreateAndReturn`);
    }

    return this.execute(
      () =>
        this.model.createManyAndReturn!({
          data,
          skipDuplicates,
          ...this.relationArgs(options),
        }),
      options.includeHidden,
    );
  }

  async read(
    where?: TWhere,
    options: QueryOptions<TOrderBy> = {},
  ): Promise<TEntity[]> {
    return this.execute(
      () =>
        this.model.findMany({
          where,
          skip: options.skip,
          take: options.take,
          orderBy: this.orderArgs(options.orderBy),
          ...this.relationArgs(options),
        }),
      options.includeHidden,
    );
  }

  async readOne(
    where: TWhereUnique,
    options: RelationOptions<TOrderBy> = {},
  ): Promise<TEntity | null> {
    return this.execute(
      () =>
        this.model.findUnique({
          where,
          ...this.relationArgs(options),
        }),
      options.includeHidden,
    );
  }

  async findOne(
    where?: TWhere,
    options: Pick<QueryOptions<TOrderBy>, "orderBy" | "select" | "include" | "includeHidden"> = {},
  ): Promise<TEntity | null> {
    return this.execute(
      () =>
        this.model.findFirst({
          where,
          orderBy: this.orderArgs(options.orderBy),
          ...this.relationArgs(options),
        }),
      options.includeHidden,
    );
  }

  async count(where?: TWhere): Promise<number> {
    return this.execute(() => this.model.count({ where }));
  }

  async exists(where: TWhere): Promise<boolean> {
    return (await this.count(where)) > 0;
  }

  async update(
    where: TWhereUnique,
    data: TUpdate,
    options: RelationOptions<TOrderBy> = {},
  ): Promise<TEntity> {
    return this.execute(
      () => this.model.update({ where, data, ...this.relationArgs(options) }),
      options.includeHidden,
    );
  }

  async updateOne(
    where: TWhereUnique,
    data: TUpdate,
    options: RelationOptions<TOrderBy> = {},
  ): Promise<TEntity> {
    return this.update(where, data, options);
  }

  async updateMany(where: TWhere, data: TUpdate): Promise<number> {
    const result = await this.execute(() =>
      this.model.updateMany({ where, data }),
    );
    return result.count;
  }

  async upsert(
    where: TWhereUnique,
    create: TCreate,
    update: TUpdate,
    options: RelationOptions<TOrderBy> = {},
  ): Promise<TEntity> {
    return this.execute(
      () =>
        this.model.upsert({
          where,
          create,
          update,
          ...this.relationArgs(options),
        }),
      options.includeHidden,
    );
  }

  async hardDeleteOne(
    where: TWhereUnique,
    options: HiddenOptions = {},
  ): Promise<TEntity> {
    return this.execute(
      () => this.model.delete({ where }),
      options.includeHidden,
    );
  }

  async hardDeleteMany(where?: TWhere): Promise<number> {
    const result = await this.execute(() => this.model.deleteMany({ where }));
    return result.count;
  }

  async softDelete(where: TWhereUnique, data: TUpdate): Promise<TEntity> {
    return this.update(where, data);
  }

  async softDeleteMany(where: TWhere, data: TUpdate): Promise<number> {
    return this.updateMany(where, data);
  }

  async paginate(
    where: TWhere | undefined,
    page = 1,
    limit = 25,
    options: Pick<
      QueryOptions<TOrderBy>,
      "orderBy" | "select" | "include" | "includeHidden"
    > = {},
  ): Promise<PaginatedResult<TEntity>> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const [items, total] = await Promise.all([
      this.read(where, {
        ...options,
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.count(where),
    ]);
    const totalPages = Math.ceil(total / safeLimit);

    return {
      items,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPreviousPage: safePage > 1,
      },
    };
  }

  async aggregate<TResult = unknown[]>(args: Record<string, unknown>): Promise<TResult> {
    return this.execute(() => this.model.groupBy(args)) as Promise<TResult>;
  }

  async aggregateOne<TRow extends Record<string, unknown>>(
    args: Record<string, unknown>,
    match: (row: TRow) => boolean,
  ): Promise<TRow | undefined> {
    const rows = await this.aggregate<TRow[]>(args);
    return rows.find(match);
  }

  protected async execute<TResult>(
    operation: () => Promise<TResult>,
    includeHidden = false,
  ): Promise<TResult> {
    try {
      const result = await operation();
      return this.conceal(result, includeHidden);
    } catch (error) {
      this.errorHandler(error);
    }
  }

  private relationArgs(options: RelationOptions<TOrderBy> = {}): {
    select?: unknown;
    include?: unknown;
  } {
    const include = options.include !== undefined ? options.include : this.include;
    return {
      ...(options.select !== undefined ? { select: options.select } : {}),
      ...(include !== undefined ? { include } : {}),
    };
  }

  private orderArgs(orderBy?: TOrderBy | TOrderBy[]): TOrderBy | TOrderBy[] | undefined {
    return orderBy !== undefined ? orderBy : this.defaultOrderBy;
  }

  private hiddenFieldSet(): Set<string> {
    return new Set([...GLOBAL_HIDDEN_FIELDS, ...this.hidden]);
  }

  private conceal<T>(value: T, includeHidden: boolean): T {
    if (includeHidden) {
      return value;
    }

    return this.concealValue(value) as T;
  }

  private concealValue(value: unknown): unknown {
    if (value == null || value instanceof Date) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.concealValue(item));
    }

    if (!isRecord(value)) {
      return value;
    }

    const hidden = this.hiddenFieldSet();
    const record: Record<string, unknown> = {};

    for (const [key, nested] of Object.entries(value)) {
      if (hidden.has(key)) {
        continue;
      }
      record[key] = this.concealValue(nested);
    }

    return record;
  }

  protected errorHandler(error: unknown): never {
    logger.error(`${this.modelName} database operation failed`, {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002": {
          const target = error.meta?.target;
          const field = Array.isArray(target) ? target.join(", ") : "field";
          throw new HttpError(409, `Duplicate ${field} is not allowed`);
        }
        case "P2003":
          throw new HttpError(409, "Related record does not exist or is in use");
        case "P2014":
          throw new HttpError(409, "The requested relation change is invalid");
        case "P2025":
          throw new HttpError(404, `${this.modelName} not found`);
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new HttpError(422, `${this.modelName} data validation failed`);
    }

    throw error;
  }
}

export type PrismaModelDelegate<
  TEntity,
  TCreate,
  TUpdate,
  TWhere,
  TWhereUnique,
  TOrderBy,
> = ModelDelegate<TEntity, TCreate, TUpdate, TWhere, TWhereUnique, TOrderBy>;
