# Cleanup System

Powerful message management tools to keep your Discord server clean and organized.

## 🧹 Overview

The Cleanup System provides comprehensive message deletion and channel management capabilities. Perfect for removing spam, cleaning up bot messages, or maintaining organized channels.

## ✨ Features

### Multiple Cleanup Types
- **User-Specific**: Delete messages from specific users
- **Amount-Based**: Delete a set number of recent messages  
- **Bot Cleanup**: Remove bot messages only
- **Channel Recreation**: Complete channel cleanup (all messages)

### Smart Filtering
- **14-Day Limit**: Respects Discord's bulk delete limitations
- **Permission Checking**: Validates permissions before execution
- **Selective Deletion**: Target specific message types
- **Safety Confirmations**: Prevents accidental deletions

### Advanced Options
- **Cross-Channel**: Clean messages in any text channel
- **Flexible Amounts**: 1-100 messages per operation
- **Bulk Operations**: Efficient message deletion
- **Error Handling**: Graceful failure recovery

---

## 🚀 Quick Start

### 1. Basic Message Cleanup
```bash
/cleanup amount count:10
```
Deletes the 10 most recent messages in the current channel.

### 2. User-Specific Cleanup
```bash
/cleanup user user:@SpamUser amount:25
```
Deletes the last 25 messages from a specific user.

### 3. Bot Message Cleanup
```bash
/cleanup bots amount:50
```
Removes the last 50 messages sent by bots.

### 4. Complete Channel Reset
```bash
/cleanup all channel:#old-chat confirm:true
```
⚠️ **Warning**: This recreates the channel, deleting ALL messages permanently.

---

## 📋 Commands

### `/cleanup user`
Delete messages from a specific user
- **`user`** (required) - User whose messages to delete
- **`amount`** (optional) - Number of messages (1-100, default: 50)
- **`channel`** (optional) - Target channel (default: current channel)

**Example:**
```bash
/cleanup user user:@TroubleMaker amount:30 channel:#general
```

### `/cleanup amount`  
Delete a specific number of recent messages
- **`count`** (required) - Number of messages to delete (1-100)
- **`channel`** (optional) - Target channel (default: current channel)

**Example:**
```bash
/cleanup amount count:15 channel:#spam-cleanup
```

### `/cleanup bots`
Delete messages from bots only
- **`amount`** (optional) - Number of bot messages (1-100, default: 50)  
- **`channel`** (optional) - Target channel (default: current channel)

**Example:**
```bash
/cleanup bots amount:25 channel:#bot-commands
```

### `/cleanup all`
⚠️ **DESTRUCTIVE**: Recreate channel to remove ALL messages
- **`channel`** (required) - Channel to recreate
- **`confirm`** (required) - Must be `true` to confirm action

**Example:**
```bash
/cleanup all channel:#reset-me confirm:true
```

---

## 🔧 Configuration Guide

### Permission Requirements
**Required Bot Permissions:**
- **Manage Messages** - Delete individual messages
- **Read Message History** - Fetch messages to delete
- **View Channel** - Access channel content
- **Manage Channels** - For complete channel recreation (cleanup all)

**Required User Permissions:**
- **Manage Messages** - Basic cleanup operations
- **Manage Channels** - Channel recreation option

### Cleanup Limitations
**Discord API Restrictions:**
- Maximum 100 messages per operation
- Can only bulk delete messages newer than 14 days
- Messages older than 14 days must be deleted individually
- Rate limits apply to prevent API abuse

### Channel Types Supported
- **Text Channels** - Standard server text channels
- **Announcement Channels** - Server announcement channels
- **Thread Channels** - Messages within threads

---

## 🎯 Use Cases & Examples

### Spam Cleanup
**Scenario**: User posted 20 spam messages
```bash
/cleanup user user:@SpamBot amount:20
```
**Result**: Removes all spam messages from that user

### Bot Command Cleanup
**Scenario**: Too many bot responses cluttering chat
```bash
/cleanup bots amount:30 channel:#bot-commands
```
**Result**: Removes bot messages, keeps user messages

### Event Cleanup
**Scenario**: After a big server event, need to clean up
```bash
/cleanup amount count:100 channel:#event-chat
```
**Result**: Removes the most recent 100 messages

### Channel Reset
**Scenario**: Channel compromised or needs fresh start
```bash
/cleanup all channel:#compromised-chat confirm:true
```
**Result**: Complete channel recreation with same permissions

