import { Page } from '../types';
import { saveAs } from 'file-saver';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        padding: 15,
        nodeSpacing: 50,
        rankSpacing: 50,
        diagramPadding: 20,
        wrappingWidth: 250
    },
    themeVariables: {
        fontSize: '14px',
        fontFamily: 'arial, sans-serif'
    },
    wrap: true,
    maxTextSize: 900000,
    logLevel: 'error'
});

const extractMermaidBlocks = (markdown: string): { code: string; fullMatch: string; index: number }[] => {
    const mermaidRegex = /```mermaid\s*\n([\s\S]*?)```/g;
    const blocks: { code: string; fullMatch: string; index: number }[] = [];
    let match;

    while ((match = mermaidRegex.exec(markdown)) !== null) {
        blocks.push({
            code: match[1].trim(),
            fullMatch: match[0],
            index: match.index,
        });
    }

    return blocks;
};

const sanitizeMermaidCode = (code: string): string => {
    let sanitized = code;

    // Handle Square Brackets []
    sanitized = sanitized.replace(/([a-zA-Z0-9_]+)\s*\[([\s\S]*?)\]/g, (match, id, content) => {
        if (content.includes('\n') && !content.trim().startsWith('"')) {
            const escapedContent = content
                .trim()
                .replace(/"/g, "'")
                .replace(/\n/g, '<br/>');
            return `${id}["${escapedContent}"]`;
        }
        return match;
    });

    // Handle Round Brackets ()
    sanitized = sanitized.replace(/([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)/g, (match, id, content) => {
        if (content.includes('\n') && !content.trim().startsWith('"')) {
            const escapedContent = content
                .trim()
                .replace(/"/g, "'")
                .replace(/\n/g, '<br/>');
            return `${id}("${escapedContent}")`;
        }
        return match;
    });

    return sanitized;
};

const renderMermaidToSVG = async (code: string, index: number): Promise<string> => {
    try {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const id = `mermaid-export-${index}-${timestamp}-${random}`;

        const existingElement = document.getElementById(id);
        if (existingElement) {
            existingElement.remove();
        }

        const sanitizedCode = sanitizeMermaidCode(code);
        const { svg } = await mermaid.render(id, sanitizedCode);

        return `<div style="text-align: center; margin: 30px 0; padding: 30px; background-color: #1a1a1a; border-radius: 8px; border: 1px solid #8B0000; overflow-x: auto; overflow-y: visible;">${svg}</div>`;
    } catch (error) {
        console.error('Error rendering mermaid diagram:', error);
        return `<div style="padding: 20px; background-color: #2a0000; border-radius: 8px; border: 1px solid #ff6b6b; margin: 20px 0;">
      <p style="color: #ff6b6b; margin: 0;"><strong>Mermaid Diagram (rendering failed)</strong></p>
      <pre style="color: #ff9999; margin-top: 10px; font-size: 12px; white-space: pre-wrap;">${code}</pre>
    </div>`;
    }
};

const convertMarkdownToHTML = async (content: string): Promise<string> => {
    let html = content;
    const mermaidBlocks = extractMermaidBlocks(content);

    // Convert mermaid blocks to SVG
    for (let i = mermaidBlocks.length - 1; i >= 0; i--) {
        const block = mermaidBlocks[i];
        try {
            const svgHtml = await renderMermaidToSVG(block.code, i);
            html = html.replace(block.fullMatch, svgHtml);
        } catch (error) {
            console.error('Error converting mermaid block:', error);
        }
    }

    // Convert markdown to HTML
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/```(?!mermaid)(\w+)?\s*\n([\s\S]*?)```/g, '<pre style="background-color: #0a0a0a; color: #e0e0e0; padding: 16px; border-radius: 8px; border-left: 4px solid #8B0000; overflow-x: auto;"><code>$2</code></pre>');
    html = html.replace(/`(.+?)`/g, '<code style="background-color: #2a2a2a; color: #ff6b6b; padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #ff6b6b; text-decoration: underline;">$1</a>');
    html = html.replace(/^- (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul style="margin: 8px 0; padding-left: 24px;">$1</ul>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    return html;
};

export const ExportService = {
    async exportAsMarkdown(page: Page): Promise<void> {
        try {
            const content = `# ${page.title}\n\n${page.content}`;
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            const fileName = `${page.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
            saveAs(blob, fileName);
        } catch (error) {
            console.error('Error exporting markdown:', error);
            alert('Failed to export markdown file');
        }
    },

    async exportAsHTML(page: Page): Promise<void> {
        let loadingMsg: HTMLDivElement | null = null;
        try {
            loadingMsg = document.createElement('div');
            loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #1a1a1a; color: #fff; padding: 20px 40px; border-radius: 8px; border: 2px solid #8B0000; z-index: 10000; font-size: 16px;';
            loadingMsg.textContent = 'Generating HTML with diagrams...';
            document.body.appendChild(loadingMsg);

            const htmlContent = await convertMarkdownToHTML(page.content);

            const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 95%;
      margin: 0 auto;
      padding: 40px 20px;
      background-color: #000000;
      color: #e0e0e0;
      line-height: 1.6;
    }
    h1 { color: #ffffff; border-bottom: 2px solid #8B0000; padding-bottom: 10px; }
    h2 { color: #ffffff; margin-top: 30px; }
    h3 { color: #ffffff; margin-top: 20px; }
    code { background-color: #2a2a2a; color: #ff6b6b; padding: 2px 6px; border-radius: 4px; }
    pre { background-color: #0a0a0a; padding: 16px; border-radius: 8px; overflow-x: auto; }
    a { color: #ff6b6b; text-decoration: underline; }
    svg { width: 100% !important; max-width: 100% !important; height: auto !important; }
  </style>
</head>
<body>
  <h1>${page.title}</h1>
  <div>${htmlContent}</div>
</body>
</html>`;

            const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
            const fileName = `${page.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
            saveAs(blob, fileName);

        } catch (error) {
            console.error('Error exporting HTML:', error);
            alert('Failed to export HTML file. Error: ' + (error as Error).message);
        } finally {
            if (loadingMsg && loadingMsg.parentNode) {
                try {
                    document.body.removeChild(loadingMsg);
                } catch (e) {
                    console.error('Error removing loading message:', e);
                }
            }
        }
    },

    async exportAsPDF(page: Page): Promise<void> {
        if (window.confirm('PDF export will create an HTML file with rendered diagrams. You can then convert it to PDF using your browser\'s print function. Continue?')) {
            await this.exportAsHTML(page);
            setTimeout(() => {
                alert('To convert to PDF:\n1. Open the downloaded HTML file in your browser\n2. Press Ctrl+P (or Cmd+P on Mac)\n3. Select "Save as PDF" as the destination\n4. Click Save');
            }, 500);
        }
    },

    async exportAsText(page: Page): Promise<void> {
        try {
            const content = `${page.title}\n\n${page.content}`;
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const fileName = `${page.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
            saveAs(blob, fileName);
        } catch (error) {
            console.error('Error exporting text:', error);
            alert('Failed to export text file');
        }
    },
};
