export interface Page {
    id: string;
    imageBlob: Blob;
    text: string;
    imageDescriptions: string[];
    meta: {
        pageNumber?: number;
        chapter?: string;
        bookTitle?: string;
        [key: string]: unknown;
    };
    status?: 'pending' | 'queued' | 'processing' | 'complete' | 'error';
    error?: string;
}

export interface Series {
    id: string;
    name: string;
    createdAt: string;
    pages: Page[];
}

export interface SeriesDraft extends Omit<Series, 'id' | 'name' | 'createdAt'> {
    name?: string;
}
