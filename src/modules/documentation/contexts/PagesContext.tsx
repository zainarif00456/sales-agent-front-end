import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Page } from '../types';
import { StorageService } from '../utils/storage';
import { createNewPage } from '../utils/helpers';

interface PagesContextType {
    pages: Record<string, Page>;
    activePage: Page | null;
    setActivePage: (page: Page | null) => void;
    createPage: (title?: string, parentId?: string | null) => Page;
    updatePage: (pageId: string, updates: Partial<Page>) => void;
    deletePage: (pageId: string) => void;
    loading: boolean;
}

const PagesContext = createContext<PagesContextType | undefined>(undefined);

export const PagesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pages, setPages] = useState<Record<string, Page>>({});
    const [activePage, setActivePageState] = useState<Page | null>(null);
    const [loading, setLoading] = useState(true);

    // Load pages on mount
    useEffect(() => {
        loadPagesFromStorage();
    }, []);

    // Save pages whenever they change
    useEffect(() => {
        if (!loading && Object.keys(pages).length > 0) {
            StorageService.savePages(pages);
        }
    }, [pages, loading]);

    // Save active page ID whenever it changes
    useEffect(() => {
        if (activePage) {
            StorageService.saveActivePageId(activePage.id);
        }
    }, [activePage]);

    const loadPagesFromStorage = () => {
        try {
            const loadedPages = StorageService.loadPages();

            // If no pages exist, create a default welcome page
            if (Object.keys(loadedPages).length === 0) {
                const welcomePage = createNewPage('Welcome to Documentation', null);
                welcomePage.content = `# Welcome to Documentation! 📝

This is a powerful markdown-based documentation system with the following features:

## Features
- **Nested Pages**: Create hierarchical page structures
- **Markdown Support**: Full markdown formatting
- **Mermaid Diagrams**: Visualize flowcharts and diagrams
- **Export Options**: Export to PDF, HTML, or MD
- **Offline Storage**: All data persists locally

## Quick Commands
Type \`/\` to see available commands:
- \`/h1\`, \`/h2\`, \`/h3\` - Headings
- \`/code\` - Code block
- \`/page\` - Create new page

## Try Mermaid Diagrams
\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Check the docs]
    C --> E[Build something awesome]
    D --> E
\`\`\`

Start creating your documentation now! 🚀`;

                loadedPages[welcomePage.id] = welcomePage;
                setPages(loadedPages);
                setActivePageState(welcomePage);
            } else {
                setPages(loadedPages);

                // Try to restore the last active page
                const activePageId = StorageService.loadActivePageId();
                if (activePageId && loadedPages[activePageId]) {
                    setActivePageState(loadedPages[activePageId]);
                } else {
                    // Set first page as active
                    const firstPage = Object.values(loadedPages)[0];
                    setActivePageState(firstPage);
                }
            }
        } catch (error) {
            console.error('Error loading pages:', error);
        } finally {
            setLoading(false);
        }
    };

    const setActivePage = (page: Page | null) => {
        setActivePageState(page);
    };

    const createPage = (title: string = 'Untitled', parentId: string | null = null): Page => {
        const newPage = createNewPage(title, parentId);

        setPages(prev => {
            const updated = { ...prev, [newPage.id]: newPage };

            // Update parent's children array
            if (parentId && prev[parentId]) {
                updated[parentId] = {
                    ...prev[parentId],
                    children: [...prev[parentId].children, newPage.id],
                };
            }

            return updated;
        });

        return newPage;
    };

    const updatePage = (pageId: string, updates: Partial<Page>) => {
        setPages(prev => {
            if (!prev[pageId]) return prev;

            const updatedPage = {
                ...prev[pageId],
                ...updates,
                updatedAt: Date.now(),
            };

            const newPages = { ...prev, [pageId]: updatedPage };

            // Update active page if it's the one being updated
            if (activePage?.id === pageId) {
                setActivePageState(updatedPage);
            }

            return newPages;
        });
    };

    const deletePage = (pageId: string) => {
        setPages(prev => {
            const page = prev[pageId];
            if (!page) return prev;

            const newPages = { ...prev };

            // Remove from parent's children
            if (page.parentId && newPages[page.parentId]) {
                newPages[page.parentId] = {
                    ...newPages[page.parentId],
                    children: newPages[page.parentId].children.filter(id => id !== pageId),
                };
            }

            // Recursively delete children
            const deleteRecursive = (id: string) => {
                const pageToDelete = newPages[id];
                if (pageToDelete) {
                    pageToDelete.children.forEach(childId => deleteRecursive(childId));
                    delete newPages[id];
                }
            };

            deleteRecursive(pageId);

            // If active page was deleted, set to null
            if (activePage?.id === pageId) {
                setActivePageState(null);
            }

            return newPages;
        });
    };

    return (
        <PagesContext.Provider
            value={{
                pages,
                activePage,
                setActivePage,
                createPage,
                updatePage,
                deletePage,
                loading,
            }}
        >
            {children}
        </PagesContext.Provider>
    );
};

export const usePages = (): PagesContextType => {
    const context = useContext(PagesContext);
    if (!context) {
        throw new Error('usePages must be used within a PagesProvider');
    }
    return context;
};
