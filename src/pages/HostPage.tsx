import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { usePlayers } from "@/hooks/usePlayers";
import { useBoard } from "@/hooks/useBoard";
import { useCountdown } from "@/hooks/useCountdown";
import { useSubmissions, type Submission } from "@/hooks/useSubmissions";
import { supabase } from "@/lib/supabaseClient";
import { findRevealedQuestion } from "@/lib/board";
import Board from "@/components/board";
import Leaderboard from "@/components/leaderboard";
import AutoColumnList from "@/components/auto-column-list";

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
  const [scoredQuestionId, setScoredQuestionId] = useState(
    revealed?.question.id,
  );
  const hasEndedRound = useRef(false);

  if (revealed?.question.id !== scoredQuestionId) {
    setScoredQuestionId(revealed?.question.id);
    setMarkedCorrect(new Set());
    hasEndedRound.current = false;
  }

  useEffect(() => {
    if (!revealed || revealed.question.state !== "revealed") return;
    if (hasEndedRound.current) return;

    const allSubmitted =
      players.length > 0 && submissions.length >= players.length;

    if (secondsLeft === 0 || allSubmitted) {
      hasEndedRound.current = true;
      handleTimerExpiry();
    }
  }, [
    secondsLeft,
    submissions.length,
    players.length,
    revealed?.question.state,
  ]);

  useEffect(() => {
    if (game?.status !== "in_progress" || game.current_question_id) return;
    if (categories.length === 0) return;

    async function checkCompletion() {
      const categoryIds = categories.map((category) => category.id);
      const { data } = await supabase
        .from("questions")
        .select("state")
        .in("category_id", categoryIds);

      const allAnswered =
        (data ?? []).length > 0 &&
        (data ?? []).every(
          (question: { state: string }) => question.state === "answered",
        );

      if (allAnswered) {
        await supabase
          .from("games")
          .update({ status: "complete" })
          .eq("id", game.id);
      }
    }

    checkCompletion();
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
        (submission: Submission) =>
          submission.answer_text === question.correct_answer,
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

  async function revealQuestion(question: { id: string }) {
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1>Loading...</h1>
      </div>
    );
  }

  if (!game) {
    return <h1>Game not found</h1>;
  }

  if (game.status === "setup") {
    return (
      <div className="min-h-screen flex flex-col">
        <h1 className="text-center pt-4">Jeoparty</h1>
        <div className="flex flex-col items-center gap-4">
          <p className="text-center font-mono">Host Mode</p>
          <p className="text-center font-mono">Room Code: {roomCode}</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <label className="text-[var(--label-text)] text-sm font-mono uppercase mb-2">
            Players
          </label>
          <AutoColumnList
            items={players}
            getKey={(player) => player.id}
            columnWidth={220}
            renderItem={(player) => (
              <p className="font-offbit text-3xl text-[var(--text-h)]">
                {player.name}
              </p>
            )}
          />
        </div>

        <button
          className="bg-[#6b93a6] text-white rounded-[10px] p-2 shadow-sm transition-transform duration-300 ease-out hover:scale-95 cursor-pointer font-mono m-4"
          onClick={startGame}
        >
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div>
      {game.status === "in_progress" && !game.current_question_id && (
        <div className="min-h-screen flex flex-col">
          <h1 className="text-center pt-4 m-0">Jeoparty</h1>
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <Board
              categories={categories}
              size="compact"
              onQuestionClick={revealQuestion}
            />
            <p className="mt-6 font-mono text-[var(--text-h)]">
              Pick next question to reveal
            </p>
          </div>
        </div>
      )}

      {game.status === "in_progress" && revealed && (
        <div className="min-h-screen flex flex-col">
          <h1 className="text-center pt-4 m-0">Jeoparty</h1>
          <p className="text-center my-8 text-[var(--label-text)] text-sm font-mono uppercase">
            {revealed.category.name || "Untitled"} {revealed.question.points}
          </p>
          <div
            className={`flex-1 flex flex-col items-center gap-2 px-6 pb-6 ${
              revealed.question.state === "revealed" ? "" : "justify-center"
            }`}
          >
            {revealed.question.state === "revealed" && (
              <div className="w-full flex-1 max-h-32 flex flex-col items-center">
                <div className="flex-1" />
                <p className="font-offbit text-7xl text-[#6b93a6]">
                  {secondsLeft}
                </p>
                <div className="flex-1" />
              </div>
            )}
            <div className="w-full flex flex-col gap-2">
              <label className="text-[var(--label-text)] text-sm font-mono uppercase mb-2">
                Question
              </label>
              <h2 className="text-3xl">{revealed.question.prompt}</h2>
            </div>

            {revealed.question.state === "revealed" && (
              <div className="w-full flex flex-col gap-2 mt-6">
                <label className="text-[var(--label-text)] text-sm font-mono uppercase mb-2">
                  Submissions
                </label>
                <p className="font-offbit text-3xl text-[var(--text-h)]">
                  {submissions.length}/{players.length}
                </p>
              </div>
            )}

            {revealed.question.state === "judging" && (
              <div className="w-full flex-1 min-h-0 flex flex-col gap-2 mt-6">
                <label className="text-[var(--label-text)] text-sm font-mono uppercase mb-2">
                  Submissions
                </label>
                {submissions.length === 0 ? (
                  <p className="font-offbit text-3xl text-[var(--text-h)]">
                    None
                  </p>
                ) : (
                  submissions.map((submission) => (
                    <label
                      key={submission.id}
                      className="flex items-center gap-3 bg-[#eeeeee] rounded-[10px] p-3 leading-none"
                    >
                      <input
                        type="checkbox"
                        className="m-0 size-4 shrink-0"
                        checked={markedCorrect.has(submission.id)}
                        onChange={() => toggleCorrect(submission.id)}
                      />
                      <span className="font-offbit text-2xl text-[var(--text-h)]">
                        {playerName(submission.player_id)}:{" "}
                        {submission.answer_text}
                      </span>
                    </label>
                  ))
                )}
                <div className="flex-1" />
                <button
                  className="bg-[#6b93a6] font-mono text-white rounded-[10px] p-2 shadow-sm transition-transform duration-300 ease-out hover:scale-95 cursor-pointer w-full"
                  onClick={submitJudging}
                >
                  Submit
                </button>
              </div>
            )}

            {revealed.question.state === "answered" && (
              <div className="w-full flex-1 min-h-0 flex flex-col gap-2 mt-6">
                <label className="text-[var(--label-text)] text-sm font-mono uppercase mb-2">
                  Correct Answer
                </label>
                <h2 className="text-3xl text-[var(--correct)]">
                  {revealed.question.correct_answer}
                </h2>
                <label className="text-[var(--label-text)] text-sm font-mono uppercase mb-2 mt-4">
                  Who Got It Right?
                </label>
                {submissions.some((submission) => submission.is_correct) ? (
                  <ul className="flex flex-col gap-1">
                    {submissions
                      .filter((submission) => submission.is_correct)
                      .map((submission) => (
                        <li
                          key={submission.id}
                          className="font-offbit text-3xl text-[var(--text-h)]"
                        >
                          {playerName(submission.player_id)}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="font-offbit text-3xl text-[var(--text-h)]">
                    No one
                  </p>
                )}
                <div className="flex-1" />
                <button
                  className="bg-[#6b93a6] text-white rounded-[10px] p-2 shadow-sm transition-transform duration-300 ease-out hover:scale-95 cursor-pointer font-mono"
                  onClick={nextQuestion}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {game.status === "complete" && <Leaderboard players={players} />}
    </div>
  );
}

export default HostPage;
