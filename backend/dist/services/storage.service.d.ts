export declare const createStorageEntry: (userId: bigint, data: {
    fileName: string;
    fileType: string;
    fileSize: bigint;
    fileUrl: string;
}) => Promise<{
    id: bigint;
    createdAt: Date;
    userId: bigint | null;
    fileName: string;
    fileType: string;
    fileSize: bigint;
    fileUrl: string;
}>;
export declare const getUserFiles: (userId: bigint) => Promise<{
    id: bigint;
    createdAt: Date;
    userId: bigint | null;
    fileName: string;
    fileType: string;
    fileSize: bigint;
    fileUrl: string;
}[]>;
export declare const deleteFile: (id: bigint, userId: bigint) => Promise<{
    id: bigint;
    createdAt: Date;
    userId: bigint | null;
    fileName: string;
    fileType: string;
    fileSize: bigint;
    fileUrl: string;
}>;
