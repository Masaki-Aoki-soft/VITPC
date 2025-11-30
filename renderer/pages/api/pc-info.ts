/* Next.js側API */

import app from '@/server';
import { NextApiRequest, NextApiResponse } from 'next';

// POST: PC情報を保存（userIdはリクエストボディから取得）
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

        // リクエストボディを取得（既にパースされている場合はそのまま使用）
        let body: string | undefined;
        if (req.method === 'POST') {
            body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            console.log('[API] リクエストボディ:', body.substring(0, 200));
        }

        // URLを構築
        // req.urlは `/api/pc-info` または `/api/pc-info/` または `/api/pc-info?query=...` の形式
        // Honoのルートは `/api/pc-info` にマッチするように設定されている
        // 末尾のスラッシュを削除して統一
        let path = req.url || '/api/pc-info';
        if (path.endsWith('/') && path !== '/') {
            path = path.slice(0, -1);
        }
        
        const baseUrl = 'http://localhost';
        const url = new URL(path, baseUrl);

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
