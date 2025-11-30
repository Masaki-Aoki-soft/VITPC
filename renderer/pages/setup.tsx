/* セットアップウィザードページ */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { SpreadsheetConfigDialog, SpreadsheetConfig } from '@/components/spreadsheet-config-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SetupPage: NextPage = () => {
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const [setupCompleted, setSetupCompleted] = useState(false);

    // セットアップ状態を確認
    useEffect(() => {
        const checkSetupStatus = async () => {
            try {
                // window.ipcが利用可能か確認
                if (typeof window !== 'undefined' && window.ipc) {
                    const result = await window.ipc.invoke('get-setup-status') as { completed: boolean };
                    if (result && result.completed) {
                        // 既にセットアップが完了している場合はログインページへ
                        router.push('/login');
                    }
                }
            } catch (error) {
                console.error('セットアップ状態の確認に失敗:', error);
                // エラーが発生した場合はセットアップを続行
            }
        };
        checkSetupStatus();
    }, [router]);

    const handleSaveConfig = async (config: SpreadsheetConfig) => {
        try {
            // 設定を保存（必要に応じてelectron-storeに保存）
            // ここでは設定の検証のみ行う
            if (!config.spreadsheetId) {
                toast.error('スプレッドシートIDを入力してください');
                throw new Error('スプレッドシートIDが必要です');
            }

            // 設定を保存する処理（必要に応じて実装）
            console.log('セットアップ設定を保存:', config);

            // セットアップ完了フラグを設定
            setIsCompleting(true);
            
            // window.ipcが利用可能か確認
            if (typeof window !== 'undefined' && window.ipc) {
                const result = await window.ipc.invoke('complete-setup') as { success: boolean };
                
                if (result && result.success) {
                    setSetupCompleted(true);
                    setIsDialogOpen(false);
                    toast.success('セットアップが完了しました');
                    
                    // 少し待ってからログインページへリダイレクト
                    setTimeout(() => {
                        router.push('/login');
                    }, 1500);
                } else {
                    toast.error('セットアップの完了に失敗しました');
                    throw new Error('セットアップの完了に失敗しました');
                }
            } else {
                // IPCが利用できない場合（開発環境など）は、ローカルストレージに保存
                localStorage.setItem('setupCompleted', 'true');
                setSetupCompleted(true);
                setIsDialogOpen(false);
                toast.success('セットアップが完了しました');
                setTimeout(() => {
                    router.push('/login');
                }, 1500);
            }
        } catch (error: any) {
            console.error('セットアップの保存に失敗:', error);
            toast.error(error.message || 'セットアップの保存に失敗しました');
            setIsCompleting(false);
            // エラーが発生した場合はダイアログを開いたままにする
            throw error;
        }
    };

    return (
        <React.Fragment>
            <Head>
                <title>セットアップ - VITPC</title>
            </Head>

            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl">VITPC セットアップウィザード</CardTitle>
                        <CardDescription>
                            初回起動時のセットアップを行います。Googleスプレッドシートの設定を行ってください。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {setupCompleted ? (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                                <p className="text-lg font-semibold">セットアップが完了しました</p>
                                <p className="text-muted-foreground">ログインページにリダイレクトします...</p>
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    このアプリでは、PC情報をGoogleスプレッドシートに保存することができます。
                                    セットアップダイアログで必要な情報を入力してください。
                                </p>
                                {isCompleting && (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                        <span>セットアップ中...</span>
                                    </div>
                                )}
                                <div className="flex justify-end pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={async () => {
                                            try {
                                                setIsCompleting(true);
                                                
                                                // window.ipcが利用可能か確認
                                                if (typeof window !== 'undefined' && window.ipc) {
                                                    const result = await window.ipc.invoke('complete-setup') as { success: boolean };
                                                    if (result && result.success) {
                                                        setSetupCompleted(true);
                                                        setIsDialogOpen(false);
                                                        toast.success('セットアップをスキップしました');
                                                        setTimeout(() => {
                                                            router.push('/login');
                                                        }, 1000);
                                                    }
                                                } else {
                                                    // IPCが利用できない場合はローカルストレージに保存
                                                    localStorage.setItem('setupCompleted', 'true');
                                                    setSetupCompleted(true);
                                                    setIsDialogOpen(false);
                                                    toast.success('セットアップをスキップしました');
                                                    setTimeout(() => {
                                                        router.push('/login');
                                                    }, 1000);
                                                }
                                            } catch (error: any) {
                                                console.error('セットアップのスキップに失敗:', error);
                                                toast.error('セットアップのスキップに失敗しました');
                                            } finally {
                                                setIsCompleting(false);
                                            }
                                        }}
                                        disabled={isCompleting}
                                    >
                                        後で設定する
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <SpreadsheetConfigDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSave={handleSaveConfig}
                />
            </div>
        </React.Fragment>
    );
};

export default SetupPage;

