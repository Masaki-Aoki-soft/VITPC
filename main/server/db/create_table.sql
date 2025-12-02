-- PC情報テーブルの作成
-- NeonDBでこのSQLを実行してテーブルを作成してください

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

-- インデックスの作成（検索の高速化）
CREATE INDEX IF NOT EXISTS idx_pc_info_user_id ON pc_info(user_id);
CREATE INDEX IF NOT EXISTS idx_pc_info_hostname ON pc_info(hostname);
CREATE INDEX IF NOT EXISTS idx_pc_info_created_at ON pc_info(created_at);

