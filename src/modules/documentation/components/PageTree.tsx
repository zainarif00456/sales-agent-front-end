import React, { useState } from 'react';
import { usePages } from '../contexts/PagesContext';
import { Document } from '../types';
import './PageTree.css';

// Helper to format date
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

interface PageTreeProps {
    visible: boolean;
    onClose: () => void;
}

const PageTree: React.FC<PageTreeProps> = ({ visible, onClose }) => {
    const { pages, activePage, setActivePage, createPage, deletePage } = usePages();
    const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    if (!visible) return null;

    const toggleExpand = (pageId: number) => {
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

    const handlePageSelect = async (page: Document) => {
        console.log('[PageTree] Page selected:', page.id, page.title);
        console.log('[PageTree] Page content from tree:', page.content?.substring(0, 100));

        // Fetch the full document from backend to ensure we have complete content
        try {
            const { documentationService } = await import('@/services/documentation.service');
            console.log('[PageTree] Fetching full document from backend...');
            const fullDocument = await documentationService.getDocument(page.id);
            console.log('[PageTree] Full document fetched:', fullDocument);
            console.log('[PageTree] Full content length:', fullDocument.content?.length);
            setActivePage(fullDocument);
        } catch (error) {
            console.error('[PageTree] Failed to fetch full document, using tree data:', error);
            // Fallback to tree data if fetch fails
            setActivePage(page);
        }
        onClose();
    };

    const handleDeletePage = async (page: Document, event: React.MouseEvent) => {
        event.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${page.title}" and all its subpages?`)) {
            try {
                await deletePage(page.id);
            } catch (error) {
                console.error('Failed to delete page:', error);
            }
        }
    };

    const handleCreatePage = async () => {
        try {
            const newPage = await createPage('Untitled', null);
            setActivePage(newPage);
            onClose();
        } catch (error) {
            console.error('Failed to create page:', error);
        }
    };

    const renderPageItem = (page: Document, depth: number = 0): JSX.Element => {
        const isExpanded = expandedPages.has(page.id);
        const hasChildren = page.children && page.children.length > 0;
        const isActive = activePage?.id === page.id;

        return (
            <div key={page.id}>
                <div
                    className={`page-item ${isActive ? 'active' : ''}`}
                    style={{ paddingLeft: `${16 + depth * 20}px` }}
                    onClick={() => handlePageSelect(page)}
                >
                    {hasChildren && (
                        <button
                            className="expand-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(page.id);
                            }}
                        >
                            <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                        </button>
                    )}

                    <span className="page-icon">{page.icon || '📄'}</span>

                    <div className="page-info">
                        <div className="page-title">{page.title}</div>
                        <div className="page-date">{formatDate(page.updated_at)}</div>
                    </div>

                    <button
                        className="delete-button"
                        onClick={(e) => handleDeletePage(page, e)}
                        title="Delete page"
                    >
                        🗑️
                    </button>
                </div>

                {isExpanded && hasChildren && (
                    <div>
                        {page.children!.map((childDoc: Document) => renderPageItem(childDoc, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const getRootPages = (): Document[] => {
        return Object.values(pages)
            .filter(page => !page.parent)
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    };

    const getFilteredPages = (): Document[] => {
        if (!searchQuery.trim()) {
            return getRootPages();
        }

        const query = searchQuery.toLowerCase();
        return Object.values(pages)
            .filter(page =>
                page.title.toLowerCase().includes(query) ||
                page.content.toLowerCase().includes(query)
            )
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    };

    return (
        <div className="page-tree-overlay" onClick={onClose}>
            <div className="page-tree-container" onClick={(e) => e.stopPropagation()}>
                <div className="page-tree-header">
                    <h2 className="page-tree-title">Pages</h2>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <div className="search-container">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search pages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <button className="create-page-button" onClick={handleCreatePage}>
                    <span className="create-icon">+</span>
                    <span>New Page</span>
                </button>

                <div className="pages-list">
                    {getFilteredPages().map(page => renderPageItem(page))}
                </div>
            </div>
        </div>
    );
};

export default PageTree;
