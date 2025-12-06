import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useThemeStore } from './store/theme.store';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
    LoginPage,
    RegisterPage,
    DashboardPage,
    AgentsListPage,
    CreateAgentPage,
    AgentEditPage,
    ConversationsListPage,
    ConversationPage,
    NewConversationPage,
} from './pages';
import { DocumentationPage, PagesProvider } from './modules/documentation';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

function App() {
    const { setTheme } = useThemeStore();

    useEffect(() => {
        // Initialize theme
        const savedTheme = localStorage.getItem('theme-storage');
        if (savedTheme) {
            const { state } = JSON.parse(savedTheme);
            setTheme(state.theme);
        } else {
            setTheme('dark');
        }
    }, [setTheme]);

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/agents"
                        element={
                            <ProtectedRoute>
                                <AgentsListPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/agents/create"
                        element={
                            <ProtectedRoute>
                                <CreateAgentPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/agents/:id/edit"
                        element={
                            <ProtectedRoute>
                                <AgentEditPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/conversations"
                        element={
                            <ProtectedRoute>
                                <ConversationsListPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/conversations/new"
                        element={
                            <ProtectedRoute>
                                <NewConversationPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/conversations/:sessionId"
                        element={
                            <ProtectedRoute>
                                <ConversationPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/documentation"
                        element={
                            <ProtectedRoute>
                                <PagesProvider>
                                    <DocumentationPage />
                                </PagesProvider>
                            </ProtectedRoute>
                        }
                    />

                    {/* Default Redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>

            {/* Toast Notifications */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                    },
                    success: {
                        iconTheme: {
                            primary: 'var(--success)',
                            secondary: 'white',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: 'var(--error)',
                            secondary: 'white',
                        },
                    },
                }}
            />
        </QueryClientProvider>
    );
}

export default App;
