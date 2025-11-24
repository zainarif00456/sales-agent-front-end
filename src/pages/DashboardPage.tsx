import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, MessageSquare, TrendingUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { agentService } from '@/services/agent.service';
import { conversationService } from '@/services/conversation.service';

export const DashboardPage = () => {
    const navigate = useNavigate();

    const { data: agents, isLoading: agentsLoading } = useQuery({
        queryKey: ['agents'],
        queryFn: () => agentService.getAgents(),
    });

    const { data: conversations, isLoading: conversationsLoading } = useQuery({
        queryKey: ['recent-conversations'],
        queryFn: () => conversationService.getSessions({ page: 1, page_size: 5 }),
    });

    const stats = [
        {
            label: 'Total Agents',
            value: agents?.count || 0,
            icon: Users,
            color: 'from-purple-500 to-purple-600',
        },
        {
            label: 'Active Chats',
            value: conversations?.results.filter((c) => c.is_active).length || 0,
            icon: MessageSquare,
            color: 'from-blue-500 to-blue-600',
        },
        {
            label: 'Total Messages',
            value: conversations?.results.reduce((acc, c) => acc + c.message_count, 0) || 0,
            icon: TrendingUp,
            color: 'from-green-500 to-green-600',
        },
    ];

    if (agentsLoading || conversationsLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner size="lg" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
                    <p className="text-[var(--text-secondary)]">Welcome back! Here's your overview.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="card hover:scale-105 transition-transform duration-300"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[var(--text-secondary)] text-sm font-medium mb-1">
                                        {stat.label}
                                    </p>
                                    <p className="text-4xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                                </div>
                                <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.color}`}>
                                    <stat.icon className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Recent Conversations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Recent Conversations</h2>
                        <button
                            onClick={() => navigate('/conversations')}
                            className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] font-semibold transition-colors"
                        >
                            View All
                        </button>
                    </div>

                    <div className="space-y-4">
                        {conversations?.results.length === 0 ? (
                            <p className="text-center text-[var(--text-secondary)] py-8">
                                No conversations yet. Start chatting with your agents!
                            </p>
                        ) : (
                            conversations?.results.map((conversation) => (
                                <motion.div
                                    key={conversation.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => navigate(`/conversations/${conversation.id}`)}
                                    className="p-4 bg-[var(--bg-tertiary)] rounded-lg cursor-pointer 
                           hover:bg-[var(--bg-primary)] transition-all duration-300 border border-[var(--border-color)]"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                                                {conversation.title}
                                            </h3>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                with {conversation.agent_details.name} • {conversation.message_count} messages
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${conversation.is_active
                                                        ? 'bg-green-500/20 text-green-500'
                                                        : 'bg-gray-500/20 text-gray-500'
                                                    }`}
                                            >
                                                {conversation.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/agents/create')}
                        className="card hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 py-8"
                    >
                        <Plus className="w-6 h-6 text-[var(--accent-primary)]" />
                        <span className="text-xl font-semibold gradient-text">Create New Agent</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/agents')}
                        className="card hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 py-8"
                    >
                        <MessageSquare className="w-6 h-6 text-[var(--accent-secondary)]" />
                        <span className="text-xl font-semibold gradient-text">Start New Chat</span>
                    </motion.button>
                </motion.div>
            </motion.div>
        </Layout>
    );
};
