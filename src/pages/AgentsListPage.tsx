import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MessageSquare, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import agentService, { Agent } from '@/services/agent.service';

export const AgentsListPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: agentsData, isLoading, error, isError } = useQuery<{ results: Agent[] }>({
        queryKey: ['agents', searchQuery],
        queryFn: () => agentService.getAgents({ search: searchQuery }),
        retry: false,
    });

    const deleteMutation = useMutation({
        mutationFn: agentService.deleteAgent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            toast.success('Agent deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete agent');
        },
    });

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            deleteMutation.mutate(id);
        }
    };

    // Show error state
    if (isError) {
        return (
            <Layout>
                <div className="card text-center py-16">
                    <h3 className="text-xl font-semibold text-red-500 mb-4">
                        Failed to load agents
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-6">
                        {error instanceof Error ? error.message : 'An error occurred while fetching agents'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary"
                    >
                        Retry
                    </button>
                </div>
            </Layout>
        );
    }

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
                        <h1 className="text-4xl font-bold gradient-text mb-2">My AI Agents</h1>
                        <p className="text-[var(--text-secondary)]">Manage your sales assistant agents</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/agents/create')}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Agent</span>
                    </motion.button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                    <input
                        type="text"
                        placeholder="Search agents by name or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-12 w-full"
                    />
                </div>

                {/* Agents Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-96">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : !agentsData?.results || agentsData.results.length === 0 ? (
                    <div className="card text-center py-16">
                        <Users className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
                        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                            No agents found
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-6">
                            {searchQuery ? 'Try a different search term' : 'Create your first AI agent to get started'}
                        </p>
                        {!searchQuery && (
                            <button onClick={() => navigate('/agents/create')} className="btn-primary">
                                Create Your First Agent
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agentsData?.results.map((agent, index) => (
                            <motion.div
                                key={agent.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="card group hover:shadow-2xl"
                            >
                                {/* Agent Avatar */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-2xl font-bold">
                                        {agent.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                                            {agent.name}
                                        </h3>
                                        <p className="text-sm text-[var(--text-secondary)]">{agent.role}</p>
                                    </div>
                                </div>

                                {/* Agent Details */}
                                <div className="space-y-2 mb-4">
                                    {agent.company && (
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            <span className="font-semibold">Company:</span> {agent.company}
                                        </p>
                                    )}
                                    {agent.years_of_experience && (
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            <span className="font-semibold">Experience:</span> {agent.years_of_experience} years
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {(agent.expertise_areas || []).slice(0, 3).map((skill) => (
                                            <span
                                                key={skill}
                                                className="px-2 py-1 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] 
                                 rounded-full text-xs font-semibold"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                        {(agent.expertise_areas || []).length > 3 && (
                                            <span className="px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-full text-xs">
                                                +{(agent.expertise_areas || []).length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="mb-4">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${agent.is_active
                                            ? 'bg-green-500/20 text-green-500'
                                            : 'bg-gray-500/20 text-gray-500'
                                            }`}
                                    >
                                        {agent.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate(`/conversations/new?agent=${agent.id}`)}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] 
                             text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 
                             flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        <span>Chat</span>
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate(`/agents/${agent.id}/edit`)}
                                        className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] 
                             rounded-lg hover:bg-[var(--bg-primary)] transition-all duration-300"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleDelete(agent.id, agent.name)}
                                        className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg 
                             hover:bg-red-500/30 transition-all duration-300"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </Layout>
    );
};
