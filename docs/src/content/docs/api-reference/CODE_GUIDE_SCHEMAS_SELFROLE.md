---
title: CODE_GUIDE_SCHEMAS_SELFROLE
sidebar:
  badge: ApiReference
---

## 2. Schemas (`src/schemas/`)

Mongoose schemas define the structure and behavior of data stored in MongoDB.

### `SelfRole.js`
Mongoose model for managing self-assignable roles via reaction/button messages.

*   **`SelfRole` (Mongoose Model)**
    *   **Instance Methods:**
        *   **`addRole(roleData)`**
            *   **Description:** Adds a new role configuration to the self-role message.
            *   **Parameters:** `roleData` (Object)
            *   **Returns:** `Document` (the updated self-role document)
            *   **Throws:** `Error` if role already exists.
            *   **Usage:** `selfRole.addRole({ roleId: '...', label: '...', style: 'Primary' });`
        *   **`removeRole(roleId)`**
            *   **Description:** Removes a role configuration from the self-role message.
            *   **Parameters:** `roleId` (string)
            *   **Returns:** `Document`
            *   **Throws:** `Error` if role not found.
            *   **Usage:** `selfRole.removeRole('12345');`
        *   **`updateRole(roleId, updateData)`**
            *   **Description:** Updates an existing role configuration.
            *   **Parameters:**
                *   `roleId` (string)
                *   `updateData` (Object)
            *   **Returns:** `Document`
            *   **Throws:** `Error` if role not found.
            *   **Usage:** `selfRole.updateRole('12345', { label: 'New Label' });`
        *   **`canUserAssignRole(userId, roleId, userRoles)`**
            *   **Description:** Checks if a user can assign a specific self-role based on limits, required roles, and conflicting roles.
            *   **Parameters:**
                *   `userId` (string)
                *   `roleId` (string)
                *   `userRoles` (Collection): Discord.js Collection of user's current roles.
            *   **Returns:** `Object`: `{ allowed: boolean, reason?: string }`
            *   **Usage:** `const check = selfRole.canUserAssignRole(member.id, 'roleId', member.roles.cache);`
        *   **`incrementRoleAssignment(roleId)`**
            *   **Description:** Increments the assignment count for a role and updates statistics.
            *   **Parameters:** `roleId` (string)
            *   **Returns:** `void`
            *   **Usage:** `selfRole.incrementRoleAssignment('12345');`
        *   **`decrementRoleAssignment(roleId)`**
            *   **Description:** Decrements the assignment count for a role and updates statistics.
            *   **Parameters:** `roleId` (string)
            *   **Returns:** `void`
            *   **Usage:** `selfRole.decrementRoleAssignment('12345');`
        *   **`updateUserStats(userId)`**
            *   **Description:** Updates interaction statistics for a user on this self-role message.
            *   **Parameters:** `userId` (string)
            *   **Returns:** `void`
            *   **Usage:** `selfRole.updateUserStats(member.id);`
