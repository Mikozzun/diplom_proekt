export declare const getDailyMetrics: (startDate: Date, endDate: Date) => Promise<{
    id: bigint;
    date: Date;
    newUsers: number | null;
    activeUsers: number | null;
    postsCreated: number | null;
    commentsMade: number | null;
}[]>;
export declare const recordDailyMetrics: () => Promise<{
    id: bigint;
    date: Date;
    newUsers: number | null;
    activeUsers: number | null;
    postsCreated: number | null;
    commentsMade: number | null;
}>;
