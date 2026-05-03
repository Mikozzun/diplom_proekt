export declare const toggleLike: (postId: bigint, userId: bigint) => Promise<{
    liked: boolean;
}>;
export declare const toggleBookmark: (postId: bigint, userId: bigint) => Promise<{
    bookmarked: boolean;
}>;
export declare const getUserBookmarks: (userId: bigint) => Promise<({
    post: ({
        user: {
            id: bigint;
            username: string;
            profileImage: string | null;
        } | null;
        _count: {
            comments: number;
            likes: number;
            reactions: number;
        };
    } & {
        id: bigint;
        createdAt: Date;
        content: string | null;
        imageUrl: string | null;
        videoUrl: string | null;
        userId: bigint | null;
        updatedAt: Date | null;
    }) | null;
} & {
    id: bigint;
    createdAt: Date;
    userId: bigint | null;
    postId: bigint | null;
})[]>;
export declare const addReaction: (postId: bigint, userId: bigint, reactionType: string) => Promise<{
    id: bigint;
    createdAt: Date;
    userId: bigint | null;
    postId: bigint | null;
    reactionType: string;
}>;
export declare const removeReaction: (postId: bigint, userId: bigint, reactionType: string) => Promise<import(".prisma/client").Prisma.BatchPayload>;
export declare const getPostReactions: (postId: bigint) => Promise<{
    type: string;
    count: number;
}[]>;
