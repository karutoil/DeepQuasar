# Settings Module: Dashboard Features

## Overview

The Settings module manages server configuration, embed templates, ticket system, and other global options. The dashboard should allow server owners and authorized users to view and modify these settings.

---

## What Already Exists

- **Server Configuration:** Prefix, language, and feature toggles are stored per guild and configurable via commands.
- **Embed Templates:** Templates are managed via commands and stored in the database.
- **Ticket System:** Ticket channels, categories, and modals are configurable and stored.
- **Role & Permission Management:** Bot permissions and self-assignable roles are managed via commands.
- **Audit & Change History:** Configuration changes are tracked in the database.
- **Analytics:** Usage of templates and tickets can be derived from logs.

---

## What Needs to Be Added

- **Dashboard API Endpoints:** REST endpoints for settings, templates, tickets, and roles.
- **Live Preview:** Dashboard widget for previewing templates and ticket forms.
- **Bulk Management:** Dashboard controls for managing multiple settings or templates.
- **Advanced Analytics:** Charts for template/ticket usage and most used features.
- **Restore Settings:** Dashboard UI for restoring previous configurations.

---

## Features to Add to Dashboard

### 1. Server Configuration
- View and edit server settings (prefix, language, feature toggles). *(exists, needs dashboard UI/API)*
- Manage premium status and subscription. *(exists, needs dashboard UI/API)*

### 2. Embed Templates
- List, create, edit, and delete embed templates. *(exists, needs dashboard UI/API)*
- Preview templates live. *(needs dashboard widget)*
- Assign templates to commands or events. *(exists, needs dashboard UI)*

### 3. Ticket System
- Configure ticket channels, categories, and modals. *(exists, needs dashboard UI/API)*
- View active and closed tickets. *(exists, needs dashboard UI)*
- Manage ticket forms/questions. *(exists, needs dashboard UI)*

### 4. Role & Permission Management
- Assign bot permissions to roles. *(exists, needs dashboard UI)*
- Set up self-assignable roles. *(exists, needs dashboard UI)*

### 5. Audit & Change History
- View history of configuration changes. *(exists, needs dashboard UI)*
- Restore previous settings. *(exists, needs dashboard UI)*

### 6. Analytics
- Track usage of templates and ticket system. *(partially exists, needs dashboard analytics)*
- Display most used templates. *(needs dashboard analytics)*

## Example Dashboard Actions

- `GET /api/settings` — Fetch current settings.
- `PUT /api/settings` — Update settings.
- `POST /api/templates` — Create new template.
- `DELETE /api/templates/{id}` — Delete template.
