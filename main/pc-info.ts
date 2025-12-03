/* PC情報取得モジュール - systeminformationライブラリを使用 */

import * as si from 'systeminformation';
import os from 'os';

export interface StorageInfo {
    model: string;
    size: string;
    manufacturer?: string;
}

export interface GPUInfo {
    name: string;
    vram?: string; // VRAM容量（GB）
}

export interface PCInfo {
    hostname: string;
    os: string;
    osVersion: string;
    cpu: string;
    cpuCores: number;
    totalMemory: string;
    freeMemory: string;
    memoryType: string; // DDR4, DDR5, etc.
    platform: string;
    arch: string;
    username: string;
    gpu: GPUInfo[];
    storage: StorageInfo[];
    timestamp: string;
}

/**
 * メモリサイズを読みやすい形式に変換
 */
function formatBytes(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
}

/**
 * メモリの種類（DDR4/DDR5）を取得
 */
async function getMemoryType(): Promise<string> {
    try {
        const memLayout = await si.memLayout();
        
        if (memLayout && memLayout.length > 0) {
            // 最初のメモリモジュールの情報を使用
            const firstMem = memLayout[0];
            
            // typeフィールドからDDR情報を取得
            if (firstMem.type) {
                const type = firstMem.type.toUpperCase();
                if (type.includes('DDR5')) {
                    return 'DDR5';
                } else if (type.includes('DDR4')) {
                    return 'DDR4';
                } else if (type.includes('DDR3')) {
                    return 'DDR3';
                } else if (type.includes('DDR2')) {
                    return 'DDR2';
                }
            }
            
            // speedから推測（DDR5は通常4800MHz以上）
            if (firstMem.clockSpeed) {
                const speed = firstMem.clockSpeed;
                if (speed >= 4800) {
                    return 'DDR5';
                } else if (speed >= 2133) {
                    return 'DDR4';
                } else if (speed >= 800) {
                    return 'DDR3';
                } else {
                    return 'DDR2';
                }
            }
        }
    } catch (error) {
        console.error('メモリ種類の取得に失敗:', error);
    }

    return 'Unknown';
}

/**
 * ストレージ情報を取得
 */
async function getStorageInfo(): Promise<StorageInfo[]> {
    const storageList: StorageInfo[] = [];

    try {
        const diskLayout = await si.diskLayout();
        
        for (const disk of diskLayout) {
            if (disk.type === 'HD' || disk.type === 'SSD' || disk.type === 'NVMe') {
                const sizeBytes = disk.size || 0;
                const sizeGB = sizeBytes / (1024 * 1024 * 1024);
                
                storageList.push({
                    model: disk.name || disk.model || 'Unknown',
                    size: `${sizeGB.toFixed(2)} GB`,
                    manufacturer: disk.vendor || disk.manufacturer || undefined,
                });
            }
        }
    } catch (error) {
        console.error('ストレージ情報の取得に失敗:', error);
    }

    // ストレージ情報が取得できなかった場合
    if (storageList.length === 0) {
        storageList.push({
            model: 'Unknown',
            size: 'Unknown',
        });
    }

    return storageList;
}

/**
 * バイト数をGBに変換
 */
function formatVRAM(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
}

/**
 * GPU情報を取得
 */
async function getGPUInfo(): Promise<GPUInfo[]> {
    const gpus: GPUInfo[] = [];

    try {
        const graphics = await si.graphics();
        
        if (graphics && graphics.controllers) {
            for (const controller of graphics.controllers) {
                if (controller.model && controller.model !== 'Unknown') {
                    const gpu: GPUInfo = {
                        name: controller.model,
                    };
                    
                    // VRAM情報がある場合
                    if (controller.vram) {
                        gpu.vram = formatVRAM(controller.vram * 1024 * 1024); // MB to bytes
                    } else if (controller.vramDynamic) {
                        gpu.vram = formatVRAM(controller.vramDynamic * 1024 * 1024);
                    }
                    
                    gpus.push(gpu);
                }
            }
        }
    } catch (error) {
        console.error('GPU情報の取得に失敗:', error);
    }

    // GPU情報が取得できなかった場合
    if (gpus.length === 0) {
        gpus.push({ name: 'Unknown GPU' });
    }

    return gpus;
}

