---
title: appeal
description: Submit an appeal for a punishment
sidebar:
  badge: Moderation
---

# `appeal`

This command allows you to submit an appeal for a punishment you have received. You will need the case ID of the punishment and a reason for your appeal.

## How to Use

To submit an appeal, use the `/appeal` command with the required options:

```sh
/appeal case-id:your_case_id reason:Your reason for appealing additional-info:Any additional details
```

### Options

*   `case-id`
    *   **Description:** Case ID of the punishment to appeal.
    *   **Type:** String
    *   **Required:** Yes

*   `reason`
    *   **Description:** Reason for your appeal.
    *   **Type:** String
    *   **Required:** Yes
    *   **Constraints:** Maximum length of 2000 characters.

*   `additional-info`
    *   **Description:** Additional information to support your appeal.
    *   **Type:** String
    *   **Required:** No
    *   **Constraints:** Maximum length of 1000 characters.

## Examples

```sh
/appeal case-id:12345 reason:"I believe this ban was a mistake."
/appeal case-id:67890 reason:"I have learned from my actions and will not repeat them." additional-info:"I have read the rules again and understand them better now."
```

## Important Notes

*   You can only appeal your own punishments unless you have moderation permissions.
*   Please be patient after submitting an appeal; staff will review it and you will be notified of the decision.
*   Do not submit duplicate appeals for the same case.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
