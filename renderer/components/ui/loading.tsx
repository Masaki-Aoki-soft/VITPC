import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    overlay?: boolean;
    className?: string;
}

function Loading({ size = 'md', text, overlay = false, className }: LoadingProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    const content = (
        <div
            className={cn(
                'flex items-center justify-center gap-2',
                overlay && 'absolute inset-0 bg-white/80 backdrop-blur-sm z-50',
                className
            )}
        >
            <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
            {text && (
                <span className={cn('text-gray-600 font-medium', textSizeClasses[size])}>
                    {text}
                </span>
            )}
        </div>
    );

    return content;
}

// ボタン用のローディングコンポーネント
function ButtonLoading({ size = 'sm', className }: { size?: 'sm' | 'md'; className?: string }) {
    return (
        <Loader2 className={cn('animate-spin', size === 'sm' ? 'h-4 w-4' : 'h-5 w-5', className)} />
    );
}

// フルスクリーンローディング
function FullScreenLoading({ text = '読み込み中...' }: { text?: string }) {
    return (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700">{text}</p>
            </div>
        </div>
    );
}

// インラインローディング（テキストの代わりに表示）
function InlineLoading({ className }: { className?: string }) {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
        </div>
    );
}

export { Loading, ButtonLoading, FullScreenLoading, InlineLoading };
