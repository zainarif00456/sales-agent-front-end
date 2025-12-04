import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, X, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
    selectedFile: File | null;
    disabled?: boolean;
}

const ALLOWED_TYPES = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/bmp': ['.bmp'],
    'image/tiff': ['.tiff', '.tif'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const FileUpload = ({ onFileSelect, selectedFile, disabled }: FileUploadProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const validateFile = (file: File): boolean => {
        // Check file type
        if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
            toast.error('Invalid file type. Please upload a PDF or image file.');
            return false;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            toast.error('File size must be less than 10MB.');
            return false;
        }

        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && validateFile(file)) {
            onFileSelect(file);
        }
        // Reset input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file && validateFile(file)) {
            onFileSelect(file);
        }
    };

    const handleRemove = () => {
        onFileSelect(null);
    };

    const handleClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    const getFileIcon = (type: string) => {
        if (type === 'application/pdf') {
            return <FileText className="w-5 h-5 text-red-500" />;
        }
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="relative">
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,.tif"
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
            />

            <AnimatePresence mode="wait">
                {selectedFile ? (
                    <motion.div
                        key="file-selected"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]"
                    >
                        <div className="flex-shrink-0">
                            {getFileIcon(selectedFile.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                                {formatFileSize(selectedFile.size)}
                            </p>
                        </div>
                        <button
                            onClick={handleRemove}
                            disabled={disabled}
                            className="flex-shrink-0 p-1 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                            title="Remove file"
                        >
                            <X className="w-4 h-4 text-red-500" />
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="file-empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={handleClick}
                        className={`
                            relative cursor-pointer p-4 rounded-lg border-2 border-dashed transition-all
                            ${dragActive
                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-tertiary)]'
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <Paperclip className="w-5 h-5 text-[var(--text-secondary)]" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                    Attach client document
                                </p>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                    PDF or image • Max 10MB
                                </p>
                            </div>
                        </div>

                        {dragActive && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 flex items-center justify-center bg-[var(--accent-primary)]/10 rounded-lg"
                            >
                                <p className="text-sm font-semibold text-[var(--accent-primary)]">
                                    Drop file here
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Help text */}
            {!selectedFile && (
                <div className="mt-2 flex items-start gap-2 px-1">
                    <AlertCircle className="w-3 h-3 text-[var(--text-secondary)] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[var(--text-secondary)]">
                        Upload client resume or profile to enable AI-powered analysis and personalized responses
                    </p>
                </div>
            )}
        </div>
    );
};
