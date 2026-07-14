import { useParams } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { usePlayers } from "@/hooks/usePlayers";
import { useBoard } from "@/hooks/useBoard";
import { useCountdown } from "@/hooks/useCountdown";
import { supabase } from "@/lib/supabaseClient";
import { findRevealedQuestion } from "@/lib/board";
import Board from "@/components/board";

function HostPage() {
  const { roomCode } = useParams();
  const { game, loading } = useGame(roomCode);
  const players = usePlayers(game?.id);
  const categories = useBoard(game?.id);

  const revealed = game?.current_question_id
    ? findRevealedQuestion(categories, game.current_question_id)
    : null;
  const secondsLeft = useCountdown(revealed?.question.revealed_at, 30);

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
          <p>{revealed.category.name}</p>
          <p>{revealed.question.prompt}</p>
          <p>{secondsLeft}s</p>
        </div>
      )}
    </div>
  );
}

export default HostPage;
