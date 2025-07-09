---
title: note
description: Manage moderator notes for users
sidebar:
  badge: Moderation
---

# `note`

This command allows moderators to add, list, and delete internal notes associated with specific users. These notes can be used to track user behavior, concerns, or positive interactions for moderation purposes.

## How to Use

Use the `/note` command followed by a subcommand to manage user notes.

### Subcommands

*   `add`
    *   **Description:** Adds a new note to a user.
    *   **Options:**
        *   `user`
            *   **Description:** User to add note for.
            *   **Type:** User
            *   **Required:** Yes
        *   `content`
            *   **Description:** The content of the note.
            *   **Type:** String
            *   **Required:** Yes
            *   **Constraints:** Maximum length of 2000 characters.
        *   `type`
            *   **Description:** Type of note.
            *   **Type:** String (Choices)
            *   **Required:** No
            *   **Choices:** `General`, `Warning`, `Positive`, `Concern`, `Investigation`
        *   `private`
            *   **Description:** Whether this note is private to moderators (default: `True`).
            *   **Type:** Boolean
            *   **Required:** No
    *   **Usage:** 
        ```sh
        /note add user:@ProblemUser content:"User was disruptive in general chat." type:warning private:True
        ```

*   `list`
    *   **Description:** Lists all notes for a specific user.
    *   **Options:**
        *   `user`
            *   **Description:** User to view notes for.
            *   **Type:** User
            *   **Required:** Yes
    *   **Usage:** 
        ```sh
        /note list user:@ProblemUser
        ```

*   `delete`
    *   **Description:** Deletes a specific note by its ID.
    *   **Options:**
        *   `user`
            *   **Description:** User whose note to delete.
            *   **Type:** User
            *   **Required:** Yes
        *   `note-id`
            *   **Description:** ID of the note to delete.
            *   **Type:** String
            *   **Required:** Yes
    *   **Usage:** 
        ```sh
        /note delete user:@ProblemUser note-id:abcdef123456
        ```

## Examples

```sh
# Add a general note to a user
/note add user:@NewMember content:"Very helpful in onboarding new users."

# List all notes for a user
/note list user:@OldMember

# Delete a specific note
/note delete user:@UserToDeleteNote note-id:someNoteId
```

## Important Permissions

*   You need `Manage Messages` or `Kick Members` permission to use this command.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
