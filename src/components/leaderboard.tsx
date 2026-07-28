import AutoColumnList from "@/components/auto-column-list";

type Player = {
  id: string;
  name: string;
  score: number;
};

type LeaderboardProps = {
  players: Player[];
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
  const first = sorted[0];
  const rest = sorted.slice(1);

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
          <label className="text-[var(--label-text)] text-sm 2xl:text-xl font-mono uppercase mb-8 shrink-0">
            Final Scores
          </label>
          {first && (
            <div className="text-center shrink-0 mb-4">
              {renderPlayer(first)}
            </div>
          )}
          <div className="flex-1 min-h-0 w-full overflow-y-auto flex flex-col items-center gap-2 py-4">
            {rest.map((player) => (
              <div key={player.id}>{renderPlayer(player)}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <h1 className={`text-center pt-4 m-0 shrink-0 ${headingSize}`}>
        Jeoparty
      </h1>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
        <label className="text-[var(--label-text)] text-sm 2xl:text-xl font-mono uppercase mb-10 shrink-0">
          Final Scores
        </label>
        {first && (
          <div className="text-center shrink-0 mb-6">
            {renderPlayer(first)}
          </div>
        )}
        <AutoColumnList
          items={rest}
          getKey={(player) => player.id}
          maxColumns={5}
          renderItem={renderPlayer}
        />
      </div>
    </div>
  );
}

export default Leaderboard;
