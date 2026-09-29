// One IntersectionObserver drives every CSS reveal (lines, split headings,
// fades, image masks). Elements get .is-in once and are then forgotten.

const SELECTOR = "[data-fade], [data-line], [data-reveal], .split";

export function initReveals() {
  if (!document.documentElement.classList.contains("motion")) return;
  const els = [...document.querySelectorAll(SELECTOR)].filter((el) => !el.closest(".hero"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0 });
  els.forEach((el) => io.observe(el));
}
