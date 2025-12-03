/* Dashboardページ - PC情報表示 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/site-header';
import { PCInfoCard } from '@/components/pc-info-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, Download } from 'lucide-react';
import { usePCInfo } from '@/hooks/usePCInfo';
import { savePCInfo } from '@/lib/fetcher';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const Dashboard: NextPage = () => {
    const router = useRouter();
    const { isSignedIn, isLoaded, getToken } = useAuth();
    const { user } = useUser();
    const { pcInfo, isLoading, error, mutate, isValidating } = usePCInfo();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Excelダウンロード機能
    const handleDownloadExcel = () => {
        if (!pcInfo) {
            toast.error('PC情報が取得できません');
            return;
        }

        try {
            // id、user_id、time_stamp、created_atを除外したデータを作成
            const excelData: any = {
                名前: user.fullName,
                OS: pcInfo.os,
                OSバージョン: pcInfo.osVersion,
                CPU: pcInfo.cpu,
                CPUコア数: pcInfo.cpuCores,
                総メモリ: pcInfo.totalMemory,
                空きメモリ: pcInfo.freeMemory,
                メモリ種類: pcInfo.memoryType,
                プラットフォーム: pcInfo.platform,
                アーキテクチャ: pcInfo.arch,
                ユーザー名: pcInfo.username,
            };

            // GPU情報を追加
            if (pcInfo.gpu && pcInfo.gpu.length > 0) {
                pcInfo.gpu.forEach((gpu, index) => {
                    const gpuLabel = pcInfo.gpu.length > 1 ? `GPU${index + 1}` : 'GPU';
                    excelData[`${gpuLabel} モデル`] = gpu.name;
                    if (gpu.vram) {
                        excelData[`${gpuLabel} VRAM`] = gpu.vram;
                    }
                });
            }

            // ストレージ情報を追加
            if (pcInfo.storage && pcInfo.storage.length > 0) {
                pcInfo.storage.forEach((storage, index) => {
                    const storageLabel = `ストレージ${index + 1}`;
                    excelData[`${storageLabel} モデル`] = storage.model;
                    excelData[`${storageLabel} 容量`] = storage.size;
                    if (storage.manufacturer) {
                        excelData[`${storageLabel} 製造会社`] = storage.manufacturer;
                    }
                });
            }

            // ワークブックを作成
            const worksheet = XLSX.utils.json_to_sheet([excelData]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'PC情報');

            // ファイル名を生成（ホスト名と日時を含む）
            const fileName = `PC情報_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Excelファイルをダウンロード
            XLSX.writeFile(workbook, fileName);
            toast.success('Excelファイルをダウンロードしました');
        } catch (error: any) {
            console.error('Excelダウンロードエラー:', error);
            toast.error('Excelファイルのダウンロードに失敗しました');
        }
    };

    // 更新処理中に画面遷移をブロック
    useEffect(() => {
        if (!router.events) return;

        const handleRouteChangeStart = (url: string) => {
            if (isRefreshing || isValidating) {
                // 更新処理中は画面遷移をキャンセル
                router.events.emit('routeChangeError');
                throw '更新処理中は画面遷移できません';
            }
        };

        router.events.on('routeChangeStart', handleRouteChangeStart);

        return () => {
            router.events.off('routeChangeStart', handleRouteChangeStart);
        };
    }, [router, isRefreshing, isValidating]);

    // 認証チェック
    useEffect(() => {
        if (!isLoaded) return;

        // 更新処理中は画面遷移をブロック
        if (isRefreshing || isValidating) return;

        if (!isSignedIn) {
            router.push('/login');
        }
    }, [isSignedIn, isLoaded, router, isRefreshing, isValidating]);

    // ユーザー情報をメインプロセスに保存（自動保存用）
    useEffect(() => {
        if (user?.id && typeof window !== 'undefined' && window.electronAPI) {
            window.electronAPI.saveLastUser(user.id, user.fullName || undefined).catch((error) => {
                console.error('ユーザー情報の保存に失敗:', error);
            });
        }
    }, [user?.id, user?.fullName]);

    // PC情報を取得した後にサーバーに保存
    useEffect(() => {
        if (!pcInfo || !user?.id) return;

        const saveToServer = async () => {
            try {
                const token = await getToken();
                await savePCInfo(pcInfo, user.id, user.fullName || null, token || undefined);
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
                <Navbar isUpdating={isRefreshing || isValidating} />
                {/* 更新処理中のオーバーレイ */}
                {(isRefreshing || isValidating) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 pointer-events-none"
                    />
                )}
                <div
                    className={`container mx-auto px-4 py-8 max-w-4xl ${
                        isRefreshing || isValidating ? 'pointer-events-none opacity-60' : ''
                    }`}
                >
                    <div className="space-y-6">
                        {/* ヘッダー */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold">ダッシュボード</h1>
                                <p className="text-muted-foreground mt-1">
                                    このPCの情報を表示します
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    <Button
                                        onClick={handleDownloadExcel}
                                        disabled={
                                            !pcInfo || isLoading || isValidating || isRefreshing
                                        }
                                        variant="outline"
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Excelダウンロード
                                    </Button>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    <Button
                                        onClick={async () => {
                                            setIsRefreshing(true);

                                            try {
                                                await toast.promise(
                                                    new Promise<string>(async (resolve, reject) => {
                                                        try {
                                                            const updatedInfo = await mutate();
                                                            // PC情報を取得した後にサーバーに保存
                                                            if (updatedInfo && user?.id) {
                                                                const token = await getToken();
                                                                await savePCInfo(
                                                                    updatedInfo,
                                                                    user.id,
                                                                    user.fullName || null,
                                                                    token || undefined
                                                                );
                                                            }
                                                            resolve('PC情報を更新しました');
                                                        } catch (error: any) {
                                                            console.error(
                                                                'PC情報の更新に失敗:',
                                                                error
                                                            );
                                                            reject('PC情報の更新に失敗しました');
                                                        }
                                                    }),
                                                    {
                                                        loading: '更新中...',
                                                        success: (message: string) => message,
                                                        error: (message: string) => message,
                                                    }
                                                );
                                            } finally {
                                                setTimeout(() => setIsRefreshing(false), 300);
                                            }
                                        }}
                                        disabled={isLoading || isValidating || isRefreshing}
                                        variant="outline"
                                    >
                                        {isLoading || isValidating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                取得中...
                                            </>
                                        ) : (
                                            <>
                                                <motion.div
                                                    animate={
                                                        isRefreshing
                                                            ? { rotate: 360 }
                                                            : { rotate: 0 }
                                                    }
                                                    transition={{
                                                        duration: 0.5,
                                                        ease: 'easeInOut',
                                                    }}
                                                    whileHover={
                                                        !isRefreshing
                                                            ? {
                                                                  rotate: 180,
                                                                  transition: {
                                                                      duration: 0.3,
                                                                      ease: 'easeInOut',
                                                                  },
                                                              }
                                                            : {}
                                                    }
                                                >
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                </motion.div>
                                                更新
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            </div>
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
                                        <Button
                                            onClick={() => mutate()}
                                            variant="outline"
                                            disabled={isRefreshing || isValidating}
                                        >
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
                                        <Button
                                            onClick={() => mutate()}
                                            variant="outline"
                                            disabled={isRefreshing || isValidating}
                                        >
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