### Maintenance Cleanup
**Scenario**: Regular server maintenance
```bash
# Clean up old bot messages
/cleanup bots amount:50 channel:#general

# Remove test messages from staff
/cleanup user user:@TestModerator amount:15

# Clean announcement backlog
/cleanup amount count:25 channel:#announcements
```

---

## 💡 Best Practices

### Regular Maintenance
- **Schedule regular cleanups** of high-traffic channels
- **Clean bot commands** weekly to reduce clutter
- **Target specific users** for rule violations
- **Use smaller amounts** frequently rather than large batches

### Safety Measures
- **Test in low-activity channels** first
- **Double-check target channels** before running
- **Use smaller amounts** to avoid accidents
- **Have backups** of important messages/channels

### Performance Tips
- **Clean during low-activity times** to reduce disruption
- **Use specific targeting** (user/bots) instead of amount when possible
- **Split large cleanups** into multiple smaller operations
- **Monitor rate limits** if doing multiple cleanups

### Channel Management
- **Archive important content** before major cleanups
- **Notify users** before cleaning active channels
- **Update channel descriptions** if behavior changes
- **Consider pinning** important messages before cleanup

---

## 🛡️ Safety Features

### Confirmation Systems
- **Complete channel deletion** requires explicit confirmation
- **Permission validation** before any operation
- **Error messages** for invalid operations
- **Safe defaults** for optional parameters

### Discord Limitations
- **14-day rule**: Only recent messages can be bulk deleted
- **Rate limiting**: Prevents API abuse
- **Permission checks**: Validates access before operation
- **Channel recreation**: Preserves permissions and settings

### Recovery Options
- **Channel recreation** maintains original permissions
- **Position preservation** keeps channel in same location
- **Category retention** maintains channel organization
- **Role permissions** automatically restored

---

## 🆘 Troubleshooting

### **"Missing Permissions" Error**
**Cause**: Bot lacks required permissions
**Solution**: 
- Grant bot **Manage Messages** permission
- Ensure bot can **Read Message History**
- Verify bot has **View Channel** access

### **"Cannot Delete Old Messages" Error**
**Cause**: Messages older than 14 days cannot be bulk deleted
**Solution**:
- Use smaller cleanup amounts more frequently
- Consider manual deletion for very old messages
- Use `/cleanup all` for complete channel reset

### **"No Messages Found" Warning**
**Cause**: No messages match the cleanup criteria
**Solution**:
- Check if target user has recent messages
- Verify channel has messages to delete
- Adjust time frame or amount parameters

### **"Rate Limited" Error**
**Cause**: Too many cleanup operations too quickly
**Solution**:
- Wait a few minutes between large cleanups
- Use smaller amounts per operation
- Spread cleanup tasks across different time periods

### **"Channel Recreation Failed" Error**
**Cause**: Insufficient permissions or API error
**Solution**:
- Ensure bot has **Manage Channels** permission
- Check if channel has special restrictions
- Verify bot role is high enough in hierarchy

---

## ⚙️ Advanced Usage

### Automation Ideas
- **Scheduled cleanups** using external tools
- **Reaction-based cleanup** (users react to trigger)
- **Integration with moderation** logs
- **Custom cleanup rules** based on server needs

### Bulk Operations
```bash
# Clean multiple channel types
/cleanup bots amount:30 channel:#general
/cleanup bots amount:30 channel:#music  
/cleanup bots amount:30 channel:#games

# Target multiple problem users
/cleanup user user:@User1 amount:20
/cleanup user user:@User2 amount:15
/cleanup user user:@User3 amount:25
```

### Maintenance Schedules
- **Daily**: Bot command channels
- **Weekly**: High-traffic general channels  
- **Monthly**: Archive/cleanup old event channels
- **As needed**: Spam/violation cleanup

### Integration with Other Systems
- **Modlog**: Cleanup actions can be logged
- **Welcome system**: Clean old welcome messages
- **Ticket system**: Cleanup resolved ticket channels
- **Music bot**: Clean music command spam

---

## 📊 Cleanup Statistics

### Typical Usage Patterns
- **Most common**: 10-50 message cleanups
- **Bot cleanup**: Usually 20-100 messages
- **User targeting**: Often 5-30 messages
- **Channel recreation**: Rare, high-impact operations

### Performance Metrics  
- **Small cleanups** (1-10): Instant
- **Medium cleanups** (11-50): 1-3 seconds
- **Large cleanups** (51-100): 3-10 seconds
- **Channel recreation**: 5-15 seconds

---

*Keep your Discord server clean and organized with powerful, safe cleanup tools!*
