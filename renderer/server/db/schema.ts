/* Drizzle ORM スキーマ定義 */

import { pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

// PC情報テーブル（userIdをプライマリーキーとして1つのテーブルに統合）
export const pcInfo = pgTable('pc_info', {
    userId: text('user_id').primaryKey(), // ClerkのuserIdをプライマリーキー
    fullName: text('full_name'), // ClerkのfullName
    hostname: text('hostname').notNull(),
    os: text('os').notNull(),
    osVersion: text('os_version').notNull(),
    cpu: text('cpu').notNull(),
    cpuCores: integer('cpu_cores').notNull(),
    totalMemory: text('total_memory').notNull(),
    freeMemory: text('free_memory').notNull(),
    memoryType: text('memory_type').notNull(),
    platform: text('platform').notNull(),
    arch: text('arch').notNull(),
    username: text('username').notNull(),
    gpu: jsonb('gpu').$type<Array<{ name: string; vram?: string }>>().notNull(), // GPU情報をJSONBで保存
    storage: jsonb('storage')
        .$type<Array<{ model: string; size: string; manufacturer?: string }>>()
        .notNull(), // ストレージ情報をJSONBで保存
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type PCInfo = typeof pcInfo.$inferSelect;
export type NewPCInfo = typeof pcInfo.$inferInsert;
