/* メインAPI */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { pcInfoRoute } from './route/PcInfoRoute';

const app = new Hono();

// ミドルウェア
app.use('*', logger());
app.use(
    '*',
    cors({
        origin: '*',
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
    })
);

// ルートの登録
app.route('/api/pc-info', pcInfoRoute);

export type AppType = typeof app;
export default app;
