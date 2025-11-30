import path from 'path';
import { app, ipcMain, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import serve from 'electron-serve';
import Store from 'electron-store';
import { createWindow } from './helpers';
import { getPCInfo, PCInfo } from './pc-info';
import { writeToSpreadsheet, SpreadsheetConfig, PCInfoRow } from './google-sheets';

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
    serve({ directory: 'app' });
} else {
    app.setPath('userData', `${app.getPath('userData')} (development)`);
}

// 設定ストア（最後にPC情報を取得した日時を保存）
const store = new Store<{ lastPcInfoFetch: number; autoLaunch: boolean }>({
    name: 'pc-info-schedule',
    defaults: {
        lastPcInfoFetch: 0,
        autoLaunch: true, // デフォルトで自動起動を有効にする
    },
});

// 1週間（ミリ秒）
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// グローバル変数
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let appIsQuiting = false;

/**
 * PC情報をバックグラウンドで取得する関数
 */
async function fetchPCInfoInBackground(): Promise<void> {
    try {
        console.log('[Background] PC情報を取得中...');
        const pcInfo = await getPCInfo();
        console.log('[Background] PC情報を取得しました:', {
            hostname: pcInfo.hostname,
            timestamp: pcInfo.timestamp,
        });
        
        // 最後に取得した日時を更新
        store.set('lastPcInfoFetch', Date.now());
        
        // 必要に応じて、ここでスプレッドシートに書き込むなどの処理を追加できます
        // 例: await writeToSpreadsheet(config, pcInfo);
    } catch (error: any) {
        console.error('[Background] PC情報の取得に失敗:', error);
    }
}

/**
 * 定期取得のスケジュールを設定
 */
function schedulePCInfoFetch(): void {
    const lastFetch = store.get('lastPcInfoFetch', 0);
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetch;

    // 初回起動時、または1週間以上経過している場合は即座に取得
    if (lastFetch === 0 || timeSinceLastFetch >= ONE_WEEK_MS) {
        console.log('[Background] 初回起動または1週間経過のため、PC情報を取得します');
        fetchPCInfoInBackground();
    } else {
        // 次回の取得までの残り時間を計算
        const timeUntilNextFetch = ONE_WEEK_MS - timeSinceLastFetch;
        const daysUntilNextFetch = Math.ceil(timeUntilNextFetch / (24 * 60 * 60 * 1000));
        console.log(`[Background] 次回のPC情報取得まで ${daysUntilNextFetch} 日`);
    }

    // 1週間ごとに定期取得
    setInterval(() => {
        console.log('[Background] 定期取得: PC情報を取得します');
        fetchPCInfoInBackground();
    }, ONE_WEEK_MS);
}

/**
 * システムトレイアイコンを作成
 */
function createTray(): void {
    // アイコン画像のパス（デフォルトのアイコンを使用）
    const iconPath = path.join(__dirname, '../resources/icon.png');
    
    // アイコンが存在しない場合は、空の画像を使用
    let trayIcon: Electron.NativeImage;
    try {
        trayIcon = nativeImage.createFromPath(iconPath);
        if (trayIcon.isEmpty()) {
            // アイコンが読み込めない場合は、デフォルトのアイコンを作成
            trayIcon = nativeImage.createEmpty();
        }
    } catch {
        trayIcon = nativeImage.createEmpty();
    }

    // システムトレイアイコンを作成
    tray = new Tray(trayIcon);
    tray.setToolTip('VITPC');

    // コンテキストメニューを作成
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'ウィンドウを表示',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
        },
        {
            label: 'ウィンドウを隠す',
            click: () => {
                if (mainWindow) {
                    mainWindow.hide();
                }
            },
        },
        { type: 'separator' },
        {
            label: 'PC情報を更新',
            click: async () => {
                await fetchPCInfoInBackground();
            },
        },
        { type: 'separator' },
        {
            label: '終了',
            click: () => {
                app.quit();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);

    // トレイアイコンをクリックしたときの動作
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
}

/**
 * OS起動時に自動起動する設定
 */
function setupAutoLaunch(): void {
    const autoLaunch = store.get('autoLaunch', true);
    
    // 自動起動の設定
    app.setLoginItemSettings({
        openAtLogin: autoLaunch,
        openAsHidden: true, // ウィンドウを表示せずに起動
        name: 'VITPC',
    });

    console.log(`[AutoLaunch] 自動起動設定: ${autoLaunch ? '有効' : '無効'}`);
}

/**
 * 自動起動設定を変更するIPCハンドラー
 */
ipcMain.handle('set-auto-launch', (event, enabled: boolean) => {
    store.set('autoLaunch', enabled);
    app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: true,
        name: 'VITPC',
    });
    return { success: true };
});

/**
 * 自動起動設定を取得するIPCハンドラー
 */
ipcMain.handle('get-auto-launch', () => {
    return { enabled: store.get('autoLaunch', true) };
});

(async () => {
    await app.whenReady();

    // 自動起動の設定
    setupAutoLaunch();

    // macOSの場合、Dockアイコンを非表示にする
    if (process.platform === 'darwin') {
        app.dock.hide();
    }

    // コマンドライン引数から自動起動かどうかを判定
    // --hidden フラグがある場合は、ウィンドウを表示せずにバックグラウンドで実行
    const isAutoLaunch = process.argv.includes('--hidden') || process.argv.includes('--open-as-hidden');
    
    mainWindow = createWindow('main', {
        width: 1000,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        show: !isAutoLaunch, // 自動起動の場合はウィンドウを表示しない
    });

    // ウィンドウを閉じたときにアプリを終了させない（バックグラウンドで実行）
    mainWindow.on('close', (event) => {
        if (!appIsQuiting) {
            event.preventDefault();
            mainWindow?.hide();
        }
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

    // システムトレイアイコンを作成
    createTray();

    // バックグラウンドでPC情報を取得するスケジュールを設定
    schedulePCInfoFetch();
})();

app.on('before-quit', () => {
    appIsQuiting = true;
});

app.on('window-all-closed', () => {
    // macOS以外では、すべてのウィンドウが閉じられてもアプリを終了させない
    // システムトレイから終了できるようにする
    if (process.platform !== 'darwin') {
        // アプリを終了させない（バックグラウンドで実行）
    }
});

// macOS用: アプリがアクティブになったときにウィンドウを表示
app.on('activate', () => {
    if (mainWindow) {
        mainWindow.show();
    }
});

ipcMain.on('message', async (event, arg) => {
    event.reply('message', `${arg} World!`);
});

// PC情報取得のIPCハンドラー
ipcMain.handle('get-pc-info', async (): Promise<PCInfo> => {
    try {
        const pcInfo = await getPCInfo();
        return pcInfo;
    } catch (error: any) {
        console.error('PC情報の取得に失敗:', error);
        throw new Error(error.message || 'PC情報の取得に失敗しました');
    }
});

// スプレッドシートへの書き込みのIPCハンドラー
ipcMain.handle(
    'write-to-spreadsheet',
    async (event, config: SpreadsheetConfig, pcInfo: PCInfoRow) => {
        try {
            const result = await writeToSpreadsheet(config, pcInfo);
            return result;
        } catch (error: any) {
            console.error('スプレッドシートへの書き込みに失敗:', error);
            return {
                success: false,
                message: error.message || 'スプレッドシートへの書き込みに失敗しました',
            };
        }
    }
);
