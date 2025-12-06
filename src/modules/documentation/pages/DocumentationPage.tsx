import React, { useState, useEffect, useRef } from 'react';
import { usePages } from '../contexts/PagesContext';
import MarkdownEditor from '../components/MarkdownEditor';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { ExportService } from '../utils/export';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useDocumentAutosave } from '../hooks/useDocumentation';
import { Document } from '../types';
import './DocumentationPage.css';

type ViewMode = 'edit' | 'preview';

const DocumentationPage: React.FC = () => {
    const { pages, tree, activePage, updatePage, createPage, setActivePage, deletePage, loading } = usePages();
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleText, setTitleText] = useState('');
    const [contentText, setContentText] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('edit');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set());
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const previousPageIdRef = useRef<number | null>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    // Autosave hook
    const {
        isSaving,
        lastSaved,
        hasUnsavedChanges,
        scheduleAutosave,
        saveNow,
    } = useDocumentAutosave({
        documentId: activePage?.id || null,
        debounceMs: 1500,
        onSaveSuccess: (document) => {
            if (activePage?.id === document.id) {
                setActivePage(document);
            }
        },
    });

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        };

        if (showExportMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showExportMenu]);

    // Sync local state with active page
    useEffect(() => {
        if (activePage && activePage.id !== previousPageIdRef.current) {
            setTitleText(activePage.title);
            setContentText(activePage.content);
            previousPageIdRef.current = activePage.id;
        } else if (!activePage) {
            setTitleText('');
            setContentText('');
            previousPageIdRef.current = null;
        }
    }, [activePage]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (hasUnsavedChanges) {
                    saveNow();
                }
            }
            // Ctrl/Cmd + B to toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                setSidebarCollapsed(prev => !prev);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [hasUnsavedChanges, saveNow]);

    const handleContentChange = (text: string) => {
        setContentText(text);

        if (activePage && viewMode === 'edit') {
            updatePage(activePage.id, { content: text });
            scheduleAutosave({ content: text });
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitleText(e.target.value);
    };

    const handleTitleBlur = () => {
        if (activePage && titleText.trim() && titleText !== activePage.title) {
            updatePage(activePage.id, { title: titleText.trim() });
            scheduleAutosave({ title: titleText.trim() });
        }
        setEditingTitle(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleTitleBlur();
        } else if (e.key === 'Escape') {
            setTitleText(activePage?.title || '');
            setEditingTitle(false);
        }
    };

    const handleExport = async (format: 'md' | 'html' | 'pdf' | 'txt') => {
        if (!activePage) return;
        await saveNow();
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

    const handleCreateSubPage = async () => {
        if (activePage) {
            try {
                const newPage = await createPage('Untitled', activePage.id);
                setActivePage(newPage);
            } catch (error) {
                console.error('Failed to create subpage:', error);
            }
        }
    };

    const handleCreatePage = async () => {
        try {
            const newPage = await createPage('Untitled', null);
            setActivePage(newPage);
        } catch (error) {
            console.error('Failed to create page:', error);
        }
    };

    const handlePageSelect = async (page: Document) => {
        try {
            const { documentationService } = await import('@/services/documentation.service');
            const fullDocument = await documentationService.getDocument(page.id);
            setActivePage(fullDocument);
        } catch (error) {
            console.error('[DocumentationPage] Failed to fetch full document:', error);
            setActivePage(page);
        }
    };

    const handleDeletePage = async (page: Document, event: React.MouseEvent) => {
        event.stopPropagation();
        if (window.confirm(`Delete "${page.title}" and all subpages?`)) {
            try {
                await deletePage(page.id);
            } catch (error) {
                console.error('Failed to delete page:', error);
            }
        }
    };

    const toggleExpand = (pageId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        setExpandedPages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pageId)) {
                newSet.delete(pageId);
            } else {
                newSet.add(pageId);
            }
            return newSet;
        });
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const renderPageItem = (page: Document, depth: number = 0): JSX.Element => {
        const isExpanded = expandedPages.has(page.id);
        const hasChildren = page.children && page.children.length > 0;
        const isActive = activePage?.id === page.id;

        return (
            <div key={page.id} className="page-item-wrapper">
                <div
                    className={`sidebar-page-item ${isActive ? 'active' : ''}`}
                    style={{ paddingLeft: `${12 + depth * 16}px` }}
                    onClick={() => handlePageSelect(page)}
                >
                    {hasChildren && (
                        <button
                            className="expand-btn"
                            onClick={(e) => toggleExpand(page.id, e)}
                        >
                            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                                ▶
                            </span>
                        </button>
                    )}
                    <span className="page-icon">{page.icon || '📄'}</span>
                    <div className="page-details">
                        <div className="page-name">{page.title}</div>
                        <div className="page-meta">{formatDate(page.updated_at)}</div>
                    </div>
                    <button
                        className="delete-btn"
                        onClick={(e) => handleDeletePage(page, e)}
                        title="Delete"
                    >
                        🗑️
                    </button>
                </div>

                {isExpanded && hasChildren && (
                    <div className="children-container">
                        {page.children!.map((childDoc: Document) => renderPageItem(childDoc, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const getFilteredPages = (): Document[] => {
        if (!searchQuery.trim()) {
            // Return tree directly - it already contains only root pages with nested children
            return tree.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        }

        const query = searchQuery.toLowerCase();
        const matchingPageIds = new Set<number>();
        const parentIdsToExpand = new Set<number>();

        // Find all matching pages in the flattened pages object
        Object.values(pages).forEach(page => {
            if (page.title.toLowerCase().includes(query) ||
                page.content.toLowerCase().includes(query)) {
                matchingPageIds.add(page.id);

                // If this is a child page, mark parent for expansion
                if (page.parent) {
                    parentIdsToExpand.add(page.parent);
                }
            }
        });

        // Auto-expand parents with matching children
        setExpandedPages(prev => {
            const newSet = new Set(prev);
            parentIdsToExpand.forEach(id => newSet.add(id));
            return newSet;
        });

        // Filter tree to show only roots that match or have matching descendants
        const hasMatchingDescendant = (doc: Document): boolean => {
            if (matchingPageIds.has(doc.id)) return true;
            return doc.children?.some(child => hasMatchingDescendant(child)) || false;
        };

        return tree.filter(page => hasMatchingDescendant(page))
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    };

    const handleViewModeChange = async (mode: ViewMode) => {
        if (mode === 'preview' && hasUnsavedChanges) {
            await saveNow();
        }
        setViewMode(mode);
    };

    if (loading) {
        return (
            <Layout>
                <div className="loading-container">
                    <LoadingSpinner size="lg" />
                    <p className="loading-text">Loading documents...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="documentation-layout">
                {/* Collapsible Sidebar */}
                <div className={`docs-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                    <div className="sidebar-header">
                        <div className="sidebar-title-row">
                            <h2 className="sidebar-title">📚 Documents</h2>
                            <button
                                className="collapse-btn"
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                title={sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
                            >
                                {sidebarCollapsed ? '▶' : '◀'}
                            </button>
                        </div>
                        {!sidebarCollapsed && (
                            <button className="new-doc-btn" onClick={handleCreatePage}>
                                <span className="btn-icon">+</span>
                                <span className="btn-text">New Document</span>
                            </button>
                        )}
                    </div>

                    {!sidebarCollapsed && (
                        <>
                            <div className="sidebar-search">
                                <div className="search-wrapper">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Search documents..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="sidebar-list">
                                {getFilteredPages().length > 0 ? (
                                    getFilteredPages().map(page => renderPageItem(page))
                                ) : (
                                    <div className="empty-sidebar">
                                        <div className="empty-icon">📝</div>
                                        <p>No documents yet</p>
                                        <button className="create-first-btn" onClick={handleCreatePage}>
                                            Create First Document
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="docs-main">
                    {activePage ? (
                        <>
                            {/* Header */}
                            <div className="doc-header">
                                <div className="doc-header-left">
                                    {sidebarCollapsed && (
                                        <button
                                            className="expand-sidebar-btn"
                                            onClick={() => setSidebarCollapsed(false)}
                                            title="Show sidebar (Ctrl+B)"
                                        >
                                            ☰
                                        </button>
                                    )}
                                    {editingTitle ? (
                                        <input
                                            type="text"
                                            className="doc-title-input"
                                            value={titleText}
                                            onChange={handleTitleChange}
                                            onBlur={handleTitleBlur}
                                            onKeyDown={handleTitleKeyDown}
                                            autoFocus
                                            placeholder="Document title"
                                        />
                                    ) : (
                                        <h1 className="doc-title" onClick={() => setEditingTitle(true)}>
                                            {activePage.title}
                                        </h1>
                                    )}
                                </div>

                                <div className="doc-header-actions">
                                    {/* Autosave indicator */}
                                    <div className="autosave-indicator">
                                        {isSaving ? (
                                            <span className="status-badge saving">
                                                <span className="spinner"></span>
                                                Saving...
                                            </span>
                                        ) : hasUnsavedChanges ? (
                                            <span className="status-badge unsaved">
                                                ● Unsaved
                                            </span>
                                        ) : lastSaved ? (
                                            <span className="status-badge saved">
                                                ✓ Saved
                                            </span>
                                        ) : null}
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        className="action-btn primary-btn"
                                        onClick={async () => await saveNow()}
                                        disabled={isSaving || !hasUnsavedChanges}
                                        title="Save document (Ctrl+S)"
                                    >
                                        <span className="btn-icon">💾</span>
                                        <span className="btn-text">Save</span>
                                    </button>

                                    {/* Export Button */}
                                    <div className="export-wrapper" ref={exportMenuRef}>
                                        <button
                                            className="action-btn"
                                            onClick={() => setShowExportMenu(!showExportMenu)}
                                        >
                                            <span className="btn-icon">⤓</span>
                                            <span className="btn-text">Export</span>
                                        </button>

                                        {showExportMenu && (
                                            <div className="export-dropdown">
                                                <button className="export-item" onClick={() => handleExport('md')}>
                                                    <span className="export-icon">📝</span>
                                                    <span>Markdown</span>
                                                </button>
                                                <button className="export-item" onClick={() => handleExport('html')}>
                                                    <span className="export-icon">🌐</span>
                                                    <span>HTML</span>
                                                </button>
                                                <button className="export-item" onClick={() => handleExport('pdf')}>
                                                    <span className="export-icon">📄</span>
                                                    <span>PDF</span>
                                                </button>
                                                <button className="export-item" onClick={() => handleExport('txt')}>
                                                    <span className="export-icon">📃</span>
                                                    <span>Text</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="doc-action-bar">
                                <div className="view-mode-tabs">
                                    <button
                                        className={`tab-btn ${viewMode === 'edit' ? 'active' : ''}`}
                                        onClick={() => handleViewModeChange('edit')}
                                    >
                                        <span className="tab-icon">✏️</span>
                                        <span className="tab-text">Edit</span>
                                    </button>
                                    <button
                                        className={`tab-btn ${viewMode === 'preview' ? 'active' : ''}`}
                                        onClick={() => handleViewModeChange('preview')}
                                    >
                                        <span className="tab-icon">👁️</span>
                                        <span className="tab-text">Preview</span>
                                    </button>
                                </div>
                                <button className="action-btn secondary-btn" onClick={handleCreateSubPage}>
                                    <span className="btn-icon">+</span>
                                    <span className="btn-text">New Subpage</span>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="doc-content">
                                {viewMode === 'edit' ? (
                                    <MarkdownEditor
                                        value={contentText}
                                        onChange={handleContentChange}
                                        pageId={activePage.id}
                                    />
                                ) : (
                                    <MarkdownRenderer content={contentText} />
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-animation">
                                <div className="empty-icon">📝</div>
                                <div className="pulse-ring"></div>
                            </div>
                            <h2 className="empty-title">No Document Selected</h2>
                            <p className="empty-description">
                                {sidebarCollapsed
                                    ? 'Open the sidebar to select a document'
                                    : 'Select a document from the sidebar or create a new one'}
                            </p>
                            {sidebarCollapsed && (
                                <button
                                    className="action-btn primary-btn"
                                    onClick={() => setSidebarCollapsed(false)}
                                >
                                    <span className="btn-icon">☰</span>
                                    <span className="btn-text">Open Sidebar</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default DocumentationPage;
