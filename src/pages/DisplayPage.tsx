import { useParams } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { usePlayers } from "@/hooks/usePlayers";
import { useBoard } from "@/hooks/useBoard";
import { useCountdown } from "@/hooks/useCountdown";
import { useSubmissions } from "@/hooks/useSubmissions";
import { findRevealedQuestion } from "@/lib/board";
import Board from "@/components/board";
import Leaderboard from "@/components/leaderboard";

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
          <ul className="flex flex-col items-center gap-2">
            {players.map((player) => (
              <li
                key={player.id}
                className="font-offbit text-3xl text-[var(--text-h)]"
              >
                {player.name}
              </li>
            ))}
          </ul>
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
            <p className="mt-6 font-mono">Choosing next question...</p>
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

            {revealed.question.state === "judging" && (
              <div className="w-full flex-1 min-h-0 flex flex-col gap-2 mt-4">
                <label className="text-[var(--label-text)] text-sm font-mono uppercase mb-2">
                  Submissions
                </label>
                {submissions.length === 0 ? (
                  <p className="font-offbit text-3xl text-[var(--text-h)]">
                    None
                  </p>
                ) : (
                  submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-[#eeeeee] rounded-[10px] p-3"
                    >
                      <span className="font-offbit text-2xl text-[var(--text-h)]">
                        {playerName(submission.player_id)}:{" "}
                        {submission.answer_text}
                      </span>
                    </div>
                  ))
                )}
                <div className="flex-1" />
                <p className="font-mono text-center text-[#6b93a6]">
                  Host is judging...
                </p>
              </div>
            )}

            {revealed.question.state === "answered" && (
              <div className="w-full flex-1 min-h-0 flex flex-col gap-2 mt-4">
                <label className="text-[var(--label-text)] text-sm font-mono uppercase mb-2">
                  Correct Answer
                </label>
                <h2 className="text-3xl">
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
              </div>
            )}
          </div>
        </div>
      )}

      {game.status === "complete" && <Leaderboard players={players} />}
    </div>
  );
}

export default DisplayPage;
