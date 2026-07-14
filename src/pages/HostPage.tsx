import { useParams } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { usePlayers } from "@/hooks/usePlayers";
import { useBoard } from "@/hooks/useBoard";
import { supabase } from "@/lib/supabaseClient";
import Board from "@/components/board";

function HostPage() {
  const { roomCode } = useParams();
  const { game, loading } = useGame(roomCode);
  const players = usePlayers(game?.id);
  const categories = useBoard(game?.id);

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

      {game.status === "in_progress" && game.current_question_id && (
        <p>Question revealed (next step)</p>
      )}
    </div>
  );
}

export default HostPage;
