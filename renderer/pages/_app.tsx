import React, { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { ClerkProvider } from '@clerk/nextjs';
import '../styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { useTheme } from 'next-themes';
import { ToasterContext } from './context/ToastContext';
import { jaJP } from '@clerk/localizations';
import { motion, AnimatePresence } from 'framer-motion';

function AppContent({ Component, pageProps }: AppProps) {
    const { theme } = useTheme();
    const [currentTheme, setCurrentTheme] = useState<string | undefined>(theme);

    useEffect(() => {
        if (theme && theme !== currentTheme) {
            setCurrentTheme(theme);
        }
    }, [theme, currentTheme]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentTheme || 'light'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1],
                }}
                style={{ minHeight: '100vh' }}
            >
                <Component {...pageProps} />
            </motion.div>
        </AnimatePresence>
    );
}

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
        >
            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
            >
                <ToasterContext />
                <AppContent Component={Component} pageProps={pageProps} />
            </ThemeProvider>
        </ClerkProvider>
    );
}

export default MyApp;
