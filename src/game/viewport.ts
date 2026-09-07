import { visualBox } from "./feel";

type Phaserish = { scale?: { refresh?: () => void } };

/**
 * Pin a shell to the *visible* viewport.
 * Safari shrinks visualViewport when the tab bar opens and offsets it
 * when the bar is at the top. layout viewport (100dvh) does not move.
 */
export function bindVisualViewport(el: HTMLElement, game: { current: Phaserish | null }) {
  const vv = window.visualViewport;

  function apply() {
    const box = visualBox(vv, { innerWidth: window.innerWidth, innerHeight: window.innerHeight });
    el.style.position = "fixed";
    el.style.left = `${box.x}px`;
    el.style.top = `${box.y}px`;
    el.style.width = `${box.w}px`;
    el.style.height = `${box.h}px`;
    el.style.right = "auto";
    el.style.bottom = "auto";
    el.dataset.orientation = box.orientation;
    game.current?.scale?.refresh?.();
  }

  apply();
  const onOrient = () => {
    window.setTimeout(apply, 80);
    window.setTimeout(apply, 320);
  };
  vv?.addEventListener("resize", apply);
  vv?.addEventListener("scroll", apply);
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", onOrient);

  return () => {
    vv?.removeEventListener("resize", apply);
    vv?.removeEventListener("scroll", apply);
    window.removeEventListener("resize", apply);
    window.removeEventListener("orientationchange", onOrient);
  };
}

/** Best-effort. Safari tabs ignore this; some Android browsers and standalone PWAs honor it. */
export function requestLandscape() {
  const orient = screen.orientation as ScreenOrientation & { lock?: (m: string) => Promise<void> };
  void orient?.lock?.("landscape").catch(() => undefined);
}
