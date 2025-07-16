# Embed Templates Module: Dashboard Features

## Overview

The Embed Templates module allows creation and management of message templates for embeds. The dashboard should provide tools for template management and preview.

## Features to Add to Dashboard

### 1. Template List
- View all embed templates for a server.
- Filter by name, creator, or usage.

### 2. Template Management
- Create, edit, or delete templates.
- Preview templates live.
- Assign templates to commands or events.

### 3. Analytics
- Track template usage and popularity.

## Example Dashboard Actions

- `GET /api/embedtemplates` — List templates.
- `POST /api/embedtemplates` — Create a template.
- `DELETE /api/embedtemplates/{id}` — Delete a template.
