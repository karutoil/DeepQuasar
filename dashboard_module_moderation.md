# Moderation Module: Dashboard Features

## Overview

The Moderation module handles bans, mutes, warnings, logs, and appeals. The dashboard should provide tools for server owners and moderators to manage and review moderation actions.

---

## What Already Exists

- **Moderation Logs:** Actions (ban, mute, kick, warn) are logged per guild and can be queried.
- **Active Punishments:** Current bans, mutes, and warnings are tracked with expiration.
- **Appeals Management:** Appeals are stored and can be updated via commands.
- **Moderation Settings:** Log channels, event types, and automated rules are configurable.
- **User Moderation Overview:** History per user is available.
- **Analytics:** Action timestamps and types are stored.

---

## What Needs to Be Added

- **Dashboard API Endpoints:** REST endpoints for logs, punishments, appeals, and settings.
- **Real-Time Updates:** Live moderation log feed via WebSocket or polling.
- **Bulk Actions:** Dashboard controls for lifting/extending multiple punishments.
- **Appeal Notes UI:** Dashboard widget for adding notes to appeals.
- **Advanced Analytics:** Charts for action frequency, moderator activity, and common reasons.

---

## Features to Add to Dashboard

### 1. Moderation Logs
- View recent moderation actions (ban, mute, kick, warn). *(exists)*
- Filter logs by user, action, date. *(exists, needs dashboard UI)*
- Search logs. *(needs dashboard UI)*

### 2. Active Punishments
- List currently active bans, mutes, warnings. *(exists)*
- Expiration timers for temporary actions. *(exists)*
- Option to lift or extend punishments. *(exists, needs dashboard UI)*

### 3. Appeals Management
- View and process user appeals. *(exists)*
- Change appeal status (open, closed, resolved). *(exists, needs dashboard UI)*
- Add notes to appeals. *(needs dashboard UI)*

### 4. Moderation Settings
- Configure log channels and event types. *(exists)*
- Set up automated moderation rules (profanity filter, spam detection). *(exists)*
- Manage moderator roles and permissions. *(exists, needs dashboard UI)*

### 5. User Moderation Overview
- View moderation history for individual users. *(exists)*
- Apply new actions (ban, mute, warn) directly from dashboard. *(exists, needs dashboard UI)*

### 6. Analytics
- Charts of moderation actions over time. *(partially exists, needs dashboard analytics)*
- Most common reasons for actions. *(needs dashboard analytics)*
- Moderator activity stats. *(needs dashboard analytics)*

## Example Dashboard Actions

- `GET /api/moderation/logs` — Fetch moderation logs.
- `POST /api/moderation/ban` — Ban a user.
- `PUT /api/moderation/appeals/{id}` — Update appeal status.
- `GET /api/moderation/active` — List active punishments.
