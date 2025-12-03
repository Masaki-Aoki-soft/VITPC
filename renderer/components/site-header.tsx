/* ナビゲーションバーのコンポーネント */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '../components/ui/switch';
import { useTheme } from 'next-themes';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { LogOut, Monitor, Settings, Loader2, Sun, Moon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import toast from 'react-hot-toast';
import { UserResource } from '@clerk/types';

interface NavbarProps {
    isUpdating?: boolean;
}

export const Navbar = ({ isUpdating = false }: NavbarProps) => {
    const router = useRouter();
    const { isLoaded: authLoaded, isSignedIn } = useAuth();
    const { signOut } = useClerk();
    const { theme, setTheme } = useTheme();
    const { user, isLoaded: userLoaded } = useUser();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // デバッグ用：認証状態をログに出力
    useEffect(() => {
        console.log('Navbar Debug:', {
            authLoaded,
            userLoaded,
            isSignedIn,
            hasUser: !!user,
            userId: user?.id,
            userEmail: user?.emailAddresses?.[0]?.emailAddress,
        });
    }, [authLoaded, userLoaded, isSignedIn, user]);

    const getUserInitials = (user: UserResource): string => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        if (user?.firstName) {
            return user.firstName[0].toUpperCase();
        }
        if (user?.fullName) {
            const names = user.fullName.split(' ');
            if (names.length >= 2) {
                return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
            }
            return names[0][0].toUpperCase();
        }
        if (user?.emailAddresses?.[0]?.emailAddress) {
            return user.emailAddresses[0].emailAddress[0].toUpperCase();
        }
        return 'U';
    };

    const getUserDisplayName = (user: UserResource): string => {
        if (user?.fullName) {
            return user.fullName;
        }
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        if (user?.firstName) {
            return user.firstName;
        }
        if (user?.emailAddresses?.[0]?.emailAddress) {
            return user.emailAddresses[0].emailAddress;
        }
        return 'ユーザー';
    };

    // ログアウトの処理
    const handleLogout = async () => {
        if (isSigningOut || !authLoaded || isUpdating) return;

        setIsSigningOut(true);

        await toast.promise(
            new Promise<string>(async (resolve, reject) => {
                try {
                    await signOut({ redirectUrl: '/login' });
                    resolve('ログアウトしました');
                } catch (error) {
                    console.error('Sign out error:', error);
                    reject('ログアウトに失敗しました');
                } finally {
                    setIsSigningOut(false);
                }
            }),
            {
                loading: 'ログアウト中...',
                success: (message: string) => message,
                error: (message: string) => message,
            }
        );
    };

    // ローディング中の場合は、ローディング状態のヘッダーを表示
    if (!authLoaded || (isSignedIn && !userLoaded)) {
        return (
            <nav className="w-full">
                <header className="w-full bg-white dark:bg-gray-900 shadow sticky top-0 z-50">
                    <div className="w-full">
                        <div className="flex justify-between items-center py-2 sm:py-3 lg:py-4">
                            <div className="flex items-center min-w-0 flex-1 pl-4 sm:pl-6 lg:pl-8">
                                <Monitor className="h-5 w-5 sm:h-7 sm:w-7 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                                <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                                    VITPC
                                </h1>
                            </div>
                            <div className="flex items-center pr-4 sm:pr-6 lg:pr-8">
                                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full h-7 w-7 sm:h-9 sm:w-9"></div>
                                <div className="ml-3 h-6 w-10 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </header>
            </nav>
        );
    }

    // ユーザーがログインしていない場合は、基本的なヘッダーのみ表示
    if (!isSignedIn || !user) {
        return (
            <nav className="w-full">
                <header className="w-full bg-white dark:bg-gray-900 shadow sticky top-0 z-50">
                    <div className="w-full">
                        <div className="flex justify-between items-center py-2 sm:py-3 lg:py-4">
                            <div className="flex items-center min-w-0 flex-1 pl-4 sm:pl-6 lg:pl-8">
                                <Monitor className="h-5 w-5 sm:h-7 sm:w-7 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                                <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                                    VITPC
                                </h1>
                            </div>
                        </div>
                    </div>
                </header>
            </nav>
        );
    }

    // テーマがダークモードかどうかを判定
    const isDarkMode = theme === 'dark';
    const [isTransitioning, setIsTransitioning] = useState(false);

    // スイッチの状態が変更されたときにテーマを切り替える関数
    const handleThemeChange = (checked: boolean) => {
        setIsTransitioning(true);
        setTheme(checked ? 'dark' : 'light');
        // アニメーション完了後に状態をリセット
        setTimeout(() => {
            setIsTransitioning(false);
        }, 500);
    };

    return (
        <nav className="w-full">
            <AnimatePresence mode="wait">
                <motion.header
                    key={theme}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="w-full bg-white dark:bg-gray-900 shadow sticky top-0 z-50"
                >
                    <div className="w-full">
                        <div className="flex justify-between items-center py-2 sm:py-3 lg:py-4">
                        <div
                            className={`flex items-center min-w-0 flex-1 pl-4 sm:pl-6 lg:pl-8 ${
                                isUpdating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                            }`}
                            onClick={() => {
                                if (!isUpdating) {
                                    router.push('/');
                                }
                            }}
                        >
                            <Monitor className="h-5 w-5 sm:h-7 sm:w-7 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                            <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                                VITPC
                            </h1>
                        </div>

                        <div className="flex items-center pr-4 sm:pr-6 lg:pr-8">
                            {mounted ? (
                                <div className="flex items-center space-x-2 mr-7">
                                    <Sun className="h-5 w-5" />
                                    <Switch
                                        checked={isDarkMode}
                                        onCheckedChange={handleThemeChange}
                                        disabled={isUpdating}
                                    />
                                    <Moon className="h-5 w-5" />
                                </div>
                            ) : (
                                <div className="h-6 w-[92px] bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-auto p-0 hover:bg-transparent"
                                        disabled={isSigningOut || !authLoaded || isUpdating}
                                    >
                                        <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                                            <Avatar className="h-7 w-7 sm:h-9 sm:w-9">
                                                <AvatarImage
                                                    src={user?.imageUrl || ''}
                                                    alt={getUserDisplayName(user)}
                                                />
                                                <AvatarFallback className="bg-blue-600 text-white text-xs sm:text-sm">
                                                    {getUserInitials(user)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="hidden sm:block">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] lg:max-w-[200px] truncate">
                                                    {getUserDisplayName(user)}
                                                </span>
                                            </div>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-72 sm:w-80 lg:w-96 max-w-[90vw]"
                                    align="end"
                                    forceMount
                                    sideOffset={8}
                                >
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex gap-3 items-center">
                                            <Avatar className="h-9 w-9 flex-shrink-0">
                                                <AvatarImage
                                                    src={user?.imageUrl || ''}
                                                    alt={getUserDisplayName(user)}
                                                />
                                                <AvatarFallback className="bg-blue-600 text-white">
                                                    {getUserInitials(user)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col space-y-1 min-w-0 flex-1">
                                                <p className="text-sm font-medium leading-none truncate">
                                                    {getUserDisplayName(user)}
                                                </p>
                                                <p className="text-xs leading-none text-muted-foreground truncate">
                                                    {user?.emailAddresses?.[0]?.emailAddress}
                                                </p>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className={`cursor-pointer text-blue-500 hover:!bg-blue-100 focus:!text-blue-600 focus:!bg-blue-100 dark:text-blue-400 dark:hover:!bg-gray-700 dark:focus:!bg-gray-700 py-2 ${
                                            isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        onClick={() => {
                                            if (!isUpdating) {
                                                router.push('/setting');
                                            }
                                        }}
                                        disabled={isSigningOut || !authLoaded || isUpdating}
                                    >
                                        <Settings className="mr-3 h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                        <span className="text-sm">設定</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className={`text-red-600 hover:!bg-red-100 focus:!text-red-600 cursor-pointer focus:!bg-red-100 dark:text-red-400 dark:hover:!bg-red-900/50 dark:focus:!bg-red-900/50 py-2 ${
                                            isSigningOut || !authLoaded || isUpdating
                                                ? 'opacity-50 cursor-not-allowed'
                                                : ''
                                        }`}
                                        onClick={handleLogout}
                                        disabled={isSigningOut || !authLoaded || isUpdating}
                                    >
                                        {isSigningOut ? (
                                            <Loader2 className="mr-3 h-4 w-4 animate-spin flex-shrink-0" />
                                        ) : (
                                            <LogOut className="mr-3 h-4 w-4 focus:!text-red-600 flex-shrink-0" />
                                        )}
                                        <span className="text-sm">
                                            {isSigningOut ? 'ログアウト中...' : 'ログアウト'}
                                        </span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        </div>
                    </div>
                </motion.header>
            </AnimatePresence>
        </nav>
    );
};
