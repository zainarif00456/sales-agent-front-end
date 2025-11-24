import apiClient from '@/lib/axios';

export interface Agent {
    id: string;
    name: string;
    role: string;
    company?: string;
    personality_description: string;
    expertise_areas: string[];
    years_of_experience?: number;
    current_projects?: string;
    education?: string;
    temperature?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateAgentData {
    name: string;
    role: string;
    company?: string;
    personality_description: string;
    expertise_areas: string[];
    years_of_experience?: number;
    current_projects?: string;
    education?: string;
    resume_file?: File;
    temperature?: number;
}

export interface AgentListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Agent[];
}

export const agentService = {
    async getAgents(params?: { is_active?: boolean; search?: string }): Promise<AgentListResponse> {
        const { data } = await apiClient.get('/agents/', { params });
        return data;
    },

    async getAgent(id: string): Promise<Agent> {
        const { data } = await apiClient.get(`/agents/${id}/`);
        return data;
    },

    async createAgent(agentData: CreateAgentData) {
        const formData = new FormData();

        Object.entries(agentData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === 'expertise_areas') {
                    formData.append(key, JSON.stringify(value));
                } else if (key === 'resume_file' && value instanceof File) {
                    formData.append(key, value);
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        const { data } = await apiClient.post('/agents/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },

    async updateAgent(id: string, agentData: Partial<CreateAgentData>) {
        const formData = new FormData();

        Object.entries(agentData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === 'expertise_areas') {
                    formData.append(key, JSON.stringify(value));
                } else if (key === 'resume_file' && value instanceof File) {
                    formData.append(key, value);
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        const { data } = await apiClient.patch(`/agents/${id}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },

    async deleteAgent(id: string): Promise<void> {
        await apiClient.delete(`/agents/${id}/`);
    },
};
