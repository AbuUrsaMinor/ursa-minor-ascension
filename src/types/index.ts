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

export type FlashCardDifficulty = 'easy' | 'medium' | 'hard';

export interface FlashCard {
    id: string;
    question: string;
    answer: string;
    sourcePages: string[];
    difficulty: FlashCardDifficulty;
    concepts: string[];
    createdAt: string;
}

export interface FlashCardGenerationStatus {
    status: 'idle' | 'estimating' | 'generating' | 'complete' | 'error';
    progress?: number;
    total?: number;
    error?: string;
    estimatedCount?: number;
    message?: string;
}

export interface Series {
    id: string;
    name: string;
    createdAt: string;
    pages: Page[];
    flashcards?: FlashCard[];
    flashcardStatus?: FlashCardGenerationStatus;
}

export interface SeriesDraft extends Omit<Series, 'id' | 'name' | 'createdAt'> {
    name?: string;
}
