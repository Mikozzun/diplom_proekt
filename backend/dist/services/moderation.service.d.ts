export declare const addToQueue: (contentType: string, contentId: bigint) => Promise<{
    id: bigint;
    createdAt: Date;
    status: string | null;
    contentType: string;
    contentId: bigint;
}>;
export declare const getModerationQueue: (status?: string, page?: string, limit?: string) => Promise<{
    items: {
        id: bigint;
        createdAt: Date;
        status: string | null;
        contentType: string;
        contentId: bigint;
    }[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const updateModerationStatus: (id: bigint, status: string) => Promise<{
    id: bigint;
    createdAt: Date;
    status: string | null;
    contentType: string;
    contentId: bigint;
}>;
export declare const resolveModeration: (id: bigint, action: "approve" | "reject") => Promise<{
    id: bigint;
    createdAt: Date;
    status: string | null;
    contentType: string;
    contentId: bigint;
}>;
