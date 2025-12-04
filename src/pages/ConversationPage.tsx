import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FileUpload } from '@/components/FileUpload';
import { ClientProfileDisplay } from '@/components/ClientProfileDisplay';
import { conversationService, SendMessageData } from '@/services/conversation.service';

export const ConversationPage = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    // const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'user' | 'client'>('user');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { data: session, isLoading } = useQuery({
        queryKey: ['conversation', sessionId],
        queryFn: () => conversationService.getSession(sessionId!),
        enabled: !!sessionId,
    });

    const [localMessages, setLocalMessages] = useState<any[]>([]);

    useEffect(() => {
        if (session?.messages) {
            setLocalMessages(session.messages);
        }
    }, [session?.messages]);

    const sendMessageMutation = useMutation({
        mutationFn: (data: SendMessageData) =>
            conversationService.sendMessage(sessionId!, data),
        onMutate: async (newMessage) => {
            await queryClient.cancelQueries({ queryKey: ['conversation', sessionId] });

            const previousSession = queryClient.getQueryData(['conversation', sessionId]);

            // Optimistically add user message
            const optimisitcMessage = {
                id: Date.now().toString(),
                user_message: newMessage.message,
                is_user_query: newMessage.is_user_query,
                is_client_query: newMessage.is_client_query,
                attachment_file: newMessage.attachment_file ? 'uploading...' : undefined,
                agent_response: '', // Empty initially
                created_at: new Date().toISOString(),
            };

            setLocalMessages(prev => [...prev, optimisitcMessage]);
            setMessage('');
            setSelectedFile(null);

            return { previousSession };
        },
        onSuccess: (response) => {
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
        onError: (_err, _newTodo, context: any) => {
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

        const messageData: SendMessageData = {
            message: message.trim() || 'Uploaded document',
            is_user_query: messageType === 'user',
            is_client_query: messageType === 'client',
            attachment_file: selectedFile || undefined,
        };

        sendMessageMutation.mutate(messageData);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [session?.messages]);

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
                    <div className="flex items-center justify-between">
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
                                        {msg.agent_response ? (
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
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm]}
                                                                components={{
                                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                                                                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                                                                    li: ({ node, ...props }) => <li className="ml-2" {...props} />,
                                                                    strong: ({ node, ...props }) => <strong className="font-bold text-[var(--text-primary)]" {...props} />,
                                                                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                                                                    code: ({ node, className, children, ...props }) => {
                                                                        const match = /language-(\w+)/.exec(className || '');
                                                                        return !match ? (
                                                                            <code className="bg-[var(--bg-primary)] px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                                                                {children}
                                                                            </code>
                                                                        ) : (
                                                                            <code className={`block bg-[var(--bg-primary)] p-3 rounded-lg text-xs font-mono overflow-x-auto my-2 ${className}`} {...props}>
                                                                                {children}
                                                                            </code>
                                                                        );
                                                                    },
                                                                    h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0" {...props} />,
                                                                    h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0" {...props} />,
                                                                    h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0" {...props} />,
                                                                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-[var(--accent-primary)] pl-3 italic my-2" {...props} />,
                                                                    a: ({ node, ...props }) => <a className="text-[var(--accent-primary)] hover:underline" {...props} />,
                                                                }}
                                                            >
                                                                {msg.agent_response}
                                                            </ReactMarkdown>
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
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-center gap-2 mb-4"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="bg-[var(--bg-tertiary)] rounded-2xl px-4 py-3">
                                                    <div className="flex gap-1">
                                                        <motion.div
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                                                            className="w-2 h-2 bg-[var(--text-secondary)] rounded-full"
                                                        />
                                                        <motion.div
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                                                            className="w-2 h-2 bg-[var(--text-secondary)] rounded-full"
                                                        />
                                                        <motion.div
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                                                            className="w-2 h-2 bg-[var(--text-secondary)] rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
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
