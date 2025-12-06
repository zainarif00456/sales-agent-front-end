import { Page } from '../types';

export const generateId = (): string => {
    return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createNewPage = (title: string, parentId: string | null = null): Page => {
    const now = Date.now();
    return {
        id: generateId(),
        title,
        content: '',
        parentId,
        createdAt: now,
        updatedAt: now,
        children: [],
    };
};

export const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatDateTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
};

export const getPageDepth = (pageId: string, pages: Record<string, Page>): number => {
    let depth = 0;
    let currentPage = pages[pageId];

    while (currentPage?.parentId) {
        depth++;
        currentPage = pages[currentPage.parentId];
    }

    return depth;
};

export const getAllDescendants = (pageId: string, pages: Record<string, Page>): string[] => {
    const descendants: string[] = [];
    const page = pages[pageId];

    if (!page) return descendants;

    const traverse = (id: string) => {
        const currentPage = pages[id];
        if (!currentPage) return;

        currentPage.children.forEach((childId) => {
            descendants.push(childId);
            traverse(childId);
        });
    };

    traverse(pageId);
    return descendants;
};
