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

// Base widget type for all study widgets
export interface BaseWidget {
    id: string;
    type: string;
    sourcePages: string[];
    pageReferences?: string;
    concepts: string[];
    createdAt: string;
}

export type FlashCardDifficulty = 'easy' | 'medium' | 'hard';

// FlashCard is now a specific type of widget
export interface FlashCard extends BaseWidget {
    type: 'flashcard';
    question: string;
    answer: string;
    difficulty: FlashCardDifficulty;
}

// Type union for all widget types
export type Widget = FlashCard; // In the future, add more widget types to this union

// Status tracking for widget generation
export interface WidgetGenerationStatus {
    status: 'idle' | 'estimating' | 'generating' | 'complete' | 'error';
    progress?: number;
    total?: number;
    error?: string;
    estimatedCount?: number;
    message?: string;
    widgetType?: string;
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
    widgets?: Widget[];
    flashcardStatus?: FlashCardGenerationStatus;
    widgetStatus?: WidgetGenerationStatus;
}

export interface SeriesDraft extends Omit<Series, 'id' | 'name' | 'createdAt'> {
    name?: string;
}

// StudyPack configuration types
export interface WidgetCount {
    type: string;
    count: number;
}

export interface StudyPackConfiguration {
    widgets: WidgetCount[];
}
