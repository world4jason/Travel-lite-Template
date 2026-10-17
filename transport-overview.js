/* The Transport primary tab reuses the existing MapLibre view and static transfer facts.
   No live routing, departure inference or speculative map lines. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const baseRenderMap = renderMap;
  const localized = (cn,en) => /^zh/i.test(state.data?.ui?.locale||"") ? cn : en;
  const safeHttp = (raw) => {
    if (typeof raw !== "string" || !/^https?:\/\/[^/\s]+/i.test(raw.trim())) return "";
    try {const value = new URL(raw);return ["http:","https:"].includes(value.protocol)?value.href:"";}catch{return "";}
  };
  function transferRows(day) {
    if (!day) return [];
    return (day.items || []).flatMap((item, index) => {
      const transfer = item.transferAfter;
      const next = day.items[index+1];
      if (!transfer || !next) return [];
      const duration = window.TravelLiteTransit?.durationText(transfer.estimate) || transfer.duration || "";
      const meta = [transfer.mode || "", duration].filter(Boolean).join(" · ");
      const primary = safeHttp(transfer.url);
      const sources = (Array.isArray(transfer.sourceLinks)?transfer.sourceLinks:[])
        .filter((entry)=>entry?.label && safeHttp(entry.url));
      const extra = sources.length ? sources[0] : null;
      const links = [primary?{label:localized("路線資訊","Route details"),url:primary}:null,
        extra?{label:extra.label,url:safeHttp(extra.url)}:null].filter(Boolean)
        .map((source)=>`<a href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)} ↗</a>`).join(" ");
      return [`<li><strong>${escapeHtml(item.title || "")} → ${escapeHtml(next.title || "")}</strong>
        ${meta ? `<small>${escapeHtml(meta)}</small>` : ""}
        ${transfer.summary ? `<p>${escapeHtml(transfer.summary)}</p>` : ""}
        ${transfer.checkedAt ? `<small>${localized("資料核對","Researched")}: ${escapeHtml(transfer.checkedAt)}</small>` : ""}
        ${links}</li>`];
    });
  }
  renderMap = function renderTransportOverview() {
    baseRenderMap();
    const title = root.querySelector(".map-heading .eyebrow");
    const subtitle = root.querySelector(".map-heading-copy");
    if (title) title.textContent=localized("交通與位置","TRANSPORT & LOCATION");
    if (subtitle) subtitle.textContent=localized(
      "已排定地點的空間參考；交通班次與即時路線請依業者確認。",
      "Planned stops are spatial reference; verify live routes and service with providers."
    );
    const day=state.data.days.find((d)=>d.date===state.selectedDate)||state.data.days[0];
    const lines=transferRows(day);
    if (!lines.length) return;
    const panel=root.querySelector(".runtime-map-panel");
    const chips=panel?.querySelector(".place-chips");
    if (!panel) return;
    const details=document.createElement("details");
    details.className="panel transport-day-context";
    details.setAttribute("aria-label",localized("今日交通摘要","Published transfers"));
    details.innerHTML=`<summary><span>${localized("今日交通","Published transfers")} · ${lines.length}</span>
      <span class="transport-summary-meta">${localized("已發佈參考 · 非即時班次","Saved reference · not live")}</span></summary>
      <ol class="transport-leg-list">${lines.join("")}</ol>`;
    panel.insertBefore(details,chips||panel.querySelector(".map-stage"));
  };
})();
