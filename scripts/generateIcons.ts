#!/usr/bin/env node
import fs from 'fs';
import { resolve } from 'path';
import sharp from 'sharp';

// Define the base icon path
const sourceIcon = resolve('public', 'vite.svg');

// Define the sizes we want to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create the icons directory if it doesn't exist
const iconsDir = resolve('public', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
    console.log('Generating PWA icons...');

    try {
        // Generate PNG icons in different sizes
        for (const size of sizes) {
            const outputPath = resolve(iconsDir, `icon-${size}x${size}.png`);

            await sharp(sourceIcon)
                .resize(size, size)
                .toFormat('png')
                .toFile(outputPath);

            console.log(`Generated: ${outputPath}`);
        }

        // Generate apple touch icon
        await sharp(sourceIcon)
            .resize(180, 180)
            .toFormat('png')
            .toFile(resolve(iconsDir, 'apple-touch-icon.png'));

        // Generate favicon
        await sharp(sourceIcon)
            .resize(32, 32)
            .toFormat('png')
            .toFile(resolve('public', 'favicon.png'));

        console.log('Icon generation complete!');
    } catch (error) {
        console.error('Error generating icons:', error);
        process.exit(1);
    }
}

generateIcons().catch(console.error);