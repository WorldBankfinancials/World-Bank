// client/src/hooks/useSupabase.ts
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Returns authenticated user (from supabase.auth)
 */
export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user ?? null;
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Profile row (from users table)
 */
export function useProfile() {
  const userQ = useUser();
  return useQuery({
    queryKey: ["profile", userQ.data?.id],
    enabled: !!userQ.data,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userQ.data!.id)
        .single();
      if (error) throw error;
      return data ?? null;
    },
  });
}

/**
 * Returns single account for a user
 */
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
      return Array.isArray(data) && data.length ? data[0] : null;
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Transactions involving this user
 */
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

/**
 * Alerts (notifications) for a user
 */
export function useAlerts(userId?: string | null) {
  return useQuery({
    queryKey: ["alerts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Realtime: listen for account updates and invalidate queries
 */
export function useRealtimeAccount(userId?: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`account-updates-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accounts", filter: `user_id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["account", userId] });
          qc.invalidateQueries({ queryKey: ["transactions", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}

/**
 * Realtime alerts subscription
 */
export function useRealtimeAlerts(userId?: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`alerts-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["alerts", userId] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}

/**
 * Messages and realtime subscription for global chat
 */
export function useMessages() {
  return useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, users(id, username, email)")
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 10,
  });
}

export function useRealtimeMessages() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () =>
        qc.invalidateQueries({ queryKey: ["messages"] })
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [qc]);
}
