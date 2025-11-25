import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Save, Loader2, FileText, Sparkles, User,
    RefreshCw, Download, Eye, Upload, CheckCircle, Database,
    ChevronDown, ChevronUp
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StructuredDataViewer } from '@/components/StructuredDataViewer';
import agentService from '@/services/agent.service';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const agentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    role: z.string().min(1, 'Role is required'),
    company: z.string().optional(),
    personality_description: z.string().min(10, 'Personality description must be at least 10 characters'),
    years_of_experience: z.number().min(0).optional(),
    current_projects: z.string().optional(),
    education: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
});

type AgentFormData = z.infer<typeof agentSchema>;

type TabType = 'overview' | 'resume' | 'data' | 'prompt';

export const AgentEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [expertiseInput, setExpertiseInput] = useState('');
    const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
    const [uploadingResume, setUploadingResume] = useState(false);
    const [regeneratingPrompt, setRegeneratingPrompt] = useState(false);
    const [showRawAnalysis, setShowRawAnalysis] = useState(false);

    const { data: agent, isLoading } = useQuery({
        queryKey: ['agent', id],
        queryFn: () => agentService.getAgent(id!),
        enabled: !!id,
    });

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<AgentFormData>({
        resolver: zodResolver(agentSchema),
    });

    useEffect(() => {
        if (agent) {
            setValue('name', agent.name);
            setValue('role', agent.role);
            setValue('company', agent.company || '');
            setValue('personality_description', agent.personality_description);
            setValue('years_of_experience', agent.years_of_experience || 0);
            setValue('current_projects', agent.current_projects || '');
            setValue('education', agent.education || '');
            setValue('temperature', agent.temperature || 0.7);
            setExpertiseAreas(agent.expertise_areas || []);
        }
    }, [agent, setValue]);

    const updateMutation = useMutation({
        mutationFn: (data: AgentFormData) => agentService.updateAgent(id!, {
            ...data,
            expertise_areas: expertiseAreas,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent', id] });
            toast.success('Agent updated successfully');
        },
        onError: () => {
            toast.error('Failed to update agent');
        },
    });

    const handleResumeUpload = async (file: File) => {
        setUploadingResume(true);
        try {
            const response = await agentService.uploadResume(id!, file);

            // 1. Update Agent Form Data immediately
            if (response.data) {
                const updatedAgent = response.data;
                setValue('name', updatedAgent.name);
                setValue('role', updatedAgent.role);
                setValue('company', updatedAgent.company || '');
                setValue('personality_description', updatedAgent.personality_description);
                setValue('years_of_experience', updatedAgent.years_of_experience || 0);
                setValue('current_projects', updatedAgent.current_projects || '');
                setValue('education', updatedAgent.education || '');
                setValue('temperature', updatedAgent.temperature || 0.7);

                // Update expertise areas
                if (updatedAgent.expertise_areas) {
                    setExpertiseAreas(updatedAgent.expertise_areas);
                }

                // Update cache for agent
                queryClient.setQueryData(['agent', id], updatedAgent);
            }

            // 2. Update Structured Data Cache immediately
            if (response.resume_analysis) {
                const { experiences, skills, projects, education } = response.resume_analysis;

                if (experiences) {
                    queryClient.setQueryData(['experiences', id], { results: experiences });
                }
                if (skills) {
                    queryClient.setQueryData(['skills', id], { results: skills });
                }
                if (projects) {
                    queryClient.setQueryData(['projects', id], { results: projects });
                }
                if (education) {
                    queryClient.setQueryData(['education', id], { results: education });
                }
            }

            // 3. Invalidate queries to ensure consistency (background refetch)
            queryClient.invalidateQueries({ queryKey: ['agent', id] });
            queryClient.invalidateQueries({ queryKey: ['experiences', id] });
            queryClient.invalidateQueries({ queryKey: ['skills', id] });
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
            queryClient.invalidateQueries({ queryKey: ['education', id] });

            // 4. Show success message
            if (response.extraction_summary) {
                const { experiences, skills, projects, education } = response.extraction_summary;
                toast.success(
                    `Resume processed successfully!\n\nExtracted:\n• ${experiences} experiences\n• ${skills} skills\n• ${projects} projects\n• ${education} education entries`,
                    { duration: 5000 }
                );
            } else {
                toast.success('Resume processed successfully!');
            }
        } catch (error) {
            console.error('Resume upload error:', error);
            toast.error('Failed to upload resume');
        } finally {
            setUploadingResume(false);
        }
    };

    const handleRegeneratePrompt = async () => {
        setRegeneratingPrompt(true);
        try {
            await agentService.regeneratePrompt(id!);
            queryClient.invalidateQueries({ queryKey: ['agent', id] });
            toast.success('Personality prompt regenerated!');
        } catch (error) {
            toast.error('Failed to regenerate prompt');
        } finally {
            setRegeneratingPrompt(false);
        }
    };

    const addExpertise = () => {
        if (expertiseInput.trim() && !expertiseAreas.includes(expertiseInput.trim())) {
            setExpertiseAreas([...expertiseAreas, expertiseInput.trim()]);
            setExpertiseInput('');
        }
    };

    const removeExpertise = (skill: string) => {
        setExpertiseAreas(expertiseAreas.filter(s => s !== skill));
    };

    const onSubmit = (data: AgentFormData) => {
        updateMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner size="lg" />
                </div>
            </Layout>
        );
    }

    if (!agent) {
        return (
            <Layout>
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Agent not found</h2>
                </div>
            </Layout>
        );
    }

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: User },
        { id: 'resume' as TabType, label: 'Resume', icon: FileText },
        { id: 'data' as TabType, label: 'Resume Data', icon: Database },
        { id: 'prompt' as TabType, label: 'Personality Prompt', icon: Sparkles },
    ];

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/agents')}
                            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold gradient-text">Edit Agent</h1>
                            <p className="text-[var(--text-secondary)]">{agent.name} • {agent.role}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="card p-2">
                    <div className="flex gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6">
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">Agent Information</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                                            Name *
                                        </label>
                                        <input
                                            {...register('name')}
                                            className="input-field w-full"
                                            placeholder="e.g., Sarah Johnson"
                                        />
                                        {errors.name && (
                                            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                                            Role *
                                        </label>
                                        <input
                                            {...register('role')}
                                            className="input-field w-full"
                                            placeholder="e.g., Senior Full-Stack Developer"
                                        />
                                        {errors.role && (
                                            <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                                            Company
                                        </label>
                                        <input
                                            {...register('company')}
                                            className="input-field w-full"
                                            placeholder="e.g., Tech Innovations Ltd"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                                            Years of Experience
                                        </label>
                                        <input
                                            {...register('years_of_experience', { valueAsNumber: true })}
                                            type="number"
                                            className="input-field w-full"
                                            placeholder="e.g., 7"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                                        Personality Description *
                                    </label>
                                    <textarea
                                        {...register('personality_description')}
                                        className="input-field w-full"
                                        rows={4}
                                        placeholder="Describe the agent's personality, communication style, and approach..."
                                    />
                                    {errors.personality_description && (
                                        <p className="text-red-500 text-sm mt-1">{errors.personality_description.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                                        Expertise Areas
                                    </label>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            value={expertiseInput}
                                            onChange={(e) => setExpertiseInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                                            className="input-field flex-1"
                                            placeholder="Add a skill and press Enter"
                                        />
                                        <button
                                            type="button"
                                            onClick={addExpertise}
                                            className="btn-secondary"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {expertiseAreas.map((skill) => (
                                            <span
                                                key={skill}
                                                className="px-3 py-1 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-full text-sm font-semibold flex items-center gap-2"
                                            >
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => removeExpertise(skill)}
                                                    className="hover:text-red-500"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                                        Current Projects
                                    </label>
                                    <textarea
                                        {...register('current_projects')}
                                        className="input-field w-full"
                                        rows={3}
                                        placeholder="Describe current projects and responsibilities..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                                        Education
                                    </label>
                                    <input
                                        {...register('education')}
                                        className="input-field w-full"
                                        placeholder="e.g., BS in Computer Science, MIT, 2016"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                                        Temperature ({watch('temperature') || 0.7})
                                    </label>
                                    <input
                                        {...register('temperature', { valueAsNumber: true })}
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        className="w-full"
                                    />
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                                        Lower = More focused, Higher = More creative
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={updateMutation.isPending}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {updateMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        <span>Save Changes</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/agents')}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {activeTab === 'resume' && (
                        <motion.div
                            key="resume"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Current Resume */}
                            {agent.resume_file && (
                                <div className="card p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-[var(--text-primary)]">Current Resume</h3>
                                        <div className="flex gap-2">
                                            <a
                                                href={agent.resume_file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-secondary flex items-center gap-2"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </a>
                                            <a
                                                href={agent.resume_file}
                                                download
                                                className="btn-secondary flex items-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </a>
                                        </div>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {agent.resume_file.split('/').pop()}
                                    </p>
                                </div>
                            )}

                            {/* Upload New Resume */}
                            <div className="card p-6">
                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                                    {agent.resume_file ? 'Replace Resume' : 'Upload Resume'}
                                </h3>
                                <div className="border-2 border-dashed border-[var(--border-color)] rounded-lg p-8 text-center">
                                    <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--accent-primary)]" />
                                    <p className="text-[var(--text-secondary)] mb-4">
                                        Upload a PDF resume to extract skills and generate personality prompt
                                    </p>
                                    <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                                        {uploadingResume ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                Choose PDF File
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleResumeUpload(file);
                                            }}
                                            className="hidden"
                                            disabled={uploadingResume}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Resume Analysis */}
                            {agent.resume_processed_data?.raw_analysis && (
                                <div className="card p-6">
                                    <button
                                        onClick={() => setShowRawAnalysis(!showRawAnalysis)}
                                        className="w-full flex items-center justify-between mb-2 hover:bg-[var(--bg-tertiary)] p-2 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-[var(--text-primary)]">Raw Analysis Data</h3>
                                            <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-semibold flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" />
                                                {agent.resume_processed_data.processing_status}
                                            </span>
                                        </div>
                                        {showRawAnalysis ? (
                                            <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {showRawAnalysis && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-[var(--bg-tertiary)] rounded-lg p-6 mt-4 max-h-96 overflow-y-auto custom-scrollbar">
                                                    {typeof agent.resume_processed_data.raw_analysis === 'object' ||
                                                        (typeof agent.resume_processed_data.raw_analysis === 'string' &&
                                                            agent.resume_processed_data.raw_analysis.trim().startsWith('{')) ? (
                                                        <pre className="text-sm font-mono text-[var(--text-primary)] whitespace-pre-wrap">
                                                            {typeof agent.resume_processed_data.raw_analysis === 'string'
                                                                ? agent.resume_processed_data.raw_analysis
                                                                : JSON.stringify(agent.resume_processed_data.raw_analysis, null, 2)}
                                                        </pre>
                                                    ) : (
                                                        <div className="prose prose-invert max-w-none">
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm]}
                                                                rehypePlugins={[rehypeRaw]}
                                                                components={{
                                                                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-[var(--text-primary)] mb-3 mt-4" {...props} />,
                                                                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-[var(--accent-primary)] mb-2 mt-4 border-b border-[var(--border-color)] pb-1" {...props} />,
                                                                    h3: ({ node, ...props }) => <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2 mt-3" {...props} />,
                                                                    p: ({ node, ...props }) => <p className="text-[var(--text-secondary)] mb-2 leading-relaxed" {...props} />,
                                                                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 mb-3 text-[var(--text-secondary)]" {...props} />,
                                                                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-[var(--text-secondary)]" {...props} />,
                                                                    li: ({ node, ...props }) => <li className="text-[var(--text-secondary)]" {...props} />,
                                                                    strong: ({ node, ...props }) => <strong className="text-[var(--text-primary)] font-semibold" {...props} />,
                                                                    code: ({ node, ...props }) => <code className="bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-sm font-mono text-[var(--accent-primary)]" {...props} />,
                                                                }}
                                                            >
                                                                {agent.resume_processed_data.raw_analysis}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {!showRawAnalysis && (
                                        <p className="text-sm text-[var(--text-secondary)] ml-2">
                                            Click to view raw analysis data used for extraction.
                                        </p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'data' && (
                        <motion.div
                            key="data"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <StructuredDataViewer agentId={id!} />
                        </motion.div>
                    )}

                    {activeTab === 'prompt' && (
                        <motion.div
                            key="prompt"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="card p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">AI Personality Prompt</h2>
                                <button
                                    onClick={handleRegeneratePrompt}
                                    disabled={regeneratingPrompt}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {regeneratingPrompt ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Regenerating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Regenerate
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-[var(--bg-tertiary)] rounded-lg p-6 mb-4">
                                <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                                    {agent.agent_prompt || agent.system_prompt || 'No personality prompt generated yet'}
                                </p>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                    💡 This prompt is automatically generated from the agent's profile and resume data.
                                    It makes the AI adopt the complete personality of {agent.name}. Click "Regenerate"
                                    after updating profile information or uploading a new resume.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </Layout>
    );
};
