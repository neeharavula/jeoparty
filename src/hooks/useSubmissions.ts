import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Submission = {
  id: string;
  question_id: string;
  player_id: string;
  answer_text: string;
  is_correct: boolean | null;
  submitted_at: string;
};

export function useSubmissions(questionId: string | undefined) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadedQuestionId, setLoadedQuestionId] = useState(questionId);

  if (questionId !== loadedQuestionId) {
    setLoadedQuestionId(questionId);
    setSubmissions([]);
  }

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
          event: "INSERT",
          schema: "public",
          table: "submissions",
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          setSubmissions((prev) => [...prev, payload.new as Submission]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "submissions",
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          setSubmissions((prev) =>
            prev.map((submission) =>
              submission.id === payload.new.id
                ? (payload.new as Submission)
                : submission,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionId]);

  return submissions;
}
