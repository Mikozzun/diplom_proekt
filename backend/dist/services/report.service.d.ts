export declare const createReport: (userId: bigint, reportType: string, description?: string) => Promise<{
    id: bigint;
    createdAt: Date;
    userId: bigint | null;
    reportType: string;
    description: string | null;
}>;
export declare const getReports: (page?: string, limit?: string) => Promise<{
    reports: ({
        user: {
            id: bigint;
            username: string;
        } | null;
    } & {
        id: bigint;
        createdAt: Date;
        userId: bigint | null;
        reportType: string;
        description: string | null;
    })[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
