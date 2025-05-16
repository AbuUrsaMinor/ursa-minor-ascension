/**
 * This file provides TypeScript declarations for Web Share API features
 * that might not be included in the TypeScript lib
 */

interface ShareData {
    files?: File[];
    title?: string;
    text?: string;
    url?: string;
}

interface Navigator {
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data: ShareData) => boolean;
}
