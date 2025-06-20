# Embed Builder System

Create beautiful, professional Discord embeds with an easy-to-use interactive interface.

## 🎨 Overview

The Embed Builder allows server administrators to create rich, visually appealing embeds without any coding knowledge. Perfect for announcements, rules, welcome messages, and more.

## ✨ Features

### Interactive Builder Interface
- **Live Preview**: See your embed as you build it
- **Button-Based Controls**: Easy point-and-click interface
- **Real-Time Updates**: Changes appear immediately
- **Template System**: Save and reuse embed designs

### Embed Components
- **Title & Description**: Main content areas
- **Author Section**: Name, icon, and clickable link
- **Footer**: Bottom text with optional icon
- **Thumbnail & Images**: Visual elements
- **Fields**: Up to 25 organized data sections
- **Colors**: Custom color themes
- **Timestamps**: Automatic or custom time display
- **URLs**: Clickable embed titles

### Advanced Features
- **Field Management**: Add, edit, remove, and reorder fields
- **Inline Fields**: Side-by-side field layout
- **Color Picker**: Hex color codes or presets
- **URL Validation**: Ensures links work properly
- **Character Limits**: Automatic validation and warnings
- **Template Saving**: Store designs for future use

---

## 🚀 Quick Start

### 1. Launch the Builder
```bash
/embed builder
```

### 2. Set Basic Information
- Click **"Set Title"** to add a main heading
- Click **"Set Description"** for the main content
- Choose a **color theme** with the color picker

### 3. Add Visual Elements
- **Author**: Add name/icon at the top
- **Thumbnail**: Small image on the right
- **Image**: Large image in the embed
- **Footer**: Bottom text with optional icon

### 4. Add Fields (Optional)
- Click **"Add Field"** for organized information
- Set **field names** and **values**
- Choose **inline** for side-by-side layout

### 5. Send Your Embed
- Click **"Send to Channel"** when finished
- Choose the destination channel
- Add optional message content

---

## 📋 Commands

### Main Command
| Command | Description |
|---------|-------------|
| `/embed builder` | Launch the interactive embed builder interface |

### Builder Interface Options
- **🎨 Set Title** - Add main embed heading
- **📝 Set Description** - Add main embed content  
- **🎯 Set Author** - Add author name, icon, and link
- **🖼️ Set Thumbnail** - Add small image (right side)
- **🌅 Set Image** - Add large image (bottom)
- **👣 Set Footer** - Add bottom text and icon
- **🌈 Set Color** - Choose embed color theme
- **⏰ Toggle Timestamp** - Add current time display
- **🔗 Set URL** - Make title clickable
- **➕ Add Field** - Add organized data sections
- **✏️ Edit Fields** - Modify existing fields
- **🗑️ Remove Field** - Delete fields
- **📋 Load Template** - Use saved designs
- **💾 Save Template** - Store current design
- **📤 Send to Channel** - Publish your embed
- **❌ Cancel** - Exit without saving

---

## 🔧 Configuration Guide

### Basic Embed Setup
1. **Title**: Main heading (up to 256 characters)
   - Should be descriptive and eye-catching
   - Example: "Server Rules" or "Weekly Event"

2. **Description**: Main content (up to 4096 characters)
   - Supports Discord markdown formatting
   - Use `**bold**`, `*italic*`, `__underline__`
   - Add `\n` for line breaks

3. **Color**: Visual theme
   - Use hex codes: `#FF0000` for red
   - Or color names: `red`, `blue`, `green`
   - Default: Discord blurple (`#5865F2`)

### Author Section
- **Name**: Person or organization name
- **Icon**: Small image next to name (URL required)
- **URL**: Make author name clickable

### Images
- **Thumbnail**: Small image on the right (recommended: 128x128px)
- **Main Image**: Large image at bottom (recommended: 400x200px)
- **Must be valid image URLs** (png, jpg, gif, webp)

### Fields System
Perfect for organizing information:
- **Name**: Field heading (up to 256 characters)
- **Value**: Field content (up to 1024 characters)  
- **Inline**: Display side-by-side (up to 3 per row)
- **Maximum**: 25 fields per embed

### Footer
- **Text**: Bottom message (up to 2048 characters)
- **Icon**: Small image next to footer text
- **Timestamp**: Automatically adds current time

---

## 🎯 Use Cases & Examples

### Server Announcements
```
Title: 📢 Server Update v2.1
Description: We've added new features and improved performance!
Color: #00FF00 (green)
Fields:
  - Name: "New Features", Value: "• New music commands\n• AI chatbot\n• Auto-moderation"
  - Name: "Bug Fixes", Value: "• Fixed connection issues\n• Improved stability"
Footer: "Update deployed on"
Timestamp: Enabled
```

