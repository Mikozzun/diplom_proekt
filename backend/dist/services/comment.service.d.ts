export declare const createComment: (postId: bigint, userId: bigint, content: string) => Promise<{
    user: {
        id: bigint;
        username: string;
        profileImage: string | null;
    } | null;
} & {
    id: bigint;
    createdAt: Date;
    content: string;
    userId: bigint | null;
    updatedAt: Date | null;
    postId: bigint | null;
}>;
export declare const getPostComments: (postId: bigint, page?: string, limit?: string) => Promise<{
    comments: ({
        user: {
            id: bigint;
            username: string;
            profileImage: string | null;
        } | null;
    } & {
        id: bigint;
        createdAt: Date;
        content: string;
        userId: bigint | null;
        updatedAt: Date | null;
        postId: bigint | null;
    })[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const updateComment: (id: bigint, userId: bigint, content: string) => Promise<{
    user: {
        id: bigint;
        username: string;
        profileImage: string | null;
    } | null;
} & {
    id: bigint;
    createdAt: Date;
    content: string;
    userId: bigint | null;
    updatedAt: Date | null;
    postId: bigint | null;
}>;
export declare const deleteComment: (id: bigint, userId: bigint) => Promise<{
    id: bigint;
    createdAt: Date;
    content: string;
    userId: bigint | null;
    updatedAt: Date | null;
    postId: bigint | null;
}>;
