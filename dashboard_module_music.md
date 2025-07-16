# Music Module: Dashboard Features

## Overview

The Music module provides music playback, queue management, history, and integration with multiple sources (YouTube, Spotify, SoundCloud). The dashboard should empower server owners and authorized users to monitor and control music-related activities.

---

## What Already Exists

- **Playback Controls:** The bot supports play, pause, skip, stop, and seek via Discord commands. Playback status and queue are managed in memory and can be exposed via the dashboard.
- **Queue Management:** Queue is managed per guild; users can add, remove, and reorder tracks via commands.
- **Play History:** User and server play history is tracked and can be queried.
- **Source Integration:** Tracks from YouTube, Spotify, and SoundCloud are supported; source info is available.
- **Music Settings:** Default volume, autoplay, and filters are stored per user/guild in the database.
- **User Controls:** Requester info is tracked for each track; permissions are checked for music commands.
- **Analytics:** Basic usage stats (most played tracks, active listeners) can be derived from history.

---

## What Needs to Be Added

- **Dashboard API Endpoints:** REST endpoints to expose queue, playback status, history, and settings.
- **Real-Time Updates:** WebSocket or polling for live queue/playback status.
- **Role/Permission Management UI:** Dashboard controls to restrict music features by role.
- **Advanced Analytics:** Charts for peak usage, trending tracks, and listener stats.
- **Bulk Actions:** Ability to clear queue, bulk remove tracks, or reset settings from dashboard.
- **Source Stats:** Dashboard widgets for source breakdown and trending content.

---

## Features to Add to Dashboard

### 1. Playback Controls
- View current track, queue, and playback status. *(exists, needs API exposure)*
- Play, pause, skip, stop, and seek controls. *(exists, needs dashboard actions)*
- Adjust volume and playback settings. *(exists, needs dashboard UI)*

### 2. Queue Management
- View full music queue. *(exists)*
- Reorder, remove, or add tracks. *(exists)*
- Clear queue. *(exists, needs dashboard action)*

### 3. Play History
- Display user's and server's play history. *(exists)*
- Filter by user, date, or source. *(needs dashboard filter UI)*
- Replay tracks from history. *(exists, needs dashboard action)*

### 4. Source Integration
- Show breakdown of sources (YouTube, Spotify, etc.) used. *(exists, needs dashboard widget)*
- Display source-specific stats (most played, trending). *(needs dashboard analytics)*

### 5. Music Settings
- Configure default volume, autoplay, filters. *(exists)*
- Set allowed sources and restrictions. *(needs dashboard UI and backend support)*

### 6. User Controls
- Restrict who can control music (roles, permissions). *(exists, needs dashboard UI)*
- View who requested each track. *(exists)*

### 7. Analytics
- Track usage stats: most active listeners, most played tracks, peak times. *(partially exists, needs dashboard analytics)*

## Example Dashboard Actions

- `POST /api/music/play` — Play a track.
- `GET /api/music/history` — Get play history.
- `PUT /api/music/settings` — Update music settings.
- `DELETE /api/music/queue/{trackId}` — Remove track from queue.
