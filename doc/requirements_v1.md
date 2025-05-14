### **Ursa Minor Ascension — Functional & Technical Requirements**

---

#### 1  Key Management & First‑Run Flow

| ID      | Requirement                                                                                                                                                                             |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **K‑1** | On the very first launch the app displays a **modal** that asks the user to paste a single Base‑64 encoded “connection key”.                                                            |
| **K‑2** | The key format is `base64( { "endpoint": "<url>", "apiKey": "<secret>" } )`.                                                                                                            |
| **K‑3** | Upon submission the app **decodes** the string, validates JSON shape, and keeps `endpoint` + `apiKey` **only in memory** (never in IndexedDB, `localStorage`, or service‑worker cache). |
| **K‑4** | The original Base‑64 string is stored in IndexedDB under `settings.connectionKey`.                                                                                                      |
| **K‑5** | If the key is missing or invalid, the modal blocks further UI interaction until a valid key is provided.                                                                                |

---

#### 2  CLI / Dev Tooling

| ID        | Requirement                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CLI‑1** | Provide an **npm script** (`npm run gen:key`) that reads two **local environment variables** – `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_KEY` – and prints a ready‑to‑paste Base‑64 string. |
| **CLI‑2** | The script **must not** commit, echo, or write the raw endpoint/key to disk or repo; only the encoded string is displayed to stdout.                                                        |
| **CLI‑3** | Script exits with non‑zero status and a helpful message if the env vars are absent.                                                                                                         |

---

#### 3  Dashboard (Main Screen)

| ID      | Requirement                                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **D‑1** | After a successful key setup, the root route (`/`) shows a **mobile‑first dashboard** listing all saved **Series** (ordered newest‑first). |
| **D‑2** | Each Series card displays: name, page count, date created, and a thumbnail of the first page.                                              |
| **D‑3** | A floating **“➕ New Series”** button is always visible.                                                                                    |

---

#### 4  Creating a New Series

| ID      | Requirement                                                                                                                                                                                   |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S‑1** | Tapping **New Series** starts the **camera workflow**.                                                                                                                                        |
| **S‑2** | The app requests `getUserMedia` for the **rear camera** (`facingMode: environment`).                                                                                                          |
| **S‑3** | For each captured photo:                                                                                                                                                                      |
|   S‑3a  | Show a lightweight preview plus **Retake / Use Photo** options.                                                                                                                               |
|   S‑3b  | When confirmed, immediately **upload** the image to Azure GPT‑4o with a prompt that asks for: *verbatim text*, *alt‑text for every figure*, and any *metadata* (page #, chapter, book title). |
| **S‑4** | While Azure is processing, display a non‑blocking progress indicator; failures show retry option.                                                                                             |
| **S‑5** | Parsed data is stored in an **in‑memory draft Series object** and persisted to IndexedDB only when the user saves the Series.                                                                 |
| **S‑6** | The capture screen contains **Add Another Page** and **Finish Series** buttons at all times after at least one page is recorded.                                                              |

---

#### 5  Review & Edit Pages

| ID      | Requirement                                                                                                     |
| ------- | --------------------------------------------------------------------------------------------------------------- |
| **R‑1** | After **Finish Series**, the app navigates to the **Series Review** screen showing page thumbnails in order.    |
| **R‑2** | For each page: buttons **Retake**, **Delete**, **Edit Text** (opens a textarea overlay).                        |
| **R‑3** | A **Save Series** button (enabled only if ≥ 1 page remains) and a **Discard** button (confirmation dialog).     |
| **R‑4** | On save, user must supply a **Series Name** (unique, non‑empty).                                                |
| **R‑5** | The finalized Series (metadata + pages + extracted text) is persisted to IndexedDB and the dashboard refreshes. |

---

#### 6  Data Storage

| ID       | Requirement                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| **DB‑1** | Use **IndexedDB** (via `idb` wrapper) with an object store `series`.                                               |
| **DB‑2** | Each Series record contains: `id`, `name`, `createdAt`, `pages[ {id, imageBlob, text, imageDescriptions, meta} ]`. |
| **DB‑3** | No Azure credentials are ever written to IndexedDB.                                                                |
| **DB‑4** | Provide migration stubs (versioned schema).                                                                        |

---

#### 7  Non‑Functional Requirements

| Category          | Specification                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Performance**   | First contentful paint ≤ 2 s on iPhone SE2 over 4G; subsequent loads offline via service‑worker.    |
| **PWA**           | Must pass Lighthouse PWA audit ≥ 90 and installable from Safari (manifest + standalone display).    |
| **Accessibility** | WCAG 2.1 AA – focus states, alt text, ARIA labels for buttons.                                      |
| **Security**      | All network calls over HTTPS; Content‑Security‑Policy blocks inline scripts except Vite dev server. |
| **Privacy**       | Photos & extracted text reside only on device; user can delete Series (data wipes from IndexedDB).  |

---

#### 8  Error & Edge‑Case Handling

1. **Camera denied** → show instructions to enable permissions in iOS Settings.
2. **Azure 4xx/5xx** → exponential back‑off (max 3 retries) then surface “Failed to process page” with retry.
3. **Storage quota exceeded** → prompt to delete older Series.
4. **IndexedDB unavailable** (Private Mode) → app enters read‑only “Demo” mode with explanatory banner.

---

These requirements set the functional baseline for **Ursa Minor Ascension** and should guide all implementation and review discussions.
