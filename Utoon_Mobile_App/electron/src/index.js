const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('disable-gpu'); // Fix for the "Access Denied" error

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800,
    webPreferences: { nodeIntegration: false, contextIsolation: false } // Set contextIsolation to false for login.html to work easily
  });

  const assetsDir = path.join(__dirname, '../assets');

  // Show login screen if no license is stored
  win.loadFile(path.join(assetsDir, 'login.html'));

  win.webContents.on('did-finish-load', () => {
    const url = win.webContents.getURL();
    if (url.startsWith('file://')) return;

    // Inject Unified Script + Libraries on every page load
    const scripts = ['jspdf.min.js', 'jszip.min.js', 'reader_logic.js'];
    scripts.forEach(file => {
      const p = path.join(assetsDir, file);
      if (fs.existsSync(p)) {
        win.webContents.executeJavaScript(fs.readFileSync(p, 'utf8'));
      }
    });
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
