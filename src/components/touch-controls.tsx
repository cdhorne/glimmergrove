import { ChevronLeft, ChevronRight, ChevronsUp, Sparkles, Sword, Hand } from "lucide-react";
import { touch } from "@/game/input";
import { cn } from "@/lib/utils";
import type { PointerEvent, ReactNode } from "react";

function Hold({
  className,
  label,
  icon,
  on,
  off,
}: {
  className?: string;
  label: string;
  icon: ReactNode;
  on: () => void;
  off: () => void;
}) {
  function down(e: PointerEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    on();
  }
  function up(e: PointerEvent) {
    e.preventDefault();
    off();
  }
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex size-14 items-center justify-center rounded-full border border-border bg-bg/75 text-fg backdrop-blur-sm select-none",
        className,
      )}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
    >
      {icon}
    </button>
  );
}

export function TouchControls() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden max-md:flex items-end justify-between px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="pointer-events-auto flex gap-2">
        <Hold
          label="Left"
          icon={<ChevronLeft className="size-6" />}
          on={() => {
            touch.moveX = -1;
          }}
          off={() => {
            if (touch.moveX < 0) touch.moveX = 0;
          }}
        />
        <Hold
          label="Right"
          icon={<ChevronRight className="size-6" />}
          on={() => {
            touch.moveX = 1;
          }}
          off={() => {
            if (touch.moveX > 0) touch.moveX = 0;
          }}
        />
      </div>
      <div className="pointer-events-auto flex items-end gap-2">
        <Hold
          label="Talk"
          className="size-12"
          icon={<Hand className="size-4" />}
          on={() => {
            touch.interact = true;
          }}
          off={() => {
            touch.interact = false;
          }}
        />
        <Hold
          label="Skill"
          className="size-12"
          icon={<Sparkles className="size-4" />}
          on={() => {
            touch.skill = true;
          }}
          off={() => {
            touch.skill = false;
          }}
        />
        <Hold
          label="Attack"
          icon={<Sword className="size-5" />}
          on={() => {
            touch.attack = true;
          }}
          off={() => {
            touch.attack = false;
          }}
        />
        <Hold
          label="Jump"
          className="size-16"
          icon={<ChevronsUp className="size-6" />}
          on={() => {
            touch.jump = true;
          }}
          off={() => {
            touch.jump = false;
          }}
        />
      </div>
    </div>
  );
}
