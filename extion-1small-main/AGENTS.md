# AGENTS.md — Utoon Ultimate Pro Extension & Mobile App

## Project Overview
Utoon Ultimate Pro is a Manifest V3 Chrome Extension and a Capacitor-based Mobile App designed to enhance the reading experience on [utoon.net](https://utoon.net).

## File Structure
- **Utoon_Ultimate_Pro_Final/**: Consolidated Chrome Extension source.
  - **manifest.json**: Extension config.
  - **background.js**: Auto-injection logic.
  - **reader_logic.js**: Core reader UI.
- **Utoon_Mobile_App/**: Capacitor Mobile App source.
  - **android/app/src/main/java/com/utoon/app/MainActivity.java**: Native URL Listener and Script Injection logic.
  - **www/index.html**: Mobile app UI.

## Key APIs
- **Internal API**: `https://utoon.net/wp-json/icmadara/v1/`

## Testing Locally (Extension)
1. Load unpacked extension from `Utoon_Ultimate_Pro_Final` in Chrome.

## Testing Locally (Mobile)
1. The mobile app logic is in `MainActivity.java`. It intercepts the WebView to inject scripts on chapter pages.

## Electron (Desktop) Support
- **Utoon_Mobile_App/electron/**: Electron source for Windows/Desktop app.
  - **src/index.js**: Electron main process with `did-finish-load` listener for script injection.
  - **assets/**: Bundled scripts for the desktop app.

## Building the Desktop App
- Use `electron-builder` via `npm run dist` in the `Utoon_Mobile_App/electron` folder.
- Output: `dist/Utoon Ultimate Pro 2.0.0.exe` (Portable).
