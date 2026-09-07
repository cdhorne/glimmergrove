import { Sparkles, Sword, ChevronsUp, FlaskConical, Hand } from "lucide-react";
import { touch } from "@/game/input";
import { cn } from "@/lib/utils";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";

const STICK_R = 64;

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
  const [lit, setLit] = useState(false);
  function down(e: PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setLit(true);
    on();
  }
  function up(e: PointerEvent) {
    e.preventDefault();
    setLit(false);
    off();
  }
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex items-center justify-center rounded-full border text-fg backdrop-blur-sm select-none transition-colors",
        lit ? "border-primary bg-primary/35" : "border-border bg-bg/70",
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

function Stick() {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0, active: false });

  function apply(clientX: number, clientY: number) {
    const o = origin.current;
    if (!o) return;
    const dx = clientX - o.x;
    const dy = clientY - o.y;
    const mag = Math.hypot(dx, dy);
    const cap = Math.min(mag, STICK_R);
    const nx = mag > 0 ? (dx / mag) * cap : 0;
    const ny = mag > 0 ? (dy / mag) * cap : 0;
    touch.moveX = nx / STICK_R;
    touch.moveY = ny / STICK_R;
    touch.down = touch.moveY > 0.55;
    setKnob({ x: nx, y: ny, active: true });
  }

  function down(e: PointerEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    origin.current = { x: e.clientX, y: e.clientY };
    apply(e.clientX, e.clientY);
  }
  function move(e: PointerEvent) {
    if (!origin.current) return;
    apply(e.clientX, e.clientY);
  }
  function up(e: PointerEvent) {
    e.preventDefault();
    origin.current = null;
    touch.moveX = 0;
    touch.moveY = 0;
    touch.down = false;
    setKnob({ x: 0, y: 0, active: false });
  }

  return (
    <div
      className="relative h-full w-full touch-none"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Move"
    >
      <div className="pointer-events-none absolute bottom-3 left-3 size-32 rounded-full border border-border bg-bg/35">
        <div
          className={cn(
            "absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-bg/80",
            knob.active && "border-primary bg-primary/30",
          )}
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
    </div>
  );
}

export function TouchControls() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 [@media(hover:hover)_and_(pointer:fine)]:hidden">
      <div className="pointer-events-auto absolute bottom-0 left-0 top-[38%] w-[48%] pl-[max(0.5rem,env(safe-area-inset-left))] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Stick />
      </div>
      <div className="pointer-events-auto absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.5rem,env(safe-area-inset-right))] flex items-end gap-2">
        <div className="mb-3 flex flex-col gap-2">
          <Hold
            label="Talk"
            className="size-11"
            icon={<Hand className="size-4" />}
            on={() => {
              touch.interact = true;
            }}
            off={() => {
              touch.interact = false;
            }}
          />
          <Hold
            label="Potion"
            className="size-11"
            icon={<FlaskConical className="size-4" />}
            on={() => {
              touch.potion = true;
            }}
            off={() => {
              touch.potion = false;
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
        </div>
        <Hold
          label="Attack"
          className="size-[4.25rem]"
          icon={<Sword className="size-7" />}
          on={() => {
            touch.attack = true;
          }}
          off={() => {
            touch.attack = false;
          }}
        />
        <Hold
          label="Jump"
          className="size-[5rem]"
          icon={<ChevronsUp className="size-8" />}
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
