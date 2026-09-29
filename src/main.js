import "./styles/base.css";
import "./styles/components.css";
import "./styles/sections.css";

import { initTracking } from "./modules/track.js";
import { initNav } from "./modules/nav.js";
import { initReveals } from "./modules/reveal.js";
import { initModal } from "./modules/modal.js";
import { initSlider } from "./modules/slider.js";
import { initAccordion } from "./modules/accordion.js";
import { initForm } from "./modules/form.js";
import { initCursor } from "./modules/cursor.js";
import { initWorkScroller } from "./modules/work.js";

const motion = document.documentElement.classList.contains("motion");
if (motion) window.__skMotion = true;

initTracking();
initNav();
initReveals();
initModal();
initSlider();
initAccordion();
initForm();
initWorkScroller();
initCursor();

// Heavier scroll choreography (Lenis + GSAP) loads as a separate chunk,
// and never for visitors who prefer reduced motion.
if (motion) {
  import("./modules/motion.js")
    .then((m) => m.initMotion())
    .catch(() => document.documentElement.classList.remove("motion"));
}
