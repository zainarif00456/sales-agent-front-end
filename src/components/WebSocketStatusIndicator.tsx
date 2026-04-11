import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { WebSocketStatus } from '@/hooks/useAgentWebSocket';

interface WebSocketStatusIndicatorProps {
    status: WebSocketStatus;
    reconnectAttempts?: number;
    maxReconnectAttempts?: number;
    onReconnect?: () => void;
    className?: string;
}

/**
 * Visual indicator for WebSocket connection status
 * 
 * Displays current connection state with appropriate icons and colors.
 * Provides reconnection button when connection fails.
 */
export const WebSocketStatusIndicator: React.FC<WebSocketStatusIndicatorProps> = ({
    status,
    reconnectAttempts = 0,
    maxReconnectAttempts = 2,
    onReconnect,
    className = '',
}) => {
    const getStatusConfig = () => {
        switch (status) {
            case WebSocketStatus.CONNECTED:
                return {
                    icon: Wifi,
                    text: 'Connected',
                    color: 'text-green-500',
                    bgColor: 'bg-green-500/10',
                    borderColor: 'border-green-500/20',
                    showReconnect: false,
                };
            case WebSocketStatus.CONNECTING:
                return {
                    icon: Loader2,
                    text: 'Connecting...',
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-500/10',
                    borderColor: 'border-blue-500/20',
                    showReconnect: false,
                    animate: true,
                };
            case WebSocketStatus.RECONNECTING:
                return {
                    icon: Loader2,
                    text: `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-500/10',
                    borderColor: 'border-yellow-500/20',
                    showReconnect: false,
                    animate: true,
                };
            case WebSocketStatus.ERROR:
                return {
                    icon: AlertCircle,
                    text: 'Connection Failed',
                    color: 'text-red-500',
                    bgColor: 'bg-red-500/10',
                    borderColor: 'border-red-500/20',
                    showReconnect: true,
                };
            case WebSocketStatus.DISCONNECTED:
            default:
                return {
                    icon: WifiOff,
                    text: 'Disconnected',
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-500/10',
                    borderColor: 'border-gray-500/20',
                    showReconnect: true,
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}
        >
            <div className="flex items-center gap-1.5">
                <Icon
                    className={`w-3.5 h-3.5 ${config.color} ${config.animate ? 'animate-spin' : ''}`}
                />
                <span className={`text-xs font-medium ${config.color}`}>
                    {config.text}
                </span>
            </div>

            <AnimatePresence>
                {config.showReconnect && onReconnect && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onReconnect}
                        className="ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 transition-colors"
                    >
                        Reconnect
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

/**
 * Compact version for minimal UI
 */
export const WebSocketStatusBadge: React.FC<WebSocketStatusIndicatorProps> = ({
    status,
    className = '',
}) => {
    const getStatusConfig = () => {
        switch (status) {
            case WebSocketStatus.CONNECTED:
                return { color: 'bg-green-500', pulse: false };
            case WebSocketStatus.CONNECTING:
            case WebSocketStatus.RECONNECTING:
                return { color: 'bg-yellow-500', pulse: true };
            case WebSocketStatus.ERROR:
                return { color: 'bg-red-500', pulse: false };
            default:
                return { color: 'bg-gray-500', pulse: false };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={`relative ${className}`}>
            <div className={`w-2 h-2 rounded-full ${config.color}`} />
            {config.pulse && (
                <motion.div
                    className={`absolute inset-0 w-2 h-2 rounded-full ${config.color}`}
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 0, 0.7],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}
        </div>
    );
};
