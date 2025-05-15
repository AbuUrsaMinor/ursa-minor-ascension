### **Ursa Minor Ascension — Functional & Technical Requirements (v1.1)**

---

This document outlines the changes and additions to be implemented in version 1.1 of the Ursa Minor Ascension application. These requirements should be read alongside the base requirements in `requirements_v1.md`.

---

#### 1. Structured Outputs for Data Extraction

| ID       | Requirement                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **SO‑1** | When sending requests to Azure OpenAI, use the **structured output feature** to ensure consistent data extraction.                        |
| **SO‑2** | Define a JSON schema with clear field descriptions that includes the following properties:                                                |
|   SO‑2a  | `text` (string): A verbatim, HTML representation of the page, including captions/descriptions of images.                                  |
|   SO‑2b  | `page` (string): The page number, if available.                                                                                           |
|   SO‑2c  | `chapter_name` (string): The chapter name, if available.                                                                                  |
|   SO‑2d  | `title` (string): The book title, if available.                                                                                           |
| **SO‑3** | Include complete field descriptions in the schema sent to OpenAI to ensure high-quality data extraction.                                  |
| **SO‑4** | Update parsing logic in the application to handle responses according to the new structured output schema.                                |
| **SO‑5** | Implement using the Zod schema validation library as described in this Azure OpenAI example: https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/openai/openai/samples/v2-beta/typescript/src/chatCompletionsWithStructuredOutput.ts

---

#### 2. Background Processing of Pages

| ID       | Requirement                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **BP‑1** | Process captured images in the background, allowing users to continue capturing new pages without waiting.                                |
| **BP‑2** | Maintain a processing queue for captured images, with a status indicator for each page.                                                   |
| **BP‑3** | Show real-time status updates as pages are processed (e.g., "Processing 2/5 pages...").                                                   |
| **BP‑4** | If processing fails for a page, allow individual retries without disrupting the processing of other pages.                                |
| **BP‑5** | Pages should be added to the Series draft immediately upon capture, with metadata updated asynchronously as processing completes.         |
| **BP‑6** | The series information should be updated in real-time as background processes complete.                                                   |

---

#### 3. Changes to Existing Requirements

The following requirements from v1.0 have been modified:

| Section | ID     | Original Requirement | Modified Requirement for v1.1 |
| ------- | ------ | ------------------- | ----------------------------- |
| 4 | **S‑3b** | When confirmed, immediately **upload** the image to Azure GPT‑4o with a prompt that asks for: *verbatim text*, *alt‑text for every figure*, and any *metadata* (page #, chapter, book title). | When confirmed, immediately initiate **background processing** of the image while allowing the user to continue capturing additional photos. |
| 4 | **S‑3c** | *New requirement* | Each image is uploaded to Azure GPT‑4o with a structured output prompt that requests extraction of specific fields in a JSON schema format: *text*, *page number*, *chapter name*, and *book title*. |
| 4 | **S‑4** | While Azure is processing, display a non-blocking progress indicator; failures show retry option. | While Azure is processing, display a non‑blocking progress indicator for each page; the user can continue to capture new pages without waiting for previous pages to be processed. |
| 4 | **S‑5** | Parsed data is stored in an **in‑memory draft Series object** and persisted to IndexedDB only when the user saves the Series. | Parsed data is stored in an **in‑memory draft Series object**. As background processing completes for each page, the draft is updated with the extracted information and the UI reflects the updated information. |

---

These requirements define the changes to be implemented in **Ursa Minor Ascension v1.1** and should guide all implementation and review discussions.
