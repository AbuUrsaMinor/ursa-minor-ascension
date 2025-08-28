import { AzureOpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import type { MemeWidget, Page, Series } from '../types';
import type { AzureConfig } from './azure';

// Default meme templates
export const memeTemplates = [
    {
        id: 'drake',
        name: 'Drake',
        path: '/assets/meme-templates/drake.jpg',
        description: 'Drake approval/disapproval format'
    },
    {
        id: 'distracted-boyfriend',
        name: 'Distracted Boyfriend',
        path: '/assets/meme-templates/distracted-boyfriend.jpg',
        description: 'Man looking at another woman'
    },
    {
        id: 'change-my-mind',
        name: 'Change My Mind',
        path: '/assets/meme-templates/change-my-mind.jpg',
        description: 'Steven Crowder sitting at a desk with a sign'
    },
    {
        id: 'two-buttons',
        name: 'Two Buttons',
        path: '/assets/meme-templates/two-buttons.jpg',
        description: 'Person sweating over which button to press'
    },
    {
        id: 'expanding-brain',
        name: 'Expanding Brain',
        path: '/assets/meme-templates/expanding-brain.jpg',
        description: 'Multiple brain sizes representing increasing enlightenment'
    },
    {
        id: 'surprised-pikachu',
        name: 'Surprised Pikachu',
        path: '/assets/meme-templates/surprised-pikachu.jpg',
        description: 'Pikachu with surprised expression'
    },
    {
        id: 'one-does-not-simply',
        name: 'One Does Not Simply',
        path: '/assets/meme-templates/one-does-not-simply.jpg',
        description: 'Boromir from Lord of the Rings'
    },
    {
        id: 'is-this-a-pigeon',
        name: 'Is This a Pigeon',
        path: '/assets/meme-templates/is-this-a-pigeon.jpg',
        description: 'Anime character asking if butterfly is a pigeon'
    },
    // NEW MEME TEMPLATES BELOW
    {
        id: 'ancient-aliens',
        name: 'Ancient Aliens Guy',
        path: '/assets/meme-templates/ancient-aliens.jpg',
        description: 'Man with wild hair suggesting aliens were involved'
    },
    {
        id: 'disaster-girl',
        name: 'Disaster Girl',
        path: '/assets/meme-templates/disaster-girl.jpg',
        description: 'Girl smiling in front of a burning house'
    },
    {
        id: 'roll-safe',
        name: 'Roll Safe Think About It',
        path: '/assets/meme-templates/roll-safe.jpg',
        description: 'Man pointing to his head suggesting a clever idea'
    },
    {
        id: 'unsettled-tom',
        name: 'Unsettled Tom',
        path: '/assets/meme-templates/unsettled-tom.jpg',
        description: 'Tom from Tom and Jerry looking disturbed or surprised'
    },
    {
        id: 'waiting-skeleton',
        name: 'Waiting Skeleton',
        path: '/assets/meme-templates/waiting-skeleton.jpg',
        description: 'Skeleton sitting on a bench waiting'
    },
    {
        id: 'woman-yelling-at-cat',
        name: 'Woman Yelling at Cat',
        path: '/assets/meme-templates/woman-yelling-at-cat.jpg',
        description: 'Woman yelling at confused cat sitting at table'
    },
    {
        id: 'x-all-the-y',
        name: 'X All The Y',
        path: '/assets/meme-templates/x-all-the-y.jpg',
        description: 'Enthusiastic figure with raised arms'
    },
    {
        id: 'y-u-no',
        name: 'Y U No',
        path: '/assets/meme-templates/y-u-no.jpg',
        description: 'Frustrated stick figure asking why something isn\'t done'
    },
    {
        id: 'this-is-fine',
        name: 'This Is Fine',
        path: '/assets/meme-templates/this-is-fine.jpg',
        description: 'Dog calmly sitting in a room on fire'
    },
    {
        id: 'evil-kermit',
        name: 'Evil Kermit',
        path: '/assets/meme-templates/evil-kermit.jpg',
        description: 'Kermit the Frog facing his evil hooded self'
    },
    {
        id: 'buff-doge-vs-cheems',
        name: 'Buff Doge vs. Cheems',
        path: '/assets/meme-templates/buff-doge-vs-cheems.jpg',
        description: 'Strong dog vs. weak dog comparison'
    },
    {
        id: 'hide-the-pain-harold',
        name: 'Hide The Pain Harold',
        path: '/assets/meme-templates/hide-the-pain-harold.jpg',
        description: 'Man with a forced smile hiding internal pain'
    },
    {
        id: 'guy-thinking',
        name: 'Guy Thinking',
        path: '/assets/meme-templates/guy-thinking.jpg',
        description: 'Man with hand on chin thinking deeply'
    },
    {
        id: 'success-kid',
        name: 'Success Kid',
        path: '/assets/meme-templates/success-kid.jpg',
        description: 'Toddler with clenched fist expressing success'
    },
    {
        id: 'surprised-steve-harvey',
        name: 'Surprised Steve Harvey',
        path: '/assets/meme-templates/surprised-steve-harvey.jpg',
        description: 'Steve Harvey with shocked expression'
    },
    {
        id: 'one-simply-does-not',
        name: 'One Simply Does Not',
        path: '/assets/meme-templates/one-simply-does-not.jpg',
        description: 'Boromir from Lord of the Rings explaining one does not simply do something'
    },
    {
        id: 'skull-meme',
        name: 'Skull Meme',
        path: '/assets/meme-templates/skull-meme.jpg',
        description: 'Person being destroyed by a comment'
    },
    {
        id: 'top-gear-anyway',
        name: 'Top Gear Anyway',
        path: '/assets/meme-templates/top-gear-anyway.jpg',
        description: 'Jeremy Clarkson saying "Anyway" after something controversial'
    },
    {
        id: 'guy-tapping-head',
        name: 'Guy Tapping Head',
        path: '/assets/meme-templates/guy-tapping-head.jpg',
        description: 'Man tapping his temple indicating a clever idea'
    },
    {
        id: 'awkward-penguin',
        name: 'Awkward Penguin',
        path: '/assets/meme-templates/awkward-penguin.jpg',
        description: 'Socially awkward penguin in awkward situations'
    },
    {
        id: 'crying-cat',
        name: 'Crying Cat',
        path: '/assets/meme-templates/crying-cat.jpg',
        description: 'Sad cat with tears in its eyes'
    },
    {
        id: 'doge',
        name: 'Doge',
        path: '/assets/meme-templates/doge.jpg',
        description: 'Shiba Inu dog with colorful text in Comic Sans'
    },
    {
        id: 'philosoraptor',
        name: 'Philosoraptor',
        path: '/assets/meme-templates/philosoraptor.jpg',
        description: 'Velociraptor pondering philosophical questions'
    },
    {
        id: 'ight-imma-head-out',
        name: 'Ight Imma Head Out',
        path: '/assets/meme-templates/ight-imma-head-out.jpg',
        description: 'SpongeBob getting up from his chair to leave'
    },
    {
        id: 'bernie-mittens',
        name: 'Bernie Mittens',
        path: '/assets/meme-templates/bernie-mittens.jpg',
        description: 'Bernie Sanders sitting with mittens at inauguration'
    },
    {
        id: 'disappointed-black-guy',
        name: 'Disappointed Black Guy',
        path: '/assets/meme-templates/disappointed-black-guy.jpg',
        description: 'Man with initial excitement followed by disappointment'
    },
    {
        id: 'matrix-morpheus',
        name: 'Matrix Morpheus',
        path: '/assets/meme-templates/matrix-morpheus.jpg',
        description: 'Morpheus from The Matrix offering truth pills'
    },
    {
        id: 'galaxy-brain',
        name: 'Galaxy Brain',
        path: '/assets/meme-templates/galaxy-brain.jpg',
        description: 'Expanding brain representing increasingly complex ideas'
    },
    {
        id: 'change-my-mind-crowder',
        name: 'Change My Mind (Alternate)',
        path: '/assets/meme-templates/change-my-mind-crowder.jpg',
        description: 'Steven Crowder at a table with "Change My Mind" sign'
    },
    {
        id: 'skeptical-baby',
        name: 'Skeptical Baby',
        path: '/assets/meme-templates/skeptical-baby.jpg',
        description: 'Baby with skeptical expression'
    },
    {
        id: 'salt-bae',
        name: 'Salt Bae',
        path: '/assets/meme-templates/salt-bae.jpg',
        description: 'Chef sprinkling salt with flair'
    },
    {
        id: 'gru-plan',
        name: 'Gru\'s Plan',
        path: '/assets/meme-templates/gru-plan.jpg',
        description: 'Gru from Despicable Me presenting a 3-step plan'
    },
    {
        id: 'pointing-spiderman',
        name: 'Pointing Spiderman',
        path: '/assets/meme-templates/pointing-spiderman.jpg',
        description: 'Two identical Spidermen pointing at each other'
    }
];

/**
 * Create the OpenAI client for Azure
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
 * Extract text from a random range of pages
 * @param series The series containing pages
 * @param maxChars Maximum characters to extract
 */
export function getRandomPageRange(series: Series, maxChars: number = 5000): { text: string, pageReferences: string } {
    if (!series.pages || series.pages.length === 0) {
        return { text: '', pageReferences: '' };
    }

    // Get a random starting page index
    const startIdx = Math.floor(Math.random() * series.pages.length);
    let totalChars = 0;
    let combinedText = '';
    const usedPages: number[] = [];

    // Function to get page number if available, or index+1 otherwise
    const getPageNumber = (page: Page, idx: number) => page.meta.pageNumber ?? (idx + 1);

    // First try going forward from the random page
    for (let i = startIdx; i < series.pages.length && totalChars < maxChars; i++) {
        const pageText = series.pages[i].text || '';
        const remainingChars = maxChars - totalChars;

        if (pageText.length <= remainingChars) {
            combinedText += pageText + ' ';
            totalChars += pageText.length + 1;
            usedPages.push(getPageNumber(series.pages[i], i));
        } else {
            // Add a partial page if we're about to exceed the limit
            combinedText += pageText.substring(0, remainingChars) + ' ';
            totalChars += remainingChars + 1;
            usedPages.push(getPageNumber(series.pages[i], i));
            break;
        }
    }

    // If we didn't reach the character limit, try going backward from the start page
    if (totalChars < maxChars && startIdx > 0) {
        for (let i = startIdx - 1; i >= 0 && totalChars < maxChars; i--) {
            const pageText = series.pages[i].text || '';
            const remainingChars = maxChars - totalChars;

            if (pageText.length <= remainingChars) {
                combinedText = pageText + ' ' + combinedText;
                totalChars += pageText.length + 1;
                usedPages.unshift(getPageNumber(series.pages[i], i));
            } else {
                // Add a partial page if we're about to exceed the limit
                const startPos = pageText.length - remainingChars;
                combinedText = pageText.substring(startPos) + ' ' + combinedText;
                totalChars += remainingChars + 1;
                usedPages.unshift(getPageNumber(series.pages[i], i));
                break;
            }
        }
    }

    // Format the page references
    let pageReferences: string;
    if (usedPages.length === 1) {
        pageReferences = `Page ${usedPages[0]}`;
    } else if (usedPages.length > 1) {
        pageReferences = `Pages ${usedPages.join(', ')}`;
    } else {
        pageReferences = '';
    }

    return { text: combinedText.trim(), pageReferences };
}

/**
 * Generate meme text from content
 * @param templateId The ID of the template being used
 * @param content Content to generate meme text from
 * @param config Azure OpenAI configuration
 */
export async function generateMemeText(templateId: string, content: string, config: AzureConfig): Promise<string> {
    const client = createOpenAIClient(config);

    // Find the template information
    const template = memeTemplates.find(t => t.id === templateId);
    const templateDesc = template ? template.description : 'meme image';

    const prompt = `
You are a humor assistant specializing in creating meme captions.
Based on the text provided, generate an engaging, witty caption for a ${templateDesc} meme.
The caption should be related to the content and have an educational focus while still being humorous.
Keep it concise and impactful, preferably under 15 words.
DO NOT include any explanations or context - respond with ONLY the caption text.
`;

    try {
        const response = await client.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: prompt
                },
                {
                    role: "user",
                    content: `Content from textbook:\n\n${content.substring(0, 5000)}`
                }
            ],
            temperature: 0.7,
            max_tokens: 100
        });

        return response.choices[0]?.message?.content?.trim() || 'Failed to generate meme text';
    } catch (error) {
        console.error('Error generating meme text:', error);
        return 'Error generating meme text';
    }
}

/**
 * Create a new meme widget
 */
export function createMemeWidget(
    imageUrl: string,
    caption: string,
    altText: string,
    pageReferences: string,
    sourcePages: string[],
    concepts: string[] = []
): MemeWidget {
    return {
        id: uuidv4(),
        type: 'meme',
        imageUrl,
        caption,
        altText,
        sourcePages,
        pageReferences,
        concepts,
        createdAt: new Date().toISOString()
    };
}
