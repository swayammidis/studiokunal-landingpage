// Contextual cursor + magnetic buttons. Desktop fine pointers only.

export function initCursor() {
  const root = document.documentElement;
  if (!root.classList.contains("fine-pointer")) return;
  const cursor = document.querySelector(".cursor");
  const label = cursor.querySelector(".cursor__label");
  const smooth = root.classList.contains("motion");
  root.classList.add("has-cursor");

  let x = -100, y = -100, cx = x, cy = y;
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX; y = e.clientY;
    cursor.classList.remove("is-hidden");
  }, { passive: true });
  document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) cursor.classList.add("is-hidden"); });

  const loop = () => {
    cx += (x - cx) * (smooth ? 0.2 : 1);
    cy += (y - cy) * (smooth ? 0.2 : 1);
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();

  document.addEventListener("pointerover", (e) => {
    const ctx = e.target.closest("[data-cursor]");
    const link = e.target.closest("a, button, label, [role=button]");
    if (ctx) {
      label.textContent = ctx.dataset.cursor;
      cursor.classList.add("has-label");
      cursor.classList.remove("is-link");
    } else {
      cursor.classList.remove("has-label");
      cursor.classList.toggle("is-link", !!link);
    }
  });

  if (!smooth) return;
  document.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate3d(${dx * 0.22}px, ${dy * 0.32}px, 0)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
}
