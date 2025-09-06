// client/src/hooks/useSupabase.ts
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Returns authenticated Supabase user (or null)
 */
export function useUser() {
  return useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data?.user ?? null;
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Profile row (optional separate users/profiles table)
 */
export function useProfile() {
  const userQ = useUser();
  return useQuery({
    queryKey: ["profile", userQ.data?.id ?? null],
    enabled: !!userQ.data?.id,
    queryFn: async () => {
      const userId = userQ.data!.id;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data ?? null;
    },
  });
}

/**
 * Single account for the user (assumes `accounts.user_id` is UUID string)
 */
export function useAccount(userId?: string | null) {
  return useQuery({
    queryKey: ["account", userId ?? null],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) throw error;
      // Supabase returns array when not `single()`, handle that shape
      if (Array.isArray(data)) return data[0] ?? null;
      return data ?? null;
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Transactions involving this user (from/to)
 */
export function useTransactions(userId?: string | null) {
  return useQuery({
    queryKey: ["transactions", userId ?? null],
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
 * Alerts query
 */
export function useAlerts(userId?: string | null) {
  return useQuery({
    queryKey: ["alerts", userId ?? null],
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
 * Realtime: subscribe to account changes and invalidate react-query caches.
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
 * Realtime alerts subscription invalidates alerts
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
 * Messages query
 */
export function useMessages() {
  return useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 10,
  });
}

/**
 * Realtime messages subscription
 */
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
