type BoardProps = {
  categories: any[];
  size?: "full" | "compact";
  onQuestionClick?: (question: any) => void;
};

function Board({ categories, size = "full", onQuestionClick }: BoardProps) {
  const isCompact = size === "compact";

  return (
    <div
      className={
        isCompact
          ? "flex gap-2 font-mono text-xs"
          : "flex gap-4 font-mono text-sm"
      }
    >
      {categories.map((category) => (
        <div key={category.id} className="flex flex-col gap-2 flex-1">
          <div className="bg-[#a6c5d2] rounded-[10px] p-2 text-center">
            {category.name || "Untitled"}
          </div>
          {category.questions.map((question: any) => (
            <button
              key={question.id}
              type="button"
              disabled={question.state !== "unplayed" || !onQuestionClick}
              onClick={() => onQuestionClick?.(question)}
              className={
                question.state === "unplayed"
                  ? "bg-[#dcdcdc] rounded-[10px] p-2"
                  : "bg-gray-200 opacity-40 rounded-[10px] p-2"
              }
            >
              {question.state === "unplayed" ? question.points : ""}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Board;
