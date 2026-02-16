const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { runBot } = require('./bot');
require('dotenv').config();

// Enable hot-reload in development
if (process.env.NODE_ENV === 'development') {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
    });
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // Load the index page
    mainWindow.loadFile('index.html');

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC handlers for automation
ipcMain.handle('execute-script', async (event, script) => {
    try {
        const webview = mainWindow.webContents;
        const result = await webview.executeJavaScript(script);
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-url', async (event) => {
    return mainWindow.webContents.getURL();
});

// IPC handler for selecting folder
ipcMain.handle('select-folder', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    if (result.canceled) {
        return { success: false };
    }

    return { success: true, folderPath: result.filePaths[0] };
});

// IPC handler for counting files in a folder
ipcMain.handle('count-files', async (event, folderPath) => {
    try {
        const files = fs.readdirSync(folderPath);

        const photoExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

        let photoCount = 0;
        let videoCount = 0;

        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (photoExtensions.includes(ext)) {
                photoCount++;
            } else if (videoExtensions.includes(ext)) {
                videoCount++;
            }
        });

        return {
            photos: photoCount,
            videos: videoCount,
            total: photoCount + videoCount
        };
    } catch (error) {
        console.error('Error counting files:', error);
        return {
            photos: 0,
            videos: 0,
            total: 0
        };
    }
});

// IPC handler for running the bot
ipcMain.handle('run-bot', async (event, params) => {
    return await runBot(params, mainWindow);
});

