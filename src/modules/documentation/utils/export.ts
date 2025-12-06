import { Document } from '../types';
import { saveAs } from 'file-saver';
import mermaid from 'mermaid';
import { marked } from 'marked';

// Initialize mermaid for export
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    flowchart: {
        useMaxWidth: false,
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
    maxTextSize: 900000,
    logLevel: 'error'
});

// Configure marked for GFM (GitHub Flavored Markdown) with tables
marked.setOptions({
    gfm: true,
    breaks: true
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

        return `<div class="mermaid-diagram" style="text-align: center; margin: 30px 0; padding: 30px; background-color: #1a1a1a; border-radius: 8px; border: 1px solid #8B0000; overflow-x: auto; overflow-y: visible; width: 100%;">${svg}</div>`;
    } catch (error) {
        console.error('Error rendering mermaid diagram:', error);
        return `<div style="padding: 20px; background-color: #2a0000; border-radius: 8px; border: 1px solid #ff6b6b; margin: 20px 0;">
      <p style="color: #ff6b6b; margin: 0;"><strong>Mermaid Diagram (rendering failed)</strong></p>
      <pre style="color: #ff9999; margin-top: 10px; font-size: 12px; white-space: pre-wrap;">${code}</pre>
    </div>`;
    }
};

const convertMarkdownToHTML = async (content: string): Promise<string> => {
    try {
        // Extract mermaid blocks first
        const mermaidBlocks = extractMermaidBlocks(content);
        const placeholders: { [key: string]: string } = {};

        // Replace mermaid blocks with placeholders
        let processedContent = content;
        for (let i = 0; i < mermaidBlocks.length; i++) {
            const placeholder = `__MERMAID_PLACEHOLDER_${i}__`;
            placeholders[placeholder] = mermaidBlocks[i].code;
            processedContent = processedContent.replace(mermaidBlocks[i].fullMatch, placeholder);
        }

        // Convert markdown to HTML using marked
        let html = await marked.parse(processedContent);

        // Render mermaid diagrams and replace placeholders
        for (const [placeholder, code] of Object.entries(placeholders)) {
            const index = parseInt(placeholder.match(/__MERMAID_PLACEHOLDER_(\d+)__/)?.[1] || '0');
            const svgHtml = await renderMermaidToSVG(code, index);
            html = html.replace(placeholder, svgHtml);
        }

        return html;
    } catch (error) {
        console.error('Error converting markdown to HTML:', error);
        throw error;
    }
};

export const ExportService = {
    async exportAsMarkdown(page: Document): Promise<void> {
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

    async exportAsHTML(page: Document): Promise<void> {
        let loadingMsg: HTMLDivElement | null = null;
        try {
            loadingMsg = document.createElement('div');
            loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #1a1a1a; color: #fff; padding: 20px 40px; border-radius: 8px; border: 2px solid #8B0000; z-index: 10000; font-size: 16px;';
            loadingMsg.textContent = 'Generating HTML with diagrams...';
            document.body.appendChild(loadingMsg);

            const htmlContent = await convertMarkdownToHTML(page.content);

            const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 95%;
      margin: 0 auto;
      padding: 40px 20px;
      background-color: #000000;
      color: #e0e0e0;
      line-height: 1.6;
    }
    
    h1 { 
      color: #ffffff; 
      border-bottom: 2px solid #8B0000; 
      padding-bottom: 10px; 
      margin-bottom: 20px;
      font-size: 2.5em;
    }
    
    h2 { 
      color: #ffffff; 
      margin-top: 30px; 
      margin-bottom: 15px;
      font-size: 2em;
      border-bottom: 1px solid #444;
      padding-bottom: 8px;
    }
    
    h3 { 
      color: #ffffff; 
      margin-top: 20px; 
      margin-bottom: 10px;
      font-size: 1.5em;
    }
    
    p {
      margin: 10px 0;
      line-height: 1.8;
    }
    
    code { 
      background-color: #2a2a2a; 
      color: #ff6b6b; 
      padding: 2px 6px; 
      border-radius: 4px; 
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    
    pre { 
      background-color: #0a0a0a; 
      padding: 16px; 
      border-radius: 8px; 
      overflow-x: auto;
      border-left: 4px solid #8B0000;
      margin: 15px 0;
    }
    
    pre code {
      background: none;
      padding: 0;
      color: #e0e0e0;
    }
    
    a { 
      color: #ff6b6b; 
      text-decoration: underline; 
    }
    
    a:hover {
      color: #ff8888;
    }
    
    ul, ol {
      margin: 10px 0;
      padding-left: 30px;
    }
    
    li {
      margin: 5px 0;
    }
    
    /* Table Styling */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background-color: #1a1a1a;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    thead {
      background-color: #8B0000;
    }
    
    th {
      padding: 12px 15px;
      text-align: left;
      font-weight: 600;
      color: #ffffff;
      border-bottom: 2px solid #660000;
    }
    
    td {
      padding: 10px 15px;
      border-bottom: 1px solid #333;
      color: #e0e0e0;
    }
    
    tr:hover {
      background-color: #252525;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    /* Mermaid Diagrams */
    .mermaid-diagram {
      margin: 30px 0;
    }
    
    svg { 
      max-width: 100% !important; 
      height: auto !important; 
      display: block;
      margin: 0 auto;
    }
    
    /* Blockquotes */
    blockquote {
      border-left: 4px solid #8B0000;
      padding-left: 20px;
      margin: 15px 0;
      color: #ccc;
      font-style: italic;
    }
    
    /* Horizontal Rule */
    hr {
      border: none;
      border-top: 1px solid #444;
      margin: 30px 0;
    }
    
    /* Print Styles */
    @media print {
      body {
        background-color: white;
        color: black;
      }
      
      h1, h2, h3 {
        color: black;
      }
      
      table {
        background-color: white;
      }
      
      thead {
        background-color: #f0f0f0;
      }
      
      th {
        color: black;
      }
      
      td {
        color: black;
        border-bottom: 1px solid #ccc;
      }
    }
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

    async exportAsPDF(page: Document): Promise<void> {
        if (window.confirm('PDF export will create an HTML file with rendered diagrams. You can then convert it to PDF using your browser\'s print function. Continue?')) {
            await this.exportAsHTML(page);
            setTimeout(() => {
                alert('To convert to PDF:\n1. Open the downloaded HTML file in your browser\n2. Press Ctrl+P (or Cmd+P on Mac)\n3. Select "Save as PDF" as the destination\n4. Click Save');
            }, 500);
        }
    },

    async exportAsText(page: Document): Promise<void> {
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
