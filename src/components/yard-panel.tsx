/** Haven yard. Call only from PlayView. Mutates save + economy, never Phaser. */
import { Button } from "@/components/ui/button";
import { gameBus } from "@/game/bus";
import { build, depositBag, runDigester, tickSeason } from "@/game/economy";
import { loadSave, writeSave, type SaveData } from "@/game/save";

export function YardPanel({
  save,
  onClose,
  refresh,
}: {
  save: SaveData | null;
  onClose: () => void;
  refresh: () => void;
}) {
  const write = (next: SaveData) => {
    writeSave(next);
    refresh();
  };

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-bg/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-[length:var(--radius-xl)] border border-border bg-bg-elevated p-5 sm:rounded-[length:var(--radius-xl)] touch-auto">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold">Yard</h2>
          <button type="button" className="text-sm text-fg-muted" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="mt-1 text-xs text-fg-muted">
          Cistern {save?.economy?.waterOk ? "clear" : "fouled"}. Bloom flag {save?.economy?.flags.bloom ? "on" : "off"}.
        </p>
        <p className="mt-3 text-xs uppercase tracking-wider text-fg-subtle">Bag / stocks</p>
        <p className="mt-1 text-sm tabular-nums">
          bag F{save?.economy?.bag.feed ?? 0} B{save?.economy?.bag.bulk ?? 0} · stocks F
          {save?.economy?.stocks.feed ?? 0} gas {save?.economy?.stocks.gas ?? 0}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              const cur = loadSave();
              if (!cur) return;
              cur.economy = depositBag(cur.economy);
              write(cur);
              gameBus.emit("saved");
            }}
          >
            Deposit bag
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const cur = loadSave();
              if (!cur) return;
              cur.economy = build(cur.economy, "digester");
              write(cur);
            }}
          >
            {save?.economy?.built.digester ? "Digester ready" : "Build digester"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const cur = loadSave();
              if (!cur) return;
              cur.economy = tickSeason(runDigester(cur.economy));
              write(cur);
            }}
          >
            Run digester · turn season
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const cur = loadSave();
              if (!cur) return;
              cur.economy = tickSeason(build(cur.economy, "cover"));
              write(cur);
            }}
          >
            {save?.economy?.built.cover ? "Cover set" : "Place cover"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-fg-subtle">
          Stockpile 6+ Feed without running the drum and Dewpath grows blooms. Cover keeps the cistern clear if you lose
          Feed to the gap.
        </p>
      </div>
    </div>
  );
}
