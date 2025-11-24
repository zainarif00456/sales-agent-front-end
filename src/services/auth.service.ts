import apiClient from '@/lib/axios';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    username: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    company_name?: string;
    job_title?: string;
}

export interface User {
    id: number;
    email: string;
    username: string;
    full_name: string;
    company_name?: string;
}

export interface AuthResponse {
    access: string;
    refresh: string;
    user: User;
}

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const { data } = await apiClient.post('/auth/login/', credentials);
        return data;
    },

    async register(userData: RegisterData) {
        const { data } = await apiClient.post('/auth/register/', userData);
        return data;
    },

    async getProfile(): Promise<User> {
        const { data } = await apiClient.get('/auth/profile/');
        return data;
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('access_token');
    },

    getUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },
};
