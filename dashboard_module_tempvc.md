# Temporary Voice Channel Module: Dashboard Features

## Overview

The Temporary Voice Channel (TempVC) module manages dynamic voice channels, user settings, and templates. The dashboard should provide visibility and control over TempVC operations.

## Features to Add to Dashboard

### 1. Active TempVCs
- List all active temporary voice channels.
- Show owner, user limit, bitrate, and custom name.
- Option to close or transfer ownership.

### 2. Naming Templates
- View, create, edit, and delete channel naming templates.
- Assign templates to users or roles.

### 3. User Settings
- View and edit per-user TempVC settings (custom name, user limit, bitrate, locked/hidden status).
- Reset user settings.

### 4. Analytics
- Track TempVC creation and usage over time.
- Most popular templates and settings.

### 5. Configuration
- Set default TempVC options for the server.
- Restrict who can create TempVCs.

## Example Dashboard Actions

- `GET /api/tempvc/instances` — List active TempVCs.
- `PUT /api/tempvc/templates` — Update naming templates.
- `POST /api/tempvc/settings/{userId}` — Update user settings.
