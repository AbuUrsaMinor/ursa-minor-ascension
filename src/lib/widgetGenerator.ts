import { AzureOpenAI } from 'openai';
import { z } from 'zod';
import type {
    ClozeWidget,
    ExplainWidget,
    JokeWidget,
    MatchingPairsWidget,
    MemeWidget,
    OddOneOutWidget,
    OrderedSequenceWidget,
    RiddleWidget,
    Series,
    TimelineWidget,
    TrueFalseWidget,
    Widget,
    WidgetGenerationStatus
} from '../types/index';
import type { AzureConfig } from './azure';
import { FlashCardRequest, generateFlashCards } from './flashcardGenerator';

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
 * Schema for widget generation request
 */
export const WidgetGenerationRequestSchema = z.object({
    configuration: z.object({
        widgets: z.array(z.object({
            type: z.string(),
            count: z.number().min(1).max(50)
        })),
        preferences: z.object({
            difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
            style: z.string().optional(),
            includeHumor: z.boolean().default(false)
        }).optional()
    }),
    maxTotal: z.number().min(1).max(200).default(50)
        .describe('Maximum total number of widgets to generate')
});

export type WidgetGenerationRequest = z.infer<typeof WidgetGenerationRequestSchema>;

/**
 * Generate widgets for a series based on the requested configuration
 * @param series The series to generate widgets for
 * @param config Azure OpenAI configuration
 * @param request Widget generation parameters
 * @param statusCallback Function to call with status updates
 * @returns Generated widgets
 */
export async function generateWidgets(
    series: Series,
    config: AzureConfig,
    request: WidgetGenerationRequest,
    statusCallback: (status: WidgetGenerationStatus) => void
): Promise<Widget[]> {
    if (!series.pages.length) {
        throw new Error('Cannot generate widgets: Series contains no pages');
    }

    const client = createOpenAIClient(config);
    const widgets: Widget[] = [];
    const totalWidgets = request.configuration.widgets.reduce((acc, w) => acc + w.count, 0);

    // Don't generate more than the max total
    const adjustedTotal = Math.min(totalWidgets, request.maxTotal);

    // Start with status update
    statusCallback({
        status: 'estimating',
        message: 'Estimating number of possible widgets...',
        estimatedCount: adjustedTotal
    });

    // Process each widget type
    let processedCount = 0;

    for (const widgetConfig of request.configuration.widgets) {
        // Update status
        statusCallback({
            status: 'generating',
            progress: processedCount,
            total: adjustedTotal,
            message: `Generating ${widgetConfig.type} widgets...`,
            widgetType: widgetConfig.type
        });

        try {
            // Generate specific widget type based on configuration
            const generatedWidgets = await generateWidgetsByType(
                series,
                client,
                config,
                widgetConfig.type,
                widgetConfig.count,
                request.configuration.preferences
            );

            // Add to our collection
            widgets.push(...generatedWidgets);

            // Update progress
            processedCount += generatedWidgets.length;
            statusCallback({
                status: 'generating',
                progress: processedCount,
                total: adjustedTotal,
                message: `Generated ${generatedWidgets.length} ${widgetConfig.type} widgets`,
                widgetType: widgetConfig.type,
                widgetTypeCounts: updateWidgetTypeCounts(widgets)
            });
        } catch (error) {
            console.error(`Error generating ${widgetConfig.type} widgets:`, error);
            statusCallback({
                status: 'error',
                progress: processedCount,
                total: adjustedTotal,
                error: `Error generating ${widgetConfig.type} widgets: ${error instanceof Error ? error.message : String(error)}`,
                widgetType: widgetConfig.type
            });
            // Continue with next widget type
        }
    }

    // Final status update
    statusCallback({
        status: 'complete',
        progress: processedCount,
        total: adjustedTotal,
        message: `Generated ${widgets.length} widgets`,
        widgetTypeCounts: updateWidgetTypeCounts(widgets)
    });

    return widgets;
}

/**
 * Counts widgets by type
 */
