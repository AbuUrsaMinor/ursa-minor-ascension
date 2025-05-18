/**
 * Utility for handling StudyPack manifest loading
 */

import type { StudyPackManifest } from '../components/StudyPackLibrary';

/**
 * Default manifest with test data
 * Used as a fallback when the manifest.json cannot be loaded
 */
export const DEFAULT_MANIFEST: StudyPackManifest = {
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    packs: [
        {
            id: "c44cb1b6-fd51-48c5-b108-97670254af99",
            title: "Fryspåsar",
            description: "Hello",
            author: "Det är jag det",
            createdAt: "2025-05-18T17:32:25.332Z",
            cardCount: 5,
            imageCount: 1,
            version: "1.0.0"
        }
    ]
};

/**
 * Loads the manifest file, with fallback to default data
 */
export async function loadStudyPackManifest(): Promise<StudyPackManifest> {
    try {
        const basePaths = [
            './studypacks',
            '/studypacks',
            '/public/studypacks',
            '../studypacks',
            '../../studypacks'
        ];

        let manifest = null;

        // Try each path
        for (const basePath of basePaths) {
            try {
                const url = `${basePath}/manifest.json`;
                console.log('Trying to load manifest from:', url);
                const response = await fetch(url);

                if (response.ok) {
                    manifest = await response.json();
                    console.log('Successfully loaded manifest from:', url);
                    return manifest;
                }
            } catch (err) {
                console.warn(`Failed to fetch manifest from ${basePath}, trying next...`);
            }
        }

        console.warn('Could not load manifest from any path, using default data');
        return DEFAULT_MANIFEST;
    } catch (error) {
        console.error('Error loading StudyPack manifest:', error);
        // Return the default manifest as fallback
        return DEFAULT_MANIFEST;
    }
}
