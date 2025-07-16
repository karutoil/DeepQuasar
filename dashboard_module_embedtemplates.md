# Embed Templates Module: Dashboard Features

## Overview

The Embed Templates module allows creation and management of message templates for embeds. The dashboard should provide tools for template management and preview.

---

## What Already Exists

- **Template List:** Templates are stored per guild and can be listed, filtered, and managed via commands.
- **Template Management:** Create, edit, and delete operations exist via bot commands.
- **Preview:** Live preview is not available; templates are tested via Discord messages.
- **Assignment:** Templates can be assigned to commands/events via configuration.
- **Analytics:** Usage stats are not tracked but can be derived from template usage logs.

---

## What Needs to Be Added

- **Dashboard API Endpoints:** REST endpoints for template CRUD operations and assignment.
- **Live Preview:** Dashboard widget to preview templates before sending.
- **Usage Analytics:** Track and display template usage/popularity.
- **Bulk Management:** Dashboard controls for bulk editing or deleting templates.

---

## Features to Add to Dashboard

### 1. Template List
- View all embed templates for a server. *(exists)*
- Filter by name, creator, or usage. *(exists, needs dashboard UI)*

### 2. Template Management
- Create, edit, or delete templates. *(exists, needs dashboard UI/API)*
- Preview templates live. *(needs dashboard widget)*
- Assign templates to commands or events. *(exists, needs dashboard UI)*

### 3. Analytics
- Track template usage and popularity. *(needs dashboard analytics)*

## Example Dashboard Actions

- `GET /api/embedtemplates` — List templates.
- `POST /api/embedtemplates` — Create a template.
- `DELETE /api/embedtemplates/{id}` — Delete a template.