### Welcome Messages
```
Title: Welcome to Our Community! 🎉
Description: We're excited to have you here!
Color: #FF6B6B (warm red)
Author: Server name with server icon
Thumbnail: Server logo
Fields:
  - Name: "📋 Read the Rules", Value: "Check #rules channel"
  - Name: "🎮 Get Started", Value: "Visit #getting-started"
  - Name: "❓ Need Help?", Value: "Ask in #support"
```

### Event Announcements
```
Title: 🎮 Gaming Tournament
Description: Join us for our monthly gaming competition!
Color: #9B59B6 (purple)
Image: Tournament banner image
Fields:
  - Name: "📅 Date", Value: "Saturday, June 25th", Inline: true
  - Name: "⏰ Time", Value: "7:00 PM EST", Inline: true
  - Name: "🏆 Prize", Value: "$100 Steam Gift Card", Inline: true  
  - Name: "🎯 How to Join", Value: "React with 🎮 to participate"
Footer: "Good luck to all participants!"
```

### Information Panels
```
Title: 🤖 Bot Commands
Description: Here are the most useful bot commands:
Color: #3498DB (blue)
Fields:
  - Name: "🎵 Music", Value: "`/play` - Play music\n`/queue` - Show queue", Inline: true
  - Name: "🛡️ Moderation", Value: "`/cleanup` - Delete messages\n`/modlog` - Setup logging", Inline: true
  - Name: "⚙️ Settings", Value: "`/settings` - Configure bot\n`/help` - Get help", Inline: true
```

---

## 💡 Best Practices

### Design Tips
- **Keep it clean**: Don't overload with too much information
- **Use consistent colors**: Match your server's theme
- **Organize with fields**: Break up large text blocks
- **Test on mobile**: Ensure it looks good on all devices

### Content Guidelines
- **Clear titles**: Make purpose obvious at a glance
- **Concise descriptions**: Get to the point quickly
- **Use formatting**: Bold important information
- **Add emojis**: Make it visually appealing (but don't overdo it)

### Technical Tips
- **Image URLs**: Use reliable hosting (Discord CDN, Imgur, etc.)
- **Field limits**: Stay under character limits for each section
- **URL validation**: Test all links before publishing
- **Mobile preview**: Check how it appears on different screen sizes

### Accessibility
- **Alt text**: Describe images in surrounding text
- **Color contrast**: Ensure text is readable
- **Clear language**: Avoid jargon and complex terms
- **Logical order**: Present information in a sensible flow

---

## 🔒 Permissions Required

### To Use Embed Builder
- **Manage Messages** permission
- OR **Administrator** permission  
- OR Be the server owner

### To Send Embeds
- Bot needs **Send Messages** permission in target channel
- Bot needs **Embed Links** permission
- User needs permission to send messages in target channel

---

## 🆘 Troubleshooting

### **Builder Won't Open**
- Check you have **Manage Messages** permission
- Ensure bot is online and responsive
- Try in a different channel

### **Images Not Showing**
- Verify image URLs are direct links to image files
- Check image hosting service is reliable
- Ensure URLs use `https://` not `http://`
- Test URLs in a web browser first

### **Embed Too Long**
- Description limit: 4,096 characters
- Title limit: 256 characters  
- Field value limit: 1,024 characters each
- Total embed limit: 6,000 characters

### **Can't Send to Channel**
- Check bot has permissions in target channel
- Verify channel still exists
- Ensure bot has **Embed Links** permission

### **Templates Not Saving**
- Check database connection
- Verify you have proper permissions
- Try creating template with shorter name

---

## 🎨 Advanced Features

### Template System
- **Save frequently used designs**
- **Share templates** between team members
- **Quick loading** for repeated embed types
- **Backup important** embed configurations

### Color Schemes
Popular embed color codes:
- **Success**: `#00FF00` or `#2ECC71`
- **Warning**: `#FFFF00` or `#F39C12`  
- **Error**: `#FF0000` or `#E74C3C`
- **Info**: `#00FFFF` or `#3498DB`
- **Discord**: `#5865F2`

### Integration Tips
- **Use with welcome system** for greeting new members
- **Combine with modlog** for formatted notifications
- **Pair with ticket system** for support responses
- **Integrate with announcements** for server updates

---

*The Embed Builder makes professional Discord embeds accessible to everyone - no coding required!*
