import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Edit, Trash2, MessageSquare,
    Users, Bot, Clock, Sparkles, Zap, PenLine,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import agentService, { Agent } from '@/services/agent.service';

// Avatar gradient palette — deterministic by first character
const AVATAR_GRADIENTS = [
    ['#8b5cf6', '#7c3aed'],
    ['#3b82f6', '#2563eb'],
    ['#10b981', '#059669'],
    ['#f59e0b', '#d97706'],
    ['#ec4899', '#db2777'],
    ['#06b6d4', '#0891b2'],
];
const avatarGrad = (name: string) => AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

// ── Agent Card ─────────────────────────────────────────────────────────────────
const AgentCard = ({
    agent, index, onChat, onEdit, onDelete,
}: {
    agent: Agent;
    index: number;
    onChat: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) => {
    const [grad1, grad2] = avatarGrad(agent.name);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.07, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -5, boxShadow: `0 24px 48px -12px ${grad1}44` }}
            className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300 card-glow"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        >
            {/* Ambient corner glow */}
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${grad1}18, transparent)`, transform: 'translate(35%,-35%)' }} />

            {/* ── Avatar row ── */}
            <div className="flex items-start gap-4 mb-4">
                <div className="relative flex-shrink-0">
                    {/* Pulsing ring for active agents */}
                    {agent.is_active && (
                        <motion.div
                            className="absolute -inset-1.5 rounded-full"
                            style={{ background: `linear-gradient(135deg, ${grad1}, ${grad2})`, opacity: 0.25 }}
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    )}
                    <div
                        className="relative w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${grad1}, ${grad2})` }}
                    >
                        {agent.name.charAt(0)}
                    </div>
                    {agent.is_active && (
                        <motion.span
                            className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500"
                            style={{ border: '2.5px solid var(--bg-secondary)' }}
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    )}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-base font-bold truncate mb-0.5" style={{ color: 'var(--text-primary)' }}>
                        {agent.name}
                    </h3>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{agent.role}</p>
                    {agent.company && (
                        <p className="text-xs truncate mt-0.5 opacity-60" style={{ color: 'var(--text-secondary)' }}>
                            @ {agent.company}
                        </p>
                    )}
                </div>

                <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${agent.is_active ? 'text-emerald-500' : 'text-gray-400'}`}
                    style={{ background: agent.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(100,100,100,0.1)' }}>
                    {agent.is_active && (
                        <motion.span className="w-1 h-1 rounded-full bg-emerald-500 inline-block"
                            animate={{ scale: [1, 1.6, 1] }}
                            transition={{ duration: 1.4, repeat: Infinity }} />
                    )}
                    {agent.is_active ? 'Active' : 'Inactive'}
                </div>
            </div>

            {/* ── Stats row ── */}
            {agent.years_of_experience && (
                <div className="flex items-center gap-1.5 mb-3.5">
                    <Clock className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {agent.years_of_experience} yrs experience
                    </span>
                </div>
            )}

            {/* ── Skills ── */}
            {(agent.expertise_areas || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {(agent.expertise_areas || []).slice(0, 3).map(skill => (
                        <span key={skill}
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{
                                background: `${grad1}15`,
                                color: grad1,
                                border: `1px solid ${grad1}30`,
                            }}>
                            {skill}
                        </span>
                    ))}
                    {(agent.expertise_areas || []).length > 3 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px]"
                            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            +{(agent.expertise_areas || []).length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* ── Custom Message Style badge ── */}
            {agent.message_style && (
                <div className="flex items-center gap-1.5 mb-3.5">
                    <PenLine className="w-3 h-3 flex-shrink-0" style={{ color: grad1 }} />
                    <span className="text-[10px] font-semibold truncate" style={{ color: grad1 }}>
                        Custom Message Style
                    </span>
                </div>
            )}

            {/* ── Actions ── */}
            <div className="flex gap-2">
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onChat}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${grad1}, ${grad2})`, boxShadow: `0 4px 14px ${grad1}35` }}
                >
                    <motion.div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)' }}
                        animate={{ x: ['-120%', '220%'] }}
                        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.8 }} />
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={onEdit}
                    className="p-2.5 rounded-xl transition-all duration-200"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                >
                    <Edit className="w-4 h-4" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={onDelete}
                    className="p-2.5 rounded-xl transition-all duration-200"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                >
                    <Trash2 className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.div>
    );
};

// ── Page ───────────────────────────────────────────────────────────────────────
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
            toast.success('Agent deleted');
        },
        onError: () => toast.error('Failed to delete agent'),
    });

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Delete ${name}? This cannot be undone.`)) {
            deleteMutation.mutate(id);
        }
    };

    if (isError) {
        return (
            <Layout>
                <div className="card text-center py-16">
                    <h3 className="text-lg font-semibold text-red-500 mb-3">Failed to load agents</h3>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                        {error instanceof Error ? error.message : 'An error occurred'}
                    </p>
                    <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="space-y-7 pb-8 pt-2"
            >
                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="flex flex-wrap items-start justify-between gap-4"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Bot className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                                AI Agents
                            </span>
                        </div>
                        <h1 className="text-4xl font-black gradient-text mb-1">My AI Agents</h1>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Manage and deploy your AI-powered sales team
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(139,92,246,0.4)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/agents/create')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', boxShadow: '0 4px 16px rgba(139,92,246,0.3)' }}
                    >
                        <motion.div className="absolute inset-0 pointer-events-none"
                            style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)' }}
                            animate={{ x: ['-120%', '220%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }} />
                        <Plus className="w-4 h-4" />
                        Create Agent
                    </motion.button>
                </motion.div>

                {/* ── Search ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="relative"
                >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search agents by name or role…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: '2.75rem' }}
                    />
                </motion.div>

                {/* ── Grid ── */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-72">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : !agentsData?.results?.length ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl text-center py-20"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                    >
                        <div className="relative w-20 h-20 mx-auto mb-5">
                            <motion.div className="absolute inset-0 rounded-full"
                                style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', opacity: 0.12 }}
                                animate={{ scale: [1, 1.25, 1] }}
                                transition={{ duration: 3, repeat: Infinity }} />
                            <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(139,92,246,0.1)' }}>
                                <Users className="w-9 h-9" style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                            {searchQuery ? 'No agents found' : 'No agents yet'}
                        </h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            {searchQuery ? 'Try a different search term' : 'Create your first AI agent to get started'}
                        </p>
                        {!searchQuery && (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/agents/create')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
                                style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
                            >
                                <Sparkles className="w-4 h-4" />
                                Create Your First Agent
                            </motion.button>
                        )}
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {agentsData.results.map((agent, i) => (
                                <AgentCard
                                    key={agent.id}
                                    agent={agent}
                                    index={i}
                                    onChat={() => navigate(`/conversations/new?agent=${agent.id}`)}
                                    onEdit={() => navigate(`/agents/${agent.id}/edit`)}
                                    onDelete={() => handleDelete(agent.id, agent.name)}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                )}

                {/* Summary bar */}
                {!!agentsData?.results?.length && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center justify-center gap-6 pt-2"
                    >
                        {[
                            { icon: Bot, label: `${agentsData.results.length} total agents`, color: 'var(--accent-primary)' },
                            { icon: Zap, label: `${agentsData.results.filter(a => a.is_active).length} active`, color: '#10b981' },
                        ].map(({ icon: Icon, label, color }) => (
                            <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <Icon className="w-3.5 h-3.5" style={{ color }} />
                                {label}
                            </div>
                        ))}
                    </motion.div>
                )}
            </motion.div>
        </Layout>
    );
};
