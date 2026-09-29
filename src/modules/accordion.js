// FAQ accordion — one open at a time; height animates via CSS grid rows.

export function initAccordion() {
  const root = document.querySelector("[data-accordion]");
  if (!root) return;
  const items = [...root.querySelectorAll(".acc")];
  items.forEach((item) => {
    const btn = item.querySelector(".acc__btn");
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      items.forEach((other) => {
        const b = other.querySelector(".acc__btn");
        const isThis = other === item;
        b.setAttribute("aria-expanded", String(isThis && open));
        other.classList.toggle("is-open", isThis && open);
      });
      setTimeout(() => window.__skRefresh?.(), 850);
    });
  });
}
