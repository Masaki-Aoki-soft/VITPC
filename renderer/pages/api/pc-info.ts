/* Next.js側API */

import app from '@/server';
import { NextApiRequest, NextApiResponse } from 'next';
// Pages RouterではgetAuthは使用できないため、クライアント側からuserIdを取得する
// または、all=trueの場合は認証不要で全データを取得

// GET: PC情報を取得
// POST: PC情報を保存（userIdはリクエストボディから取得）
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('[API Handler] ハンドラーが呼ばれました:', {
        method: req.method,
        url: req.url,
        path: req.url?.split('?')[0],
    });

    try {
        console.log('[API] リクエスト受信:', {
            method: req.method,
            url: req.url,
            path: req.url?.split('?')[0],
        });

        // リクエストヘッダーを設定
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        // 元のリクエストヘッダーもコピー
        Object.keys(req.headers).forEach((key) => {
            const value = req.headers[key];
            if (value && key !== 'host' && key !== 'content-length') {
                headers.set(key, Array.isArray(value) ? value[0] : value);
            }
        });

        // GETリクエストでall=trueの場合は認証不要
        // それ以外の場合は、クライアント側からuserIdを取得する必要がある
        // ここでは、all=trueの場合は認証不要として処理

        // リクエストボディを取得（既にパースされている場合はそのまま使用）
        let body: string | undefined;
        if (req.method === 'POST') {
            body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            console.log('[API] リクエストボディ:', body.substring(0, 200));
        }

        // URLを構築
        // req.urlは `/api/pc-info` または `/api/pc-info/` または `/api/pc-info?query=...` の形式
        // Honoのルートは `/api/pc-info` にマッチするように設定されている
        // 末尾のスラッシュを削除して統一（クエリパラメータの前で）
        let path = req.url || '/api/pc-info';

        // クエリパラメータを分離
        let queryString = '';
        if (path.includes('?')) {
            const parts = path.split('?');
            path = parts[0];
            queryString = parts[1];
        }

        // 末尾のスラッシュを削除
        if (path.endsWith('/') && path !== '/') {
            path = path.slice(0, -1);
        }

        // URLオブジェクトを作成
        const urlObj = new URL(path, 'http://localhost');
        if (queryString) {
            urlObj.search = queryString;
        }

        const url = urlObj.toString();

        console.log('[API] リクエスト詳細:', {
            originalUrl: req.url,
            processedPath: path,
            method: req.method,
            honoUrl: url.toString(),
        });

        const honoRequest = new Request(url.toString(), {
            method: req.method || 'GET',
            headers,
            body,
        });

        // Honoアプリを直接呼び出す（app.fetchを使用）
        const response = await app.fetch(honoRequest);

        console.log('[API] Honoレスポンス:', {
            status: response.status,
            contentType: response.headers.get('content-type'),
            url: response.url,
        });

        // レスポンスのContent-Typeを確認
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            const responseData = await response.json();
            const status = response.status;
            return res.status(status).json(responseData);
        } else {
            // JSON以外のレスポンスの場合
            const text = await response.text();
            console.error('非JSONレスポンス:', text.substring(0, 200));
            return res.status(response.status).json({
                error: 'サーバーエラー',
                message: text.substring(0, 200),
            });
        }
    } catch (error: any) {
        console.error('APIエラー:', error);
        return res.status(500).json({ error: error.message || 'サーバーエラー' });
    }
}
