---
title: lfg-setup
description: Configure LFG system settings
sidebar:
  badge: LFG
---

# `lfg-setup`

This command allows you to configure the LFG system settings.

## How to Use

Use the `/lfg-setup` command followed by a subcommand to configure the LFG system.

```sh
/lfg-setup <subcommand>
```

### Subcommands

*   `init`
    *   **Description:** Initialize LFG system with default settings.

*   `trigger-mode`
    *   **Description:** Set how LFG posts are triggered.
    *   **Options:**
        *   `mode`
            *   **Description:** Trigger mode.
            *   **Type:** String
            *   **Required:** Yes
            *   **Choices:** `Slash Commands Only`, `Message Detection Only`, `Both`

*   `roles`
    *   **Description:** Configure LFG role settings.
    *   **Options:**
        *   `setting`
            *   **Description:** Role setting to configure.
            *   **Type:** String
            *   **Required:** Yes
            *   **Choices:** `Set LFG Role (auto-assign)`, `Set Required Role`, `Toggle Auto-Assign`
        *   `role`
            *   **Description:** Role to set.
            *   **Type:** Role
            *   **Required:** No

*   `cooldown`
    *   **Description:** Configure posting cooldown.
    *   **Options:**
        *   `enabled`
            *   **Description:** Enable/disable cooldown.
            *   **Type:** Boolean
            *   **Required:** Yes
        *   `minutes`
            *   **Description:** Cooldown duration in minutes.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 1, Maximum 60.

*   `embed-style`
    *   **Description:** Customize embed appearance.
    *   **Options:**
        *   `color`
            *   **Description:** Embed color (hex code, e.g., #5865F2).
            *   **Type:** String
            *   **Required:** No
        *   `footer`
            *   **Description:** Footer text.
            *   **Type:** String
            *   **Required:** No

*   `audit-log`
    *   **Description:** Configure audit logging.
    *   **Options:**
        *   `enabled`
            *   **Description:** Enable/disable audit logging.
            *   **Type:** Boolean
            *   **Required:** Yes
        *   `channel`
            *   **Description:** Audit log channel.
            *   **Type:** Channel (Text)
            *   **Required:** No

*   `expiration`
    *   **Description:** Configure post expiration.
    *   **Options:**
        *   `enabled`
            *   **Description:** Enable/disable post expiration.
            *   **Type:** Boolean
            *   **Required:** Yes
        *   `minutes`
            *   **Description:** Expiration time in minutes.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 5, Maximum 1440.

*   `features`
    *   **Description:** Toggle LFG features.
    *   **Options:**
        *   `feature`
            *   **Description:** Feature to toggle.
            *   **Type:** String
            *   **Required:** Yes
            *   **Choices:** `Voice Channel Embeds`, `DM Style Embeds`, `Edit Posts`, `Delete Posts`
        *   `enabled`
            *   **Description:** Enable/disable the feature.
            *   **Type:** Boolean
            *   **Required:** Yes

*   `view`
    *   **Description:** View current LFG configuration.

## Examples

```sh
/lfg-setup init
/lfg-setup trigger-mode mode:Both
/lfg-setup roles setting:"Set LFG Role (auto-assign)" role:@LFG
```
