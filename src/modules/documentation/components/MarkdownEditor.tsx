import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { usePages } from '../contexts/PagesContext';
import './MarkdownEditor.css';

interface Command {
    trigger: string;
    label: string;
    description: string;
    insert: string;
}

const COMMANDS: Command[] = [
    { trigger: '/h1', label: 'Heading 1', description: 'Large heading', insert: '# ' },
    { trigger: '/h2', label: 'Heading 2', description: 'Medium heading', insert: '## ' },
    { trigger: '/h3', label: 'Heading 3', description: 'Small heading', insert: '### ' },
    { trigger: '/code', label: 'Code Block', description: 'Insert code snippet', insert: '```\n\n```' },
    { trigger: '/quote', label: 'Quote', description: 'Insert blockquote', insert: '> ' },
    { trigger: '/list', label: 'Bullet List', description: 'Create bullet list', insert: '- ' },
    { trigger: '/number', label: 'Numbered List', description: 'Create numbered list', insert: '1. ' },
    { trigger: '/mermaid', label: 'Mermaid Diagram', description: 'Insert mermaid diagram', insert: '```mermaid\ngraph TD\n    A[Start] --> B[End]\n```' },
    { trigger: '/page', label: 'New Page', description: 'Create a new page', insert: '' },
    { trigger: '/divider', label: 'Divider', description: 'Horizontal line', insert: '\n---\n' },
    { trigger: '/table', label: 'Table', description: 'Insert table', insert: '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |' },
];

interface MarkdownEditorProps {
    value: string;
    onChange: (text: string) => void;
    pageId: number;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, pageId }) => {
    const [showCommands, setShowCommands] = useState(false);
    const [commandSearch, setCommandSearch] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { createPage, setActivePage } = usePages();

    const filteredCommands = COMMANDS.filter(cmd =>
        cmd.trigger.includes(commandSearch.toLowerCase()) ||
        cmd.label.toLowerCase().includes(commandSearch.toLowerCase())
    );

    const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const cursor = e.target.selectionStart;
        onChange(text);
        setCursorPosition(cursor);

        // Check for command trigger
        const lastSlashIndex = text.lastIndexOf('/', cursor);
        if (lastSlashIndex !== -1 && lastSlashIndex < cursor) {
            const textAfterSlash = text.substring(lastSlashIndex, cursor);
            if (textAfterSlash.startsWith('/') && !textAfterSlash.includes('\n')) {
                setCommandSearch(textAfterSlash);
                setShowCommands(true);
                setSelectedCommandIndex(0);
            } else {
                setShowCommands(false);
            }
        } else {
            setShowCommands(false);
        }
    };

    const handleCommandSelect = async (command: Command) => {
        if (command.trigger === '/page') {
            // Create new page
            try {
                const newPage = await createPage('Untitled', pageId);
                setActivePage(newPage);
                setShowCommands(false);
            } catch (error) {
                console.error('Failed to create page:', error);
            }
            return;
        }

        // Find the last slash position
        const lastSlashIndex = value.lastIndexOf('/', cursorPosition);

        if (lastSlashIndex !== -1) {
            // Replace the command trigger with the insert text
            const beforeSlash = value.substring(0, lastSlashIndex);
            const afterCommand = value.substring(cursorPosition);
            const newText = beforeSlash + command.insert + afterCommand;

            onChange(newText);
            setShowCommands(false);

            // Set cursor position after inserted text
            setTimeout(() => {
                if (textareaRef.current) {
                    const newCursorPos = lastSlashIndex + command.insert.length;
                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                    textareaRef.current.focus();
                }
            }, 10);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommands && filteredCommands.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedCommandIndex((prev) =>
                    prev < filteredCommands.length - 1 ? prev + 1 : prev
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedCommandIndex((prev) => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleCommandSelect(filteredCommands[selectedCommandIndex]);
            } else if (e.key === 'Escape') {
                setShowCommands(false);
            }
        }
    };

    return (
        <div className="markdown-editor-container">
            <textarea
                ref={textareaRef}
                className="markdown-editor"
                value={value}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Start typing... Use / for commands"
                spellCheck={false}
            />

            {showCommands && filteredCommands.length > 0 && (
                <div className="commands-container">
                    {filteredCommands.map((cmd, idx) => (
                        <div
                            key={cmd.trigger}
                            className={`command-item ${idx === selectedCommandIndex ? 'selected' : ''}`}
                            onClick={() => handleCommandSelect(cmd)}
                        >
                            <div className="command-content">
                                <span className="command-label">{cmd.label}</span>
                                <span className="command-trigger">{cmd.trigger}</span>
                            </div>
                            <span className="command-description">{cmd.description}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MarkdownEditor;
