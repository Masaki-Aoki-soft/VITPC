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
import { Loader2, RefreshCw, Download } from 'lucide-react';
import { usePCInfo } from '@/hooks/usePCInfo';
import { savePCInfo, fetchAllPCInfo } from '@/lib/fetcher';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const Dashboard: NextPage = () => {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();
    const { pcInfo, isLoading, error, mutate, isValidating } = usePCInfo();
    const [isDownloading, setIsDownloading] = React.useState(false);

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

    // XLSX形式でダウンロードする関数
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            // データベースから全ユーザーのPC情報を取得
            const allPCInfo = await fetchAllPCInfo(true);

            if (allPCInfo.length === 0) {
                toast.error('ダウンロードするデータがありません');
                return;
            }

            // データをExcel形式に変換
            const worksheetData = allPCInfo.map((info) => {
                // GPU情報を文字列に変換
                const gpuString = Array.isArray(info.gpu)
                    ? info.gpu
                          .map((g: any) => `${g.name}${g.vram ? ` (${g.vram})` : ''}`)
                          .join(', ')
                    : '';

                // ストレージ情報を文字列に変換
                const storageString = Array.isArray(info.storage)
                    ? info.storage
                          .map(
                              (s: any) =>
                                  `${s.model}${s.manufacturer ? ` (${s.manufacturer})` : ''} - ${
                                      s.size
                                  }`
                          )
                          .join(', ')
                    : '';

                return {
                    氏名: info.fullName || '',
                    ホスト名: info.hostname || '',
                    OS: info.os || '',
                    OSバージョン: info.osVersion || '',
                    CPU: info.cpu || '',
                    CPUコア数: info.cpuCores || 0,
                    総メモリ: info.totalMemory || '',
                    空きメモリ: info.freeMemory || '',
                    メモリ種類: info.memoryType || '',
                    プラットフォーム: info.platform || '',
                    アーキテクチャ: info.arch || '',
                    ユーザー名: info.username || '',
                    GPU: gpuString,
                    ストレージ: storageString,
                    更新日時: info.updatedAt
                        ? new Date(info.updatedAt).toLocaleString('ja-JP')
                        : '',
                };
            });

            // ワークシートを作成
            const worksheet = XLSX.utils.json_to_sheet(worksheetData);

            // 列幅を自動調整
            const columnWidths = [
                { wch: 20 }, // 氏名
                { wch: 20 }, // ホスト名
                { wch: 15 }, // OS
                { wch: 20 }, // OSバージョン
                { wch: 30 }, // CPU
                { wch: 12 }, // CPUコア数
                { wch: 15 }, // 総メモリ
                { wch: 15 }, // 空きメモリ
                { wch: 12 }, // メモリ種類
                { wch: 15 }, // プラットフォーム
                { wch: 15 }, // アーキテクチャ
                { wch: 20 }, // ユーザー名
                { wch: 40 }, // GPU
                { wch: 50 }, // ストレージ
                { wch: 20 }, // 更新日時
            ];
            worksheet['!cols'] = columnWidths;

            // ワークブックを作成
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'PC情報');

            // ファイル名を生成（現在の日時を含む）
            const fileName = `PC情報_${new Date().toISOString().split('T')[0]}.xlsx`;

            // ファイルをダウンロード
            XLSX.writeFile(workbook, fileName);

            toast.success(`${allPCInfo.length}件のデータをダウンロードしました`);
        } catch (error: any) {
            console.error('ダウンロードエラー:', error);
            toast.error(error.message || 'ダウンロードに失敗しました');
        } finally {
            setIsDownloading(false);
        }
    };

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
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                    variant="outline"
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ダウンロード中...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="mr-2 h-4 w-4" />
                                            ダウンロード
                                        </>
                                    )}
                                </Button>
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
