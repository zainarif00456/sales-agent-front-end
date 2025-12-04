import apiClient from '@/lib/axios';

// ============================================
// CLIENT PROFILE INTERFACES
// ============================================

export interface ClientProfile {
    name?: string;
    role?: string;
    company?: string;
    industry?: string;
    location?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    website?: string;
    background?: string;
    interests?: string[];
    skills?: string[];
    current_role?: string;
    company_size?: string;
    pain_points?: string[];
    budget_indicators?: string;
    decision_maker?: boolean;
    summary?: string;
}

// ============================================
// MESSAGE INTERFACES
// ============================================

export interface Message {
    id: string;
    user_message: string;
    agent_response: string;
    message_type: 'general' | 'user_query' | 'client_message';
    is_user_query?: boolean;
    is_client_query?: boolean;
    attachment_file?: string;
    client_profile_data?: ClientProfile;
    response_time_ms?: number;
    created_at: string;
}

export interface ConversationSession {
    id: string;
    agent: string;
    agent_details: {
        name: string;
        role: string;
    };
    title: string;
    is_active: boolean;
    message_count: number;
    messages?: Message[];
    created_at: string;
    updated_at: string;
}

export interface CreateSessionData {
    agent: string;
    title: string;
}

export interface SendMessageData {
    message: string;
    is_user_query?: boolean;
    is_client_query?: boolean;
    attachment_file?: File;
}

export interface SendMessageResponse {
    success: boolean;
    message: string;
    client_profile_extracted?: boolean;
    data: Message;
}

export interface SessionListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ConversationSession[];
}

// ============================================
// CONVERSATION SERVICE
// ============================================

export const conversationService = {
    async getSessions(params?: { page?: number; page_size?: number }): Promise<SessionListResponse> {
        const { data } = await apiClient.get('/conversations/sessions/', { params });
        return data;
    },

    async getSession(sessionId: string): Promise<ConversationSession> {
        const { data } = await apiClient.get(`/conversations/sessions/${sessionId}/`);
        return data;
    },

    async createSession(sessionData: CreateSessionData) {
        const { data } = await apiClient.post('/conversations/sessions/', sessionData);
        return data;
    },

    /**
     * Send a message with optional file attachment
     * Supports PDF and image files for client document analysis
     */
    async sendMessage(sessionId: string, messageData: SendMessageData): Promise<SendMessageResponse> {
        // If there's a file, use FormData for multipart/form-data
        if (messageData.attachment_file) {
            const formData = new FormData();
            formData.append('message', messageData.message);
            formData.append('is_user_query', String(messageData.is_user_query || false));
            formData.append('is_client_query', String(messageData.is_client_query || false));
            formData.append('attachment_file', messageData.attachment_file);

            const { data } = await apiClient.post(
                `/conversations/sessions/${sessionId}/send_message/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return data;
        }

        // Regular JSON request for text-only messages
        const { data } = await apiClient.post(
            `/conversations/sessions/${sessionId}/send_message/`,
            {
                message: messageData.message,
                is_user_query: messageData.is_user_query,
                is_client_query: messageData.is_client_query,
            }
        );
        return data;
    },

    async deleteSession(sessionId: string): Promise<void> {
        await apiClient.delete(`/conversations/sessions/${sessionId}/`);
    },
};

