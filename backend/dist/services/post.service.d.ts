export declare const createPost: (userId: bigint, data: {
    content?: string;
    imageUrl?: string;
    videoUrl?: string;
}) => Promise<{
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
}>;
export declare const getPosts: (page?: string, limit?: string) => Promise<{
    posts: ({
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
    })[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const getPostById: (id: bigint) => Promise<({
    user: {
        id: bigint;
        username: string;
        profileImage: string | null;
    } | null;
    polls: {
        id: bigint;
        createdAt: Date;
        postId: bigint | null;
        options: import("@prisma/client/runtime/library").JsonValue;
        question: string;
    }[];
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
}) | null>;
export declare const updatePost: (id: bigint, userId: bigint, data: {
    content?: string;
    imageUrl?: string;
    videoUrl?: string;
}) => Promise<{
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
}>;
export declare const deletePost: (id: bigint, userId: bigint) => Promise<{
    id: bigint;
    createdAt: Date;
    content: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    userId: bigint | null;
    updatedAt: Date | null;
}>;
export declare const getUserPosts: (userId: bigint, page?: string, limit?: string) => Promise<{
    posts: ({
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
    })[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const getRandomizedFeed: (userId: bigint, page?: string, limit?: string) => Promise<{
    posts: (({
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
    }) | null)[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
