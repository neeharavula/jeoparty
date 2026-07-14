import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function usePlayers(gameId: string | undefined) {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    if (!gameId) return;

    async function fetchPlayers() {
      const { data } = await supabase
        .from("players")
        .select()
        .eq("game_id", gameId)
        .order("joined_at");
      setPlayers(data ?? []);
    }

    fetchPlayers();

    const channel = supabase
      .channel(`players-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          setPlayers((prev) => [...prev, payload.new]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return players;
}
