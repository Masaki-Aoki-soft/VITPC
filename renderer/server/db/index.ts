/* NeonDB接続設定 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// NeonDB接続文字列を環境変数から取得
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn('DATABASE_URL環境変数が設定されていません。データベース機能は使用できません。');
}

// Neonクライアントを作成（接続文字列がない場合はnull）
let sql: ReturnType<typeof neon> | null = null;
if (connectionString) {
    try {
        sql = neon(connectionString);
    } catch (error) {
        console.error('NeonDB接続の初期化に失敗:', error);
    }
}

// Drizzleインスタンスを作成
export const db = sql ? drizzle(sql, { schema }) : null;

export { schema };
