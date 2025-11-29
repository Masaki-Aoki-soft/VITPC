import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

/**
 * SSO認証のコールバックページ
 * ClerkのOAuth認証完了後にリダイレクトされる
 */
export default function SSOCallback() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn) {
            // 認証成功時、ダッシュボードにリダイレクト
            router.push("/dashboard");
        } else {
            // 認証失敗時、ログインページにリダイレクト
            router.push("/");
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
}

