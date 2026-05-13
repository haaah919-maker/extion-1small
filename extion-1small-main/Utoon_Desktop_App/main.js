const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let loginWindow;

app.commandLine.appendSwitch('disable-gpu');

function createLoginWindow() {
    loginWindow = new BrowserWindow({
        width: 450,
        height: 550,
        frame: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        backgroundColor: '#0a0514',
        alwaysOnTop: true
    });
    loginWindow.loadFile(path.join(__dirname, 'login.html'));
}

ipcMain.on('verify-key', async (event, key) => {
    // Basic verification logic - in production we'd use the auth_manager.js functions
    const SUPABASE_URL = "https://zxrgztmwepyqyrkhhtmr.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4cmd6dG13ZXB5cXlya2hodG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODc0NjksImV4cCI6MjA5Mzc2MzQ2OX0.dsgkoKciaHo58qfKwbfUYh3-nJFDeFOvTVmnvsrrxRw";

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/licenses?key=eq.${key}&select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const data = await res.json();
        
        if (data && data.length > 0) {
            const license = data[0];
            const isExp = new Date(license.expiry_date) < new Date();
            if (!isExp) {
                mainWindow.webContents.executeJavaScript(`localStorage.setItem('isPremium', 'true'); localStorage.setItem('u_license_key', '${key}'); location.reload();`);
                loginWindow.close();
                mainWindow.show();
                return;
            }
        }
        event.reply('auth-error', 'Invalid or Expired Key');
    } catch (e) {
        event.reply('auth-error', 'Connection Error');
    }
});

ipcMain.on('skip-auth', () => {
    mainWindow.webContents.executeJavaScript(`localStorage.setItem('isPremium', 'false'); location.reload();`);
    loginWindow.close();
    mainWindow.show();
});

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true
    });

    mainWindow.loadURL('https://utoon.net');

    mainWindow.webContents.on('did-finish-load', () => {
        const url = mainWindow.webContents.getURL();
        if (!url.includes('utoon.net')) return;
        
        const scripts = ['ui_unlocker.js', 'fix_links.js'];
        scripts.forEach(s => {
            const content = fs.readFileSync(path.join(__dirname, s), 'utf8');
            mainWindow.webContents.executeJavaScript(content);
        });

        if (url.includes('/chapter-')) {
            const files = ['jszip.min.js', 'jspdf.min.js', 'reader_logic.js'];
            files.forEach(f => {
                const content = fs.readFileSync(path.join(__dirname, f), 'utf8');
                mainWindow.webContents.executeJavaScript(content);
            });
        }
    });
}

app.whenReady().then(() => {
    createMainWindow();
    createLoginWindow();
});
