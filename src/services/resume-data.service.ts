import apiClient from '@/lib/axios';

// ============================================
// INTERFACES
// ============================================

export interface AgentExperience {
    id: string;
    agent: string;
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    description: string;
    achievements: string[];
    technologies: string[];
    created_at: string;
    updated_at: string;
}

export interface AgentSkill {
    id: string;
    agent: string;
    name: string;
    category: 'programming' | 'framework' | 'database' | 'cloud' | 'tool' | 'soft' | 'other';
    proficiency: string;
    years_of_experience?: number;
    created_at: string;
    updated_at: string;
}

export interface AgentProject {
    id: string;
    agent: string;
    name: string;
    description: string;
    role: string;
    start_date?: string;
    end_date?: string;
    technologies: string[];
    url?: string;
    achievements: string[];
    created_at: string;
    updated_at: string;
}

export interface AgentEducation {
    id: string;
    agent: string;
    institution: string;
    degree: string;
    field_of_study: string;
    start_date?: string;
    end_date?: string;
    gpa?: string;
    achievements: string[];
    created_at: string;
    updated_at: string;
}

export interface ExtractionSummary {
    experiences: number;
    skills: number;
    projects: number;
    education: number;
}

// ============================================
// EXPERIENCE CRUD
// ============================================

const resumeDataService = {
    // Get all experiences for an agent
    getExperiences: async (agentId: string) => {
        const response = await apiClient.get(`/agents/experiences/?agent=${agentId}`);
        return response.data;
    },

    // Create new experience
    createExperience: async (data: Omit<AgentExperience, 'id' | 'created_at' | 'updated_at'>) => {
        const response = await apiClient.post('/agents/experiences/', data);
        return response.data;
    },

    // Update experience
    updateExperience: async (id: string, data: Partial<AgentExperience>) => {
        const response = await apiClient.patch(`/agents/experiences/${id}/`, data);
        return response.data;
    },

    // Delete experience
    deleteExperience: async (id: string) => {
        const response = await apiClient.delete(`/agents/experiences/${id}/`);
        return response.data;
    },

    // ============================================
    // SKILLS CRUD
    // ============================================

    // Get all skills for an agent
    getSkills: async (agentId: string) => {
        const response = await apiClient.get(`/agents/skills/?agent=${agentId}`);
        return response.data;
    },

    // Create new skill
    createSkill: async (data: Omit<AgentSkill, 'id' | 'created_at' | 'updated_at'>) => {
        const response = await apiClient.post('/agents/skills/', data);
        return response.data;
    },

    // Update skill
    updateSkill: async (id: string, data: Partial<AgentSkill>) => {
        const response = await apiClient.patch(`/agents/skills/${id}/`, data);
        return response.data;
    },

    // Delete skill
    deleteSkill: async (id: string) => {
        const response = await apiClient.delete(`/agents/skills/${id}/`);
        return response.data;
    },

    // ============================================
    // PROJECTS CRUD
    // ============================================

    // Get all projects for an agent
    getProjects: async (agentId: string) => {
        const response = await apiClient.get(`/agents/projects/?agent=${agentId}`);
        return response.data;
    },

    // Create new project
    createProject: async (data: Omit<AgentProject, 'id' | 'created_at' | 'updated_at'>) => {
        const response = await apiClient.post('/agents/projects/', data);
        return response.data;
    },

    // Update project
    updateProject: async (id: string, data: Partial<AgentProject>) => {
        const response = await apiClient.patch(`/agents/projects/${id}/`, data);
        return response.data;
    },

    // Delete project
    deleteProject: async (id: string) => {
        const response = await apiClient.delete(`/agents/projects/${id}/`);
        return response.data;
    },

    // ============================================
    // EDUCATION CRUD
    // ============================================

    // Get all education for an agent
    getEducation: async (agentId: string) => {
        const response = await apiClient.get(`/agents/education/?agent=${agentId}`);
        return response.data;
    },

    // Create new education
    createEducation: async (data: Omit<AgentEducation, 'id' | 'created_at' | 'updated_at'>) => {
        const response = await apiClient.post('/agents/education/', data);
        return response.data;
    },

    // Update education
    updateEducation: async (id: string, data: Partial<AgentEducation>) => {
        const response = await apiClient.patch(`/agents/education/${id}/`, data);
        return response.data;
    },

    // Delete education
    deleteEducation: async (id: string) => {
        const response = await apiClient.delete(`/agents/education/${id}/`);
        return response.data;
    },
};

export default resumeDataService;
