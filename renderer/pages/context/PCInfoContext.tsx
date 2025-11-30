/* PC情報管理用Context（SWR使用） */

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import useSWR, { SWRConfiguration } from 'swr';
import { PCInfo } from '@/components/pc-info-card';
import toast from 'react-hot-toast';

interface PCInfoContextType {
    pcInfo: PCInfo | null;
    isLoading: boolean;
    error: Error | null;
    mutate: () => Promise<PCInfo | undefined>;
    isValidating: boolean;
}

const PCInfoContext = createContext<PCInfoContextType | undefined>(undefined);

// PC情報を取得する関数
const fetcher = async (): Promise<PCInfo> => {
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

interface PCInfoProviderProps {
    children: ReactNode;
    config?: SWRConfiguration;
}

export const PCInfoProvider = ({ children, config }: PCInfoProviderProps) => {
    const swrConfig: SWRConfiguration = {
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
        ...config,
    };

    const { data, error, mutate, isValidating } = useSWR<PCInfo>(
        'pc-info', // SWRのキー
        fetcher,
        swrConfig
    );

    // valueオブジェクトをメモ化して、不要な再レンダリングを防ぐ
    const value: PCInfoContextType = useMemo(
        () => ({
            pcInfo: data || null,
            isLoading: !data && !error,
            error: error || null,
            mutate: async () => {
                try {
                    const result = await mutate();
                    toast.success('PC情報を更新しました');
                    return result;
                } catch (err: any) {
                    toast.error(err.message || 'PC情報の更新に失敗しました');
                    throw err;
                }
            },
            isValidating,
        }),
        [data, error, isValidating, mutate]
    );

    return <PCInfoContext.Provider value={value}>{children}</PCInfoContext.Provider>;
};

// PC情報を使用するカスタムフック
export const usePCInfo = (): PCInfoContextType => {
    const context = useContext(PCInfoContext);
    if (context === undefined) {
        throw new Error('usePCInfo must be used within a PCInfoProvider');
    }
    return context;
};

