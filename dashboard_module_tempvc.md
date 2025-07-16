# Temporary Voice Channel Module: Dashboard Features

## Overview

The Temporary Voice Channel (TempVC) module manages dynamic voice channels, user settings, and templates. The dashboard should provide visibility and control over TempVC operations.

---

## What Already Exists

- **Active TempVCs:** Instances and their settings are tracked in the database.
- **Naming Templates:** Templates for channel names are stored and can be managed via commands.
- **User Settings:** Per-user settings (custom name, user limit, bitrate, locked/hidden) are stored and updatable.
- **Configuration:** Default options and restrictions are stored per guild.
- **Analytics:** Creation timestamps and usage can be derived from instance data.

---

## What Needs to Be Added

- **Dashboard API Endpoints:** REST endpoints for listing, updating, and managing TempVCs, templates, and user settings.
- **Real-Time Updates:** Live status of TempVCs via WebSocket or polling.
- **Bulk Management:** Dashboard controls for closing, transferring, or resetting multiple TempVCs.
- **Template Assignment UI:** Dashboard interface for assigning templates to users/roles.
- **Advanced Analytics:** Charts for TempVC usage, popular templates, and user activity.

---

## Features to Add to Dashboard

### 1. Active TempVCs
- List all active temporary voice channels. *(exists)*
- Show owner, user limit, bitrate, and custom name. *(exists)*
- Option to close or transfer ownership. *(needs dashboard action)*

### 2. Naming Templates
- View, create, edit, and delete channel naming templates. *(exists)*
- Assign templates to users or roles. *(needs dashboard UI)*

### 3. User Settings
- View and edit per-user TempVC settings (custom name, user limit, bitrate, locked/hidden status). *(exists)*
- Reset user settings. *(exists, needs dashboard action)*

### 4. Analytics
- Track TempVC creation and usage over time. *(exists, needs dashboard analytics)*
- Most popular templates and settings. *(needs dashboard analytics)*

### 5. Configuration
- Set default TempVC options for the server. *(exists)*
- Restrict who can create TempVCs. *(exists, needs dashboard UI)*

## Example Dashboard Actions

- `GET /api/tempvc/instances` — List active TempVCs.
- `PUT /api/tempvc/templates` — Update naming templates.
- `POST /api/tempvc/settings/{userId}` — Update user settings.
