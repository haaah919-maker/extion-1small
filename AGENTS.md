# Utoon Ultimate Pro Unified v2.1

## Project Structure
- **Utoon_Ultimate_Pro_Final/**: Consolidated Chrome Extension.
  - `reader_logic.js`: Unified core script (Reader + Effects + Themes + Navigation).
  - `fix_links.js`: Content script for unlocking links on manga pages.
- **Utoon_Mobile_App/**: Capacitor Mobile App and Electron Desktop App.
  - `electron/`: PC (Windows) source.
  - `android/`: Mobile (Android) source.

## Features
- Functional CHAPTERS button with side panel.
- Functional NEXT/PREV and EXIT buttons.
- High-quality effects: Matrix, Magic, Storm, Sakura, Romance.
- Themes: Purple, Black, Manga Cover, Frost.
- Integrated high-speed ZIP/PDF download.
- Universal storage (Extension & App support).

## Building PC Version
1. `cd Utoon_Mobile_App/electron`
2. `npm install`
3. `npm run dist` (portable .exe in dist/)

## Building Mobile Version
1. `cd Utoon_Mobile_App`
2. `npx cap sync android`
3. Build in Android Studio.