function updateWidgetTypeCounts(widgets: Widget[]): Record<string, number> {
    return widgets.reduce((acc, widget) => {
        acc[widget.type] = (acc[widget.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}

/**
 * Generate specific type of widgets
 */
async function generateWidgetsByType(
    series: Series,
    client: AzureOpenAI,
    config: AzureConfig,
    type: string,
    count: number,
    preferences?: WidgetGenerationRequest['configuration']['preferences']
): Promise<Widget[]> {
    // Handle special case for flashcards which already has an implementation
    if (type === 'flashcard') {
        // Create a compatible request for the existing flashcard generator
        const flashcardRequest: FlashCardRequest = {
            count: count,
            difficulty: preferences?.difficulty || 'mixed'
        };

        // Use existing flashcard generator
        const flashcards = await generateFlashCards(
            series,
            config,
            flashcardRequest,
            (progress, total, status) => {
                // This inner progress callback is not used in the main status updates
                // as we're handling that at a higher level
            }
        );

        return flashcards as Widget[];
    }

    // For other widget types, implement a generic generation approach
    // This is a placeholder for actual implementation of each type
    switch (type) {
        case 'cloze':
            return generateClozeWidgets(series, client, count, preferences);
        case 'truefalse':
            return generateTrueFalseWidgets(series, client, count, preferences);
        case 'matching':
            return generateMatchingWidgets(series, client, count, preferences);
        case 'sequence':
            return generateSequenceWidgets(series, client, count, preferences);
        case 'timeline':
            return generateTimelineWidgets(series, client, count, preferences);
        case 'meme':
            return generateMemeWidgets(series, client, count, preferences);
        case 'joke':
            return generateJokeWidgets(series, client, count, preferences);
        case 'explain':
            return generateExplainWidgets(series, client, count, preferences);
        case 'riddle':
            return generateRiddleWidgets(series, client, count, preferences);
        case 'oddoneout':
            return generateOddOneOutWidgets(series, client, count, preferences);
        default:
            throw new Error(`Unsupported widget type: ${type}`);
    }
}

// Placeholder implementation for cloze deletion widgets
async function generateClozeWidgets(
    series: Series,
    client: AzureOpenAI,
    count: number,
    preferences?: WidgetGenerationRequest['configuration']['preferences']
): Promise<ClozeWidget[]> {
    // Implementation would use the OpenAI client to generate content
    // This is a placeholder for actual implementation
    return Promise.resolve([]);
}

// Placeholder implementation for true/false widgets
async function generateTrueFalseWidgets(
    series: Series,
    client: AzureOpenAI,
    count: number,
    preferences?: WidgetGenerationRequest['configuration']['preferences']
): Promise<TrueFalseWidget[]> {
    // Implementation would use the OpenAI client to generate content
    // This is a placeholder for actual implementation
    return Promise.resolve([]);
}

// Placeholder implementation for matching pairs widgets
async function generateMatchingWidgets(
    series: Series,
    client: AzureOpenAI,
    count: number,
    preferences?: WidgetGenerationRequest['configuration']['preferences']
): Promise<MatchingPairsWidget[]> {
    // Implementation would use the OpenAI client to generate content
    // This is a placeholder for actual implementation
    return Promise.resolve([]);
}

// Placeholder implementation for ordered sequence widgets
async function generateSequenceWidgets(
    series: Series,
    client: AzureOpenAI,
    count: number,
    preferences?: WidgetGenerationRequest['configuration']['preferences']
): Promise<OrderedSequenceWidget[]> {
    // Implementation would use the OpenAI client to generate content
    // This is a placeholder for actual implementation
    return Promise.resolve([]);
}

// Placeholder implementation for timeline widgets
async function generateTimelineWidgets(
    series: Series,
    client: AzureOpenAI,
    count: number,
    preferences?: WidgetGenerationRequest['configuration']['preferences']
): Promise<TimelineWidget[]> {
    // Implementation would use the OpenAI client to generate content
    // This is a placeholder for actual implementation
    return Promise.resolve([]);
}

// Placeholder implementation for meme widgets
async function generateMemeWidgets(
    series: Series,
    client: AzureOpenAI,
    count: number,
    preferences?: WidgetGenerationRequest['configuration']['preferences']
): Promise<MemeWidget[]> {
    // Implementation would use the OpenAI client to generate content
    // This is a placeholder for actual implementation
    return Promise.resolve([]);
}

// Placeholder implementation for joke widgets
async function generateJokeWidgets(
    series: Series,
    client: AzureOpenAI,
    count: number,
    preferences?: WidgetGenerationRequest['configuration']['preferences']
): Promise<JokeWidget[]> {
    // Implementation would use the OpenAI client to generate content
    // This is a placeholder for actual implementation
    return Promise.resolve([]);
}

// Placeholder implementation for explain widgets
async function generateExplainWidgets(
    series: Series,
    client: AzureOpenAI,
    count: number,
    preferences?: WidgetGenerationRequest['configuration']['preferences']
): Promise<ExplainWidget[]> {
    // Implementation would use the OpenAI client to generate content
    // This is a placeholder for actual implementation
    return Promise.resolve([]);
}

// Placeholder implementation for riddle widgets
async function generateRiddleWidgets(
    series: Series,
    client: AzureOpenAI,
    count: number,
    preferences?: WidgetGenerationRequest['configuration']['preferences']
): Promise<RiddleWidget[]> {
    // Implementation would use the OpenAI client to generate content
    // This is a placeholder for actual implementation
    return Promise.resolve([]);
}

// Placeholder implementation for odd one out widgets
async function generateOddOneOutWidgets(
    series: Series,
    client: AzureOpenAI,
    count: number,
    preferences?: WidgetGenerationRequest['configuration']['preferences']
): Promise<OddOneOutWidget[]> {
    // Implementation would use the OpenAI client to generate content
    // This is a placeholder for actual implementation
    return Promise.resolve([]);
}
