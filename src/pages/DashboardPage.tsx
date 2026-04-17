import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Users, MessageSquare, TrendingUp, Plus,
    ArrowRight, Bot, Zap, Brain, Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import agentService, { type Agent } from '@/services/agent.service';
import { conversationService } from '@/services/conversation.service';

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};

// Smooth count-up hook using rAF
const useCountUp = (target: number, delayMs = 0, durationMs = 950) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let startTime: number | null = null;
        let id: number;
        const step = (ts: number) => {
            if (!startTime) startTime = ts + delayMs;
            if (ts < startTime) { id = requestAnimationFrame(step); return; }
            const elapsed = ts - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(target * eased));
            if (progress < 1) id = requestAnimationFrame(step);
        };
        id = requestAnimationFrame(step);
        return () => cancelAnimationFrame(id);
    }, [target, delayMs, durationMs]);
    return count;
};

const STAT_CONFIG = [
    {
        label: 'Total Agents',
        icon: Bot,
        gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
        iconBg: 'rgba(139,92,246,0.12)',
        iconColor: '#8b5cf6',
        glow: 'rgba(139,92,246,0.22)',
    },
    {
        label: 'Active Chats',
        icon: MessageSquare,
        gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)',
        iconBg: 'rgba(59,130,246,0.12)',
        iconColor: '#3b82f6',
        glow: 'rgba(59,130,246,0.22)',
    },
    {
        label: 'Total Messages',
        icon: TrendingUp,
        gradient: 'linear-gradient(135deg,#10b981,#059669)',
        iconBg: 'rgba(16,185,129,0.12)',
        iconColor: '#10b981',
        glow: 'rgba(16,185,129,0.22)',
    },
];

const StatCard = ({
    cfg, value, index,
}: { cfg: typeof STAT_CONFIG[0]; value: number; index: number }) => {
    const count = useCountUp(value, index * 140);
    return (
        <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1, duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -4, boxShadow: `0 20px 40px -12px ${cfg.glow}` }}
            className="relative overflow-hidden rounded-2xl p-6 card-glow transition-all duration-300"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        >
            {/* Ambient orb */}
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full pointer-events-none"
                style={{ background: cfg.gradient, opacity: 0.07, filter: 'blur(24px)', transform: 'translate(35%,-35%)' }} />

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {cfg.label}
                    </p>
                    <p className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{count}</p>
                </div>
                <motion.div
                    className="p-3 rounded-xl"
                    style={{ background: cfg.iconBg }}
                    animate={{ boxShadow: [`0 0 0 0 ${cfg.glow}`, `0 0 0 8px transparent`] }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <cfg.icon className="w-6 h-6" style={{ color: cfg.iconColor }} />
                </motion.div>
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full opacity-50"
                style={{ background: cfg.gradient }} />
        </motion.div>
    );
};

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

    const statValues = [
        agents?.count || 0,
        conversations?.results.filter(c => c.is_active).length || 0,
        conversations?.results.reduce((a, c) => a + c.message_count, 0) || 0,
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
                        <div className="flex items-center gap-2.5 mb-2.5">
                            <motion.div
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                                style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(139,92,246,0.2)' }}
                                animate={{ boxShadow: ['0 0 0 0 rgba(139,92,246,0.25)', '0 0 0 6px rgba(139,92,246,0)', '0 0 0 0 rgba(139,92,246,0)'] }}
                                transition={{ duration: 3.5, repeat: Infinity }}
                            >
                                <motion.span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#10b981' }}
                                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 1.6, repeat: Infinity }} />
                                AI Systems Online
                            </motion.div>
                        </div>
                        <h1 className="text-4xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                            {getGreeting()} 👋
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Here's what's happening with your AI sales team today.
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
                        New Agent
                    </motion.button>
                </motion.div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {STAT_CONFIG.map((cfg, i) => (
                        <StatCard key={cfg.label} cfg={cfg} value={statValues[i]} index={i} />
                    ))}
                </div>

                {/* ── Content grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* Recent Conversations */}
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.32, duration: 0.48 }}
                        className="lg:col-span-3 rounded-2xl p-6"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Recent Conversations</h2>
                            </div>
                            <button onClick={() => navigate('/conversations')}
                                className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-60"
                                style={{ color: 'var(--accent-primary)' }}>
                                View All <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            {!conversations?.results.length ? (
                                <div className="text-center py-12">
                                    <Bot className="w-10 h-10 mx-auto mb-3 opacity-15" style={{ color: 'var(--text-secondary)' }} />
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No conversations yet. Start chatting!</p>
                                </div>
                            ) : conversations.results.map((conv, i) => (
                                <motion.div
                                    key={conv.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.38 + i * 0.06 }}
                                    whileHover={{ x: 3 }}
                                    onClick={() => navigate(`/conversations/${conv.id}`)}
                                    className="group flex items-center gap-3.5 px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-200"
                                    style={{ background: 'var(--bg-tertiary)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-primary)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                                            style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }}>
                                            {conv.agent_details.name.charAt(0)}
                                        </div>
                                        {conv.is_active && (
                                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500"
                                                style={{ border: '2px solid var(--bg-tertiary)' }} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{conv.title}</p>
                                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                            {conv.agent_details.name} · {conv.message_count} msgs
                                        </p>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-30 transition-opacity"
                                        style={{ color: 'var(--text-secondary)' }} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right column */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.42, duration: 0.48 }}
                            className="rounded-2xl p-5"
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                                <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                                    Quick Actions
                                </h2>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { label: 'Create New Agent', icon: Plus, path: '/agents/create', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
                                    { label: 'Start a Chat', icon: MessageSquare, path: '/agents', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                                    { label: 'Browse Agents', icon: Users, path: '/agents', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                                ].map(({ label, icon: Icon, path, color, bg }) => (
                                    <motion.button
                                        key={label}
                                        whileHover={{ x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate(path)}
                                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-200"
                                        style={{ color: 'var(--text-primary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.borderColor = color + '44'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                                    >
                                        <div className="p-1.5 rounded-lg" style={{ background: bg }}>
                                            <Icon className="w-3.5 h-3.5" style={{ color }} />
                                        </div>
                                        {label}
                                        <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-25" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Agent roster */}
                        {!!agents?.results?.length && (
                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.52, duration: 0.48 }}
                                className="rounded-2xl p-5"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Brain className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                                    <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                                        Your Agents
                                    </h2>
                                </div>
                                <div className="space-y-1.5">
                                    {agents.results.slice(0, 4).map((agent: Agent, i: number) => (
                                        <motion.div
                                            key={agent.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.58 + i * 0.07 }}
                                            onClick={() => navigate(`/conversations/new?agent=${agent.id}`)}
                                            className="flex items-center gap-3 px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-200"
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                                    style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }}>
                                                    {agent.name.charAt(0)}
                                                </div>
                                                {agent.is_active && (
                                                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
                                                <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>{agent.role}</p>
                                            </div>
                                            <Zap className="w-3 h-3 flex-shrink-0 opacity-25" style={{ color: 'var(--accent-primary)' }} />
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </Layout>
    );
};
