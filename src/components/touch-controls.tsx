import { Sparkles, Sword, ChevronsUp, CircleDot, Hand } from "lucide-react";
import { getDevice, subscribeDevice, touch } from "@/game/input";
import { computeStick, STICK_R } from "@/game/feel";
import {
  mapFlick,
  resolveHoldRelease,
  resolveVerbs,
  shouldShowOverlay,
  type MoveStyle,
} from "@/game/scheme";
import { cn } from "@/lib/utils";
import { useGameUI } from "@/game/store";
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent, type ReactNode } from "react";

function useDevice() {
  return useSyncExternalStore(subscribeDevice, getDevice, getDevice);
}

function Hold({
  className,
  label,
  icon,
  onDown,
  onUp,
}: {
  className?: string;
  label: string;
  icon: ReactNode;
  onDown: () => void;
  onUp: () => void;
}) {
  const [lit, setLit] = useState(false);
  function down(e: PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setLit(true);
    onDown();
  }
  function up(e: PointerEvent) {
    e.preventDefault();
    setLit(false);
    onUp();
  }
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex items-center justify-center rounded-full border text-fg backdrop-blur-sm select-none transition-colors",
        lit ? "border-primary bg-primary/35" : "border-border bg-bg/55",
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

function Stick({ style }: { style: MoveStyle }) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0, active: false, ox: 0, oy: 0 });

  function apply(clientX: number, clientY: number) {
    const o = origin.current;
    if (!o) return;
    const s = computeStick(clientX - o.x, clientY - o.y, STICK_R);
    touch.moveX = s.moveX;
    touch.moveY = s.moveY;
    touch.down = s.down;
    setKnob({ x: s.nx, y: s.ny, active: true, ox: o.x, oy: o.y });
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
    setKnob({ x: 0, y: 0, active: false, ox: 0, oy: 0 });
  }

  const ghost = style === "ghost" || style === "flick";
  const wellVisible = style === "well" || knob.active;

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
      {wellVisible ? (
        <div
          className={cn(
            "pointer-events-none absolute size-28 rounded-full border border-border bg-bg/25 landscape:size-20",
            ghost && knob.active ? "landscape:bg-bg/20" : "bottom-2 left-2 landscape:bg-bg/15",
          )}
          style={
            ghost && knob.active
              ? { left: knob.ox - 56, top: knob.oy - 56, position: "fixed" }
              : undefined
          }
        >
          <div
            className={cn(
              "absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-bg/70 landscape:size-9",
              knob.active && "border-primary bg-primary/30",
            )}
            style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function AttackHold({ canSkill }: { canSkill: boolean }) {
  const start = useRef(0);
  function down() {
    start.current = performance.now();
    touch.attack = true;
    touch.skill = false;
  }
  function up() {
    const kind = resolveHoldRelease(performance.now() - start.current);
    touch.attack = kind === "attack";
    touch.skill = kind === "skill" && canSkill;
    queueMicrotask(() => {
      touch.attack = false;
      touch.skill = false;
    });
  }
  return (
    <Hold
      label={canSkill ? "Attack or skill" : "Attack"}
      className="size-16 min-h-[44px] min-w-[44px] landscape:size-14"
      icon={<Sword className="size-6 landscape:size-5" />}
      onDown={down}
      onUp={up}
    />
  );
}

export function TouchControls() {
  const device = useDevice();
  const hud = useGameUI((s) => s.hud);
  const moveStyle = useGameUI((s) => s.moveStyle);
  const [coarse, setCoarse] = useState(true);
  const verbs = resolveVerbs(hud);
  const flickStart = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setCoarse(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (!shouldShowOverlay(device, coarse)) return null;

  function flickDown(e: PointerEvent) {
    flickStart.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  }
  function flickUp(e: PointerEvent) {
    const s = flickStart.current;
    flickStart.current = null;
    if (moveStyle !== "flick" || !s) return;
    const result = mapFlick(e.clientX - s.x, e.clientY - s.y, performance.now() - s.t);
    if (!result) return;
    if (result.justJump) {
      touch.jump = true;
      queueMicrotask(() => {
        touch.jump = false;
      });
    }
    if (result.downHeld) {
      touch.down = true;
      queueMicrotask(() => {
        touch.down = false;
      });
    }
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="pointer-events-auto absolute bottom-0 left-0 h-40 w-[42%] pl-[max(0.4rem,env(safe-area-inset-left))] pb-[max(0.4rem,env(safe-area-inset-bottom))] landscape:h-28 landscape:w-[32%]">
        <Stick style={moveStyle} />
      </div>
      <div
        className="pointer-events-auto absolute bottom-[max(0.5rem,env(safe-area-inset-bottom))] right-[max(0.4rem,env(safe-area-inset-right))] flex items-end gap-2 landscape:gap-1.5"
        onPointerDown={moveStyle === "flick" ? flickDown : undefined}
        onPointerUp={moveStyle === "flick" ? flickUp : undefined}
      >
        <div className="mb-2 flex flex-col gap-1.5 landscape:mb-1">
          {verbs.interact ? (
            <Hold
              label="Interact"
              className="size-11 min-h-[44px] min-w-[44px] landscape:size-11"
              icon={<Hand className="size-4" />}
              onDown={() => {
                touch.interact = true;
              }}
              onUp={() => {
                touch.interact = false;
              }}
            />
          ) : null}
          {verbs.use ? (
            <Hold
              label="Use item"
              className="size-11 min-h-[44px] min-w-[44px] landscape:size-11"
              icon={<CircleDot className="size-4" />}
              onDown={() => {
                touch.use = true;
              }}
              onUp={() => {
                touch.use = false;
              }}
            />
          ) : null}
          {verbs.skill ? (
            <Hold
              label="Skill"
              className="size-11 min-h-[44px] min-w-[44px] landscape:size-11"
              icon={<Sparkles className="size-4" />}
              onDown={() => {
                touch.skill = true;
              }}
              onUp={() => {
                touch.skill = false;
              }}
            />
          ) : null}
        </div>
        <AttackHold canSkill={verbs.skill} />
        <Hold
          label="Jump"
          className="size-[4.5rem] min-h-[44px] min-w-[44px] landscape:size-16"
          icon={<ChevronsUp className="size-7 landscape:size-6" />}
          onDown={() => {
            touch.jump = true;
          }}
          onUp={() => {
            touch.jump = false;
          }}
        />
      </div>
    </div>
  );
}
