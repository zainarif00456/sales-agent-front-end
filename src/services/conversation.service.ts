import apiClient from '@/lib/axios';

export interface Message {
    id: string;
    user_message: string;
    agent_response: string;
    message_type: 'general' | 'user_query' | 'client_message';
    is_user_query?: boolean;
    is_client_query?: boolean;
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
}

export interface SessionListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ConversationSession[];
}

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

    async sendMessage(sessionId: string, messageData: SendMessageData) {
        const { data } = await apiClient.post(
            `/conversations/sessions/${sessionId}/send_message/`,
            messageData
        );
        return data;
    },

    async deleteSession(sessionId: string): Promise<void> {
        await apiClient.delete(`/conversations/sessions/${sessionId}/`);
    },
};
