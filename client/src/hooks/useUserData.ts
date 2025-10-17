import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

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
    queryKey: ["userData", user?.email],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.email) return null;

      // Fetch user profile from backend based on authenticated email
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const userData = await response.json();
      console.log("✅ Real User Data from Supabase:", userData);
      return userData;
    },
    enabled: Boolean(user?.email),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

export function useAccountData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["accounts", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      const response = await fetch("/api/accounts/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user accounts");
      }

      const accounts = await response.json();
      console.log("✅ Real Account Data from Supabase:", accounts);
      return accounts;
    },
    enabled: Boolean(user?.email),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
}
