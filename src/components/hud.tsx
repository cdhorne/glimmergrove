import type { HudSnap } from "@/game/bus";
import { Pause, Backpack } from "lucide-react";
import { useGameUI } from "@/game/store";

function Bar({
  value,
  max,
  tone,
}: {
  value: number;
  max: number;
  tone: "hp" | "mp" | "exp";
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const fill = tone === "hp" ? "bg-hp" : tone === "mp" ? "bg-mp" : "bg-exp";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-subtle">
      <div className={`h-full ${fill}`} style={{ width: `${pct * 100}%` }} />
    </div>
  );
}

export function Hud({ snap }: { snap: HudSnap }) {
  const setPaused = useGameUI((s) => s.setPaused);
  const setBag = useGameUI((s) => s.setBagOpen);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto mx-auto flex max-w-3xl items-start gap-3">
        <div className="min-w-0 flex-1 rounded-[length:var(--radius-lg)] border border-border bg-bg/80 px-3 py-2 backdrop-blur-sm">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-display text-sm font-semibold">
              {snap.name} <span className="text-fg-subtle font-sans text-xs font-medium">Lv {snap.level} {snap.job}</span>
            </p>
            <p className="font-mono text-xs tabular-nums text-fg-muted">{snap.glims} glims</p>
          </div>
          <div className="mt-2 flex flex-col gap-1">
            <Bar value={snap.hp} max={snap.maxHp} tone="hp" />
            <Bar value={snap.mp} max={snap.maxMp} tone="mp" />
            <Bar value={snap.exp} max={snap.next} tone="exp" />
          </div>
          <p className="mt-1 flex items-baseline justify-between gap-2 text-[11px] text-fg-subtle">
            <span>{snap.map}</span>
            <span className="tabular-nums">
              {snap.skillCd > 0.05 ? `${snap.skillName} ${snap.skillCd.toFixed(1)}s` : snap.skillName}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-[length:var(--radius-md)] border border-border bg-bg/80 text-fg"
            onClick={() => setBag(true)}
            aria-label="Bag"
          >
            <Backpack className="size-4" />
          </button>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-[length:var(--radius-md)] border border-border bg-bg/80 text-fg"
            onClick={() => setPaused(true)}
            aria-label="Pause"
          >
            <Pause className="size-4" />
          </button>
        </div>
      </div>
      {snap.prompt ? (
        <p className="pointer-events-none mx-auto mt-3 max-w-md rounded-full border border-border bg-bg/80 px-4 py-1.5 text-center text-xs text-fg">
          {snap.prompt}
        </p>
      ) : null}
    </div>
  );
}
