export interface PaginatedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    pageSize: number;
    currentPage: number;
}