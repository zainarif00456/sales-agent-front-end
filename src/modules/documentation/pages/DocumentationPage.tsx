import React, { useState, useEffect } from 'react';
import { usePages } from '../contexts/PagesContext';
import MarkdownEditor from '../components/MarkdownEditor';
import MarkdownRenderer from '../components/MarkdownRenderer';
import PageTree from '../components/PageTree';
import { ExportService } from '../utils/export';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import './DocumentationPage.css';

type ViewMode = 'edit' | 'preview';

const DocumentationPage: React.FC = () => {
    const { activePage, updatePage, createPage, setActivePage, loading } = usePages();
    const [showPageTree, setShowPageTree] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleText, setTitleText] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('edit');

    useEffect(() => {
        if (activePage) {
            setTitleText(activePage.title);
        }
    }, [activePage]);

    const handleContentChange = (text: string) => {
        if (activePage) {
            updatePage(activePage.id, { content: text });
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitleText(e.target.value);
    };

    const handleTitleBlur = () => {
        if (activePage && titleText.trim()) {
            updatePage(activePage.id, { title: titleText.trim() });
        }
        setEditingTitle(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleTitleBlur();
        }
    };

    const handleExport = async (format: 'md' | 'html' | 'pdf' | 'txt') => {
        if (!activePage) return;

        setShowExportMenu(false);

        switch (format) {
            case 'md':
                await ExportService.exportAsMarkdown(activePage);
                break;
            case 'html':
                await ExportService.exportAsHTML(activePage);
                break;
            case 'pdf':
                await ExportService.exportAsPDF(activePage);
                break;
            case 'txt':
                await ExportService.exportAsText(activePage);
                break;
        }
    };

    const handleCreateSubPage = () => {
        if (activePage) {
            const newPage = createPage('Untitled', activePage.id);
            setActivePage(newPage);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner size="lg" />
                </div>
            </Layout>
        );
    }

    if (!activePage) {
        return (
            <Layout>
                <div className="documentation-empty">
                    <div className="empty-icon">📝</div>
                    <h1 className="empty-title">No Page Selected</h1>
                    <p className="empty-description">
                        Create a new page or select one from the sidebar
                    </p>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            const newPage = createPage('Untitled', null);
                            setActivePage(newPage);
                        }}
                    >
                        Create New Page
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="documentation-page">
                {/* Header */}
                <div className="doc-header">
                    <button className="doc-header-button" onClick={() => setShowPageTree(true)}>
                        <span className="doc-header-button-icon">☰</span>
                    </button>

                    <div className="doc-header-center">
                        {editingTitle ? (
                            <input
                                type="text"
                                className="doc-title-input"
                                value={titleText}
                                onChange={handleTitleChange}
                                onBlur={handleTitleBlur}
                                onKeyDown={handleTitleKeyDown}
                                autoFocus
                                placeholder="Page title"
                            />
                        ) : (
                            <div className="doc-header-title" onClick={() => setEditingTitle(true)}>
                                {activePage.title}
                            </div>
                        )}
                    </div>

                    <button className="doc-header-button" onClick={() => setShowExportMenu(!showExportMenu)}>
                        <span className="doc-header-button-icon">⤓</span>
                    </button>
                </div>

                {/* Action Bar with Edit/Preview Tabs */}
                <div className="doc-action-bar">
                    <div className="view-mode-tabs">
                        <button
                            className={`tab-button ${viewMode === 'edit' ? 'active' : ''}`}
                            onClick={() => setViewMode('edit')}
                        >
                            ✏️ Edit
                        </button>
                        <button
                            className={`tab-button ${viewMode === 'preview' ? 'active' : ''}`}
                            onClick={() => setViewMode('preview')}
                        >
                            👁️ Preview
                        </button>
                    </div>
                    <button className="doc-action-button" onClick={handleCreateSubPage}>
                        <span className="doc-action-button-icon">+</span>
                        <span>New Subpage</span>
                    </button>
                </div>

                {/* Content - Edit or Preview Mode */}
                <div className="doc-content">
                    {viewMode === 'edit' ? (
                        <MarkdownEditor
                            value={activePage.content}
                            onChange={handleContentChange}
                            pageId={activePage.id}
                        />
                    ) : (
                        <MarkdownRenderer content={activePage.content} />
                    )}
                </div>

                {/* Page Tree Modal */}
                <PageTree visible={showPageTree} onClose={() => setShowPageTree(false)} />

                {/* Export Menu */}
                {showExportMenu && (
                    <div className="export-menu-overlay" onClick={() => setShowExportMenu(false)}>
                        <div className="export-menu" onClick={(e) => e.stopPropagation()}>
                            <div className="export-menu-title">Export As</div>

                            <button className="export-menu-item" onClick={() => handleExport('md')}>
                                <span className="export-menu-icon">📝</span>
                                <span>Markdown (.md)</span>
                            </button>

                            <button className="export-menu-item" onClick={() => handleExport('html')}>
                                <span className="export-menu-icon">🌐</span>
                                <span>HTML with Diagrams (.html)</span>
                            </button>

                            <button className="export-menu-item" onClick={() => handleExport('pdf')}>
                                <span className="export-menu-icon">📄</span>
                                <span>PDF with Diagrams (.pdf)</span>
                            </button>

                            <button className="export-menu-item" onClick={() => handleExport('txt')}>
                                <span className="export-menu-icon">📃</span>
                                <span>Text (.txt)</span>
                            </button>

                            <button
                                className="export-menu-cancel"
                                onClick={() => setShowExportMenu(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DocumentationPage;
