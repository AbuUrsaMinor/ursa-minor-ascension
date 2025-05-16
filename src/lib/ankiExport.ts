import JSZip from 'jszip';
import type { Series } from '../types/index';

/**
 * Interface for AnkiApp export options
 */
interface AnkiExportOptions {
    deckName?: string;
    includeSourceImages?: boolean;
}

/**
 * Exports a series' flash cards to AnkiApp format (ZIP)
 * The exported ZIP contains:
 * - deck.xml: Defines the card structure in AnkiApp format
 * - blob/: Directory containing images used in the cards
 * 
 * @param series The series containing flashcards and page images
 * @param options Export options
 * @returns A Promise resolving to a Blob containing the ZIP file
 */
export async function exportToAnkiApp(
    series: Series,
    options?: AnkiExportOptions
): Promise<Blob> {
    if (!series.flashcards || series.flashcards.length === 0) {
        throw new Error('Series contains no flash cards to export');
    }

    const deckName = options?.deckName || series.name || 'Flashcard Deck';
    const includeSourceImages = options?.includeSourceImages !== false; // Default to true

    const zip = new JSZip();

    // Create XML content
    const xmlContent = generateDeckXml(series, deckName, includeSourceImages);

    // Add XML file to zip
    zip.file("deck.xml", xmlContent);

    // Create blob folder in zip
    const blobFolder = zip.folder("blob");
    if (!blobFolder) {
        throw new Error('Failed to create blob folder in ZIP');
    }

    // Add page images to blob folder
    if (includeSourceImages) {
        await addImagesToZip(series, blobFolder);
    }

    // Generate the ZIP file
    return zip.generateAsync({ type: "blob" });
}

/**
 * Generates the XML content for the AnkiApp deck
 */
function generateDeckXml(
    series: Series,
    deckName: string,
    includeSourceImages: boolean
): string {
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<deck name="${escapeXml(deckName)}">
  <fields>
    <rich-text name="Front" sides="11" />
    <rich-text name="Back" sides="01" />
    <rich-text name="Source" sides="01" />
  </fields>
  <cards>`;

    const xmlFooter = `
  </cards>
</deck>`;

    // Generate card entries
    const cardEntries = series.flashcards?.map((card) => {
        // Find source page images
        const cardSourcePages = card.sourcePages
            .map(pageId => series.pages.find(page => page.id === pageId))
            .filter(page => page !== undefined);

        // Create image references for the answer
        const imageRefs = includeSourceImages && cardSourcePages.length > 0
            ? cardSourcePages.map(page =>
                `<img src="blob/image_${page!.id}.png" />`).join('')
            : '';
        // Use the card's pageReferences field if available, otherwise generate from sourcePages
        const pageReferences = card.pageReferences || cardSourcePages.map(page => {
            const pageNumber = page?.meta.pageNumber ? `Page ${page.meta.pageNumber}` : 'Page unknown';
            return `${pageNumber} (ID: ${page!.id})`;
        }).join(', ');

        return `
    <card>
      <rich-text name="Front">${escapeXml(card.question)}</rich-text>
      <rich-text name="Back">${escapeXml(card.answer)}${imageRefs}</rich-text>
      <rich-text name="Source">${escapeXml(pageReferences)}</rich-text>
    </card>`;
    }).join('') || '';

    return xmlHeader + cardEntries + xmlFooter;
}

/**
 * Adds images from source pages to the ZIP file
 */
async function addImagesToZip(series: Series, blobFolder: JSZip): Promise<void> {
    const addedPageIds = new Set<string>();

    // Collect all unique source page IDs from all flashcards
    if (series.flashcards) {
        // First, collect all unique page IDs referenced by any flashcard
        const allSourcePageIds = new Set<string>();
        for (const card of series.flashcards) {
            for (const pageId of card.sourcePages) {
                allSourcePageIds.add(pageId);
            }
        }

        // Then add each unique page image to the ZIP
        for (const pageId of allSourcePageIds) {
            const page = series.pages.find(p => p.id === pageId);

            if (page && page.imageBlob && !addedPageIds.has(pageId)) {
                blobFolder.file(`image_${pageId}.png`, page.imageBlob);
                addedPageIds.add(pageId);
            }
        }
    }
}

/**
 * Escapes special characters for XML content
 */
function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Shares the generated ZIP file using the Web Share API if available
 */
export async function shareAnkiExport(
    blob: Blob,
    filename: string
): Promise<boolean> {
    if (!navigator.share) {
        return false; // Web Share API not supported
    }
    try {
        const file = new File([blob], filename, { type: 'application/zip' });
        // Use the Web Share API with files if supported
        if ('canShare' in navigator && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share!({
                files: [file],
                title: 'Share AnkiApp Flashcards',
                text: 'Flashcards exported from Ursa Minor Ascension'
            } as any); // Cast as any due to TypeScript definitions not being updated with files property
            return true;
        } else {
            // Fall back to sharing without files
            await navigator.share!({
                title: 'AnkiApp Flashcards',
                text: 'Please download the AnkiApp Flashcards file'
            });
            return false; // Still need to download
        }
    } catch (error) {
        console.error('Error sharing file:', error);
        return false;
    }
}

/**
 * Downloads the generated ZIP file
 */
export function downloadAnkiExport(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
