/* パスワード再設定ページ */

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type React from 'react';
import { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    forgotPasswordSchema,
    ForgotPasswordValues,
    resetPasswordSchema,
    ResetPasswordValues,
} from '@/lib/validation';

const ForgotPasswordPage: NextPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
    const [email, setEmail] = useState('');
    const { signIn, isLoaded } = useSignIn();
    const router = useRouter();

    // メール送信用フォーム
    const emailForm = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    // パスワードリセット用フォーム
    const resetForm = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            code: '',
            password: '',
            confirmPassword: '',
        },
    });

    // パスワードリセット要求の送信
    const handleRequestReset: SubmitHandler<ForgotPasswordValues> = async (data) => {
        if (!isLoaded || !signIn) return;

        setIsLoading(true);

        toast.promise(
            new Promise<string>(async (resolve, reject) => {
                try {
                    const result = await signIn.create({
                        strategy: 'reset_password_email_code',
                        identifier: data.email,
                    });

                    if (result.status === 'needs_first_factor') {
                        setEmail(data.email);
                        setStep('reset');
                        resolve('パスワードリセット用のメールを送信しました。');
                    }
                } catch (err: any) {
                    if (err.errors && err.errors.length > 0) {
                        const errorMessage = err.errors[0].longMessage || err.errors[0].message;
                        if (
                            errorMessage.includes('not found') ||
                            errorMessage.includes('見つかりません')
                        ) {
                            reject('このメールアドレスは登録されていません。');
                        } else {
                            reject(errorMessage);
                        }
                    } else {
                        reject('エラーが発生しました。再度お試しください。');
                    }
                } finally {
                    setIsLoading(false);
                }
            }),
            {
                loading: '送信中...',
                success: (message: string) => message,
                error: (message: string) => message,
            }
        );
    };

    // パスワードのリセット実行
    const handleResetPassword: SubmitHandler<ResetPasswordValues> = async (data) => {
        if (!isLoaded || !signIn) return;

        setIsLoading(true);

        toast.promise(
            new Promise<string>(async (resolve, reject) => {
                try {
                    const result = await signIn.attemptFirstFactor({
                        strategy: 'reset_password_email_code',
                        code: data.code,
                        password: data.password,
                    });

                    if (result.status === 'complete') {
                        setStep('success');
                        resolve('パスワードが正常にリセットされました。');
                    } else {
                        reject('認証に失敗しました。再度お試しください。');
                    }
                } catch (err: any) {
                    if (err.errors && err.errors.length > 0) {
                        const errorMessage = err.errors[0].longMessage || err.errors[0].message;
                        if (
                            errorMessage.includes('invalid') ||
                            errorMessage.includes('incorrect')
                        ) {
                            reject('認証コードが正しくありません。');
                        } else if (errorMessage.includes('expired')) {
                            reject('認証コードの有効期限が切れています。');
                        } else {
                            reject(errorMessage);
                        }
                    } else {
                        reject('エラーが発生しました。再度お試しください。');
                    }
                } finally {
                    setIsLoading(false);
                }
            }),
            {
                loading: '実行中...',
                success: (message: string) => message,
                error: (message: string) => message,
            }
        );
    };

    // メール再送信
    const handleResendEmail = async () => {
        if (!isLoaded || !signIn || !email) return;

        setIsLoading(true);

        toast.promise(
            new Promise<string>(async (resolve, reject) => {
                try {
                    await signIn.create({
                        strategy: 'reset_password_email_code',
                        identifier: email,
                    });
                    resolve('認証メールを再送信しました。');
                } catch (error: any) {
                    reject(`メールの再送信に失敗しました: ${error}`);
                } finally {
                    setIsLoading(false);
                }
            }),
            {
                loading: '送信中...',
                success: (message: string) => message,
                error: (message: string) => message,
            }
        );
    };

    // フィールドクリア関数
    const clearEmailField = () => {
        emailForm.setValue('email', '');
    };

    const clearCodeField = () => {
        resetForm.setValue('code', '');
    };

    const clearPasswordField = () => {
        resetForm.setValue('password', '');
    };

    const clearConfirmPasswordField = () => {
        resetForm.setValue('confirmPassword', '');
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>読み込み中...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <Link href="/login">
                            <Button variant="ghost" size="icon" className="cursor-pointer">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <CardTitle className="text-2xl font-bold">
                            {step === 'request' && 'パスワードを忘れた方'}
                            {step === 'reset' && 'パスワードをリセット'}
                            {step === 'success' && 'リセット完了'}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* ステップ1: メールアドレス入力 */}
                    {step === 'request' && (
                        <>
                            <div className="text-sm text-gray-600 text-center mb-4">
                                登録されたメールアドレスにパスワードリセット用のリンクを送信します。
                            </div>
                            <form
                                onSubmit={emailForm.handleSubmit(handleRequestReset)}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="email">メールアドレス</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                                        <Input
                                            id="email"
                                            type="email"
                                            autoFocus
                                            placeholder="your@email.com"
                                            {...emailForm.register('email')}
                                            disabled={isLoading}
                                            className={`pl-10 pr-10 ${
                                                emailForm.formState.errors.email
                                                    ? 'border-red-500'
                                                    : ''
                                            }`}
                                        />
                                        {emailForm.watch('email') && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 cursor-pointer"
                                                onClick={clearEmailField}
                                                disabled={isLoading}
                                            >
                                                <X className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                                            </Button>
                                        )}
                                    </div>
                                    {emailForm.formState.errors.email && (
                                        <p className="text-sm text-red-500">
                                            {emailForm.formState.errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full cursor-pointer"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            送信中...
                                        </>
                                    ) : (
                                        'リセットメールを送信'
                                    )}
                                </Button>
                            </form>
                        </>
                    )}

                    {/* ステップ2: 認証コードとパスワード入力 */}
                    {step === 'reset' && (
                        <>
                            <div className="text-sm text-gray-600 text-center mb-4">
                                <span className="font-medium">{email}</span>{' '}
                                に認証コードを送信しました。
                                <br />
                                認証コードと新しいパスワードを入力してください。
                            </div>
                            <form
                                onSubmit={resetForm.handleSubmit(handleResetPassword)}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="code">認証コード</Label>
                                    <div className="relative">
                                        <Input
                                            id="code"
                                            type="text"
                                            autoFocus
                                            placeholder="123456"
                                            {...resetForm.register('code')}
                                            disabled={isLoading}
                                            className={`pr-10 ${
                                                resetForm.formState.errors.code
                                                    ? 'border-red-500'
                                                    : ''
                                            }`}
                                        />
                                        {resetForm.watch('code') && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 cursor-pointer"
                                                onClick={clearCodeField}
                                                disabled={isLoading}
                                            >
                                                <X className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                                            </Button>
                                        )}
                                    </div>
                                    {resetForm.formState.errors.code && (
                                        <p className="text-sm text-red-500">
                                            {resetForm.formState.errors.code.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">新しいパスワード</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="新しいパスワードを入力"
                                            {...resetForm.register('password')}
                                            disabled={isLoading}
                                            className={`pr-20 ${
                                                resetForm.formState.errors.password
                                                    ? 'border-red-500'
                                                    : ''
                                            }`}
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                            {resetForm.watch('password') && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 cursor-pointer"
                                                    onClick={clearPasswordField}
                                                    disabled={isLoading}
                                                >
                                                    <X className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={isLoading}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                    <Eye className="w-4 h-4 text-gray-500" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    {resetForm.formState.errors.password && (
                                        <p className="text-sm text-red-500">
                                            {resetForm.formState.errors.password.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="パスワードを再度入力"
                                            {...resetForm.register('confirmPassword')}
                                            disabled={isLoading}
                                            className={`pr-20 ${
                                                resetForm.formState.errors.confirmPassword
                                                    ? 'border-red-500'
                                                    : ''
                                            }`}
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                            {resetForm.watch('confirmPassword') && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 cursor-pointer"
                                                    onClick={clearConfirmPasswordField}
                                                    disabled={isLoading}
                                                >
                                                    <X className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() =>
                                                    setShowConfirmPassword(!showConfirmPassword)
                                                }
                                                disabled={isLoading}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                    <Eye className="w-4 h-4 text-gray-500" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    {resetForm.formState.errors.confirmPassword && (
                                        <p className="text-sm text-red-500">
                                            {resetForm.formState.errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            パスワード更新中...
                                        </>
                                    ) : (
                                        'パスワードを更新'
                                    )}
                                </Button>
                            </form>

                            <div className="text-center">
                                <Button
                                    variant="ghost"
                                    onClick={handleResendEmail}
                                    disabled={isLoading}
                                    className="text-sm"
                                >
                                    認証メールを再送信
                                </Button>
                            </div>
                        </>
                    )}

                    {/* ステップ3: 完了画面 */}
                    {step === 'success' && (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    パスワードがリセットされました
                                </h3>
                                <p className="text-sm text-gray-600">
                                    新しいパスワードでログインできるようになりました。
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push('/login')}
                                className="w-full cursor-pointer"
                            >
                                ログインページへ戻る
                            </Button>
                        </div>
                    )}

                    {/* ログインページへのリンク（完了画面以外） */}
                    {step !== 'success' && (
                        <div className="text-center text-sm">
                            <span className="text-gray-600">ログインページに戻る場合は </span>
                            <Link
                                href="/login"
                                className="text-blue-600 hover:text-blue-500 font-medium"
                            >
                                こちら
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPasswordPage;
