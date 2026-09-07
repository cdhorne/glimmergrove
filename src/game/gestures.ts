/**
 * Kill browser gestures on the play surface.
 * touch-action CSS is not enough on iOS Safari: pull-to-refresh,
 * pinch-zoom, and two-finger scroll still fire unless touchmove is
 * canceled with { passive: false }.
 *
 * Edge-swipe Back cannot be fully disabled in Safari tabs. Standalone
 * PWA (Add to Home Screen) is the reliable fix for that one.
 */
export function bindPlayGestures(root: HTMLElement) {
  const opts: AddEventListenerOptions = { passive: false, capture: true };

  function cancel(e: Event) {
    e.preventDefault();
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length >= 2) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
  }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length >= 2) e.preventDefault();
  }

  root.addEventListener("touchstart", onTouchStart, opts);
  root.addEventListener("touchmove", onTouchMove, opts);
  root.addEventListener("touchend", cancel, opts);
  root.addEventListener("gesturestart", cancel, opts);
  root.addEventListener("gesturechange", cancel, opts);
  root.addEventListener("gestureend", cancel, opts);
  root.addEventListener("dblclick", cancel, opts);

  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  document.documentElement.classList.add("gg-play-lock");

  return () => {
    root.removeEventListener("touchstart", onTouchStart, opts);
    root.removeEventListener("touchmove", onTouchMove, opts);
    root.removeEventListener("touchend", cancel, opts);
    root.removeEventListener("gesturestart", cancel, opts);
    root.removeEventListener("gesturechange", cancel, opts);
    root.removeEventListener("gestureend", cancel, opts);
    root.removeEventListener("dblclick", cancel, opts);
    document.body.style.overflow = prevOverflow;
    document.documentElement.classList.remove("gg-play-lock");
  };
}
