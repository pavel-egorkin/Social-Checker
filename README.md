# LinkedIn Job Tracker - Browser Extension

A Chrome/Edge browser extension that automatically tracks LinkedIn job postings matching your criteria and sends notifications every 20 minutes.

## Features

- **Automatic Job Tracking**: Checks LinkedIn every 20 minutes for new jobs
- **Custom Keywords**: Tracks "Senior Product Manager", "Product Ops", "Head of Staff"
- **Location Filtering**: Berlin / Germany, Remote & Hybrid positions
- **Dual Notifications**: Desktop notifications + Telegram integration
- **No Duplicates**: Smart tracking to avoid repeat notifications
- **Background Operation**: Runs silently while your browser is open
- **Beautiful Job List UI**: View all tracked jobs with search and filters
- **Grid/List Views**: Toggle between card grid and list layouts
- **Advanced Filters**: Search by title/company, filter by location, sort by date/name
- **Recent Jobs Badge**: See which jobs were found in the last 24 hours

## Installation

### Step 1: Load the Extension

1. Open Chrome or Edge browser
2. Navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the extension folder (the folder containing this README)
6. The extension should now appear in your extensions list

### Step 2: Grant Permissions

When you first load the extension, it will request:
- Access to LinkedIn.com
- Notification permissions
- Storage permissions

Click "Allow" for all permissions.

### Step 3: Ensure You're Logged into LinkedIn

**IMPORTANT**: You must be logged into LinkedIn in your browser for this extension to work. The extension uses your existing LinkedIn session to search for jobs legitimately.

1. Open a new tab and go to [linkedin.com](https://www.linkedin.com)
2. Log in with your credentials if you're not already logged in
3. Keep this session active

## Configuration

### Desktop Notifications

Desktop notifications are enabled by default. Make sure you allow notifications when Chrome/Edge prompts you.

### Telegram Notifications (Optional)

To receive job alerts on Telegram:

1. Click the extension icon → "Settings"
2. Follow the instructions to:
   - Create a Telegram bot via [@BotFather](https://t.me/botfather)
   - Get your bot token
   - Get your chat ID
3. Enter both values and click "Save Telegram Settings"

**Detailed Telegram Setup:**

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow prompts to create your bot
4. Copy the bot token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Start a chat with your new bot (search for your bot's username)
6. Send any message to your bot (e.g., "hello")
7. Visit: `https://api.telegram.org/bot{YOUR_TOKEN}/getUpdates`
   - Replace `{YOUR_TOKEN}` with your actual token
8. In the JSON response, find `"chat":{"id":123456789}`
9. Copy this chat ID number
10. Enter both token and chat ID in the extension settings

## How It Works

1. **Background Service**: Runs automatically every 20 minutes
2. **Job Search**: Opens a hidden LinkedIn tab with your search criteria
3. **Extraction**: Extracts job listings from the page
4. **Filtering**: Matches against keywords and location
5. **Deduplication**: Checks if job was already seen
6. **Notification**: Sends desktop and/or Telegram notification for new jobs
7. **Cleanup**: Closes the hidden tab

## Usage

### Manual Check

Click the extension icon and press "Check Now" to trigger an immediate job search.

### View Status

The popup shows:
- Number of jobs tracked
- Last check time
- Current configuration
- 5 most recent jobs with quick access
- "View All" link to open full jobs page

### Browse All Jobs

Click "View All" in the popup to open the full jobs page where you can:
- **Search**: Filter by job title or company name
- **Filter by location**: Select specific locations from dropdown
- **Show new jobs only**: Toggle to see only jobs from last 24 hours
- **Sort**: By newest, oldest, title, or company
- **Switch views**: Toggle between grid and list layouts
- **Click any job**: Opens the LinkedIn posting in a new tab

### Clear History

If you want to reset and receive notifications for all matching jobs again:
1. Click extension icon → "Settings"
2. Click "Clear Job History"

## Current Configuration

**Keywords:**
- Senior Product Manager
- Product Ops
- Head of Staff

**Location:**
- Berlin, Germany
- Remote & Hybrid positions

**Check Interval:** Every 20 minutes

**To modify these settings**, edit `background.js` and change the `CONFIG` object:

```javascript
const CONFIG = {
  keywords: [
    'Senior Product Manager',
    'Product Ops',
    'Head of Staff'
  ],
  locations: ['Berlin', 'Germany'],
  // ... etc
};
```

## Troubleshooting

### No Notifications Received

1. Make sure you're logged into LinkedIn
2. Check that notifications are enabled in your browser settings
3. Verify the extension has LinkedIn permissions
4. Click "Check Now" to trigger a manual check

### LinkedIn Changed Their UI

LinkedIn occasionally updates their website structure. If job extraction stops working:

1. The extension uses multiple selectors to handle UI changes
2. Check browser console for errors (F12 → Console tab)
3. You may need to update the selectors in `background.js` and `content.js`

### Telegram Not Working

1. Verify your bot token is correct
2. Make sure you've sent at least one message to your bot
3. Check that the chat ID is your personal chat ID (not a group)
4. Test your bot with: `https://api.telegram.org/bot{TOKEN}/getMe`

### Extension Stopped Working

1. Check if the extension is still enabled in `chrome://extensions/`
2. Try disabling and re-enabling the extension
3. Check if Chrome needs to be restarted
4. Verify LinkedIn is still accessible

## Privacy & Legitimacy

This extension:
- ✅ Uses your existing LinkedIn session (legitimate use)
- ✅ Only accesses LinkedIn when you're logged in
- ✅ Does not store or transmit your LinkedIn credentials
- ✅ Only stores job IDs locally to prevent duplicates
- ✅ Complies with browser extension best practices

**Note**: This extension does not violate LinkedIn's Terms of Service as it operates within your authenticated browser session, similar to how you would manually browse LinkedIn.

## Browser Requirements

- Chrome 88+ or Edge 88+
- Active internet connection
- LinkedIn account

## File Structure

```
ln/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker (main logic)
├── content.js            # Content script for LinkedIn pages
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── jobs.html             # Full jobs page with filters
├── jobs.js               # Jobs page logic
├── options.html          # Settings page
├── options.js            # Settings logic
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Development

To modify the extension:

1. Make changes to the files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Future Enhancements

Possible improvements:
- Configurable keywords via UI (instead of editing code)
- Email notifications
- Slack integration
- Job filtering by company size, industry
- Save favorite jobs
- Export job list

## Support

For issues or questions, check:
- Browser console for error messages
- Extension popup for status information
- LinkedIn connection status

## License

Personal use only.
