import { track } from "./track.js";

// Inquiry form.
// • Set data-endpoint on the <form> (e.g. a Formspree / Basin / serverless URL)
//   to POST JSON. Until then, it falls back to opening the visitor's email app
//   with the inquiry pre-filled to kkunalphotoarts@gmail.com.
// • Google Ads click IDs + UTM parameters from the landing URL are captured
//   into hidden fields so every lead can be attributed to its campaign.

const EMAIL = "kkunalphotoarts@gmail.com";
const ATTR_KEYS = ["gclid", "utm_source", "utm_medium", "utm_campaign", "utm_term"];

export function initForm() {
  const form = document.querySelector("[data-form]");
  if (!form) return;
  const status = form.querySelector(".form__status");
  const submit = form.querySelector("[type=submit]");
  const submitLabel = submit.querySelector(".btn__label");

  // Attribution: persist for the session so it survives in-page navigation.
  const params = new URLSearchParams(location.search);
  ATTR_KEYS.forEach((k) => {
    let v = params.get(k);
    try {
      if (v) sessionStorage.setItem(`sk_${k}`, v);
      else v = sessionStorage.getItem(`sk_${k}`);
    } catch { /* storage unavailable */ }
    if (v && form.elements[k]) form.elements[k].value = v;
  });

  const setError = (name, msg) => {
    const input = form.elements[name];
    const field = input.closest(".field");
    field.classList.toggle("is-invalid", !!msg);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    field.querySelector(".field__err").textContent = msg || "";
    return !msg;
  };

  const validate = () => {
    const name = form.elements.name.value.trim();
    const contact = form.elements.contact.value.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const isPhone = contact.replace(/\D/g, "").length >= 7;
    const ok1 = setError("name", name ? "" : "Please tell us your name.");
    const ok2 = setError("contact", !contact ? "We need an email or phone number to reply." : (isEmail || isPhone) ? "" : "Please enter a valid email or phone number.");
    if (!ok1) form.elements.name.focus();
    else if (!ok2) form.elements.contact.focus();
    return ok1 && ok2;
  };

  ["name", "contact"].forEach((n) => form.elements[n].addEventListener("input", () => {
    if (form.elements[n].closest(".field").classList.contains("is-invalid")) validate();
  }));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form__status";
    status.textContent = "";
    if (form.elements.company.value) return; // honeypot
    if (!validate()) return;

    const data = Object.fromEntries(new FormData(form).entries());
    delete data.company;
    const endpoint = form.dataset.endpoint;

    if (endpoint) {
      submit.disabled = true;
      submitLabel.textContent = "Sending…";
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(res.statusText);
        track("contact_form_submit", { method: "form", event_type: data.event_type, service: data.service });
        form.reset();
        status.className = "form__status is-success";
        status.textContent = "Thank you — your inquiry is on its way. We'll be in touch as soon as possible.";
      } catch {
        status.className = "form__status is-error";
        status.innerHTML = `Something went wrong sending your inquiry. Please email us at <a href="mailto:${EMAIL}">${EMAIL}</a> or message us on WhatsApp.`;
      } finally {
        submit.disabled = false;
        submitLabel.textContent = "Send Inquiry";
      }
      return;
    }

    // Fallback: compose an email with the inquiry.
    const lines = [
      `Name: ${data.name}`,
      `Email / Phone: ${data.contact}`,
      data.event_date ? `Event date: ${data.event_date}` : null,
      data.event_location ? `Event location: ${data.event_location}` : null,
      data.event_type ? `Type of event: ${data.event_type}` : null,
      data.service ? `Service: ${data.service}` : null,
      data.vision ? `\nOur vision:\n${data.vision}` : null,
    ].filter((l) => l !== null);
    const subject = `Wedding inquiry — ${data.name}${data.event_date ? ` (${data.event_date})` : ""}`;
    track("contact_form_submit", { method: "mailto", event_type: data.event_type, service: data.service });
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    status.className = "form__status is-success";
    status.textContent = "Your email app should open with your inquiry ready to send. If it doesn't, write to us at " + EMAIL + ".";
  });
}
