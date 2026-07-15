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
          <h2>Players</h2>
          <ul>
            {players.map((player) => (
              <li key={player.id}>{player.name}</li>
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
            <p className="mt-6">Choosing next question...</p>
          </div>
        </div>
      )}

      {game.status === "in_progress" && revealed && (
        <div className="min-h-screen flex flex-col">
          <h1 className="text-center pt-4 m-0">Jeoparty</h1>
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="bg-[#dcdcdc] rounded-[10px] p-5 shadow-sm text-center mx-4 flex flex-col gap-2">
            <p>
              {revealed.category.name || "Untitled"} {revealed.question.points}
            </p>
            <h2 className="text-center">{revealed.question.prompt}</h2>
          </div>

          {revealed.question.state === "revealed" && <p>{secondsLeft}s</p>}

          {revealed.question.state === "judging" && (
            <>
              <ul>
                {submissions.map((submission) => (
                  <li key={submission.id}>
                    {playerName(submission.player_id)}:{" "}
                    {submission.answer_text}
                  </li>
                ))}
              </ul>
              <p>Host is judging...</p>
            </>
          )}

          {revealed.question.state === "answered" && (
            <div>
              <h2>Correct answer: {revealed.question.correct_answer}</h2>
              <ul>
                {submissions
                  .filter((submission) => submission.is_correct)
                  .map((submission) => (
                    <li key={submission.id}>
                      {playerName(submission.player_id)}
                    </li>
                  ))}
              </ul>
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
