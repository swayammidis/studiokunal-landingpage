// Testimonial slider: centred active slide, neighbours peeking, arrows,
// drag/swipe, keyboard, progress, and "Read more" expansion.

export function initSlider() {
  const root = document.querySelector("[data-slider]");
  if (!root) return;
  const viewport = root.querySelector(".slider__viewport");
  const track = root.querySelector("[data-slider-track]");
  const slides = [...track.children];
  const countEl = root.querySelector("[data-slider-count]");
  const bar = root.querySelector("[data-slider-bar]");
  let index = 0;
  let base = 0;

  const offsetFor = (i) => {
    const s = slides[i];
    return viewport.clientWidth / 2 - (s.offsetLeft + s.offsetWidth / 2);
  };

  const go = (i, { focus = false } = {}) => {
    index = Math.max(0, Math.min(slides.length - 1, i));
    base = offsetFor(index);
    track.style.transform = `translate3d(${base}px,0,0)`;
    slides.forEach((s, k) => {
      const active = k === index;
      s.classList.toggle("is-active", active);
      s.setAttribute("aria-hidden", String(!active));
      s.querySelectorAll("button, a").forEach((el) => { el.tabIndex = active ? 0 : -1; });
    });
    countEl.textContent = String(index + 1).padStart(2, "0");
    bar.style.setProperty("--p", ((index + 1) / slides.length).toFixed(3));
    if (focus) slides[index].querySelector(".review__toggle")?.focus({ preventScroll: true });
  };

  root.querySelector("[data-slider-prev]").addEventListener("click", () => go(index - 1));
  root.querySelector("[data-slider-next]").addEventListener("click", () => go(index + 1));
  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") go(index + 1);
    if (e.key === "ArrowLeft") go(index - 1);
  });

  // Click a neighbour to bring it forward
  track.addEventListener("click", (e) => {
    if (moved) return;
    const slide = e.target.closest(".review");
    if (slide && !slide.classList.contains("is-active")) go(slides.indexOf(slide));
  });

  // Drag / swipe
  let startX = 0, startY = 0, dx = 0, dragging = false, moved = false, axis = null;
  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest(".review__toggle")) return;
    dragging = true; moved = false; axis = null; dx = 0;
    startX = e.clientX; startY = e.clientY;
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const mx = e.clientX - startX, my = e.clientY - startY;
    if (!axis && (Math.abs(mx) > 6 || Math.abs(my) > 6)) axis = Math.abs(mx) > Math.abs(my) ? "x" : "y";
    if (axis !== "x") return;
    moved = true; dx = mx;
    track.classList.add("is-dragging");
    viewport.classList.add("is-dragging");
    track.style.transform = `translate3d(${base + dx * 0.9}px,0,0)`;
  }, { passive: true });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");
    viewport.classList.remove("is-dragging");
    if (axis === "x" && Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1)); else go(index);
    setTimeout(() => { moved = false; }, 0);
  };
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);

  // Read more
  root.querySelectorAll(".review__toggle").forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Read less" : "Read more";
      panel.classList.toggle("is-open", open);
      setTimeout(() => window.__skRefresh?.(), 950);
    });
  });

  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => go(index), 150); });
  go(0);
}
