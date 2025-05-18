import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import type { WidgetCountSummary } from '../components/StudyPackLibrary';
import type { FlashCard, Series, StudyPackConfiguration, Widget } from '../types/index';

/**
 * Interface for StudyPack export options
 */
export interface StudyPackExportOptions {
    title?: string;
    description?: string;
    author?: string;
    includeImages?: boolean;
    widgetConfiguration?: StudyPackConfiguration;
}

/**
 * Interface for the metadata stored in a StudyPack
 */
export interface StudyPackMetadata {
    id: string;
    title: string;
    description?: string;
    author?: string;
    createdAt: string;
    cardCount: number; // Kept for backward compatibility
    hasImages: boolean;
    version: string;
    widgets?: WidgetCountSummary[]; // Information about different widget types
}

/**
 * Exports a series to a deployable StudyPack format
 * that can be added to the application by the developer
 * 
 * @param series The series containing flashcards/widgets and page images
 * @param options Export options
 * @returns A Promise resolving to a Blob containing the ZIP file
 */
export async function exportToStudyPack(
    series: Series,
    options: StudyPackExportOptions = {}
): Promise<Blob> {
    // For backward compatibility, check flashcards first
    if ((!series.flashcards || series.flashcards.length === 0) &&
        (!series.widgets || series.widgets.length === 0)) {
        throw new Error('Series contains no content to export');
    }

    const title = options.title || series.name || 'Untitled Study Pack';
    const includeImages = options.includeImages !== false; // Default to true

    // Create a ZIP file
    const zip = new JSZip();

    // Collect all unique source page IDs from all widgets/flashcards
    const sourcePageIds = new Set<string>();

    // Handle legacy flashcards
    if (series.flashcards) {
        for (const card of series.flashcards) {
            for (const pageId of card.sourcePages) {
                sourcePageIds.add(pageId);
            }
        }
    }

    // Handle new widgets
    if (series.widgets) {
        for (const widget of series.widgets) {
            for (const pageId of widget.sourcePages) {
                sourcePageIds.add(pageId);
            }
        }
    }    // Create a map of page IDs to images
    if (includeImages) {
        // Create images folder
        const imagesFolder = zip.folder("images");
        if (!imagesFolder) {
            throw new Error('Failed to create images folder in ZIP');
        }

        // Add each unique page image
        for (const pageId of sourcePageIds) {
            const page = series.pages.find(p => p.id === pageId);
            if (page && page.imageBlob) {
                imagesFolder.file(`${pageId}.png`, page.imageBlob);
            }
        }
    }

    // Count widgets by type
    const widgetCountMap = new Map<string, number>();

    // Add flashcards (legacy support)
    if (series.flashcards && series.flashcards.length > 0) {
        widgetCountMap.set('flashcard', series.flashcards.length);
    }

    // Add other widget types
    if (series.widgets) {
        for (const widget of series.widgets) {
            const count = widgetCountMap.get(widget.type) || 0;
            widgetCountMap.set(widget.type, count + 1);
        }
    }
    // Convert to array for export
    const widgetCountArray: WidgetCountSummary[] = Array.from(widgetCountMap.entries())
        .map(([type, count]) => ({ type, count }));    // Prepare metadata
    const metadata: StudyPackMetadata = {
        id: uuidv4(),
        title,
        description: options.description || '',
        author: options.author || '',
        createdAt: new Date().toISOString(),
        cardCount: series.flashcards?.length || 0, // Legacy support
        hasImages: includeImages && sourcePageIds.size > 0,
        version: '1.0.0',
        widgets: Array.from(widgetCountMap.entries())
            .map(([type, count]) => ({ type, count }))
    };// Add all widgets to the zip file (including flashcards for new format)
    // Convert legacy flashcards to widgets if needed
    const allWidgets: Widget[] = [];

    // First, add any existing widgets
    if (series.widgets && series.widgets.length > 0) {
        allWidgets.push(...series.widgets);
    }

    // Then convert any legacy flashcards that aren't already in widgets
    if (series.flashcards && series.flashcards.length > 0) {
        // Check which flashcards are already in widgets (by ID)
        const existingWidgetIds = new Set(allWidgets.map(w => w.id));

        // Add flashcards that aren't already in widgets
        const uniqueFlashcards = series.flashcards.filter(fc => !existingWidgetIds.has(fc.id));
        allWidgets.push(...uniqueFlashcards);
    }

    // Add the widgets to the zip
    if (allWidgets.length > 0) {
        zip.file("widgets.json", JSON.stringify(allWidgets, null, 2));
    }

    // Add flashcards for backward compatibility (legacy format)
    const flashcardWidgets = allWidgets.filter(w => w.type === 'flashcard') as FlashCard[];
    if (flashcardWidgets.length > 0) {
        zip.file("cards.json", JSON.stringify(flashcardWidgets, null, 2));
    }

    // Add page references
    if (Array.from(sourcePageIds).length > 0) {
        const pageReferences = Array.from(sourcePageIds).map(pageId => {
            const page = series.pages.find(p => p.id === pageId);
            return {
                id: pageId,
                pageNumber: page?.meta.pageNumber,
                chapter: page?.meta.chapter,
                bookTitle: page?.meta.bookTitle
            };
        });

        zip.file("page-references.json", JSON.stringify(pageReferences, null, 2));
    }    // Add readme with instructions
    const widgetTypeDescriptions = Array.from(widgetCountMap.entries())
        .map(([type, count]) => `${count} ${type}${count > 1 && !type.endsWith('s') ? 's' : ''}`)
        .join(', ');

    const readmeContent = `# StudyPack: ${title}

This StudyPack was exported from Ursa Minor Ascension.

## Contents
- ${widgetTypeDescriptions}
- ${sourcePageIds.size} source images

## How to use
Send this file to the application developer to be added to the application.

## Metadata
- Title: ${metadata.title}
- Description: ${metadata.description || 'None'}
- Author: ${metadata.author || 'Unknown'}
- Created: ${new Date(metadata.createdAt).toLocaleDateString()}
`;

    zip.file("README.md", readmeContent);

    // Generate the ZIP file
    return zip.generateAsync({ type: "blob" });
}

/**
 * Downloads the generated StudyPack
 */
export function downloadStudyPack(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
