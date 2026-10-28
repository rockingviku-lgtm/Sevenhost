/* SevenHost front-end. No frameworks, no external requests except the optional domain lookup. */
(function () {
  "use strict";
  var cfg = window.SEVENHOST_CONFIG || {};
  var $ = function (sel) { return document.querySelector(sel); };

  /* ---------- helpers ---------- */
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function say(node, kind, text) {
    node.className = "result " + kind;
    node.textContent = text;
  }
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------- mobile menu ---------- */
  var btn = $("#menu-btn"), nav = $("#nav");
  btn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
  });

  /* ---------- plans + interest list (built with textContent, never innerHTML) ---------- */
  var grid = $("#plan-grid"), interest = $("#wl-interest");
  (cfg.plans || []).forEach(function (p) {
    var feats = el("ul", {}, (p.features || []).map(function (f) { return el("li", { text: f }); }));
    var card = el("article", { "class": "plan" }, [
      el("span", { "class": "tag", text: p.tag }),
      el("h3", { text: p.name }),
      el("div", { "class": "price", text: p.price }),
      el("div", { "class": "per", text: p.per }),
      el("p", { text: p.blurb }),
      feats,
      el("p", { "class": "limits", text: p.limits }),
      el("a", { "class": "btn", href: "#waitlist", "data-interest": p.interest, text: p.cta })
    ]);
    grid.appendChild(card);
    interest.appendChild(el("option", { value: p.interest, text: p.interest }));
  });
  interest.appendChild(el("option", { value: "Domain registration", text: "Domain registration" }));
  interest.appendChild(el("option", { value: "Something else", text: "Something else" }));
  grid.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-interest]");
    if (a) interest.value = a.getAttribute("data-interest");
  });

  /* ---------- footer / whatsapp ---------- */
  $("#year").textContent = "© " + new Date().getFullYear() + " SevenHost";
  if (cfg.whatsapp && /^\d{8,15}$/.test(cfg.whatsapp)) {
    var wa = $("#wa-line");
    wa.hidden = false;
    wa.appendChild(document.createTextNode("Prefer chat? "));
    wa.appendChild(el("a", { href: "https://wa.me/" + cfg.whatsapp, rel: "noopener", text: "Message us on WhatsApp" }));
  }

  /* ---------- forms ---------- */
  // Mode A (no backend): open the visitor's email app with a prefilled message. Nothing is stored by SevenHost.
  // Mode B (cfg.apiBase set): POST JSON to the Worker from stage3/.
  function submitForm(form, msgNode, kind, validate, toMail) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = {};
      new FormData(form).forEach(function (v, k) { d[k] = String(v).trim(); });
      if (d.website) { say(msgNode, "ok", "Thanks!"); form.reset(); return; } // honeypot: bots only
      var problem = validate(d, form);
      if (problem) { say(msgNode, "err", problem); return; }

      if (cfg.apiBase) {
        say(msgNode, "info", "Sending…");
        fetch(cfg.apiBase.replace(/\/$/, "") + "/" + kind, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d)
        }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
          .then(function (res) {
            if (res.ok) { say(msgNode, "ok", "Thank you — we received it."); form.reset(); }
            else say(msgNode, "err", res.j.error || "Could not send. Please try again later.");
          })
          .catch(function () { say(msgNode, "err", "Network problem. Please try again."); });
        return;
      }

      var mail = toMail(d);
      say(msgNode, "info", "Opening your email app. Press Send there to finish — nothing is sent until you do.");
      window.location.href = "mailto:" + encodeURIComponent(cfg.contactEmail).replace("%40", "@") +
        "?subject=" + encodeURIComponent(mail.subject) + "&body=" + encodeURIComponent(mail.body);
    });
  }

  submitForm($("#waitlist-form"), $("#waitlist-msg"), "waitlist",
    function (d, f) {
      if (d.name.length < 2) return "Please enter your name.";
      if (!EMAIL_RE.test(d.email)) return "Please enter a valid email address.";
      if (!f.elements.consent.checked) return "Please tick the consent box.";
      return "";
    },
    function (d) {
      return { subject: "SevenHost waitlist: " + d.interest,
               body: "Name: " + d.name + "\nEmail: " + d.email + "\nInterested in: " + d.interest };
    });

  submitForm($("#contact-form"), $("#contact-msg"), "contact",
    function (d) {
      if (d.name.length < 2) return "Please enter your name.";
      if (!EMAIL_RE.test(d.email)) return "Please enter a valid email address.";
      if (d.message.length < 10) return "Please write a slightly longer message.";
      return "";
    },
    function (d) {
      return { subject: "SevenHost contact from " + d.name,
               body: d.message + "\n\n— " + d.name + " <" + d.email + ">" };
    });

  /* ---------- domain lookup (public RDAP record; best-effort) ---------- */
  var DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;
  $("#domain-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var out = $("#domain-result");
    var d = $("#domain-input").value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
    if (!DOMAIN_RE.test(d)) { say(out, "err", "Enter a domain like example.com"); return; }
    say(out, "info", "Checking public records…");
    var ctl = new AbortController();
    var t = setTimeout(function () { ctl.abort(); }, 8000);
    fetch("https://rdap.org/domain/" + encodeURIComponent(d), { signal: ctl.signal, headers: { Accept: "application/rdap+json" } })
      .then(function (r) {
        clearTimeout(t);
        if (r.status === 200) say(out, "err", d + " appears to be registered already.");
        else if (r.status === 404) say(out, "info", "No public registration record found for " + d + ". That is not a guarantee it can be bought — confirm at a registrar.");
        else say(out, "info", "The lookup service gave an unclear answer (" + r.status + "). Please check at a registrar.");
      })
      .catch(function () {
        clearTimeout(t);
        say(out, "info", "Could not complete the lookup from this browser. Please check at a registrar instead.");
      });
  });
})();
