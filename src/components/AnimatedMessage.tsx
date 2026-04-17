import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type MessageAnimMode = 'streaming' | 'api-complete' | 'static';

interface AnimatedMessageProps {
    content: string;
    mode: MessageAnimMode;
    className?: string;
}

// ── Shared Markdown renderer ──────────────────────────────────────────────────
const MarkdownContent = ({ content, className = '' }: { content: string; className?: string }) => (
    <div className={`markdown-body text-sm leading-relaxed ${className}`}>
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc list-inside mb-2 space-y-1 pl-1" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1 pl-1" {...props} />,
                li: ({ ...props }) => <li className="ml-2" {...props} />,
                strong: ({ ...props }) => <strong className="font-bold" style={{ color: 'var(--text-primary)' }} {...props} />,
                em: ({ ...props }) => <em className="italic opacity-90" {...props} />,
                code: ({ className: cls, children, ...props }: any) => {
                    const isBlock = /language-(\w+)/.test(cls || '');
                    return isBlock ? (
                        <pre className="rounded-xl p-3.5 my-2.5 overflow-x-auto text-xs font-mono" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                            <code className={cls} {...props}>{children}</code>
                        </pre>
                    ) : (
                        <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} {...props}>{children}</code>
                    );
                },
                h1: ({ ...props }) => <h1 className="text-base font-bold mb-2 mt-3 first:mt-0 gradient-text" {...props} />,
                h2: ({ ...props }) => <h2 className="text-sm font-bold mb-1.5 mt-2.5 first:mt-0" style={{ color: 'var(--text-primary)' }} {...props} />,
                h3: ({ ...props }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0" style={{ color: 'var(--text-primary)' }} {...props} />,
                blockquote: ({ ...props }) => (
                    <blockquote className="border-l-2 pl-3.5 italic my-2 opacity-80" style={{ borderColor: 'var(--accent-primary)' }} {...props} />
                ),
                a: ({ ...props }) => <a className="underline hover:opacity-70 transition-opacity" style={{ color: 'var(--accent-primary)' }} target="_blank" rel="noreferrer" {...props} />,
                hr: () => <hr className="my-3" style={{ borderColor: 'var(--border-color)' }} />,
                table: ({ ...props }) => (
                    <div className="overflow-x-auto my-2 rounded-lg" style={{ border: '1px solid var(--border-color)' }}>
                        <table className="min-w-full text-xs border-collapse" {...props} />
                    </div>
                ),
                th: ({ ...props }) => (
                    <th className="px-3 py-1.5 font-semibold text-left text-xs" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }} {...props} />
                ),
                td: ({ ...props }) => (
                    <td className="px-3 py-1.5 text-xs" style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} {...props} />
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    </div>
);

// ── STREAMING mode: glow-tail effect ─────────────────────────────────────────
// The last ~45 chars receive a gradient glow (text-primary → accent-blue → accent-purple)
// giving a "typed by AI" visual where the newest text shimmers.
const StreamingContent = memo(({ content }: { content: string }) => {
    const GLOW_LEN = 48;
    const committed = content.length > GLOW_LEN ? content.slice(0, content.length - GLOW_LEN) : '';
    const glowing  = content.length > GLOW_LEN ? content.slice(-GLOW_LEN) : content;

    return (
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {committed && <span>{committed}</span>}
            <span
                style={{
                    background: 'linear-gradient(90deg, var(--text-primary) 0%, var(--accent-secondary) 55%, var(--accent-primary) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}
            >
                {glowing}
            </span>
            <motion.span
                className="stream-cursor"
                style={{ display: 'inline-block', marginLeft: 2, color: 'var(--accent-primary)', WebkitTextFillColor: 'var(--accent-primary)' }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.75, repeat: Infinity, ease: 'easeInOut' }}
            >▋</motion.span>
        </p>
    );
});

// ── API CASCADE mode: word-by-word blur→clear emergence ──────────────────────
// All words appear with staggered delay using CSS animation so React stays efficient.
// After the cascade finishes, transitions to rendered Markdown.
const ApiCascadeContent = ({ content }: { content: string }) => {
    const [showMarkdown, setShowMarkdown] = useState(false);

    // Split preserving whitespace tokens for natural word flow
    const tokens = content.split(/(\s+)/);
    const wordCount = tokens.filter(t => /\S/.test(t)).length;

    const STAGGER_MS     = 13;  // ms between each word
    const MAX_STAGGER    = 72;  // cap so long responses don't take forever
    const WORD_ANIM_MS   = 220; // CSS animation duration
    const effectiveWords = Math.min(wordCount, MAX_STAGGER);
    const totalDuration  = effectiveWords * STAGGER_MS + WORD_ANIM_MS + 60;

    useEffect(() => {
        const t = setTimeout(() => setShowMarkdown(true), totalDuration);
        return () => clearTimeout(t);
    }, [totalDuration]);

    if (showMarkdown) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }}>
                <MarkdownContent content={content} />
            </motion.div>
        );
    }

    let wordIdx = 0;
    return (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {tokens.map((token, i) => {
                if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
                const delay = wordIdx < MAX_STAGGER ? wordIdx * STAGGER_MS : MAX_STAGGER * STAGGER_MS;
                wordIdx++;
                return (
                    <span
                        key={i}
                        className="api-word"
                        style={{ '--word-delay': `${delay}ms` } as React.CSSProperties}
                    >
                        {token}
                    </span>
                );
            })}
        </p>
    );
};

// ── Main export ───────────────────────────────────────────────────────────────
export const AnimatedMessage = memo(({ content, mode, className = '' }: AnimatedMessageProps) => {
    const prevMode = useRef<MessageAnimMode>(mode);
    const [fromStreaming, setFromStreaming] = useState(false);

    useEffect(() => {
        if (prevMode.current === 'streaming' && mode === 'static') {
            setFromStreaming(true);
        }
        prevMode.current = mode;
    }, [mode]);

    if (mode === 'streaming') {
        return <div className={className}><StreamingContent content={content} /></div>;
    }

    if (mode === 'api-complete') {
        return <div className={className}><ApiCascadeContent content={content} /></div>;
    }

    // Static — may have just transitioned from streaming (crossfade to markdown)
    return (
        <motion.div
            className={className}
            initial={fromStreaming ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
        >
            <MarkdownContent content={content} />
        </motion.div>
    );
});
