const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });

  win.loadURL('https://utoon.net');

  win.webContents.on('did-finish-load', () => {
    const url = win.webContents.getURL();
    const assetsDir = path.join(__dirname, '../assets');

    // Sequential Injection of Libraries + Unified Logic
    const scripts = ['jspdf.min.js', 'jszip.min.js', 'reader_logic.js'];
    scripts.forEach(file => {
      const content = fs.readFileSync(path.join(assetsDir, file), 'utf8');
      win.webContents.executeJavaScript(content);
    });
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
