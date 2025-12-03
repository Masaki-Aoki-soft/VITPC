/* データベーススキーマ定義 */

import { pgTable, text, timestamp, integer, jsonb, varchar } from 'drizzle-orm/pg-core';

export const pcInfoTable = pgTable('pc_info', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    fullName: text('full_name'),
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
    gpu: jsonb('gpu').notNull(), // GPU情報をJSONBとして保存
    storage: jsonb('storage').notNull(), // ストレージ情報をJSONBとして保存
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type PCInfo = typeof pcInfoTable.$inferSelect;
export type NewPCInfo = typeof pcInfoTable.$inferInsert;



