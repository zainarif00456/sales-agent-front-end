import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Building, Briefcase, Loader2 } from 'lucide-react';
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

export const RegisterPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            await authService.register(data);
            toast.success('Account created successfully! Please login.');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-tertiary)] relative overflow-hidden py-12">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"
                />
            </div>

            {/* Theme Toggle */}
            <div className="absolute top-6 right-6 z-10">
                <ThemeToggle />
            </div>

            {/* Register Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-2xl mx-4"
            >
                <div className="card glass-effect backdrop-blur-xl bg-[var(--bg-secondary)]/80">
                    {/* Title */}
                    <div className="text-center mb-8">
                        <motion.h1
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="text-3xl font-bold gradient-text mb-2"
                        >
                            Create Your Account
                        </motion.h1>
                        <p className="text-[var(--text-secondary)]">Join Sales Assistant today</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                    First Name *
                                </label>
                                <input
                                    {...register('first_name')}
                                    className="input-field"
                                    placeholder="John"
                                />
                                {errors.first_name && (
                                    <p className="mt-1 text-sm text-red-500">{errors.first_name.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                    Last Name *
                                </label>
                                <input
                                    {...register('last_name')}
                                    className="input-field"
                                    placeholder="Doe"
                                />
                                {errors.last_name && (
                                    <p className="mt-1 text-sm text-red-500">{errors.last_name.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Email & Username */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                    Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                    <input
                                        {...register('email')}
                                        type="email"
                                        className="input-field pl-10"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                    Username *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                    <input
                                        {...register('username')}
                                        className="input-field pl-10"
                                        placeholder="johndoe"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                    Password *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                    <input
                                        {...register('password')}
                                        type="password"
                                        className="input-field pl-10"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                    Confirm Password *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                    <input
                                        {...register('password_confirm')}
                                        type="password"
                                        className="input-field pl-10"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {errors.password_confirm && (
                                    <p className="mt-1 text-sm text-red-500">{errors.password_confirm.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Optional Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                                    Company (Optional)
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                    <input
                                        {...register('company_name')}
                                        className="input-field pl-10"
                                        placeholder="Tech Corp"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
                                    Job Title (Optional)
                                </label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                    <input
                                        {...register('job_title')}
                                        className="input-field pl-10"
                                        placeholder="Sales Manager"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <span>Create Account</span>
                            )}
                        </motion.button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-[var(--text-secondary)]">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] font-semibold transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
