export declare const createPoll: (postId: bigint, question: string, options: string[]) => Promise<{
    id: bigint;
    createdAt: Date;
    postId: bigint | null;
    options: import("@prisma/client/runtime/library").JsonValue;
    question: string;
}>;
export declare const respondToPoll: (pollId: bigint, userId: bigint, selectedOption: string) => Promise<{
    id: bigint;
    createdAt: Date;
    userId: bigint | null;
    selectedOption: string;
    pollId: bigint | null;
}>;
export declare const getPollResults: (pollId: bigint) => Promise<{
    poll: {
        id: bigint;
        createdAt: Date;
        postId: bigint | null;
        options: import("@prisma/client/runtime/library").JsonValue;
        question: string;
    };
    results: {
        option: string;
        votes: number;
        percentage: number;
    }[];
    totalVotes: number;
}>;
