# AGENTS.md — Utoon Ultimate Pro Extension

## Project Overview
Utoon Ultimate Pro is a Manifest V3 Chrome Extension designed to enhance the reading experience on [utoon.net](https://utoon.net). It provides a custom reader UI, fixes locked chapter links, and offers various reading features like auto-scroll, themes, and image downloads.

## File Structure (`Utoon_Ultimate_Pro_Final/`)
- **manifest.json**: Extension configuration, Manifest V3, required permissions (activeTab, scripting, tabs, storage), and host permissions for utoon.net.
- **background.js**: Service worker handling background tasks and auto-injection logic for the reader on chapter pages.
- **fix_links.js**: Content script that runs on all utoon.net pages to fix/unlock chapter links by injecting ghost buttons.
- **reader_logic.js**: The core reader engine and UI, injected into chapter pages to provide a seamless reading experience.
- **popup.html / popup.js**: The extension's popup UI for quick access and settings.
- **jspdf.min.js / jszip.min.js**: Third-party libraries used for generating PDF and ZIP files of manga chapters.
- **icons/**: Directory containing the extension icons.

## Key APIs
- **Internal API**: `https://utoon.net/wp-json/icmadara/v1/`
  - Used for fetching manga details and chapter image URLs.

## Known Limitations & Improvements
- Fallback image loading can be slow (Task 5 aims to improve this).
- `fix_links.js` performance can be optimized (Task 7).
- Popup UI is minimal (Task 6).

## Testing Locally
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select the `Utoon_Ultimate_Pro_Final` folder.
4. Navigate to any manga chapter on [utoon.net](https://utoon.net) to trigger the reader.
