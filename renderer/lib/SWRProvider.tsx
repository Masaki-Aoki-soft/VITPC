/* SWR用プロバイダー */

'use client';

import { SWRConfig } from 'swr';
import { fetchPCInfo } from '@/lib/fetcher';

export function SWRProvider({ children }: { children: React.ReactNode }) {
    return <SWRConfig value={{ fetcher: fetchPCInfo }}>{children}</SWRConfig>;
}
