/* PC情報管理用カスタムフック（SWR使用） */

import useSWR from 'swr';
import { useAuth } from '@clerk/clerk-react';
import { PCInfo } from '@/components/pc-info-card';
import { fetchPCInfo } from '@/lib/fetcher';
import toast from 'react-hot-toast';

interface UsePCInfoReturn {
    pcInfo: PCInfo | null;
    isLoading: boolean;
    error: Error | null;
    mutate: () => Promise<PCInfo | undefined>;
    isValidating: boolean;
}

/**
 * PC情報を取得・管理するカスタムフック
 * SWRを使用してデータをキャッシュし、ページ遷移後もデータを保持
 */
export const usePCInfo = (): UsePCInfoReturn => {
    const { getToken } = useAuth();

    // SWRのfetcher関数を定義（トークンを取得してfetchPCInfoに渡す）
    const fetcher = async (): Promise<PCInfo> => {
        const token = await getToken();
        return fetchPCInfo(token || undefined);
    };

    const { data, error, mutate, isValidating } = useSWR<PCInfo>(
        'pc-info', // SWRのキー
        fetcher,
        {
            revalidateOnFocus: false, // フォーカス時の再検証を無効化
            revalidateOnReconnect: true, // 再接続時に再検証
            refreshInterval: 0, // 自動更新は無効（手動更新のみ）
            dedupingInterval: 5000, // 5秒間は重複リクエストを防ぐ
            onError: (error) => {
                console.error('PC情報の取得エラー:', error);
                // toastは一度だけ表示するようにする
                if (error.message) {
                    toast.error(error.message || 'PC情報の取得に失敗しました');
                }
            },
        }
    );

    // mutate関数をラップ（トーストは呼び出し側で制御）
    const mutateWithToast = async (): Promise<PCInfo | undefined> => {
        try {
            // トークンを取得してPC情報を取得
            const token = await getToken();
            const pcInfo = await fetchPCInfo(token || undefined);

            // SWRのキャッシュを更新
            const result = await mutate(pcInfo, { revalidate: false });
            return result;
        } catch (err: any) {
            throw err;
        }
    };

    return {
        pcInfo: data || null,
        isLoading: !data && !error,
        error: error || null,
        mutate: mutateWithToast,
        isValidating,
    };
};
