// client/src/hooks/useSupabase.ts
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Returns the authenticated user (from Supabase Auth)
export function useAuthUser() {
  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user ?? null;
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Returns profile row in `users` table for the current auth user (if you store extra metadata there)
export function useProfile() {
  const auth = useAuthUser();
  return useQuery({
    queryKey: ["profile", auth.data?.id],
    enabled: !!auth.data,
    queryFn: async () => {
      // assuming you have a `users` table keyed by auth user id
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", auth.data!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// Returns single account row belonging to user (adjust if you support multiple accounts)
export function useAccount(userId?: string | null) {
  return useQuery({
    queryKey: ["account", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) throw error;
      // data may be array — take first or null
      return Array.isArray(data) && data.length ? data[0] : null;
    },
    staleTime: 1000 * 30,
  });
}

// Returns user's transactions (either from or to)
export function useTransactions(userId?: string | null) {
  return useQuery({
    queryKey: ["transactions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const orFilter = `from_user_id.eq.${userId},to_user_id.eq.${userId}`;
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .or(orFilter)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 30,
  });
}

// Setup realtime subscription for account updates (invalidates account queries)
export function useRealtimeAccount(userId?: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`account-updates-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "accounts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Invalidate account and transactions to refresh UI
          queryClient.invalidateQueries({ queryKey: ["account", userId] });
          queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
