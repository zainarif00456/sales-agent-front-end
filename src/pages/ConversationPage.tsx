import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Loader2, FileText, Image as ImageIcon, Paperclip, X, Brain, Zap, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ClientProfileDisplay } from '@/components/ClientProfileDisplay';
import { WebSocketStatusIndicator } from '@/components/WebSocketStatusIndicator';
import { AnimatedMessage, type MessageAnimMode } from '@/components/AnimatedMessage';
import {
    conversationService,
    type SendMessageData,
    type SendMessageResponse,
    type ConversationSession,
    type Message,
    type SessionListResponse,
} from '@/services/conversation.service';
import type { InfiniteData } from '@tanstack/react-query';
import { useAgentWebSocket, WebSocketStatus } from '@/hooks/useAgentWebSocket';
import { fileToDataUrl } from '@/lib/attachments';

const ALLOWED_TYPES: Record<string, string[]> = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/bmp': ['.bmp'],
    'image/tiff': ['.tiff', '.tif'],
};
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type ConversationMessage = Message & {
    backend_message_id?: string;
    client_message_id?: string;
    isStreaming?: boolean;
    isPending?: boolean;
    animType?: MessageAnimMode;
};

type PendingSendContext = { clientMessageId: string; draftMessage: string; draftFile: File | null };
type PendingSendMessageData = SendMessageData & { client_message_id: string };

const formatFileSize = (b: number) => {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
};

// ── Thinking indicator ─────────────────────────────────────────────────────────
const ThinkingDots = ({ message }: { message: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="flex items-start gap-3"
    >
        <div className="flex-shrink-0 relative">
            <motion.div className="absolute -inset-1 rounded-full"
                style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', opacity: 0.3 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }} />
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }}>
                <Brain className="w-4 h-4 text-white" />
            </div>
        </div>
        <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
                {/* Sound-bar animation */}
                <div className="flex items-end gap-0.5">
                    {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-1 rounded-full"
                            style={{ background: 'var(--accent-primary)' }}
                            animate={{ height: ['5px', '14px', '5px'] }}
                            transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }} />
                    ))}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{message}</span>
            </div>
        </div>
    </motion.div>
);

