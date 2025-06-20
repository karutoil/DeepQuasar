# 🎫 Ticket System - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### Step 1: Initial Setup
```
/tickets setup
```
- Select **Open Category** (where new tickets go)
- Select **Closed Category** (where closed tickets go)  
- Select **Log Channel** (for ticket events)

### Step 2: Add Staff
```
/tickets staff add role:@Support
```
- Add your support/staff roles
- They can now manage tickets

### Step 3: Create Ticket Panel
```
/panel create channel:#general
```
- Creates a panel in your chosen channel
- Users can click buttons to create tickets

## ✅ You're Done!
Your ticket system is now ready! Users can click the panel buttons to create tickets.

---

## 🎛️ Common Configurations

### Enable Auto-Close
```
/tickets autoclose enabled:true hours:24
```
Automatically closes inactive tickets after 24 hours.

### Configure Rate Limiting
```
/tickets settings rate_limit_tickets:3 rate_limit_minutes:60
```
Users can create max 3 tickets per hour.

### Enable Transcripts
```
/tickets transcripts enabled:true format:html
```
Saves ticket conversations when closed.

### Add Custom Button
```
/panel add-button panel_id:abc123 type:billing label:"Billing Issue" emoji:💳
```

---

## 🎫 Managing Tickets

### In Ticket Channels
- Click **🔒 Close Ticket** to close
- Click **👤 Assign to Me** to claim
- Click **📄 Generate Transcript** for record

### Via Commands
```
/ticket list status:open           # View all open tickets
/ticket assign staff_member:@john  # Assign to someone  
/ticket priority level:urgent      # Set priority
/ticket tag action:add tag:billing # Add tags
```

---

## 🔧 Advanced Features

### Multiple Panels
Create different panels for different purposes:
```
/panel create channel:#support title:"Technical Support"
/panel create channel:#billing title:"Billing & Payments"
```

### Custom Questions
Each ticket type can have custom questions in the modal form.

### Staff Permissions
Fine-tune what each staff role can do:
- View tickets
- Assign tickets  
- Close tickets
- Delete tickets
- Reopen tickets

### Transcripts
Automatic conversation logs in HTML, TXT, or JSON format.

### Auto-Management
- Auto-close inactive tickets
- Rate limiting to prevent spam
- DM notifications to users
- Comprehensive logging

---

## 📋 Command Quick Reference

| Command | Purpose |
|---------|---------|
| `/tickets setup` | Initial configuration |
| `/tickets config` | View current settings |
| `/panel create` | Create ticket panel |
| `/panel list` | List all panels |
| `/ticket list` | List tickets |
| `/ticket close` | Close ticket |
| `/ticket assign` | Assign to staff |
| `/tickets staff add` | Add staff role |

---

## 🆘 Need Help?

### Common Issues
1. **Panel not working** - Check bot permissions in channel
2. **No tickets appearing** - Verify categories are set correctly  
3. **Staff can't see tickets** - Add them with `/tickets staff add`

### Support
- Check `/tickets config` for current settings
- Use `/ticket info` to debug specific tickets
- Review logs in your configured log channel

---

## 🎉 You're All Set!

Your advanced ticket system is now fully operational with:
- ✅ Automated ticket creation
- ✅ Staff management
- ✅ Transcript generation  
- ✅ Auto-close functionality
- ✅ Rate limiting
- ✅ Comprehensive logging
- ✅ Multi-guild support

Enjoy your new professional ticket system! 🚀
