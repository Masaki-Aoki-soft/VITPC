/* ユーザーの設定ページ */

'use client';

import { NextPage } from 'next';
import { UserProfile } from '@clerk/nextjs';
import { Navbar } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SettingPage: NextPage = () => {
    const router = useRouter();

    return (
        <div className="flex flex-col min-h-screen overflow-y-scroll">
            <Navbar />
            <main className="flex flex-1 flex-col items-center p-4 sm:p-6">
                <div className="w-full max-w-4xl mb-6">
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 cursor-pointer"
                        onClick={() => router.push('/')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        ダッシュボードに戻る
                    </Button>
                </div>

                <UserProfile routing="hash" />
            </main>
        </div>
    );
};

export default SettingPage;

