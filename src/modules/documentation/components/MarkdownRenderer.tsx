import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidDiagram from './MermaidDiagram';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    return (
        <div className="markdown-renderer">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const codeString = String(children).replace(/\n$/, '');
                        const inline = !className;

                        // Check if this is a mermaid code block
                        if (!inline && language === 'mermaid') {
                            return <MermaidDiagram code={codeString} />;
                        }

                        // Regular code blocks
                        if (!inline && match) {
                            return (
                                <pre className="code-block">
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                </pre>
                            );
                        }

                        // Inline code
                        return inline ? (
                            <code className="inline-code" {...props}>
                                {children}
                            </code>
                        ) : (
                            <pre className="code-block">
                                <code {...props}>{children}</code>
                            </pre>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
