/* データベース接続設定 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// DATABASE_URLを環境変数から取得
export const getDatabaseUrl = (): string => {
    // まず環境変数から取得を試みる
    if (process.env.DATABASE_URL) {
        console.log('[DB] DATABASE_URLを環境変数から取得しました');
        return process.env.DATABASE_URL;
    }

    // config.jsonから読み込む（background.tsで既に設定されている可能性がある）
    try {
        const path = require('path');
        const fs = require('fs');
        
        const isProd = process.env.NODE_ENV === 'production';
        let configPath: string;

        if (isProd) {
            // 本番環境
            try {
                const { app } = require('electron');
                configPath = path.join(app.getAppPath(), 'config.json');
            } catch (error) {
                configPath = path.join(__dirname, '../../../config.json');
            }
        } else {
            // 開発環境
            configPath = path.join(__dirname, '../../../config.json');
        }

        if (fs.existsSync(configPath)) {
            const configFileContent = fs.readFileSync(configPath, { encoding: 'utf8' });
            const parsedConfig = JSON.parse(configFileContent);
            
            if (parsedConfig.DATABASE_URL) {
                console.log('[DB] DATABASE_URLをconfig.jsonから読み込みました');
                return parsedConfig.DATABASE_URL;
            }
        }
    } catch (error) {
        console.error('[DB] config.jsonの読み込みエラー:', error);
    }

    throw new Error(
        'DATABASE_URLが設定されていません。環境変数またはconfig.jsonにDATABASE_URLを設定してください。'
    );
};

// データベース接続を遅延初期化
let dbInstance: ReturnType<typeof drizzle> | null = null;
let initError: Error | null = null;

const initDb = (): ReturnType<typeof drizzle> => {
    if (initError) {
        throw initError;
    }

    if (dbInstance) {
        return dbInstance;
    }

    try {
        // データベースURLを取得
        const databaseUrl = getDatabaseUrl();
        
        if (!databaseUrl) {
            throw new Error('DATABASE_URLが空です');
        }

        console.log('[DB] データベースURLを取得しました（長さ:', databaseUrl.length, '文字）');
        console.log('[DB] DATABASE_URLの最初の50文字:', databaseUrl.substring(0, 50) + '...');
        
        // Neon HTTPクライアントを作成
        const sql = neon(databaseUrl);
        
        // Drizzleインスタンスを作成
        dbInstance = drizzle(sql, { schema });
        
        console.log('[DB] ✓ データベース接続を初期化しました');
        return dbInstance;
    } catch (error: any) {
        console.error('[DB] ✗ データベース接続の初期化に失敗しました');
        console.error('[DB] エラー詳細:', error);
        console.error('[DB] エラーメッセージ:', error?.message);
        console.error('[DB] エラースタック:', error?.stack);
        
        initError = error instanceof Error ? error : new Error(String(error));
        throw initError;
    }
};

// データベースインスタンスをエクスポート（初回アクセス時に初期化）
// Proxyを使って、すべてのメソッド呼び出しをインターセプト
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get(_target, prop) {
        try {
            const instance = initDb();
            const value = instance[prop as keyof typeof instance];
            if (typeof value === 'function') {
                return value.bind(instance);
            }
            return value;
        } catch (error: any) {
            console.error('[DB] データベースアクセスエラー:', error);
            throw error;
        }
    },
});

