/*
  SevenHost — site configuration
  Edit this file to change contact details, plans and form behaviour.
  Nothing secret belongs here: this file is public and downloaded by every visitor.
  Never put API keys, passwords or tokens in any file inside /public.
*/
window.SEVENHOST_CONFIG = {
  brand: "SevenHost",

  // EDIT: the inbox that receives waitlist and contact messages while there is no backend.
  contactEmail: "hello@example.com",

  // EDIT (optional): WhatsApp number in international format, digits only, e.g. "919876543210". Leave "" to hide.
  whatsapp: "",

  // Stage 1/2 = "" (forms open the visitor's email app, nothing is stored on a server).
  // Stage 3 = "" still works when the Worker is on the same domain; set to "/api" only after you deploy stage3/.
  apiBase: "",

  // Honest status shown in the banner. Change only when it becomes true.
  status: "pre-launch",

  // PLANNED plans. Prices are placeholders chosen by the owner, not live offers.
  // Rule: never write "unlimited". Only list numbers you have actually tested.
  plans: [
    {
      id: "static-setup",
      name: "Static Site Setup",
      tag: "Service — first to launch",
      price: "₹199",
      per: "one-time (target)",
      blurb:
        "We deploy your static website to your own free Cloudflare account, so you keep full control and ownership.",
      features: [
        "Your site on your own Cloudflare account",
        "Git-based updates (GitHub)",
        "HTTPS and CDN included by Cloudflare",
        "Handover guide in plain language"
      ],
      limits: "Hosting itself is provided by Cloudflare under its free-plan limits.",
      cta: "Join the waitlist",
      interest: "Static Site Setup"
    },
    {
      id: "starter",
      name: "Starter Hosting",
      tag: "Planned — needs paid server",
      price: "₹99",
      per: "per month (target)",
      blurb:
        "Real web hosting on a SevenHost server for small PHP/WordPress-style sites. Not available until the server is live and tested.",
      features: [
        "1 website (target)",
        "1 GB storage (target)",
        "Free SSL certificate",
        "Daily backups (target)"
      ],
      limits: "Targets only. Final limits are published before any sale.",
      cta: "Notify me",
      interest: "Starter Hosting"
    },
    {
      id: "business",
      name: "Business Hosting",
      tag: "Planned — needs paid server",
      price: "₹299",
      per: "per month (target)",
      blurb:
        "More room for growing sites and small online stores, once the infrastructure and support process are in place.",
      features: [
        "3 websites (target)",
        "5 GB storage (target)",
        "Free SSL certificate",
        "Priority email support (target)"
      ],
      limits: "Targets only. Final limits are published before any sale.",
      cta: "Notify me",
      interest: "Business Hosting"
    }
  ]
};
