import { useRef, useState } from "react";
import { motion, MotionConfig } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";

const transition = { type: "spring", bounce: 0.1, duration: 0.2 } as const;

type LoadBoardProps = {
  roomCode: string;
  onRoomCodeChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
};

function LoadBoard({
  roomCode,
  onRoomCodeChange,
  onSubmit,
  isLoading,
  error,
}: LoadBoardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false));

  function handleSubmit() {
    if (!roomCode.trim() || isLoading) return;
    onSubmit();
  }

  return (
    <MotionConfig transition={transition}>
      <div ref={containerRef} className="flex flex-col items-center gap-1">
        <motion.div
          animate={{ width: isOpen ? 220 : 145 }}
          initial={false}
          className={`overflow-hidden rounded-[10px] shadow-sm ${
            isOpen
              ? "bg-[#dcdcdc]"
              : "bg-[#6b93a6] transition-transform duration-300 ease-out hover:scale-95"
          }`}
        >
          {!isOpen ? (
            <button
              type="button"
              className="flex w-full items-center justify-center p-2 text-white cursor-pointer font-mono text-base"
              onClick={() => setIsOpen(true)}
            >
              Load Board
            </button>
          ) : (
            <div className="flex items-center gap-1 p-1">
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--text-h)] cursor-pointer"
                onClick={() => setIsOpen(false)}
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <input
                autoFocus
                className="h-8 w-full rounded-[8px] bg-transparent px-2 font-mono text-sm text-center text-[var(--text-h)] placeholder:text-[var(--placeholder-text)] focus:outline-none"
                placeholder="Past Game Code"
                value={roomCode}
                onChange={(event) => onRoomCodeChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSubmit();
                }}
              />
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-white bg-[#6b93a6] cursor-pointer disabled:opacity-50"
                onClick={handleSubmit}
                disabled={isLoading || !roomCode.trim()}
                aria-label="Load board"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </motion.div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </MotionConfig>
  );
}

export default LoadBoard;
