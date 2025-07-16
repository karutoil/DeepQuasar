# Reminders Module: Dashboard Features

## Overview

The Reminders module schedules and delivers reminders to users. The dashboard should allow users and admins to manage reminders.

## Features to Add to Dashboard

### 1. Reminder List
- View all scheduled reminders for a user or server.
- Filter by date, user, or status (pending, delivered).

### 2. Reminder Management
- Create, edit, or delete reminders.
- Mark reminders as delivered or cancel them.

### 3. Analytics
- Track reminder usage and delivery success.
- Most active reminder users.

## Example Dashboard Actions

- `GET /api/reminders` — List reminders.
- `POST /api/reminders` — Create a reminder.
- `DELETE /api/reminders/{id}` — Delete a reminder.
