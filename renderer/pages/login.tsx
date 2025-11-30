/* ログインページ */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from 'react';

import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useSignIn, useAuth } from '@clerk/nextjs';
import { OAuthStrategy } from '@clerk/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Loader2, Slack, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginFormSchema, LoginFormValues } from '@/lib/validation';
import { FcGoogle } from 'react-icons/fc';

const LoginPage: NextPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
    const { isSignedIn } = useAuth();
    const router = useRouter();

    // zod&handler設定
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        setValue,
        watch,
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const emailValue = watch('email');

    // 既にログイン済みの場合はリダイレクト
    useEffect(() => {
        if (isSignedIn) {
            // redirect_urlパラメータがある場合はそこにリダイレクト、なければdashboardへ
            const redirectUrl = router.query.redirect_url as string;
            if (redirectUrl) {
                router.push(redirectUrl);
            } else {
                router.push('/index');
            }
        }
    }, [isSignedIn, router]);

    // メールアドレスとパスワードでのログインのメソッド
    const handleEmailLogin: SubmitHandler<LoginFormValues> = async (data) => {
        if (!signInLoaded || !signIn) return;

        setIsLoading(true);

        await toast.promise(
            new Promise<string>(async (reject) => {
                try {
                    const result = await signIn.create({
                        identifier: data.email,
                        password: data.password,
                    });

                    if (result.status === 'complete') {
                        await setActive({ session: result.createdSessionId });
                        // redirect_urlパラメータがある場合はそこにリダイレクト、なければdashboardへ
                        const redirectUrl = router.query.redirect_url as string;
                        if (redirectUrl) {
                            router.push(redirectUrl);
                        } else {
                            router.push('/index');
                        }
                    } else {
                        // 追加の認証が必要な場合（2FA等）
                        console.log('Additional authentication required:', result);
                        reject('追加の認証が必要です。');
                    }
                } catch (error: any) {
                    if (error.errors && error.errors.length > 0) {
                        reject('再度ログインしてください。');
                    } else {
                        reject('再度ログインしてください。');
                    }
                } finally {
                    setIsLoading(false);
                }
            }),
            {
                loading: 'ログイン中...',
                success: (message: string) => message,
                error: (message: string) => message,
            }
        );
    };

    // ソーシャルメディアを使用したログインのメソッド
    const handleSocialLogin = async (provider: OAuthStrategy) => {
        if (!signInLoaded || !signIn) return;

        setIsLoading(true);

        // Electronアプリ用：完全なURLを構築
        const getRedirectUrl = () => {
            if (typeof window === 'undefined') return '/sso-callback';
            const origin = window.location.origin;
            return `${origin}/sso-callback`;
        };

        await toast.promise(
            new Promise<string>(async (reject) => {
                try {
                    await signIn.authenticateWithRedirect({
                        strategy: provider,
                        redirectUrl: getRedirectUrl(), // 完全なURLを指定
                        redirectUrlComplete: '/index', // 認証完了後のリダイレクト先
                    });
                } catch (err: any) {
                    console.error('Social login error:', err);
                    // ソーシャルログインのエラーも同様に処理
                    if (err.errors && err.errors.length > 0) {
                        reject(err.errors[0].longMessage || '再度ログインしてください。');
                    } else {
                        reject('再度ログインしてください。');
                    }
                    setIsLoading(false);
                }
            }),
            {
                loading: 'ログイン中...',
                success: (message: string) => message,
                error: (message: string) => message,
            }
        );
    };

    if (!signInLoaded) {
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
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">ログイン</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit(handleEmailLogin)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    autoFocus
                                    placeholder="your@email.com"
                                    {...register('email')}
                                    disabled={isLoading}
                                    className={errors.email ? 'border-red-500 pr-10' : 'pr-10'}
                                />
                                {emailValue && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={isLoading}
                                        size="icon"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer"
                                        onClick={() => setValue('email', '')}
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </Button>
                                )}
                            </div>
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                        {/* 修正されたパスワード入力欄の構造 */}
                        <div className="space-y-2">
                            <Label htmlFor="password">パスワード</Label>
                            <div className="relative">
                                {' '}
                                {/* <- このrelative親要素が重要 */}
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
                                    className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer"
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

                        <div className="text-right">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-blue-600 hover:text-blue-500"
                            >
                                パスワードを忘れた方
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full cursor-pointer"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ログイン中...
                                </>
                            ) : (
                                'ログイン'
                            )}
                        </Button>
                    </form>

                    <Separator />

                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full cursor-pointer"
                            onClick={() => handleSocialLogin('oauth_google')}
                            disabled={isLoading}
                        >
                            <FcGoogle className="mr-2 h-4 w-4" />
                            Googleでログイン
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full cursor-pointer"
                            onClick={() => handleSocialLogin('oauth_slack')}
                            disabled={isLoading}
                        >
                            <Slack className="mr-2 h-4 w-4" />
                            Slackでログイン
                        </Button>
                    </div>

                    <Separator />

                    <div className="text-center text-sm">
                        <span className="text-gray-600">アカウントをお持ちでない方は </span>
                        <Link
                            href="/sign-up"
                            className="text-blue-600 hover:text-blue-500 font-medium cursor-pointer"
                        >
                            新規登録
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;
