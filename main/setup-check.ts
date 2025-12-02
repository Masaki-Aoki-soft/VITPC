/* セットアップ状態のチェック */

import Store from 'electron-store';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

interface SetupStore {
    isSetupCompleted: boolean;
}

const setupStore = new Store<SetupStore>({ name: 'setup' });

/**
 * セットアップが完了しているかチェック
 */
export function isSetupCompleted(): boolean {
    return setupStore.get('isSetupCompleted', false);
}

/**
 * セットアップ完了フラグを設定
 */
export function setSetupCompleted(completed: boolean = true): void {
    setupStore.set('isSetupCompleted', completed);
    console.log('[Setup] セットアップ完了フラグを設定しました:', completed);
}

/**
 * config.jsonが存在し、必須項目が設定されているかチェック
 */
export function isConfigValid(isProd: boolean): boolean {
    try {
        let configPath: string;

        if (isProd) {
            try {
                configPath = path.join(app.getAppPath(), 'config.json');
            } catch (error) {
                // app.getAppPath()が失敗した場合、実行ファイルと同じディレクトリを試す
                const exePath = app.getPath('exe');
                configPath = path.join(path.dirname(exePath), 'config.json');
            }
        } else {
            configPath = path.join(__dirname, '../config.json');
        }

        console.log('[Setup] config.jsonのパスを確認:', configPath);

        if (!fs.existsSync(configPath)) {
            console.log('[Setup] config.jsonが存在しません');
            return false;
        }

        const configContent = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        // 必須項目をチェック
        const requiredKeys = ['CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'DATABASE_URL'];
        const hasAllRequiredKeys = requiredKeys.every((key) => {
            const hasKey = config[key] && config[key].trim() !== '';
            if (!hasKey) {
                console.log(`[Setup] 必須項目が不足しています: ${key}`);
            }
            return hasKey;
        });

        if (!hasAllRequiredKeys) {
            console.log('[Setup] config.jsonに必須項目が不足しています');
            return false;
        }

        console.log('[Setup] config.jsonは有効です');
        return true;
    } catch (error) {
        console.error('[Setup] config.jsonのチェック中にエラー:', error);
        return false;
    }
}

/**
 * セットアップが必要かどうかを判定
 */
export function needsSetup(isProd: boolean): boolean {
    const setupCompleted = isSetupCompleted();
    const configValid = isConfigValid(isProd);

    // セットアップが完了していない、またはconfig.jsonが無効な場合
    const needs = !setupCompleted || !configValid;

    console.log('[Setup] セットアップ状況:', {
        setupCompleted,
        configValid,
        needsSetup: needs,
    });

    return needs;
}

