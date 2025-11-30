import React from 'react';
import type { AppProps } from 'next/app';
import { ClerkProvider } from '@clerk/nextjs';
import '../styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ToasterContext } from './context/ToastContext';
import { jaJP } from '@clerk/localizations';

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ClerkProvider
            localization={jaJP}
            // Electronアプリ用の設定
            // 開発環境と本番環境で異なるURLを処理
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            // リダイレクトURLを明示的に指定（Electronアプリの場合）
            signInUrl="/"
            signUpUrl="/signup"
            fallbackRedirectUrl="/"
        >
            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
            >
                <ToasterContext />
                <Component {...pageProps} />
            </ThemeProvider>
        </ClerkProvider>
    );
}

export default MyApp;
