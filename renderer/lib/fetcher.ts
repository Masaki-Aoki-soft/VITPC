/* PC情報取得・保存用Fetcher */

import { PCInfo } from '@/components/pc-info-card';

/**
 * PC情報を取得する関数（Electronから）
 * SWRのfetcherとして使用
 */
export const fetchPCInfo = async (): Promise<PCInfo> => {
    if (typeof window === 'undefined' || !window.ipc) {
        throw new Error('IPC通信が利用できません');
    }

    try {
        const info = (await window.ipc.invoke('get-pc-info')) as PCInfo;
        return info;
    } catch (error: any) {
        console.error('PC情報の取得に失敗:', error);
        throw new Error(error.message || 'PC情報の取得に失敗しました');
    }
};

/**
 * PC情報をサーバーに保存する関数
 * Hono APIにPOSTリクエストを送信
 * @param pcInfo PC情報
 * @param userId ClerkのuserId
 * @param fullName ClerkのfullName
 */
export const savePCInfo = async (
    pcInfo: PCInfo,
    userId: string,
    fullName: string | null
): Promise<void> => {
    try {
        // trailingSlash: trueの設定に対応するため、末尾にスラッシュを追加
        const response = await fetch('/api/pc-info/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...pcInfo,
                userId, // userIdをリクエストボディに含める
                fullName, // fullNameをリクエストボディに含める
            }),
        });

        // レスポンスのContent-Typeを確認
        const contentType = response.headers.get('content-type') || '';

        // まずテキストとして取得（JSONパースを2回呼ばないように）
        const text = await response.text();

        if (!response.ok) {
            // エラーレスポンスの内容を確認
            let errorMessage = 'PC情報の保存に失敗しました';

            if (contentType.includes('application/json')) {
                try {
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    // JSONパースに失敗した場合
                    console.error('JSONパースエラー:', e);
                    console.error('エラーレスポンス:', text.substring(0, 500));
                    errorMessage = `サーバーエラー: ${response.status} ${response.statusText}`;
                }
            } else {
                // HTMLレスポンスの場合
                console.error('非JSONエラーレスポンス:', text.substring(0, 500));
                errorMessage = `サーバーエラー: ${response.status} ${response.statusText}`;
            }

            throw new Error(errorMessage);
        }

        // 成功時はJSONとしてパース
        let result;
        try {
            result = JSON.parse(text);
            console.log('PC情報をサーバーに保存しました:', result);
        } catch (e) {
            console.error('レスポンスのJSONパースに失敗:', e);
            throw new Error('サーバーからのレスポンスが無効です');
        }
    } catch (error: any) {
        console.error('PC情報の保存に失敗:', error);
        throw new Error(error.message || 'PC情報の保存に失敗しました');
    }
};

/**
 * データベースから全ユーザーのPC情報を取得する関数
 * getInfo.tsを使用してデータを取得
 * @param getAll 全ユーザーの情報を取得するかどうか（デフォルト: true）
 */
export const fetchAllPCInfo = async (getAll: boolean = true): Promise<any[]> => {
    try {
        // 末尾のスラッシュを削除してHonoのルーティングにマッチさせる
        const url = getAll ? '/api/pc-info?all=true' : '/api/pc-info';
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                error: 'PC情報の取得に失敗しました',
            }));
            throw new Error(errorData.error || 'PC情報の取得に失敗しました');
        }

        const data = await response.json();

        // getAll=trueの場合は { data: [...], count: number } の形式
        // それ以外の場合は単一のオブジェクト
        if (getAll && data.data) {
            return data.data;
        } else if (!getAll) {
            return [data];
        } else {
            return [];
        }
    } catch (error: any) {
        console.error('PC情報の取得に失敗:', error);
        throw new Error(error.message || 'PC情報の取得に失敗しました');
    }
};
