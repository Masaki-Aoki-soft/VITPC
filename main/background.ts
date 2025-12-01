import path from 'path';
import fs from 'fs';
import { app, ipcMain } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import { serve as serveHono } from '@hono/node-server';

// 設定ファイルを読み込む（サーバー起動前に実行）
// 重要: serverAppをインポートする前にloadConfig()を実行する必要がある
// なぜなら、serverAppが読み込まれる時点で環境変数が設定されている必要があるため
console.log('[Main] 設定ファイルの読み込みを開始（サーバーインポート前）...');
// loadConfig()は後で定義されるが、ここで呼び出す必要がある
// そのため、先にloadConfig関数を定義してから呼び出す

const isProd = process.env.NODE_ENV === 'production';

// 設定ファイルを読み込む
interface AppConfig {
    clerkPublishableKey?: string;
    clerkSecretKey?: string;
    [key: string]: any;
}

let appConfig: AppConfig = {};

const loadConfig = () => {
    try {
        // 設定ファイルのパスを決定
        // 開発環境: プロジェクトルート
        // 本番環境: app.getAppPath()を使用（resources/app/config.json を参照）
        // または、実行ファイルと同じディレクトリに配置する場合は app.getPath('exe') のディレクトリを使用
        let configPath: string;

        if (isProd) {
            // 本番環境: app.getAppPath()を使用（resources/app/config.json）
            // 注意: app.getPath('exe')はapp.whenReady()前に呼び出すとエラーになる可能性があるため使用しない
            try {
                configPath = path.join(app.getAppPath(), 'config.json');
                console.log(`[Config] 本番環境: config.jsonのパスを決定しました: ${configPath}`);
            } catch (error) {
                // app.getAppPath()が失敗した場合、プロジェクトルートを試す
                console.warn('[Config] app.getAppPath() failed, trying project root');
                configPath = path.join(__dirname, '../config.json');
            }
        } else {
            // 開発環境: プロジェクトルート
            configPath = path.join(__dirname, '../config.json');
            console.log(`[Config] 開発環境: config.jsonのパスを決定しました: ${configPath}`);
        }

        if (fs.existsSync(configPath)) {
            const configFileContent = fs.readFileSync(configPath, { encoding: 'utf8' });
            const parsedConfig = JSON.parse(configFileContent);

            // キー名のマッピング（環境変数名とconfig.jsonのキー名の両方に対応）
            // config.jsonには CLERK_SECRET_KEY と NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY の形式で記述されている
            appConfig = {
                clerkPublishableKey:
                    parsedConfig.clerkPublishableKey ||
                    parsedConfig.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
                clerkSecretKey: parsedConfig.clerkSecretKey || parsedConfig.CLERK_SECRET_KEY,
                ...parsedConfig, // その他の設定も保持
            };

            console.log(`[Config] Loaded configuration from ${configPath}`);
            console.log(`[Config] Raw config keys:`, Object.keys(parsedConfig));
            console.log(
                `[Config] clerkPublishableKey: ${
                    appConfig.clerkPublishableKey ? '設定済み' : '未設定'
                }`
            );
            console.log(
                `[Config] clerkSecretKey: ${
                    appConfig.clerkSecretKey
                        ? '設定済み (' + appConfig.clerkSecretKey.substring(0, 10) + '...)'
                        : '未設定'
                }`
            );

            // デバッグ: 元のconfig.jsonのキーを確認
            if (parsedConfig.CLERK_SECRET_KEY) {
                console.log(`[Config] ✓ config.jsonにCLERK_SECRET_KEYが見つかりました`);
            } else if (parsedConfig.clerkSecretKey) {
                console.log(`[Config] ✓ config.jsonにclerkSecretKeyが見つかりました`);
            } else {
                console.warn(
                    `[Config] ⚠️ config.jsonにCLERK_SECRET_KEYもclerkSecretKeyも見つかりませんでした`
                );
            }
        } else {
            console.warn(`[Config] Config file not found at ${configPath}, using defaults`);
        }
    } catch (error) {
        console.error('[Config Error] Failed to read config.json:', error);
        // フォールバック: 環境変数から読み込む
        appConfig = {
            clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
            clerkSecretKey: process.env.CLERK_SECRET_KEY,
        };
    }

    // 環境変数で設定を上書き（優先度: 環境変数 > config.json）
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        appConfig.clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    }
    if (process.env.CLERK_SECRET_KEY) {
        appConfig.clerkSecretKey = process.env.CLERK_SECRET_KEY;
    }

    // 環境変数に設定（サーバー側で使用）
    // 重要: この設定はサーバー起動前に実行される必要がある
    // config.jsonから読み込んだ値をprocess.envに注入する
    if (appConfig.clerkSecretKey) {
        process.env.CLERK_SECRET_KEY = appConfig.clerkSecretKey;
        console.log('[Config] ✓ CLERK_SECRET_KEYを環境変数に設定しました');
        console.log(`[Config] CLERK_SECRET_KEY値: ${appConfig.clerkSecretKey.substring(0, 10)}...`);
        console.log(
            `[Config] process.env.CLERK_SECRET_KEYが設定されたか確認: ${
                process.env.CLERK_SECRET_KEY ? '✓ 設定済み' : '✗ 未設定'
            }`
        );
    } else {
        console.error('[Config] ⚠️ CLERK_SECRET_KEYが設定されていません！');
        console.error('[Config] appConfig.clerkSecretKey:', appConfig.clerkSecretKey);
        console.error('[Config] 環境変数CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY);
        console.error('[Config] config.jsonの内容を確認してください:');
        console.error('[Config] - CLERK_SECRET_KEY または clerkSecretKey キーが存在するか');
        console.error('[Config] - 値が正しく設定されているか');
    }

    if (appConfig.clerkPublishableKey) {
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = appConfig.clerkPublishableKey;
        console.log('[Config] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEYを環境変数に設定しました');
    } else {
        console.warn('[Config] ⚠️ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEYが設定されていません');
    }
};

