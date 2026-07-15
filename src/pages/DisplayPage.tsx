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
        <h1 className="text-center pt-4 m-0">Jeoparty</h1>

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
      </div>
    );
  }

  return (
    <div>
      {game.status === "in_progress" && !game.current_question_id && (
        <div className="min-h-screen flex flex-col">
          <h1 className="text-center pt-4 m-0">Jeoparty</h1>
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <Board categories={categories} size="full" />
          </div>
          <p className="font-mono text-center text-[var(--text-h)] pb-12">
            Choosing next question ...
          </p>
        </div>
      )}

      {game.status === "in_progress" && revealed && (
        <div className="min-h-screen flex flex-col">
          <h1 className="text-center pt-4 m-0">Jeoparty</h1>
          <p className="text-center my-8 text-[var(--label-text)] text-sm font-mono uppercase">
            {revealed.category.name || "Untitled"} {revealed.question.points}
          </p>
          <div
            className={`flex-1 flex flex-col items-center gap-2 px-6 pb-12 ${
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
            <div className="w-full grid grid-cols-[1fr_auto_1fr] items-start gap-8">
              <label className="text-[var(--label-text)] text-sm font-mono uppercase whitespace-nowrap">
                Question
              </label>
              <h2 className="text-5xl text-center max-w-4xl">
                {revealed.question.prompt}
              </h2>
            </div>

            {revealed.question.state === "judging" && (
              <div className="w-full flex-1 min-h-0 flex flex-col items-center gap-2 mt-6">
                <label className="text-[var(--label-text)] text-sm font-mono uppercase mb-4">
                  Submissions
                </label>
                {submissions.length === 0 ? (
                  <p className="font-offbit text-4xl text-[var(--text-h)]">
                    None
                  </p>
                ) : (
                  <AutoColumnList
                    items={submissions}
                    getKey={(submission) => submission.id}
                    renderItem={(submission) => (
                      <p className="font-offbit text-4xl text-[var(--text-h)]">
                        {playerName(submission.player_id)}:{" "}
                        {submission.answer_text}
                      </p>
                    )}
                  />
                )}
                <div className="flex-1" />
                <p className="font-mono text-center text-[var(--text-h)]">
                  Host is judging 🧐 ...
                </p>
              </div>
            )}

            {revealed.question.state === "answered" && (
              <div className="w-full flex-1 min-h-0 flex flex-col items-center gap-2 mt-6">
                <div className="w-full grid grid-cols-[1fr_auto_1fr] items-start gap-8">
                  <label className="text-[var(--label-text)] text-sm font-mono uppercase whitespace-nowrap">
                    Correct Answer
                  </label>
                  <h2 className="text-5xl text-center text-[var(--correct)] max-w-4xl">
                    {revealed.question.correct_answer}
                  </h2>
                </div>
                <label className="text-[var(--label-text)] text-sm font-mono uppercase mt-4 mb-4">
                  Who Got It Right?
                </label>
                {submissions.some((submission) => submission.is_correct) ? (
                  <AutoColumnList
                    items={submissions.filter(
                      (submission) => submission.is_correct,
                    )}
                    getKey={(submission) => submission.id}
                    renderItem={(submission) => (
                      <p className="font-offbit text-4xl text-[var(--text-h)]">
                        {playerName(submission.player_id)}
                      </p>
                    )}
                  />
                ) : (
                  <p className="font-offbit text-4xl text-[var(--text-h)]">
                    No one
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {game.status === "complete" && (
        <Leaderboard players={players} textSize="text-5xl" />
      )}
    </div>
  );
}

export default DisplayPage;