/**
 * PC情報を取得
 */
export async function getPCInfo(): Promise<PCInfo> {
    try {
        console.log('[PC Info] systeminformationを使用してPC情報を取得開始...');
        
        // 並列で情報を取得（パフォーマンス向上）
        const [
            systemInfo,
            osInfo,
            cpuInfo,
            memInfo,
            userInfo,
        ] = await Promise.all([
            si.system().catch(err => {
                console.error('[PC Info] system() エラー:', err);
                return { hostname: null };
            }),
            si.osInfo().catch(err => {
                console.error('[PC Info] osInfo() エラー:', err);
                return { distro: null, platform: null, release: null, arch: null };
            }),
            si.cpu().catch(err => {
                console.error('[PC Info] cpu() エラー:', err);
                return { manufacturer: null, brand: null, model: null, cores: null, physicalCores: null };
            }),
            si.mem().catch(err => {
                console.error('[PC Info] mem() エラー:', err);
                return { total: 0, free: 0 };
            }),
            si.users().catch(err => {
                console.error('[PC Info] users() エラー:', err);
                return [];
            }),
        ]);
        
        console.log('[PC Info] 基本情報の取得完了');

        // ホスト名とユーザー名
        const hostname = systemInfo.hostname || os.hostname();
        const username = userInfo && userInfo.length > 0 ? userInfo[0].user : os.userInfo().username;

        // OS情報
        const osName = osInfo.distro || osInfo.platform || 'Unknown';
        const osVersion = osInfo.release || osInfo.kernel || 'Unknown';
        const platform = osInfo.platform || process.platform;
        const arch = osInfo.arch || process.arch;

        // CPU情報
        const cpuName = cpuInfo.manufacturer && cpuInfo.brand
            ? `${cpuInfo.manufacturer} ${cpuInfo.brand}`
            : cpuInfo.brand || cpuInfo.model || 'Unknown CPU';
        const cpuCores = cpuInfo.cores || cpuInfo.physicalCores || 1;

        // メモリ情報
        const totalMemory = memInfo.total || 0;
        const freeMemory = memInfo.free || 0;

        // 並列でGPU、ストレージ、メモリ種類を取得
        console.log('[PC Info] GPU、ストレージ、メモリ情報を取得中...');
        const [gpus, storage, memoryType] = await Promise.all([
            getGPUInfo().catch(err => {
                console.error('[PC Info] getGPUInfo() エラー:', err);
                return [{ name: 'Unknown GPU' }];
            }),
            getStorageInfo().catch(err => {
                console.error('[PC Info] getStorageInfo() エラー:', err);
                return [{ model: 'Unknown', size: 'Unknown' }];
            }),
            getMemoryType().catch(err => {
                console.error('[PC Info] getMemoryType() エラー:', err);
                return 'Unknown';
            }),
        ]);
        
        console.log('[PC Info] すべての情報の取得完了');

        return {
            hostname,
            os: osName,
            osVersion,
            cpu: cpuName,
            cpuCores,
            totalMemory: formatBytes(totalMemory),
            freeMemory: formatBytes(freeMemory),
            memoryType,
            platform,
            arch,
            username,
            gpu: gpus,
            storage,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('PC情報の取得に失敗:', error);
        
        // エラー時のフォールバック
        return {
            hostname: os.hostname(),
            os: process.platform,
            osVersion: os.release(),
            cpu: 'Unknown CPU',
            cpuCores: os.cpus().length,
            totalMemory: formatBytes(os.totalmem()),
            freeMemory: formatBytes(os.freemem()),
            memoryType: 'Unknown',
            platform: process.platform,
            arch: process.arch,
            username: os.userInfo().username,
            gpu: [{ name: 'Unknown GPU' }],
            storage: [{ model: 'Unknown', size: 'Unknown' }],
            timestamp: new Date().toISOString(),
        };
    }
}
