/* 新規登録ページ */

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useSignUp, useAuth } from '@clerk/nextjs';
import { OAuthStrategy } from '@clerk/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Loader2, Slack, X } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpFormSchema, SignUpFormValues } from '@/lib/validation';

const SignUpPage: NextPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const { signUp, setActive, isLoaded: signUpLoaded } = useSignUp();
    const { isSignedIn } = useAuth();
    const router = useRouter();

    // zod&handler設定
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpFormSchema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
        },
    });

    const email = watch('email');

    // 既にログイン済みの場合はリダイレクト
    useEffect(() => {
        if (isSignedIn) {
            router.push('/');
        }
    }, [isSignedIn, router]);

    // メールアドレスとパスワードでの新規登録のメソッド
    const handleEmailSignUp: SubmitHandler<SignUpFormValues> = async (data) => {
        if (!signUpLoaded || !signUp) return;

        setIsLoading(true);

        try {
            const result = await signUp.create({
                emailAddress: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
            });

            // メール認証が必要な場合
            if (result.status === 'missing_requirements') {
                await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                setPendingVerification(true);
                toast.success('確認コードをメールに送信しました。');
            } else if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                // セッションストレージにメール登録成功フラグを設定
                sessionStorage.setItem('emailSignUpSuccess', 'true');
                router.push('/?signup=success');
            }
        } catch (err: any) {
            console.error('Sign up error:', err);
            if (err.errors && err.errors.length > 0) {
                toast.error(err.errors[0].longMessage || '登録に失敗しました。');
            } else {
                toast.error('登録に失敗しました。');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // メール認証コード確認のメソッド
    const handleVerifyEmail = async () => {
        if (!signUpLoaded || !signUp) return;

        setIsLoading(true);

        await toast.promise(
            new Promise<string>(async (resolve, reject) => {
                try {
                    const result = await signUp.attemptEmailAddressVerification({
                        code: verificationCode,
                    });

                    if (result.status === 'complete') {
                        await setActive({ session: result.createdSessionId });
                        // セッションストレージにメール認証成功フラグを設定
                        sessionStorage.setItem('emailVerificationSuccess', 'true');
                        router.push('/?signup=success');
                        resolve('登録が完了しました！');
                    } else {
                        reject('確認に失敗しました。もう一度お試しください。');
                    }
                } catch (err: any) {
                    console.error('Verification error:', err);
                    if (err.errors && err.errors.length > 0) {
                        reject(err.errors[0].longMessage || '確認コードが正しくありません。');
                    } else {
                        reject('確認コードが正しくありません。');
                    }
                } finally {
                    setIsLoading(false);
                }
            }),
            {
                loading: '確認中...',
                success: (message: string) => message,
                error: (message: string) => message,
            }
        );
    };

    // ソーシャルメディアを使用した新規登録のメソッド
    const handleSocialSignUp = async (provider: OAuthStrategy) => {
        if (!signUpLoaded || !signUp) return;

        setIsLoading(true);

        try {
            // ソーシャル登録開始時にセッションストレージに状態を保存
            sessionStorage.setItem('socialSignUpAttempt', 'true');

            await signUp.authenticateWithRedirect({
                strategy: provider,
                redirectUrl: '/sso-callback', // SSO用のコールバックページ
                redirectUrlComplete: '/?signup=success', // 認証完了後のリダイレクト先にクエリパラメータを追加
            });
        } catch (err: any) {
            console.error('Social sign up error:', err);
            // エラー時はセッションストレージをクリア
            sessionStorage.removeItem('socialSignUpAttempt');
            if (err.errors && err.errors.length > 0) {
                toast.error(err.errors[0].longMessage || '登録に失敗しました。');
            } else {
                toast.error('登録に失敗しました。');
            }
            setIsLoading(false);
        }
    };

    const clearField = (field: keyof SignUpFormValues) => {
        setValue(field, '');
    };

    // Clerkがロード中の場合
    if (!signUpLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>読み込み中...</span>
                </div>
            </div>
        );
    }

    // メール認証待ちの画面
    if (pendingVerification) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">メール認証</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600 text-center">
                            確認コードをメールアドレスに送信しました。
                            <br />
                            受信したコードを入力してください。
                        </p>
                        <div className="space-y-2">
                            <Label htmlFor="code">確認コード</Label>
                            <Input
                                id="code"
                                type="text"
                                placeholder="確認コードを入力"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                        <Button
                            onClick={handleVerifyEmail}
                            className="w-full"
                            disabled={isLoading || !verificationCode}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    確認中...
                                </>
                            ) : (
                                '確認する'
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setPendingVerification(false)}
                            className="w-full"
                            disabled={isLoading}
                        >
                            戻る
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">新規登録</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit(handleEmailSignUp)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">名前</Label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    autoFocus
                                    placeholder="太郎"
                                    {...register('firstName')}
                                    disabled={isLoading}
                                    className={errors.firstName ? 'border-red-500' : ''}
                                />
                                {errors.firstName && (
                                    <p className="text-sm text-red-500">
                                        {errors.firstName.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">姓</Label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder="田中"
                                    {...register('lastName')}
                                    disabled={isLoading}
                                    className={errors.lastName ? 'border-red-500' : ''}
                                />
                                {errors.lastName && (
                                    <p className="text-sm text-red-500">
                                        {errors.lastName.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    {...register('email')}
                                    disabled={isLoading}
                                    className={errors.email ? 'border-red-500 pr-10' : 'pr-10'}
                                />
                                {email && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 cursor-pointer"
                                        onClick={() => clearField('email')}
                                        disabled={isLoading}
                                    >
                                        <X className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                                    </Button>
                                )}
                            </div>
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">パスワード</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="パスワードを入力"
                                    {...register('password')}
                                    disabled={isLoading}
                                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={isLoading}
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 cursor-pointer"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-gray-500" />
                                    )}
                                </Button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">パスワード確認</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="パスワードを再入力"
                                    {...register('confirmPassword')}
                                    disabled={isLoading}
                                    className={
                                        errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={isLoading}
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 cursor-pointer"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-gray-500" />
                                    )}
                                </Button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500">
                                    {errors.confirmPassword.message}
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
                                    登録中...
                                </>
                            ) : (
                                'アカウント作成'
                            )}
                        </Button>
                    </form>

                    <Separator />

                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleSocialSignUp('oauth_google')}
                            disabled={isLoading}
                        >
                            <FcGoogle className="mr-2 h-4 w-4" />
                            Googleで登録
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleSocialSignUp('oauth_slack')}
                            disabled={isLoading}
                        >
                            <Slack className="mr-2 h-4 w-4" />
                            Slackで登録
                        </Button>
                    </div>

                    <Separator />

                    <div className="text-center text-sm">
                        <span className="text-gray-600">既にアカウントをお持ちの方は </span>
                        <Link
                            href="/login"
                            className="text-blue-600 hover:text-blue-500 font-medium"
                        >
                            ログイン
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SignUpPage;
