import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { conversationService } from '@/services/conversation.service';

interface DeleteModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirmModal = ({ onConfirm, onCancel }: DeleteModalProps) => (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={onCancel}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="card max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">Delete Conversation</h3>
                        <p className="text-sm text-[var(--text-secondary)]">This action cannot be undone.</p>
                    </div>
                </div>
                <p className="text-[var(--text-secondary)] mb-6">
                    Are you sure you want to delete this conversation? All messages will be permanently removed.
                </p>
                <div className="flex items-center gap-3 justify-end">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCancel}
                        className="btn-secondary px-5 py-2"
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onConfirm}
                        className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors duration-200"
                    >
                        Delete
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

export const ConversationsListPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['conversations'],
        queryFn: ({ pageParam = 1 }) =>
            conversationService.getSessions({ page: pageParam as number, page_size: 20 }),
        getNextPageParam: (lastPage) => {
            if (!lastPage.next) return undefined;
            const url = new URL(lastPage.next);
            const page = url.searchParams.get('page');
            return page ? parseInt(page, 10) : undefined;
        },
        initialPageParam: 1,
    });

    const sessions = data?.pages.flatMap((p) => p.results) ?? [];
    const totalCount = data?.pages[0]?.count ?? 0;

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const deleteSessionMutation = useMutation({
        mutationFn: (sessionId: string) => conversationService.deleteSession(sessionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast.success('Conversation deleted successfully');
            setDeletingSessionId(null);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to delete conversation');
            setDeletingSessionId(null);
        },
    });

    const handleDeleteClick = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setPendingDeleteId(sessionId);
    };

    const handleConfirmDelete = () => {
        if (pendingDeleteId) {
            setDeletingSessionId(pendingDeleteId);
            deleteSessionMutation.mutate(pendingDeleteId);
        }
        setPendingDeleteId(null);
    };

    const handleCancelDelete = () => {
        setPendingDeleteId(null);
    };

    return (
        <Layout>
            {pendingDeleteId && (
                <DeleteConfirmModal
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                />
            )}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">Conversations</h1>
                        <p className="text-[var(--text-secondary)]">View and manage your chat sessions</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/agents')}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Conversation</span>
                    </motion.button>
                </div>

                {/* Conversations List */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-96">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="card text-center py-16">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
                        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                            No conversations yet
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-6">
                            Start chatting with your AI agents to see conversations here
                        </p>
                        <button onClick={() => navigate('/agents')} className="btn-primary">
                            Browse Agents
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Showing {sessions.length} of {totalCount} conversations
                        </p>
                        <div className="grid grid-cols-1 gap-4">
                            {sessions.map((session, index) => (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => navigate(`/conversations/${session.id}`)}
                                    className="card cursor-pointer hover:shadow-2xl"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
                                                <MessageSquare className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                                                    {session.title}
                                                </h3>
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    with {session.agent_details.name} • {session.message_count} messages
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${session.is_active
                                                            ? 'bg-green-500/20 text-green-500'
                                                            : 'bg-gray-500/20 text-gray-500'
                                                        }`}
                                                >
                                                    {session.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <p className="text-xs text-[var(--text-secondary)] mt-2">
                                                    {new Date(session.updated_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={(e) => handleDeleteClick(session.id, e)}
                                                disabled={deletingSessionId === session.id}
                                                className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
                                                title="Delete conversation"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Infinite scroll sentinel */}
                        <div ref={sentinelRef} className="py-4 flex justify-center">
                            {isFetchingNextPage && (
                                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </Layout>
    );
};
