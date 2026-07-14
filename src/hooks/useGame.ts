import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useGame(roomCode: string | undefined) {
  const [game, setGame] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomCode) return;

    async function fetchGame() {
      const { data } = await supabase
        .from("games")
        .select()
        .eq("room_code", roomCode)
        .single();
      setGame(data);
      setLoading(false);
    }

    fetchGame();
  }, [roomCode]);

  useEffect(() => {
    if (!game?.id) return;

    const channel = supabase
      .channel(`game-${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${game.id}`,
        },
        (payload) => {
          setGame(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game?.id]);

  return { game, loading };
}
