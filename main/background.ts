import path from 'path';
import { app, ipcMain } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
    serve({ directory: 'app' });
} else {
    app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
    await app.whenReady();

    const mainWindow = createWindow('main', {
        width: 1000,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // Content Security Policyの設定（本番環境のみ）
    if (isProd) {
        mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [
                        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com;"
                    ],
                },
            });
        });
        await mainWindow.loadURL('app://./login');
    } else {
        const port = process.argv[2];
        await mainWindow.loadURL(`http://localhost:${port}/login`);
        mainWindow.webContents.openDevTools();
    }
})();

app.on('window-all-closed', () => {
    app.quit();
});

ipcMain.on('message', async (event, arg) => {
    event.reply('message', `${arg} World!`);
});
