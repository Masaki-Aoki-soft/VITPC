/* PC情報API */

import { Hono } from 'hono';
import { getPCInfo } from '../../pc-info';
import { db } from '../db';
import { pcInfoTable } from '../db/schema';
import { randomBytes } from 'crypto';
import { eq, desc } from 'drizzle-orm';

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
        console.log('[PC Info API] PC情報の保存を開始...');
        
        // リクエストボディからuserIdとfullNameを取得
        const body = await c.req.json();
        const { userId, fullName } = body;

        if (!userId) {
            return c.json({ error: 'userIdが必要です' }, 400);
        }

        // PC情報を取得
        console.log('[PC Info API] PC情報を取得中...');
        const pcInfo = await getPCInfo();

        console.log('[PC Info API] データベースに保存中...');
        console.log('[PC Info API] 保存データ:', {
            userId,
            hostname: pcInfo.hostname,
        });

        // 変数を外側のスコープで定義
        let id: string;
        let isUpdate = false;

        // データベースに保存
        try {
            console.log('[PC Info API] データベースにINSERTを実行中...');
            
            // まずテーブルが存在するか確認し、存在しない場合は作成
            try {
                console.log('[PC Info API] テーブルの存在確認と作成を試みます...');
                const { createTableIfNotExists } = await import('../db/migrate');
                const migrateResult = await createTableIfNotExists();
                
                if (!migrateResult.success) {
                    console.warn('[PC Info API] テーブル作成に失敗しましたが、続行します:', migrateResult.error);
                } else {
                    console.log('[PC Info API] ✓ テーブルの確認完了:', migrateResult.message);
                }
            } catch (migrateError: any) {
                console.warn('[PC Info API] テーブル確認中にエラーが発生しましたが、続行します:', migrateError?.message);
            }
            
            // user_idで既存レコードを検索（最新のもの）
            console.log('[PC Info API] user_idで既存レコードを検索中...');
            const existingRecords = await db
                .select()
                .from(pcInfoTable)
                .where(eq(pcInfoTable.userId, userId))
                .orderBy(desc(pcInfoTable.updatedAt))
                .limit(1);

            const existingRecord = existingRecords[0];

            if (existingRecord) {
                // 既存レコードがある場合は、そのIDを使って更新
                id = existingRecord.id;
                isUpdate = true;
                console.log('[PC Info API] 既存レコードが見つかりました。更新します。ID:', id);
            } else {
                // 既存レコードがない場合は、新規IDを生成
                id = randomBytes(16).toString('hex');
                console.log('[PC Info API] 既存レコードが見つかりませんでした。新規作成します。ID:', id);
            }

            // データベースに保存（更新または挿入）
            try {
                const saveData = {
                    id,
                    userId,
                    fullName: fullName || null,
                    hostname: pcInfo.hostname,
                    os: pcInfo.os,
                    osVersion: pcInfo.osVersion,
                    cpu: pcInfo.cpu,
                    cpuCores: pcInfo.cpuCores,
                    totalMemory: pcInfo.totalMemory,
                    freeMemory: pcInfo.freeMemory,
                    memoryType: pcInfo.memoryType,
                    platform: pcInfo.platform,
                    arch: pcInfo.arch,
                    username: pcInfo.username,
                    gpu: pcInfo.gpu,
                    storage: pcInfo.storage,
                    timestamp: new Date(pcInfo.timestamp),
                    updatedAt: new Date(),
                };

                if (isUpdate) {
                    // 既存レコードを更新（createdAtは保持、updatedAtのみ更新）
                    await db
                        .update(pcInfoTable)
                        .set({
                            ...saveData,
                            createdAt: existingRecord.createdAt, // createdAtは保持
                        })
                        .where(eq(pcInfoTable.id, id));
                    console.log('[PC Info API] ✓ 既存レコードを更新しました');
                } else {
                    // 新規レコードを挿入
                    await db.insert(pcInfoTable).values({
                        ...saveData,
                        createdAt: new Date(),
                    });
                    console.log('[PC Info API] ✓ 新規レコードを作成しました');
                }
            } catch (insertError: any) {
                // エラーの詳細をログに出力
                console.error('[PC Info API] INSERTエラー発生:');
                console.error('[PC Info API] エラーメッセージ:', insertError?.message);
                console.error('[PC Info API] エラーコード:', insertError?.code);
                console.error('[PC Info API] エラー詳細:', insertError?.detail);
                console.error('[PC Info API] エラー全文:', JSON.stringify(insertError, null, 2));
                
                // テーブルが存在しないエラーの場合、テーブルを作成して再試行
                const isTableNotExistError = 
                    insertError?.message?.includes('does not exist') ||
                    insertError?.code === '42P01' ||
                    insertError?.message?.includes('relation') ||
                    insertError?.message?.includes('table') ||
                    insertError?.message?.includes('pc_info');
                
                if (isTableNotExistError) {
                    console.log('[PC Info API] テーブルが存在しない可能性があるため、作成を試みます...');
                    console.log('[PC Info API] エラー検出条件:', {
                        hasMessage: !!insertError?.message,
                        message: insertError?.message,
                        code: insertError?.code,
                        isTableError: isTableNotExistError,
                    });
                    
                    try {
                        const { createTableIfNotExists } = await import('../db/migrate');
                        const migrateResult = await createTableIfNotExists();
                        
                        if (!migrateResult.success) {
                            console.error('[PC Info API] テーブル作成に失敗:', migrateResult.error);
                            throw new Error(`テーブル作成に失敗しました: ${migrateResult.error}`);
                        }
                        
                        console.log('[PC Info API] ✓ テーブル作成完了、再試行します...');
                        // 再試行（既存レコードを検索し直す）
                        const retryExistingRecords = await db
                            .select()
                            .from(pcInfoTable)
                            .where(eq(pcInfoTable.userId, userId))
                            .orderBy(desc(pcInfoTable.updatedAt))
                            .limit(1);
                        
                        const retryExistingRecord = retryExistingRecords[0];
                        const retryId = retryExistingRecord ? retryExistingRecord.id : randomBytes(16).toString('hex');
                        const isRetryUpdate = !!retryExistingRecord;
                        
                        const retrySaveData = {
                            id: retryId,
                            userId,
                            fullName: fullName || null,
                            hostname: pcInfo.hostname,
                            os: pcInfo.os,
                            osVersion: pcInfo.osVersion,
                            cpu: pcInfo.cpu,
                            cpuCores: pcInfo.cpuCores,
                            totalMemory: pcInfo.totalMemory,
                            freeMemory: pcInfo.freeMemory,
                            memoryType: pcInfo.memoryType,
                            platform: pcInfo.platform,
                            arch: pcInfo.arch,
                            username: pcInfo.username,
                            gpu: pcInfo.gpu,
                            storage: pcInfo.storage,
                            timestamp: new Date(pcInfo.timestamp),
                            updatedAt: new Date(),
                        };
                        
                        if (isRetryUpdate) {
                            await db
                                .update(pcInfoTable)
                                .set({
                                    ...retrySaveData,
                                    createdAt: retryExistingRecord.createdAt,
                                })
                                .where(eq(pcInfoTable.id, retryId));
                        } else {
                            await db.insert(pcInfoTable).values({
                                ...retrySaveData,
                                createdAt: new Date(),
                            });
                        }
                        
                        console.log('[PC Info API] ✓ 再試行が成功しました');
                    } catch (migrateError: any) {
                        console.error('[PC Info API] テーブル作成/再試行でエラー:', migrateError);
                        throw migrateError;
                    }
                } else {
                    // テーブルが存在しないエラーではない場合は、そのままエラーを投げる
                    console.error('[PC Info API] テーブルが存在しないエラーではないため、エラーをそのまま返します');
                    throw insertError;
                }
            }

            console.log('[PC Info API] ✓ データベースへの保存が完了しました');
        } catch (dbError: any) {
            console.error('[PC Info API] ✗ データベース保存エラー');
            console.error('[PC Info API] エラータイプ:', dbError?.constructor?.name);
            console.error('[PC Info API] エラーメッセージ:', dbError?.message);
            console.error('[PC Info API] エラーコード:', dbError?.code);
            console.error('[PC Info API] エラー詳細:', dbError?.detail);
            console.error('[PC Info API] エラースタック:', dbError?.stack);
            
            // よくあるエラーの場合、より分かりやすいメッセージを返す
            let errorMessage = 'データベースへの保存に失敗しました';
            let errorDetails: any = {
                message: dbError?.message,
            };

            // テーブルが存在しない場合
            if (dbError?.message?.includes('does not exist') || dbError?.code === '42P01') {
                errorMessage = 'データベーステーブルが存在しません。テーブルを作成してください。';
                errorDetails.hint = 'main/server/db/create_table.sqlファイルのSQLを実行してください';
            }
            // 接続エラーの場合
            else if (dbError?.message?.includes('connection') || dbError?.code?.includes('ECONN')) {
                errorMessage = 'データベースへの接続に失敗しました。DATABASE_URLを確認してください。';
            }
            // その他のエラー
            else {
                errorDetails.code = dbError?.code;
                errorDetails.detail = dbError?.detail;
            }
            
            // データベースエラーの詳細を返す
            // 開発環境では常に詳細なエラー情報を返す
            const isDev = process.env.NODE_ENV !== 'production';
            return c.json({
                error: errorMessage,
                details: isDev ? errorDetails : undefined,
                // 開発環境では完全なエラー情報も含める
                ...(isDev && {
                    fullError: {
                        message: dbError?.message,
                        code: dbError?.code,
                        detail: dbError?.detail,
                        stack: dbError?.stack,
                    },
                }),
            }, 500);
        }

        return c.json({
            message: isUpdate ? 'PC情報を更新しました' : 'PC情報を保存しました',
            data: {
                id,
                ...pcInfo,
                userId,
                fullName,
            },
        });
    } catch (error: any) {
        console.error('[PC Info API] PC情報の保存エラー:', error);
        console.error('[PC Info API] エラースタック:', error.stack);
        return c.json({
            error: error.message || 'PC情報の保存に失敗しました',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        }, 500);
    }
});

