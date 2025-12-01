import React, { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { ClerkProvider } from '@clerk/clerk-react';
import '../styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ToasterContext } from '@/context/ToastContext';
import { jaJP } from '@clerk/localizations';

function MyApp({ Component, pageProps }: AppProps) {
    const [clerkPublishableKey, setClerkPublishableKey] = useState<string | undefined>(
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    );
    const [isLoading, setIsLoading] = useState(true);
    const [currentOrigin, setCurrentOrigin] = useState<string | undefined>(undefined);

    // 現在のオリジンを取得
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const origin = window.location.origin;
            setCurrentOrigin(origin);
            console.log('[App] Current origin:', origin);
            
            // オリジンがapp://の場合、Clerkが認識できるように警告
            if (origin.startsWith('app://') || origin.startsWith('file://')) {
                console.warn(
                    '[App] ⚠️ Clerkはapp://やfile://プロトコルを認識できません。',
                    'Clerkダッシュボードで以下のオリジンを登録してください:',
                    '開発環境: http://localhost:8888',
                    '本番環境: ローカルHTTPサーバーを使用する場合はそのポート（例: http://localhost:3001）'
                );
            }
        }
    }, []);

    // Electronから設定を読み込む（ClerkProviderを初期化する前）
    useEffect(() => {
        const loadConfig = async () => {
            try {
                // まず環境変数を確認（開発環境のフォールバック）
                const envKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
                
                // Electron環境の検出と設定の読み込み
                if (typeof window !== 'undefined') {
                    // window.electronAPIが利用可能になるまで待機（最大1秒）
                    let retryCount = 0;
                    const maxRetries = 10;
                    
                    const waitForElectronAPI = async (): Promise<boolean> => {
                        while (retryCount < maxRetries) {
                            if (window.electronAPI) {
                                return true;
                            }
                            await new Promise(resolve => setTimeout(resolve, 100));
                            retryCount++;
                        }
                        return false;
                    };

                    const hasElectronAPI = await waitForElectronAPI();
                    
                    if (hasElectronAPI && window.electronAPI) {
                        try {
                            const config = await window.electronAPI.getConfig();
                            if (config?.clerkPublishableKey) {
                                setClerkPublishableKey(config.clerkPublishableKey);
                                console.log('[App] Config loaded from Electron');
                            } else if (envKey) {
                                // Electron設定にキーがない場合、環境変数を使用
                                setClerkPublishableKey(envKey);
                                console.log('[App] Using env var as fallback');
                            }
                        } catch (error) {
                            console.error('[App] Failed to get config from Electron:', error);
                            // エラー時は環境変数を使用
                            if (envKey) {
                                setClerkPublishableKey(envKey);
                            }
                        }
                    } else {
                        // Electron環境でない場合、環境変数を使用
                        if (envKey) {
                            setClerkPublishableKey(envKey);
                            console.log('[App] Running in non-Electron environment, using env vars');
                        }
                    }
                } else if (envKey) {
                    // SSR時は環境変数を使用
                    setClerkPublishableKey(envKey);
                }
            } catch (error) {
                console.error('[App] Failed to load config:', error);
                // エラー時は環境変数を使用
                const envKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
                if (envKey) {
                    setClerkPublishableKey(envKey);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadConfig();
    }, []);

    // ローディング中
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
            </div>
        );
    }

    // publishableKeyが設定されていない場合のエラーハンドリング
    if (!clerkPublishableKey) {
        console.error(
            '[App] Clerkの公開キーが設定されていません。',
            'Electron API:', typeof window !== 'undefined' ? !!window.electronAPI : false,
            'Env Key:', !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        );
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-4">設定エラー</h1>
                    <p className="text-gray-600 mb-4">
                        Clerkの公開キーが設定されていません。
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                        実行ファイルと同じディレクトリに<code className="bg-gray-100 px-2 py-1 rounded">config.json</code>ファイルを作成し、
                        <code className="bg-gray-100 px-2 py-1 rounded">clerkPublishableKey</code>を設定してください。
                    </p>
                    <p className="text-xs text-gray-400 mt-4">
                        デバッグ情報: Electron API = {typeof window !== 'undefined' && window.electronAPI ? '利用可能' : '利用不可'}
                    </p>
                </div>
            </div>
        );
    }

    // publishableKeyが有効な値であることを確認
    if (!clerkPublishableKey || clerkPublishableKey.trim() === '') {
        console.error('[App] Invalid publishableKey:', clerkPublishableKey);
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-4">設定エラー</h1>
                    <p className="text-gray-600 mb-4">
                        Clerkの公開キーが無効です。
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ClerkProvider
            localization={jaJP}
            publishableKey={clerkPublishableKey}
            // リダイレクトURLを明示的に指定（Electronアプリの場合）
            signInUrl="/login"
            signUpUrl="/signup"
            signInFallbackRedirectUrl="/"
            signUpFallbackRedirectUrl="/"
            // Electronアプリ用の設定
            // 重要: Clerkダッシュボードで以下のオリジンを登録する必要があります：
            // - 開発環境: http://localhost:8888 (Nextronのデフォルトポート)
            // - 本番環境: http://localhost:3002 (静的ファイルサーバーのポート)
            // 
            // app://プロトコルはClerkが認識できないため、
            // 本番環境でもHTTPサーバー（http://localhost:3002）を使用します
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
