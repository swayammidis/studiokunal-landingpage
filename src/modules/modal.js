import images from "../images.json";
import { track } from "./track.js";
import { trapFocus } from "./nav.js";

const BASE = import.meta.env.BASE_URL;
const SITE = "https://studiokunalphotography.com/";

const galleryIds = (slug) => Object.keys(images).filter((k) => k.startsWith(`gallery-${slug}-`)).sort();

function pictureHTML(id, sizes, { eager = false, alt = "" } = {}) {
  const m = images[id];
  const set = (ext) => m.widths.map((w) => `${BASE}img/${id}-${w}.${ext} ${w}w`).join(", ");
  return `<picture><source type="image/avif" srcset="${set("avif")}" sizes="${sizes}">` +
    `<source type="image/webp" srcset="${set("webp")}" sizes="${sizes}">` +
    `<img src="${BASE}img/${id}-${m.widths[0]}.webp" width="${m.w}" height="${m.h}" alt="${alt}" ${eager ? "" : 'loading="lazy"'} decoding="async"></picture>`;
}

export function initModal() {
  const modal = document.getElementById("modal");
  const body = modal.querySelector("[data-modal-body]");
  const title = modal.querySelector("#modal-title");
  const count = modal.querySelector("[data-modal-count]");
  let lastFocus = null;
  let keyHandler = null;
  let closeTimer;

  const open = (heading) => {
    clearTimeout(closeTimer);
    lastFocus = document.activeElement;
    title.textContent = heading;
    modal.hidden = false;
    window.__skLenis?.stop();
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add("is-open")));
    setTimeout(() => modal.querySelector(".modal__close").focus({ preventScroll: true }), 400);
  };

  const close = () => {
    modal.classList.remove("is-open");
    window.__skLenis?.start();
    document.documentElement.style.overflow = "";
    keyHandler = null;
    closeTimer = setTimeout(() => { modal.hidden = true; body.innerHTML = ""; count.textContent = ""; }, 900);
    lastFocus?.focus({ preventScroll: true });
  };

  modal.addEventListener("click", (e) => { if (e.target.closest("[data-modal-close]")) close(); });
  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") return close();
    if (e.key === "Tab") return trapFocus(e, [...modal.querySelectorAll("button, a, iframe")]);
    keyHandler?.(e);
  });

  // ---- Project gallery ----
  const openGallery = (slug, heading) => {
    const ids = galleryIds(slug);
    if (!ids.length) { window.open(SITE + slug, "_blank", "noopener"); return; }
    body.innerHTML = `
      <div class="lb">
        <button class="lb__nav lb__nav--prev" type="button" aria-label="Previous photograph">←</button>
        <div class="lb__stage" aria-live="polite">${ids.map((id, i) =>
          pictureHTML(id, "90vw", { eager: i < 2, alt: `${heading} — photograph ${i + 1} of ${ids.length}` })).join("")}</div>
        <button class="lb__nav lb__nav--next" type="button" aria-label="Next photograph">→</button>
      </div>
      <div class="lb__foot">
        <div class="lb__thumbs">${ids.map((id, i) =>
          `<button type="button" aria-label="Show photograph ${i + 1}"><img src="${BASE}img/${id}-${images[id].widths[0]}.webp" alt="" loading="lazy"></button>`).join("")}</div>
        <a class="link-arrow link-arrow--light lb__more" href="${SITE}${slug}" target="_blank" rel="noopener">View the full gallery ↗</a>
      </div>`;
    const pics = [...body.querySelectorAll(".lb__stage picture")];
    const thumbs = [...body.querySelectorAll(".lb__thumbs button")];
    let i = 0;
    const show = (n) => {
      i = (n + pics.length) % pics.length;
      pics.forEach((p, k) => {
        p.classList.toggle("is-active", k === i);
        p.setAttribute("aria-hidden", String(k !== i));
      });
      thumbs.forEach((t, k) => t.setAttribute("aria-current", String(k === i)));
      thumbs[i].scrollIntoView({ block: "nearest", inline: "center" });
      count.textContent = `${String(i + 1).padStart(2, "0")} / ${String(pics.length).padStart(2, "0")}`;
      // warm the next image
      pics[(i + 1) % pics.length].querySelector("img").loading = "eager";
    };
    body.querySelector(".lb__nav--prev").addEventListener("click", () => show(i - 1));
    body.querySelector(".lb__nav--next").addEventListener("click", () => show(i + 1));
    thumbs.forEach((t, k) => t.addEventListener("click", () => show(k)));
    // swipe
    let sx = null;
    const stage = body.querySelector(".lb__stage");
    stage.addEventListener("pointerdown", (e) => { sx = e.clientX; });
    stage.addEventListener("pointerup", (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
    });
    keyHandler = (e) => {
      if (e.key === "ArrowRight") show(i + 1);
      if (e.key === "ArrowLeft") show(i - 1);
    };
    show(0);
    open(heading);
    track("portfolio_open", { project: slug, project_title: heading });
  };

  // ---- Film ----
  const openFilm = (id, heading) => {
    body.innerHTML = `
      <div class="film-player"><div class="film-player__frame">
        <iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
          title="${heading.replace(/"/g, "&quot;")}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
      </div></div>`;
    open(heading);
    track("film_play", { video_id: id, film_title: heading });
  };

  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-gallery]");
    if (g) { e.preventDefault(); openGallery(g.dataset.gallery, g.dataset.title); return; }
    const v = e.target.closest("[data-video]");
    if (v) { e.preventDefault(); openFilm(v.dataset.video, v.dataset.title); }
  });
}
