import { JOBS, type JobId } from "@/game/content";
import { Button } from "@/components/ui/button";
import { useGameUI } from "@/game/store";
import { defaultSave, writeSave } from "@/game/save";
import { unlockAudio } from "@/game/audio";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/asset";

const ORDER: JobId[] = ["guardian", "weaver", "ranger"];

export function JobSelect() {
  const job = useGameUI((s) => s.job);
  const name = useGameUI((s) => s.name);
  const setJob = useGameUI((s) => s.setJob);
  const setName = useGameUI((s) => s.setName);
  const setScreen = useGameUI((s) => s.setScreen);
  const refresh = useGameUI((s) => s.refreshSave);

  function start() {
    unlockAudio();
    const save = defaultSave(job, name);
    save.hp = JOBS[job].hp;
    save.mp = JOBS[job].mp;
    writeSave(save);
    refresh();
    setScreen("play");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Choose a calling</p>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.03em]">Who walks the grove?</h2>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-fg-muted">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            className="h-11 rounded-[length:var(--radius-md)] border border-border bg-bg-elevated px-3 text-sm text-fg outline-none focus:ring-2 focus:ring-primary/40"
            maxLength={16}
          />
        </label>
        <div className="grid gap-3">
          {ORDER.map((id) => {
            const j = JOBS[id];
            const selected = job === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setJob(id)}
                className={cn(
                  "flex items-center gap-4 rounded-[length:var(--radius-lg)] border p-3 text-left transition-colors",
                  selected ? "border-primary bg-bg-elevated" : "border-border bg-bg-subtle/60",
                )}
              >
                <img
                  src={asset(`/game/sprites/${id}-portrait.png`)}
                  alt=""
                  className="size-20 shrink-0 rounded-[length:var(--radius-md)] bg-bg object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold">{j.name}</p>
                  <p className="text-xs text-fg-subtle">{j.title}</p>
                  <p className="mt-1 text-sm leading-snug text-fg-muted">{j.blurb}</p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setScreen("title")}>
            Back
          </Button>
          <Button className="flex-1" onClick={start}>
            Enter the grove
          </Button>
        </div>
      </div>
    </div>
  );
}
