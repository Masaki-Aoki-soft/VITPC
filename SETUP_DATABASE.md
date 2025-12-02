# データベース設定とトラブルシューティング

## 問題: データベーステーブルが存在しないエラー

### 解決方法

1. **アプリを完全に停止してください**
   - すべてのアプリウィンドウを閉じる
   - タスクマネージャーでプロセスが残っていないか確認

2. **アプリを再起動してください**
   - 開発モード: `npm run dev`
   - これにより、新しいコードが読み込まれます

3. **サーバーのログを確認してください**
   - ターミナル/コマンドプロンプトのログを確認
   - 以下のようなログが表示されるはずです:
     ```
     [DB Migration] テーブルの存在確認と作成を開始...
     [DB Migration] テーブル pc_info が存在しないため、作成します...
     [DB Migration] ✓ テーブル pc_info を作成しました
     ```

4. **PC情報の保存を試してください**
   - 保存時に、テーブルが自動的に作成されます
   - サーバーのログで詳細な情報を確認できます

### 手動でテーブルを作成する場合

NeonDBのダッシュボードで以下のSQLを実行してください:

```sql
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

CREATE INDEX IF NOT EXISTS idx_pc_info_user_id ON pc_info(user_id);
CREATE INDEX IF NOT EXISTS idx_pc_info_hostname ON pc_info(hostname);
CREATE INDEX IF NOT EXISTS idx_pc_info_created_at ON pc_info(created_at);
```

### サーバーログの確認方法

1. **開発モードで起動している場合**
   - `npm run dev` を実行したターミナル/コマンドプロンプトのログを確認
   - `[PC Info API]` や `[DB Migration]` で始まるログを探す

2. **エラーが出る場合**
   - サーバー側のログに詳細なエラー情報が表示されます
   - エラーメッセージをコピーして、トラブルシューティングに使用してください

### よくある問題

- **アプリが再起動されていない**: TypeScriptファイルの変更は、アプリを完全に再起動しないと反映されません
- **サーバーログが見えない**: ブラウザのコンソールではなく、ターミナルのログを確認してください
- **DATABASE_URLが設定されていない**: `config.json` に `DATABASE_URL` が設定されているか確認してください

