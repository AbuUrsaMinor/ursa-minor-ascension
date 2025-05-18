import { useEffect, useState } from 'react';
import { downloadAnkiExport, exportToAnkiApp, shareAnkiExport } from '../lib/ankiExport';
import type { Series } from '../types/index';
import InfoTooltip from './InfoTooltip';

interface AnkiExportButtonProps {
    series: Series;
    className?: string;
}

/**
 * Button component for exporting flashcards to AnkiApp format
 */
export function AnkiExportButton({ series, className = '' }: AnkiExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Auto-clear success message after 5 seconds
    useEffect(() => {
        let timer: number | undefined;

        if (successMessage) {
            timer = window.setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
        }

        return () => {
            if (timer) window.clearTimeout(timer);
        };
    }, [successMessage]);

    // No flashcards to export
    if (!series.flashcards || series.flashcards.length === 0) {
        return null;
    } const handleExport = async (share: boolean = false) => {
        try {
            setIsExporting(true);
            setError(null);
            setSuccessMessage(null);

            // Generate the filename
            const sanitizedName = series.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const filename = `${sanitizedName}_ankiapp.zip`;

            // Export to AnkiApp format
            const blob = await exportToAnkiApp(series, {
                deckName: series.name,
                includeSourceImages: true
            });

            // Either share or download the file
            if (share && typeof navigator !== 'undefined' && 'share' in navigator) {
                try {
                    const shared = await shareAnkiExport(blob, filename);
                    if (!shared) {
                        // Fall back to download if sharing fails or doesn't support files
                        downloadAnkiExport(blob, filename);
                        setSuccessMessage('Your AnkiApp deck has been downloaded successfully.');
                    } else {
                        setSuccessMessage('Your AnkiApp deck has been shared successfully.');
                    }
                } catch (shareError) {
                    // Sharing rejected or failed, fall back to download
                    console.warn('Sharing failed, falling back to download:', shareError);
                    downloadAnkiExport(blob, filename);
                    setSuccessMessage('Your AnkiApp deck has been downloaded successfully.');
                }
            } else {
                // Direct download
                downloadAnkiExport(blob, filename);
                setSuccessMessage('Your AnkiApp deck has been downloaded successfully.');
            }
        } catch (err) {
            console.error('Error exporting to AnkiApp format:', err);
            setError(err instanceof Error ? err.message : 'Failed to export flashcards');
            setSuccessMessage(null);
        } finally {
            setIsExporting(false);
        }
    };
    return (
        <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center">
                    <button
                        onClick={() => handleExport(false)}
                        disabled={isExporting}
                        className={`py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center ${className} ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isExporting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                                </svg>
                                Download for AnkiApp
                            </>
                        )}
                    </button>
                    <InfoTooltip
                        className="ml-1"
                        text="Export flashcards as a ZIP file compatible with AnkiApp. The file includes your questions and answers along with source page images."
                    />
                </div>{typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                        onClick={() => handleExport(true)}
                        disabled={isExporting}
                        className={`py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path>
                        </svg>
                        Share AnkiApp Deck
                    </button>
                )}
            </div>      {error && (
                <div className="mt-2 text-sm text-red-600">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mt-2 text-sm text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    {successMessage}
                </div>
            )}
        </div>
    );
}
