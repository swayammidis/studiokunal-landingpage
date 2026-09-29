// Conversion event plumbing. No analytics IDs are configured here: events are
// pushed to window.dataLayer (GTM) and forwarded to gtag() when present, so
// Google Ads / GA4 tags can be attached later without touching the markup.
//
// Events: contact_form_submit, whatsapp_click, email_click, instagram_click,
//         youtube_click, portfolio_open, film_play, custom_quote_click, cta_click

export function track(event, params = {}) {
  const payload = { event, ...params };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  if (typeof window.gtag === "function") window.gtag("event", event, params);
  document.dispatchEvent(new CustomEvent("sk:track", { detail: payload }));
}

export function initTracking() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (!el) return;
    track(el.dataset.track, {
      cta_id: el.id || undefined,
      cta_text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 60),
      location: el.dataset.trackLocation,
      href: el.getAttribute("href") || undefined,
    });
  });
}
