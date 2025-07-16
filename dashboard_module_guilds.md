# Guilds Module: Dashboard Features

## Overview

The Guilds module manages server-level configuration, premium status, and analytics. The dashboard should provide visibility and control for server owners.

---

## What Already Exists

- **Guild Details:** Guild ID, name, premium status, and settings are stored in the database.
- **Configuration Management:** Prefix, language, and feature toggles are configurable via commands and stored per guild.
- **Premium Subscription:** Premium status and expiration are tracked.
- **Analytics:** Guild creation date and settings history are available.

---

## What Needs to Be Added

- **Dashboard API Endpoints:** REST endpoints for guild listing, settings, and premium management.
- **Configuration Change History:** UI and backend for tracking and displaying changes.
- **Bulk Guild Management:** For bot owners, ability to manage multiple guilds from dashboard.
- **Premium Subscription Management:** Dashboard UI for upgrading, renewing, or viewing premium status.
- **Advanced Analytics:** Charts for guild growth, activity, and configuration changes.

---

## Features to Add to Dashboard

### 1. Guild Overview
- View server details (name, ID, premium status). *(exists)*
- List all servers the bot is in (for bot owner). *(exists, needs dashboard UI)*

### 2. Configuration Management
- Edit server settings (prefix, language, features). *(exists, needs dashboard UI/API)*
- Manage premium subscription and renewal. *(exists, needs dashboard UI/API)*

### 3. Analytics
- Track server growth and activity. *(exists, needs dashboard analytics)*
- Display configuration change history. *(partially exists, needs dashboard UI)*

## Example Dashboard Actions

- `GET /api/guilds` — List guilds.
- `PUT /api/guilds/{id}/settings` — Update server settings.
- `POST /api/guilds/{id}/premium` — Manage premium status.
