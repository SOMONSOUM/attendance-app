export type PaginationQuery = {
  page?: string | number;
  pageSize?: string | number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type Paginated<T> = {
  items: T[];
  meta: PaginationMeta;
};

export function parsePagination(query: PaginationQuery = {}) {
  const page = clampNumber(query.page, 1, 1, 10_000);
  const pageSize = clampNumber(query.pageSize, 10, 1, 100);
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function paginated<T>(
  items: T[],
  totalItems: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return {
    items,
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(Math.ceil(totalItems / pageSize), 1),
    },
  };
}

function clampNumber(
  value: string | number | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}
