---
title: CODE_GUIDE_UTILS_AUTOROLEMANAGER
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `AutoRoleManager.js`
Manages automatic role assignment for new members.

*   **`AutoRoleManager` (Class)**
    *   **Constructor:** `constructor(client)`
        *   **Parameters:** `client` (Discord.js Client instance)
    *   **Methods:**
        *   **`handleMemberJoin(member)`**
            *   **Description:** Processes a new member joining a guild to apply configured autoroles.
            *   **Parameters:** `member` (Discord.js GuildMember)
            *   **Returns:** `Promise<void>`
            *   **Usage:** `autoRoleManager.handleMemberJoin(newMember);`
        *   **`handleMemberUpdate(oldMember, newMember)`**
            *   **Description:** Checks for changes in member verification status to apply autoroles.
            *   **Parameters:**
                *   `oldMember` (Discord.js GuildMember)
                *   `newMember` (Discord.js GuildMember)
            *   **Returns:** `Promise<void>`
            *   **Usage:** `autoRoleManager.handleMemberUpdate(oldMember, newMember);`
        *   **`scheduleRoleAssignment(member, role, delay)`**
            *   **Description:** Schedules a role assignment with a specified delay.
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `role` (Discord.js Role)
                *   `delay` (number): Delay in seconds.
            *   **Returns:** `void`
            *   **Usage:** `autoRoleManager.scheduleRoleAssignment(member, role, 5);`
        *   **`assignRole(member, role)`**
            *   **Description:** Assigns a role to a member.
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `role` (Discord.js Role)
            *   **Returns:** `Promise<void>`
            *   **Usage:** `await autoRoleManager.assignRole(member, role);`
        *   **`cancelPendingAssignment(guildId, memberId)`**
            *   **Description:** Cancels a scheduled pending role assignment.
            *   **Parameters:**
                *   `guildId` (string)
                *   `memberId` (string)
            *   **Returns:** `void`
            *   **Usage:** `autoRoleManager.cancelPendingAssignment('123', '456');`
        *   **`testConfiguration(guild, testUser)`**
            *   **Description:** Tests the current autorole configuration for a guild, checking permissions and role existence.
            *   **Parameters:**
                *   `guild` (Discord.js Guild)
                *   `testUser` (Discord.js User, optional)
            *   **Returns:** `Promise<Object>`: Test result object.
            *   **Usage:** `const result = await autoRoleManager.testConfiguration(guild);`
        *   **`getStatistics(guildId)`**
            *   **Description:** Retrieves statistics related to autorole, such as pending assignments.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Object`
            *   **Usage:** `const stats = autoRoleManager.getStatistics('123');`
