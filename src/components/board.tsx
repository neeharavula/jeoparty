import { getCategoryColorClass } from "@/lib/board";

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
          ? "flex justify-center gap-2 font-mono text-xs"
          : "flex justify-center gap-6 font-mono text-sm"
      }
    >
      {categories.map((category, index) => (
        <div
          key={category.id}
          className={
            isCompact ? "flex flex-col gap-2" : "flex flex-col gap-4 w-48"
          }
        >
          <div
            className={`${getCategoryColorClass(index)} ${
              isCompact
                ? "rounded-[6px] h-6 w-12"
                : "p-3 rounded-[10px] text-center font-offbit text-xl 2xl:text-3xl text-[var(--category-header-text)] shadow-sm transition-transform duration-300 ease-out hover:scale-95"
            }`}
          >
            {!isCompact && (category.name || "Untitled")}
          </div>
          {category.questions.map((question: any) => (
            <button
              key={question.id}
              type="button"
              disabled={question.state !== "unplayed" || !onQuestionClick}
              onClick={() => onQuestionClick?.(question)}
              className={
                isCompact
                  ? `w-12 h-12 rounded-[6px] ${
                      question.state === "unplayed"
                        ? "bg-[var(--tile-unplayed-bg)]"
                        : "bg-[var(--tile-played-bg)]"
                    } ${onQuestionClick ? "cursor-pointer" : ""}`
                  : `p-6 rounded-[10px] w-full shadow-sm transition-transform duration-300 ease-out hover:scale-95 ${
                      question.state === "unplayed"
                        ? "bg-[var(--tile-unplayed-bg)]"
                        : "bg-[var(--tile-played-bg)]"
                    } ${onQuestionClick ? "cursor-pointer" : ""}`
              }
            >
              {!isCompact && (
                <span
                  className={`font-offbit text-xl 2xl:text-3xl tracking-wider ${
                    question.state === "unplayed"
                      ? "text-[var(--tile-unplayed-text)]"
                      : "text-[var(--tile-played-text)]"
                  }`}
                >
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
