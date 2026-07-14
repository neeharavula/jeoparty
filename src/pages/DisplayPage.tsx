import { useParams } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { usePlayers } from "@/hooks/usePlayers";
import { useBoard } from "@/hooks/useBoard";
import { useCountdown } from "@/hooks/useCountdown";
import { useSubmissions } from "@/hooks/useSubmissions";
import { findRevealedQuestion } from "@/lib/board";
import Board from "@/components/board";

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

  return (
    <div>
      <h1>Display</h1>

      {game.status === "setup" && (
        <>
          <h2>Players</h2>
          <ul>
            {players.map((player) => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>
        </>
      )}

      {game.status === "in_progress" && !game.current_question_id && (
        <Board categories={categories} size="full" />
      )}

      {game.status === "in_progress" && revealed && (
        <div>
          <p>
            {revealed.category.name || "Untitled"} {revealed.question.points}
          </p>
          <p>{revealed.question.prompt}</p>

          {revealed.question.state === "revealed" && <p>{secondsLeft}s</p>}

          {revealed.question.state === "judging" && (
            <ul>
              {submissions.map((submission) => (
                <li key={submission.id}>
                  {playerName(submission.player_id)}: {submission.answer_text}
                </li>
              ))}
            </ul>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DisplayPage;
