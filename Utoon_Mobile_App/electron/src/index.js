const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load Utoon
  win.loadURL('https://utoon.net');

  // URL Listener for Injection
  win.webContents.on('did-finish-load', () => {
    const url = win.webContents.getURL();
    if (url.includes('/chapter-')) {
      injectReader(win.webContents);
    }
  });
}

async function injectReader(webContents) {
  try {
    const assetsDir = path.join(__dirname, '../assets');

    const jspdf = fs.readFileSync(path.join(assetsDir, 'jspdf.min.js'), 'utf8');
    const jszip = fs.readFileSync(path.join(assetsDir, 'jszip.min.js'), 'utf8');
    const readerLogic = fs.readFileSync(path.join(assetsDir, 'reader_logic.js'), 'utf8');

    // Sequential injection
    await webContents.executeJavaScript(jspdf);
    await webContents.executeJavaScript(jszip);
    await webContents.executeJavaScript(readerLogic);

    console.log('Reader injected successfully into Electron window');
  } catch (err) {
    console.error('Failed to inject reader:', err);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
