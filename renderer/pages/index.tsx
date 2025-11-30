/* Dashboardページ - PC情報表示 */

import React, { useEffect } from 'react';
import Head from 'next/head';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useAuth, useUser } from '@clerk/nextjs';
import { Navbar } from '@/components/site-header';
import { PCInfoCard } from '@/components/pc-info-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { usePCInfo } from '@/hooks/usePCInfo';
import { savePCInfo } from '@/lib/fetcher';

const Dashboard: NextPage = () => {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();
    const { pcInfo, isLoading, error, mutate, isValidating } = usePCInfo();

    // 認証チェック
    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            router.push('/login');
        }
    }, [isSignedIn, isLoaded, router]);

    // PC情報を取得した後にサーバーに保存
    useEffect(() => {
        if (!pcInfo || !user?.id) return;

        const saveToServer = async () => {
            try {
                await savePCInfo(pcInfo, user.id, user.fullName || null);
            } catch (error: any) {
                console.error('PC情報の保存に失敗:', error);
                // エラーは表示しない（バックグラウンド処理のため）
            }
        };

        saveToServer();
    }, [pcInfo, user?.id, user?.fullName]);

    // ローディング中または未ログインの場合は何も表示しない
    if (!isLoaded || !isSignedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>読み込み中...</span>
                </div>
            </div>
        );
    }

    return (
        <React.Fragment>
            <Head>
                <title>ダッシュボード - VITPC</title>
            </Head>

            <div className="relative flex min-h-screen flex-col bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <div className="space-y-6">
                        {/* ヘッダー */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold">ダッシュボード</h1>
                                <p className="text-muted-foreground mt-1">
                                    このPCの情報を表示します
                                </p>
                            </div>
                            <Button
                                onClick={async () => {
                                    try {
                                        const updatedInfo = await mutate();
                                        // PC情報を取得した後にサーバーに保存
                                        if (updatedInfo && user?.id) {
                                            await savePCInfo(
                                                updatedInfo,
                                                user.id,
                                                user.fullName || null
                                            );
                                        }
                                    } catch (error: any) {
                                        console.error('PC情報の更新に失敗:', error);
                                    }
                                }}
                                disabled={isLoading || isValidating}
                                variant="outline"
                            >
                                {isLoading || isValidating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        取得中...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        更新
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* PC情報カード */}
                        {isLoading ? (
                            <Card>
                                <CardContent className="py-12">
                                    <div className="flex items-center justify-center space-x-2">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        <span>PC情報を取得しています...</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : error ? (
                            <Card>
                                <CardContent className="py-12">
                                    <div className="text-center space-y-4">
                                        <p className="text-muted-foreground">
                                            PC情報の取得に失敗しました
                                        </p>
                                        <Button onClick={() => mutate()} variant="outline">
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            再試行
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : pcInfo ? (
                            <PCInfoCard pcInfo={pcInfo} />
                        ) : (
                            <Card>
                                <CardContent className="py-12">
                                    <div className="text-center space-y-4">
                                        <p className="text-muted-foreground">
                                            PC情報が取得できませんでした
                                        </p>
                                        <Button onClick={() => mutate()} variant="outline">
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            取得
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default Dashboard;
