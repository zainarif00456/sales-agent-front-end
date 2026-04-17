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
    Mail, Lock, Loader2, Eye, EyeOff,
    Bot, Zap, Target, Brain, Sparkles, ArrowRight, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { ThemeToggle } from '@/components/ThemeToggle';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginFormData = z.infer<typeof loginSchema>;

// ── Deterministic particles (no random, avoids re-render flicker) ──
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: (i * 37 + 11) % 100,
    y: (i * 53 + 7) % 100,
    delay: (i * 0.27) % 5,
    duration: 3.5 + (i % 3) * 0.8,
    size: 1 + (i % 2),
}));

const Particle = ({ x, y, delay, duration, size }: {
    x: number; y: number; delay: number; duration: number; size: number;
}) => (
    <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: size + 1, height: size + 1, background: '#a78bfa', left: `${x}%`, top: `${y}%` }}
        animate={{ opacity: [0, 0.7, 0], y: [0, -40, -80], scale: [0, 1, 0] }}
        transition={{ duration, repeat: Infinity, delay, ease: 'easeOut' }}
    />
);

// ── Horizontal scan line ──
const ScanLine = () => (
    <motion.div
        className="absolute inset-x-0 pointer-events-none"
        style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.4) 40%, rgba(96,165,250,0.4) 60%, transparent 100%)',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
    />
);

// ── Neural network ──
const NeuralNet = () => {
    const nodes: [number, number, number][] = [
        [50, 50, 0], [20, 28, 0.3], [80, 28, 0.6], [14, 65, 0.9],
        [86, 65, 1.2], [50, 14, 1.5], [50, 86, 1.8], [35, 48, 0.4], [65, 48, 0.7],
    ];
    const edges: [number, number, number, number][] = [
        [50, 50, 20, 28], [50, 50, 80, 28], [50, 50, 14, 65], [50, 50, 86, 65],
        [50, 50, 35, 48], [50, 50, 65, 48], [20, 28, 50, 14], [80, 28, 50, 14],
        [20, 28, 14, 65], [80, 28, 86, 65], [14, 65, 50, 86], [86, 65, 50, 86],
        [35, 48, 20, 28], [65, 48, 80, 28],
    ];
    return (
        <svg className="absolute inset-0 w-full h-full opacity-[0.18]" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="lg-node" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="lg-edge" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
                </linearGradient>
            </defs>
            {edges.map(([x1, y1, x2, y2], i) => (
                <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="url(#lg-edge)" strokeWidth="0.4"
                    animate={{ opacity: [0.1, 0.75, 0.1], strokeWidth: ['0.3', '0.6', '0.3'] }}
                    transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                />
            ))}
            {nodes.map(([cx, cy, delay], i) => (
                <motion.circle key={i} cx={cx} cy={cy} r={2.5} fill="url(#lg-node)"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: delay as number, ease: 'easeInOut' }}
                />
            ))}
        </svg>
    );
};

const AI_FEATURES = [
    'Intelligent Sales Automation',
    'AI-Powered Conversations',
    'Smart Lead Qualification',
    'Real-time Analytics',
    'Autonomous Outreach',
];

const FEATURES = [
    { icon: Bot, label: 'AI Sales Agents', desc: 'Deploy intelligent agents that handle outreach automatically', color: '#a78bfa' },
    { icon: Zap, label: 'Instant Responses', desc: 'Sub-second AI responses keep conversations flowing', color: '#60a5fa' },
    { icon: Target, label: 'Smart Targeting', desc: 'AI identifies and prioritises your best opportunities', color: '#34d399' },
];

