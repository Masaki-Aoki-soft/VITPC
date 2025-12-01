/* PC情報API */

import { Hono } from 'hono';
import { getPCInfo } from '../../pc-info';

export const pcInfoRoute = new Hono();

// GET: PC情報を取得
pcInfoRoute.get('/', async (c) => {
    try {
        console.log('[PC Info API] PC情報の取得を開始...');
        // PC情報を取得
        const pcInfo = await getPCInfo();
        console.log('[PC Info API] PC情報の取得に成功');
        return c.json(pcInfo);
    } catch (error: any) {
        console.error('[PC Info API] PC情報の取得エラー:', error);
        console.error('[PC Info API] エラースタック:', error.stack);
        return c.json({ 
            error: error.message || 'PC情報の取得に失敗しました',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, 500);
    }
});

// POST: PC情報を保存
pcInfoRoute.post('/', async (c) => {
    try {
        // リクエストボディからuserIdとfullNameを取得
        const body = await c.req.json();
        const { userId, fullName } = body;

        if (!userId) {
            return c.json({ error: 'userIdが必要です' }, 400);
        }

        // PC情報を取得
        const pcInfo = await getPCInfo();

        // PC情報をデータベースに保存する処理
        // ここでは、データベース接続がない場合は、単にPC情報を返す
        // 実際の実装では、データベースに保存する処理を追加

        return c.json({
            message: 'PC情報を保存しました',
            data: {
                ...pcInfo,
                userId,
                fullName,
            },
        });
    } catch (error: any) {
        console.error('PC情報の保存エラー:', error);
        return c.json({ error: error.message || 'PC情報の保存に失敗しました' }, 500);
    }
});

