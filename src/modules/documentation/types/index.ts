export interface Page {
    id: string;
    title: string;
    content: string;
    parentId: string | null;
    createdAt: number;
    updatedAt: number;
    children: string[];
    icon?: string;
}

export interface Command {
    trigger: string;
    label: string;
    description: string;
    action: (editor: any) => void;
}

export type ExportFormat = 'pdf' | 'docx' | 'md';
