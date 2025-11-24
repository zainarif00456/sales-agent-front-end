import { create } from 'zustand';
import { User } from '@/services/auth.service';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: (() => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    })(),
    isAuthenticated: !!localStorage.getItem('access_token'),
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false });
    },
}));
