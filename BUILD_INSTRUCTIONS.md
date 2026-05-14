# Utoon Ultimate Pro - Distribution Guide

## 1. Updating the Version
- Change `VERSION` in `Utoon_Ultimate_Pro_Final/reader_logic.js`.
- Update `manifest.json` (Extension) and `package.json` (Electron).
- Update `min_version` in Supabase `app_config` table to force users to update.

## 2. PC (Windows) Build
```bash
cd Utoon_Mobile_App/electron
npm install
npm run dist
```
- Result: `dist/Utoon Ultimate Pro 2.2.0.exe` (Portable).
- **Security**: The logic is automatically obfuscated during this process.

## 3. Mobile (Android) Build
- Run `npx cap sync android` in `Utoon_Mobile_App`.
- Build in Android Studio as usual.

## 4. Remote Management (Supabase)
- **Licenses**: Manage premium keys in the `licenses` table.
- **Config**: Use `app_config` to toggle `ads_enabled` or `limits_enabled`.
