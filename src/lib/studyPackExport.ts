import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import type { Series } from '../types/index';

/**
 * Interface for StudyPack export options
 */
export interface StudyPackExportOptions {
    title?: string;
    description?: string;
    author?: string;
    includeImages?: boolean;
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
    cardCount: number;
    hasImages: boolean;
    version: string;
}

/**
 * Exports a series to a deployable StudyPack format
 * that can be added to the application by the developer
 * 
 * @param series The series containing flashcards and page images
 * @param options Export options
 * @returns A Promise resolving to a Blob containing the ZIP file
 */
export async function exportToStudyPack(
    series: Series,
    options: StudyPackExportOptions = {}
): Promise<Blob> {
    if (!series.flashcards || series.flashcards.length === 0) {
        throw new Error('Series contains no flash cards to export');
    }

    const title = options.title || series.name || 'Untitled Study Pack';
    const includeImages = options.includeImages !== false; // Default to true

    // Create a ZIP file
    const zip = new JSZip();

    // Collect all unique source page IDs from all flashcards
    const sourcePageIds = new Set<string>();
    for (const card of series.flashcards) {
        for (const pageId of card.sourcePages) {
            sourcePageIds.add(pageId);
        }
    }

    // Create a map of page IDs to images
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

    // Prepare metadata
    const metadata: StudyPackMetadata = {
        id: uuidv4(),
        title,
        description: options.description || '',
        author: options.author || '',
        createdAt: new Date().toISOString(),
        cardCount: series.flashcards.length,
        hasImages: includeImages && sourcePageIds.size > 0,
        version: '1.0.0'
    };

    // Prepare the content package
    const studyPackContent = {
        metadata,
        cards: series.flashcards.map(card => ({
            ...card,
            // Remove any fields we don't want to include
            updatedAt: undefined
        })),
        pageReferences: Array.from(sourcePageIds).map(pageId => {
            const page = series.pages.find(p => p.id === pageId);
            return {
                id: pageId,
                pageNumber: page?.meta.pageNumber,
                chapter: page?.meta.chapter,
                bookTitle: page?.meta.bookTitle
            };
        })
    };

    // Add the studypack content as JSON
    zip.file("studypack.json", JSON.stringify(studyPackContent, null, 2));

    // Add readme with instructions
    const readmeContent = `# StudyPack: ${title}

This StudyPack was exported from Ursa Minor Ascension.

## Contents
- ${studyPackContent.cards.length} flash cards
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
