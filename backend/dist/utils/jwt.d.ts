interface TokenPayload {
    userId: string;
    type: 'access' | 'refresh';
}
export declare const generateAccessToken: (userId: string) => string;
export declare const generateRefreshToken: (userId: string) => string;
export declare const verifyAccessToken: (token: string) => TokenPayload;
export declare const verifyRefreshToken: (token: string) => TokenPayload;
export declare const generateTokenPair: (userId: string) => {
    accessToken: string;
    refreshToken: string;
};
export {};
