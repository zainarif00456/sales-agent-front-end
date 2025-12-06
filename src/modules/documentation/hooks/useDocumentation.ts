import { useState, useEffect, useRef, useCallback } from 'react';
import { documentationService, Document, UpdateDocumentData } from '@/services/documentation.service';
import toast from 'react-hot-toast';

interface UseDocumentAutosaveOptions {
    documentId: number | null;
    debounceMs?: number;
    onSaveSuccess?: (document: Document) => void;
    onSaveError?: (error: any) => void;
}

interface AutosaveState {
    isSaving: boolean;
    lastSaved: Date | null;
    hasUnsavedChanges: boolean;
    error: string | null;
}

/**
 * Hook for autosaving document changes with debouncing
 * Automatically saves content and title changes after a delay
 */
export function useDocumentAutosave({
    documentId,
    debounceMs = 1000,
    onSaveSuccess,
    onSaveError,
}: UseDocumentAutosaveOptions) {
    const [state, setState] = useState<AutosaveState>({
        isSaving: false,
        lastSaved: null,
        hasUnsavedChanges: false,
        error: null,
    });

    const saveTimeoutRef = useRef<number | null>(null);
    const pendingChangesRef = useRef<UpdateDocumentData>({});
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const saveChanges = useCallback(async () => {
        if (!documentId || Object.keys(pendingChangesRef.current).length === 0) {
            console.log('[useDocumentAutosave] No changes to save or no document ID');
            return;
        }

        const changesToSave = { ...pendingChangesRef.current };
        pendingChangesRef.current = {};

        if (!isMountedRef.current) return;

        console.log('[useDocumentAutosave] Saving changes to backend:', changesToSave);
        setState(prev => ({ ...prev, isSaving: true, error: null }));

        try {
            const updatedDocument = await documentationService.updateDocument(documentId, changesToSave);

            if (!isMountedRef.current) return;

            console.log('[useDocumentAutosave] Save successful!', updatedDocument);
            setState({
                isSaving: false,
                lastSaved: new Date(),
                hasUnsavedChanges: false,
                error: null,
            });

            onSaveSuccess?.(updatedDocument);
        } catch (error: any) {
            if (!isMountedRef.current) return;

            const errorMessage = error.response?.data?.detail || error.message || 'Failed to save changes';

            console.error('[useDocumentAutosave] Save failed:', errorMessage, error);
            setState(prev => ({
                ...prev,
                isSaving: false,
                error: errorMessage,
            }));

            // Restore pending changes on error
            pendingChangesRef.current = { ...changesToSave, ...pendingChangesRef.current };

            onSaveError?.(error);
            toast.error(errorMessage);
        }
    }, [documentId, onSaveSuccess, onSaveError]);

    const scheduleAutosave = useCallback((changes: UpdateDocumentData) => {
        if (!documentId) return;

        console.log('[useDocumentAutosave] Scheduling autosave for document', documentId, 'with changes:', changes);

        // Merge new changes with pending changes
        pendingChangesRef.current = { ...pendingChangesRef.current, ...changes };

        setState(prev => ({ ...prev, hasUnsavedChanges: true }));

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Schedule new save
        saveTimeoutRef.current = setTimeout(() => {
            console.log('[useDocumentAutosave] Debounce timeout reached, saving now...');
            saveChanges();
        }, debounceMs) as unknown as number;
    }, [documentId, debounceMs, saveChanges]);

    const saveNow = useCallback(async () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        await saveChanges();
    }, [saveChanges]);

    return {
        ...state,
        scheduleAutosave,
        saveNow,
    };
}

/**
 * Hook for fetching and managing a single document
 */
export function useDocument(id: number | null) {
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDocument = useCallback(async () => {
        if (!id) {
            setDocument(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await documentationService.getDocument(id);
            setDocument(data);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch document';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDocument();
    }, [fetchDocument]);

    return { document, loading, error, refetch: fetchDocument, setDocument };
}

/**
 * Hook for fetching document tree
 */
export function useDocumentTree(rootId?: number) {
    const [tree, setTree] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTree = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await documentationService.getDocumentTree(rootId);
            setTree(data);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch document tree';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [rootId]);

    useEffect(() => {
        fetchTree();
    }, [fetchTree]);

    return { tree, loading, error, refetch: fetchTree };
}

/**
 * Hook for document mutations (create, update, delete, etc.)
 */
export function useDocumentMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createDocument = useCallback(async (data: any) => {
        try {
            setLoading(true);
            setError(null);
            const result = await documentationService.createDocument(data);
            toast.success('Document created successfully');
            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || 'Failed to create document';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateDocument = useCallback(async (id: number, data: any) => {
        try {
            setLoading(true);
            setError(null);
            const result = await documentationService.updateDocument(id, data);
            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || 'Failed to update document';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteDocument = useCallback(async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            await documentationService.deleteDocument(id);
            toast.success('Document deleted successfully');
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete document';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const moveDocument = useCallback(async (id: number, data: any) => {
        try {
            setLoading(true);
            setError(null);
            const result = await documentationService.moveDocument(id, data);
            toast.success('Document moved successfully');
            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || 'Failed to move document';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const duplicateDocument = useCallback(async (id: number, data: any) => {
        try {
            setLoading(true);
            setError(null);
            const result = await documentationService.duplicateDocument(id, data);
            toast.success('Document duplicated successfully');
            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || 'Failed to duplicate document';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        createDocument,
        updateDocument,
        deleteDocument,
        moveDocument,
        duplicateDocument,
        loading,
        error,
    };
}
