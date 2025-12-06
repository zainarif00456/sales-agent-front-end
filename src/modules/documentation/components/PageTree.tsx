import React, { useState } from 'react';
import { usePages } from '../contexts/PagesContext';
import { Page } from '../types';
import { formatDate } from '../utils/helpers';
import './PageTree.css';

interface PageTreeProps {
    visible: boolean;
    onClose: () => void;
}

const PageTree: React.FC<PageTreeProps> = ({ visible, onClose }) => {
    const { pages, activePage, setActivePage, createPage, deletePage } = usePages();
    const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    if (!visible) return null;

    const toggleExpand = (pageId: string) => {
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

    const handlePageSelect = (page: Page) => {
        setActivePage(page);
        onClose();
    };

    const handleDeletePage = (page: Page, event: React.MouseEvent) => {
        event.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${page.title}" and all its subpages?`)) {
            deletePage(page.id);
        }
    };

    const handleCreatePage = () => {
        const newPage = createPage('Untitled', null);
        setActivePage(newPage);
        onClose();
    };

    const renderPageItem = (page: Page, depth: number = 0): JSX.Element => {
        const isExpanded = expandedPages.has(page.id);
        const hasChildren = page.children.length > 0;
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
                        <div className="page-date">{formatDate(page.updatedAt)}</div>
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
                        {page.children.map(childId => {
                            const childPage = pages[childId];
                            return childPage ? renderPageItem(childPage, depth + 1) : null;
                        })}
                    </div>
                )}
            </div>
        );
    };

    const getRootPages = (): Page[] => {
        return Object.values(pages)
            .filter(page => !page.parentId)
            .sort((a, b) => b.updatedAt - a.updatedAt);
    };

    const getFilteredPages = (): Page[] => {
        if (!searchQuery.trim()) {
            return getRootPages();
        }

        const query = searchQuery.toLowerCase();
        return Object.values(pages)
            .filter(page =>
                page.title.toLowerCase().includes(query) ||
                page.content.toLowerCase().includes(query)
            )
            .sort((a, b) => b.updatedAt - a.updatedAt);
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
