const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true,
        title: "Utoon Ultimate Pro v3.0"
    });

    win.loadURL('https://utoon.net');

    win.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    win.webContents.on('did-finish-load', () => {
        const url = win.webContents.getURL();
        if (!url.includes('utoon.net')) return;

        // Inject UI unlocker + fix_links always
        const scripts = ['ui_unlocker.js', 'fix_links.js'];
        scripts.forEach(name => {
            try {
                const script = fs.readFileSync(path.join(__dirname, '../assets', name), 'utf8');
                win.webContents.executeJavaScript(script).catch(() => {});
            } catch(e) {}
        });

        // Inject reader on chapter pages
        if (url.includes('/chapter-')) {
            injectReader(win.webContents);
        }
    });
}

async function injectReader(webContents) {
    try {
        const assetsDir = path.join(__dirname, '../assets');
        const jszip = fs.readFileSync(path.join(assetsDir, 'jszip.min.js'), 'utf8');
        const jspdf = fs.readFileSync(path.join(assetsDir, 'jspdf.min.js'), 'utf8');
        const reader = fs.readFileSync(path.join(assetsDir, 'reader_logic.js'), 'utf8');

        await webContents.executeJavaScript(jszip);
        await webContents.executeJavaScript(jspdf);
        await webContents.executeJavaScript(reader);
        console.log('Reader injected!');
    } catch (err) {
        console.error('Injection failed:', err);
    }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
