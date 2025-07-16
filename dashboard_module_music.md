# Music Module: Dashboard Features

## Overview

The Music module provides music playback, queue management, history, and integration with multiple sources (YouTube, Spotify, SoundCloud). The dashboard should empower server owners and authorized users to monitor and control music-related activities.

## Features to Add to Dashboard

### 1. Playback Controls
- View current track, queue, and playback status.
- Play, pause, skip, stop, and seek controls.
- Adjust volume and playback settings.

### 2. Queue Management
- View full music queue.
- Reorder, remove, or add tracks.
- Clear queue.

### 3. Play History
- Display user's and server's play history.
- Filter by user, date, or source.
- Replay tracks from history.

### 4. Source Integration
- Show breakdown of sources (YouTube, Spotify, etc.) used.
- Display source-specific stats (most played, trending).

### 5. Music Settings
- Configure default volume, autoplay, filters.
- Set allowed sources and restrictions.

### 6. User Controls
- Restrict who can control music (roles, permissions).
- View who requested each track.

### 7. Analytics
- Track usage stats: most active listeners, most played tracks, peak times.

## Example Dashboard Actions

- `POST /api/music/play` — Play a track.
- `GET /api/music/history` — Get play history.
- `PUT /api/music/settings` — Update music settings.
- `DELETE /api/music/queue/{trackId}` — Remove track from queue.
