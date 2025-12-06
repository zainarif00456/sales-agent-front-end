// Re-export types from service for consistency
export type { Document, CreateDocumentData, UpdateDocumentData, DocumentVersion, Breadcrumb } from '@/services/documentation.service';

export interface Command {
    trigger: string;
    label: string;
    description: string;
    action: (editor: any) => void;
}

export type ExportFormat = 'pdf' | 'docx' | 'md' | 'html' | 'txt';
