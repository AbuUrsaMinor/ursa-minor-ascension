# StudyPack Export and Import Guide

This document provides instructions for both content creators and developers on how to use the StudyPack export and import functionality in Ursa Minor Ascension.

## For Content Creators: Exporting StudyPacks

Content creators can create and export StudyPacks from their series with the following steps:

1. Create a series with pages and generate flashcards for it
2. Click the "Export for Integration" button in the Flash Cards view
3. Fill in the export form:
   - **Title**: A descriptive title for your StudyPack
   - **Description**: Optional information about the content
   - **Author**: Your name or organization
   - **Include source images**: Whether to include page images with the flashcards (recommended)
4. Click "Export" to download the StudyPack file (`.studypack` extension)
5. Send the generated file to the application developer for integration

### Tips for Creating Quality StudyPacks

- Use clear, concise titles that describe the subject matter
- Include a detailed description that helps students understand what they'll learn
- Make sure your flashcards cover a complete topic area
- Review flashcards for accuracy before exporting
- Consider creating theme-based or difficulty-level-based StudyPacks

## For Developers: Importing StudyPacks

Developers can import StudyPacks into the application using the provided utility script:

1. Place the received `.studypack` file in a location accessible to the project
2. Open a terminal in the project root directory
3. Run the import command:
   ```bash
   npm run import-studypack -- --file=path/to/studypack.zip
   ```
4. The script will:
   - Extract the StudyPack contents
   - Save the metadata and cards in the appropriate format
   - Update the manifest file
   - Provide feedback on the import process
5. The StudyPack will be immediately available to users in the StudyPack Library

### Accessing StudyPacks in the Application

After import, students can access the StudyPacks through:

1. **StudyPack Library**: Available from the Dashboard via the "StudyPack Library" button in the top-right corner
2. **URL Access**: Direct navigation to `/studypacks` in the application
3. **Individual StudyPack View**: Direct navigation to `/studypack/{id}` to view a specific StudyPack

The StudyPack Library displays all available StudyPacks with their metadata, and students can click on any StudyPack to view its flashcards and content.

### Technical Details

The import script performs the following operations:
- Creates a directory in `public/studypacks/{id}` for the StudyPack
- Extracts all images to an `images` subdirectory
- Creates `metadata.json` and `cards.json` in the StudyPack directory
- Updates the central manifest file (`public/studypacks/manifest.json`)

### Managing StudyPacks

To remove a StudyPack:
1. Delete the StudyPack's directory from `public/studypacks/{id}`
2. Edit the manifest file (`public/studypacks/manifest.json`) to remove the entry

## StudyPack Format Details

StudyPacks are ZIP files containing:
- `studypack.json`: Contains metadata and flashcards
- `images/`: Directory containing referenced page images
- `README.md`: Human-readable information about the StudyPack

The internal structure follows a specific schema to ensure compatibility with the application.
