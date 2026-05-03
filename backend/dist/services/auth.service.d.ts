export declare const register: (username: string, phoneNumber: string, passkey: string) => Promise<{
    id: bigint;
    username: string;
    phoneNumber: string;
    createdAt: Date;
}>;
export declare const login: (username: string, passkey: string, deviceInfo?: string, ipAddress?: string) => Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
        id: bigint;
        username: string;
        profileImage: string | null;
    };
}>;
export declare const loginWithClerk: (clerkId: string) => Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
        id: bigint;
        username: string;
        profileImage: string | null;
    };
} | null>;
export declare const syncClerkUser: (clerkId: string, username: string, phoneNumber: string) => Promise<{
    id: bigint;
    username: string;
    phoneNumber: string;
    passkey: string;
    profileImage: string | null;
    clerkId: string | null;
    createdAt: Date;
}>;
