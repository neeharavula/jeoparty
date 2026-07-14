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
          : "flex justify-center gap-4 font-mono text-sm"
      }
    >
      {categories.map((category) => (
        <div
          key={category.id}
          className={
            isCompact ? "flex flex-col gap-2 flex-1" : "flex flex-col gap-3 w-40"
          }
        >
          {!isCompact && (
            <div className="bg-[#a6c5d2] p-2.5 rounded-[10px] text-center shadow-sm transition-transform duration-300 ease-out hover:scale-95">
              {category.name || "Untitled"}
            </div>
          )}
          {category.questions.map((question: any) => (
            <button
              key={question.id}
              type="button"
              disabled={question.state !== "unplayed" || !onQuestionClick}
              onClick={() => onQuestionClick?.(question)}
              className={
                isCompact
                  ? `w-16 h-16 rounded-[10px] ${
                      question.state === "unplayed"
                        ? "bg-[#dcdcdc]"
                        : "bg-gray-200 opacity-40"
                    } ${onQuestionClick ? "cursor-pointer" : ""}`
                  : `p-5 rounded-[10px] w-full shadow-sm transition-transform duration-300 ease-out hover:scale-95 ${
                      question.state === "unplayed"
                        ? "bg-[#dcdcdc]"
                        : "bg-gray-200 opacity-40"
                    } ${onQuestionClick ? "cursor-pointer" : ""}`
              }
            >
              {!isCompact && question.state === "unplayed" && (
                <span className="font-offbit text-lg tracking-wider">
                  {question.points}
                </span>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Board;
