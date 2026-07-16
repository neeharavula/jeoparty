import AutoColumnList from "@/components/auto-column-list";

type LeaderboardProps = {
  players: any[];
  textSize?: string;
  headingSize?: string;
};

function Leaderboard({
  players,
  textSize = "text-3xl",
  headingSize = "2xl:text-8xl",
}: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score;

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
          renderItem={(player) => (
            <p
              className={`font-offbit ${textSize} ${
                player.score === topScore
                  ? "text-[var(--correct)]"
                  : "text-[var(--text-h)]"
              }`}
            >
              {player.name}: {player.score}
            </p>
          )}
        />
      </div>
    </div>
  );
}

export default Leaderboard;
