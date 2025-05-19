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

// Cloze deletion widget
export interface ClozeWidget extends BaseWidget {
    type: 'cloze';
    sentence: string;
    blanks: Array<{ text: string; hint?: string }>;

    context?: string;
}

// True/False widget
export interface TrueFalseWidget extends BaseWidget {
    type: 'truefalse';
    statements: Array<{ text: string; isTrue: boolean; explanation: string }>;

}

// Matching pairs widget
export interface MatchingPairsWidget extends BaseWidget {
    type: 'matching';
    pairs: Array<{ term: string; definition: string }>;

}

// Ordered sequence widget
export interface OrderedSequenceWidget extends BaseWidget {
    type: 'sequence';
    items: Array<{ text: string; position: number; explanation?: string }>;

    title?: string;
}

// Timeline builder widget
export interface TimelineWidget extends BaseWidget {
    type: 'timeline';
    events: Array<{ text: string; date: string; position: number }>;

    title?: string;
}

// Meme widget
export interface MemeWidget extends BaseWidget {
    type: 'meme';
    imageUrl?: string;
    caption: string;
    altText?: string;
}

// Joke or Roast widget
export interface JokeWidget extends BaseWidget {
    type: 'joke';
    text: string;
    type2?: 'joke' | 'roast'; // Subtype to differentiate between jokes and roasts
}

// Explain-like-an-XXX widget
export interface ExplainWidget extends BaseWidget {
    type: 'explain';
    style: string; // e.g., "5-year-old", "Skibidi rizz", "gangsta"
    explanation: string;
    formalExplanation: string;
}

// Riddle widget
export interface RiddleWidget extends BaseWidget {
    type: 'riddle';
    question: string;
    answer: string;
    hints: string[];
}

// Odd One Out widget
export interface OddOneOutWidget extends BaseWidget {
    type: 'oddoneout';
    items: Array<{ text: string; isOdd: boolean; explanation: string }>;

}

// Type union for all widget types
export type Widget =
    | FlashCard
    | ClozeWidget
    | TrueFalseWidget
    | MatchingPairsWidget
    | OrderedSequenceWidget
    | TimelineWidget
    | MemeWidget
    | JokeWidget
    | ExplainWidget
    | RiddleWidget
    | OddOneOutWidget; // Union of all widget types

// Status tracking for widget generation
export interface WidgetGenerationStatus {
    status: 'idle' | 'estimating' | 'generating' | 'complete' | 'error';
    progress?: number;
    total?: number;
    error?: string;
    estimatedCount?: number;
    message?: string;
    widgetType?: string;
    widgetTypeCounts?: Record<string, number>; // Count of generated widgets by type
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
    preferences?: {
        difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
        style?: string;
        includeHumor?: boolean;
    };
}
