# User Notes Module: Dashboard Features

## Overview

The User Notes module allows moderators to attach notes to users, both public and private. The dashboard should facilitate note management and review.

---

## What Already Exists

- **Notes Overview:** Notes are stored per user/guild and can be listed and filtered via commands.
- **Note Management:** Notes can be added, edited, deleted, and marked as private/public via commands.
- **Moderation Integration:** Notes can be attached to moderation actions.
- **Analytics:** Note creation timestamps and authors are stored.

---

## What Needs to Be Added

- **Dashboard API Endpoints:** REST endpoints for listing, creating, editing, and deleting notes.
- **Bulk Management:** Dashboard controls for managing multiple notes at once.
- **Advanced Analytics:** Charts for note creation, author activity, and privacy status.
- **Search UI:** Dashboard widget for searching/filtering notes.

---

## Features to Add to Dashboard

### 1. Notes Overview
- List all notes for a user or guild. *(exists)*
- Filter notes by author, date, privacy status. *(exists, needs dashboard UI)*
- Search notes. *(needs dashboard UI)*

### 2. Note Management
- Add, edit, or delete notes. *(exists, needs dashboard UI/API)*
- Mark notes as private or public. *(exists, needs dashboard UI)*
- Attach notes to moderation actions. *(exists, needs dashboard UI)*

### 3. Analytics
- Track note creation over time. *(partially exists, needs dashboard analytics)*
- Most active note authors. *(needs dashboard analytics)*

## Example Dashboard Actions

- `GET /api/usernotes/{guildId}/{userId}` — Fetch notes for a user.
- `POST /api/usernotes` — Add a new note.
- `DELETE /api/usernotes/{noteId}` — Delete a note.
