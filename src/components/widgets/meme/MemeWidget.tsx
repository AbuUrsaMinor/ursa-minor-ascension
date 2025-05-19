// filepath: c:\Users\A550191\git\ursa-minor-ascension\src\components\widgets\meme\MemeWidget.tsx
import { useState } from 'react';
import type { MemeWidget as MemeWidgetType } from '../../../types';

interface MemeWidgetProps {
    widget: MemeWidgetType;
    onShare?: (widget: MemeWidgetType) => void;
}

export function MemeWidget({ widget, onShare }: MemeWidgetProps) {
    const [enlarged, setEnlarged] = useState(false);

    // Toggle enlarged view
    const toggleEnlarged = () => {
        setEnlarged(!enlarged);
    };

    // Handle sharing
    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onShare) {
            onShare(widget);
        }
    };

    return (
        <div
            className={`bg-white rounded-lg shadow border border-gray-200 overflow-hidden transition-all duration-300 ${enlarged ? "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" : ""}
                }`}
            onClick={toggleEnlarged}
        >
            <div className={enlarged ? "relative max-w-2xl max-h-full" : ""}>
                {/* Close button when enlarged */}
                {enlarged && (
                    <button
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            setEnlarged(false);
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                <div className={`${enlarged ? "" : "p-3"}`}>
                    {!enlarged && <div className="text-xs text-gray-500 mb-2">Meme</div>}

                    {/* Meme image */}
                    <div className="relative rounded overflow-hidden bg-gray-800">
                        {widget.imageUrl ? (
                            <img
                                src={widget.imageUrl}
                                alt={widget.altText || widget.caption}
                                className="w-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-48 bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-500">Image unavailable</span>
                            </div>
                        )}

                        {/* Caption overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-black bg-opacity-70 text-white font-bold text-center text-lg uppercase">
                            {widget.caption}
                        </div>
                    </div>

                    {/* Metadata and actions (only show when not enlarged) */}
                    {!enlarged && (
                        <div className="mt-3">
                            {/* Source and concepts */}
                            <div className="flex flex-wrap gap-1 text-xs text-gray-500 mt-2 mb-2">
                                {widget.concepts.map((concept, index) => (
                                    <span key={index} className="px-2 py-1 bg-gray-100 rounded-full">
                                        {concept}
                                    </span>
                                ))}
                            </div>

                            {/* Page references */}
                            {widget.pageReferences && (
                                <div className="text-xs text-gray-500">
                                    Source: {widget.pageReferences}
                                </div>
                            )}

                            {/* Share button */}
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={handleShare}
                                    className="flex items-center px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
