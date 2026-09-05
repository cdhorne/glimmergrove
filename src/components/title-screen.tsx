import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGameUI } from "@/game/store";
import { unlockAudio } from "@/game/audio";
import { asset } from "@/lib/asset";

export function TitleScreen() {
  const setScreen = useGameUI((s) => s.setScreen);
  const refresh = useGameUI((s) => s.refreshSave);
  const save = useGameUI((s) => s.save);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="relative flex min-h-dvh flex-col justify-end overflow-hidden bg-bg">
      <img
        src={asset("/game/map/haven-sky.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-6 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-16">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">Side-scroll adventure</p>
          <h1 className="font-display text-5xl font-semibold leading-tight tracking-[-0.03em] text-fg">
            Glimmergrove
          </h1>
          <p className="max-w-[34ch] text-sm leading-relaxed text-fg-muted">
            Pick a calling. Jump the ledges. Hunt the Dewpath. Hands on, no auto-battle.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={() => {
              unlockAudio();
              setScreen("create");
            }}
          >
            New journey
          </Button>
          <Button
            size="lg"
            variant="secondary"
            disabled={!save}
            onClick={() => {
              unlockAudio();
              refresh();
              setScreen("play");
            }}
          >
            Continue
          </Button>
        </div>
        <p className="text-xs text-fg-subtle max-md:hidden">
          A/D move · W jump · J attack · K skill. Walk into glowing rings to change maps.
        </p>
        <p className="text-xs leading-relaxed text-fg-subtle md:hidden">
          On-screen buttons appear in the grove: left/right to walk, jump, attack, skill, and talk.
          Walk into glowing rings to change maps. Landscape is nicer.
        </p>
      </div>
    </div>
  );
}
