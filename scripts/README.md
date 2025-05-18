# StudyPack Import Utility

This script facilitates the import of StudyPack files (`*.studypack`) into the application.

## Usage

```bash
npm run import-studypack -- --file=path/to/studypack.zip
```

## Features

- Extracts StudyPack contents (flashcards and images)
- Updates the central StudyPack manifest
- Creates appropriate directory structure for web access
- Validates StudyPack format and contents

## File Structure Created

When a StudyPack is imported, the following structure is created:

```
public/studypacks/
├── manifest.json              # Central registry of all StudyPacks
└── {studypack-id}/            # Directory per StudyPack
    ├── metadata.json          # StudyPack metadata
    ├── cards.json             # Flash cards array
    └── images/                # Image files directory
        ├── {page-id-1}.png    # Page images
        ├── {page-id-2}.png
        └── ...
```

## Manifest Format

The manifest.json file is structured as:

```json
{
  "version": "1.0.0",
  "updatedAt": "2023-09-10T15:30:00.000Z",
  "packs": [
    {
      "id": "pack-uuid",
      "title": "Pack Title",
      "description": "Pack description",
      "author": "Author Name",
      "createdAt": "2023-09-05T12:00:00.000Z",
      "cardCount": 25,
      "imageCount": 10,
      "version": "1.0.0",
      "filename": "original-filename.studypack"
    },
    ...
  ]
}
```

This script is designed to be used by application developers to integrate content provided by content creators. Students access the imported content through the StudyPack Library component in the application.
