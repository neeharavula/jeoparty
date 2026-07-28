import AutoColumnList from "@/components/auto-column-list";

type LeaderboardProps = {
  players: any[];
  textSize?: string;
  headingSize?: string;
  singleColumn?: boolean;
};

function Leaderboard({
  players,
  textSize = "text-3xl",
  headingSize = "2xl:text-8xl",
  singleColumn = false,
}: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score;

  const renderPlayer = (player: (typeof sorted)[number]) => (
    <p
      className={`font-offbit ${textSize} ${
        player.score === topScore
          ? "text-[var(--correct)]"
          : "text-[var(--text-h)]"
      }`}
    >
      {player.name}: {player.score}
    </p>
  );

  if (singleColumn) {
    return (
      <div className="h-dvh flex flex-col overflow-hidden">
        <h1 className={`text-center pt-4 m-0 shrink-0 ${headingSize}`}>
          Jeoparty
        </h1>
        <div className="flex-1 min-h-0 flex flex-col items-center gap-2 pt-8 pb-6">
          <label className="text-[var(--label-text)] text-sm 2xl:text-xl font-mono uppercase mb-2 shrink-0">
            Final Scores
          </label>
          <div className="flex-1 min-h-0 w-full overflow-y-auto flex flex-col items-center gap-2 py-4">
            {sorted.map((player) => (
              <div key={player.id}>{renderPlayer(player)}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <h1 className={`text-center pt-4 m-0 ${headingSize}`}>Jeoparty</h1>
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <label className="text-[var(--label-text)] text-sm 2xl:text-xl font-mono uppercase mb-2">
          Final Scores
        </label>
        <AutoColumnList
          items={sorted}
          getKey={(player) => player.id}
          renderItem={renderPlayer}
        />
      </div>
    </div>
  );
}

export default Leaderboard;
