/* Clerk認証ミドルウェア */

import { verifyToken } from '@clerk/backend';
import type { Context, Next } from 'hono';

/**
 * Clerk認証トークンを検証し、userIdをヘッダーに追加するミドルウェア
 * Authorizationヘッダーからトークンを取得し、Clerkで検証する
 */
export async function clerkAuthMiddleware(c: Context, next: Next) {
    try {
        // Authorizationヘッダーからトークンを取得
        const authHeader = c.req.header('Authorization');

        // all=trueのクエリパラメータがある場合は認証をスキップ（全データ取得用）
        const getAll = c.req.query('all') === 'true';
        if (getAll) {
            await next();
            return;
        }

        // トークンが存在しない場合はエラー
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ error: '認証トークンが必要です' }, 401);
        }

        const token = authHeader.replace('Bearer ', '');

        // Clerkでトークンを検証
        const clerkSecretKey = process.env.CLERK_SECRET_KEY;

        if (!clerkSecretKey) {
            console.error('[Auth Middleware] ⚠️ CLERK_SECRET_KEYが設定されていません');
            console.error('[Auth Middleware] process.env.CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY);
            console.error('[Auth Middleware] 利用可能な環境変数:', Object.keys(process.env).filter(key => key.includes('CLERK')));
            console.error('[Auth Middleware] すべての環境変数（CLERK関連）:', 
                Object.entries(process.env)
                    .filter(([key]) => key.includes('CLERK'))
                    .map(([key, value]) => ({ key, value: value ? value.substring(0, 10) + '...' : 'undefined' }))
            );
            return c.json({ 
                error: 'サーバー設定エラー',
                message: 'CLERK_SECRET_KEYが設定されていません。config.jsonファイルを確認してください。'
            }, 500);
        }
        
        console.log('[Auth Middleware] CLERK_SECRET_KEYが設定されています:', clerkSecretKey.substring(0, 10) + '...');

        // JWTトークンを検証
        try {
            // @clerk/backendでは、verifyTokenを直接使用してJWTトークンを検証
            const jwtPayload = await verifyToken(token, {
                secretKey: clerkSecretKey,
            });

            if (!jwtPayload || !jwtPayload.sub) {
                return c.json({ error: '認証に失敗しました' }, 401);
            }

            // userIdをContextに保存（後続のミドルウェアやハンドラーで使用可能）
            c.set('userId', jwtPayload.sub);

            // 既存のコードとの互換性のため、カスタムヘッダーとしても設定
            // 後続のハンドラーで c.get('userId') で取得可能

            await next();
        } catch (verifyError: any) {
            console.error('[Auth Middleware] トークン検証エラー:', verifyError);

            // エラーメッセージに基づいて適切なステータスコードを返す
            if (verifyError.status === 401 || verifyError.message?.includes('token')) {
                return c.json({ error: '認証に失敗しました' }, 401);
            }

            return c.json({ error: '認証処理中にエラーが発生しました' }, 500);
        }
    } catch (error: any) {
        console.error('[Auth Middleware] 認証エラー:', error);

        // エラーメッセージに基づいて適切なステータスコードを返す
        if (error.status === 401 || error.message?.includes('token')) {
            return c.json({ error: '認証に失敗しました' }, 401);
        }

        return c.json({ error: '認証処理中にエラーが発生しました' }, 500);
    }
}
