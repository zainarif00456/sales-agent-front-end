import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamingMessageProps {
    content: string;
    isComplete: boolean;
    className?: string;
}

/**
 * Streaming message component - ChatGPT style
 * 
 * Displays content character-by-character as it arrives.
 * Shows plain text while streaming, markdown when complete.
 */
export const StreamingMessage: React.FC<StreamingMessageProps> = ({
    content,
    isComplete,
    className = '',
}) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const contentRef = useRef('');
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        console.log('[StreamingMessage] Update:', {
            contentLength: content.length,
            displayedLength: displayedContent.length,
            isComplete
        });

        // If complete, show everything immediately
        if (isComplete) {
            setDisplayedContent(content);
            contentRef.current = content;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // If content is the same or shorter, don't animate
        if (content === contentRef.current || content.length <= displayedContent.length) {
            return;
        }

        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Get new content that needs to be displayed
        const startIndex = displayedContent.length;
        const newContent = content.slice(startIndex);

        if (newContent.length === 0) {
            return;
        }

        console.log('[StreamingMessage] Animating', newContent.length, 'new chars');

        // Animate new characters
        let charIndex = 0;
        intervalRef.current = window.setInterval(() => {
            if (charIndex < newContent.length) {
                setDisplayedContent(content.slice(0, startIndex + charIndex + 1));
                charIndex++;
            } else {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                contentRef.current = content;
            }
        }, 20); // 50 chars per second

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [content, isComplete]);

    // While streaming, show plain text to avoid markdown parsing issues
    if (!isComplete) {
        return (
            <div className={`streaming-message ${className}`}>
                <div className="whitespace-pre-wrap text-sm">
                    {displayedContent}
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            repeatType: 'reverse',
                        }}
                        className="inline-block ml-1 text-[var(--accent-primary)]"
                    >
                        ▋
                    </motion.span>
                </div>
            </div>
        );
    }

    // When complete, render with full markdown support
    return (
        <div className={`streaming-message ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ node, ...props }) => (
                        <p className="mb-2 last:mb-0" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                        <ul className="list-disc list-inside mb-2 space-y-1" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                        <li className="ml-2" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                        <strong className="font-bold text-[var(--text-primary)]" {...props} />
                    ),
                    em: ({ node, ...props }) => (
                        <em className="italic" {...props} />
                    ),
                    code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !match ? (
                            <code
                                className="bg-[var(--bg-primary)] px-1.5 py-0.5 rounded text-xs font-mono"
                                {...props}
                            >
                                {children}
                            </code>
                        ) : (
                            <code
                                className={`block bg-[var(--bg-primary)] p-3 rounded-lg text-xs font-mono overflow-x-auto my-2 ${className}`}
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    h1: ({ node, ...props }) => (
                        <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2 className="text-base font-bold mb-2 mt-3 first:mt-0" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                        <blockquote
                            className="border-l-4 border-[var(--accent-primary)] pl-3 italic my-2"
                            {...props}
                        />
                    ),
                    a: ({ node, ...props }) => (
                        <a
                            className="text-[var(--accent-primary)] hover:underline"
                            {...props}
                        />
                    ),
                }}
            >
                {displayedContent}
            </ReactMarkdown>
        </div>
    );
};
