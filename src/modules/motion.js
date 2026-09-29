// Scroll choreography: Lenis inertial scroll + GSAP ScrollTrigger.
// Loaded on demand (dynamic import) and only when reduced motion is not
// requested. Touch devices keep native scrolling (Lenis syncTouch is off).

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const expoInOut = (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2);
const pad = (n) => String(n).padStart(2, "0");

export function initMotion() {
  const lenis = new Lenis({
    duration: 1.25,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.95,
  });
  window.__skLenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__skRefresh = () => ScrollTrigger.refresh();

  initAnchors(lenis);
  initIntroWords();

  // Hero: image drifts slower than the page (all sizes; transform only).
  gsap.to("[data-hero-media]", {
    yPercent: 16, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  const mm = gsap.matchMedia();
  mm.add("(min-width: 900px)", () => {
    gsap.to(".hero__inner", {
      yPercent: -8, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    initParallax();
    initGlobal();
    const cleanupWork = initWork();
    initFilms();
    initInvest();
    return () => cleanupWork();
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

function initAnchors(lenis) {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    const hash = a.getAttribute("href");
    const target = hash.length > 1 && document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(hash === "#top" ? 0 : target, { duration: 1.8, easing: expoInOut });
    history.replaceState(null, "", hash);
    // Move focus for keyboard / screen-reader users without a visual jump.
    setTimeout(() => {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }, 1850);
  });
}

// Statement words light up as they pass through the viewport.
function initIntroWords() {
  const el = document.querySelector("[data-words]");
  if (!el) return;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement("span");
          s.className = "w";
          s.textContent = part;
          frag.appendChild(s);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) walk(child);
    });
  };
  walk(el);
  gsap.fromTo(el.querySelectorAll(".w"), { opacity: 0.14 }, {
    opacity: 1, stagger: 0.06, ease: "none",
    scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 42%", scrub: true },
  });
}

function initParallax() {
  document.querySelectorAll("[data-speed]").forEach((el) => {
    const speed = parseFloat(el.dataset.speed);
    const inHero = el.closest(".hero");
    gsap.to(el, {
      yPercent: speed * 100, ease: "none",
      scrollTrigger: inHero
        ? { trigger: inHero, start: "top top", end: "bottom top", scrub: true }
        : { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
  gsap.utils.toArray(".intro__strip > div").forEach((el, i) => {
    gsap.to(el, {
      yPercent: [-10, 6, -18][i] ?? 0, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
}

// North America → India → worldwide: the photograph opens up while the route draws.
function initGlobal() {
  const section = document.querySelector(".global");
  if (!section) return;
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 1 },
  });
  tl.fromTo(".global__media", { clipPath: "inset(26% 34% 26% 34%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power2.inOut" }, 0)
    .fromTo(".global__media picture", { scale: 1.4 }, { scale: 1.04, duration: 1.5 }, 0)
    .fromTo(".global__shade", { opacity: 0.2 }, { opacity: 1, duration: 1 }, 0.3)
    .from(".global__path--ghost", { opacity: 0, duration: 0.2 }, 0.45)
    .fromTo(".global__path:not(.global__path--ghost)", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9 }, 0.5)
    .from(".global__place--na", { opacity: 0, y: 24, duration: 0.25 }, 0.5)
    .from(".global__place--ww", { opacity: 0, y: 24, duration: 0.25 }, 0.9)
    .from(".global__place--in", { opacity: 0, y: 24, duration: 0.25 }, 1.3)
    .from(".global__title > span", { opacity: 0, yPercent: 60, stagger: 0.08, duration: 0.35 }, 1.0)
    .from([".global__fact", ".global__copy .btn"], { opacity: 0, y: 24, stagger: 0.1, duration: 0.3 }, 1.35)
    .to({}, { duration: 0.35 });
}

// Portfolio: vertical scroll drives a horizontal journey through the stories.
function initWork() {
  const work = document.querySelector(".work");
  if (!work) return () => {};
  work.classList.add("is-pinned");
  const rail = work.querySelector("[data-work-rail]");
  const bar = work.querySelector("[data-work-bar]");
  const count = work.querySelector("[data-work-count]");
  rail.querySelectorAll("img").forEach((img) => { img.loading = "eager"; });

  const dist = () => rail.scrollWidth - window.innerWidth;
  const tween = gsap.to(rail, {
    x: () => -dist(), ease: "none",
    scrollTrigger: {
      trigger: work.querySelector(".work__pin"),
      pin: true, start: "top top", end: () => `+=${dist()}`,
      scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: (self) => {
        bar.style.setProperty("--p", Math.max(0.125, self.progress).toFixed(3));
        count.textContent = pad(Math.min(8, Math.floor(self.progress * 8) + 1));
      },
    },
  });

  work.querySelectorAll(".work-card").forEach((card, i) => {
    const media = card.querySelector(".work-card__media");
    gsap.fromTo(media.querySelector("picture"), { xPercent: 5 }, {
      xPercent: -5, ease: "none",
      scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
    });
    if (i === 0) return;
    gsap.fromTo(media, { clipPath: i % 2 ? "inset(0% 0% 0% 100%)" : "inset(100% 0% 0% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", ease: "power1.out",
      scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 98%", end: "left 58%", scrub: true },
    });
  });

  return () => work.classList.remove("is-pinned");
}

function initFilms() {
  const wrap = document.querySelector(".films__strip-wrap");
  const strip = document.querySelector("[data-films-strip]");
  if (wrap && strip) {
    wrap.classList.add("is-driven");
    gsap.to(strip, {
      x: () => -(strip.scrollWidth - wrap.clientWidth), ease: "none",
      scrollTrigger: { trigger: wrap, start: "top 92%", end: "bottom 8%", scrub: 1, invalidateOnRefresh: true },
    });
  }
  gsap.fromTo("[data-film-parallax]", { yPercent: -5 }, {
    yPercent: 5, ease: "none",
    scrollTrigger: { trigger: ".film-feature", start: "top bottom", end: "bottom top", scrub: true },
  });
  return () => wrap?.classList.remove("is-driven");
}

function initInvest() {
  gsap.fromTo(".invest__main picture", { scale: 1.22 }, {
    scale: 1, ease: "none",
    scrollTrigger: { trigger: ".invest", start: "top bottom", end: "bottom bottom", scrub: true },
  });
  gsap.fromTo(".invest__small", { y: 120 }, {
    y: -80, ease: "none",
    scrollTrigger: { trigger: ".invest", start: "top bottom", end: "bottom top", scrub: true },
  });
}
