import React, { useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useAuth } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

/**
 * SSO認証のコールバックページ
 * ClerkのOAuth認証完了後にリダイレクトされる
 */
const SSOCallback: NextPage = () => {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn) {
            // 認証成功時、redirect_urlパラメータがある場合はそこにリダイレクト、なければ/へ
            const redirectUrl = router.query.redirect_url as string;
            if (redirectUrl) {
                router.push(redirectUrl);
            } else {
                router.push('/');
            }
        } else {
            // 認証失敗時、ログインページにリダイレクト
            router.push('/');
        }
    }, [isSignedIn, isLoaded, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-600">認証を処理しています...</p>
            </div>
        </div>
    );
};

export default SSOCallback;
