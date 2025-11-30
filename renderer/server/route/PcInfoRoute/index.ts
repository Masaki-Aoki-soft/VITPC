/* 統合用API */

import { Hono } from 'hono';
import { getInfo } from './getInfo';
import { sendInfo } from './sendInfo';

export const pcInfoRoute = new Hono().route('/', getInfo).route('/', sendInfo);
