# Moderation Module: Dashboard Features

## Overview

The Moderation module handles bans, mutes, warnings, logs, and appeals. The dashboard should provide tools for server owners and moderators to manage and review moderation actions.

## Features to Add to Dashboard

### 1. Moderation Logs
- View recent moderation actions (ban, mute, kick, warn).
- Filter logs by user, action, date.
- Search logs.

### 2. Active Punishments
- List currently active bans, mutes, warnings.
- Expiration timers for temporary actions.
- Option to lift or extend punishments.

### 3. Appeals Management
- View and process user appeals.
- Change appeal status (open, closed, resolved).
- Add notes to appeals.

### 4. Moderation Settings
- Configure log channels and event types.
- Set up automated moderation rules (profanity filter, spam detection).
- Manage moderator roles and permissions.

### 5. User Moderation Overview
- View moderation history for individual users.
- Apply new actions (ban, mute, warn) directly from dashboard.

### 6. Analytics
- Charts of moderation actions over time.
- Most common reasons for actions.
- Moderator activity stats.

## Example Dashboard Actions

- `GET /api/moderation/logs` — Fetch moderation logs.
- `POST /api/moderation/ban` — Ban a user.
- `PUT /api/moderation/appeals/{id}` — Update appeal status.
- `GET /api/moderation/active` — List active punishments.
