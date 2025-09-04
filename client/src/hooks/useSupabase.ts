// client/src/hooks/useSupabase.ts
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// -------------------- Auth & Profile --------------------
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

export function useProfile() {
  const auth = useAuthUser();
  return useQuery({
    queryKey: ["profile", auth.data?.id],
    enabled: !!auth.data,
    queryFn: async () => {
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

// -------------------- User Data Queries --------------------
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

export function useAlerts(userId?: string | null) {
  return useQuery({
    queryKey: ["alerts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMessages() {
  return useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, users(username, email)")
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// -------------------- Unified Realtime --------------------
export function useRealtimeUserData(userId?: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`user-data-${userId}`);

    const tables = [
      { table: "accounts", events: ["INSERT", "UPDATE", "DELETE"] },
      { table: "transactions", events: ["INSERT", "UPDATE", "DELETE"], filter: `from_user_id=eq.${userId},to_user_id=eq.${userId}` },
      { table: "alerts", events: ["INSERT"], filter: `user_id=eq.${userId}` },
      { table: "messages", events: ["INSERT"] }
    ];

    tables.forEach(({ table, events, filter }) => {
      events.forEach(event => {
        channel.on(
          "postgres_changes",
          { event, schema: "public", table, filter },
          () => {
            // Invalidate relevant queries
            switch (table) {
              case "accounts":
                queryClient.invalidateQueries({ queryKey: ["account", userId] });
                queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
                break;
              case "transactions":
                queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
                break;
              case "alerts":
                queryClient.invalidateQueries({ queryKey: ["alerts", userId] });
                break;
              case "messages":
                queryClient.invalidateQueries({ queryKey: ["messages"] });
                break;
            }
          }
        );
      });
    });

    channel.subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, queryClient]);
}
