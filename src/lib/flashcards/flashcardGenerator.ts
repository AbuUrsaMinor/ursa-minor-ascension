// filepath: c:\Users\A550191\git\ursa-minor-ascension\src\lib\flashcardGenerator.ts
// filepath: c:\Users\A550191\git\ursa-minor-ascension\src\lib\flashcardGenerator.ts
import { AzureOpenAI } from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import type { FlashCard, Page, Series } from '../../types/index';
import type { AzureConfig } from '../azure';

/**
 * Create the OpenAI client for use with Azure OpenAI
 */
function createOpenAIClient(config: AzureConfig): AzureOpenAI {
    const deployment = "gpt-4";
    const apiVersion = "2024-10-21";

    return new AzureOpenAI({
        apiKey: config.apiKey,
        endpoint: config.endpoint,
        deployment,
        apiVersion,
        dangerouslyAllowBrowser: true
    });
}

/**
 * Schema for the flash card generation request
 */
const FlashCardRequestSchema = z.object({
    count: z.number().min(5).max(50).default(10)
        .describe('The number of flash cards to generate'),
    difficulty: z.enum(['mixed', 'easy', 'medium', 'hard']).default('mixed')
        .describe('The target difficulty level for the cards')
});

export type FlashCardRequest = z.infer<typeof FlashCardRequestSchema>;

/**
 * Schema for the generated flash card from OpenAI
 */
const FlashCardResponseSchema = z.object({
    question: z.string()
        .describe('The question text for the flash card'),
    answer: z.string()
        .describe('The answer text for the flash card without page references'),
    sourcePages: z.array(z.string())
        .describe('Array of page IDs where this information was found'),
    pageReferences: z.string().optional()
        .describe('Human-readable text describing the page references'),
    difficulty: z.enum(['easy', 'medium', 'hard'])
        .describe('The estimated difficulty level of this question'),
    concepts: z.array(z.string())
        .describe('Key concepts covered by this flash card')
});

export type FlashCardResponse = z.infer<typeof FlashCardResponseSchema>;

/**
 * Schema for batch of flash cards from OpenAI
 */
const FlashCardBatchSchema = z.object({
    flashcards: z.array(FlashCardResponseSchema)
        .describe('Array of generated flash cards')
});

/**
 * Process content in chunks to ensure we don't exceed context limits
 * @param series The series to process
 * @returns An array of content chunks suitable for processing
 */
function chunkSeriesContent(series: Series): Array<{
    content: string;
    pageIds: string[];
    pageNumbers: (number | undefined)[];
}> {
    const chunks: Array<{
        content: string;
        pageIds: string[];
        pageNumbers: (number | undefined)[];
    }> = [];

    // Estimated tokens per page (rough estimate)
    const MAX_TOKENS_PER_CHUNK = 4000;
    const ESTIMATED_TOKENS_PER_CHAR = 0.25;

    let currentChunk = '';
    let currentPageIds: string[] = [];
    let currentPageNumbers: (number | undefined)[] = [];
    let estimatedTokens = 0;

    for (const page of series.pages) {
        // Estimate tokens for this page
        const pageTokens = page.text.length * ESTIMATED_TOKENS_PER_CHAR;

        // If adding this page would exceed the chunk size, finalize the current chunk
        if (estimatedTokens > 0 && estimatedTokens + pageTokens > MAX_TOKENS_PER_CHUNK) {
            chunks.push({
                content: currentChunk,
                pageIds: [...currentPageIds],
                pageNumbers: [...currentPageNumbers]
            });

            // Reset for next chunk
            currentChunk = '';
            currentPageIds = [];
            currentPageNumbers = [];
            estimatedTokens = 0;
        }

        // Add page to the current chunk
        currentChunk += `\n\n--- PAGE ${page.meta.pageNumber || 'unknown'} ---\n\n${page.text}`;
        currentPageIds.push(page.id);
        currentPageNumbers.push(page.meta.pageNumber);
        estimatedTokens += pageTokens;
    }

    // Add the final chunk if there's any content
    if (currentChunk.length > 0) {
        chunks.push({
            content: currentChunk,
            pageIds: currentPageIds,
            pageNumbers: currentPageNumbers
        });
    }

    return chunks;
}

/**
 * Estimates the number of potential flash cards based on content analysis
 * @param series The series to analyze
 */
