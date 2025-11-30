/* drizzleの設定ファイル */

import { config } from 'dotenv';
import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import path from 'path';

// .env.localファイルを読み込む（rendererディレクトリ内の.env.localを優先）
// まずrenderer/.env.localを試し、なければルートの.env.localを試す
const rendererEnvPath = path.join(__dirname, 'renderer', '.env.local');
const rootEnvPath = path.join(__dirname, '.env.local');

config({ path: rendererEnvPath });
config({ path: rootEnvPath }); // フォールバック
dotenv.config({ path: rendererEnvPath });
dotenv.config({ path: rootEnvPath }); // フォールバック

// DATABASE_URLが設定されていない場合のエラーメッセージ
if (!process.env.DATABASE_URL) {
    console.error('❌ エラー: DATABASE_URL環境変数が設定されていません。');
    console.error('   renderer/.env.localファイルを作成し、DATABASE_URLを設定してください。');
    console.error('   例: DATABASE_URL=postgresql://user:password@host/database?sslmode=require');
    process.exit(1);
}

export default defineConfig({
    schema: './renderer/server/db/schema.ts',
    out: './renderer/server/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
    schemaFilter: ['public'],
});

