import { useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { usePlayers } from "@/hooks/usePlayers";
import { useBoard } from "@/hooks/useBoard";
import { useCountdown } from "@/hooks/useCountdown";
import { useSubmissions } from "@/hooks/useSubmissions";
import { findRevealedQuestion } from "@/lib/board";
import Board from "@/components/board";
import Leaderboard from "@/components/leaderboard";
import AutoColumnList from "@/components/auto-column-list";

function DisplayPage() {
  const { roomCode } = useParams();
  const { game, loading } = useGame(roomCode);
  const players = usePlayers(game?.id);
  const categories = useBoard(game?.id);

  const revealed = game?.current_question_id
    ? findRevealedQuestion(categories, game.current_question_id)
    : null;
  const secondsLeft = useCountdown(revealed?.question.revealed_at, 30);
  const submissions = useSubmissions(revealed?.question.id);

  const headerRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const [timerTop, setTimerTop] = useState<number | null>(null);

  if (revealed?.question.state !== "revealed" && timerTop !== null) {
    setTimerTop(null);
  }

  useLayoutEffect(() => {
    if (revealed?.question.state !== "revealed") return;

    function updateTimerTop() {
      const header = headerRef.current;
      const question = questionRef.current;
      if (!header || !question) return;
      const headerBottom = header.getBoundingClientRect().bottom;
      const questionTop = question.getBoundingClientRect().top;
      setTimerTop((headerBottom + questionTop) / 2);
    }

    updateTimerTop();
    window.addEventListener("resize", updateTimerTop);
    return () => window.removeEventListener("resize", updateTimerTop);
  }, [
    revealed?.question.state,
    revealed?.question.id,
    revealed?.question.prompt,
  ]);

  function playerName(playerId: string) {
    return players.find((player) => player.id === playerId)?.name ?? "?";
  }

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (!game) {
    return <h1>Game not found</h1>;
  }

  if (game.status === "setup") {
    return (
      <div className="min-h-screen flex flex-col">
        <h1 className="text-center pt-4 m-0 text-4xl 2xl:text-6xl">Jeoparty</h1>

        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <label className="text-[var(--label-text)] text-sm 2xl:text-xl font-mono uppercase mb-2">
            Players
          </label>
          <AutoColumnList
            items={players}
            getKey={(player) => player.id}
            columnWidth={220}
            renderItem={(player) => (
              <p className="font-offbit text-3xl 2xl:text-5xl text-[var(--text-h)]">
                {player.name}
              </p>
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {game.status === "in_progress" && !game.current_question_id && (
        <div className="min-h-screen flex flex-col">
          <h1 className="text-center pt-4 m-0 text-4xl 2xl:text-6xl">Jeoparty</h1>
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <Board categories={categories} size="full" />
          </div>
          <p className="font-mono text-center text-[var(--text-h)] text-base 2xl:text-2xl pb-12">
            Choosing question ...
          </p>
        </div>
      )}

      {game.status === "in_progress" &&
        revealed &&
        (revealed.question.state === "revealed" ? (
          <div className="min-h-screen relative flex flex-col">
            <div ref={headerRef}>
              <h1 className="text-center pt-4 m-0 text-4xl 2xl:text-6xl">
                Jeoparty
              </h1>
              <p className="text-center my-8 text-[var(--label-text)] text-sm 2xl:text-xl font-mono uppercase">
                {revealed.category.name || "Untitled"}{" "}
                {revealed.question.points}
              </p>
            </div>

            {timerTop !== null && (
              <p
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 font-offbit text-7xl 2xl:text-9xl text-[#6b93a6]"
                style={{ top: timerTop }}
              >
                {secondsLeft}
              </p>
            )}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-6 flex justify-center">
              <h2
                ref={questionRef}
                className="text-[56px] 2xl:text-[96px] text-center max-w-5xl 2xl:max-w-6xl"
              >
                {revealed.question.prompt}
              </h2>
            </div>
          </div>
        ) : (
          <div className="min-h-screen flex flex-col">
            <h1 className="text-center pt-4 m-0 text-4xl 2xl:text-6xl">
              Jeoparty
            </h1>
            <p className="text-center my-8 text-[var(--label-text)] text-sm 2xl:text-xl font-mono uppercase">
              {revealed.category.name || "Untitled"} {revealed.question.points}
            </p>
            <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 pb-12">
              <h2 className="text-[56px] 2xl:text-[96px] text-center max-w-4xl 2xl:max-w-6xl">
                {revealed.question.prompt}
              </h2>

              {revealed.question.state === "judging" && (
                <div className="w-full flex-1 min-h-0 flex flex-col items-center gap-2 mt-6">
                  <label className="text-[var(--label-text)] text-sm 2xl:text-xl font-mono uppercase mb-4">
                    Submissions
                  </label>
                  {submissions.length === 0 ? (
                    <p className="font-offbit text-4xl 2xl:text-6xl text-[var(--text-h)]">
                      None
                    </p>
                  ) : (
                    <AutoColumnList
                      items={submissions}
                      getKey={(submission) => submission.id}
                      renderItem={(submission) => (
                        <p className="font-offbit text-4xl 2xl:text-6xl text-[var(--text-h)]">
                          {playerName(submission.player_id)}:{" "}
                          {submission.answer_text}
                        </p>
                      )}
                    />
                  )}
                  <div className="flex-1" />
                  <p className="font-mono text-center text-[var(--text-h)] text-base 2xl:text-2xl">
                    Host is judging 🧐 ...
                  </p>
                </div>
              )}

              {revealed.question.state === "answered" && (
                <div className="w-full flex-1 min-h-0 flex flex-col items-center gap-2 mt-6">
                  <div className="w-full flex flex-col items-center">
                    <h2 className="text-[56px] 2xl:text-[96px] text-center text-[var(--correct)] max-w-4xl 2xl:max-w-6xl">
                      {revealed.question.correct_answer}
                    </h2>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

      {game.status === "complete" && (
        <Leaderboard
          players={players}
          textSize="text-5xl 2xl:text-7xl"
          headingSize="text-4xl 2xl:text-6xl"
        />
      )}
    </div>
  );
}

export default DisplayPage;
