import { useEffect, useRef, useState, type ReactNode } from "react";

type AutoColumnListProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  maxColumns?: number;
  maxColumnHeight?: number;
  columnWidth?: number;
  gap?: number;
};

/* renders items in as few centered columns as fit, filling one column
   top-to-bottom before starting the next, growing up to maxColumns */
function AutoColumnList<T>({
  items,
  getKey,
  renderItem,
  maxColumns = 3,
  maxColumnHeight = 320,
  columnWidth = 280,
  gap = 12,
}: AutoColumnListProps<T>) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const node = measureRef.current;
    if (!node) return;

    const contentHeight = node.scrollHeight;
    const neededColumns = Math.min(
      maxColumns,
      Math.max(1, Math.ceil(contentHeight / maxColumnHeight)),
    );
    setColumns(neededColumns);
  }, [items, maxColumns, maxColumnHeight]);

  const itemsPerColumn = Math.ceil(items.length / columns) || 1;
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += itemsPerColumn) {
    chunks.push(items.slice(i, i + itemsPerColumn));
  }

  return (
    <>
      <div
        ref={measureRef}
        aria-hidden
        className="absolute opacity-0 pointer-events-none -z-10 flex flex-col"
        style={{ width: columnWidth, gap, top: 0, left: 0 }}
      >
        {items.map((item) => (
          <div key={getKey(item)}>{renderItem(item)}</div>
        ))}
      </div>
      <div className="w-full flex justify-center" style={{ gap: gap * 2 }}>
        {chunks.map((chunk, index) => (
          <div key={index} className="flex flex-col" style={{ gap }}>
            {chunk.map((item) => (
              <div key={getKey(item)}>{renderItem(item)}</div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default AutoColumnList;
