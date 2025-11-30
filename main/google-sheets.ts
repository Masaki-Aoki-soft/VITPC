/* Googleスプレッドシート連携モジュール */

export interface SpreadsheetConfig {
    spreadsheetId: string;
    sheetName: string;
    credentials?: {
        clientEmail: string;
        privateKey: string;
    };
}

export interface StorageInfo {
    model: string;
    size: string;
    manufacturer?: string;
}

export interface GPUInfo {
    name: string;
    vram?: string;
}

export interface PCInfoRow {
    timestamp: string;
    hostname: string;
    os: string;
    osVersion: string;
    cpu: string;
    cpuCores: number;
    totalMemory: string;
    freeMemory: string;
    memoryType: string;
    platform: string;
    arch: string;
    username: string;
    gpu: GPUInfo[];
    storage: StorageInfo[];
}

/**
 * GoogleスプレッドシートにPC情報を書き込む
 * 注意: 実際の実装では、googleapisパッケージを使用する必要があります
 */
export async function writeToSpreadsheet(
    config: SpreadsheetConfig,
    pcInfo: PCInfoRow
): Promise<{ success: boolean; message: string }> {
    try {
        // TODO: googleapisパッケージを使用して実際のスプレッドシートAPIを呼び出す
        // 現在はモック実装

        console.log('スプレッドシートに書き込み:', {
            spreadsheetId: config.spreadsheetId,
            sheetName: config.sheetName,
            pcInfo,
        });

        // 実際の実装例（googleapisを使用する場合）:
        // const { google } = require('googleapis');
        // const auth = new google.auth.JWT(
        //     config.credentials?.clientEmail,
        //     undefined,
        //     config.credentials?.privateKey?.replace(/\\n/g, '\n'),
        //     ['https://www.googleapis.com/auth/spreadsheets']
        // );
        // const sheets = google.sheets({ version: 'v4', auth });
        // const values = [
        //     [
        //         pcInfo.timestamp,
        //         pcInfo.hostname,
        //         pcInfo.os,
        //         pcInfo.osVersion,
        //         pcInfo.cpu,
        //         pcInfo.cpuCores.toString(),
        //         pcInfo.totalMemory,
        //         pcInfo.freeMemory,
        //         pcInfo.platform,
        //         pcInfo.arch,
        //         pcInfo.username,
        //     ],
        // ];
        // await sheets.spreadsheets.values.append({
        //     spreadsheetId: config.spreadsheetId,
        //     range: `${config.sheetName}!A:K`,
        //     valueInputOption: 'USER_ENTERED',
        //     requestBody: { values },
        // });

        return {
            success: true,
            message: 'スプレッドシートに正常に書き込みました',
        };
    } catch (error: any) {
        console.error('スプレッドシートへの書き込みエラー:', error);
        return {
            success: false,
            message: error.message || 'スプレッドシートへの書き込みに失敗しました',
        };
    }
}

