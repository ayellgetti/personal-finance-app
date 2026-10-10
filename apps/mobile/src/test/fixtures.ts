import type { CrmPaginated } from "@/types/crm";

export function pageOf<T>(items: T[]): CrmPaginated<T> {
  return {
    items,
    pagination: {
      total: items.length,
      page: 1,
      limit: 20,
      totalPages: items.length > 0 ? 1 : 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}
