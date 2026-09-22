/** Haven yard. Call only from PlayView. Mutates save + economy, never Phaser. */
import { Button } from "@/components/ui/button";
import { gameBus } from "@/game/bus";
import { build, depositBag, runDigester, tickSeason } from "@/game/economy";
import { buyNode, NODES } from "@/game/loadout/board";
import { attune, wornAspects } from "@/game/loadout/slots";
import { loadSave, writeSave, type SaveData } from "@/game/save";
import type { SlotId } from "@/game/loot/catalog";

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

  const eco = save?.economy;
  const aspects = eco ? wornAspects(eco) : [];

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-bg/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-[length:var(--radius-xl)] border border-border bg-bg-elevated p-5 sm:rounded-[length:var(--radius-xl)] touch-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold">Yard</h2>
          <button type="button" className="min-h-11 text-sm text-fg-muted" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="mt-1 text-xs text-fg-muted">
          Cistern {eco?.waterOk ? "clear" : "fouled"}. Bloom flag {eco?.flags.bloom ? "on" : "off"}.
        </p>
        <p className="mt-3 text-xs uppercase tracking-wider text-fg-subtle">Bag / stocks</p>
        <p className="mt-1 text-sm tabular-nums">
          bag F{eco?.bag.feed ?? 0} B{eco?.bag.bulk ?? 0} · stocks F
          {eco?.stocks.feed ?? 0} gas {eco?.stocks.gas ?? 0}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="secondary"
            className="min-h-11"
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
            className="min-h-11"
            onClick={() => {
              const cur = loadSave();
              if (!cur) return;
              cur.economy = build(cur.economy, "digester");
              write(cur);
            }}
          >
            {eco?.built.digester ? "Digester ready" : "Build digester"}
          </Button>
          <Button
            variant="secondary"
            className="min-h-11"
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
            className="min-h-11"
            onClick={() => {
              const cur = loadSave();
              if (!cur) return;
              cur.economy = tickSeason(build(cur.economy, "cover"));
              write(cur);
            }}
          >
            {eco?.built.cover ? "Cover set" : "Place cover"}
          </Button>
        </div>

        <p className="mt-5 text-xs uppercase tracking-wider text-fg-subtle">Sockets</p>
        <ul className="mt-1 text-sm text-fg-muted">
          {(["core", "reach", "anchor"] as SlotId[]).map((slot) => (
            <li key={slot} className="capitalize">
              {slot} · {eco?.loadout[slot]?.baseId ?? "empty"}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs uppercase tracking-wider text-fg-subtle">Tray pieces</p>
        <ul className="mt-1 space-y-2">
          {(eco?.tray.pieces ?? []).length === 0 ? (
            <li className="text-sm text-fg-subtle">Hunt Dewpath. Intact pieces stay here.</li>
          ) : (
            (eco?.tray.pieces ?? []).map((piece) => (
              <li key={piece.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 text-sm">
                  {piece.rarity} {piece.slot}
                  <span className="block text-xs text-fg-subtle">
                    {piece.properties.map((p) => `${p.id} ${p.grade}`).join(" · ")}
                  </span>
                </span>
                <Button
                  className="min-h-11 shrink-0"
                  onClick={() => {
                    const cur = loadSave();
                    if (!cur) return;
                    cur.economy = attune(cur.economy, piece.id, piece.slot);
                    write(cur);
                    gameBus.emit("saved");
                  }}
                >
                  Attune
                </Button>
              </li>
            ))
          )}
        </ul>

        <p className="mt-4 text-xs uppercase tracking-wider text-fg-subtle">
          Board · {eco?.board.points ?? 0} pt
        </p>
        <ul className="mt-1 space-y-2">
          {NODES.filter((n) => n.id.endsWith("-1") || n.id.endsWith("-2")).map((node) => {
            const open = aspects.includes(node.cluster);
            const bought = eco?.board.bought.includes(node.id);
            return (
              <li key={node.id} className="flex items-center justify-between gap-2">
                <span className="text-sm">
                  {node.label}
                  <span className="block text-xs text-fg-subtle">
                    {node.cluster} {open ? "open" : "dark"}
                  </span>
                </span>
                <Button
                  variant="secondary"
                  className="min-h-11 shrink-0"
                  disabled={!open || bought}
                  onClick={() => {
                    const cur = loadSave();
                    if (!cur) return;
                    cur.economy = {
                      ...cur.economy,
                      board: buyNode(cur.economy.board, node.id, wornAspects(cur.economy)),
                    };
                    write(cur);
                  }}
                >
                  {bought ? "Lit" : "Buy"}
                </Button>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 text-xs text-fg-subtle">
          Stockpile 6+ Feed without running the drum and Dewpath grows blooms. Cover keeps the cistern clear if you lose
          Feed to the gap. Attune and node buys stay here — not on the path.
        </p>
      </div>
    </div>
  );
}