export async function estimateFlashCardCount(
    series: Series,
    config: AzureConfig
): Promise<number> {
    // Return immediately with a reasonable default if we have very few pages
    if (!series.pages || series.pages.length <= 2) {
        return Math.max(series.pages.length * 5, 5);
    }

    // Calculate a reasonable default based on page count
    const defaultEstimate = Math.min(Math.max(series.pages.length * 4, 5), 50);

    // If we have no text content in the pages, return default
    const hasTextContent = series.pages.some(page => page.text && page.text.trim().length > 0);
    if (!hasTextContent) {
        console.log('No text content found in pages, using default estimate');
        return defaultEstimate;
    }

    try {
        // Add safety check for config
        if (!config || !config.endpoint || !config.apiKey) {
            console.log('Invalid config provided, using default estimate');
            return defaultEstimate;
        }

        const client = createOpenAIClient(config);

        // Sample a subset of pages for the estimation (to save time and tokens)
        const sampleSize = Math.min(series.pages.length, 2);
        const samplePages = series.pages.slice(0, sampleSize);

        // Build a sample content string
        const sampleContent = samplePages.map(page => page.text || '').join('\n\n');

        // Abort if sample content is too small
        if (sampleContent.length < 50) {
            console.log('Sample content too small, using default estimate');
            return defaultEstimate;
        }

        // Define the schema for the estimation response
        const estimationSchema = z.object({
            estimatedCardCount: z.number()
                .describe('The estimated number of flash cards that could be generated from the full content')
        });

        let response;

        try {
            // Set up a timeout for the API call
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // Make the API call
            response = await client.beta.chat.completions.parse({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert in educational content analysis. Analyze this sample text and estimate the number of unique flash cards possible from the complete material. The flash cards will have questions in Swedish and answers in the original language of the content.`
                    },
                    {
                        role: "user",
                        content: `This is a sample representing ${sampleSize} pages out of ${series.pages.length} total pages. Please estimate how many total high-quality, non-duplicate flash cards could be generated from the complete material:\n\n${sampleContent}`
                    }
                ],
                temperature: 0.2,
                response_format: zodResponseFormat(estimationSchema, "estimation")
            });

            // Clear the timeout
            clearTimeout(timeoutId);
        } catch (apiError) {
            console.error('API call failed:', apiError);
            return defaultEstimate;
        }

        if (response && response.choices && response.choices[0]?.message?.parsed) {
            // Scale the estimation by the ratio of total pages to sample pages
            const baseEstimate = response.choices[0].message.parsed.estimatedCardCount;
            const scaleFactor = series.pages.length / sampleSize;
            const scaledEstimate = Math.round(baseEstimate * scaleFactor);

            // Ensure the estimate is reasonable (between 5 and 50)
            return Math.min(Math.max(scaledEstimate, 5), 50);
        }

        // Fallback if we couldn't get a structured response
        console.log('No structured response received, using default estimate');
        return defaultEstimate;
    } catch (error) {
        console.error('Error estimating flash card count:', error);
        // Default fallback calculation
        return defaultEstimate;
    }
}

/**
 * Generates flash cards for a series
 * @param series The series to generate cards for
 * @param config Azure OpenAI configuration
 * @param request Flash card generation parameters
 * @param progressCallback Function to call with progress updates
 * @returns Generated flash cards
 */
export async function generateFlashCards(
    series: Series,
    config: AzureConfig,
    request: FlashCardRequest,
    progressCallback: (progress: number, total: number, status: string) => void
): Promise<FlashCard[]> {
    if (!series.pages.length) {
        throw new Error('Cannot generate flash cards: Series contains no pages');
    }

    const client = createOpenAIClient(config);
    const chunks = chunkSeriesContent(series);

    // Start with progress update
    progressCallback(0, chunks.length, 'Processing content chunks');

    // Calculate cards per chunk
    const cardsPerChunk = Math.ceil(request.count / chunks.length);
    const totalCardTarget = request.count;

    const allCards: FlashCardResponse[] = [];

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        progressCallback(i, chunks.length, `Processing chunk ${i + 1} of ${chunks.length}`);

        try {
            // Generate cards for this chunk
            const chunkCards = await generateCardsForChunk(
                client,
                chunk,
                cardsPerChunk,
                request.difficulty,
                series.pages
            );

            // Add to our collection
            allCards.push(...chunkCards);

            // Update progress
            progressCallback(i + 1, chunks.length, `Generated ${allCards.length} cards so far`);

        } catch (error) {
            console.error(`Error generating cards for chunk ${i}:`, error);
            progressCallback(i + 1, chunks.length, `Error with chunk ${i + 1}`);
            // Continue to next chunk despite errors
        }
    }

    // Remove duplicate cards using similarity check
    const uniqueCards = removeDuplicateCards(allCards);

    // Ensure we don't exceed the requested count
    const finalCards = uniqueCards.slice(0, totalCardTarget);

    // Transform into the internal FlashCard type with IDs
    return finalCards.map(card => ({
        ...card,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        type: 'flashcard' // Add the missing type property
    }));
}

/**
 * Generates cards for a single content chunk
 */
async function generateCardsForChunk(
    client: AzureOpenAI,
    chunk: {
        content: string;
        pageIds: string[];
        pageNumbers: (number | undefined)[];
    },
    cardCount: number,
    difficulty: string,
    _allPages: Page[]  // renamed with underscore to indicate it's not used
): Promise<FlashCardResponse[]> {
    // Create a page ID to number mapping for reference
    const pageMap = new Map<string, number | undefined>();
    for (let i = 0; i < chunk.pageIds.length; i++) {
        pageMap.set(chunk.pageIds[i], chunk.pageNumbers[i]);
    }

    // Create reference strings for each page
    const pageReferences = chunk.pageIds.map(id => {
        const pageNumber = pageMap.get(id);
        return pageNumber ? `Page ${pageNumber} (ID: ${id})` : `Unknown page (ID: ${id})`;
    }).join("\n");

    // Build a system prompt
    const systemPrompt = `You are an expert educational content creator specializing in generating high-quality flash cards.
Your task is to create ${cardCount} flash cards from the provided content, ensuring:

1. Questions are ALWAYS written in Swedish, regardless of the language of the content
2. Answers are in the original language of the content
3. Questions are clear, concise, and test understanding (not just recall)
4. Answers are comprehensive yet concise, with all key information
5. IMPORTANT: Place page references in the separate "pageReferences" field, NOT in the answer text
6. Cards cover diverse concepts within the material
7. No duplicate or highly similar cards are created
8. Difficulty level is set to: ${difficulty === 'mixed' ? 'a mix of easy, medium, and hard' : difficulty}

Important: All questions MUST be in Swedish for Swedish students learning the material, even if the content is in another language. The answers should remain in the original language of the content.

Here are the available page references:
${pageReferences}

When citing source pages:
- Use the exact page IDs from this list in the sourcePages array
- Put human-readable page references in the pageReferences field (e.g., "Page 5, Page 10")
- Keep the answer field focused on content without any page references`;

    try {
        const response = await client.beta.chat.completions.parse({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: `Please create ${cardCount} flash cards from this content, following the guidelines I provided. Remember that all questions MUST be in Swedish, while answers should be in the original language:\n\n${chunk.content}`
                }
            ],
            temperature: 0.5,
            response_format: zodResponseFormat(FlashCardBatchSchema, "flashcards")
        });

        if (response.choices[0]?.message?.parsed) {
            return response.choices[0].message.parsed.flashcards;
        }

        throw new Error('No structured response received from Azure OpenAI');

    } catch (error) {
        // Fall back to legacy approach if beta fails
        console.error('Error generating flash cards with beta API, attempting fallback:', error);

        const response = await client.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: `Please create ${cardCount} flash cards from this content, following the guidelines I provided. Remember that all questions MUST be in Swedish, while answers should be in the original language. Return them in a JSON object with a "flashcards" array property containing the cards.\n\n${chunk.content}`
                }
            ],
            temperature: 0.5,
            response_format: { type: "json_object" }
        });

        if (response.choices[0]?.message?.content) {
            try {
                // Parse the JSON and validate against our schema
                const parsed = JSON.parse(response.choices[0].message.content);
                if (Array.isArray(parsed.flashcards)) {
                    const validationResult = z.array(FlashCardResponseSchema).safeParse(parsed.flashcards);
                    if (validationResult.success) {
                        return validationResult.data;
                    }
                }
                throw new Error('Response validation failed');
            } catch (jsonError) {
                console.error('Error parsing fallback response:', jsonError);
                throw new Error('Failed to parse response from Azure OpenAI');
            }
        }

        throw new Error('Failed to generate flash cards');
    }
}

/**
 * Removes duplicate flash cards based on similarity
 */
function removeDuplicateCards(cards: FlashCardResponse[]): FlashCardResponse[] {
    if (cards.length <= 1) return cards;

    const result: FlashCardResponse[] = [];

    // Simplified similarity check based on text content
    for (const card of cards) {
        // Check if this card is too similar to any card we've already included
        const isDuplicate = result.some(existingCard => {
            // Simple text similarity check
            const questionSimilarity = calculateSimilarity(card.question, existingCard.question);
            const answerSimilarity = calculateSimilarity(card.answer, existingCard.answer);

            // If either is too similar, consider it a duplicate
            return questionSimilarity > 0.92 || answerSimilarity > 0.92;
        });

        if (!isDuplicate) {
            result.push(card);
        }
    }

    return result;
}

/**
 * Calculates a simple string similarity score
 */
function calculateSimilarity(str1: string, str2: string): number {
    // Convert to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // If strings are identical, similarity is 1
    if (s1 === s2) return 1;

    // If either string is empty, similarity is 0
    if (!s1.length || !s2.length) return 0;

    // Calculate Levenshtein distance
    const matrix: number[][] = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1).fill(0));

    for (let i = 0; i <= s1.length; i++) {
        matrix[i][0] = i;
    }

    for (let j = 0; j <= s2.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= s1.length; i++) {
        for (let j = 1; j <= s2.length; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1, // deletion
                matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    const distance = matrix[s1.length][s2.length];
    const maxLength = Math.max(s1.length, s2.length);

    // Return similarity score between 0 and 1
    return 1 - distance / maxLength;
}
