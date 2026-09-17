/* Read-only Today Brief fallback for itinerary days without fixed times. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const baseGetNowContext = getNowContext;
  const baseRenderNow = renderNow;
  const rootNode = document.querySelector("#view-root");
  const rightRail = document.querySelector("#shell-right");

  function minuteValue(raw) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(raw || "").trim());
    if (!match) return null;
    const hour = Number(match[1]), minute = Number(match[2]);
    return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
  }

  function isTimed(item) { return minuteValue(item?.start) != null; }

  function isUntimedDay(context) {
    return context?.phase === "during"
      && Boolean(context.today)
      && Array.isArray(context.today.items)
      && context.today.items.length > 0
      && !context.today.items.some(isTimed);
  }

  function isChinese() {
    const locale = state?.data?.ui?.locale || document.documentElement.lang || navigator.language || "";
    return /^zh(?:-|$)/i.test(locale);
  }

  function label(key, english, chinese) {
    const override = state?.data?.ui?.labels?.[key];
    return String(override || (isChinese() ? chinese : english));
  }

  function safeUrl(rawUrl, protocols = ["http:", "https:"]) {
    if (!rawUrl) return "";
    try {
      const url = new URL(rawUrl, window.location.href);
      return protocols.includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  }

  function routeStops(day) {
    const explicit = Array.isArray(day?.routeSummary) ? day.routeSummary : [];
    const source = explicit.length ? explicit : (day?.items || []).map((item) => item.routeLabel || item.title || item.location).filter(Boolean);
    const seen = new Set();
    return source.map((entry) => typeof entry === "string" ? entry : entry?.label || entry?.title).filter(Boolean).filter((value) => {
      const key = String(value).trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function supplementary(item) {
    if (!item || typeof itemActions !== "function") return "";
    const template = document.createElement("template");
    template.innerHTML = itemActions(item);
    return [...template.content.querySelectorAll(".decision-card, .info-card")].map((node) => node.outerHTML).join("");
  }

  function itemLinks(item) {
    const links = [];
    const map = safeUrl(typeof googleMapsOpenUrl === "function" ? googleMapsOpenUrl(item) : "");
    if (map) links.push({ label: label("todayBriefMap", "Map", "地圖"), url: map });
    (Array.isArray(item?.externalLinks) ? item.externalLinks : []).slice(0, 2).forEach((link) => {
      const url = safeUrl(link?.url, ["http:", "https:", "tel:", "mailto:"]);
      if (link?.label && url) links.push({ label: link.label, url });
    });
    if (!links.length) return "";
    return `<div class="today-brief-links">${links.map((link) => `<a href="${escapeAttr(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} ↗</a>`).join("")}</div>`;
  }

  function briefItem(item, index) {
    const meta = [item.type, item.location].filter(Boolean).join(" · ");
    return `<article class="today-brief-item">
      <span class="today-brief-sequence">${index + 1}</span>
      <div class="today-brief-copy">
        <h3>${escapeHtml(item.title || label("todayBriefItem", "Plan", "行程"))}</h3>
        ${meta ? `<p>${escapeHtml(meta)}</p>` : ""}
        ${item.note ? `<p class="today-brief-note">${escapeHtml(item.note)}</p>` : ""}
        ${itemLinks(item)}
        ${supplementary(item)}
      </div>
    </article>`;
  }

  function briefHtml(context) {
    const day = context.today;
    const route = routeStops(day);
    return `<section class="panel today-brief-card">
      <div class="today-brief-heading">
        <div><p class="eyebrow">${escapeHtml(label("today", "Today", "今天"))} · ${escapeHtml(day.label || prettyDate(day.date, { weekday: "short" }))}</p><h2>${escapeHtml(day.title || label("todayBriefTitle", "Today at a glance", "今日摘要"))}</h2></div>
        <span>${day.items.length} ${escapeHtml(label("todayBriefPlans", "plans", "項"))}</span>
      </div>
      ${route.length ? `<p class="today-brief-route">${route.map(escapeHtml).join(" → ")}</p>` : ""}
      ${day.note ? `<p class="today-brief-day-note">${escapeHtml(day.note)}</p>` : ""}
      <p class="today-brief-timing">${escapeHtml(label("todayBriefNoFixedTime", "No fixed times in this itinerary. Use the published order and your operator or specialist app for live timing.", "這天的行程沒有固定時間；依既有順序參考，實際時間以領隊、營運單位或專項 App 為準。"))}</p>
      <div class="today-brief-list">${day.items.map(briefItem).join("")}</div>
    </section>`;
  }

  // On a fully untimed day, do not let yesterday/tomorrow timed entries masquerade as today's previous/next window.
  getNowContext = function todayBriefNowContext() {
    const context = baseGetNowContext();
    if (!isUntimedDay(context)) return context;
    return { ...context, previous: null, current: null, next: null, later: [] };
  };

  function enhanceMain(context) {
    if (!rootNode || !isUntimedDay(context) || state.view !== "now") return;
    const focus = rootNode.querySelector(".companion-focus");
    if (focus) focus.outerHTML = briefHtml(context);
    rootNode.querySelector(".companion-window")?.remove();
    rootNode.querySelector(".companion-later-list")?.closest(".companion-section")?.remove();
    rootNode.querySelector(".companion-floating-list")?.closest(".companion-section")?.remove();
  }

  function enhanceRightRail(context) {
    if (!isUntimedDay(context) || state.view !== "now") return;
    const right = rightRail;
    if (!right || getComputedStyle(right).display === "none") return;
    const card = right.querySelector(".shell-context-card");
    if (!card || card.dataset.todayBrief === "true") return;
    const day = context.today, route = routeStops(day);
    card.dataset.todayBrief = "true";
    card.innerHTML = `<div class="shell-context-heading"><strong>${escapeHtml(day.title || label("todayBriefTitle", "Today at a glance", "今日摘要"))}</strong><span>${escapeHtml(day.label || prettyDate(day.date, { weekday: "short" }))}</span></div>${route.length ? `<p class="shell-context-route">${route.map(escapeHtml).join(" → ")}</p>` : ""}<p class="shell-context-muted">${escapeHtml(label("todayBriefNoFixedTimeShort", "No fixed times published for today.", "今天沒有固定時間。"))}</p>`;
  }

  let railFrame = 0;
  function scheduleRightRail(context = getNowContext()) {
    cancelAnimationFrame(railFrame);
    railFrame = requestAnimationFrame(() => enhanceRightRail(context));
  }

  renderNow = function todayBriefRenderNow() {
    const context = getNowContext();
    baseRenderNow();
    if (!isUntimedDay(context)) return;
    enhanceMain(context);
    scheduleRightRail(context);
  };

  if (rightRail) {
    new MutationObserver(() => {
      const context = getNowContext();
      if (isUntimedDay(context)) scheduleRightRail(context);
    }).observe(rightRail, { childList: true, subtree: true });
  }

  window.addEventListener("resize", () => {
    const context = getNowContext();
    if (isUntimedDay(context)) scheduleRightRail(context);
  }, { passive: true });
})();
