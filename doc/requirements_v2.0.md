### **Ursa Minor Ascension — Functional & Technical Requirements (v2.0)**

---

This document outlines the changes and additions to be implemented in version 2.0 of the Ursa Minor Ascension application. These requirements should be read alongside the base requirements in `requirements_v1.md` and the updates in `requirements_v1.1.md`.

---

#### 1. Flash Card Generation

| ID       | Requirement                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **FC‑1** | Add a **Generate Flash Cards** button on the **Series Detail** screen for existing Series.                                                |
| **FC‑2** | When generating flash cards, display a non-blocking progress indicator with status updates.                                               |
| **FC‑3** | Flash cards consist of question/answer pairs automatically generated from the Series content.                                             |
| **FC‑4** | Each answer must include references to the specific page number(s) where the information was sourced.                                     |
| **FC‑5** | Store flash cards as part of the Series object in IndexedDB with a new `flashcards` property.                                             |

---

#### 2. Flash Card Content Processing

| ID       | Requirement                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **CP‑1** | Use a **Web Worker** to perform flash card generation to avoid blocking the main UI thread.                                               |
| **CP‑2** | Implement content processing in batches to handle Series that may exceed LLM context limits.                                              |
| **CP‑3** | Estimate the potential number of flash cards by counting unique high-salience concepts after chunking the Series content.                 |
| **CP‑4** | Allow users to specify a target number of flash cards to generate (default: 10, min: 5, max: 50).                                         |
| **CP‑5** | Process content through Azure OpenAI using structured output format to ensure consistent data extraction.                                 |
| **CP‑6** | Use embedding-based similarity checks to ensure comprehensive topic coverage across the Series content.                                   |
| **CP‑7** | Implement local vector-store similarity checks to prevent duplicate or near-duplicate flash cards (similarity threshold: 0.92).           |

---

#### 3. Flash Card Schema

| ID       | Requirement                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **FS‑1** | Define a JSON schema for flash cards with the following properties:                                                                       |
|   FS‑1a  | `id` (string): Unique identifier for the flash card.                                                                                      |
|   FS‑1b  | `question` (string): The question text.                                                                                                   |
|   FS‑1c  | `answer` (string): The answer text.                                                                                                       |
|   FS‑1d  | `sourcePages` (array): Array of page IDs or numbers where the answer information is found.                                                |
|   FS‑1e  | `difficulty` (string, enum): Estimated difficulty level ("easy", "medium", "hard").                                                       |
|   FS‑1f  | `concepts` (array): Array of key concepts covered by this flash card.                                                                     |
| **FS‑2** | Include complete field descriptions in the schema sent to OpenAI to ensure high-quality data extraction.                                  |
| **FS‑3** | Validate all generated flash cards against this schema using Zod before storing.                                                          |

---

#### 4. Flash Card Management

| ID       | Requirement                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **FM‑1** | After generation, display flash cards in a list view with question previews.                                                              |
| **FM‑2** | Allow users to edit, delete, or manually add individual flash cards.                                                                      |
| **FM‑3** | Provide a filter mechanism to view flash cards by difficulty level or source page.                                                        |
| **FM‑4** | Allow users to regenerate specific flash cards that they find unsatisfactory.                                                             |
| **FM‑5** | Support bulk operations: regenerate all, delete all, export to CSV/JSON.                                                                  |

---

#### 5. Flash Card UI Components

| ID       | Requirement                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **UI‑1** | Create a dedicated **Flash Cards** tab or section within the **Series Detail** screen.                                                    |
| **UI‑2** | Design a card component that displays the question on the "front" and the answer with source references on the "back".                    |
| **UI‑3** | Implement a simple flip animation when viewing cards.                                                                                     |
| **UI‑4** | Include visual indicators for card difficulty levels (e.g., color coding).                                                                |
| **UI‑5** | Show source page references as clickable links that navigate to the corresponding page in the Series.                                     |

---

#### 6. Changes to Existing Requirements

The following requirements from previous versions have been modified:

| Section | ID     | Original Requirement | Modified Requirement for v2.0 |
| ------- | ------ | ------------------- | ----------------------------- |
| 6 | **DB‑2** | Each Series record contains: `id`, `name`, `createdAt`, `pages[ {id, imageBlob, text, imageDescriptions, meta} ]`. | Each Series record contains: `id`, `name`, `createdAt`, `pages[ {id, imageBlob, text, imageDescriptions, meta} ]`, `flashcards[ {id, question, answer, sourcePages, difficulty, concepts} ]`. |
| 3 | **D‑2** | Each Series card displays: name, page count, date created, and a thumbnail of the first page. | Each Series card displays: name, page count, flash card count (if any), date created, and a thumbnail of the first page. |

---

#### 7. Non-Functional Requirements Additions

| Category          | Specification                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Performance**   | Flash card generation should process at least 10 pages per minute.                                  |
| **Memory Usage**  | The Web Worker should implement chunking to handle Series of any size without memory issues.        |
| **Offline**       | Flash card editing and viewing must work offline; generation requires connectivity.                 |

---

#### 8. Error & Edge-Case Handling Additions

1. **LLM Context Limit Exceeded** → Automatically chunk content and process in batches.
2. **Topic Coverage Gaps** → Implement detection and regeneration of cards for underrepresented topics.
3. **Duplicate Answers** → Use vector similarity to detect and rephrase or filter duplicates.
4. **Incorrect Source Pages** → Validate that answer content aligns with referenced pages.

---

These requirements define the changes to be implemented in **Ursa Minor Ascension v2.0** and should guide all implementation and review discussions.
