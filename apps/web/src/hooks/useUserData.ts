import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/lib/queryClient';

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
    queryKey: ['userData', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.email) return null;
      const response = await authenticatedFetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return await response.json();
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });
}

export function useAccountData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      if (!user?.email) return [];
      const response = await authenticatedFetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to fetch user accounts');
      return await response.json();
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });
}
