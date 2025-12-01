/* SWR用のfetcher定義ファイル */

import { PCInfo } from '@/components/pc-info-card';

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * PC情報をmain側のサーバーから取得
 * @param token Clerkの認証トークン（オプション）
 * @returns PC情報
 */
export async function fetchPCInfo(token?: string | null): Promise<PCInfo> {
    // main側のサーバーからPC情報を取得
    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? 'http://localhost:3001/api/pc-info'
            : 'http://localhost:3001/api/pc-info';

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // トークンが提供されている場合はAuthorizationヘッダーに追加
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'PC情報の取得に失敗しました');
    }

    return await response.json();
}

/**
 * PC情報をmain側のサーバーに保存
 * @param pcInfo PC情報
 * @param userId ユーザーID
 * @param fullName ユーザーのフルネーム
 * @param token Clerkの認証トークン（オプション）
 */
export async function savePCInfo(
    pcInfo: any,
    userId: string,
    fullName: string | null,
    token?: string | null
): Promise<void> {
    // main側のサーバーにリクエストを送信
    // 開発環境では localhost:3001、本番環境では適切なURLを使用
    const apiUrl =
        process.env.NODE_ENV === 'production'
            ? 'http://localhost:3001/api/pc-info'
            : 'http://localhost:3001/api/pc-info';

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // トークンが提供されている場合はAuthorizationヘッダーに追加
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            ...pcInfo,
            userId,
            fullName,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'PC情報の保存に失敗しました');
    }
}
