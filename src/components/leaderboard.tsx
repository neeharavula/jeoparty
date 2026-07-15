type LeaderboardProps = {
  players: any[];
};

function Leaderboard({ players }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score;

  return (
    <div className="min-h-screen flex flex-col">
      <h1 className="text-center pt-4 m-0">Jeoparty</h1>
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <label className="text-gray-400 text-sm font-mono uppercase mb-2">
          Final Scores
        </label>
        <div className="flex flex-col items-center gap-2">
          {sorted.map((player) => (
            <p
              key={player.id}
              className={`font-offbit text-3xl ${
                player.score === topScore
                  ? "text-[var(--correct)]"
                  : "text-[var(--text-h)]"
              }`}
            >
              {player.name}: {player.score}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
