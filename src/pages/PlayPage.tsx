import { useState } from "react";
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

type Player = {
  id: string;
  game_id: string;
  name: string;
  score: number;
};

function PlayPage() {
  const { roomCode } = useParams();
  const { game, loading } = useGame(roomCode);
  const players = usePlayers(game?.id);
  const categories = useBoard(game?.id);
  const [name, setName] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
  const [restoredForGameId, setRestoredForGameId] = useState<string>();

  const revealed = game?.current_question_id
    ? findRevealedQuestion(categories, game.current_question_id)
    : null;
  const secondsLeft = useCountdown(revealed?.question.revealed_at, 30);
  const submissions = useSubmissions(revealed?.question.id);
  const mySubmission = submissions.find(
    (submission) => submission.player_id === player?.id,
  );

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [freeTextInput, setFreeTextInput] = useState("");
  const [answeredQuestionId, setAnsweredQuestionId] = useState(
    revealed?.question.id,
  );

  if (revealed?.question.id !== answeredQuestionId) {
    setAnsweredQuestionId(revealed?.question.id);
    setSelectedChoice(null);
    setFreeTextInput("");
  }

  if (game?.id && game.id !== restoredForGameId) {
    setRestoredForGameId(game.id);
    const stored = localStorage.getItem(`jeoparty-player-${game.id}`);
    if (stored) {
      setPlayer(JSON.parse(stored));
    }
  }

  async function submitAnswer(answerText: string) {
    if (!revealed || !player || !answerText.trim()) return;

    await supabase.from("submissions").upsert(
      {
        question_id: revealed.question.id,
        player_id: player.id,
        answer_text: answerText,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "question_id,player_id" },
    );
  }

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
            className="bg-[#dcdcdc] rounded-[10px] p-2 font-mono text-center text-[var(--text-h)] placeholder:text-[var(--placeholder-text)]"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter Name"
          />
          <button
            className="bg-white rounded-[10px] p-2 w-full font-mono"
            onClick={joinGame}
          >
            Join Game
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
        <p className="text-center font-mono">You're in.</p>
        <p className="text-center font-mono">Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div>
      {game.status === "in_progress" && !game.current_question_id && (
        <div className="min-h-screen flex flex-col">
          <h1 className="text-center pt-4 m-0">Jeoparty</h1>
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <Board categories={categories} size="compact" />
            <p className="mt-6 font-mono text-[var(--text-h)]">
              Choosing question ...
            </p>
          </div>
        </div>
      )}
      {game.status === "in_progress" && revealed && (
        <div
          className={`min-h-screen flex flex-col ${
            revealed.question.state === "answered"
              ? mySubmission?.is_correct
                ? "bg-[var(--correct)]"
                : "bg-[var(--incorrect)]"
              : ""
          }`}
        >
          <h1
            className={`text-center pt-4 m-0 ${
              revealed.question.state === "answered" ? "text-white" : ""
            }`}
          >
            Jeoparty
          </h1>
          <p
            className={`text-center my-8 text-sm font-mono uppercase ${
              revealed.question.state === "answered"
                ? mySubmission?.is_correct
                  ? "text-[var(--correct-label)]"
                  : "text-[var(--incorrect-label)]"
                : "text-[var(--label-text)]"
            }`}
          >
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
              <label
                className={`text-sm font-mono uppercase mb-2 ${
                  revealed.question.state === "answered"
                    ? mySubmission?.is_correct
                      ? "text-[var(--correct-label)]"
                      : "text-[var(--incorrect-label)]"
                    : "text-[var(--label-text)]"
                }`}
              >
                Question
              </label>
              <h2
                className={`text-3xl ${
                  revealed.question.state === "answered" ? "text-white" : ""
                }`}
              >
                {revealed.question.prompt}
              </h2>
            </div>

            {revealed.question.state === "revealed" && (
              <div className="w-full flex-1 min-h-0 flex flex-col gap-2 mt-6">
                {revealed.question.question_type === "multiple_choice" ? (
                  <>
                    <label className="text-[var(--label-text)] text-sm font-mono uppercase mb-2">
                      Select Your Answer
                    </label>
                    <div className="flex flex-col gap-4">
                      {revealed.question.choices.map(
                        (choice: string, index: number) => (
                          <label
                            key={index}
                            className="flex items-center gap-2 leading-none"
                          >
                            <input
                              type="radio"
                              className="m-0"
                              name={`answer-${revealed.question.id}`}
                              checked={selectedChoice === choice}
                              onChange={() => setSelectedChoice(choice)}
                              disabled={secondsLeft === 0}
                            />
                            <span className="font-offbit text-3xl text-[var(--text-h)]">
                              {choice}
                            </span>
                          </label>
                        ),
                      )}
                    </div>
                    <div className="flex-1" />
                    <button
                      className="bg-[#6b93a6] text-white rounded-[10px] p-2 shadow-sm transition-transform duration-300 ease-out hover:scale-95 cursor-pointer font-mono"
                      onClick={() => submitAnswer(selectedChoice ?? "")}
                      disabled={!selectedChoice || secondsLeft === 0}
                    >
                      Submit
                    </button>
                  </>
                ) : (
                  <>
                    <label className="text-[var(--label-text)] text-sm font-mono uppercase mb-2">
                      Type Your Answer
                    </label>
                    <textarea
                      className="bg-[#eeeeee] rounded-[10px] p-3 flex-1 min-h-0 mb-6 font-offbit text-3xl text-[var(--text-h)]"
                      value={freeTextInput}
                      onChange={(event) => setFreeTextInput(event.target.value)}
                      disabled={secondsLeft === 0}
                    />
                    <button
                      className="bg-[#6b93a6] text-white rounded-[10px] p-2 shadow-sm transition-transform duration-300 ease-out hover:scale-95 cursor-pointer font-mono"
                      onClick={() => submitAnswer(freeTextInput)}
                      disabled={!freeTextInput.trim() || secondsLeft === 0}
                    >
                      Submit
                    </button>
                  </>
                )}
              </div>
            )}

            {revealed.question.state === "judging" && (
              <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center gap-2 mt-6">
                <p className="font-mono text-center text-[var(--text-h)]">
                  Host is judging 🧐 ...
                </p>
              </div>
            )}

            {revealed.question.state === "answered" && (
              <div className="w-full flex-1 min-h-0 flex flex-col gap-2 mt-6">
                <label
                  className={`text-sm font-mono uppercase mb-2 ${
                    mySubmission?.is_correct
                      ? "text-[var(--correct-label)]"
                      : "text-[var(--incorrect-label)]"
                  }`}
                >
                  Correct Answer
                </label>
                <h2 className="text-3xl text-white">
                  {revealed.question.correct_answer}
                </h2>
                <div className="flex-1" />
                <p
                  className={`text-center font-mono ${
                    mySubmission?.is_correct
                      ? "text-[var(--correct-text)]"
                      : "text-[var(--incorrect-text)]"
                  }`}
                >
                  {mySubmission?.is_correct
                    ? "You got it!"
                    : "Better luck next time ..."}
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
