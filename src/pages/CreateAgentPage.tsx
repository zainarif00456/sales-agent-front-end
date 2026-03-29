import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Upload, X, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '@/components/Layout';
import agentService, { AgentCreateData } from '@/services/agent.service';

const agentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    role: z.string().min(1, 'Role is required'),
    company: z.string().optional(),
    personality_description: z.string().min(10, 'Personality description must be at least 10 characters'),
    years_of_experience: z.number().min(0).optional(),
    current_projects: z.string().optional(),
    education: z.string().optional(),
    temperature: z.number().min(0).max(1).optional(),
});

type AgentFormData = z.infer<typeof agentSchema>;

export const CreateAgentPage = () => {
    const navigate = useNavigate();
    const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AgentFormData>({
        resolver: zodResolver(agentSchema),
        defaultValues: {
            temperature: 0.7,
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: AgentCreateData) => agentService.createAgent(data),
        onSuccess: () => {
            toast.success('Agent created successfully!');
            navigate(`/agents`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create agent');
        },
    });

    const addSkill = () => {
        if (newSkill.trim() && !expertiseAreas.includes(newSkill.trim())) {
            setExpertiseAreas([...expertiseAreas, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const removeSkill = (skill: string) => {
        setExpertiseAreas(expertiseAreas.filter((s) => s !== skill));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setResumeFile(file);
            toast.success('Resume uploaded successfully');
        } else {
            toast.error('Please upload a PDF file');
        }
    };

    const onSubmit = (data: AgentFormData) => {
        if (expertiseAreas.length === 0) {
            toast.error('Please add at least one expertise area');
            return;
        }

        const agentData: AgentCreateData = {
            ...data,
            expertise_areas: expertiseAreas,
            resume_file: resumeFile || undefined,
        };

        createMutation.mutate(agentData);
    };

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl"
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold gradient-text mb-2">Create AI Agent</h1>
                    <p className="text-[var(--text-secondary)]">
                        Build your personalized sales assistant agent
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Basic Information */}
                    <div className="card">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
                            Basic Information
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                        Name *
                                    </label>
                                    <input {...register('name')} className="input-field" placeholder="Sarah Johnson" />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                        Role/Title *
                                    </label>
                                    <input
                                        {...register('role')}
                                        className="input-field"
                                        placeholder="Senior Full-Stack Developer"
                                    />
                                    {errors.role && (
                                        <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                        Company
                                    </label>
                                    <input
                                        {...register('company')}
                                        className="input-field"
                                        placeholder="Tech Innovations Ltd"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                        Years of Experience
                                    </label>
                                    <input
                                        {...register('years_of_experience', { valueAsNumber: true })}
                                        type="number"
                                        className="input-field"
                                        placeholder="7"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personality & Expertise */}
                    <div className="card">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
                            Personality & Expertise
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                    Personality Description *
                                </label>
                                <textarea
                                    {...register('personality_description')}
                                    rows={4}
                                    className="input-field resize-none"
                                    placeholder="Friendly and approachable, explains complex concepts simply..."
                                />
                                {errors.personality_description && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.personality_description.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                    Expertise Areas *
                                </label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                        className="input-field flex-1"
                                        placeholder="e.g., Python, React, AWS"
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={addSkill}
                                        className="px-6 py-3 bg-[var(--accent-primary)] text-white rounded-lg 
                             hover:bg-[var(--accent-secondary)] transition-all duration-300"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </motion.button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {expertiseAreas.map((skill) => (
                                        <motion.span
                                            key={skill}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="px-3 py-1 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] 
                               text-white rounded-full text-sm font-semibold flex items-center gap-2"
                                        >
                                            {skill}
                                            <button
                                                type="button"
                                                onClick={() => removeSkill(skill)}
                                                className="hover:bg-white/20 rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </motion.span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                    Current Projects
                                </label>
                                <textarea
                                    {...register('current_projects')}
                                    rows={3}
                                    className="input-field resize-none"
                                    placeholder="Leading development of microservices platform..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                    Education
                                </label>
                                <input
                                    {...register('education')}
                                    className="input-field"
                                    placeholder="BS in Computer Science from MIT"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                                    Temperature (Creativity Level)
                                </label>
                                <input
                                    {...register('temperature', { valueAsNumber: true })}
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="1"
                                    className="input-field"
                                    placeholder="0.7"
                                />
                                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                    0 = More focused and deterministic, 1 = More creative and varied
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Resume Upload */}
                    <div className="card">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
                            Resume Upload (Optional)
                        </h2>
                        <div className="border-2 border-dashed border-[var(--border-color)] rounded-lg p-8 text-center">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                id="resume-upload"
                            />
                            <label htmlFor="resume-upload" className="cursor-pointer">
                                <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
                                {resumeFile ? (
                                    <div>
                                        <p className="text-[var(--text-primary)] font-semibold mb-2">
                                            {resumeFile.name}
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            Click to change file
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-[var(--text-primary)] font-semibold mb-2">
                                            Drop PDF here or click to upload
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            Auto-extracts skills & experience
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => navigate('/agents')}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={createMutation.isPending}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <span>Create Agent</span>
                            )}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </Layout>
    );
};