// 設定を取得する関数
export const getConfig = (): AppConfig => appConfig;

// メインサーバーを起動（本番環境でも動作）
// このサーバーはElectronアプリのmainプロセスで常に動作し、
// 本番環境でもNext.jsサーバーが起動しないため、ここでAPIサーバーとして機能する
const SERVER_PORT = 3001;

// 利用可能なポートを見つける関数
const findAvailablePort = async (startPort: number): Promise<number> => {
    const net = await import('net');
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(startPort, () => {
            const port = (server.address() as net.AddressInfo)?.port;
            server.close(() => {
                resolve(port || startPort);
            });
        });
        server.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EADDRINUSE') {
                // ポートが使用されている場合、次のポートを試す
                findAvailablePort(startPort + 1)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(err);
            }
        });
    });
};

// 設定ファイルを読み込む（サーバー起動前に実行）
console.log('[Main] 設定ファイルの読み込みを開始...');
loadConfig();
console.log('[Main] 設定ファイルの読み込み完了');

// 環境変数が設定されているか確認
console.log('[Main] 環境変数チェック:');
console.log(
    '[Main] CLERK_SECRET_KEY:',
    process.env.CLERK_SECRET_KEY
        ? '設定済み (' + process.env.CLERK_SECRET_KEY.substring(0, 10) + '...)'
        : '❌ 未設定'
);
console.log(
    '[Main] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:',
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '設定済み' : '❌ 未設定'
);

