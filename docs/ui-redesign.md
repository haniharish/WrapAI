# WrapAI — UI Redesign: Reality-First / Poster Modernist Design System

## Design Philosophy

The WrapAI frontend has been completely redesigned from the ground up according to the **Reality-First / Poster Modernist** aesthetic.

### Core Tenets
1. **Editorial & Architectural Grid**:
   - Strict 12-column layout structure.
   - Columns 1–3: Dedicated to sticky uppercase metadata markers (`GridSidebarLabel`), section indices, and technical specs.
   - Columns 4–12: Content canvas, high-density structured lists, tables, and interaction areas.
2. **Restrained High-Contrast Palette**:
   - **Background**: Concrete / Warm Paper `#E3E2DE`
   - **Primary Accent**: Electric Cobalt Blue `#1351AA`
   - **Primary Text & Solids**: Technical Ink `#141414`
   - **Secondary Text**: Muted Charcoal `#444343`
   - **Labels / Timecodes**: Steel Gray `#7A7A7A`
   - **Borders / Dividers**: 1px Hairline `#C7C7C7`
3. **0px Border Radius Everywhere**:
   - Zero rounded corners on buttons, cards, badges, dialogs, inputs, progress bars, or containers.
   - Zero decorative drop-shadows or gradients.
   - 1px solid hairline borders with crisp mathematical boundaries.
4. **Massive Typographic Scale & Contrast**:
   - Massive display headers (`General Sans`, `font-black`, tight `-0.04em` tracking, uppercase, stacked words).
   - High-contrast body (`Plus Jakarta Sans`) and technical timestamps/indices in monospace (`JetBrains Mono`).
5. **Predictable Linear Interaction**:
   - Fast, linear transitions (`0.3s linear`).
   - Clean hover states with clear cobalt shifts (`#1351AA`).

---

## Component Architecture

| Component | Path | Description |
| :--- | :--- | :--- |
| `PosterButton` | `client/src/components/ui/PosterButton.jsx` | Base rectangular action button (`primary`, `secondary`, `outline`, `ghost`, `danger`). |
| `GridSidebarLabel` | `client/src/components/ui/GridSidebarLabel.jsx` | 3-column sticky sidebar metadata label for 12-column layouts. |
| `TypographicListItem` | `client/src/components/ui/TypographicListItem.jsx` | Numbered feature row with hover color inversion. |
| `SectionHeader` | `client/src/components/ui/SectionHeader.jsx` | Massive stacked uppercase header. |
| `GridCell` | `client/src/components/ui/GridCell.jsx` | 1px bordered technical structural cell. |
| `MetadataRow` | `client/src/components/ui/MetadataRow.jsx` | Key-value pair with uppercase label and monospace value. |
| `StatusLabel` | `client/src/components/ui/StatusLabel.jsx` | Restrained square status badge (`READY`, `PROCESSING`, `FAILED`, `QUEUED`). |
| `StatCard` | `client/src/components/common/StatCard.jsx` | Large typographic metric block with mono indexing. |
| `MediaPlayer` | `client/src/components/media/MediaPlayer.jsx` | High-contrast audio/video scrubber and transport controller. |

---

## Redesigned Pages & Workspaces

- **Public & Marketing**:
  - `LandingPage.jsx`: 85vh Hero, Manifesto, 3-column System grid, Numbered process (`01`–`05`), Typographic comparison list, Content Types grid, AI schemas, RAG dialog, Pricing.
  - `PublicLayout.jsx`: 80px sticky navbar with 12-column grid and massive editorial footer.
- **Authentication**:
  - `LoginPage.jsx`, `RegisterPage.jsx`, `ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx`, `AcceptInvitePage.jsx`.
- **User Dashboard & Content**:
  - `UserDashboardPage.jsx`: Workspace metrics, quick ingest grid, and recent recordings list.
  - `MyContentPage.jsx`: Paginated numbered content repository with real-time filters and renaming.
  - `UploadPage.jsx`: Multi-modal ingest dropzone (Audio, Video, Document, URL, Text) with S3 progress bar.
  - `ProcessingPage.jsx`: 7-stage live BullMQ execution checklist and terminal log inspector.
  - `ReportsListPage.jsx`: Numbered exported intelligence reports with download and share actions.
  - `SettingsPage.jsx`: User profile, password management, S3 storage meters, and cascade deletion.
  - `WorkspaceSettingsPage.jsx`: Team roster, role policies (Owner, Admin, Editor, Viewer), and SHA-256 invite generator.
- **Content Intelligence Workspace (9 Tabs)**:
  - `TranscriptTab.jsx`: Speaker diarization clustering, word timestamps, search filtering, and speaker renaming.
  - `SummaryTab.jsx`: LLM model provenance, core takeaway banner, and executive summary.
  - `TopicsTab.jsx`: Thematic clusters with timecode jump controls.
  - `KeyPointsTab.jsx`: Numbered factual assertions with importance ratings.
  - `HighlightsTab.jsx`: Key moments with timestamp bookmarks.
  - `DecisionsTab.jsx`: Explicit decisions registry with participant endorsements.
  - `ActionItemsTab.jsx`: Task assignment matrix with optimistic status toggles.
  - `ReportTab.jsx`: Custom report builder (Meeting Minutes, Executive Brief, Lecture Notes, Interview Summary) and printable document canvas.
  - `AskAITab.jsx`: Multi-turn RAG chat with grounded audio timestamp citations.
- **Collaboration & Global Tools**:
  - `GlobalSearchModal.jsx`: Global Cmd+K semantic search.
  - `CommentsPanel.jsx`: Timestamped notes and threaded replies.
  - `NotificationBell.jsx`: Polled notification feed with mark-as-read.
  - `WorkspaceSwitcher.jsx`: Team space switcher with modal creation.
- **Admin Dashboard**:
  - `AdminLayout.jsx`, `AdminOverviewPage.jsx`, `AdminUsersPage.jsx`, `AdminContentPage.jsx`, `AdminProcessingPage.jsx`, `AdminAnalyticsPage.jsx`, `AdminSystemPage.jsx`.
