import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useTransform,
    useSpring,
} from 'framer-motion';
import {
    Mail, Lock, User, Building, Briefcase, Loader2,
    Eye, EyeOff, CheckCircle2, Sparkles, Brain,
    ArrowRight, Shield, Bot, TrendingUp, BarChart3, Rocket,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { ThemeToggle } from '@/components/ThemeToggle';

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirm: z.string(),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    company_name: z.string().optional(),
    job_title: z.string().optional(),
}).refine((data) => data.password === data.password_confirm, {
    message: "Passwords don't match",
    path: ['password_confirm'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// ── Deterministic particles ──
const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: (i * 41 + 13) % 100,
    y: (i * 59 + 3) % 100,
    delay: (i * 0.23) % 5,
    duration: 3.2 + (i % 4) * 0.7,
    size: 1 + (i % 2),
}));

const Particle = ({ x, y, delay, duration, size }: {
    x: number; y: number; delay: number; duration: number; size: number;
}) => (
    <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: size + 1, height: size + 1, background: '#a78bfa', left: `${x}%`, top: `${y}%` }}
        animate={{ opacity: [0, 0.65, 0], y: [0, -40, -80], scale: [0, 1, 0] }}
        transition={{ duration, repeat: Infinity, delay, ease: 'easeOut' }}
    />
);

const ScanLine = () => (
    <motion.div
        className="absolute inset-x-0 pointer-events-none"
        style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.4) 40%, rgba(96,165,250,0.4) 60%, transparent 100%)',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
    />
);

// ── Live activity feed items ──
const ACTIVITIES = [
    { agent: 'Agent Alpha', action: 'Qualified 4 new prospects', icon: Bot, color: '#a78bfa', dot: '#8b5cf6' },
    { agent: 'Agent Beta', action: 'Sent 9 follow-up emails', icon: TrendingUp, color: '#60a5fa', dot: '#3b82f6' },
    { agent: 'Agent Gamma', action: 'Booked a discovery call', icon: Rocket, color: '#34d399', dot: '#10b981' },
    { agent: 'Agent Delta', action: 'Scored 14 lead profiles', icon: BarChart3, color: '#f59e0b', dot: '#f59e0b' },
];

const BENEFITS = [
    'Free to start — no credit card required',
    'Deploy your first agent in minutes',
    'Full analytics dashboard included',
    '24/7 AI-powered automated outreach',
];

// ── Stagger variants ──
const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ── Password field with show/hide toggle ──
const PasswordInput = ({
    fieldProps,
    placeholder,
    show,
    onToggle,
}: {
    fieldProps: React.InputHTMLAttributes<HTMLInputElement>;
    placeholder: string;
    show: boolean;
    onToggle: () => void;
}) => (
    <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-secondary)', width: 16, height: 16 }} />
        <input
            {...fieldProps}
            type={show ? 'text' : 'password'}
            className="input-field"
            placeholder={placeholder}
            style={{ paddingLeft: '2.5rem', paddingRight: '2.8rem' }}
        />
        <button type="button" onClick={onToggle} tabIndex={-1}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}>
            <AnimatePresence mode="wait" initial={false}>
                <motion.span key={show ? 'off' : 'on'} className="block"
                    initial={{ opacity: 0, rotate: -15, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 15, scale: 0.7 }}
                    transition={{ duration: 0.15 }}>
                    {show ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </motion.span>
            </AnimatePresence>
        </button>
    </div>
);

