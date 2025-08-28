import { useEffect, useState } from 'react';
import { useAzure } from '../../../context/AzureContext';
import { createMemeWidget, generateMemeText, getRandomPageRange, memeTemplates } from '../../../lib/memeService';
import type { MemeWidget as MemeWidgetType, Series } from '../../../types';
import { MemeTemplateGallery } from './MemeTemplateGallery';

interface MemeWidgetCreatorProps {
    series: Series;
    onWidgetCreated: (widget: MemeWidgetType) => void;
    onCancel: () => void;
}

export function MemeWidgetCreator({ series, onWidgetCreated, onCancel }: MemeWidgetCreatorProps) {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [generatedCaption, setGeneratedCaption] = useState<string>('');
    const [customCaption, setCustomCaption] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState<boolean>(false); const [currentCaption, setCurrentCaption] = useState<string>('Your caption will appear here');

    // Get Azure configuration
    const { endpoint, apiKey } = useAzure();
    const azureConfig = endpoint && apiKey ? { endpoint, apiKey } : null;

    // Get the selected template
    const selectedTemplate = selectedTemplateId
        ? memeTemplates.find(t => t.id === selectedTemplateId)
        : null;

    // Update current caption when either generated or custom caption changes
    useEffect(() => {
        if (customCaption) {
            setCurrentCaption(customCaption);
        } else if (generatedCaption) {
            setCurrentCaption(generatedCaption);
        }
    }, [generatedCaption, customCaption]);

    // Handle template selection
    const handleSelectTemplate = (templateId: string) => {
        setSelectedTemplateId(templateId);
        // Reset captions when template changes
        setGeneratedCaption('');
        setCustomCaption('');
        setCurrentCaption('Your caption will appear here');
        setPreviewMode(false);
    };

    // Generate meme caption using Azure OpenAI
    const handleGenerateCaption = async () => {
        if (!selectedTemplateId || !azureConfig) {
            setError('Please select a template first');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {            // Get random content from pages
            const { text } = getRandomPageRange(series);

            if (!text) {
                setError('No content available to generate caption');
                setIsGenerating(false);
                return;
            }

            // Generate caption
            const caption = await generateMemeText(selectedTemplateId, text, azureConfig);
            setGeneratedCaption(caption);
            setCustomCaption(''); // Clear custom caption when a new one is generated
            setPreviewMode(true);
        } catch (err) {
            setError(`Error generating caption: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Create and save the meme widget
    const handleCreateWidget = () => {
        if (!selectedTemplateId || !selectedTemplate || !currentCaption) {
            setError('Please select a template and generate or enter a caption');
            return;
        }

        try {
            // Get page data for attribution
            const { pageReferences } = getRandomPageRange(series);

            // Extract page IDs 
            const sourcePages = series.pages.slice(0, 3).map(page => page.id);

            // Create simple concepts
            const concepts = ['meme', 'visual', 'humor'];

            // Create widget
            const widget = createMemeWidget(
                selectedTemplate.path,
                currentCaption,
                `${selectedTemplate.name} meme: ${currentCaption}`,
                pageReferences || 'Generated content',
                sourcePages,
                concepts
            );

            // Pass to parent component
            onWidgetCreated(widget);
        } catch (err) {
            setError(`Error creating widget: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Create Meme Widget</h2>

            {/* Template Selection */}
            <MemeTemplateGallery onSelect={handleSelectTemplate} />

            {selectedTemplateId && (
                <div className="mt-6">
                    {/* Caption Controls */}
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Meme Caption</h3>

                        <div className="flex space-x-4 mb-4">
                            <button
                                onClick={handleGenerateCaption}
                                disabled={isGenerating || !azureConfig}
                                className={`px-4 py-2 rounded-md ${isGenerating
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {isGenerating ? 'Generating...' : 'Generate Caption with AI'}
                            </button>

                            <button
                                onClick={() => setPreviewMode(true)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                            >
                                Preview
                            </button>
                        </div>

                        {/* Custom Caption Input */}
                        <div className="mb-4">
                            <label htmlFor="custom-caption" className="block text-sm font-medium text-gray-700 mb-1">
                                Or write your own caption:
                            </label>
                            <input
                                id="custom-caption"
                                type="text"
                                value={customCaption}
                                onChange={(e) => setCustomCaption(e.target.value)}
                                placeholder="Enter your own caption here"
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="text-red-600 mb-4">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    {previewMode && selectedTemplate && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">Preview</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="relative">
                                    <img
                                        src={selectedTemplate.path}
                                        alt={selectedTemplate.name}
                                        className="w-full"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/assets/placeholder.png';
                                        }}
                                    />                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-black bg-opacity-70">
                                        {/* Classic Meme Caption Styling */}
                                        <p className="text-center text-lg meme-text">
                                            {currentCaption}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleCreateWidget}
                            disabled={!currentCaption || currentCaption === 'Your caption will appear here'}
                            className={`px-4 py-2 rounded-md ${!currentCaption || currentCaption === 'Your caption will appear here'
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            Create Meme Widget
                        </button>                    </div>
                </div>
            )}
        </div>
    );
}
