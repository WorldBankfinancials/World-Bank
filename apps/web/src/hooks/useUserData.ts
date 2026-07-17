import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  accountNumber: string;
  accountId: string;
  profession: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  nationality: string;
  annualIncome: string;
  idType: string;
  idNumber: string;
  transferPin: string;
  role: string;
  isVerified: boolean;
  isOnline: boolean;
  isActive: boolean;
  avatarUrl?: string;
  balance: number;
  createdAt: string;
}

export function useUserData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['userData', user?.email],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.email) return null;
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return await response.json();
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    retry: 3
  });
}

export function useAccountData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['accounts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to fetch user accounts');
      return await response.json();
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    retry: 3
  });
}
