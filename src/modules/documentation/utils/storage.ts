import { Page } from '../types';

const PAGES_KEY = 'sales_assistant_docs_pages';
const ACTIVE_PAGE_KEY = 'sales_assistant_docs_active_page';

export const StorageService = {
    // Save all pages
    savePages(pages: Record<string, Page>): void {
        try {
            localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
        } catch (error) {
            console.error('Error saving pages:', error);
            throw error;
        }
    },

    // Load all pages
    loadPages(): Record<string, Page> {
        try {
            const pagesJson = localStorage.getItem(PAGES_KEY);
            return pagesJson ? JSON.parse(pagesJson) : {};
        } catch (error) {
            console.error('Error loading pages:', error);
            return {};
        }
    },

    // Save active page ID
    saveActivePageId(pageId: string): void {
        try {
            localStorage.setItem(ACTIVE_PAGE_KEY, pageId);
        } catch (error) {
            console.error('Error saving active page:', error);
        }
    },

    // Load active page ID
    loadActivePageId(): string | null {
        try {
            return localStorage.getItem(ACTIVE_PAGE_KEY);
        } catch (error) {
            console.error('Error loading active page:', error);
            return null;
        }
    },

    // Clear all data
    clearAll(): void {
        try {
            localStorage.removeItem(PAGES_KEY);
            localStorage.removeItem(ACTIVE_PAGE_KEY);
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    },
};
