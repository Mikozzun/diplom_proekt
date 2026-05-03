export declare const getUserById: (id: bigint) => Promise<{
    id: bigint;
    username: string;
    phoneNumber: string;
    profileImage: string | null;
    createdAt: Date;
} | null>;
export declare const updateUser: (id: bigint, data: {
    username?: string;
    profileImage?: string;
}) => Promise<{
    id: bigint;
    username: string;
    phoneNumber: string;
    profileImage: string | null;
    createdAt: Date;
}>;
export declare const getUserProfile: (id: bigint) => Promise<{
    id: bigint;
    username: string;
    profileImage: string | null;
    createdAt: Date;
    _count: {
        comments: number;
        likes: number;
        posts: number;
    };
} | null>;
export declare const getUserSettings: (userId: bigint) => Promise<{
    id: bigint;
    createdAt: Date;
    userId: bigint | null;
    theme: string | null;
    notificationsEnabled: boolean | null;
} | null>;
export declare const updateUserSettings: (userId: bigint, data: {
    theme?: string;
    notificationsEnabled?: boolean;
}) => Promise<{
    id: bigint;
    createdAt: Date;
    userId: bigint | null;
    theme: string | null;
    notificationsEnabled: boolean | null;
}>;
export declare const deleteUser: (id: bigint) => Promise<{
    id: bigint;
    username: string;
    phoneNumber: string;
    passkey: string;
    profileImage: string | null;
    clerkId: string | null;
    createdAt: Date;
}>;
