import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useSubmissions(questionId: string | undefined) {
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (!questionId) return;

    async function fetchSubmissions() {
      const { data } = await supabase
        .from("submissions")
        .select()
        .eq("question_id", questionId);
      setSubmissions(data ?? []);
    }

    fetchSubmissions();

    const channel = supabase
      .channel(`submissions-${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submissions",
          filter: `question_id=eq.${questionId}`,
        },
        () => {
          fetchSubmissions();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionId]);

  return submissions;
}
