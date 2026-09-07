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
        "flex items-center justify-center rounded-full border text-fg backdrop-blur-sm select-none transition-colors touch-none",
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
  const [knob, setKnob] = useState({ x: 0, y: 0, active: false, ox: 72, oy: 72 });

  function apply(clientX: number, clientY: number) {
    const o = origin.current;
    if (!o) return;
    const dx = clientX - o.x;
    const dy = clientY - o.y;
    const mag = Math.hypot(dx, dy);
    const cap = Math.min(mag, STICK_R);
    const nx = mag > 0 ? (dx / mag) * cap : 0;
    const ny = mag > 0 ? (dy / mag) * cap : 0;
    const hx = nx / STICK_R;
    const hy = ny / STICK_R;
    touch.moveX = Math.abs(hx) < 0.12 ? 0 : hx;
    touch.moveY = hy;
    touch.down = hy > 0.62;
    setKnob((k) => ({ ...k, x: nx, y: ny, active: true }));
  }

  function down(e: PointerEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    origin.current = { x: e.clientX, y: e.clientY };
    setKnob({
      x: 0,
      y: 0,
      active: true,
      ox: e.clientX - rect.left,
      oy: e.clientY - rect.top,
    });
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
    setKnob({ x: 0, y: 0, active: false, ox: 72, oy: 72 });
  }

  return (
    <div
      className="relative h-40 w-[46vw] max-w-72 touch-none"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Move"
    >
      <div
        className="pointer-events-none absolute size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-bg/35"
        style={{ left: knob.ox, top: knob.oy }}
      />
      <div
        className={cn(
          "pointer-events-none absolute size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-bg/80",
          knob.active && "border-primary bg-primary/30",
        )}
        style={{ left: knob.ox + knob.x, top: knob.oy + knob.y }}
      />
    </div>
  );
}

export function TouchControls() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 [@media(hover:hover)_and_(pointer:fine)]:hidden">
      <div className="pointer-events-auto">
        <Stick />
      </div>
      <div className="pointer-events-auto relative mb-1 mr-1 h-36 w-40">
        <Hold
          label="Talk"
          className="absolute left-0 top-0 size-10"
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
          className="absolute left-11 top-0 size-10"
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
          className="absolute left-0 top-12 size-12"
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
          className="absolute left-12 top-[2.75rem] size-[4.25rem]"
          icon={<Sword className="size-6" />}
          on={() => {
            touch.attack = true;
          }}
          off={() => {
            touch.attack = false;
          }}
        />
        <Hold
          label="Jump"
          className="absolute bottom-0 right-0 size-[4.75rem]"
          icon={<ChevronsUp className="size-7" />}
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
