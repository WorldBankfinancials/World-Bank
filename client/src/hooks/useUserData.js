import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
export function useUserData() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['userData', user?.email],
        queryFn: async () => {
            if (!user?.email)
                return null;
            // Fetch user profile from backend based on authenticated email
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }
            const userData = await response.json();
            console.log('✅ Real User Data from Supabase:', userData);
            return userData;
        },
        enabled: !!user?.email,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 3
    });
}
export function useAccountData() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['accounts', user?.email],
        queryFn: async () => {
            if (!user?.email)
                return [];
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/accounts/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user accounts');
            }
            const accounts = await response.json();
            console.log('✅ Real Account Data from Supabase:', accounts);
            return accounts;
        },
        enabled: !!user?.email,
        staleTime: 5 * 60 * 1000,
        retry: 3
    });
}
