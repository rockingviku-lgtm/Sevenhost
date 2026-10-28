// Stage 3 (optional): stores waitlist + contact messages in Cloudflare D1.
// Static files are served by Cloudflare directly; this Worker only runs for /api/* (see wrangler.stage3.jsonc).
// There is deliberately NO endpoint that reads stored data. View rows in the Cloudflare dashboard (D1 > your database > Console).

const MAX = { name: 80, email: 120, message: 1500, interest: 60 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ALLOWED_INTEREST = new Set([
  "Static Site Setup", "Starter Hosting", "Business Hosting", "Domain registration", "Something else"
]);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function clean(v, max) {
  return typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

    // Same-origin only: blocks other websites from posting to this endpoint from a browser.
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin) return json({ error: "Forbidden" }, 403);

    if (!(request.headers.get("Content-Type") || "").includes("application/json")) {
      return json({ error: "Expected JSON" }, 415);
    }
    const raw = await request.text();
    if (raw.length > 8000) return json({ error: "Too large" }, 413);

    let data;
    try { data = JSON.parse(raw); } catch { return json({ error: "Invalid JSON" }, 400); }
    if (data.website) return json({ ok: true }); // honeypot

    const name = clean(data.name, MAX.name);
    const email = clean(data.email, MAX.email).toLowerCase();
    if (name.length < 2) return json({ error: "Please enter your name." }, 400);
    if (!EMAIL_RE.test(email)) return json({ error: "Please enter a valid email." }, 400);

    try {
      if (url.pathname === "/api/waitlist") {
        const interest = clean(data.interest, MAX.interest);
        if (!ALLOWED_INTEREST.has(interest)) return json({ error: "Invalid choice." }, 400);
        await env.DB.prepare(
          "INSERT OR IGNORE INTO waitlist (name, email, interest) VALUES (?1, ?2, ?3)"
        ).bind(name, email, interest).run();
        return json({ ok: true });
      }
      if (url.pathname === "/api/contact") {
        const message = clean(data.message, MAX.message);
        if (message.length < 10) return json({ error: "Message is too short." }, 400);
        await env.DB.prepare(
          "INSERT INTO messages (name, email, message) VALUES (?1, ?2, ?3)"
        ).bind(name, email, message).run();
        return json({ ok: true });
      }
    } catch (err) {
      return json({ error: "Could not save right now. Please try again later." }, 500);
    }
    return json({ error: "Not found" }, 404);
  }
};
