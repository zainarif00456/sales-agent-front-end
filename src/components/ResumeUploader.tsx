import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ResumeUploaderProps {
    onUploadSuccess: (data: any) => void;
    onUploadStart?: () => void;
}

export const ResumeUploader = ({ onUploadSuccess, onUploadStart }: ResumeUploaderProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState<'idle' | 'extracting' | 'analyzing' | 'generating' | 'complete'>('idle');

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const validateFile = (file: File): string | null => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return 'Only PDF files are supported';
        }
        if (file.size > 10 * 1024 * 1024) {
            return 'File size must not exceed 10MB';
        }
        return null;
    };

    const simulateProgress = () => {
        setCurrentStep('extracting');
        setUploadProgress(20);

        setTimeout(() => {
            setCurrentStep('analyzing');
            setUploadProgress(50);
        }, 2000);

        setTimeout(() => {
            setCurrentStep('generating');
            setUploadProgress(80);
        }, 5000);
    };

    const handleFile = async (file: File) => {
        const error = validateFile(file);
        if (error) {
            toast.error(error);
            return;
        }

        setUploading(true);
        setUploadProgress(10);
        onUploadStart?.();
        simulateProgress();

        try {
            // This will be called from parent component with actual upload logic
            // For now, just simulate
            await new Promise(resolve => setTimeout(resolve, 8000));

            setCurrentStep('complete');
            setUploadProgress(100);

            setTimeout(() => {
                toast.success('Resume processed successfully!');
                onUploadSuccess({ success: true });
                setUploading(false);
                setUploadProgress(0);
                setCurrentStep('idle');
            }, 1000);
        } catch (err: any) {
            toast.error(err.message || 'Failed to upload resume');
            setUploading(false);
            setUploadProgress(0);
            setCurrentStep('idle');
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const steps = [
        { key: 'extracting', label: 'Extracting text from PDF', icon: FileText },
        { key: 'analyzing', label: 'Analyzing resume with AI', icon: Loader2 },
        { key: 'generating', label: 'Generating personality prompt', icon: Loader2 },
    ];

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!uploading ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${isDragging
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                            : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="flex flex-col items-center text-center">
                            <motion.div
                                animate={{
                                    scale: isDragging ? 1.1 : 1,
                                    rotate: isDragging ? 5 : 0,
                                }}
                                className="mb-4"
                            >
                                <Upload className="w-16 h-16 text-[var(--accent-primary)]" />
                            </motion.div>

                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                                Upload Resume (PDF)
                            </h3>
                            <p className="text-[var(--text-secondary)] mb-6">
                                Drag and drop your resume here, or click to browse
                            </p>

                            <label className="btn-primary cursor-pointer">
                                <span>Choose File</span>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileInput}
                                    className="hidden"
                                />
                            </label>

                            <div className="mt-6 text-sm text-[var(--text-secondary)]">
                                <p>✨ AI will automatically extract:</p>
                                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                                    <span className="px-2 py-1 bg-[var(--bg-tertiary)] rounded-full text-xs">Skills</span>
                                    <span className="px-2 py-1 bg-[var(--bg-tertiary)] rounded-full text-xs">Experience</span>
                                    <span className="px-2 py-1 bg-[var(--bg-tertiary)] rounded-full text-xs">Projects</span>
                                    <span className="px-2 py-1 bg-[var(--bg-tertiary)] rounded-full text-xs">Education</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="card p-8"
                    >
                        <div className="text-center mb-8">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="inline-block mb-4"
                            >
                                <Loader2 className="w-16 h-16 text-[var(--accent-primary)]" />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                                Processing Resume
                            </h3>
                            <p className="text-[var(--text-secondary)]">
                                This may take 15-50 seconds depending on resume size
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-8">
                            <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <p className="text-center text-sm text-[var(--text-secondary)] mt-2">
                                {uploadProgress}% Complete
                            </p>
                        </div>

                        {/* Processing Steps */}
                        <div className="space-y-4">
                            {steps.map((step, index) => {
                                const isActive = step.key === currentStep;
                                const isComplete = steps.findIndex(s => s.key === currentStep) > index;
                                const Icon = step.icon;

                                return (
                                    <motion.div
                                        key={step.key}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`flex items-center gap-4 p-4 rounded-lg transition-all ${isActive ? 'bg-[var(--accent-primary)]/10' : 'bg-[var(--bg-tertiary)]'
                                            }`}
                                    >
                                        <div className="flex-shrink-0">
                                            {isComplete ? (
                                                <CheckCircle className="w-6 h-6 text-green-500" />
                                            ) : isActive ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                >
                                                    <Icon className="w-6 h-6 text-[var(--accent-primary)]" />
                                                </motion.div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full border-2 border-[var(--border-color)]" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-medium ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                                                }`}>
                                                {step.label}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Animated Background */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                            <motion.div
                                className="absolute w-64 h-64 bg-[var(--accent-primary)]/5 rounded-full blur-3xl"
                                animate={{
                                    x: [0, 100, 0],
                                    y: [0, 50, 0],
                                }}
                                transition={{
                                    duration: 8,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                style={{ top: '-50%', left: '-10%' }}
                            />
                            <motion.div
                                className="absolute w-64 h-64 bg-[var(--accent-secondary)]/5 rounded-full blur-3xl"
                                animate={{
                                    x: [0, -100, 0],
                                    y: [0, -50, 0],
                                }}
                                transition={{
                                    duration: 10,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                style={{ bottom: '-50%', right: '-10%' }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
