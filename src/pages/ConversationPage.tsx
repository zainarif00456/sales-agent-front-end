import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Loader2, FileText, Image as ImageIcon, Paperclip, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ClientProfileDisplay } from '@/components/ClientProfileDisplay';
import { WebSocketStatusIndicator } from '@/components/WebSocketStatusIndicator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { conversationService, SendMessageData, SendMessageResponse, ConversationSession, Message, SessionListResponse } from '@/services/conversation.service';
import { useAgentWebSocket } from '@/hooks/useAgentWebSocket';
import { fileToDataUrl } from '@/lib/attachments';

const ALLOWED_TYPES: Record<string, string[]> = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/bmp': ['.bmp'],
    'image/tiff': ['.tiff', '.tif'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type ConversationMessage = Message & {
    backend_message_id?: string;
    client_message_id?: string;
    isStreaming?: boolean;
    isPending?: boolean;
};

type PendingSendContext = {
    clientMessageId: string;
    draftMessage: string;
    draftFile: File | null;
};

type PendingSendMessageData = SendMessageData & {
    client_message_id: string;
};

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const ConversationPage = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    // const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const loadedSessionIdRef = useRef<string | undefined>(undefined);
    const shouldAutoScrollRef = useRef(true);
    const forceScrollRef = useRef(false);

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'user' | 'client'>('user');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [thinkingMessage, setThinkingMessage] = useState('');
    const [sessionTitle, setSessionTitle] = useState('');

    // Get auth token for WebSocket
    const token = localStorage.getItem('access_token') || '';

    const { data: session, isLoading } = useQuery({
        queryKey: ['conversation', sessionId],
        queryFn: () => conversationService.getSession(sessionId!),
        enabled: !!sessionId,
    });

    const [localMessages, setLocalMessages] = useState<ConversationMessage[]>([]);

    const syncSessionTitle = useCallback((nextTitle?: string) => {
        if (!sessionId || !nextTitle) {
            return;
        }

        setSessionTitle(nextTitle);

        queryClient.setQueryData<ConversationSession | undefined>(['conversation', sessionId], (current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                title: nextTitle,
            };
        });

        queryClient.setQueryData<SessionListResponse | undefined>(['conversations'], (current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                results: current.results.map((item) => (
                    item.id === sessionId
                        ? { ...item, title: nextTitle }
                        : item
                )),
            };
        });
    }, [queryClient, sessionId]);

    const markPendingMessageAsStreaming = useCallback((backendMessageId: string) => {
        setLocalMessages((prev) => {
            const pendingIndex = prev.findIndex((msg) => msg.isPending && !msg.backend_message_id);

            if (pendingIndex < 0) {
                return prev;
            }

            const updated = [...prev];
            updated[pendingIndex] = {
                ...updated[pendingIndex],
                backend_message_id: backendMessageId,
                isPending: false,
                isStreaming: true,
                agent_response: updated[pendingIndex].agent_response || '',
            };

            return updated;
        });
    }, []);

    const updateStreamedMessage = useCallback((backendMessageId: string, chunk: string) => {
        setLocalMessages((prev) => {
            const messageIndex = prev.findIndex((msg) => msg.backend_message_id === backendMessageId);

            if (messageIndex < 0) {
                return prev;
            }

            const updated = [...prev];
            updated[messageIndex] = {
                ...updated[messageIndex],
                agent_response: `${updated[messageIndex].agent_response || ''}${chunk}`,
                isStreaming: true,
            };

            return updated;
        });
    }, []);

    const completeStreamedMessage = useCallback((backendMessageId: string, fullResponse?: string, responseTimeMs?: number) => {
        setLocalMessages((prev) => {
            const messageIndex = prev.findIndex((msg) => msg.backend_message_id === backendMessageId);

            if (messageIndex < 0) {
                return prev;
            }

            const updated = [...prev];
            updated[messageIndex] = {
                ...updated[messageIndex],
                agent_response: fullResponse ?? updated[messageIndex].agent_response,
                response_time_ms: responseTimeMs ?? updated[messageIndex].response_time_ms,
                isStreaming: false,
                isPending: false,
            };

            return updated;
        });
    }, []);

    const replaceOptimisticMessage = useCallback((clientMessageId: string, response: ConversationMessage) => {
        setLocalMessages((prev) => {
            const messageIndex = prev.findIndex((msg) => msg.client_message_id === clientMessageId || msg.id === clientMessageId);

            if (messageIndex < 0) {
                return [...prev, response];
            }

            const updated = [...prev];
            updated[messageIndex] = {
                ...response,
                client_message_id: clientMessageId,
                isPending: false,
                isStreaming: false,
            };

            return updated;
        });
    }, []);

    const restoreOptimisticDraft = useCallback((clientMessageId: string) => {
        setLocalMessages((prev) => prev.filter((msg) => msg.client_message_id !== clientMessageId && msg.id !== clientMessageId));
    }, []);

    // WebSocket hook
    const {
        status: wsStatus,
        isConnected,
        sendMessage: wsSendMessage,
        reconnect,
        reconnectAttempts,
        maxReconnectAttempts,
    } = useAgentWebSocket({
        agentId: session?.agent || '',
        token,
        enabled: !!session?.agent && !!token,
        onConnectionEstablished: (data) => {
            console.log('Connected to agent:', data.agent_name);
        },
        onAgentThinking: (data) => {
            console.log('💭 Agent is thinking:', data.message);
            setIsThinking(true);
            setThinkingMessage(data.message || 'Thinking...');
        },
        onStreamStart: (data) => {
            console.log('🌊 Stream started for message:', data.message_id);
            setIsThinking(false);
            markPendingMessageAsStreaming(data.message_id);
        },
        onAgentStreaming: (data) => {
            console.log('📝 Streaming chunk:', data.chunk);
            updateStreamedMessage(data.message_id, data.chunk);
        },
        onAgentComplete: (data) => {
            console.log('✅ Stream complete:', data.message_id);

            setIsThinking(false);

            completeStreamedMessage(data.message_id, data.full_response, data.response_time_ms);

            if (data.session_title) {
                syncSessionTitle(data.session_title);
            }
        },
        onSessionTitleUpdated: (data) => {
            if (data?.title) {
                syncSessionTitle(data.title);
            }
        },
        onError: (data) => {
            setIsThinking(false);
            toast.error(data.message || 'WebSocket error occurred');
        },
    });

    useEffect(() => {
        if (!session) {
            return;
        }

        if (sessionId && loadedSessionIdRef.current !== sessionId) {
            loadedSessionIdRef.current = sessionId;
            setSessionTitle(session.title || '');
            setLocalMessages((session.messages || []) as ConversationMessage[]);
            return;
        }

        if (!sessionTitle && session.title) {
            setSessionTitle(session.title);
        }

        if (session.messages && localMessages.length === 0) {
            setLocalMessages(session.messages as ConversationMessage[]);
        }
    }, [session, sessionId, sessionTitle, localMessages.length]);

    // Fallback mutation for file uploads (WebSocket doesn't support file uploads)
    const sendMessageMutation = useMutation<SendMessageResponse, Error, PendingSendMessageData, { draft: PendingSendContext }>({
        mutationFn: (data: PendingSendMessageData) =>
            conversationService.sendMessage(sessionId!, data),
        onMutate: async (newMessage: PendingSendMessageData) => {
            await queryClient.cancelQueries({ queryKey: ['conversation', sessionId] });

            // Optimistically add user message
            const optimisticMessage: ConversationMessage = {
                id: newMessage.client_message_id,
                user_message: newMessage.message,
                is_user_query: newMessage.is_user_query,
                is_client_query: newMessage.is_client_query,
                attachment_file: newMessage.attachment_file ? 'uploading...' : undefined,
                agent_response: '', // Empty initially
                created_at: new Date().toISOString(),
                message_type: newMessage.is_client_query ? 'client_message' : (newMessage.is_user_query ? 'user_query' : 'general'),
                client_message_id: newMessage.client_message_id,
                isPending: true,
            };

            setLocalMessages(prev => [...prev, optimisticMessage]);
            setMessage('');
            setSelectedFile(null);

            return {
                draft: {
                    clientMessageId: newMessage.client_message_id,
                    draftMessage: newMessage.message,
                    draftFile: newMessage.attachment_file || null,
                },
            };
        },
        onSuccess: (response, variables) => {
            // Update with real response
            replaceOptimisticMessage(variables.client_message_id, {
                ...response.data,
                client_message_id: variables.client_message_id,
                isPending: false,
                isStreaming: false,
            });

            // Show success toast for client profile extraction
            if (response.client_profile_extracted && response.data.client_profile_data) {
                const clientName = response.data.client_profile_data.name || 'Client';
                toast.success(`Client profile extracted successfully for ${clientName}!`, {
                    duration: 4000,
                    icon: '✅',
                });
            }

            if (response.session_title) {
                syncSessionTitle(response.session_title);
            }
        },
        onError: (_err, _variables, context) => {
            toast.error('Failed to send message');
            restoreOptimisticDraft(_variables.client_message_id);
            setMessage(context?.draft?.draftMessage || '');
            setSelectedFile(context?.draft?.draftFile || null);
        },
    });

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() && !selectedFile) {
            toast.error('Please enter a message or attach a file');
            return;
        }

        const draftMessage = message.trim() || 'Uploaded document';
        const clientMessageId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const messagePayload: PendingSendMessageData = {
            client_message_id: clientMessageId,
            message: draftMessage,
            is_user_query: messageType === 'user',
            is_client_query: messageType === 'client',
            attachment_file: selectedFile || undefined,
        };

        if (isConnected) {
            // Add user message optimistically
            const userMessage: ConversationMessage = {
                id: clientMessageId,
                user_message: draftMessage,
                is_user_query: messageType === 'user',
                is_client_query: messageType === 'client',
                agent_response: '',
                created_at: new Date().toISOString(),
                message_type: messageType === 'client' ? 'client_message' : 'user_query',
                client_message_id: clientMessageId,
                isPending: true,
            };
            setLocalMessages(prev => [...prev, userMessage]);

            try {
                let attachmentBase64: string | undefined;

                if (selectedFile) {
                    attachmentBase64 = await fileToDataUrl(selectedFile);
                }

                const sent = wsSendMessage({
                    sessionId: sessionId!,
                    message: draftMessage,
                    isUserQuery: messageType === 'user',
                    isClientQuery: messageType === 'client',
                    attachmentBase64,
                    attachmentName: selectedFile?.name,
                    attachmentMimeType: selectedFile?.type,
                });

                if (sent) {
                    setMessage('');
                    setSelectedFile(null);
                    forceScrollRef.current = true;
                    return;
                }
            } catch (error) {
                console.warn('[Conversation] WebSocket attachment encoding failed, falling back to REST.', error);
            }

            restoreOptimisticDraft(clientMessageId);
            sendMessageMutation.mutate(messagePayload);
            forceScrollRef.current = true;
            return;
        }

        sendMessageMutation.mutate(messagePayload);
        forceScrollRef.current = true;
    };

    useEffect(() => {
        if (!messagesEndRef.current) {
            return;
        }

        if (forceScrollRef.current || shouldAutoScrollRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            forceScrollRef.current = false;
        }
    }, [localMessages, isThinking]);

    const handleMessagesScroll = () => {
        const container = messagesContainerRef.current;

        if (!container) {
            return;
        }

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        shouldAutoScrollRef.current = distanceFromBottom < 120;
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner size="lg" />
                </div>
            </Layout>
        );
    }

    if (!session) {
        return (
            <Layout>
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                        Conversation not found
                    </h2>
                </div>
            </Layout>
        );
    }



    const validateFile = (file: File): boolean => {
        if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
            toast.error('Invalid file type. Please upload a PDF or image file.');
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error('File size must be less than 10MB.');
            return false;
        }
        return true;
    };

    const handleFileClick = () => {
        if (!sendMessageMutation.isPending) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && validateFile(file)) {
            setSelectedFile(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Layout>
            <div className="flex flex-col h-[calc(100vh-4rem)]">
                {/* Compact Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-5 py-3 mb-3 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-md">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-base font-semibold text-[var(--text-primary)] leading-tight">
                                    {sessionTitle || session.title}
                                </h1>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    {session.agent_details.name} • {session.agent_details.role}
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
                            <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${session.is_active
                                    ? 'bg-green-500/15 text-green-500 ring-1 ring-green-500/20'
                                    : 'bg-gray-500/15 text-gray-500 ring-1 ring-gray-500/20'
                                    }`}
                            >
                                {session.is_active ? '● Active' : '● Inactive'}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Messages Area — takes all remaining space */}
                <div
                    ref={messagesContainerRef}
                    onScroll={handleMessagesScroll}
                    className="flex-1 min-h-0 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5 overflow-y-auto scrollbar-hide mb-3 shadow-sm"
                >
                    <AnimatePresence>
                        {localMessages.length > 0 ? (
                            <div className="space-y-5">
                                {localMessages.map((msg, index) => (
                                    <div key={msg.id}>
                                        {/* User Message */}
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex justify-end mb-3"
                                        >
                                            <div className="max-w-[75%]">
                                                <div className="flex items-center justify-end gap-2 mb-1.5">
                                                    <span className="text-xs text-[var(--text-secondary)] font-medium">
                                                        {msg.is_client_query ? 'Client' : 'You'}
                                                    </span>
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${msg.is_client_query
                                                        ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                                                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                        }`}>
                                                        <User className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                </div>
                                                <div className={`text-white rounded-2xl rounded-tr-sm px-4 py-2.5 ${msg.is_client_query
                                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                                                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed">{msg.user_message}</p>

                                                    {/* Attachment Display */}
                                                    {msg.attachment_file && msg.attachment_file !== 'uploading...' && (
                                                        <a
                                                            href={msg.attachment_file}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-2 inline-flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 rounded-lg px-2.5 py-1.5 transition-colors"
                                                        >
                                                            {msg.attachment_file.endsWith('.pdf') ? (
                                                                <FileText className="w-3.5 h-3.5" />
                                                            ) : (
                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                            )}
                                                            <span>View Attachment</span>
                                                        </a>
                                                    )}

                                                    {/* Client Profile Badge */}
                                                    {msg.client_profile_data && Object.keys(msg.client_profile_data).length > 0 && (
                                                        <div className="mt-2 text-xs bg-green-500/20 border border-green-500/30 rounded-lg px-2.5 py-1">
                                                            ✅ Client profile extracted: {msg.client_profile_data.name || 'Unknown'}
                                                        </div>
                                                    )}

                                                    {/* Sending State */}
                                                    {msg.isPending && !msg.backend_message_id && (
                                                        <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide bg-white/15 rounded-full px-2.5 py-1">
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            Sending...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Agent Response */}
                                        {(msg.agent_response || msg.backend_message_id) ? (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 + 0.15 }}
                                                className="flex justify-start"
                                            >
                                                <div className="max-w-[75%]">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
                                                            <Bot className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                        <span className="text-xs text-[var(--text-secondary)] font-medium">
                                                            {session.agent_details.name}
                                                        </span>
                                                    </div>
                                                    <div className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-2xl rounded-tl-sm px-4 py-2.5">
                                                        <div className="markdown-content text-sm leading-relaxed">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {msg.agent_response || ''}
                                                            </ReactMarkdown>
                                                            {msg.isStreaming && (
                                                                <span className="inline-block ml-1 animate-pulse text-[var(--accent-primary)]">▋</span>
                                                            )}
                                                        </div>
                                                        {msg.response_time_ms && (
                                                            <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 opacity-70">
                                                                ⚡ {msg.response_time_ms}ms
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Client Profile Display */}
                                                    {msg.client_profile_data && Object.keys(msg.client_profile_data).length > 0 && (
                                                        <div className="mt-3">
                                                            <ClientProfileDisplay profile={msg.client_profile_data} />
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ) : null}
                                    </div>
                                ))}

                                {/* Thinking Indicator */}
                                {isThinking && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-2"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
                                            <Bot className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div className="bg-[var(--bg-tertiary)] rounded-2xl px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-[var(--text-secondary)]">
                                                    {thinkingMessage}
                                                </span>
                                                <div className="flex gap-1">
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                                                        className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full"
                                                    />
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                                                        className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full"
                                                    />
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                                                        className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-secondary)]/10 flex items-center justify-center">
                                        <Bot className="w-7 h-7 text-[var(--text-secondary)]" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                                        Start the conversation
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Send a message to begin chatting with {session.agent_details.name}
                                    </p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Compact Input Area */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-sm"
                >
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,.tif"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={sendMessageMutation.isPending}
                    />

                    {/* Selected file preview chip */}
                    <AnimatePresence>
                        {selectedFile && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pt-3 pb-1">
                                    <div className="inline-flex items-center gap-2 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-lg px-3 py-1.5">
                                        {selectedFile.type === 'application/pdf' ? (
                                            <FileText className="w-3.5 h-3.5 text-red-500" />
                                        ) : (
                                            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                                        )}
                                        <span className="text-xs font-medium text-[var(--text-primary)] max-w-[200px] truncate">
                                            {selectedFile.name}
                                        </span>
                                        <span className="text-[10px] text-[var(--text-secondary)]">
                                            {formatFileSize(selectedFile.size)}
                                        </span>
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className="ml-0.5 p-0.5 hover:bg-red-500/10 rounded transition-colors"
                                            title="Remove file"
                                        >
                                            <X className="w-3 h-3 text-[var(--text-secondary)] hover:text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSendMessage} className="p-3">
                        <div className="flex items-center gap-2">
                            {/* Mode Toggle — compact pills */}
                            <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-0.5 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setMessageType('user')}
                                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${messageType === 'user'
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    👤 User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMessageType('client')}
                                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${messageType === 'client'
                                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    💼 Client
                                </button>
                            </div>

                            {/* Paperclip attach button */}
                            <button
                                type="button"
                                onClick={handleFileClick}
                                disabled={sendMessageMutation.isPending}
                                className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${selectedFile
                                    ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                                    } disabled:opacity-50`}
                                title="Attach file (PDF or image)"
                            >
                                <Paperclip className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
                            </button>

                            {/* Text input */}
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={selectedFile ? 'Add a message about this file...' : 'Type your message...'}
                                className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-transparent transition-all duration-200"
                                disabled={sendMessageMutation.isPending}
                            />

                            {/* Send button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={(!message.trim() && !selectedFile) || sendMessageMutation.isPending}
                                className="p-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-md flex-shrink-0"
                            >
                                {sendMessageMutation.isPending ? (
                                    <Loader2 className="w-4.5 h-4.5 animate-spin" style={{ width: '18px', height: '18px' }} />
                                ) : (
                                    <Send className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
                                )}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </Layout>
    );
};
