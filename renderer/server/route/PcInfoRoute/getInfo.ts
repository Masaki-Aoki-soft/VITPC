/* PC情報取得API */

import { Hono } from 'hono';
import { db, schema } from '@/server/db';
import { eq } from 'drizzle-orm';

export const getInfo = new Hono();

// GET: PC情報を取得
// クエリパラメータ `all=true` が指定された場合は全ユーザーの情報を取得
// それ以外の場合は認証済みユーザーの情報のみを取得
getInfo.get('/', async (c) => {
    try {
        if (!db) {
            return c.json({ error: 'データベース接続が設定されていません' }, 500);
        }

        // クエリパラメータを取得
        const getAll = c.req.query('all') === 'true';

        if (getAll) {
            // 全ユーザーのPC情報を取得
            const pcInfoList = await db.select().from(schema.pcInfo);

            return c.json({
                data: pcInfoList,
                count: pcInfoList.length,
            });
        } else {
            // リクエストヘッダーからuserIdを取得（Next.js APIルートから設定される）
            const userId = c.req.header('x-user-id');

            if (!userId) {
                return c.json({ error: '認証が必要です' }, 401);
            }

            // ユーザーのPC情報を取得
            const pcInfoList = await db
                .select()
                .from(schema.pcInfo)
                .where(eq(schema.pcInfo.userId, userId))
                .limit(1);

            if (pcInfoList.length === 0) {
                return c.json({ message: 'PC情報が見つかりませんでした' }, 404);
            }

            const pcInfo = pcInfoList[0];

            return c.json({
                ...pcInfo,
                // JSONBから直接取得されるため、そのまま返す
            });
        }
    } catch (error: any) {
        console.error('PC情報の取得エラー:', error);
        return c.json({ error: error.message || 'PC情報の取得に失敗しました' }, 500);
    }
});
