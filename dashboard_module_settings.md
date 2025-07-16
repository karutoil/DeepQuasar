# Settings Module: Dashboard Features

## Overview

The Settings module manages server configuration, embed templates, ticket system, and other global options. The dashboard should allow server owners and authorized users to view and modify these settings.

## Features to Add to Dashboard

### 1. Server Configuration
- View and edit server settings (prefix, language, feature toggles).
- Manage premium status and subscription.

### 2. Embed Templates
- List, create, edit, and delete embed templates.
- Preview templates live.
- Assign templates to commands or events.

### 3. Ticket System
- Configure ticket channels, categories, and modals.
- View active and closed tickets.
- Manage ticket forms/questions.

### 4. Role & Permission Management
- Assign bot permissions to roles.
- Set up self-assignable roles.

### 5. Audit & Change History
- View history of configuration changes.
- Restore previous settings.

### 6. Analytics
- Track usage of templates and ticket system.
- Display most used templates.

## Example Dashboard Actions

- `GET /api/settings` — Fetch current settings.
- `PUT /api/settings` — Update settings.
- `POST /api/templates` — Create new template.
- `DELETE /api/templates/{id}` — Delete template.
