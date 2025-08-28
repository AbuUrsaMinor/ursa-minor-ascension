import { useState } from 'react';
import { memeTemplates } from '../../../lib/memeService';

interface MemeTemplateGalleryProps {
    onSelect: (templateId: string) => void;
}

export function MemeTemplateGallery({ onSelect }: MemeTemplateGalleryProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    const handleSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        onSelect(templateId);
    };

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Select a Meme Template</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {memeTemplates.map((template) => (
                    <div
                        key={template.id}
                        className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                        onClick={() => handleSelect(template.id)}
                    >
                        <div className="aspect-w-4 aspect-h-3 relative">
                            <img
                                src={template.path}
                                alt={template.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/assets/placeholder.png';
                                }}
                            />
                        </div>
                        <div className="p-2 bg-gray-50">
                            <p className="text-sm font-medium truncate">{template.name}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
