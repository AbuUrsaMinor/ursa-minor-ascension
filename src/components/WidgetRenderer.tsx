import { lazy, Suspense } from 'react';
import type { Series, Widget } from '../types';
import { FlashCardItem } from './widgets/flashcard/FlashCardItem';

// Lazy load widget components to improve initial load time
const ClozeWidget = lazy(() => import('./widgets/cloze/ClozeWidget').then(module => ({ default: module.ClozeWidget })));
const MemeWidget = lazy(() => import('./widgets/meme/MemeWidget').then(module => ({ default: module.MemeWidget })));
const TrueFalseWidget = lazy(() => import('./widgets/truefalse/TrueFalseWidget').then(module => ({ default: module.TrueFalseWidget })));

// Add more imports for other widget types as they are implemented

interface WidgetRendererProps {
    widget: Widget;
    series: Series;
    onDelete?: (widgetId: string) => void;
    onComplete?: (widgetId: string) => void;
}

export function WidgetRenderer({ widget, series, onDelete, onComplete }: WidgetRendererProps) {
    // Loading fallback
    const fallback = (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    // Handle widget completion
    const handleComplete = () => {
        if (onComplete) {
            onComplete(widget.id);
        }
    };

    // Handle widget deletion
    const handleDelete = () => {
        if (onDelete) {
            onDelete(widget.id);
        }
    };

    // Render widget based on type
    const renderWidget = () => {
        switch (widget.type) {
            case 'flashcard':
                return (
                    <FlashCardItem
                        card={widget}
                        series={series}
                        isSelected={false}
                        onClick={handleComplete}
                        onDelete={handleDelete}
                    />
                );

            case 'cloze':
                return (
                    <Suspense fallback={fallback}>
                        <ClozeWidget
                            widget={widget}
                            onComplete={handleComplete}
                        />
                    </Suspense>
                );

            case 'truefalse':
                return (
                    <Suspense fallback={fallback}>
                        <TrueFalseWidget
                            widget={widget}
                            onComplete={handleComplete}
                        />
                    </Suspense>
                );

            case 'meme':
                return (
                    <Suspense fallback={fallback}>
                        <MemeWidget
                            widget={widget}
                            onShare={() => handleComplete()}
                        />
                    </Suspense>
                );

            // Add cases for the other widget types as they are implemented

            default:
                return (
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="text-xs text-gray-500 mb-2">{widget.type}</div>
                        <p className="text-lg text-center py-4">
                            This widget type is not yet implemented.
                        </p>
                    </div>
                );
        }
    };

    return renderWidget();
}
