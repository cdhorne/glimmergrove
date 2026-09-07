import type { HudSnap } from "@/game/bus";
import { Pause, Backpack } from "lucide-react";
import { useGameUI } from "@/game/store";

function Bar({
  value,
  max,
  tone,
  className = "",
}: {
  value: number;
  max: number;
  tone: "hp" | "mp" | "exp";
  className?: string;
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const fill = tone === "hp" ? "bg-hp" : tone === "mp" ? "bg-mp" : "bg-exp";
  return (
    <div className={`overflow-hidden rounded-full bg-bg-subtle ${className || "h-1.5 w-full"}`}>
      <div className={`h-full ${fill}`} style={{ width: `${pct * 100}%` }} />
    </div>
  );
}

export function Hud({ snap }: { snap: HudSnap }) {
  const setPaused = useGameUI((s) => s.setPaused);
  const setBag = useGameUI((s) => s.setBagOpen);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-2 pt-[max(0.4rem,env(safe-area-inset-top))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] landscape:p-1.5 landscape:pt-[max(0.25rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto flex max-w-xl items-center gap-2 landscape:max-w-none">
        <div className="min-w-0 flex-1 rounded-[length:var(--radius-md)] border border-border bg-bg/70 px-2.5 py-1.5 backdrop-blur-sm landscape:max-w-xs landscape:bg-bg/55 landscape:px-2 landscape:py-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-display text-sm font-semibold landscape:text-xs">
              {snap.name}{" "}
              <span className="text-fg-subtle font-sans text-xs font-medium landscape:text-[10px]">
                Lv {snap.level} {snap.job}
              </span>
            </p>
            <p className="font-mono text-xs tabular-nums text-fg-muted landscape:text-[10px]">
              {snap.glims}
              {typeof snap.bagFeed === "number" ? ` · F${snap.bagFeed}` : ""}
              {snap.waterOk === false ? " · dry" : ""}
            </p>
          </div>
          <div className="mt-1 flex flex-col gap-0.5 landscape:mt-0.5 landscape:flex-row landscape:gap-1.5">
            <Bar value={snap.hp} max={snap.maxHp} tone="hp" className="h-1.5 w-full landscape:h-1 landscape:flex-1" />
            <Bar value={snap.mp} max={snap.maxMp} tone="mp" className="h-1.5 w-full landscape:h-1 landscape:flex-1" />
            <Bar value={snap.exp} max={snap.next} tone="exp" className="h-1.5 w-full landscape:h-1 landscape:w-16 landscape:flex-none" />
          </div>
          <p className="mt-1 flex items-baseline justify-between gap-2 text-[11px] text-fg-subtle landscape:hidden">
            <span>{snap.map}</span>
            <span className="tabular-nums">
              {snap.skillCd > 0.05 ? `${snap.skillName} ${snap.skillCd.toFixed(1)}s` : snap.skillName}
            </span>
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-[length:var(--radius-md)] border border-border bg-bg/80 text-fg landscape:size-8"
            onClick={() => setBag(true)}
            aria-label="Bag"
          >
            <Backpack className="size-4 landscape:size-3.5" />
          </button>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-[length:var(--radius-md)] border border-border bg-bg/80 text-fg landscape:size-8"
            onClick={() => setPaused(true)}
            aria-label="Pause"
          >
            <Pause className="size-4 landscape:size-3.5" />
          </button>
        </div>
      </div>
      {snap.prompt ? (
        <p className="pointer-events-none mx-auto mt-2 max-w-md rounded-full border border-border bg-bg/80 px-3 py-1 text-center text-xs text-fg landscape:mt-1 landscape:max-w-sm landscape:py-0.5 landscape:text-[11px]">
          {snap.prompt}
        </p>
      ) : null}
    </div>
  );
}
