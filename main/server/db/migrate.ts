/* データベーステーブルの作成/マイグレーション */

import { neon } from '@neondatabase/serverless';
import { getDatabaseUrl } from './index';

export async function createTableIfNotExists(): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
        const databaseUrl = getDatabaseUrl();
        const sql = neon(databaseUrl);

        console.log('[DB Migration] テーブルの存在確認と作成を開始...');

        // テーブルが存在するか確認
        const tableCheckResult = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'pc_info'
            ) as exists;
        `;

        const tableExists = tableCheckResult[0]?.exists === true;

        if (tableExists) {
            console.log('[DB Migration] ✓ テーブル pc_info は既に存在します');
            return { success: true, message: 'テーブルは既に存在します' };
        }

        console.log('[DB Migration] テーブル pc_info が存在しないため、作成します...');

        // テーブルを作成
        await sql`
            CREATE TABLE IF NOT EXISTS pc_info (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                full_name TEXT,
                hostname TEXT NOT NULL,
                os TEXT NOT NULL,
                os_version TEXT NOT NULL,
                cpu TEXT NOT NULL,
                cpu_cores INTEGER NOT NULL,
                total_memory TEXT NOT NULL,
                free_memory TEXT NOT NULL,
                memory_type TEXT NOT NULL,
                platform TEXT NOT NULL,
                arch TEXT NOT NULL,
                username TEXT NOT NULL,
                gpu JSONB NOT NULL,
                storage JSONB NOT NULL,
                timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `;

        console.log('[DB Migration] ✓ テーブル pc_info を作成しました');

        // インデックスを作成
        console.log('[DB Migration] インデックスを作成中...');
        
        await sql`
            CREATE INDEX IF NOT EXISTS idx_pc_info_user_id ON pc_info(user_id);
        `;
        
        await sql`
            CREATE INDEX IF NOT EXISTS idx_pc_info_hostname ON pc_info(hostname);
        `;
        
        await sql`
            CREATE INDEX IF NOT EXISTS idx_pc_info_created_at ON pc_info(created_at);
        `;

        console.log('[DB Migration] ✓ インデックスを作成しました');
        console.log('[DB Migration] ✓ データベースマイグレーションが完了しました');

        return { success: true, message: 'テーブルとインデックスを作成しました' };
    } catch (error: any) {
        console.error('[DB Migration] ✗ テーブル作成エラー:', error);
        console.error('[DB Migration] エラーメッセージ:', error?.message);
        console.error('[DB Migration] エラースタック:', error?.stack);
        
        return {
            success: false,
            error: error?.message || 'テーブル作成に失敗しました',
        };
    }
}



