/* PC情報取得用Fetcher */

import { PCInfo } from '@/components/pc-info-card';

/**
 * PC情報を取得する関数
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
