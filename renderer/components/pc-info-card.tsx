/* PC情報表示カードコンポーネント */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Cpu, HardDrive, User, Calendar, Video, Database } from 'lucide-react';

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

interface PCInfoCardProps {
    pcInfo: PCInfo;
}

export const PCInfoCard = ({ pcInfo }: PCInfoCardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    PC情報
                </CardTitle>
                <CardDescription>現在のPCの詳細情報</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* カードグリッド: 1列（モバイル）、2列（タブレット）、3列（デスクトップ） */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 基本情報 */}
                    <div className="p-3 border rounded-md bg-muted/50 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">OS情報</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">ホスト名:</span>
                                <span className="text-muted-foreground">{pcInfo.hostname}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">ユーザー名:</span>
                                <span className="text-muted-foreground">{pcInfo.username}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">OS:</span>
                                <Badge variant="outline">{pcInfo.os}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground text-xs">
                                    {pcInfo.osVersion}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Badge variant="secondary">{pcInfo.platform}</Badge>
                                <Badge variant="secondary">{pcInfo.arch}</Badge>
                            </div>
                        </div>
                    </div>

                    {/* CPU情報 */}
                    <div className="p-3 border rounded-md bg-muted/50 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">CPU</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">モデル:</span>
                                <span className="text-muted-foreground">{pcInfo.cpu}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">コア数:</span>
                                <Badge variant="outline">{pcInfo.cpuCores} コア</Badge>
                            </div>
                        </div>
                    </div>

                    {/* GPU情報 */}
                    {pcInfo.gpu && pcInfo.gpu.length > 0 && (
                        <>
                            {pcInfo.gpu.map((gpu, index) => (
                                <div
                                    key={index}
                                    className="p-3 border rounded-md bg-muted/50 space-y-2"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Video className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium text-sm">
                                            GPU {pcInfo.gpu.length > 1 ? index + 1 : ''}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium">モデル:</span>
                                            <span className="text-muted-foreground">
                                                {gpu.name}
                                            </span>
                                        </div>
                                        {gpu.vram && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium">VRAM:</span>
                                                <span className="text-muted-foreground">
                                                    {gpu.vram}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* メモリ情報 */}
                    <div className="p-3 border rounded-md bg-muted/50 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">メモリ</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">総メモリ:</span>
                                <span className="text-muted-foreground">{pcInfo.totalMemory}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">空きメモリ:</span>
                                <span className="text-muted-foreground">{pcInfo.freeMemory}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">メモリ種類:</span>
                                <Badge variant="outline">{pcInfo.memoryType}</Badge>
                            </div>
                        </div>
                    </div>

                    {/* ストレージ情報 */}
                    {pcInfo.storage && pcInfo.storage.length > 0 && (
                        <>
                            {pcInfo.storage.map((storage, index) => (
                                <div
                                    key={index}
                                    className="p-3 border rounded-md bg-muted/50 space-y-2"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Database className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium text-sm">
                                            ストレージ {index + 1}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium">モデル:</span>
                                            <span className="text-muted-foreground">
                                                {storage.model}
                                            </span>
                                        </div>
                                        {storage.manufacturer && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium">製造会社:</span>
                                                <span className="text-muted-foreground">
                                                    {storage.manufacturer}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium">容量:</span>
                                            <span className="text-muted-foreground">
                                                {storage.size}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>取得日時: {new Date(pcInfo.timestamp).toLocaleString('ja-JP')}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
