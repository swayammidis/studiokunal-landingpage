# Studio Kunal Photography — Landing Page

Editorial, cinematic Google Ads landing page for [Studio Kunal Photography](https://studiokunalphotography.com/): international wedding photography and cinematography across North America, India and destination weddings.

## Stack

- [Vite](https://vite.dev/) + vanilla JS, static HTML (fully readable without JavaScript)
- [GSAP](https://gsap.com/) ScrollTrigger + [Lenis](https://lenis.darkroom.engineering/) for scroll choreography. This code loads as a separate chunk and is skipped entirely for `prefers-reduced-motion`.
- Self-hosted fonts: Instrument Serif + Inter Tight
- Responsive AVIF/WebP images generated from the studio's real photography

## Scripts

```bash
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run preview   # serve the production build
npm run images    # re-download source images and regenerate public/img (AVIF + WebP)
```

## Markup: the `<pic>` tag

`index.html` uses `<pic src="home-02" alt="…" sizes="…" />`. A Vite plugin in `vite.config.js` expands it at build time into a full `<picture>` with AVIF/WebP `srcset` and intrinsic dimensions from `src/images.json`.

## Inquiry form

The form in `#contact` posts JSON to the URL in its `data-endpoint` attribute (e.g. Formspree, Basin, or a serverless function). **This is empty by default.** Until it is set, submitting opens the visitor's email app with the inquiry pre-filled to kkunalphotoarts@gmail.com.

`gclid` and `utm_*` parameters from the landing URL are captured into hidden fields for Google Ads attribution.

## Conversion tracking

No analytics IDs are included. Every CTA has a stable `id` and a `data-track` event name. Clicks are pushed to `window.dataLayer` and forwarded to `gtag()` if it exists, so GTM, GA4 and Google Ads tags can be attached later.

| Event | Fired by |
| --- | --- |
| `contact_form_submit` | Successful inquiry submission |
| `whatsapp_click`, `email_click`, `instagram_click`, `youtube_click` | Contact channel links |
| `portfolio_open` | Opening a project gallery |
| `film_play` | Playing a film |
| `custom_quote_click` | "Get a Custom Quote" |
| `cta_click` | All other CTAs (with `location`) |
