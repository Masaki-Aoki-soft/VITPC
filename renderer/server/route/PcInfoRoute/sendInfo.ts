/* PC情報保存API */

import { Hono } from 'hono';
import { db, schema } from '@/server/db';

export const sendInfo = new Hono();

// POST: PC情報を保存
// userIdはリクエストボディから取得
sendInfo.post('/', async (c) => {
    console.log('[Hono sendInfo] POSTリクエスト受信:', {
        url: c.req.url,
        method: c.req.method,
    });

    try {
        if (!db) {
            console.error('[Hono sendInfo] データベース接続が設定されていません');
            return c.json({ error: 'データベース接続が設定されていません' }, 500);
        }

        const body = await c.req.json();
        console.log('[Hono sendInfo] リクエストボディ受信:', {
            userId: body.userId,
            fullName: body.fullName,
            hostname: body.hostname,
        });

        // userIdとfullNameをリクエストボディから取得
        const userId = body.userId;
        const fullName = body.fullName || null;

        if (!userId) {
            return c.json({ error: 'userIdが必要です' }, 400);
        }

        // PC情報のバリデーション
        if (
            !body.hostname ||
            !body.os ||
            !body.cpu ||
            !body.username ||
            !Array.isArray(body.gpu) ||
            !Array.isArray(body.storage)
        ) {
            return c.json({ error: '必須項目が不足しています' }, 400);
        }

        // userIdとfullNameをbodyから削除（スキーマに含まれているため）
        const { userId: _, fullName: __, ...pcInfoData } = body;

        // PC情報を保存または更新（upsert）
        const result = await db
            .insert(schema.pcInfo)
            .values({
                userId,
                fullName,
                hostname: pcInfoData.hostname,
                os: pcInfoData.os,
                osVersion: pcInfoData.osVersion || '',
                cpu: pcInfoData.cpu,
                cpuCores: pcInfoData.cpuCores || 0,
                totalMemory: pcInfoData.totalMemory || '',
                freeMemory: pcInfoData.freeMemory || '',
                memoryType: pcInfoData.memoryType || '',
                platform: pcInfoData.platform || '',
                arch: pcInfoData.arch || '',
                username: pcInfoData.username,
                gpu: pcInfoData.gpu || [],
                storage: pcInfoData.storage || [],
                timestamp: pcInfoData.timestamp ? new Date(pcInfoData.timestamp) : new Date(),
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: schema.pcInfo.userId,
                set: {
                    fullName,
                    hostname: pcInfoData.hostname,
                    os: pcInfoData.os,
                    osVersion: pcInfoData.osVersion || '',
                    cpu: pcInfoData.cpu,
                    cpuCores: pcInfoData.cpuCores || 0,
                    totalMemory: pcInfoData.totalMemory || '',
                    freeMemory: pcInfoData.freeMemory || '',
                    memoryType: pcInfoData.memoryType || '',
                    platform: pcInfoData.platform || '',
                    arch: pcInfoData.arch || '',
                    username: pcInfoData.username,
                    gpu: pcInfoData.gpu || [],
                    storage: pcInfoData.storage || [],
                    timestamp: pcInfoData.timestamp ? new Date(pcInfoData.timestamp) : new Date(),
                    updatedAt: new Date(),
                },
            })
            .returning();

        return c.json(
            {
                message: 'PC情報を保存しました',
                userId: result[0].userId,
            },
            201
        );
    } catch (error: any) {
        console.error('PC情報の保存エラー:', error);
        return c.json({ error: error.message || 'PC情報の保存に失敗しました' }, 500);
    }
});
