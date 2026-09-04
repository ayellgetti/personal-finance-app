type WhereValue = Record<string, unknown> | undefined;

function toMillis(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Number(value) : parsed;
  }
  return Number(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

function matchesFilter(current: unknown, filter: Record<string, unknown>): boolean {
  if ("contains" in filter) {
    const hay = String(current ?? "");
    const needle = String(filter.contains ?? "");
    if (filter.mode === "insensitive") {
      return hay.toLowerCase().includes(needle.toLowerCase());
    }
    return hay.includes(needle);
  }
  if ("in" in filter && Array.isArray(filter.in)) {
    return filter.in.includes(current);
  }
  if ("not" in filter) {
    if (filter.not === null && current == null) {
      return false;
    }
    if (filter.not !== null && current === filter.not) {
      return false;
    }
  }
  if ("gte" in filter) {
    if (current == null) {
      return false;
    }
    if (toMillis(current) < toMillis(filter.gte)) {
      return false;
    }
  }
  if ("lte" in filter) {
    if (current == null) {
      return false;
    }
    if (toMillis(current) > toMillis(filter.lte)) {
      return false;
    }
  }
  if ("lt" in filter) {
    if (current == null) {
      return false;
    }
    if (!(toMillis(current) < toMillis(filter.lt))) {
      return false;
    }
  }
  return true;
}

export function matchesWhere<T extends Record<string, unknown>>(
  row: T,
  where: WhereValue,
): boolean {
  if (!where) {
    return true;
  }
  for (const [key, value] of Object.entries(where)) {
    if (key === "OR" && Array.isArray(value)) {
      if (!value.some((clause) => matchesWhere(row, clause as Record<string, unknown>))) {
        return false;
      }
      continue;
    }
    if (key === "AND" && Array.isArray(value)) {
      if (!value.every((clause) => matchesWhere(row, clause as Record<string, unknown>))) {
        return false;
      }
      continue;
    }
    const current = row[key];
    if (isPlainObject(value)) {
      if (!matchesFilter(current, value)) {
        return false;
      }
      continue;
    }
    if (current !== value) {
      return false;
    }
  }
  return true;
}

export function fakeCrud<T extends { id: string; isActive: number }>(
  prefix: string,
  seed: T[] = [],
) {
  const rows = [...seed];

  const model = {
    async create(data: Omit<T, "id" | "isActive"> & { id?: string; isActive?: number }) {
      const created = {
        isActive: 1,
        ...data,
        id: data.id ?? `${prefix}-${rows.length + 1}`,
      } as T;
      rows.push(created);
      return created;
    },
    async read(where?: Record<string, unknown>) {
      return rows.filter((row) => matchesWhere(row as Record<string, unknown>, where));
    },
    async readOne(where: { id: string }) {
      return rows.find((row) => row.id === where.id) ?? null;
    },
    async findOne(where?: Record<string, unknown>) {
      return rows.find((row) => matchesWhere(row as Record<string, unknown>, where)) ?? null;
    },
    async count(where?: Record<string, unknown>) {
      return rows.filter((row) => matchesWhere(row as Record<string, unknown>, where)).length;
    },
    async paginate(where?: Record<string, unknown>, page = 1, limit = 25) {
      const items = rows.filter((row) => matchesWhere(row as Record<string, unknown>, where));
      const safePage = Math.max(1, page);
      const safeLimit = Math.min(100, Math.max(1, limit));
      const total = items.length;
      const totalPages = Math.ceil(total / safeLimit) || 0;
      const start = (safePage - 1) * safeLimit;
      return {
        items: items.slice(start, start + safeLimit),
        pagination: {
          total,
          page: safePage,
          limit: safeLimit,
          totalPages,
          hasNextPage: safePage < totalPages,
          hasPreviousPage: safePage > 1,
        },
      };
    },
    async update(where: { id: string }, data: Partial<T>) {
      const index = rows.findIndex((row) => row.id === where.id);
      const current = rows[index];
      if (index < 0 || !current) {
        throw new Error("missing");
      }
      const next = { ...current, ...data };
      rows[index] = next;
      return next;
    },
    async hardDeleteOne(where: { id: string }) {
      const index = rows.findIndex((row) => row.id === where.id);
      const current = rows[index];
      if (index < 0 || !current) {
        throw new Error("missing");
      }
      rows.splice(index, 1);
      return current;
    },
    async hardDeleteMany(where?: Record<string, unknown>) {
      const keep: T[] = [];
      let count = 0;
      for (const row of rows) {
        if (matchesWhere(row as Record<string, unknown>, where)) {
          count += 1;
        } else {
          keep.push(row);
        }
      }
      rows.splice(0, rows.length, ...keep);
      return count;
    },
    async sumAmount(where?: Record<string, unknown>) {
      return rows
        .filter((row) => matchesWhere(row as Record<string, unknown>, where))
        .reduce((sum, row) => {
          const amount = (row as { amount?: number }).amount;
          return sum + (typeof amount === "number" ? amount : 0);
        }, 0);
    },
  };

  return { model, rows };
}
