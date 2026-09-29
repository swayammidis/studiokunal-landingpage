// Portfolio progress for the native (swipe / reduced-motion) scroller.
// When the desktop pinned layout is active, motion.js owns the progress.

export function initWorkScroller() {
  const list = document.querySelector("[data-work-list]");
  if (!list) return;
  const work = list.closest(".work");
  const bar = work.querySelector("[data-work-bar]");
  const count = work.querySelector("[data-work-count]");
  const cards = list.querySelectorAll(".work-card").length;
  let raf = 0;
  list.addEventListener("scroll", () => {
    if (work.classList.contains("is-pinned") || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const max = list.scrollWidth - list.clientWidth;
      const p = max > 0 ? list.scrollLeft / max : 0;
      bar.style.setProperty("--p", Math.max(1 / cards, p).toFixed(3));
      count.textContent = String(Math.min(cards, Math.floor(p * cards) + 1)).padStart(2, "0");
    });
  }, { passive: true });
}
