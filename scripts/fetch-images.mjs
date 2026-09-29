// Downloads the real Studio Kunal images (from the wfolio CDN listed in
// source-manifest.json) and writes responsive AVIF + WebP variants to public/img.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const man = JSON.parse(await fs.readFile(path.join(root, "scripts/source-manifest.json"), "utf8"));
const outDir = path.join(root, "public/img");
const cacheDir = path.join(root, "scripts/.cache");
await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(cacheDir, { recursive: true });

const SLUGS = [
  "aman-mrinal", "nooreen-jugraj", "deep-payal", "varinder-param-at-noor-mahal",
  "the-house-of-rituals-india", "the-fashion-vault",
  "akshita-rajat-a-lovestory-from-toronto-downtown", "raman-akash-love-straight-outta-panjab",
];
const GALLERY_COUNT = 10;

// id -> { img, widths }
const jobs = [];
const pad = (n) => String(n).padStart(2, "0");
man.home.forEach((img, i) => jobs.push({ id: `home-${pad(i + 1)}`, img, widths: [640, 1080, 1800] }));
man.portfolio.forEach((img, i) => jobs.push({ id: `work-${SLUGS[i]}`, img, widths: [480, 960, 1400] }));
man.films.forEach((img, i) => jobs.push({ id: `film-${pad(i + 1)}`, img, widths: [640, 1280] }));
man.testimonials.forEach((img, i) => jobs.push({ id: `review-${pad(i + 1)}`, img, widths: [480, 900] }));
jobs.push({ id: "contact", img: man.contact[0], widths: [640, 1200] });
jobs.push({ id: "investment", img: man.investment[0], widths: [640, 1200, 1800] });
for (const slug of SLUGS) {
  (man.proj[slug] || []).slice(0, GALLERY_COUNT).forEach((img, i) =>
    jobs.push({ id: `gallery-${slug}-${pad(i + 1)}`, img, widths: [640, 1600] }));
}

function pickSource(set, want) {
  const sizes = Object.keys(set).map(Number).sort((a, b) => a - b);
  return set[sizes.find((s) => s >= want) ?? sizes.at(-1)];
}

const meta = {};
async function run(job) {
  const maxW = Math.max(...job.widths);
  const src = pickSource(job.img.set, maxW);
  const cache = path.join(cacheDir, job.id + path.extname(new URL(src).pathname));
  let buf;
  try { buf = await fs.readFile(cache); } catch {
    const res = await fetch(src, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`${res.status} ${src}`);
    buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(cache, buf);
  }
  const { width, height } = await sharp(buf).metadata();
  const done = await fs.access(path.join(outDir, `${job.id}-${Math.min(maxW, width)}.avif`)).then(() => true, () => false);
  const widths = job.widths.filter((w) => w < width).concat(job.widths.some((w) => w >= width) ? [width] : []);
  const uniq = [...new Set(widths)];
  for (const w of done ? [] : uniq) {
    const base = path.join(outDir, `${job.id}-${w}`);
    const img = sharp(buf).resize({ width: w, withoutEnlargement: true });
    await img.clone().webp({ quality: 74 }).toFile(base + ".webp");
    await img.clone().avif({ quality: 52, effort: 4 }).toFile(base + ".avif");
  }
  meta[job.id] = { w: width, h: height, widths: uniq };
}

const queue = [...jobs];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const job = queue.shift();
    try { await run(job); process.stdout.write("."); } catch (e) { console.error("\n" + job.id, e.message); }
  }
}));
const sorted = Object.fromEntries(Object.entries(meta).sort(([a], [b]) => a.localeCompare(b)));
await fs.writeFile(path.join(root, "src/images.json"), JSON.stringify(sorted, null, 1));
console.log(`\n${Object.keys(meta).length} images written`);
