import apiClient from '@/lib/axios';

export interface ResumeProcessedData {
    raw_analysis: string;
    extracted_at: string;
    processing_status: 'success' | 'failed' | 'pending';
}

export interface Agent {
    id: string;
    user: number;
    user_email: string;
    name: string;
    role: string;
    company?: string;
    personality_description: string;
    message_style?: string | null;
    expertise_areas: string[];
    years_of_experience?: number;
    current_projects?: string;
    education?: string;
    resume_file?: string;
    resume_text?: string;
    resume_processed_data?: ResumeProcessedData;
    agent_prompt?: string;
    temperature?: number;
    system_prompt?: string;
    is_active: boolean;
    knowledge_base: any[];
    created_at: string;
    updated_at: string;
}

export interface AgentCreateData {
    name: string;
    role: string;
    company?: string;
    personality_description: string;
    message_style?: string | null;
    expertise_areas: string[];
    years_of_experience?: number;
    current_projects?: string;
    education?: string;
    resume_file?: File;
    temperature?: number;
}

export interface GetAgentsParams {
    is_active?: boolean;
    search?: string;
}

const agentService = {
    // Get all agents
    getAgents: async (params?: GetAgentsParams) => {
        const response = await apiClient.get('/agents/', { params });
        return response.data;
    },

    // Get single agent
    getAgent: async (id: string) => {
        const response = await apiClient.get(`/agents/${id}/`);
        return response.data;
    },

    // Create agent
    createAgent: async (data: AgentCreateData) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('role', data.role);
        if (data.company) formData.append('company', data.company);
        formData.append('personality_description', data.personality_description);
        formData.append('expertise_areas', JSON.stringify(data.expertise_areas));
        if (data.years_of_experience) formData.append('years_of_experience', data.years_of_experience.toString());
        if (data.current_projects) formData.append('current_projects', data.current_projects);
        if (data.education) formData.append('education', data.education);
        if (data.temperature) formData.append('temperature', data.temperature.toString());
        if (data.resume_file) formData.append('resume_file', data.resume_file);
        if (data.message_style) formData.append('message_style', data.message_style);

        const response = await apiClient.post('/agents/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Update agent
    updateAgent: async (id: string, data: Partial<AgentCreateData>) => {
        const formData = new FormData();
        if (data.name) formData.append('name', data.name);
        if (data.role) formData.append('role', data.role);
        if (data.company) formData.append('company', data.company);
        if (data.personality_description) formData.append('personality_description', data.personality_description);
        if (data.expertise_areas) formData.append('expertise_areas', JSON.stringify(data.expertise_areas));
        if (data.years_of_experience) formData.append('years_of_experience', data.years_of_experience.toString());
        if (data.current_projects) formData.append('current_projects', data.current_projects);
        if (data.education) formData.append('education', data.education);
        if (data.temperature !== undefined) formData.append('temperature', data.temperature.toString());
        if (data.resume_file) formData.append('resume_file', data.resume_file);
        if (data.message_style !== undefined) {
            // Send empty string when null (clears the field server-side)
            formData.append('message_style', data.message_style ?? '');
        }

        const response = await apiClient.patch(`/agents/${id}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Delete agent
    deleteAgent: async (id: string) => {
        const response = await apiClient.delete(`/agents/${id}/`);
        return response.data;
    },

    // Upload resume for existing agent
    uploadResume: async (id: string, resumeFile: File) => {
        const formData = new FormData();
        formData.append('resume_file', resumeFile);

        const response = await apiClient.post(`/agents/${id}/upload_resume/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Regenerate personality prompt
    regeneratePrompt: async (id: string) => {
        const response = await apiClient.post(`/agents/${id}/regenerate_prompt/`);
        return response.data;
    },
};

export default agentService;
