/* PC情報取得モジュール */

import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

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
async function getMemoryType(platform: string): Promise<string> {
    try {
        if (platform === 'win32') {
            // Windowsの場合
            try {
                const { stdout } = await execAsync('wmic memorychip get Speed,MemoryType /format:list');
                const lines = stdout.split('\n');
                let memoryType = '';
                let speed = 0;

                for (const line of lines) {
                    if (line.startsWith('MemoryType=')) {
                        const typeCode = parseInt(line.replace('MemoryType=', '').trim(), 10);
                        // MemoryTypeコード: 24 = DDR3, 26 = DDR4, 34 = DDR5
                        if (typeCode === 26) {
                            memoryType = 'DDR4';
                        } else if (typeCode === 34) {
                            memoryType = 'DDR5';
                        } else if (typeCode === 24) {
                            memoryType = 'DDR3';
                        }
                    } else if (line.startsWith('Speed=')) {
                        const speedValue = parseInt(line.replace('Speed=', '').trim(), 10);
                        if (!isNaN(speedValue) && speedValue > speed) {
                            speed = speedValue;
                        }
                    }
                }

                // MemoryTypeが取得できない場合、速度から推測
                if (!memoryType && speed > 0) {
                    if (speed >= 4800) {
                        memoryType = 'DDR5';
                    } else if (speed >= 2133) {
                        memoryType = 'DDR4';
                    } else {
                        memoryType = 'DDR3';
                    }
                }

                return memoryType || 'Unknown';
            } catch (error) {
                console.error('Windowsメモリ種類の取得に失敗:', error);
            }
        } else if (platform === 'darwin') {
            // macOSの場合
            try {
                const { stdout } = await execAsync('system_profiler SPMemoryDataType');
                const lines = stdout.split('\n');
                for (const line of lines) {
                    // macOSでは直接的なDDR情報が取得しにくいため、速度から推測
                    if (line.includes('Speed:') || line.includes('Type:')) {
                        const speedMatch = line.match(/Speed:\s*(\d+)\s*MHz/);
                        if (speedMatch) {
                            const speed = parseInt(speedMatch[1], 10);
                            if (speed >= 4800) {
                                return 'DDR5';
                            } else if (speed >= 2133) {
                                return 'DDR4';
                            } else {
                                return 'DDR3';
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('macOSメモリ種類の取得に失敗:', error);
            }
        } else {
            // Linuxの場合
            try {
                // dmidecodeを使用してメモリ情報を取得
                const { stdout } = await execAsync(
                    'sudo dmidecode -t memory 2>/dev/null | grep -i "speed\\|type" || dmidecode -t memory 2>/dev/null | grep -i "speed\\|type" || echo ""'
                );
                if (stdout) {
                    const lines = stdout.split('\n');
                    let speed = 0;
                    for (const line of lines) {
                        // DDR4やDDR5の文字列を探す
                        if (line.toLowerCase().includes('ddr5')) {
                            return 'DDR5';
                        } else if (line.toLowerCase().includes('ddr4')) {
                            return 'DDR4';
                        } else if (line.toLowerCase().includes('ddr3')) {
                            return 'DDR3';
                        }
                        // 速度から推測
                        const speedMatch = line.match(/(\d+)\s*MT\/s/);
                        if (speedMatch) {
                            const speedValue = parseInt(speedMatch[1], 10);
                            if (speedValue > speed) {
                                speed = speedValue;
                            }
                        }
                    }
                    // 速度から推測
                    if (speed >= 4800) {
                        return 'DDR5';
                    } else if (speed >= 2133) {
                        return 'DDR4';
                    } else if (speed > 0) {
                        return 'DDR3';
                    }
                }

                // 別の方法: /proc/meminfoやlshwを使用
                try {
                    const { stdout: lshwOut } = await execAsync(
                        'lshw -class memory 2>/dev/null | grep -i "ddr" || echo ""'
                    );
                    if (lshwOut) {
                        if (lshwOut.toLowerCase().includes('ddr5')) {
                            return 'DDR5';
                        } else if (lshwOut.toLowerCase().includes('ddr4')) {
                            return 'DDR4';
                        } else if (lshwOut.toLowerCase().includes('ddr3')) {
                            return 'DDR3';
                        }
                    }
                } catch {
                    // lshwが使えない場合
                }
            } catch (error) {
                console.error('Linuxメモリ種類の取得に失敗:', error);
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
async function getStorageInfo(platform: string): Promise<StorageInfo[]> {
    const storageList: StorageInfo[] = [];

    try {
        if (platform === 'win32') {
            // Windowsの場合
            try {
                const { stdout } = await execAsync(
                    'wmic diskdrive get model,size,manufacturer /format:list'
                );
                const lines = stdout.split('\n');
                let currentStorage: Partial<StorageInfo> = {};

                for (const line of lines) {
                    if (line.startsWith('Model=')) {
                        if (currentStorage.model) {
                            // 前のストレージを保存
                            storageList.push({
                                model: currentStorage.model || 'Unknown',
                                size: currentStorage.size || 'Unknown',
                                manufacturer: currentStorage.manufacturer,
                            });
                        }
                        currentStorage = {
                            model: line.replace('Model=', '').trim(),
                        };
                    } else if (line.startsWith('Size=')) {
                        const sizeBytes = parseInt(line.replace('Size=', '').trim(), 10);
                        if (!isNaN(sizeBytes)) {
                            const sizeGB = sizeBytes / (1024 * 1024 * 1024);
                            currentStorage.size = `${sizeGB.toFixed(2)} GB`;
                        } else {
                            currentStorage.size = 'Unknown';
                        }
                    } else if (line.startsWith('Manufacturer=')) {
                        currentStorage.manufacturer = line.replace('Manufacturer=', '').trim();
                    }
                }

                // 最後のストレージを保存
                if (currentStorage.model) {
                    storageList.push({
                        model: currentStorage.model || 'Unknown',
                        size: currentStorage.size || 'Unknown',
                        manufacturer: currentStorage.manufacturer,
                    });
                }
            } catch (error) {
                console.error('Windowsストレージ情報の取得に失敗:', error);
            }
        } else if (platform === 'darwin') {
            // macOSの場合
            try {
                const { stdout } = await execAsync('system_profiler SPStorageDataType');
                const lines = stdout.split('\n');
                let currentStorage: Partial<StorageInfo> = {};

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.includes('Model:')) {
                        if (currentStorage.model) {
                            // 前のストレージを保存
                            storageList.push({
                                model: currentStorage.model || 'Unknown',
                                size: currentStorage.size || 'Unknown',
                                manufacturer: currentStorage.manufacturer,
                            });
                        }
                        currentStorage = {
                            model: line.replace('Model:', '').trim(),
                        };
                    } else if (line.includes('Capacity:')) {
                        const capacityMatch = line.match(/Capacity:\s*(.+)/);
                        if (capacityMatch && capacityMatch[1]) {
                            currentStorage.size = capacityMatch[1].trim();
                        }
                    } else if (line.includes('Vendor:')) {
                        currentStorage.manufacturer = line.replace('Vendor:', '').trim();
                    }
                }

                // 最後のストレージを保存
                if (currentStorage.model) {
                    storageList.push({
                        model: currentStorage.model || 'Unknown',
                        size: currentStorage.size || 'Unknown',
                        manufacturer: currentStorage.manufacturer,
                    });
                }
            } catch (error) {
                console.error('macOSストレージ情報の取得に失敗:', error);
            }
        } else {
            // Linuxの場合
            try {
                // lsblkを使用してストレージ情報を取得
                const { stdout } = await execAsync(
                    "lsblk -d -o NAME,MODEL,SIZE --json 2>/dev/null || lsblk -d -o NAME,MODEL,SIZE"
                );
                try {
                    const lsblkData = JSON.parse(stdout);
                    if (lsblkData.blockdevices) {
                        for (const device of lsblkData.blockdevices) {
                            if (device.type === 'disk') {
                                let manufacturer = '';

                                try {
                                    // udevadmを使用して詳細情報を取得
                                    const { stdout: udevInfo } = await execAsync(
                                        `udevadm info --query=property --name=/dev/${device.name} 2>/dev/null || echo ""`
                                    );
                                    const udevLines = udevInfo.split('\n');
                                    for (const udevLine of udevLines) {
                                        if (udevLine.startsWith('ID_VENDOR=')) {
                                            manufacturer = udevLine.replace('ID_VENDOR=', '').trim();
                                        }
                                    }
                                } catch {
                                    // udevadmが使えない場合のフォールバック
                                }

                                storageList.push({
                                    model: device.model || device.name || 'Unknown',
                                    size: device.size || 'Unknown',
                                    manufacturer: manufacturer || undefined,
                                });
                            }
                        }
                    }
                } catch {
                    // JSON解析に失敗した場合、テキスト形式で解析
                    const lines = stdout.split('\n');
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line) {
                            const parts = line.split(/\s+/);
                            if (parts.length >= 3) {
                                storageList.push({
                                    model: parts.slice(1, -1).join(' ') || 'Unknown',
                                    size: parts[parts.length - 1] || 'Unknown',
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Linuxストレージ情報の取得に失敗:', error);
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
async function getGPUInfo(platform: string): Promise<GPUInfo[]> {
    const gpus: GPUInfo[] = [];

    try {
        if (platform === 'win32') {
            // Windowsの場合
            try {
                const { stdout } = await execAsync(
                    'wmic path win32_VideoController get name,AdapterRAM /format:list'
                );
                const lines = stdout.split('\n');
                let currentGPU: Partial<GPUInfo> = {};

                for (const line of lines) {
                    if (line.startsWith('Name=') && line.trim() !== 'Name=') {
                        if (currentGPU.name) {
                            // 前のGPUを保存
                            gpus.push({
                                name: currentGPU.name,
                                vram: currentGPU.vram,
                            });
                        }
                        currentGPU = {
                            name: line.replace('Name=', '').trim(),
                        };
                    } else if (line.startsWith('AdapterRAM=')) {
                        const ramValue = line.replace('AdapterRAM=', '').trim();
                        const ramBytes = parseInt(ramValue, 10);
                        // 4294967295は無効な値（-1を符号なしで表現したもの）、0も無効
                        if (!isNaN(ramBytes) && ramBytes > 0 && ramBytes !== 4294967295) {
                            currentGPU.vram = formatVRAM(ramBytes);
                            console.log(`GPU VRAM取得: ${currentGPU.name} - ${ramBytes} bytes (${currentGPU.vram})`);
                        } else {
                            console.log(`GPU VRAM無効値: ${currentGPU.name} - ${ramValue}`);
                        }
                    }
                }

                // 最後のGPUを保存
                if (currentGPU.name) {
                    gpus.push({
                        name: currentGPU.name,
                        vram: currentGPU.vram,
                    });
                }

                // VRAMが取得できなかった場合、dxdiagやPowerShellで再試行
                if (gpus.length > 0 && gpus.every((gpu) => !gpu.vram)) {
                    try {
                        // PowerShellで再試行
                        const { stdout: psStdout } = await execAsync(
                            'powershell -Command "Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM | ConvertTo-Json"'
                        );
                        try {
                            const psData = JSON.parse(psStdout);
                            const psArray = Array.isArray(psData) ? psData : [psData];
                            for (let i = 0; i < psArray.length && i < gpus.length; i++) {
                                const psGPU = psArray[i];
                                if (psGPU.AdapterRAM && psGPU.AdapterRAM > 0 && psGPU.AdapterRAM !== 4294967295) {
                                    gpus[i].vram = formatVRAM(psGPU.AdapterRAM);
                                    console.log(`PowerShellでVRAM取得: ${gpus[i].name} - ${gpus[i].vram}`);
                                }
                            }
                        } catch {
                            // JSON解析失敗
                        }
                    } catch (psError) {
                        console.error('PowerShellでのVRAM取得に失敗:', psError);
                    }
                }

                console.log('取得したGPU情報:', JSON.stringify(gpus, null, 2));
            } catch (error) {
                console.error('Windows GPU情報の取得に失敗:', error);
            }
        } else if (platform === 'darwin') {
            // macOSの場合
            try {
                const { stdout } = await execAsync('system_profiler SPDisplaysDataType');
                const lines = stdout.split('\n');
                let currentGPU: Partial<GPUInfo> = {};

                for (const line of lines) {
                    if (line.includes('Chipset Model:')) {
                        if (currentGPU.name) {
                            // 前のGPUを保存
                            gpus.push({
                                name: currentGPU.name,
                                vram: currentGPU.vram,
                            });
                        }
                        const match = line.match(/Chipset Model:\s*(.+)/);
                        if (match && match[1]) {
                            currentGPU = {
                                name: match[1].trim(),
                            };
                        }
                    } else if (line.includes('VRAM (Total):')) {
                        const match = line.match(/VRAM \(Total\):\s*(\d+)\s*MB/);
                        if (match && match[1]) {
                            const vramMB = parseInt(match[1], 10);
                            currentGPU.vram = formatVRAM(vramMB * 1024 * 1024);
                        }
                    } else if (line.includes('VRAM (Dynamic, Max):')) {
                        const match = line.match(/VRAM \(Dynamic, Max\):\s*(\d+)\s*MB/);
                        if (match && match[1]) {
                            const vramMB = parseInt(match[1], 10);
                            currentGPU.vram = formatVRAM(vramMB * 1024 * 1024);
                        }
                    }
                }

                // 最後のGPUを保存
                if (currentGPU.name) {
                    gpus.push({
                        name: currentGPU.name,
                        vram: currentGPU.vram,
                    });
                }
            } catch (error) {
                console.error('macOS GPU情報の取得に失敗:', error);
            }
        } else {
            // Linuxの場合
            try {
                // NVIDIA GPUの場合
                try {
                    const { stdout } = await execAsync(
                        'nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits'
                    );
                    const lines = stdout.split('\n');
                    for (const line of lines) {
                        const parts = line.split(',').map((p) => p.trim());
                        if (parts.length >= 2 && parts[0]) {
                            const gpuName = parts[0];
                            const memoryMB = parseInt(parts[1], 10);
                            if (!isNaN(memoryMB)) {
                                gpus.push({
                                    name: gpuName,
                                    vram: formatVRAM(memoryMB * 1024 * 1024),
                                });
                            } else {
                                gpus.push({
                                    name: gpuName,
                                });
                            }
                        }
                    }
                } catch {
                    // NVIDIA GPUがない場合、lspciを使用
                    try {
                        const { stdout } = await execAsync('lspci | grep -i vga');
                        const lines = stdout.split('\n');
                        for (const line of lines) {
                            const match = line.match(/:\s*(.+)/);
                            if (match && match[1]) {
                                const gpuName = match[1].trim();
                                gpus.push({
                                    name: gpuName,
                                });
                            }
                        }
                    } catch {
                        // フォールバック
                    }
                }
            } catch (error) {
                console.error('Linux GPU情報の取得に失敗:', error);
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
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const username = os.userInfo().username;
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    let osName = '';
    let osVersion = '';

    try {
        if (platform === 'win32') {
            // Windowsの場合
            const { stdout } = await execAsync('wmic os get Caption,Version /format:list');
            const lines = stdout.split('\n');
            let caption = '';
            let version = '';

            for (const line of lines) {
                if (line.startsWith('Caption=')) {
                    caption = line.replace('Caption=', '').trim();
                }
                if (line.startsWith('Version=')) {
                    version = line.replace('Version=', '').trim();
                }
            }

            osName = caption || 'Windows';
            osVersion = version || '';
        } else if (platform === 'darwin') {
            // macOSの場合
            const { stdout: swVers } = await execAsync('sw_vers');
            const lines = swVers.split('\n');
            let productName = '';
            let productVersion = '';

            for (const line of lines) {
                if (line.startsWith('ProductName:')) {
                    productName = line.replace('ProductName:', '').trim();
                }
                if (line.startsWith('ProductVersion:')) {
                    productVersion = line.replace('ProductVersion:', '').trim();
                }
            }

            osName = productName || 'macOS';
            osVersion = productVersion || '';
        } else {
            // Linuxの場合
            try {
                const { stdout } = await execAsync('cat /etc/os-release');
                const lines = stdout.split('\n');
                let prettyName = '';

                for (const line of lines) {
                    if (line.startsWith('PRETTY_NAME=')) {
                        prettyName = line.replace('PRETTY_NAME=', '').replace(/"/g, '').trim();
                        break;
                    }
                }

                osName = prettyName || 'Linux';
            } catch {
                osName = 'Linux';
            }

            try {
                const { stdout } = await execAsync('uname -r');
                osVersion = stdout.trim();
            } catch {
                osVersion = '';
            }
        }
    } catch (error) {
        console.error('OS情報の取得に失敗:', error);
        osName = platform;
        osVersion = os.release();
    }

    const cpuName = cpus[0]?.model || 'Unknown CPU';
    const cpuCores = cpus.length;

    // GPU情報を取得
    const gpus = await getGPUInfo(platform);

    // ストレージ情報を取得
    const storage = await getStorageInfo(platform);

    // メモリの種類を取得
    const memoryType = await getMemoryType(platform);

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
}