// ── User bubble ────────────────────────────────────────────────────────────────
const UserBubble = ({
    msg, index,
}: { msg: ConversationMessage; agentName: string; index: number }) => (
    <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex justify-end"
    >
        <div className="max-w-[78%]">
            <div className="flex items-center justify-end gap-2 mb-1.5">
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {msg.is_client_query ? 'Client' : 'You'}
                </span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${msg.is_client_query ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                    <User className="w-3 h-3 text-white" />
                </div>
            </div>
            <div className={`text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-md ${msg.is_client_query ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                <p>{msg.user_message}</p>

                {msg.attachment_file && msg.attachment_file !== 'uploading...' && (
                    <a href={msg.attachment_file} target="_blank" rel="noopener noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] bg-white/20 hover:bg-white/30 rounded-lg px-2.5 py-1.5 transition-colors">
                        {msg.attachment_file.endsWith('.pdf')
                            ? <FileText className="w-3 h-3" />
                            : <ImageIcon className="w-3 h-3" />
                        }
                        View Attachment
                    </a>
                )}

                {msg.client_profile_data && Object.keys(msg.client_profile_data).length > 0 && (
                    <div className="mt-2 text-[11px] bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-2.5 py-1">
                        ✅ Profile extracted: {msg.client_profile_data.name || 'Unknown'}
                    </div>
                )}

                {msg.isPending && !msg.backend_message_id && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium bg-white/15 rounded-full px-2.5 py-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Sending…
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

// ── Agent bubble ───────────────────────────────────────────────────────────────
const AgentBubble = ({
    msg, agentName, index,
}: { msg: ConversationMessage; agentName: string; index: number }) => {
    const mode: MessageAnimMode = msg.animType ?? 'static';
    const isStreaming = mode === 'streaming';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: Math.min(index * 0.04, 0.3) + 0.05, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex justify-start"
        >
            <div className="max-w-[78%]">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="relative">
                        {isStreaming && (
                            <motion.div className="absolute -inset-1 rounded-full"
                                style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', opacity: 0.25 }}
                                animate={{ scale: [1, 1.25, 1] }}
                                transition={{ duration: 1.8, repeat: Infinity }} />
                        )}
                        <div className={`relative w-6 h-6 rounded-full flex items-center justify-center ${isStreaming ? 'shadow-md' : ''}`}
                            style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }}>
                            <Bot className="w-3 h-3 text-white" />
                        </div>
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{agentName}</span>
                    {isStreaming && (
                        <motion.span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(139,92,246,0.2)' }}
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                        >
                            Live
                        </motion.span>
                    )}
                </div>

                <div
                    className="rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm"
                    style={{
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        boxShadow: isStreaming ? '0 0 0 1px rgba(139,92,246,0.15)' : undefined,
                    }}
                >
                    <AnimatedMessage
                        content={msg.agent_response || ''}
                        mode={mode}
                    />

                    {msg.response_time_ms && !isStreaming && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-1 mt-2 pt-2"
                            style={{ borderTop: '1px solid var(--border-color)' }}
                        >
                            <Zap className="w-2.5 h-2.5" style={{ color: 'var(--accent-primary)' }} />
                            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                                {msg.response_time_ms}ms
                            </span>
                        </motion.div>
                    )}
                </div>

                {msg.client_profile_data && Object.keys(msg.client_profile_data).length > 0 && (
                    <div className="mt-3">
                        <ClientProfileDisplay profile={msg.client_profile_data} />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ── Page ───────────────────────────────────────────────────────────────────────
export const ConversationPage = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const loadedSessionIdRef = useRef<string | undefined>(undefined);
    const shouldAutoScrollRef = useRef(true);
    const forceScrollRef = useRef(false);

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'user' | 'client'>('user');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [thinkingMessage, setThinkingMessage] = useState('');
    const [sessionTitle, setSessionTitle] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const token = localStorage.getItem('access_token') || '';

    const { data: session, isLoading } = useQuery({
        queryKey: ['conversation', sessionId],
        queryFn: () => conversationService.getSession(sessionId!),
        enabled: !!sessionId,
    });

    // Delete session mutation
    const deleteSessionMutation = useMutation({
        mutationFn: (id: string) => conversationService.deleteSession(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast.success('Conversation deleted successfully');
            navigate('/conversations');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to delete conversation');
            setIsDeleting(false);
        },
    });

    const handleDeleteSession = async () => {
        if (!sessionId) return;
        
        const confirmed = window.confirm(
            'Are you sure you want to delete this conversation? This action cannot be undone.'
        );
        
        if (confirmed) {
            setIsDeleting(true);
            deleteSessionMutation.mutate(sessionId);
        }
    };

    const [localMessages, setLocalMessages] = useState<ConversationMessage[]>([]);

    const getSocketMessageId  = useCallback((d: any) => d?.message_id || d?.messageId || d?.id, []);
    const getSocketChunk      = useCallback((d: any) => d?.chunk || d?.content || d?.text || '', []);
    const getSocketFullResp   = useCallback((d: any) => d?.full_response || d?.fullResponse || d?.response || d?.final_response, []);
    const getSocketRespTime   = useCallback((d: any) => d?.response_time_ms ?? d?.responseTimeMs, []);
    const getSocketTitle      = useCallback((d: any) => d?.session_title || d?.sessionTitle || d?.title, []);

    const syncSessionTitle = useCallback((next?: string) => {
        if (!sessionId || !next) return;
        setSessionTitle(next);
        queryClient.setQueryData<ConversationSession | undefined>(['conversation', sessionId], cur =>
            cur ? { ...cur, title: next } : cur);
        queryClient.setQueryData<InfiniteData<SessionListResponse> | undefined>(['conversations'], cur =>
            cur ? { ...cur, pages: cur.pages.map(page => ({ ...page, results: page.results.map(i => i.id === sessionId ? { ...i, title: next } : i) })) } : cur);
    }, [queryClient, sessionId]);

    const markPendingMessageAsStreaming = useCallback((backendMessageId?: string) => {
        setLocalMessages(prev => {
            const idx = prev.findIndex(m => m.isPending && !m.backend_message_id);
            if (idx < 0) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], backend_message_id: backendMessageId, isPending: false, isStreaming: true, agent_response: updated[idx].agent_response || '', animType: 'streaming' };
            return updated;
        });
    }, []);

    const updateStreamedMessage = useCallback((backendMessageId: string | undefined, chunk: string) => {
        if (!chunk) return;
        setLocalMessages(prev => {
            let idx = backendMessageId ? prev.findIndex(m => m.backend_message_id === backendMessageId) : -1;
            if (idx < 0) idx = prev.findIndex(m => m.isPending || m.isStreaming);
            if (idx < 0) return prev;
            const updated = [...prev];
            updated[idx] = {
                ...updated[idx],
                backend_message_id: backendMessageId || updated[idx].backend_message_id,
                agent_response: `${updated[idx].agent_response || ''}${chunk}`,
                isPending: false,
                isStreaming: true,
                animType: 'streaming',
            };
            return updated;
        });
    }, []);

    const completeStreamedMessage = useCallback((backendMessageId: string | undefined, fullResponse?: string, responseTimeMs?: number) => {
        setLocalMessages(prev => {
            let idx = backendMessageId ? prev.findIndex(m => m.backend_message_id === backendMessageId) : -1;
            if (idx < 0) idx = prev.findIndex(m => m.isPending || m.isStreaming);
            if (idx < 0) return prev;
            const updated = [...prev];
            updated[idx] = {
                ...updated[idx],
                backend_message_id: backendMessageId || updated[idx].backend_message_id,
                agent_response: fullResponse ?? updated[idx].agent_response,
                response_time_ms: responseTimeMs ?? updated[idx].response_time_ms,
                isStreaming: false,
                isPending: false,
                animType: 'static', // triggers crossfade to rendered markdown
            };
            return updated;
        });
    }, []);

    const replaceOptimisticMessage = useCallback((clientMessageId: string, response: ConversationMessage) => {
        setLocalMessages(prev => {
            const idx = prev.findIndex(m => m.client_message_id === clientMessageId || m.id === clientMessageId);
            const final = { ...response, client_message_id: clientMessageId, isPending: false, isStreaming: false, animType: 'api-complete' as MessageAnimMode };
            if (idx < 0) return [...prev, final];
            const updated = [...prev];
            updated[idx] = final;
            return updated;
        });
    }, []);

    const restoreOptimisticDraft = useCallback((clientMessageId: string) => {
        setLocalMessages(prev => prev.filter(m => m.client_message_id !== clientMessageId && m.id !== clientMessageId));
    }, []);

    const {
        status: wsStatus, isConnected, sendMessage: wsSendMessage,
        reconnect, reconnectAttempts, maxReconnectAttempts,
    } = useAgentWebSocket({
        agentId: session?.agent || '',
        token,
        enabled: !!session?.agent && !!token,
        onConnectionEstablished: () => {},
        onAgentThinking: (data) => { setIsThinking(true); setThinkingMessage(data.message || 'Thinking…'); },
        onStreamStart: (data) => { setIsThinking(false); markPendingMessageAsStreaming(getSocketMessageId(data)); },
        onAgentStreaming: (data) => { updateStreamedMessage(getSocketMessageId(data), getSocketChunk(data)); },
        onAgentComplete: (data) => {
            setIsThinking(false);
            completeStreamedMessage(getSocketMessageId(data), getSocketFullResp(data), getSocketRespTime(data));
            const title = getSocketTitle(data);
            if (title) syncSessionTitle(title);
        },
        onSessionTitleUpdated: (data) => { const t = getSocketTitle(data); if (t) syncSessionTitle(t); },
        onError: (data) => { setIsThinking(false); toast.error(data.message || 'WebSocket error'); },
    });

    useEffect(() => {
        if (!session) return;
        if (sessionId && loadedSessionIdRef.current !== sessionId) {
            loadedSessionIdRef.current = sessionId;
            setSessionTitle(session.title || '');
            setLocalMessages((session.messages || []) as ConversationMessage[]);
            return;
        }
        if (!sessionTitle && session.title) setSessionTitle(session.title);
        if (session.messages && localMessages.length === 0) setLocalMessages(session.messages as ConversationMessage[]);
    }, [session, sessionId, sessionTitle, localMessages.length]);

    const sendMessageMutation = useMutation<SendMessageResponse, Error, PendingSendMessageData, { draft: PendingSendContext }>({
        mutationFn: (data) => conversationService.sendMessage(sessionId!, data),
        onMutate: async (newMessage) => {
            await queryClient.cancelQueries({ queryKey: ['conversation', sessionId] });
            const optimistic: ConversationMessage = {
                id: newMessage.client_message_id,
                user_message: newMessage.message,
                is_user_query: newMessage.is_user_query,
                is_client_query: newMessage.is_client_query,
                attachment_file: newMessage.attachment_file ? 'uploading...' : undefined,
                agent_response: '',
                created_at: new Date().toISOString(),
                message_type: newMessage.is_client_query ? 'client_message' : 'user_query',
                client_message_id: newMessage.client_message_id,
                isPending: true,
            };
            setLocalMessages(prev => [...prev, optimistic]);
            setMessage('');
            setSelectedFile(null);
            if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
            return { draft: { clientMessageId: newMessage.client_message_id, draftMessage: newMessage.message, draftFile: newMessage.attachment_file || null } };
        },
        onSuccess: (response, variables) => {
            replaceOptimisticMessage(variables.client_message_id, { ...response.data, client_message_id: variables.client_message_id, isPending: false, isStreaming: false });
            if (response.client_profile_extracted && response.data.client_profile_data) {
                toast.success(`Profile extracted: ${response.data.client_profile_data.name || 'Client'}!`, { duration: 4000 });
            }
            if (response.session_title) syncSessionTitle(response.session_title);
        },
        onError: (_err, variables, context) => {
            toast.error('Failed to send message');
            restoreOptimisticDraft(variables.client_message_id);
            setMessage(context?.draft?.draftMessage || '');
            setSelectedFile(context?.draft?.draftFile || null);
        },
    });

    const handleSendMessage = async (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (!message.trim() && !selectedFile) { toast.error('Enter a message or attach a file'); return; }
        const draftMessage = message.trim() || 'Uploaded document';
        const clientMessageId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const payload: PendingSendMessageData = {
            client_message_id: clientMessageId,
            message: draftMessage,
            is_user_query: messageType === 'user',
            is_client_query: messageType === 'client',
            attachment_file: selectedFile || undefined,
        };

        if (isConnected) {
            const userMsg: ConversationMessage = {
                id: clientMessageId, user_message: draftMessage,
                is_user_query: messageType === 'user', is_client_query: messageType === 'client',
                agent_response: '', created_at: new Date().toISOString(),
                message_type: messageType === 'client' ? 'client_message' : 'user_query',
                client_message_id: clientMessageId, isPending: true,
            };
            setLocalMessages(prev => [...prev, userMsg]);
            try {
                let attachmentBase64: string | undefined;
                if (selectedFile) attachmentBase64 = await fileToDataUrl(selectedFile);
                const sent = wsSendMessage({ sessionId: sessionId!, message: draftMessage, isUserQuery: messageType === 'user', isClientQuery: messageType === 'client', attachmentBase64, attachmentName: selectedFile?.name, attachmentMimeType: selectedFile?.type });
                if (sent) { setMessage(''); setSelectedFile(null); if (textareaRef.current) textareaRef.current.style.height = 'auto'; forceScrollRef.current = true; return; }
            } catch (err) { console.error('[Conversation] WS send error', err); }
            restoreOptimisticDraft(clientMessageId);
            if (wsStatus === WebSocketStatus.DISCONNECTED || wsStatus === WebSocketStatus.ERROR) {
                sendMessageMutation.mutate(payload); forceScrollRef.current = true; return;
            }
            toast.error('Message not sent — please retry.'); return;
        }
        if (wsStatus === WebSocketStatus.DISCONNECTED || wsStatus === WebSocketStatus.ERROR) {
            sendMessageMutation.mutate(payload); forceScrollRef.current = true; return;
        }
        toast.error('Connection establishing — please wait a moment.');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
    };

    useEffect(() => {
        if (!messagesEndRef.current) return;
        if (forceScrollRef.current || shouldAutoScrollRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            forceScrollRef.current = false;
        }
    }, [localMessages, isThinking]);

    const handleMessagesScroll = () => {
        const c = messagesContainerRef.current;
        if (!c) return;
        shouldAutoScrollRef.current = c.scrollHeight - c.scrollTop - c.clientHeight < 120;
    };

    const validateFile = (file: File): boolean => {
        if (!Object.keys(ALLOWED_TYPES).includes(file.type)) { toast.error('Invalid file type. Use PDF or image.'); return false; }
        if (file.size > MAX_FILE_SIZE) { toast.error('File too large. Max 10MB.'); return false; }
        return true;
    };

    if (isLoading) return <Layout><div className="flex items-center justify-center h-96"><LoadingSpinner size="lg" /></div></Layout>;
    if (!session) return (
        <Layout>
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Conversation not found</h2>
            </div>
        </Layout>
    );

    const SAMPLE_PROMPTS = [
        `Tell me about your expertise`,
        `How can you help me close more deals?`,
        `What's your approach to objections?`,
    ];

    return (
        <Layout>
            <div className="flex flex-col" style={{ height: 'calc(100vh - 2rem)' }}>

                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-shrink-0 flex items-center justify-between px-5 py-3 mb-3 rounded-2xl"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                                style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }}>
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500"
                                style={{ border: '2px solid var(--bg-secondary)' }} />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                {sessionTitle || session.title}
                            </h1>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {session.agent_details.name} · {session.agent_details.role}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <WebSocketStatusIndicator
                            status={wsStatus}
                            reconnectAttempts={reconnectAttempts}
                            maxReconnectAttempts={maxReconnectAttempts}
                            onReconnect={reconnect}
                        />
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${session.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-400'}`}
                            style={{ border: `1px solid ${session.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(100,100,100,0.15)'}` }}>
                            {session.is_active ? '● Active' : '● Inactive'}
                        </span>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDeleteSession}
                            disabled={isDeleting}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
                            title="Delete conversation"
                        >
                            <Trash2 className="w-5 h-5" />
                        </motion.button>
                    </div>
                </motion.div>

                {/* ── Messages ── */}
                <div
                    ref={messagesContainerRef}
                    onScroll={handleMessagesScroll}
                    className="flex-1 min-h-0 overflow-y-auto scrollbar-thin rounded-2xl p-5 mb-3"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                >
                    <AnimatePresence>
                        {localMessages.length > 0 ? (
                            <div className="space-y-5">
                                {localMessages.map((msg, i) => (
                                    <div key={msg.id ?? msg.client_message_id ?? i}>
                                        <UserBubble msg={msg} agentName={session.agent_details.name} index={i} />

                                        {(msg.isStreaming || msg.agent_response || msg.backend_message_id) ? (
                                            <div className="mt-3">
                                                <AgentBubble msg={msg} agentName={session.agent_details.name} index={i} />
                                            </div>
                                        ) : null}
                                    </div>
                                ))}

                                <AnimatePresence>
                                    {isThinking && <ThinkingDots message={thinkingMessage} />}
                                </AnimatePresence>

                                <div ref={messagesEndRef} />
                            </div>
                        ) : (
                            /* ── Empty state ── */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.45 }}
                                className="flex items-center justify-center h-full min-h-[300px]"
                            >
                                <div className="text-center max-w-xs">
                                    <div className="relative w-20 h-20 mx-auto mb-5">
                                        <motion.div className="absolute inset-0 rounded-full"
                                            style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', opacity: 0.15 }}
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ duration: 3, repeat: Infinity }} />
                                        <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }}>
                                            <Brain className="w-9 h-9 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-base font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                        Start the conversation
                                    </h3>
                                    <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                                        Say anything to {session.agent_details.name}
                                    </p>
                                    <div className="space-y-2">
                                        {SAMPLE_PROMPTS.map(p => (
                                            <button key={p} onClick={() => setMessage(p)}
                                                className="block w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200"
                                                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                                            >
                                                "{p}"
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Input area ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-shrink-0 rounded-2xl overflow-hidden"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                >
                    {/* Hidden file input */}
                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,.tif"
                        onChange={e => { const f = e.target.files?.[0]; if (f && validateFile(f)) setSelectedFile(f); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="hidden" disabled={sendMessageMutation.isPending} />

                    {/* File chip */}
                    <AnimatePresence>
                        {selectedFile && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pt-3 pb-1">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                                        style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--text-primary)' }}>
                                        {selectedFile.type === 'application/pdf'
                                            ? <FileText className="w-3.5 h-3.5 text-red-400" />
                                            : <ImageIcon className="w-3.5 h-3.5 text-blue-400" />}
                                        <span className="max-w-[180px] truncate font-medium">{selectedFile.name}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{formatFileSize(selectedFile.size)}</span>
                                        <button onClick={() => setSelectedFile(null)}
                                            className="ml-0.5 p-0.5 rounded hover:bg-red-500/15 transition-colors">
                                            <X className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSendMessage} className="p-3">
                        <div className="flex items-end gap-2">
                            {/* Mode toggle */}
                            <div className="flex flex-shrink-0 rounded-xl p-0.5" style={{ background: 'var(--bg-tertiary)' }}>
                                {(['user', 'client'] as const).map(type => (
                                    <motion.button
                                        key={type}
                                        type="button"
                                        onClick={() => setMessageType(type)}
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                                        style={messageType === type
                                            ? { background: type === 'user' ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: 'white' }
                                            : { color: 'var(--text-secondary)' }
                                        }
                                        whileHover={messageType !== type ? { opacity: 0.8 } : {}}
                                        whileTap={{ scale: 0.96 }}
                                    >
                                        {type === 'user' ? '👤 User' : '💼 Client'}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Attach */}
                            <motion.button
                                type="button"
                                onClick={() => !sendMessageMutation.isPending && fileInputRef.current?.click()}
                                disabled={sendMessageMutation.isPending}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.93 }}
                                className="flex-shrink-0 p-2 rounded-xl transition-all duration-200 disabled:opacity-40"
                                style={{
                                    background: selectedFile ? 'rgba(139,92,246,0.12)' : 'var(--bg-tertiary)',
                                    color: selectedFile ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                }}
                            >
                                <Paperclip style={{ width: 18, height: 18 }} />
                            </motion.button>

                            {/* Textarea */}
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={message}
                                onChange={e => {
                                    setMessage(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={selectedFile ? 'Add a note about this file…' : `Message ${session.agent_details.name}…`}
                                disabled={sendMessageMutation.isPending}
                                className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm disabled:opacity-50 transition-all duration-200 scrollbar-hide"
                                style={{
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    lineHeight: '1.5',
                                    maxHeight: 120,
                                    overflowY: 'auto',
                                }}
                                onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                            />

                            {/* Send */}
                            <motion.button
                                type="submit"
                                disabled={(!message.trim() && !selectedFile) || sendMessageMutation.isPending}
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                className="flex-shrink-0 p-2.5 rounded-xl text-white disabled:opacity-35 disabled:cursor-not-allowed relative overflow-hidden"
                                style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', boxShadow: '0 3px 12px rgba(139,92,246,0.35)' }}
                                animate={message.trim() || selectedFile ? {
                                    boxShadow: ['0 3px 12px rgba(139,92,246,0.35)', '0 5px 18px rgba(59,130,246,0.4)', '0 3px 12px rgba(139,92,246,0.35)'],
                                } : {}}
                                transition={{ duration: 2.5, repeat: Infinity }}
                            >
                                {sendMessageMutation.isPending
                                    ? <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />
                                    : <Send style={{ width: 18, height: 18 }} />
                                }
                            </motion.button>
                        </div>

                        <p className="text-[10px] mt-2 text-center" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
                            Enter to send · Shift+Enter for new line
                        </p>
                    </form>
                </motion.div>
            </div>
        </Layout>
    );
};
