# Utoon Ultimate Pro Unified v2.1

## Project Overview
This project provides a unified reading experience for [utoon.net](https://utoon.net) across Chrome Extension, Windows Desktop, and Android Mobile platforms. All logic is consolidated into a single master script (`reader_logic.js`).

## File Structure
- **Utoon_Ultimate_Pro_Final/**: Chrome Extension.
  - `manifest.json`: Version 2.1, Broad Injection.
  - `background.js`: Handles script injection on every utoon.net page.
  - `reader_logic.js`: **Unified Master Logic** (Reader, Effects, Themes, Manga Fixes, Bulk Download, Ads, Licensing).
- **Utoon_Mobile_App/**: Capacitor Mobile & Electron Desktop.
  - `electron/`: Windows App source.
    - `src/index.js`: Entry point, shows login screen, injects master logic.
    - `assets/login.html`: Premium activation screen.
    - `package.json`: Includes `electron-builder` and `javascript-obfuscator`.
  - `android/`: Mobile App source.
    - `MainActivity.java`: Injects master logic into Android WebView.

## Features & Logic
- **Premium System**: Powered by Supabase. Free users have a 2-chapter/day limit and see ads.
- **Bulk Download**: Available on Manga main pages. Supports ZIP/PDF.
- **Ghost Buttons**: Auto-fix locked links on Manga lists.
- **Enhanced UI**: Custom Zoom (10%-300%), centering, and high-quality FX (Matrix, Fire, etc.).

## Build Instructions
### PC (Windows)
1. `cd Utoon_Mobile_App/electron`
2. `npm install`
3. `npm run dist` -> Generates obfuscated portable `.exe` in `dist/`.

### Mobile (Android)
1. `cd Utoon_Mobile_App`
2. `npx cap sync android`
3. Open in Android Studio and Build APK.

### Chrome Extension
1. Load `Utoon_Ultimate_Pro_Final` as unpacked extension.
