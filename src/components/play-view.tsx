import { useEffect, useRef, useState } from "react";
import { Hud } from "@/components/hud";
import { TouchControls } from "@/components/touch-controls";
import { Button } from "@/components/ui/button";
import { gameBus, type HudSnap } from "@/game/bus";
import { useGameUI } from "@/game/store";
import { bindWindow } from "@/game/input";
import { loadSave, writeSave } from "@/game/save";
import { JOBS } from "@/game/content";
import { unlockAudio, setMuted, isMuted } from "@/game/audio";

export function PlayView() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<{ destroy: (remove: boolean) => void } | null>(null);
  const hud = useGameUI((s) => s.hud);
  const setHud = useGameUI((s) => s.setHud);
  const paused = useGameUI((s) => s.paused);
  const setPaused = useGameUI((s) => s.setPaused);
  const bagOpen = useGameUI((s) => s.bagOpen);
  const setBag = useGameUI((s) => s.setBagOpen);
  const setScreen = useGameUI((s) => s.setScreen);
  const save = useGameUI((s) => s.save);
  const refresh = useGameUI((s) => s.refreshSave);
  const [mute, setMute] = useState(false);

  useEffect(() => {
    unlockAudio();
    const unbind = bindWindow();
    const offHud = gameBus.on("hud", (snap) => setHud(snap as HudSnap));
    const offPause = gameBus.on("toggle-pause", () => setPaused(!useGameUI.getState().paused));
    const offBag = gameBus.on("toggle-bag", () => setBag(!useGameUI.getState().bagOpen));
    const offSaved = gameBus.on("saved", () => refresh());
    const parent = hostRef.current;
    let destroyed = false;
    (async () => {
      if (!parent) return;
      const { createGame } = await import("@/game/createGame");
      if (destroyed) return;
      const loaded = loadSave();
      const job = loaded?.job ?? useGameUI.getState().job;
      const mapId = loaded?.map ?? "haven";
      gameRef.current = createGame({ parent, job, mapId });
    })();
    const onHide = () => {
      if (document.hidden) gameBus.emit("set-paused", true);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      destroyed = true;
      unbind();
      offHud();
      offPause();
      offBag();
      offSaved();
      document.removeEventListener("visibilitychange", onHide);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [setHud, setPaused, setBag]);

  useEffect(() => {
    gameBus.emit("set-paused", paused || bagOpen);
  }, [paused, bagOpen]);

  useEffect(() => {
    if (bagOpen) refresh();
  }, [bagOpen, refresh]);

  const equipped = save?.equipped ?? {};

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-bg">
      <div
        ref={hostRef}
        className="relative min-h-0 flex-1 touch-none [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full"
      />
      {hud ? <Hud snap={hud} /> : null}
      <TouchControls />

      {paused ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[length:var(--radius-xl)] border border-border bg-bg-elevated p-6">
            <h2 className="font-display text-2xl font-semibold">Paused</h2>
            <p className="mt-1 text-sm text-fg-muted">Progress is saved on this device.</p>
            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={() => setPaused(false)}>Resume</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setMute(!mute);
                  setMuted(!mute);
                }}
              >
                {mute || isMuted() ? "Unmute" : "Mute"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setPaused(false);
                  setScreen("title");
                  refresh();
                }}
              >
                Title
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {bagOpen ? (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-bg/50 sm:items-center">
          <div className="w-full max-w-md rounded-t-[length:var(--radius-xl)] border border-border bg-bg-elevated p-5 sm:rounded-[length:var(--radius-xl)]">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-semibold">Bag</h2>
              <button type="button" className="text-sm text-fg-muted" onClick={() => setBag(false)}>
                Close
              </button>
            </div>
            <p className="mt-3 text-xs uppercase tracking-wider text-fg-subtle">Equipped</p>
            <ul className="mt-1 text-sm text-fg-muted">
              <li>Weapon · {equipped.weapon?.name ?? "None"}</li>
              <li>Armor · {equipped.armor?.name ?? "None"}</li>
              <li>Charm · {equipped.acc?.name ?? "None"}</li>
            </ul>
            <p className="mt-4 text-xs uppercase tracking-wider text-fg-subtle">Inventory</p>
            <ul className="mt-1 max-h-40 overflow-auto text-sm">
              {(save?.inventory ?? []).length === 0 ? (
                <li className="text-fg-subtle">Empty — hunt Dewpath for drops.</li>
              ) : (
                (save?.inventory ?? []).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 py-1">
                    <span>
                      {item.name}{" "}
                      <span className="text-fg-subtle">
                        +{item.atk} atk +{item.def} def
                      </span>
                    </span>
                    <button
                      type="button"
                      className="text-xs text-primary"
                      onClick={() => {
                        const cur = loadSave();
                        if (!cur) return;
                        cur.equipped = { ...cur.equipped, [item.slot]: item };
                        writeSave(cur);
                        refresh();
                        gameBus.emit("equip", item);
                      }}
                    >
                      Equip
                    </button>
                  </li>
                ))
              )}
            </ul>
            <p className="mt-3 text-xs text-fg-subtle">
              {JOBS[save?.job ?? "guardian"].skillName} costs dew. Rest with Wren in the grove.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
