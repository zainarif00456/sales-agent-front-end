import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Document } from '../types';
import { useDocumentTree, useDocumentMutations } from '../hooks/useDocumentation';

interface PagesContextType {
    pages: Record<number, Document>;
    tree: Document[]; // Add tree to expose hierarchical structure
    activePage: Document | null;
    setActivePage: (page: Document | null) => void;
    createPage: (title?: string, parentId?: number | null) => Promise<Document>;
    updatePage: (pageId: number, updates: Partial<Document>) => Promise<void>;
    deletePage: (pageId: number) => Promise<void>;
    loading: boolean;
    refreshTree: () => void;
}

const PagesContext = createContext<PagesContextType | undefined>(undefined);

export const PagesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pages, setPages] = useState<Record<number, Document>>({});
    const [activePage, setActivePageState] = useState<Document | null>(null);
    const { tree, loading, refetch: refreshTree } = useDocumentTree();
    const { createDocument, deleteDocument } = useDocumentMutations();

    // Convert tree to flat pages object
    useEffect(() => {
        const flattenTree = (docs: Document[]): Record<number, Document> => {
            const result: Record<number, Document> = {};

            const flatten = (doc: Document) => {
                result[doc.id] = doc;
                if (doc.children && doc.children.length > 0) {
                    doc.children.forEach(flatten);
                }
            };

            docs.forEach(flatten);
            return result;
        };

        if (tree.length > 0) {
            const flatPages = flattenTree(tree);
            setPages(flatPages);

            // Don't auto-select first page - let user choose from tree
            // Only update activePage if it was deleted or doesn't exist anymore
            if (activePage && !flatPages[activePage.id]) {
                setActivePageState(null);
            }
        }
    }, [tree]); // Remove activePage from dependencies to prevent loops

    const setActivePage = useCallback((page: Document | null) => {
        setActivePageState(page);
    }, []);

    const createPage = useCallback(async (title: string = 'Untitled', parentId: number | null = null): Promise<Document> => {
        try {
            const newPage = await createDocument({
                title,
                content: '',
                parent: parentId,
                is_public: false,
                is_published: false,
            });

            // Refresh tree to get updated structure
            await refreshTree();

            return newPage;
        } catch (error) {
            console.error('Error creating page:', error);
            throw error;
        }
    }, [createDocument, refreshTree]);

    const updatePage = useCallback(async (pageId: number, updates: Partial<Document>) => {
        try {
            // Optimistically update local state
            setPages(prev => {
                if (!prev[pageId]) return prev;

                const updatedPage = {
                    ...prev[pageId],
                    ...updates,
                    updated_at: new Date().toISOString(),
                };

                const newPages = { ...prev, [pageId]: updatedPage };

                // Update active page if it's the one being updated
                if (activePage?.id === pageId) {
                    setActivePageState(updatedPage);
                }

                return newPages;
            });

            // Send update to backend (will be handled by autosave in the component)
            // We don't call updateDocument here to avoid duplicate requests
        } catch (error) {
            console.error('Error updating page:', error);
            // Revert optimistic update on error
            await refreshTree();
            throw error;
        }
    }, [activePage, refreshTree]);

    const deletePage = useCallback(async (pageId: number) => {
        try {
            await deleteDocument(pageId);

            // If active page was deleted, clear it
            if (activePage?.id === pageId) {
                setActivePageState(null);
            }

            // Refresh tree to get updated structure
            await refreshTree();
        } catch (error) {
            console.error('Error deleting page:', error);
            throw error;
        }
    }, [deleteDocument, activePage, refreshTree]);

    return (
        <PagesContext.Provider
            value={{
                pages,
                tree,
                activePage,
                setActivePage,
                createPage,
                updatePage,
                deletePage,
                loading,
                refreshTree,
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
