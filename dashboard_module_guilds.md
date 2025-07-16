# Guilds Module: Dashboard Features

## Overview

The Guilds module manages server-level configuration, premium status, and analytics. The dashboard should provide visibility and control for server owners.

## Features to Add to Dashboard

### 1. Guild Overview
- View server details (name, ID, premium status).
- List all servers the bot is in (for bot owner).

### 2. Configuration Management
- Edit server settings (prefix, language, features).
- Manage premium subscription and renewal.

### 3. Analytics
- Track server growth and activity.
- Display configuration change history.

## Example Dashboard Actions

- `GET /api/guilds` — List guilds.
- `PUT /api/guilds/{id}/settings` — Update server settings.
- `POST /api/guilds/{id}/premium` — Manage premium status.
