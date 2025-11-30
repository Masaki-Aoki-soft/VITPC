/* Dashboardページ */

import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useAuth } from '@clerk/nextjs';
import { buttonVariants } from '@/components/ui/button';
import { Navbar } from '@/components/site-header';
import { SlackIconSVG } from '@/components/SlackIcon';

const Dashboard: NextPage = () => {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();

    // 認証チェック
    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            router.push('/login');
        }
    }, [isSignedIn, isLoaded, router]);

    // ローディング中または未ログインの場合は何も表示しない
    if (!isLoaded || !isSignedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    <span>読み込み中...</span>
                </div>
            </div>
        );
    }

    return (
        <React.Fragment>
            <Head>
                <title>Home - Nextron (With Shadcn/UI)</title>
            </Head>

            <div className="relative flex min-h-screen flex-col bg-background">
                <div className="w-full h-screen flex flex-col items-center justify-center">
                    <Navbar />
                    <div className="flex-1 flex flex-col justify-center items-center w-full space-y-8">
                        <div>
                            <SlackIconSVG />
                        </div>

                        <div className="text-center text-2xl font-bold flex flex-wrap justify-center gap-6">
                            <a
                                href="https://www.electronjs.org/"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#9feaf9]"
                            >
                                ⚡ Electron ⚡
                            </a>

                            <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
                                Next.JS
                            </a>

                            <a
                                href="https://tailwindcss.com/"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#38BDF8]"
                            >
                                Tailwind CSS
                            </a>

                            <a href="https://ui.shadcn.com/" target="_blank" rel="noreferrer">
                                Shadcn/UI
                            </a>

                            <a
                                href="https://www.typescriptlang.org/"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#3178c6]"
                            >
                                Typescript
                            </a>
                        </div>

                        <div className="w-full flex-wrap flex justify-center">
                            <Link href="/about" className={buttonVariants()}>
                                Go To About Page
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default Dashboard;
