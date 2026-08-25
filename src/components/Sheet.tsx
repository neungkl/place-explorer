import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { MonthScrubber } from "./MonthScrubber";

export type SheetMode = "list" | "preview" | "detail" | "filters";

// The sheet has three sizes, independent of content mode: normal (list,
// preview), full (detail, filters — needs the room), and mini (dragged all
// the way down, collapsed to just the handle and month/year filter).
type SheetSize = "mini" | "normal" | "full";

function sizeForMode(mode: SheetMode): SheetSize {
  return mode === "detail" || mode === "filters" ? "full" : "normal";
}

const NORMAL_FRACTION = 0.55;
const FULL_FRACTION = 0.9;

// The detents the handle snaps to on release. Mini has no fixed height —
// it's just the header's natural size — so its pixel value is measured live
// from the header ref rather than hardcoded, and is only used to find the
// nearest detent while dragging.
function detents(miniPx: number) {
  const vh = window.innerHeight;
  return [
    { size: "mini" as SheetSize, px: miniPx },
    { size: "normal" as SheetSize, px: vh * NORMAL_FRACTION },
    { size: "full" as SheetSize, px: vh * FULL_FRACTION },
  ];
}

function nearestSize(px: number, miniPx: number): SheetSize {
  return detents(miniPx).reduce((closest, d) => (Math.abs(d.px - px) < Math.abs(closest.px - px) ? d : closest))
    .size;
}

// One sheet, mode-driven content — Normal/list, Normal/preview, Full/detail,
// Full/filters — per the design doc's "One sheet, four content modes". The
// month scrubber stays visible in the header at every size, per "The month
// scrubber lives in the sheet header".
//
// Size and mode are separate axes: dragging the handle overrides the mode's
// default size until the next selection change, matching "the list's height
// is not URL state ... dragging is the only way in and out."
export function Sheet({
  mode,
  onDismiss,
  month,
  onMonthChange,
  year,
  onYearChange,
  children,
}: {
  mode: SheetMode;
  onDismiss: () => void;
  month: number | null;
  onMonthChange: (month: number | null) => void;
  year: string;
  onYearChange: (year: string) => void;
  children: ReactNode;
}) {
  const [dragPx, setDragPx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [manualSize, setManualSize] = useState<SheetSize | null>(null);
  const dragStart = useRef<{ y: number; height: number } | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // A new selection (or dismissal) always resets to the mode's canonical
  // size, so a manual drag never survives a tap on a different pin/card.
  // Adjusted during render (not an effect) since it's just resetting state
  // in response to a prop change, per React's guidance on derived state.
  const [prevMode, setPrevMode] = useState(mode);
  if (mode !== prevMode) {
    setPrevMode(mode);
    setDragPx(null);
    setManualSize(null);
  }

  const effectiveSize = manualSize ?? sizeForMode(mode);
  const showNav = mode !== "list" && effectiveSize !== "mini";

  // Move/up listen on window rather than the handle element: a fast drag
  // routinely carries the pointer off the ~40px handle target, and without
  // this the gesture would silently stop tracking mid-drag.
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    const sheet = e.currentTarget.closest(".sheet") as HTMLDivElement | null;
    if (!sheet) return;
    dragStart.current = { y: e.clientY, height: sheet.getBoundingClientRect().height };
    setIsDragging(true);

    const handleMove = (moveEvent: globalThis.PointerEvent) => {
      if (!dragStart.current) return;
      const deltaY = moveEvent.clientY - dragStart.current.y;
      const vh = window.innerHeight;
      const floor = headerRef.current?.getBoundingClientRect().height ?? 0;
      const next = Math.min(vh * FULL_FRACTION, Math.max(floor, dragStart.current.height - deltaY));
      setDragPx(next);
    };

    const handleUp = () => {
      dragStart.current = null;
      setIsDragging(false);
      setDragPx((current) => {
        if (current == null) return current;
        const miniPx = headerRef.current?.getBoundingClientRect().height ?? current;
        setManualSize(nearestSize(current, miniPx));
        return null;
      });
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  }

  const style = dragPx != null ? { height: `${dragPx}px` } : undefined;

  return (
    <div
      className={`sheet ${dragPx == null ? `sheet--${effectiveSize}` : ""} ${isDragging ? "sheet--dragging" : ""}`}
      style={style}
    >
      <div className="sheet__header" ref={headerRef}>
        <div className="sheet__handle-area" onPointerDown={onPointerDown}>
          <div className="sheet__handle" aria-hidden="true" />
        </div>
        {showNav && (
          <div className="sheet__nav">
            <button
              type="button"
              className="sheet__nav-btn sheet__nav-btn--close"
              onClick={onDismiss}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <MonthScrubber month={month} onChange={onMonthChange} year={year} onYearChange={onYearChange} />
      </div>
      <div className="sheet__body">{children}</div>
    </div>
  );
}
