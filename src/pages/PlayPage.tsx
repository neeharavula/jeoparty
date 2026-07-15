import { useEffect, useState } from "react";
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

function PlayPage() {
  const { roomCode } = useParams();
  const { game, loading } = useGame(roomCode);
  const players = usePlayers(game?.id);
  const categories = useBoard(game?.id);
  const [name, setName] = useState("");
  const [player, setPlayer] = useState<any | null>(null);

  const revealed = game?.current_question_id
    ? findRevealedQuestion(categories, game.current_question_id)
    : null;
  const secondsLeft = useCountdown(revealed?.question.revealed_at, 30);
  const submissions = useSubmissions(revealed?.question.id);
  const mySubmission = submissions.find(
    (submission) => submission.player_id === player?.id,
  );

  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [freeTextInput, setFreeTextInput] = useState("");

  useEffect(() => {
    setMyAnswer(null);
    setFreeTextInput("");
  }, [revealed?.question.id]);

  async function submitAnswer(answerText: string) {
    if (!revealed || !player) return;

    await supabase.from("submissions").upsert(
      {
        question_id: revealed.question.id,
        player_id: player.id,
        answer_text: answerText,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "question_id,player_id" },
    );

    setMyAnswer(answerText);
  }

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
      <div className="min-h-screen relative flex flex-col items-center justify-center gap-4">
        <h1 className="absolute top-0 left-0 w-full text-center pt-4">
          Jeoparty
        </h1>
        <div className="flex flex-col gap-3 bg-[#a6c5d2] p-5 rounded-[10px] shadow-sm text-small">
          <input
            className="bg-[#dcdcdc] rounded-[10px] p-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="enter name"
          />
          <button
            className="bg-white rounded-[10px] p-2 w-full"
            onClick={joinGame}
          >
            Join
          </button>
        </div>
      </div>
    );
  }

  if (game.status === "setup") {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center gap-4">
        <h1 className="absolute top-0 left-0 w-full text-center pt-4">
          Jeoparty
        </h1>
        <p className="text-center">You're in.</p>
        <p className="text-center">Waiting for host to start...</p>
      </div>
    );
  }

  return (
    <div>
      {game.status === "in_progress" && !game.current_question_id && (
        <div className="min-h-screen flex flex-col">
          <h1 className="text-center pt-4">Jeoparty</h1>
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <Board categories={categories} size="compact" />
            <p className="mt-6">Choosing next question...</p>
          </div>
        </div>
      )}
      {game.status === "in_progress" && revealed && (
        <div
          className={`min-h-screen flex flex-col ${
            revealed.question.state === "answered"
              ? mySubmission?.is_correct
                ? "bg-green-200"
                : "bg-red-200"
              : ""
          }`}
        >
          <h1 className="text-center pt-4">Jeoparty</h1>
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="bg-[#dcdcdc] rounded-[10px] p-5 shadow-sm text-center mx-4">
            <p>
              {revealed.category.name || "Untitled"} {revealed.question.points}
            </p>
            <h2 className="text-center">{revealed.question.prompt}</h2>
          </div>

          {revealed.question.state === "revealed" && (
            <>
              {revealed.question.question_type === "multiple_choice" ? (
                <div>
                  {revealed.question.choices.map(
                    (choice: string, index: number) => (
                      <label key={index}>
                        <input
                          type="radio"
                          name={`answer-${revealed.question.id}`}
                          checked={myAnswer === choice}
                          onChange={() => submitAnswer(choice)}
                          disabled={secondsLeft === 0}
                        />
                        {choice}
                      </label>
                    ),
                  )}
                </div>
              ) : (
                <div>
                  <input
                    value={freeTextInput}
                    onChange={(event) => setFreeTextInput(event.target.value)}
                    disabled={secondsLeft === 0}
                  />
                  <button
                    onClick={() => submitAnswer(freeTextInput)}
                    disabled={secondsLeft === 0}
                  >
                    Submit
                  </button>
                </div>
              )}

              <p>{secondsLeft}s</p>

              {myAnswer && <p>Answer locked in!</p>}
            </>
          )}

          {revealed.question.state === "judging" && <p>Host is judging...</p>}

          {revealed.question.state === "answered" && (
            <div className="text-center">
              <h2>Correct answer: {revealed.question.correct_answer}</h2>
              <p
                className={`text-center ${
                  mySubmission?.is_correct
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {mySubmission?.is_correct
                  ? "You got it!"
                  : "Better luck next time"}
              </p>
            </div>
          )}
          </div>
        </div>
      )}

      {game.status === "complete" && <Leaderboard players={players} />}
    </div>
  );
}

export default PlayPage;
