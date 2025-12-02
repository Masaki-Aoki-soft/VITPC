/* メインAPIサーバー */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { clerkAuthMiddleware } from '../middleware/auth';

const app = new Hono();

// デバッグ用: すべてのリクエストをログに記録（最初に実行）
app.use('*', async (c, next) => {
    console.log('[Hono App] リクエスト受信:', {
        method: c.req.method,
        url: c.req.url,
        path: c.req.path,
    });
    await next();
});

// ミドルウェア
app.use('*', logger());
app.use(
    '*',
    cors({
        origin: '*',
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
    })
);

// Clerk認証ミドルウェアを適用
// PC情報の取得（GET）は認証不要、保存（POST）のみ認証を要求
// 理由: PC情報の取得は公開情報として扱い、保存時のみユーザー認証が必要

// 環境変数を動的にチェックする関数（loadConfig()実行後に呼ばれる可能性があるため）
const getClerkSecretKey = () => {
    const key = process.env.CLERK_SECRET_KEY;
    // デバッグ: 環境変数の状態を確認
    if (!key) {
        console.warn('[Hono App] getClerkSecretKey(): CLERK_SECRET_KEYが未設定です');
        console.warn('[Hono App] process.env.CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY);
        console.warn(
            '[Hono App] 利用可能な環境変数（CLERK関連）:',
            Object.keys(process.env).filter((k) => k.includes('CLERK'))
        );
    }
    return key;
};

// 本番環境の判定: 明示的に'production'でない場合は開発環境として扱う
const isProduction = () => {
    const nodeEnv = process.env.NODE_ENV;
    return nodeEnv === 'production';
};

// 初期ログ（環境変数が後で設定される可能性があるため、警告のみ）
const initialClerkKey = getClerkSecretKey();
console.log('[Hono App] サーバー初期化:', {
    NODE_ENV: process.env.NODE_ENV,
    CLERK_SECRET_KEY: initialClerkKey
        ? `設定済み (${initialClerkKey.substring(0, 10)}...)`
        : '未設定（後で設定される可能性あり）',
    timestamp: new Date().toISOString(),
});

// POSTエンドポイント（保存）のみ認証を要求
// リクエスト時に動的に環境変数をチェック
app.use('/api/pc-info', async (c, next) => {
    if (c.req.method === 'POST') {
        // POSTリクエストの場合は認証を要求
        const clerkSecretKey = getClerkSecretKey();

        // デバッグログ
        const isProd = isProduction();
        console.log('[Hono App] POSTリクエスト処理:', {
            hasClerkSecretKey: !!clerkSecretKey,
            isProduction: isProd,
            NODE_ENV: process.env.NODE_ENV,
        });

        if (!clerkSecretKey) {
            // CLERK_SECRET_KEYが設定されていない場合
            // 開発環境では認証をスキップ、本番環境ではエラーを返す
            // 注意: 安全のため、CLERK_SECRET_KEYが設定されていない場合は開発環境として扱う
            // 本番環境では必ずCLERK_SECRET_KEYを設定する必要がある
            const nodeEnv = process.env.NODE_ENV;
            const isExplicitlyProduction = nodeEnv === 'production';

            if (isExplicitlyProduction) {
                // 明示的に本番環境の場合のみエラーを返す
                console.error(
                    '[Hono App] POSTリクエスト: CLERK_SECRET_KEYが設定されていません（本番環境）'
                );
                return c.json(
                    { error: 'サーバー設定エラー: CLERK_SECRET_KEYが設定されていません' },
                    500
                );
            } else {
                // 開発環境またはNODE_ENVが設定されていない場合は警告のみで許可（認証をスキップ）
                console.warn(
                    `[Hono App] POSTリクエスト: CLERK_SECRET_KEYが設定されていません（NODE_ENV=${
                        nodeEnv || 'undefined'
                    }、開発環境として扱い、認証をスキップして処理を続行）`
                );
                // 認証をスキップして次のハンドラーに進む
                await next();
                return;
            }
        } else {
            // CLERK_SECRET_KEYが設定されている場合は認証を実行
            return clerkAuthMiddleware(c, next);
        }
    } else {
        // GETリクエストの場合は認証をスキップ
        await next();
    }
});

console.log('[Hono App] PC情報APIミドルウェアを設定しました（GET: 認証不要、POST: 認証必須）');

// ルートの登録
import { pcInfoRoute } from './route/pc-info';
app.route('/api/pc-info', pcInfoRoute);

// サーバー起動時にデータベーステーブルを作成（存在しない場合）
(async () => {
    try {
        console.log('[Hono App] データベーステーブルの確認を開始...');
        const { createTableIfNotExists } = await import('./db/migrate');
        const result = await createTableIfNotExists();
        if (result.success) {
            console.log(
                '[Hono App] ✓',
                result.message || 'データベーステーブルの確認が完了しました'
            );
        } else {
            console.error('[Hono App] ✗ データベーステーブルの確認に失敗:', result.error);
        }
    } catch (error: any) {
        console.error('[Hono App] ✗ データベーステーブルの確認中にエラーが発生しました:', error);
        console.error('[Hono App] エラーメッセージ:', error?.message);
        // エラーが発生してもサーバーは起動し続ける（テーブルが既に存在する場合など）
    }
})();

export type AppType = typeof app;
export default app;
