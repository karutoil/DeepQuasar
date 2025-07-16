# User Notes Module: Dashboard Features

## Overview

The User Notes module allows moderators to attach notes to users, both public and private. The dashboard should facilitate note management and review.

## Features to Add to Dashboard

### 1. Notes Overview
- List all notes for a user or guild.
- Filter notes by author, date, privacy status.
- Search notes.

### 2. Note Management
- Add, edit, or delete notes.
- Mark notes as private or public.
- Attach notes to moderation actions.

### 3. Analytics
- Track note creation over time.
- Most active note authors.

## Example Dashboard Actions

- `GET /api/usernotes/{guildId}/{userId}` — Fetch notes for a user.
- `POST /api/usernotes` — Add a new note.
- `DELETE /api/usernotes/{noteId}` — Delete a note.
