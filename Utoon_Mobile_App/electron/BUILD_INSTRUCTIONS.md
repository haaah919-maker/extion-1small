# Utoon Desktop Build Instructions

## Prerequisites
- Node.js installed.
- Git (optional).

## Build Steps
1. Open terminal in this folder (`Utoon_Mobile_App/electron`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the final executable:
   ```bash
   npm run dist
   ```
4. Locate your file:
   The portable `.exe` will be generated in: `Utoon_Mobile_App/electron/dist/Utoon Ultimate Pro 2.1.0.exe`.

## Security
This build process includes a `javascript-obfuscator` step that protects your `reader_logic.js` file from being read or modified by users.
