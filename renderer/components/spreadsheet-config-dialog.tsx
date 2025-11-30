/* スプレッドシート設定ダイアログコンポーネント */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export interface SpreadsheetConfig {
    spreadsheetId: string;
    sheetName: string;
    credentials?: {
        clientEmail: string;
        privateKey: string;
    };
}

interface SpreadsheetConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (config: SpreadsheetConfig) => Promise<void>;
    initialConfig?: SpreadsheetConfig;
}

export const SpreadsheetConfigDialog = ({
    open,
    onOpenChange,
    onSave,
    initialConfig,
}: SpreadsheetConfigDialogProps) => {
    const [spreadsheetId, setSpreadsheetId] = useState(initialConfig?.spreadsheetId || '');
    const [sheetName, setSheetName] = useState(initialConfig?.sheetName || 'Sheet1');
    const [clientEmail, setClientEmail] = useState(
        initialConfig?.credentials?.clientEmail || ''
    );
    const [privateKey, setPrivateKey] = useState(
        initialConfig?.credentials?.privateKey || ''
    );
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onSave({
                spreadsheetId,
                sheetName,
                credentials: {
                    clientEmail,
                    privateKey,
                },
            });
            onOpenChange(false);
        } catch (error) {
            console.error('設定の保存に失敗:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Googleスプレッドシート設定</DialogTitle>
                    <DialogDescription>
                        PC情報を書き込むスプレッドシートの設定を行います
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="spreadsheet-id">スプレッドシートID</Label>
                        <Input
                            id="spreadsheet-id"
                            placeholder="例: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                            value={spreadsheetId}
                            onChange={(e) => setSpreadsheetId(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            スプレッドシートのURLから取得できます
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sheet-name">シート名</Label>
                        <Input
                            id="sheet-name"
                            placeholder="Sheet1"
                            value={sheetName}
                            onChange={(e) => setSheetName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="client-email">サービスアカウントのメールアドレス</Label>
                        <Input
                            id="client-email"
                            type="email"
                            placeholder="example@project.iam.gserviceaccount.com"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="private-key">秘密鍵（JSON形式）</Label>
                        <Textarea
                            id="private-key"
                            placeholder="-----BEGIN PRIVATE KEY-----&#10;..."
                            value={privateKey}
                            onChange={(e) => setPrivateKey(e.target.value)}
                            rows={4}
                            className="font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                            サービスアカウントのJSONキーから取得できます
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        キャンセル
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading || !spreadsheetId}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                保存中...
                            </>
                        ) : (
                            '保存'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