(async () => {
    // サーバーアプリを動的にインポート（loadConfig()実行後）
    const { default: serverApp } = await import('./server');

    // 利用可能なポートを見つける
    let actualPort = SERVER_PORT;
    try {
        actualPort = await findAvailablePort(SERVER_PORT);
        if (actualPort !== SERVER_PORT) {
            console.warn(
                `[Main Server] ポート${SERVER_PORT}は使用中のため、ポート${actualPort}を使用します`
            );
        }
    } catch (error) {
        console.error('[Main Server] 利用可能なポートを見つけられませんでした:', error);
        // エラーが発生した場合でも、元のポートで試す
    }

    // サーバー起動前に環境変数が設定されているか確認
    console.log('[Main Server] ========================================');
    console.log('[Main Server] サーバー起動前の環境変数チェック:');
    console.log(
        `[Main Server] CLERK_SECRET_KEY: ${
            process.env.CLERK_SECRET_KEY
                ? '設定済み (' + process.env.CLERK_SECRET_KEY.substring(0, 10) + '...)'
                : '❌ 未設定'
        }`
    );
    console.log(
        `[Main Server] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '設定済み' : '❌ 未設定'
        }`
    );
    console.log('[Main Server] appConfig:', {
        clerkSecretKey: appConfig.clerkSecretKey
            ? appConfig.clerkSecretKey.substring(0, 10) + '...'
            : '未設定',
        clerkPublishableKey: appConfig.clerkPublishableKey ? '設定済み' : '未設定',
    });
    console.log('[Main Server] ========================================');

    // CLERK_SECRET_KEYが設定されていない場合は警告
    if (!process.env.CLERK_SECRET_KEY) {
        console.error('[Main Server] ⚠️ 警告: CLERK_SECRET_KEYが設定されていません！');
        console.error('[Main Server] config.jsonファイルを確認してください。');
        console.error('[Main Server] 開発環境: プロジェクトルートのconfig.json');
        console.error('[Main Server] 本番環境: 実行ファイルと同じディレクトリのconfig.json');
    }

    // サーバーを起動
    try {
        serveHono({
            fetch: serverApp.fetch,
            port: actualPort,
        });
        console.log(`[Main Server] サーバーを起動しました: http://localhost:${actualPort}`);
    } catch (error: any) {
        if (error.code === 'EADDRINUSE') {
            console.error(
                `[Main Server] ポート${actualPort}は既に使用されています。アプリケーションを再起動してください。`
            );
        } else {
            console.error('[Main Server] サーバーの起動に失敗しました:', error);
        }
    }

    // 本番環境でもHTTPサーバーを使用（Clerkがapp://プロトコルを認識できないため）
    // electron-serveを使用して静的ファイルを配信
    if (isProd) {
        serve({ directory: 'app' });
    } else {
        app.setPath('userData', `${app.getPath('userData')} (development)`);
    }

    await app.whenReady();

    const mainWindow = createWindow('main', {
        width: 1000,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    if (isProd) {
        // 本番環境でもHTTPサーバーを使用（Clerkがapp://プロトコルを認識できないため）
        // 静的ファイルを配信するためのHTTPサーバーを起動
        // 固定ポート3002を使用（Clerkダッシュボードに登録する必要がある）
        const http = await import('http');
        const fs = await import('fs');
        const url = await import('url');

        const staticDir = path.join(__dirname, '../app');
        const STATIC_PORT = 3002; // 固定ポート（Clerkダッシュボードに登録する必要がある）

        const httpServer = http.createServer((req, res) => {
            if (!req.url) {
                res.writeHead(400);
                res.end('Bad Request');
                return;
            }

            const parsedUrl = url.parse(req.url);
            let filePath = path.join(staticDir, parsedUrl.pathname || '/');

            // ディレクトリの場合はindex.htmlを探す
            if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
                const indexPath = path.join(filePath, 'index.html');
                if (fs.existsSync(indexPath)) {
                    filePath = indexPath;
                } else {
                    // ルートディレクトリの場合は/loginにリダイレクト
                    if (parsedUrl.pathname === '/') {
                        res.writeHead(302, { Location: '/login' });
                        res.end();
                        return;
                    }
                }
            }

            // ファイルが存在しない場合、拡張子がない場合は.htmlを追加
            if (!fs.existsSync(filePath) && !path.extname(filePath)) {
                const htmlPath = filePath + '.html';
                if (fs.existsSync(htmlPath)) {
                    filePath = htmlPath;
                }
            }

            // ファイルを読み込んで返す
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Not Found');
                    return;
                }

                const ext = path.extname(filePath);
                const contentType =
                    ext === '.html'
                        ? 'text/html'
                        : ext === '.js'
                        ? 'application/javascript'
                        : ext === '.css'
                        ? 'text/css'
                        : ext === '.json'
                        ? 'application/json'
                        : 'application/octet-stream';

                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            });
        });

        httpServer.listen(STATIC_PORT, () => {
            console.log(
                `[HTTP Server] 静的ファイルサーバーを起動しました: http://localhost:${STATIC_PORT}`
            );
            console.log(
                `[HTTP Server] ⚠️ Clerkダッシュボードに以下のオリジンを登録してください: http://localhost:${STATIC_PORT}`
            );
            mainWindow.loadURL(`http://localhost:${STATIC_PORT}/login`);
        });
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

// 設定を取得するIPCハンドラー
ipcMain.handle('get-config', () => {
    return appConfig;
});
