---
title: CODE_GUIDE_UTILS_PROFANITYFILTER
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `ProfanityFilter.js`
A utility for detecting profanity in text.

*   **`ProfanityFilter` (Class)**
    *   **Static Methods:**
        *   **`contains(text)`**
            *   **Description:** Checks if the given text contains any profanity from a predefined list.
            *   **Parameters:** `text` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (ProfanityFilter.contains('bad word')) { ... }`
