import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

const images = JSON.parse(fs.readFileSync(path.resolve("src/images.json"), "utf8"));

// Expands <pic src="home-02" alt="…" sizes="…" class="…" eager /> into a
// responsive <picture> (AVIF + WebP) with intrinsic width/height so the page
// ships complete, crawlable markup and never shifts layout.
function picture() {
  const attr = (tag, name) => {
    const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
    return m ? m[1] : null;
  };
  return {
    name: "sk-picture",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace(/<pic\b[^>]*\/>/g, (tag) => {
          const id = attr(tag, "src");
          const meta = images[id];
          if (!meta) throw new Error(`Unknown image id "${id}"`);
          const alt = attr(tag, "alt") ?? "";
          const sizes = attr(tag, "sizes") ?? "100vw";
          const cls = attr(tag, "class");
          const eager = /\seager\b/.test(tag);
          const set = (ext) => meta.widths.map((w) => `img/${id}-${w}.${ext} ${w}w`).join(", ");
          const fallback = meta.widths.find((w) => w >= 1000) ?? meta.widths.at(-1);
          const h = Math.round((meta.h / meta.w) * 1000);
          return `<picture${cls ? ` class="${cls}"` : ""}>` +
            `<source type="image/avif" srcset="${set("avif")}" sizes="${sizes}">` +
            `<source type="image/webp" srcset="${set("webp")}" sizes="${sizes}">` +
            `<img src="img/${id}-${fallback}.webp" width="1000" height="${h}" alt="${alt}" ` +
            (eager ? `fetchpriority="high" decoding="async"` : `loading="lazy" decoding="async"`) +
            `></picture>`;
        });
      },
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [picture()],
  build: { target: "es2019", cssCodeSplit: false, assetsInlineLimit: 0 },
});
