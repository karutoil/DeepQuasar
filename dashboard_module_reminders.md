# Reminders Module: Dashboard Features

## Overview

The Reminders module schedules and delivers reminders to users. The dashboard should allow users and admins to manage reminders.

---

## What Already Exists

- **Reminder List:** Reminders are stored per user/guild and can be listed and filtered.
- **Reminder Management:** Reminders can be created, edited, deleted, and marked as delivered via commands.
- **Analytics:** Reminder creation and delivery timestamps are stored.

---

## What Needs to Be Added

- **Dashboard API Endpoints:** REST endpoints for listing, creating, editing, and deleting reminders.
- **Bulk Management:** Dashboard controls for managing multiple reminders at once.
- **Advanced Analytics:** Charts for reminder usage, delivery success, and active users.
- **Status UI:** Dashboard widget for pending/delivered status.

---

## Features to Add to Dashboard

### 1. Reminder List
- View all scheduled reminders for a user or server. *(exists)*
- Filter by date, user, or status (pending, delivered). *(exists, needs dashboard UI)*

### 2. Reminder Management
- Create, edit, or delete reminders. *(exists, needs dashboard UI/API)*
- Mark reminders as delivered or cancel them. *(exists, needs dashboard UI)*

### 3. Analytics
- Track reminder usage and delivery success. *(partially exists, needs dashboard analytics)*
- Most active reminder users. *(needs dashboard analytics)*

## Example Dashboard Actions

- `GET /api/reminders` — List reminders.
- `POST /api/reminders` — Create a reminder.
- `DELETE /api/reminders/{id}` — Delete a reminder.
