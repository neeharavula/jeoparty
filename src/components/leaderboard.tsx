type LeaderboardProps = {
  players: any[];
};

function Leaderboard({ players }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col items-center gap-3 font-mono">
      <h1>Final Scores</h1>
      {sorted.map((player, index) => (
        <p
          key={player.id}
          className={index === 0 ? "text-2xl font-bold" : "text-base"}
        >
          {player.name}: {player.score}
        </p>
      ))}
    </div>
  );
}

export default Leaderboard;
