import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FileUpload } from '@/components/FileUpload';
import { ClientProfileDisplay } from '@/components/ClientProfileDisplay';
import { WebSocketStatusIndicator } from '@/components/WebSocketStatusIndicator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { conversationService, SendMessageData } from '@/services/conversation.service';
import { useAgentWebSocket } from '@/hooks/useAgentWebSocket';

export const ConversationPage = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    // const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'user' | 'client'>('user');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [thinkingMessage, setThinkingMessage] = useState('');

    // Get auth token for WebSocket
    const token = localStorage.getItem('access_token') || '';

    const { data: session, isLoading } = useQuery({
        queryKey: ['conversation', sessionId],
        queryFn: () => conversationService.getSession(sessionId!),
        enabled: !!sessionId,
    });

    const [localMessages, setLocalMessages] = useState<any[]>([]);

    // WebSocket hook
    const {
        status: wsStatus,
        isConnected,
        sendMessage: wsSendMessage,
        reconnect,
        reconnectAttempts,
    } = useAgentWebSocket({
        agentId: session?.agent || '',
        token,
        enabled: !!session?.agent && !!token,
        onConnectionEstablished: (data) => {
            console.log('Connected to agent:', data.agent_name);
            toast.success(`Connected to ${data.agent_name}`, { duration: 2000 });
        },
        onAgentThinking: (data) => {
            console.log('💭 Agent is thinking:', data.message);
            setIsThinking(true);
            setThinkingMessage(data.message || 'Thinking...');
        },
        onStreamStart: (data) => {
            console.log('🌊 Stream started for message:', data.message_id);
            setIsThinking(false);

            // Add the backend_message_id to the last user message so we can associate streaming chunks with it
            setLocalMessages(prev => {
                const lastIdx = prev.length - 1;
                if (lastIdx >= 0 && prev[lastIdx].user_message && !prev[lastIdx].backend_message_id) {
                    const updated = [...prev];
                    updated[lastIdx] = {
                        ...updated[lastIdx],
                        backend_message_id: data.message_id,
                        agent_response: '', // Initialize empty agent response for streaming
                        isStreaming: true,
                    };
                    return updated;
                }
                return prev;
            });
        },
        onAgentStreaming: (data) => {
            console.log('📝 Streaming chunk:', data.chunk);

            setLocalMessages((prev) => {
                // Find the message with this backend_message_id
                const msgIndex = prev.findIndex(
                    (msg) => msg.backend_message_id === data.message_id
                );

                if (msgIndex >= 0) {
                    // Update existing message by APPENDING the chunk
                    const updated = [...prev];
                    updated[msgIndex] = {
                        ...updated[msgIndex],
                        agent_response: (updated[msgIndex].agent_response || '') + data.chunk,
                        isStreaming: true,
                    };
                    return updated;
                } else {
                    // This shouldn't happen if stream_start worked correctly
                    // But as a fallback, find the last user message and update it
                    const lastUserMsgIndex = prev.length - 1;
                    if (lastUserMsgIndex >= 0) {
                        const updated = [...prev];
                        updated[lastUserMsgIndex] = {
                            ...updated[lastUserMsgIndex],
                            backend_message_id: data.message_id,
                            agent_response: (updated[lastUserMsgIndex].agent_response || '') + data.chunk,
                            isStreaming: true,
                        };
                        return updated;
                    }
                    return prev;
                }
            });
        },
        onAgentComplete: (data) => {
            console.log('✅ Stream complete:', data.message_id);

            setIsThinking(false);

            // Mark message as complete (stop showing cursor)
            setLocalMessages((prev) =>
                prev.map((msg) =>
                    msg.backend_message_id === data.message_id
                        ? {
                            ...msg,
                            isStreaming: false,
                            agent_response: data.full_response,
                            response_time_ms: data.response_time_ms,
                        }
                        : msg
                )
            );

            // Invalidate query to get fresh data
            queryClient.invalidateQueries({ queryKey: ['conversation', sessionId] });
        },
        onError: (data) => {
            setIsThinking(false);
            toast.error(data.message || 'WebSocket error occurred');
        },
    });

    useEffect(() => {
        if (session?.messages) {
            setLocalMessages(session.messages);
        }
    }, [session?.messages]);

    // Fallback mutation for file uploads (WebSocket doesn't support file uploads)
    const sendMessageMutation = useMutation({
        mutationFn: (data: SendMessageData) =>
            conversationService.sendMessage(sessionId!, data),
        onMutate: async (newMessage: SendMessageData) => {
            await queryClient.cancelQueries({ queryKey: ['conversation', sessionId] });

            const previousSession = queryClient.getQueryData(['conversation', sessionId]);

            // Optimistically add user message
            const optimisticMessage = {
                id: Date.now().toString(),
                user_message: newMessage.message,
                is_user_query: newMessage.is_user_query,
                is_client_query: newMessage.is_client_query,
                attachment_file: newMessage.attachment_file ? 'uploading...' : undefined,
                agent_response: '', // Empty initially
                created_at: new Date().toISOString(),
            };

            setLocalMessages(prev => [...prev, optimisticMessage]);
            setMessage('');
            setSelectedFile(null);

            return { previousSession };
        },
        onSuccess: (response: any) => {
            // Update with real response
            setLocalMessages(prev => {
                const newMessages = [...prev];
                // Replace the last message (optimistic) with the real one
                newMessages[newMessages.length - 1] = response.data;
                return newMessages;
            });

            // Show success toast for client profile extraction
            if (response.client_profile_extracted && response.data.client_profile_data) {
                const clientName = response.data.client_profile_data.name || 'Client';
                toast.success(`Client profile extracted successfully for ${clientName}!`, {
                    duration: 4000,
                    icon: '✅',
                });
            }

            queryClient.invalidateQueries({ queryKey: ['conversation', sessionId] });
        },
        onError: (_err: any, _newTodo: any, context: any) => {
            toast.error('Failed to send message');
            setSelectedFile(null); // Clear file on error
            if (context?.previousSession) {
                queryClient.setQueryData(['conversation', sessionId], context.previousSession);
            }
        },
    });

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() && !selectedFile) {
            toast.error('Please enter a message or attach a file');
            return;
        }

        // If there's a file attachment, use REST API
        if (selectedFile) {
            const messageData: SendMessageData = {
                message: message.trim() || 'Uploaded document',
                is_user_query: messageType === 'user',
                is_client_query: messageType === 'client',
                attachment_file: selectedFile,
            };
            sendMessageMutation.mutate(messageData);
            return;
        }

        // Otherwise, use WebSocket for streaming
        if (isConnected) {
            // Add user message optimistically
            const userMessage = {
                id: `user-${Date.now()}`,
                user_message: message.trim(),
                is_user_query: messageType === 'user',
                is_client_query: messageType === 'client',
                agent_response: '',
                created_at: new Date().toISOString(),
            };
            setLocalMessages(prev => [...prev, userMessage]);

            // Send via WebSocket
            const sent = wsSendMessage(
                sessionId!,
                message.trim(),
                messageType === 'user',
                messageType === 'client'
            );

            if (sent) {
                setMessage('');
            } else {
                toast.error('Failed to send message. Please try again.');
                // Remove optimistic message
                setLocalMessages(prev => prev.slice(0, -1));
            }
        } else {
            toast.error('Not connected to server. Please wait or reconnect.');
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [localMessages, isThinking]);

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

    return (
        <Layout>
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card mb-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                                {session.title}
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Chat with {session.agent_details.name} • {session.agent_details.role}
                            </p>
                        </div>
                        <span
                            className={`px-4 py-2 rounded-full text-sm font-semibold ${session.is_active
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-gray-500/20 text-gray-500'
                                }`}
                        >
                            {session.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    {/* WebSocket Status Indicator */}
                    <WebSocketStatusIndicator
                        status={wsStatus}
                        reconnectAttempts={reconnectAttempts}
                        onReconnect={reconnect}
                    />
                </motion.div>

                {/* Messages */}
                <div className="flex-1 card overflow-y-auto scrollbar-hide mb-6">
                    <AnimatePresence>
                        {localMessages.length > 0 ? (
                            <div className="space-y-6">
                                {localMessages.map((msg, index) => (
                                    <div key={msg.id}>
                                        {/* User Message */}
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex justify-end mb-4"
                                        >
                                            <div className="max-w-[70%]">
                                                <div className="flex items-center justify-end gap-2 mb-2">
                                                    <span className="text-sm text-[var(--text-secondary)]">
                                                        {msg.is_client_query ? 'Client' : 'You'}
                                                    </span>
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                                                    <p className="text-sm">{msg.user_message}</p>

                                                    {/* Attachment Display */}
                                                    {msg.attachment_file && msg.attachment_file !== 'uploading...' && (
                                                        <a
                                                            href={msg.attachment_file}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-2 flex items-center gap-2 text-xs bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 transition-colors"
                                                        >
                                                            {msg.attachment_file.endsWith('.pdf') ? (
                                                                <FileText className="w-4 h-4" />
                                                            ) : (
                                                                <ImageIcon className="w-4 h-4" />
                                                            )}
                                                            <span>View Attachment</span>
                                                        </a>
                                                    )}

                                                    {/* Client Profile Badge */}
                                                    {msg.client_profile_data && Object.keys(msg.client_profile_data).length > 0 && (
                                                        <div className="mt-2 text-xs bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1.5">
                                                            ✅ Client profile extracted: {msg.client_profile_data.name || 'Unknown'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Agent Response or Typing Indicator */}
                                        {(msg.agent_response || msg.backend_message_id) ? (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.2 }}
                                                className="flex justify-start"
                                            >
                                                <div className="max-w-[70%]">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                                            <Bot className="w-4 h-4 text-white" />
                                                        </div>
                                                        <span className="text-sm text-[var(--text-secondary)]">
                                                            {session.agent_details.name}
                                                        </span>
                                                    </div>
                                                    <div className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-2xl rounded-tl-sm px-4 py-3">
                                                        <div className="markdown-content text-sm">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {msg.agent_response || ''}
                                                            </ReactMarkdown>
                                                            {/* Blinking cursor while streaming */}
                                                            {msg.isStreaming && (
                                                                <span className="inline-block ml-1 animate-pulse text-[var(--accent-primary)]">▋</span>
                                                            )}
                                                        </div>
                                                        {msg.response_time_ms && (
                                                            <p className="text-xs text-[var(--text-secondary)] mt-2">
                                                                Response time: {msg.response_time_ms}ms
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Client Profile Display */}
                                                    {msg.client_profile_data && Object.keys(msg.client_profile_data).length > 0 && (
                                                        <div className="mt-4">
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
                                        className="flex items-center gap-2 mb-4"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="bg-[var(--bg-tertiary)] rounded-2xl px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-[var(--text-secondary)]">
                                                    {thinkingMessage}
                                                </span>
                                                <div className="flex gap-1">
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                                                        className="w-2 h-2 bg-[var(--accent-primary)] rounded-full"
                                                    />
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                                                        className="w-2 h-2 bg-[var(--accent-primary)] rounded-full"
                                                    />
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                                                        className="w-2 h-2 bg-[var(--accent-primary)] rounded-full"
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
                                    <Bot className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
                                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                                        Start the conversation
                                    </h3>
                                    <p className="text-[var(--text-secondary)]">
                                        Send a message to begin chatting with {session.agent_details.name}
                                    </p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                >
                    <form onSubmit={handleSendMessage} className="space-y-4">
                        {/* Message Type Toggle */}
                        <div className="flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={() => setMessageType('user')}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${messageType === 'user'
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                    }`}
                            >
                                🤔 User Query
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={() => setMessageType('client')}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${messageType === 'client'
                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                    }`}
                            >
                                💼 Client Message
                            </motion.button>
                        </div>

                        {/* File Upload */}
                        <FileUpload
                            onFileSelect={setSelectedFile}
                            selectedFile={selectedFile}
                            disabled={sendMessageMutation.isPending}
                        />

                        {/* Input Field */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={selectedFile ? 'Add a message about this file...' : 'Type your message...'}
                                className="input-field flex-1"
                                disabled={sendMessageMutation.isPending}
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={(!message.trim() && !selectedFile) || sendMessageMutation.isPending}
                                className="btn-primary px-6 flex items-center gap-2"
                            >
                                {sendMessageMutation.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Send</span>
                                        <Send className="w-4 h-4" />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </Layout >
    );
};
