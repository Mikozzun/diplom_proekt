export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}
export declare const parsePagination: (page?: string, limit?: string) => PaginationParams;
export declare const buildMeta: (page: number, limit: number, total: number) => {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};