const STATS = [
    { value: '10k+', label: 'Conversations' },
    { value: '98%', label: 'Satisfaction' },
    { value: '3×', label: 'More Leads' },
];

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const LoginPage = () => {
    const navigate = useNavigate();
    const { setUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [typedText, setTypedText] = useState('');
    const [featureIdx, setFeatureIdx] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    // ── 3-D card parallax ──
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rawRotateX = useTransform(mouseY, [-200, 200], [5, -5]);
    const rawRotateY = useTransform(mouseX, [-200, 200], [-5, 5]);
    const rotateX = useSpring(rawRotateX, { stiffness: 120, damping: 22 });
    const rotateY = useSpring(rawRotateY, { stiffness: 120, damping: 22 });

    // ── Typewriter ──
    useEffect(() => {
        const current = AI_FEATURES[featureIdx];
        const speed = isDeleting ? 35 : 75;
        const timer = setTimeout(() => {
            if (!isDeleting) {
                if (typedText.length < current.length) {
                    setTypedText(current.slice(0, typedText.length + 1));
                } else {
                    setTimeout(() => setIsDeleting(true), 2200);
                }
            } else {
                if (typedText.length > 0) {
                    setTypedText(typedText.slice(0, -1));
                } else {
                    setIsDeleting(false);
                    setFeatureIdx((featureIdx + 1) % AI_FEATURES.length);
                }
            }
        }, speed);
        return () => clearTimeout(timer);
    }, [typedText, featureIdx, isDeleting]);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const response = await authService.login(data);
            localStorage.setItem('access_token', response.access);
            localStorage.setItem('refresh_token', response.refresh);
            localStorage.setItem('user', JSON.stringify(response.user));
            setUser(response.user);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

            {/* ═══════════════════════════════════
                LEFT HERO PANEL
            ═══════════════════════════════════ */}
            <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-14 overflow-hidden select-none">
                {/* Dark gradient base */}
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(135deg, #12002e 0%, #0d1b4b 55%, #07091a 100%)',
                }} />

                {/* Floating orbs */}
                {[
                    { size: 400, color: '#7c3aed', x: -12, y: -15, dur: 9 },
                    { size: 300, color: '#2563eb', x: 55, y: 35, dur: 13 },
                    { size: 230, color: '#db2777', x: 5, y: 58, dur: 11 },
                ].map((o, i) => (
                    <motion.div key={i} className="absolute rounded-full pointer-events-none"
                        style={{ width: o.size, height: o.size, background: o.color, left: `${o.x}%`, top: `${o.y}%`, filter: 'blur(90px)', opacity: 0.22 }}
                        animate={{ x: [0, 35, -25, 0], y: [0, -28, 38, 0], scale: [1, 1.12, 0.88, 1] }}
                        transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut' }}
                    />
                ))}

                {/* Dot grid */}
                <div className="absolute inset-0 opacity-[0.065]" style={{
                    backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }} />

                {/* Particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {PARTICLES.map(p => <Particle key={p.id} {...p} />)}
                </div>

                {/* Scan line */}
                <ScanLine />

                {/* Neural network */}
                <NeuralNet />

                {/* Top content */}
                <div className="relative z-10 space-y-8">
                    {/* Badge with live dot */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.35)', color: '#c4b5fd' }}
                    >
                        <motion.span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }}
                            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                        />
                        AI-Powered Sales Platform
                    </motion.div>

                    {/* Title + Typewriter */}
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12 }}>
                        <h1 className="text-5xl font-black text-white leading-tight mb-3">
                            Sales<br />
                            <span style={{ background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Assistant
                            </span>
                        </h1>
                        <div className="flex items-center gap-1 text-lg font-semibold h-7" style={{ color: '#94a3b8' }}>
                            <span>{typedText}</span>
                            <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.85, repeat: Infinity }} style={{ color: '#a78bfa' }}>|</motion.span>
                        </div>
                    </motion.div>

                    {/* Feature cards */}
                    <div className="space-y-3">
                        {FEATURES.map(({ icon: Icon, label, desc, color }, i) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, x: -24 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.55, delay: 0.38 + i * 0.14 }}
                                whileHover={{ scale: 1.02, y: -2, background: 'rgba(255,255,255,0.07)' }}
                                className="flex items-start gap-4 p-4 rounded-2xl cursor-default"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    backdropFilter: 'blur(8px)',
                                    transition: 'box-shadow 0.2s',
                                }}
                                onHoverStart={() => {}}
                            >
                                <motion.div
                                    className="flex-shrink-0 p-2.5 rounded-xl"
                                    style={{ background: `${color}22` }}
                                    whileHover={{ scale: 1.1, background: `${color}33` }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Icon className="w-4 h-4" style={{ color }} />
                                </motion.div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{label}</p>
                                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.9 }}
                    className="relative z-10"
                >
                    <div className="grid grid-cols-3 gap-4 p-5 rounded-2xl" style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        {STATS.map(({ value, label }, i) => (
                            <motion.div key={label} className="text-center"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 1.0 + i * 0.1 }}
                            >
                                <div className="text-2xl font-black" style={{
                                    background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>{value}</div>
                                <div className="text-xs mt-0.5 font-medium" style={{ color: '#475569' }}>{label}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ═══════════════════════════════════
                RIGHT FORM PANEL
            ═══════════════════════════════════ */}
            <div
                className="flex-1 flex items-center justify-center p-6 relative"
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
                        width: 520, height: 520,
                        background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
                        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Theme toggle */}
                <div className="absolute top-5 right-5 z-10">
                    <ThemeToggle />
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="relative z-10 w-full max-w-[420px]"
                    style={{ perspective: 1000 }}
                >
                    {/* Mobile branding */}
                    <motion.div variants={item} className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: 'var(--accent-primary)' }}>
                            <Sparkles className="w-3 h-3" />
                            AI-Powered Sales Platform
                        </div>
                        <h1 className="text-3xl font-black gradient-text">Sales Assistant</h1>
                    </motion.div>

                    {/* ── Card with 3D tilt + animated glow border ── */}
                    <motion.div
                        variants={item}
                        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
                    >
                        {/* Spinning conic border */}
                        <div className="relative" style={{ borderRadius: 28 }}>
                            <motion.div
                                className="absolute pointer-events-none"
                                style={{
                                    inset: -1.5,
                                    borderRadius: 29.5,
                                    background: 'conic-gradient(from 0deg, #8b5cf6, #3b82f6, #ec4899, #8b5cf6)',
                                    opacity: 0.55,
                                    zIndex: 0,
                                }}
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                            />

                            {/* Card body */}
                            <motion.div
                                className="relative rounded-3xl p-8"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    zIndex: 1,
                                    boxShadow: '0 32px 64px -12px rgba(139,92,246,0.2)',
                                }}
                                animate={{
                                    boxShadow: [
                                        '0 32px 64px -12px rgba(139,92,246,0.18)',
                                        '0 32px 64px -12px rgba(59,130,246,0.18)',
                                        '0 32px 64px -12px rgba(139,92,246,0.18)',
                                    ],
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                {/* Header */}
                                <motion.div variants={item} className="mb-7">
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <motion.div
                                            className="flex items-center justify-center w-10 h-10 rounded-xl"
                                            style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
                                            animate={{ boxShadow: ['0 0 0 0 rgba(139,92,246,0.4)', '0 0 0 8px rgba(139,92,246,0)', '0 0 0 0 rgba(139,92,246,0)'] }}
                                            transition={{ duration: 2.5, repeat: Infinity }}
                                        >
                                            <Brain className="w-5 h-5 text-white" />
                                        </motion.div>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                                            style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                            <motion.span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }}
                                                animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                                                transition={{ duration: 1.6, repeat: Infinity }}
                                            />
                                            AI Workspace
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        Sign in to your AI-powered sales workspace
                                    </p>
                                </motion.div>

                                {/* Form */}
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    {/* Email */}
                                    <motion.div variants={item}>
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                            Email Address
                                        </label>
                                        <motion.div className="relative" whileFocus={{ scale: 1.01 }}>
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                                style={{ color: 'var(--text-secondary)', width: 17, height: 17 }} />
                                            <input {...register('email')} type="email" className="input-field"
                                                placeholder="you@company.com" style={{ paddingLeft: '2.6rem' }} />
                                        </motion.div>
                                        <AnimatePresence>
                                            {errors.email && (
                                                <motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                                                    exit={{ opacity: 0, y: -4, height: 0 }} className="mt-1 text-xs text-red-500">
                                                    {errors.email.message}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>

                                    {/* Password */}
                                    <motion.div variants={item}>
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                                style={{ color: 'var(--text-secondary)', width: 17, height: 17 }} />
                                            <input {...register('password')} type={showPassword ? 'text' : 'password'}
                                                className="input-field" placeholder="••••••••"
                                                style={{ paddingLeft: '2.6rem', paddingRight: '2.8rem' }} />
                                            <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 hover:opacity-70"
                                                style={{ color: 'var(--text-secondary)' }}>
                                                <AnimatePresence mode="wait" initial={false}>
                                                    <motion.span key={showPassword ? 'off' : 'on'} className="block"
                                                        initial={{ opacity: 0, rotate: -15, scale: 0.7 }}
                                                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                                        exit={{ opacity: 0, rotate: 15, scale: 0.7 }}
                                                        transition={{ duration: 0.15 }}>
                                                        {showPassword ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
                                                    </motion.span>
                                                </AnimatePresence>
                                            </button>
                                        </div>
                                        <AnimatePresence>
                                            {errors.password && (
                                                <motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                                                    exit={{ opacity: 0, y: -4, height: 0 }} className="mt-1 text-xs text-red-500">
                                                    {errors.password.message}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>

                                    {/* Submit */}
                                    <motion.div variants={item} className="pt-1">
                                        <motion.button
                                            whileHover={{ scale: 1.025 }}
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
                                                    '0 4px 18px rgba(139,92,246,0.4)',
                                                    '0 6px 24px rgba(59,130,246,0.45)',
                                                    '0 4px 18px rgba(139,92,246,0.4)',
                                                ],
                                            }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                        >
                                            {/* Shimmer sweep */}
                                            <motion.div
                                                className="absolute inset-0 pointer-events-none"
                                                style={{
                                                    background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
                                                }}
                                                animate={{ x: ['-120%', '220%'] }}
                                                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8 }}
                                            />
                                            {isLoading ? (
                                                <>
                                                    <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />
                                                    <span>Authenticating…</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Sign In</span>
                                                    <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                                                        <ArrowRight style={{ width: 16, height: 16 }} />
                                                    </motion.span>
                                                </>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                </form>

                                {/* Divider */}
                                <motion.div variants={item} className="my-6 flex items-center gap-3">
                                    <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                                    <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                                        style={{ background: 'rgba(139,92,246,0.08)', color: 'var(--accent-primary)', border: '1px solid rgba(139,92,246,0.18)' }}>
                                        <Shield className="w-3 h-3" />
                                        <span>AI Secured</span>
                                    </div>
                                    <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                                </motion.div>

                                {/* Register link */}
                                <motion.div variants={item} className="text-center">
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Don't have an account?{' '}
                                        <Link to="/register"
                                            className="font-semibold transition-all hover:opacity-80 hover:tracking-wide"
                                            style={{ color: 'var(--accent-primary)' }}>
                                            Create one free →
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
