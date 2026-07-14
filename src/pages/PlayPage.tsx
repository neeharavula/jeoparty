import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { useBoard } from "@/hooks/useBoard";
import { supabase } from "@/lib/supabaseClient";
import Board from "@/components/board";

function PlayPage() {
  const { roomCode } = useParams();
  const { game, loading } = useGame(roomCode);
  const categories = useBoard(game?.id);
  const [name, setName] = useState("");
  const [player, setPlayer] = useState<any | null>(null);

  useEffect(() => {
    if (!game?.id) return;
    const stored = localStorage.getItem(`jeoparty-player-${game.id}`);
    if (stored) {
      setPlayer(JSON.parse(stored));
    }
  }, [game?.id]);

  async function joinGame() {
    if (!name.trim() || !game) return;

    const { data, error } = await supabase
      .from("players")
      .insert({ game_id: game.id, name: name.trim(), score: 0 })
      .select()
      .single();

    if (error || !data) {
      console.error(error);
      return;
    }

    setPlayer(data);
    localStorage.setItem(`jeoparty-player-${game.id}`, JSON.stringify(data));
  }

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (!game) {
    return <h1>Game not found</h1>;
  }

  if (!player) {
    return (
      <div>
        <h1>Join Game</h1>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
        />
        <button onClick={joinGame}>Join</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {player.name}</h1>
      {game.status === "setup" && <p>Waiting for host to start...</p>}
      {game.status === "in_progress" && !game.current_question_id && (
        <>
          <p>Waiting for the next question...</p>
          <Board categories={categories} size="compact" />
        </>
      )}
      {game.status === "in_progress" && game.current_question_id && (
        <p>Question revealed (next step)</p>
      )}
    </div>
  );
}

export default PlayPage;
