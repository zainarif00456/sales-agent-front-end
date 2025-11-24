import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageSquare, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { conversationService } from '@/services/conversation.service';

export const ConversationsListPage = () => {
    const navigate = useNavigate();

    const { data: sessionsData, isLoading } = useQuery({
        queryKey: ['conversations'],
        queryFn: () => conversationService.getSessions({ page: 1, page_size: 20 }),
    });

    return (
        <Layout>
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
                ) : sessionsData?.results.length === 0 ? (
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
                    <div className="grid grid-cols-1 gap-4">
                        {sessionsData?.results.map((session, index) => (
                            <motion.div
                                key={session.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
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
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </Layout>
    );
};
