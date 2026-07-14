import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { usePlayers } from "@/hooks/usePlayers";
import { useBoard } from "@/hooks/useBoard";
import { useCountdown } from "@/hooks/useCountdown";
import { useSubmissions } from "@/hooks/useSubmissions";
import { supabase } from "@/lib/supabaseClient";
import { findRevealedQuestion } from "@/lib/board";
import Board from "@/components/board";
import Leaderboard from "@/components/leaderboard";

function HostPage() {
  const { roomCode } = useParams();
  const { game, loading } = useGame(roomCode);
  const players = usePlayers(game?.id);
  const categories = useBoard(game?.id);

  const revealed = game?.current_question_id
    ? findRevealedQuestion(categories, game.current_question_id)
    : null;
  const secondsLeft = useCountdown(revealed?.question.revealed_at, 30);
  const submissions = useSubmissions(revealed?.question.id);

  const [markedCorrect, setMarkedCorrect] = useState<Set<string>>(new Set());
  const hasEndedRound = useRef(false);

  useEffect(() => {
    setMarkedCorrect(new Set());
    hasEndedRound.current = false;
  }, [revealed?.question.id]);

  useEffect(() => {
    if (!revealed || revealed.question.state !== "revealed") return;
    if (hasEndedRound.current) return;

    const allSubmitted =
      players.length > 0 && submissions.length >= players.length;

    if (secondsLeft === 0 || allSubmitted) {
      hasEndedRound.current = true;
      handleTimerExpiry();
    }
  }, [secondsLeft, submissions.length, players.length, revealed?.question.state]);

  useEffect(() => {
    if (game?.status !== "in_progress" || game.current_question_id) return;
    if (categories.length === 0) return;

    const allAnswered = categories.every((category) =>
      category.questions.every(
        (question: any) => question.state === "answered",
      ),
    );

    if (allAnswered) {
      supabase.from("games").update({ status: "complete" }).eq("id", game.id);
    }
  }, [categories, game?.status, game?.current_question_id]);

  function toggleCorrect(submissionId: string) {
    setMarkedCorrect((prev) => {
      const next = new Set(prev);
      if (next.has(submissionId)) {
        next.delete(submissionId);
      } else {
        next.add(submissionId);
      }
      return next;
    });
  }

  async function submitJudging() {
    if (!revealed) return;
    const question = revealed.question;

    for (const submission of submissions) {
      await supabase
        .from("submissions")
        .update({ is_correct: markedCorrect.has(submission.id) })
        .eq("id", submission.id);
    }

    if (markedCorrect.size > 0) {
      const pointsEach = question.points / markedCorrect.size;
      for (const submission of submissions) {
        if (markedCorrect.has(submission.id)) {
          await awardPoints(submission.player_id, pointsEach);
        }
      }
    }

    await supabase
      .from("questions")
      .update({ state: "answered" })
      .eq("id", question.id);
  }

  async function awardPoints(playerId: string, amount: number) {
    const { data: playerRow } = await supabase
      .from("players")
      .select("score")
      .eq("id", playerId)
      .single();

    await supabase
      .from("players")
      .update({ score: (playerRow?.score ?? 0) + amount })
      .eq("id", playerId);
  }

  async function handleTimerExpiry() {
    if (!revealed) return;
    const question = revealed.question;

    if (question.question_type === "multiple_choice") {
      const { data: submissions } = await supabase
        .from("submissions")
        .select()
        .eq("question_id", question.id);

      const correctSubmissions = (submissions ?? []).filter(
        (submission: any) => submission.answer_text === question.correct_answer,
      );

      for (const submission of submissions ?? []) {
        await supabase
          .from("submissions")
          .update({
            is_correct: submission.answer_text === question.correct_answer,
          })
          .eq("id", submission.id);
      }

      if (correctSubmissions.length > 0) {
        const pointsEach = question.points / correctSubmissions.length;
        for (const submission of correctSubmissions) {
          await awardPoints(submission.player_id, pointsEach);
        }
      }

      await supabase
        .from("questions")
        .update({ state: "answered" })
        .eq("id", question.id);
    } else {
      await supabase
        .from("questions")
        .update({ state: "judging" })
        .eq("id", question.id);
    }
  }

  async function startGame() {
    await supabase
      .from("games")
      .update({ status: "in_progress" })
      .eq("id", game.id);
  }

  async function revealQuestion(question: any) {
    await supabase
      .from("questions")
      .update({ state: "revealed", revealed_at: new Date().toISOString() })
      .eq("id", question.id);

    await supabase
      .from("games")
      .update({ current_question_id: question.id })
      .eq("id", game.id);
  }

  async function nextQuestion() {
    await supabase
      .from("games")
      .update({ current_question_id: null })
      .eq("id", game.id);
  }

  function playerName(playerId: string) {
    return players.find((player) => player.id === playerId)?.name ?? "?";
  }

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (!game) {
    return <h1>Game not found</h1>;
  }

  return (
    <div>
      <h1>Host</h1>
      <p>Room code: {roomCode}</p>

      {game.status === "setup" && (
        <>
          <h2>Players</h2>
          <ul>
            {players.map((player) => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>

          <button onClick={startGame}>Start Game</button>
        </>
      )}

      {game.status === "in_progress" && !game.current_question_id && (
        <>
          <p>Pick next question to reveal</p>
          <Board
            categories={categories}
            size="compact"
            onQuestionClick={revealQuestion}
          />
        </>
      )}

      {game.status === "in_progress" && revealed && (
        <div>
          <p>
            {revealed.category.name || "Untitled"} {revealed.question.points}
          </p>
          <p>{revealed.question.prompt}</p>

          {revealed.question.state === "revealed" && (
            <>
              <p>{secondsLeft}s</p>
              <p>{submissions.length} submitted</p>
            </>
          )}

          {revealed.question.state === "judging" && (
            <div>
              {submissions.map((submission) => (
                <label key={submission.id}>
                  <input
                    type="checkbox"
                    checked={markedCorrect.has(submission.id)}
                    onChange={() => toggleCorrect(submission.id)}
                  />
                  {playerName(submission.player_id)}: {submission.answer_text}
                </label>
              ))}
              <button onClick={submitJudging}>Submit Judging</button>
            </div>
          )}

          {revealed.question.state === "answered" && (
            <div>
              <p>Correct answer: {revealed.question.correct_answer}</p>
              <ul>
                {submissions
                  .filter((submission) => submission.is_correct)
                  .map((submission) => (
                    <li key={submission.id}>
                      {playerName(submission.player_id)}
                    </li>
                  ))}
              </ul>
              <button onClick={nextQuestion}>Next</button>
            </div>
          )}
        </div>
      )}

      {game.status === "complete" && <Leaderboard players={players} />}
    </div>
  );
}

export default HostPage;
