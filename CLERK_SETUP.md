# Clerk設定ガイド

## ⚠️ 重要な注意事項

**Electronアプリの本番環境では、`app://`プロトコルはClerkが認識できません。**

本番環境でもHTTPサーバーを使用することを強く推奨します。現在の実装では、mainプロセスでポート3001でHTTPサーバーを起動しています。

## オリジンの登録

Clerkダッシュボードで以下のオリジンを登録する必要があります：

### 開発環境
- `http://localhost:8888` (Nextronのデフォルトポート)

### 本番環境（推奨）
- `http://localhost:3002` (静的ファイルサーバーのポート)
- `http://localhost:3001` (APIサーバーのポート - オプション)

**注意**: `app://`プロトコルはClerkが認識できないため、本番環境でもHTTPサーバーを使用してください。

## 設定方法

1. Clerkダッシュボードにログイン
2. 「Settings」>「Domains」または「Allowed Origins」セクションに移動
3. 上記のオリジンを追加

## config.jsonの設定

実行ファイルと同じディレクトリに`config.json`を作成し、以下の形式で設定してください：

```json
{
  "clerkPublishableKey": "pk_test_...",
  "clerkSecretKey": "sk_test_..."
}
```

**注意**: 
- 本番環境では、本番用のキーを使用してください。開発用キーには使用制限があります。
- `clerkPublishableKey`は、Clerkダッシュボードの「API Keys」セクションから取得できます。

