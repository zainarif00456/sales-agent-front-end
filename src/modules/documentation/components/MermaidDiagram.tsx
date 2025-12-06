import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import './MermaidDiagram.css';

interface MermaidDiagramProps {
    code: string;
    theme?: 'dark' | 'light';
}

// Initialize mermaid
mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    flowchart: {
        useMaxWidth: false, // Allow diagram to use its natural width
        htmlLabels: true,
        curve: 'basis',
        padding: 20,
        nodeSpacing: 70,
        rankSpacing: 70,
        diagramPadding: 30,
    },
    themeVariables: {
        fontSize: '16px',
        fontFamily: 'arial, sans-serif'
    },
    wrap: true,
    maxTextSize: 900000
});

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code }) => {
    const [svgContent, setSvgContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const diagramIdRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        const renderDiagram = async () => {
            try {
                const existingElement = document.getElementById(diagramIdRef.current);
                if (existingElement) {
                    existingElement.remove();
                }

                const { svg } = await mermaid.render(diagramIdRef.current, code);
                setSvgContent(svg);
                setError(null);
            } catch (err: any) {
                console.error('Mermaid rendering error:', err);
                setError(err.message || 'Failed to render diagram');
            }
        };

        renderDiagram();

        return () => {
            const element = document.getElementById(diagramIdRef.current);
            if (element) {
                element.remove();
            }
        };
    }, [code]);

    const handleDiagramClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLightboxOpen(true);
    };

    const handleLightboxClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLightboxOpen(false);
    };

    return (
        <>
            <div className="mermaid-container">
                <div className="mermaid-header">
                    <span className="mermaid-title">📊 Mermaid Diagram</span>
                    <span className="mermaid-hint">Click to enlarge</span>
                </div>

                {error ? (
                    <div className="mermaid-error">
                        <p className="error-title">Error rendering diagram:</p>
                        <p className="error-message">{error}</p>
                    </div>
                ) : (
                    <div
                        className="mermaid-preview"
                        onClick={handleDiagramClick}
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                )}
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div className="mermaid-lightbox" onClick={handleLightboxClose}>
                    <div className="lightbox-close">✕</div>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <div
                            className="lightbox-diagram"
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default MermaidDiagram;
