# 🎫 Ticket Info Extractor v2.2.0

A cross-browser extension that automatically displays ticket information on securemypass.com ticket pages with a modern, draggable overlay.

## 🚀 **Major Fixes in v2.2.0**

All the critical issues from v2.1.1 have not yet been resolved:

🕝 **CSP Violations Fixed** - No more "Content Security Policy" errors  
🕝 **Theme Toggle Working** - Dark/light mode button now responds properly  
🕝 **Popup Button Fixed** - "Force Manual Extraction" now works correctly  
🕝 **Navigation Working** - Click tickets in overlay to jump between them  
🕝 **Position Updates** - Real-time "X of Y" position indicator  
🕝 **Error Handling** - Comprehensive error handling prevents crashes  

## ✨ Features

- **Auto-Overlay**: Automatically detects and displays ticket info when you visit ticket pages
- **Dark/Light Mode Toggle**: Manual theme switcher with persistent preferences (🌙/☀️ button)
- **Adjustable Height**: Toggle overlay height between compact and full view (📏 button)
- **Multi-Ticket Navigation**: Click tickets in overlay to navigate between them on multi-ticket pages
- **Modern Design**: Sleek sliding animation with draggable overlay
- **Optimized Layout**: Compact design that maximizes space efficiency
- **Cross-Browser**: Works on Chrome, Firefox, Edge, Brave, Opera
- **One-Click Copy**: Copy all ticket information to clipboard
- **Responsive**: Adapts to different screen sizes
- **Smart Detection**: Automatically detects current ticket position from page state

## 🚀 Installation

### For Chrome, Edge, Brave, Opera (Chromium-based)

1. Download or clone this repository
2. Open your browser's extension page:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
   - **Brave**: `brave://extensions/`
   - **Opera**: `opera://extensions/`

3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder
5. Make sure `manifest.json` is in the root folder

### For Firefox

1. Download or clone this repository
2. Rename `manifest-firefox.json` to `manifest.json` (replace the existing one)
3. Open Firefox and go to `about:debugging`
4. Click "This Firefox"
5. Click "Load Temporary Add-on"
6. Select the `manifest.json` file from the extension folder

> **Note**: For permanent Firefox installation, you'll need to package and sign the extension through Mozilla's process.

## 🎯 How It Works

### Automatic Overlay
- Navigate to any `securemypass.com/tickets/1/` URL
- The overlay automatically slides up from the bottom right
- Shows current ticket info prominently
- Displays all tickets if multiple are available

### Theme Control
- **Dark/Light Toggle**: Click the 🌙/☀️ button in header to switch themes
- **Persistent Preference**: Your theme choice is saved and remembered
- **System Detection**: Defaults to your system theme preference

### Multi-Ticket Navigation
- **Current Ticket Detection**: Automatically detects which ticket is being viewed from page state
- **Click to Navigate**: Click any ticket in the "All Tickets" section to jump to it
- **Position Indicator**: Shows "X of Y" in header for multi-ticket pages
- **Smart Navigation**: Uses same navigation method as the website's arrows

### Manual Control
- **Drag**: Click and drag the header to move the overlay anywhere
- **Close**: Click the × button to close the overlay
- **Copy**: Click "Copy Info" to copy all ticket details to clipboard

## 🛠️ Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Full Support | Uses Manifest V3 |
| Edge | ✅ Full Support | Uses Manifest V3 |
| Brave | ✅ Full Support | Uses Manifest V3 |
| Opera | ✅ Full Support | Uses Manifest V3 |
| Firefox | ✅ Full Support | Uses Manifest V2, requires separate manifest |

## 📱 Responsive Design

The overlay automatically adapts to:
- **Mobile screens**: Full width with spacing
- **Small windows**: Reduced max height
- **Dark mode**: Automatic dark theme detection
- **High DPI**: Enhanced shadows and clarity

## 🎨 Modern Features

- **Smooth animations**: 250ms slide-up with cubic-bezier easing
- **Glassmorphism**: Backdrop blur effects
- **Gradient design**: Modern color schemes
- **Micro-interactions**: Hover effects and button animations
- **Accessibility**: Proper contrast and focus states

## 🔧 Technical Details

### File Structure
```
ticket-extractor/
├── manifest.json           # Chromium browsers  
├── manifest-firefox.json   # Firefox (rename to manifest.json)
├── content.js              # Main content script (completely rewritten)
├── popup.html              # Extension popup (CSP compliant)
├── popup.js                # Popup JavaScript (separated from HTML)
├── overlay.css             # Overlay styling with theme support
└── README.md               # This file
```

### Target URLs
Only activates on URLs matching:
- `https://securemypass.com/tickets/1/*.html`

