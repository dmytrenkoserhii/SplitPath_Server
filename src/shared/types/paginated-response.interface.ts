export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}
