# Phase 11: Report Generation, Document Export & Sharing

## 1. Overview
Phase 11 introduces a report-generation, document-export, and secure-sharing engine to WrapAI. The system synthesizes structured data from existing transcripts, speaker diarization, and LLM analysis into formatted reports across multiple formats (**PDF**, **DOCX**, **Markdown**, and **TXT**) with zero unnecessary LLM re-computation.

---

## 2. Architecture & Data Flow

```
                      React Client (ReportTab / ReportsList)
                                      │
                                      ▼
                               Express API Gateway
                                      │
                                      ▼
                        [reportService.previewReport]
                                      │
                                      ▼
                               [reportBuilder]
                      (Deterministic Synthesis from DB)
                                      │
                      ┌───────────────┴───────────────┐
                      ▼                               ▼
             [Instant Live Preview]          [BullMQ Report Queue]
                                                      │
                                                      ▼
                                               [Report Worker]
                                                      │
                                                      ▼
                                            [Structured Report]
                                                      │
                         ┌─────────────┬──────────────┼─────────────┐
                         ▼             ▼              ▼             ▼
                    [PDF Engine]  [DOCX Engine]  [Markdown Engine] [TXT Engine]
                      (pdfkit)       (docx)
                         │             │              │             │
                         └─────────────┼──────────────┴─────────────┘
                                       ▼
                             [Object Storage (S3 / Local)]
                                       │
                                       ▼
                                [MongoDB Report]
                                (v1, v2, v3...)
                                       │
                                       ▼
                          [Authenticated Download / Public Share]
```

---

## 3. Report Templates

WrapAI includes 5 built-in presets:

1. **Meeting Minutes & Action Items (`MEETING`)**:
   - Focus: Executive summary, topic breakdown with timecodes, agreed decisions with speaker consensus, action item registry table with owners/deadlines, and speaker participation breakdown.
2. **Executive Brief (`EXECUTIVE`)**:
   - Focus: High-level strategic digest, major decisions, and key executive risks. Recommended for executive leadership.
3. **Lecture & Study Notes (`LECTURE`)**:
   - Focus: Core topics, educational explanations, key points, questions raised, and highlights.
4. **Interview Assessment (`INTERVIEW`)**:
   - Focus: Candidate and qualitative discussion assessment, participant breakdown, competency responses, and highlights.
5. **Standard Content Report (`GENERAL`)**:
   - Focus: General analysis suitable for podcasts, videos, webinars, and text uploads.

---

## 4. Structured Report Intermediate Representation

Before rendering any document, `reportBuilder` synthesizes an intermediate JSON structure:

```json
{
  "title": "Q3 Architecture Sync — Meeting Minutes",
  "template": "MEETING",
  "reportType": "MEETING_REPORT",
  "detailLevel": "STANDARD",
  "metadata": {
    "contentTitle": "Q3 Architecture Sync & MongoDB Scalability Review",
    "contentType": "VIDEO",
    "date": "2026-08-31T21:00:00.000Z",
    "durationSeconds": 1845,
    "formattedDuration": "30m 45s",
    "participants": ["Rahul Sharma", "Sarah Jenkins", "Alexandre Dubois"],
    "participantCount": 3,
    "analysisVersion": 1,
    "transcriptVersion": 1,
    "llmModel": "gemini-2.5-flash"
  },
  "sections": [
    { "id": "SUMMARY", "title": "Executive Summary", "type": "paragraph", "content": "..." },
    { "id": "TOPICS", "title": "Key Topics Discussed", "type": "topics", "items": [...] },
    { "id": "DECISIONS", "title": "Agreed Decisions", "type": "decisions", "items": [...] },
    { "id": "ACTION_ITEMS", "title": "Action Items & Assignments", "type": "action_items", "items": [...] },
    { "id": "KEY_POINTS", "title": "Key Points & Takeaways", "type": "key_points", "items": [...] },
    { "id": "PARTICIPANTS", "title": "Participants & Speaker Breakdown", "type": "participants", "items": [...] }
  ]
}
```

---

## 5. Document Renderers

* **PDF Renderer (`pdfRenderer.js`)**: Uses `pdfkit` to render vector graphics, WrapAI brand colors (`#171e19`, `#b7c6c2`, `#302b2f`), metadata grid, decision checkmark callouts, action item tables with header fills, and dynamic page numbering footers (`Page X of Y`).
* **DOCX Renderer (`docxRenderer.js`)**: Uses `docx` to create editable Microsoft Word documents with structured heading levels, metadata tables, action item tables, bulleted lists, and Word footer page numbers.
* **Markdown Renderer (`markdownRenderer.js`)**: Generates clean GitHub-Flavored Markdown with markdown tables, checkboxes, headers, and WrapAI footer attribution.
* **Plain Text Renderer (`txtRenderer.js`)**: Clean, formatted ASCII text export.

---

## 6. Secure Sharing Architecture

1. **Token Generation**: Cryptographically secure 48-character hex tokens (`crypto.randomBytes(24).toString('hex')`).
2. **Expiration**: Configurable validity window (default 7 days).
3. **Revocation**: Single-click revocation clears token and disables public access immediately.
4. **Read-Only Surface**: Public shared route `/shared/reports/:token` returns sanitized structured report data without exposing user accounts, credentials, or private transcripts.

---

## 7. Versioning & Regeneration

When users adjust template options, format, or detail level and click **Regenerate**, the system creates a new version record (`v2`, `v3`) referencing the latest analysis version. Historical reports remain accessible in the version selector.

---

## 8. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/reports` | List paginated user reports (supports `?format=` and `?contentId=`) |
| `GET` | `/api/v1/content/:contentId/reports` | List all report versions for a content item |
| `POST` | `/api/v1/content/:contentId/reports/preview` | Generate instant live structured preview (no storage write) |
| `POST` | `/api/v1/content/:contentId/reports` | Queue report compilation and export job |
| `GET` | `/api/v1/reports/:id` | Get report details and compilation status |
| `GET` | `/api/v1/reports/:id/download` | Authenticated file download (PDF, DOCX, Markdown, TXT) |
| `POST` | `/api/v1/reports/:id/regenerate` | Regenerate report into a new version |
| `DELETE` | `/api/v1/reports/:id` | Delete report document and DB record (source content preserved) |
| `POST` | `/api/v1/reports/:id/share` | Generate secure public share link |
| `DELETE` | `/api/v1/reports/:id/share` | Revoke public share link |
| `GET` | `/api/v1/reports/shared/:shareToken` | Public anonymous read-only report view |
