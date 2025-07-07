# Welcome System Custom Embed Builder - Quick Start Guide

## 🎯 Overview

The updated welcome system now includes a powerful custom embed builder that allows guild administrators to create completely customized welcome, leave, and DM messages using an interactive interface.

## 🚀 Quick Start

### 1. Launch Custom Embed Builder

```bash
/welcome custom welcome    # Create custom welcome embed
/welcome custom leave      # Create custom leave embed  
/welcome custom dm         # Create custom DM embed
```

### 2. Interactive Builder Interface

When you run a custom command, you'll see:
- **Placeholder Reference** - Shows all available placeholders
- **Live Preview** - See exactly how your embed will look
- **Builder Controls** - Buttons to customize every aspect

### 3. Builder Controls

| Button | Function |
|--------|----------|
| **Title** | Set the main embed title |
| **Description** | Add main embed content |
| **Color** | Choose embed color theme |
| **Author** | Add author section with name/icon |
| **Footer** | Add footer text and icon |
| **Thumbnail** | Add small image (right side) |
| **Image** | Add large image (bottom) |
| **Add Field** | Create organized info sections |
| **Test Embed** | Preview with real data |
| **Save & Enable** | Activate your custom design |

## 📝 Extended Placeholders

### User Placeholders
- `{user.mention}` - @Username
- `{user.tag}` - User#1234
- `{user.username}` - Username only
- `{user.displayName}` - Server display name
- `{user.id}` - User ID
- `{user.avatar}` - User avatar URL
- `{user.banner}` - User banner URL

### Server Placeholders
- `{guild.name}` - Server name
- `{guild.memberCount}` - Current member count
- `{guild.id}` - Server ID
- `{guild.icon}` - Server icon URL
- `{guild.banner}` - Server banner URL
- `{guild.description}` - Server description
- `{guild.boostLevel}` - Boost level (0-3)
- `{guild.boostCount}` - Number of boosts

### Time Placeholders
- `{time}` - Current time (formatted)
- `{date}` - Current date (formatted)
- `{timestamp}` - Discord timestamp (long)
- `{timestamp.short}` - Discord timestamp (short)
- `{account.created}` - Account creation timestamp
- `{account.age}` - "2 years ago"
- `{join.position}` - "#123"
- `{join.date}` - Discord timestamp format

### Welcome-Specific Placeholders
- `{inviter.mention}` - @InviterName
- `{inviter.tag}` - Inviter#1234
- `{invite.code}` - abc123
- `{invite.uses}` - Number of uses

### Leave-Specific Placeholders
- `{time.in.server}` - "45 days"

## 🎨 Example Custom Embed

**Title:** `🎉 Welcome to {guild.name}!`

**Description:**
```
Hello {user.mention}! 

Welcome to our amazing community! You are member **#{guild.memberCount}** to join us.

Your account was created {account.age} and you joined us on {date} at {time}.
```

**Fields:**
- **Name:** `👤 User Info`
  **Value:** `**Username:** {user.tag}\n**Display Name:** {user.displayName}`

- **Name:** `💌 Invitation`
  **Value:** `**Invited by:** {inviter.mention}\n**Invite Code:** {invite.code}`

## ⚙️ Management Commands

```bash
# View current status (shows if custom embeds are enabled)
/welcome status

# Test your custom embed
/welcome custom welcome  # Then click "Test Embed"

# Switch back to default template
/welcome custom welcome  # Then click "Use Default"

# View all available placeholders
/welcome placeholders
```

## 🔧 Pro Tips

1. **Use Live Preview** - Always check the preview before saving
2. **Test First** - Use the "Test Embed" button to see real data
3. **Organize with Fields** - Use fields for structured information
4. **Color Coordination** - Match your server's theme colors
5. **Placeholder Validation** - The system shows you available placeholders for each context

## 🎯 Advanced Features

- **Conditional Content** - Different placeholders for welcome vs. leave
- **Rich Formatting** - Support for Discord markdown in descriptions
- **Image Support** - URLs for thumbnails and main images  
- **Field Organization** - Up to 25 fields with inline options
- **Auto-Save** - Your designs are saved automatically
- **Easy Reset** - Switch between custom and default anytime

## 🛡️ Permissions

- Requires `Manage Server` permission
- Bot needs `Send Messages` and `Embed Links` permissions in welcome channels

---

**Ready to create amazing welcome experiences for your server members!** 🎉
