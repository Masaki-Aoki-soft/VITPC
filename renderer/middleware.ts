/* ルート保護のミドルウェア */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// パブリックルート（認証不要）の定義
const isPublicRoute = createRouteMatcher([
    '/login(.*)', // ログインページ
    '/sign-up(.*)',
    '/signup(.*)', // 新規登録ページ（signup.tsx）
    '/forgot-password(.*)',
    '/forget-password(.*)', // パスワード再設定ページ（forget-password.tsx）
    '/sso-callback(.*)',
    '/', // ルートページも公開（必要に応じて）
]);

export default clerkMiddleware(async (auth, request) => {
    const { userId } = await auth();
    const { nextUrl } = request;

    // パブリックルートの場合は何もしない
    if (isPublicRoute(request)) {
        return NextResponse.next();
    }

    // 認証が必要なルートで未認証の場合
    if (!userId) {
        // 現在のURLをクエリパラメータとして保持（ログイン後に戻るため）
        // ログインページは / (index.tsx) にあるため、/ にリダイレクト
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect_url', nextUrl.pathname + nextUrl.search);

        return NextResponse.redirect(loginUrl);
    }

    // 認証済みの場合は通常の処理を続行
    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