export const RegisterPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [activityIdx, setActivityIdx] = useState(0);

    // ── 3-D card parallax ──
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rawRotateX = useTransform(mouseY, [-200, 200], [4, -4]);
    const rawRotateY = useTransform(mouseX, [-200, 200], [-4, 4]);
    const rotateX = useSpring(rawRotateX, { stiffness: 120, damping: 22 });
    const rotateY = useSpring(rawRotateY, { stiffness: 120, damping: 22 });

    // ── Cycle activity feed ──
    useEffect(() => {
        const timer = setInterval(() => {
            setActivityIdx(i => (i + 1) % ACTIVITIES.length);
        }, 2800);
        return () => clearInterval(timer);
    }, []);

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            await authService.register(data);
            toast.success('Account created! Redirecting to login…');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

            {/* ═══════════════════════════════════
                LEFT HERO PANEL
            ═══════════════════════════════════ */}
            <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden select-none">
                {/* Dark gradient */}
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(135deg, #0f0030 0%, #0a1a3e 55%, #050814 100%)',
                }} />

                {/* Floating orbs */}
                {[
                    { size: 380, color: '#6d28d9', x: -15, y: -10, dur: 10 },
                    { size: 260, color: '#1d4ed8', x: 50, y: 40, dur: 14 },
                    { size: 200, color: '#be185d', x: 10, y: 65, dur: 12 },
                    { size: 180, color: '#065f46', x: 70, y: 10, dur: 9 },
                ].map((o, i) => (
                    <motion.div key={i} className="absolute rounded-full pointer-events-none"
                        style={{ width: o.size, height: o.size, background: o.color, left: `${o.x}%`, top: `${o.y}%`, filter: 'blur(90px)', opacity: 0.2 }}
                        animate={{ x: [0, 30, -20, 0], y: [0, -25, 35, 0], scale: [1, 1.1, 0.9, 1] }}
                        transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut' }}
                    />
                ))}

                {/* Dot grid */}
                <div className="absolute inset-0 opacity-[0.06]" style={{
                    backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                    backgroundSize: '26px 26px',
                }} />

                {/* Particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {PARTICLES.map(p => <Particle key={p.id} {...p} />)}
                </div>
                <ScanLine />

                {/* Geometric rings */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]">
                    {[120, 220, 320].map((r, i) => (
                        <motion.div key={i} className="absolute rounded-full"
                            style={{ width: r * 2, height: r * 2, border: '1px solid #a78bfa' }}
                            animate={{ rotate: i % 2 === 0 ? [0, 360] : [360, 0], scale: [1, 1.04, 1] }}
                            transition={{ duration: 20 + i * 5, repeat: Infinity, ease: 'linear' }}
                        />
                    ))}
                </div>

                {/* Top content */}
                <div className="relative z-10 space-y-7">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.35)', color: '#c4b5fd' }}>
                        <motion.span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }}
                            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.6, repeat: Infinity }} />
                        Start Your AI Journey
                    </motion.div>

                    {/* Title */}
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12 }}>
                        <h1 className="text-4xl font-black text-white leading-tight mb-2">
                            Scale Your Sales<br />
                            <span style={{ background: 'linear-gradient(90deg, #a78bfa, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                With AI
                            </span>
                        </h1>
                        <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                            Join thousands of sales teams automating their pipeline with intelligent AI agents.
                        </p>
                    </motion.div>

                    {/* Benefits list */}
                    <div className="space-y-2.5">
                        {BENEFITS.map((benefit, i) => (
                            <motion.div key={benefit}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.32 + i * 0.1 }}
                                className="flex items-center gap-3">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}>
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#34d399' }} />
                                </motion.div>
                                <span className="text-sm" style={{ color: '#94a3b8' }}>{benefit}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Live activity feed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.85 }}
                    className="relative z-10"
                >
                    <div className="mb-3 flex items-center gap-2">
                        <motion.span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }}
                            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }} />
                        <span className="text-xs font-medium" style={{ color: '#475569' }}>Agents working right now</span>
                    </div>

                    <div className="rounded-2xl overflow-hidden" style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            {ACTIVITIES.map((activity, i) => {
                                const Icon = activity.icon;
                                const isActive = i === activityIdx;
                                return (
                                    <motion.div key={activity.agent}
                                        animate={{
                                            background: isActive ? 'rgba(139,92,246,0.08)' : 'transparent',
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className="flex items-center gap-3 px-4 py-3">
                                        <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                                            style={{ background: isActive ? `${activity.dot}22` : 'rgba(255,255,255,0.05)' }}>
                                            <Icon className="w-3.5 h-3.5" style={{ color: isActive ? activity.color : '#475569' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate" style={{ color: isActive ? '#e2e8f0' : '#64748b' }}>
                                                {activity.agent}
                                            </p>
                                            <p className="text-xs truncate" style={{ color: isActive ? '#94a3b8' : '#334155' }}>
                                                {activity.action}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <motion.div
                                                className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                                                style={{ background: activity.dot }}
                                                animate={{ opacity: [1, 0.3, 1] }}
                                                transition={{ duration: 0.8, repeat: Infinity }}
                                            />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ═══════════════════════════════════
                RIGHT FORM PANEL
            ═══════════════════════════════════ */}
            <div
                className="flex-1 flex items-center justify-center py-8 px-6 relative overflow-y-auto"
                onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    mouseX.set(e.clientX - rect.left - rect.width / 2);
                    mouseY.set(e.clientY - rect.top - rect.height / 2);
                }}
                onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
            >
                {/* Ambient glow */}
                <motion.div
                    className="absolute pointer-events-none rounded-full"
                    style={{
                        width: 500, height: 500,
                        background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
                        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Theme toggle */}
                <div className="absolute top-5 right-5 z-10">
                    <ThemeToggle />
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="relative z-10 w-full max-w-[560px]"
                    style={{ perspective: 1000 }}
                >
                    {/* Mobile branding */}
                    <motion.div variants={item} className="lg:hidden text-center mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
                            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: 'var(--accent-primary)' }}>
                            <Sparkles className="w-3 h-3" />
                            AI-Powered Sales Platform
                        </div>
                        <h1 className="text-3xl font-black gradient-text">Sales Assistant</h1>
                    </motion.div>

                    {/* ── Card with parallax + animated border ── */}
                    <motion.div
                        variants={item}
                        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
                    >
                        <div className="relative" style={{ borderRadius: 28 }}>
                            {/* Spinning conic border */}
                            <motion.div
                                className="absolute pointer-events-none"
                                style={{
                                    inset: -1.5,
                                    borderRadius: 29.5,
                                    background: 'conic-gradient(from 0deg, #8b5cf6, #10b981, #3b82f6, #ec4899, #8b5cf6)',
                                    opacity: 0.5,
                                    zIndex: 0,
                                }}
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                            />

                            {/* Card body */}
                            <motion.div
                                className="relative rounded-3xl p-8"
                                style={{ background: 'var(--bg-secondary)', zIndex: 1 }}
                                animate={{
                                    boxShadow: [
                                        '0 32px 64px -12px rgba(139,92,246,0.16)',
                                        '0 32px 64px -12px rgba(16,185,129,0.14)',
                                        '0 32px 64px -12px rgba(59,130,246,0.16)',
                                        '0 32px 64px -12px rgba(139,92,246,0.16)',
                                    ],
                                }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                {/* Header */}
                                <motion.div variants={item} className="mb-6">
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <motion.div
                                            className="flex items-center justify-center w-10 h-10 rounded-xl"
                                            style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
                                            animate={{ boxShadow: ['0 0 0 0 rgba(139,92,246,0.4)', '0 0 0 8px rgba(139,92,246,0)', '0 0 0 0 rgba(139,92,246,0)'] }}
                                            transition={{ duration: 2.5, repeat: Infinity }}>
                                            <Brain className="w-5 h-5 text-white" />
                                        </motion.div>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                                            style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                            <motion.span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }}
                                                animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                                                transition={{ duration: 1.6, repeat: Infinity }} />
                                            AI Workspace
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create your account</h2>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        Set up your AI-powered sales workspace in seconds
                                    </p>
                                </motion.div>

                                {/* Form */}
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    {/* Name row */}
                                    <motion.div variants={item} className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                                First Name <span style={{ color: 'var(--accent-primary)' }}>*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                                    style={{ color: 'var(--text-secondary)', width: 15, height: 15 }} />
                                                <input {...register('first_name')} className="input-field" placeholder="John"
                                                    style={{ paddingLeft: '2.4rem', fontSize: '0.875rem' }} />
                                            </div>
                                            <AnimatePresence>
                                                {errors.first_name && (
                                                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }} className="mt-1 text-xs text-red-500">
                                                        {errors.first_name.message}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                                Last Name <span style={{ color: 'var(--accent-primary)' }}>*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                                    style={{ color: 'var(--text-secondary)', width: 15, height: 15 }} />
                                                <input {...register('last_name')} className="input-field" placeholder="Doe"
                                                    style={{ paddingLeft: '2.4rem', fontSize: '0.875rem' }} />
                                            </div>
                                            <AnimatePresence>
                                                {errors.last_name && (
                                                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }} className="mt-1 text-xs text-red-500">
                                                        {errors.last_name.message}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>

                                    {/* Email + Username row */}
                                    <motion.div variants={item} className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                                Email <span style={{ color: 'var(--accent-primary)' }}>*</span>
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                                    style={{ color: 'var(--text-secondary)', width: 15, height: 15 }} />
                                                <input {...register('email')} type="email" className="input-field"
                                                    placeholder="you@company.com" style={{ paddingLeft: '2.4rem', fontSize: '0.875rem' }} />
                                            </div>
                                            <AnimatePresence>
                                                {errors.email && (
                                                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }} className="mt-1 text-xs text-red-500">
                                                        {errors.email.message}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                                Username <span style={{ color: 'var(--accent-primary)' }}>*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                                    style={{ color: 'var(--text-secondary)', width: 15, height: 15 }} />
                                                <input {...register('username')} className="input-field"
                                                    placeholder="johndoe" style={{ paddingLeft: '2.4rem', fontSize: '0.875rem' }} />
                                            </div>
                                            <AnimatePresence>
                                                {errors.username && (
                                                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }} className="mt-1 text-xs text-red-500">
                                                        {errors.username.message}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>

                                    {/* Password row */}
                                    <motion.div variants={item} className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                                Password <span style={{ color: 'var(--accent-primary)' }}>*</span>
                                            </label>
                                            <PasswordInput
                                                fieldProps={{ ...register('password'), style: { fontSize: '0.875rem' } }}
                                                placeholder="Min. 8 characters"
                                                show={showPassword}
                                                onToggle={() => setShowPassword(v => !v)}
                                            />
                                            <AnimatePresence>
                                                {errors.password && (
                                                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }} className="mt-1 text-xs text-red-500">
                                                        {errors.password.message}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                                Confirm Password <span style={{ color: 'var(--accent-primary)' }}>*</span>
                                            </label>
                                            <PasswordInput
                                                fieldProps={{ ...register('password_confirm'), style: { fontSize: '0.875rem' } }}
                                                placeholder="Repeat password"
                                                show={showConfirm}
                                                onToggle={() => setShowConfirm(v => !v)}
                                            />
                                            <AnimatePresence>
                                                {errors.password_confirm && (
                                                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }} className="mt-1 text-xs text-red-500">
                                                        {errors.password_confirm.message}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>

                                    {/* Optional: Company + Job */}
                                    <motion.div variants={item} className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                                Company <span className="opacity-50">(optional)</span>
                                            </label>
                                            <div className="relative">
                                                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                                    style={{ color: 'var(--text-secondary)', width: 15, height: 15 }} />
                                                <input {...register('company_name')} className="input-field"
                                                    placeholder="Tech Corp" style={{ paddingLeft: '2.4rem', fontSize: '0.875rem' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                                Job Title <span className="opacity-50">(optional)</span>
                                            </label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                                    style={{ color: 'var(--text-secondary)', width: 15, height: 15 }} />
                                                <input {...register('job_title')} className="input-field"
                                                    placeholder="Sales Manager" style={{ paddingLeft: '2.4rem', fontSize: '0.875rem' }} />
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Submit */}
                                    <motion.div variants={item} className="pt-1">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.975 }}
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 relative overflow-hidden"
                                            style={{
                                                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                                color: 'white',
                                                fontSize: '0.95rem',
                                            }}
                                            animate={{
                                                boxShadow: [
                                                    '0 4px 18px rgba(139,92,246,0.38)',
                                                    '0 6px 24px rgba(16,185,129,0.3)',
                                                    '0 4px 18px rgba(59,130,246,0.38)',
                                                    '0 4px 18px rgba(139,92,246,0.38)',
                                                ],
                                            }}
                                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                        >
                                            {/* Shimmer sweep */}
                                            <motion.div
                                                className="absolute inset-0 pointer-events-none"
                                                style={{
                                                    background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
                                                }}
                                                animate={{ x: ['-120%', '220%'] }}
                                                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                                            />
                                            {isLoading ? (
                                                <>
                                                    <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />
                                                    <span>Creating workspace…</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Rocket style={{ width: 17, height: 17 }} />
                                                    <span>Create Account</span>
                                                    <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.3, repeat: Infinity }}>
                                                        <ArrowRight style={{ width: 15, height: 15 }} />
                                                    </motion.span>
                                                </>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                </form>

                                {/* Divider */}
                                <motion.div variants={item} className="my-5 flex items-center gap-3">
                                    <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                                    <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                                        style={{ background: 'rgba(139,92,246,0.08)', color: 'var(--accent-primary)', border: '1px solid rgba(139,92,246,0.18)' }}>
                                        <Shield className="w-3 h-3" />
                                        <span>AI Secured</span>
                                    </div>
                                    <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                                </motion.div>

                                {/* Login link */}
                                <motion.div variants={item} className="text-center">
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Already have an account?{' '}
                                        <Link to="/login"
                                            className="font-semibold transition-all hover:opacity-80 hover:tracking-wide"
                                            style={{ color: 'var(--accent-primary)' }}>
                                            Sign in →
                                        </Link>
                                    </p>
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};
