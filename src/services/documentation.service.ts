import apiClient from '@/lib/axios';

export interface Document {
    id: number;
    title: string;
    content: string;
    slug: string;
    icon?: string;
    cover_image?: string;
    parent: number | null;
    order: number;
    owner: {
        id: number;
        email: string;
        first_name: string;
        last_name: string;
    };
    shared_with: any[];
    is_public: boolean;
    is_published: boolean;
    version: number;
    created_at: string;
    updated_at: string;
    children?: Document[];
    ancestors?: number[];
    breadcrumbs?: Breadcrumb[];
    depth?: number;
}

export interface Breadcrumb {
    id: number;
    title: string;
    slug: string;
}

export interface CreateDocumentData {
    title: string;
    content?: string;
    icon?: string;
    cover_image?: string;
    parent?: number | null;
    order?: number;
    shared_with_ids?: number[];
    is_public?: boolean;
    is_published?: boolean;
}

export interface UpdateDocumentData {
    title?: string;
    content?: string;
    icon?: string;
    cover_image?: string;
    parent?: number | null;
    order?: number;
    shared_with_ids?: number[];
    is_public?: boolean;
    is_published?: boolean;
}

export interface DocumentVersion {
    id: number;
    document: number;
    document_title: string;
    version_number: number;
    title: string;
    content: string;
    created_by: any;
    created_at: string;
    change_summary: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

class DocumentationService {
    private baseUrl = '/documentation';

    /**
     * List documents with optional filters
     */
    async listDocuments(params?: {
        page?: number;
        search?: string;
        is_public?: boolean;
        is_published?: boolean;
        parent?: number | 'null';
        ordering?: string;
    }): Promise<PaginatedResponse<Document>> {
        const response = await apiClient.get(`${this.baseUrl}/documents/`, { params });
        return response.data;
    }

    /**
     * Get document tree structure
     */
    async getDocumentTree(rootId?: number): Promise<Document[]> {
        const params = rootId ? { root_id: rootId } : {};
        const response = await apiClient.get(`${this.baseUrl}/documents/tree/`, { params });
        return Array.isArray(response.data) ? response.data : [response.data];
    }

    /**
     * Get single document by ID
     */
    async getDocument(id: number): Promise<Document> {
        const response = await apiClient.get(`${this.baseUrl}/documents/${id}/`);
        return response.data;
    }

    /**
     * Create a new document
     */
    async createDocument(data: CreateDocumentData): Promise<Document> {
        const response = await apiClient.post(`${this.baseUrl}/documents/`, data);
        return response.data;
    }

    /**
     * Update document (partial update)
     */
    async updateDocument(id: number, data: UpdateDocumentData): Promise<Document> {
        const response = await apiClient.patch(`${this.baseUrl}/documents/${id}/`, data);
        return response.data;
    }

    /**
     * Delete document (soft delete)
     */
    async deleteDocument(id: number): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/documents/${id}/`);
    }

    /**
     * Get direct children of a document
     */
    async getChildren(id: number, params?: { page?: number }): Promise<PaginatedResponse<Document>> {
        const response = await apiClient.get(`${this.baseUrl}/documents/${id}/children/`, { params });
        return response.data;
    }

    /**
     * Get ancestors of a document
     */
    async getAncestors(id: number): Promise<Document[]> {
        const response = await apiClient.get(`${this.baseUrl}/documents/${id}/ancestors/`);
        return response.data;
    }

    /**
     * Move document to new parent or reorder
     */
    async moveDocument(id: number, data: { parent?: number | null; order?: number }): Promise<Document> {
        const response = await apiClient.post(`${this.baseUrl}/documents/${id}/move/`, data);
        return response.data;
    }

    /**
     * Duplicate document
     */
    async duplicateDocument(id: number, data: { include_children?: boolean; new_title?: string }): Promise<Document> {
        const response = await apiClient.post(`${this.baseUrl}/documents/${id}/duplicate/`, data);
        return response.data;
    }

    /**
     * Restore deleted document
     */
    async restoreDocument(id: number): Promise<Document> {
        const response = await apiClient.post(`${this.baseUrl}/documents/${id}/restore/`);
        return response.data;
    }

    /**
     * Publish document
     */
    async publishDocument(id: number): Promise<Document> {
        const response = await apiClient.post(`${this.baseUrl}/documents/${id}/publish/`);
        return response.data;
    }

    /**
     * Unpublish document
     */
    async unpublishDocument(id: number): Promise<Document> {
        const response = await apiClient.post(`${this.baseUrl}/documents/${id}/unpublish/`);
        return response.data;
    }

    /**
     * Get user's documents
     */
    async getMyDocuments(params?: { page?: number }): Promise<PaginatedResponse<Document>> {
        const response = await apiClient.get(`${this.baseUrl}/documents/my_documents/`, { params });
        return response.data;
    }

    /**
     * Get documents shared with user
     */
    async getSharedDocuments(params?: { page?: number }): Promise<PaginatedResponse<Document>> {
        const response = await apiClient.get(`${this.baseUrl}/documents/shared_with_me/`, { params });
        return response.data;
    }

    /**
     * Get public documents
     */
    async getPublicDocuments(params?: { page?: number }): Promise<PaginatedResponse<Document>> {
        const response = await apiClient.get(`${this.baseUrl}/documents/public_documents/`, { params });
        return response.data;
    }

    /**
     * Get document versions
     */
    async getVersions(documentId: number): Promise<PaginatedResponse<DocumentVersion>> {
        const response = await apiClient.get(`${this.baseUrl}/document-versions/`, {
            params: { document: documentId }
        });
        return response.data;
    }

    /**
     * Rollback to specific version
     */
    async rollbackToVersion(versionId: number): Promise<Document> {
        const response = await apiClient.post(`${this.baseUrl}/document-versions/${versionId}/rollback/`);
        return response.data;
    }
}

export const documentationService = new DocumentationService();
