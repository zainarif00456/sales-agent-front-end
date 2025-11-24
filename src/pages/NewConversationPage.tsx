import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { conversationService } from '@/services/conversation.service';

export const NewConversationPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const agentId = searchParams.get('agent');

    const createSessionMutation = useMutation({
        mutationFn: (data: { agent: string; title: string }) =>
            conversationService.createSession(data),
        onSuccess: (response) => {
            // Navigate to the new conversation
            navigate(`/conversations/${response.data.id}`, { replace: true });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create conversation');
            navigate('/agents', { replace: true });
        },
    });

    useEffect(() => {
        if (!agentId) {
            toast.error('No agent selected');
            navigate('/agents', { replace: true });
            return;
        }

        // Create a new conversation session only once
        createSessionMutation.mutate({
            agent: agentId,
            title: `New Conversation - ${new Date().toLocaleDateString()}`,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - run only once on mount

    return (
        <Layout>
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-[var(--text-secondary)]">Creating conversation...</p>
                </div>
            </div>
        </Layout>
    );
};
