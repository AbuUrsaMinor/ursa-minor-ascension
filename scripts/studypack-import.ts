/**
 * StudyPack Import Utility Script
 * 
 * This script automates the process of importing StudyPack files into the application.
 * It extracts the StudyPack, validates its contents, and updates the manifest file.
 * 
 * Usage:
 *   npm run import-studypack -- --file=path/to/studypack.zip
 */

import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Types
interface StudyPackManifestEntry {
    id: string;
    title: string;
    description: string;
    author: string;
    createdAt: string;
    cardCount: number;
    imageCount: number;
    version: string;
    filename: string;
}

interface StudyPackManifest {
    version: string;
    updatedAt: string;
    packs: StudyPackManifestEntry[];
}

interface StudyPackMetadata {
    id: string;
    title: string;
    description: string;
    author: string;
    createdAt: string;
    cardCount: number;
    hasImages: boolean;
    version: string;
}

// Constants
const STUDYPACKS_DIR = path.join(process.cwd(), 'public', 'studypacks');
const MANIFEST_PATH = path.join(STUDYPACKS_DIR, 'manifest.json');

// Parse command line arguments
const args = process.argv.slice(2);
const fileArg = args.find(arg => arg.startsWith('--file='));
const filePath = fileArg ? fileArg.split('=')[1] : '';

if (!filePath) {
    console.error('Error: No StudyPack file specified.');
    console.log('Usage: npm run import-studypack -- --file=path/to/studypack.zip');
    process.exit(1);
}

// Ensure the studypacks directory exists
async function ensureDirectories() {
    if (!fs.existsSync(STUDYPACKS_DIR)) {
        console.log(`Creating directory: ${STUDYPACKS_DIR}`);
        fs.mkdirSync(STUDYPACKS_DIR, { recursive: true });
    }

    // Ensure manifest exists
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.log('Creating initial manifest file');
        const initialManifest: StudyPackManifest = {
            version: '1.0.0',
            updatedAt: new Date().toISOString(),
            packs: []
        };
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(initialManifest, null, 2));
    }
}

// Load manifest file
function loadManifest(): StudyPackManifest {
    const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    return JSON.parse(manifestContent) as StudyPackManifest;
}

// Save manifest file
function saveManifest(manifest: StudyPackManifest) {
    manifest.updatedAt = new Date().toISOString();
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

// Process the study pack
async function processStudyPack(studyPackPath: string) {
    console.log(`Processing StudyPack: ${studyPackPath}`);

    // Check if file exists
    if (!fs.existsSync(studyPackPath)) {
        console.error(`Error: File not found: ${studyPackPath}`);
        process.exit(1);
    }

    try {
        // Read the file
        const fileData = fs.readFileSync(studyPackPath);

        // Extract the ZIP file
        const zip = await JSZip.loadAsync(fileData);
        // Read the studypack.json file from the ZIP
        const studyPackFile = zip.file('studypack.json');
        if (!studyPackFile) {
            console.error('Error: Invalid StudyPack format. Missing studypack.json');
            process.exit(1);
        }

        const studyPackFileData = await studyPackFile.async('string');
        // Parse the StudyPack data
        const studyPack = JSON.parse(studyPackFileData);
        const metadata = studyPack.metadata as StudyPackMetadata;
        const cards = studyPack.cards || [];

        if (!metadata || !metadata.id || !metadata.title) {
            console.error('Error: Invalid StudyPack metadata');
            process.exit(1);
        }

        if (!cards || !Array.isArray(cards) || cards.length === 0) {
            console.warn('Warning: No flash cards found in StudyPack');
        }

        // Generate a unique ID for the pack if it doesn't have one
        const packId = metadata.id || uuidv4();

        // Create directory for this pack
        const packDir = path.join(STUDYPACKS_DIR, packId);
        if (!fs.existsSync(packDir)) {
            fs.mkdirSync(packDir, { recursive: true });
        }

        // Extract all files from the ZIP to the pack directory
        console.log(`Extracting files to ${packDir}`);
        const imageFiles: string[] = [];

        // Process each file in the zip
        const zipEntries = Object.keys(zip.files);
        for (const entry of zipEntries) {
            // Skip directories
            if (zip.files[entry].dir) continue;

            // Skip the metadata file - we'll recreate it
            if (entry === 'studypack.json') continue;

            // Process image files
            if (entry.startsWith('images/')) {
                const fileName = path.basename(entry);
                const fileData = await zip.files[entry].async('nodebuffer');
                const outputPath = path.join(packDir, 'images', fileName);

                // Ensure the images directory exists
                if (!fs.existsSync(path.join(packDir, 'images'))) {
                    fs.mkdirSync(path.join(packDir, 'images'), { recursive: true });
                }

                fs.writeFileSync(outputPath, fileData);
                imageFiles.push(fileName);
                continue;
            }

            // Extract any other files
            const fileData = await zip.files[entry].async('nodebuffer');
            const outputPath = path.join(packDir, entry);

            // Create parent directories if needed
            const parentDir = path.dirname(outputPath);
            if (!fs.existsSync(parentDir)) {
                fs.mkdirSync(parentDir, { recursive: true });
            }

            fs.writeFileSync(outputPath, fileData);
        }
        // Save the metadata to the pack directory
        const packMetadata = {
            ...metadata,
            id: packId,
            imageCount: imageFiles.length
        };
        fs.writeFileSync(
            path.join(packDir, 'metadata.json'),
            JSON.stringify(packMetadata, null, 2)
        );

        // Save the cards as a separate JSON file
        fs.writeFileSync(
            path.join(packDir, 'cards.json'),
            JSON.stringify(cards, null, 2)
        );

        // Update the manifest
        const manifest = loadManifest();

        // Check if this pack already exists in the manifest
        const existingPackIndex = manifest.packs.findIndex(p => p.id === packId);

        // Create the manifest entry
        const manifestEntry: StudyPackManifestEntry = {
            id: packId,
            title: metadata.title,
            description: metadata.description || '',
            author: metadata.author || 'Unknown',
            createdAt: metadata.createdAt || new Date().toISOString(),
            cardCount: cards.length,
            imageCount: imageFiles.length,
            version: metadata.version || '1.0.0',
            filename: path.basename(studyPackPath)
        };

        // Update or add to the manifest
        if (existingPackIndex !== -1) {
            manifest.packs[existingPackIndex] = manifestEntry;
            console.log(`Updated existing pack "${metadata.title}" in manifest`);
        } else {
            manifest.packs.push(manifestEntry);
            console.log(`Added new pack "${metadata.title}" to manifest`);
        }

        // Save the updated manifest
        saveManifest(manifest);
        console.log(`✅ Successfully imported StudyPack: ${metadata.title}`);
        console.log(`   ID: ${packId}`);
        console.log(`   Cards: ${cards.length}`);
        console.log(`   Images: ${imageFiles.length}`);

        return packId;
    } catch (error) {
        console.error('Error processing StudyPack:', error);
        process.exit(1);
    }
}

// Main function
async function main() {
    try {
        await ensureDirectories();
        await processStudyPack(filePath);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run the script
main();