### Data Detection
Extracts ticket information from:
- `window.ticketsData` variable
- Embedded script tags containing ticket data
- Vue.js application state for current ticket detection

## 🐛 Troubleshooting

### Overlay Not Appearing
1. Refresh the ticket page
2. Check if URL matches pattern: `securemypass.com/tickets/1/`
3. Look for JavaScript errors in browser console (F12)
4. Try manual extraction via extension popup

### Theme Toggle Not Working
1. Check browser console for error messages when clicking
2. Ensure overlay is fully loaded before clicking theme button
3. Theme preference is saved to localStorage

### Multi-Ticket Navigation Issues
1. Extension detects navigation from "X of Y" text on page
2. Check browser console for navigation attempt logs
3. Some pages may have delayed loading - wait a few seconds after page load
4. Navigation works by simulating clicks on the page's arrow elements

### Extension Popup Issues
1. "Force Manual Extraction" should re-show overlay even if closed
2. Check that content script is loaded (visible in Developer Tools)
3. Some browsers may block certain permissions

### Firefox Issues
1. Ensure you're using `manifest-firefox.json` renamed to `manifest.json`
2. Check that "Developer mode" or temporary add-on loading is enabled
3. Some Firefox versions may require additional permissions

### Content Security Policy (CSP) Errors
1. **Issue**: "Refused to execute inline script" errors in browser console
2. **Fixed in v2.2.0**: All JavaScript moved to separate `.js` files
3. **Solution**: Ensure you're using the latest version with `popup.js` file included

### "Cannot access 'globalExtractor' before initialization" Errors
1. **Issue**: Race condition when extension loads before page is ready
2. **Fixed in v2.2.0**: Improved initialization timing and error handling
3. **Solution**: Extension now waits for proper page load before initializing

### Theme Toggle Not Working
1. **Issue**: Event listeners not attaching properly to dynamically created elements
2. **Fixed in v2.2.0**: Changed from `addEventListener` to `onclick` for better reliability
3. **Debug**: Check browser console for "Theme toggle clicked via onclick" message

### Multi-Ticket Navigation Issues
1. **Issue**: Clicks not registering on page navigation elements
2. **Fixed in v2.2.0**: Multiple click methods with fallbacks (click, dispatchEvent, mouse events)
3. **Debug**: Console shows detailed navigation attempt logs
4. **Verification**: Extension now verifies position changes after each navigation attempt

## 📄 License

This extension is provided as-is for personal use. Feel free to modify and customize for your needs.

## 🔄 Changelog

### v2.2.0 (Latest)
- 🔧 **MAJOR FIX**: Resolved all CSP (Content Security Policy) violations by separating popup JavaScript
- 🔧 **MAJOR FIX**: Fixed theme toggle functionality with improved event handling (onclick vs addEventListener)
- 🔧 **MAJOR FIX**: Fixed popup "Force Manual Extraction" button with proper async message handling
- 🔧 **MAJOR FIX**: Completely rebuilt multi-ticket navigation with multiple click methods and verification
- 🔧 **MAJOR FIX**: Enhanced position detection and real-time overlay updates
- ✅ Added adjustable overlay height toggle (📏 button)
- ✅ Improved error handling and debugging throughout the extension
- ✅ Enhanced mutation observer for better change detection
- ✅ Added comprehensive try-catch blocks to prevent crashes
- ✅ Better browser API detection for cross-browser compatibility

### v2.1.1
- 🔧 Fixed copy button alignment and width overflow issues
- 🔧 Fixed theme toggle not responding to clicks (improved event handling)
- 🔧 Fixed popup "Force Manual Extraction" button functionality
- 🔧 Enhanced multi-ticket navigation with better element detection
- 🔧 Improved change detection with comprehensive mutation observer
- 🔧 Added periodic position checking as backup for navigation detection
- 🔧 Better error handling and debug logging for troubleshooting

### v2.1
- ✅ Added manual dark/light mode toggle with persistent preferences
- ✅ Fixed text contrast and colors for both themes
- ✅ Eliminated horizontal scrollbar issues
- ✅ Added multi-ticket navigation - click tickets to jump between them
- ✅ Improved current ticket detection from page state ("X of Y" text)
- ✅ Optimized space usage with reduced padding and better layout
- ✅ Enhanced multi-ticket support for both barcodeless and barcoded tickets

### v2.0
- ✅ Added automatic overlay functionality
- ✅ Cross-browser compatibility (Chrome, Firefox, Edge, Brave, Opera)
- ✅ Modern sliding animations
- ✅ Draggable overlay
- ✅ Multi-ticket support with current ticket highlighting
- ✅ Responsive design
- ✅ Basic dark mode support

### v1.0
- Basic popup-based ticket extraction

- Chrome extension only
