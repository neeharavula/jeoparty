import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useBoard(gameId: string | undefined) {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (!gameId) return;

    async function fetchBoard() {
      const { data } = await supabase
        .from("categories")
        .select("*, questions(*)")
        .eq("game_id", gameId)
        .order("sort_order");
      setCategories(data ?? []);
    }

    fetchBoard();

    const channel = supabase
      .channel(`board-${gameId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "questions" },
        (payload) => {
          setCategories((prev) =>
            prev.map((category) => ({
              ...category,
              questions: category.questions.map((question: any) =>
                question.id === payload.new.id ? payload.new : question,
              ),
            })),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return categories;
}
