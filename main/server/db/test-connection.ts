/* データベース接続テスト */

import { neon } from '@neondatabase/serverless';

export async function testDatabaseConnection(databaseUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
        const sql = neon(databaseUrl);
        
        // 簡単なクエリで接続をテスト
        const result = await sql`SELECT 1 as test`;
        
        console.log('[DB Test] ✓ データベース接続テスト成功');
        console.log('[DB Test] テスト結果:', result);
        
        return { success: true };
    } catch (error: any) {
        console.error('[DB Test] ✗ データベース接続テスト失敗');
        console.error('[DB Test] エラー:', error);
        
        return {
            success: false,
            error: error?.message || '接続エラー',
        };
    }
}

export async function checkTableExists(databaseUrl: string, tableName: string = 'pc_info'): Promise<{ exists: boolean; error?: string }> {
    try {
        const sql = neon(databaseUrl);
        
        // テーブルの存在確認
        const result = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = ${tableName}
            );
        `;
        
        const exists = result[0]?.exists === true;
        
        console.log(`[DB Test] テーブル '${tableName}' の存在確認:`, exists);
        
        return { exists };
    } catch (error: any) {
        console.error('[DB Test] ✗ テーブル存在確認エラー:', error);
        
        return {
            exists: false,
            error: error?.message || '確認エラー',
        };
    }
}

