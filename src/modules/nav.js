// Navigation theme + state, fullscreen menu, section indicator, progress bar,
// mobile dock. All driven by IntersectionObserver / one rAF-throttled scroll.

export function initNav() {
  const nav = document.querySelector("[data-nav]");
  const links = [...nav.querySelectorAll(".nav__links a")];
  const progress = document.querySelector(".progress span");
  const dock = document.querySelector("[data-dock]");
  const indicator = document.querySelector(".indicator");
  const contact = document.getElementById("contact");
  const themed = [...document.querySelectorAll("[data-theme]")];
  const indexed = [...document.querySelectorAll("[data-index]")];

  // Scroll-derived state (one listener, rAF throttled)
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
      nav.classList.toggle("is-scrolled", y > 40);
      indicator.classList.toggle("is-visible", y > window.innerHeight * 0.6);
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Nav colour follows whatever section sits under it.
  const navBand = () => `-${Math.round(nav.offsetHeight / 2)}px 0px -${window.innerHeight - Math.round(nav.offsetHeight / 2) - 1}px 0px`;
  let navIO;
  const watchNav = () => {
    navIO?.disconnect();
    navIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) nav.classList.toggle("is-light", en.target.dataset.theme === "light");
      });
    }, { rootMargin: navBand() });
    themed.forEach((s) => navIO.observe(s));
  };
  watchNav();
  window.addEventListener("resize", debounce(watchNav, 200));

  // Section indicator + active nav link (band across the viewport centre).
  const numEl = indicator.querySelector(".indicator__num");
  const labelEl = indicator.querySelector(".indicator__label");
  let current = "";
  const roll = (host, text) => {
    const old = host.querySelector("span:not(.is-out)");
    if (old && old.textContent === text) return;
    const next = document.createElement("span");
    next.textContent = text;
    next.className = "is-pre";
    host.appendChild(next);
    if (old) { old.className = "is-out"; setTimeout(() => old.remove(), 900); }
    requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove("is-pre")));
  };
  const secIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const { index, label } = en.target.dataset;
      const key = index + label;
      if (key === current) return;
      current = key;
      roll(numEl, index);
      roll(labelEl, label);
      const id = en.target.id;
      links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
    });
  }, { rootMargin: "-50% 0px -50% 0px" });
  indexed.forEach((s) => secIO.observe(s));

  // Mobile dock: appear after the hero, step aside when the form is on screen.
  let pastHero = false, atContact = false;
  const syncDock = () => dock.classList.toggle("is-visible", pastHero && !atContact && !document.body.classList.contains("menu-is-open"));
  new IntersectionObserver(([en]) => { pastHero = !en.isIntersecting; syncDock(); }, { rootMargin: "-40% 0px 0px 0px" })
    .observe(document.getElementById("top"));
  new IntersectionObserver(([en]) => { atContact = en.isIntersecting; syncDock(); }, { rootMargin: "0px 0px -30% 0px" })
    .observe(contact);

  initMenu(nav, syncDock);
}

function initMenu(nav, syncDock) {
  const toggle = nav.querySelector(".nav__toggle");
  const label = toggle.querySelector(".nav__toggle-text");
  const menu = document.getElementById("menu");
  let open = false;
  let hideTimer;

  const setOpen = (value, { focusToggle = true } = {}) => {
    open = value;
    clearTimeout(hideTimer);
    toggle.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Close" : "Menu";
    nav.classList.toggle("menu-open", open);
    document.body.classList.toggle("menu-is-open", open);
    window.__skLenis?.[open ? "stop" : "start"]();
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add("is-open")));
      setTimeout(() => menu.querySelector("a")?.focus({ preventScroll: true }), 350);
    } else {
      menu.classList.remove("is-open");
      hideTimer = setTimeout(() => { menu.hidden = true; }, 1000);
      if (focusToggle) toggle.focus({ preventScroll: true });
    }
    syncDock();
  };

  toggle.addEventListener("click", () => setOpen(!open));
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a[href^='#']")) setOpen(false, { focusToggle: false });
  });
  document.addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Tab") trapFocus(e, [toggle, ...menu.querySelectorAll("a")]);
  });
  window.matchMedia("(min-width: 1024px)").addEventListener("change", (mq) => { if (mq.matches && open) setOpen(false); });
}

export function trapFocus(e, items) {
  const list = items.filter((el) => el.offsetParent !== null || el === document.activeElement);
  if (!list.length) return;
  const first = list[0], last = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  else if (!list.includes(document.activeElement)) { e.preventDefault(); first.focus(); }
}

export function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
