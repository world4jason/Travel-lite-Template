/* Source traceability and optional publication status. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const localized = (zh, en) => /^zh/i.test(state.data?.ui?.locale || "") ? zh : en;
  function safeHttp(raw) {
    if (typeof raw !== "string" || !/^https?:\/\/[^/]/i.test(raw.trim())) return "";
    try { return new URL(raw).href; } catch { return ""; }
  }
  function dateOnly(raw) {
    return typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
  }
  function sourceLinksHtml(links) {
    return (Array.isArray(links) ? links : []).flatMap((link) => {
      const url = safeHttp(link?.url);
      if (!url || typeof link.label !== "string" || !link.label.trim()) return [];
      return ['<a class="inline-link" target="_blank" rel="noopener noreferrer" href="' +
        escapeAttr(url) + '">' + escapeHtml(link.label) + ' ↗</a>'];
    }).join("");
  }
  function publication() {
    const raw = state.data?.trip?.publication;
    const status = ["draft", "reviewed", "final"].includes(raw?.state) ? raw.state : "";
    const humanGate = ["passed", "not-run", "waived"].includes(raw?.humanGate) ? raw.humanGate : "";
    return { status, humanGate };
  }
  // The publisher's publication/humanGate metadata remains available, but
  // blanket draft/NOT RUN notices must not interrupt the traveller on every tab.
  // Keep the legacy callable API so existing integrations do not break.
  function warningHtml() { return ""; }
  function sourceRows() {
    const rows = [];
    const asList = (raw) => Array.isArray(raw) ? raw : [];
    function append(category, title, links, checkedAt) {
      (Array.isArray(links) ? links : []).forEach((link) => {
        const url = safeHttp(link?.url);
        if (!url || typeof link.label !== "string" || !link.label.trim()) return;
        rows.push({ category, title, label: link.label, url, checkedAt: dateOnly(checkedAt) });
      });
    }
    const trip = state.data || {};
    asList(trip.days).forEach((day) => {
      asList(day.items).forEach((item, index) => {
        const next = day.items?.[index + 1];
        if (item.transferAfter) {
          append("Transit", [item.title, next?.title].filter(Boolean).join(" → "),
            item.transferAfter.sourceLinks, item.transferAfter.checkedAt);
          asList(item.transferAfter.planB).forEach((option) =>
            append("Plan B", option.title || option.label || item.title, option.sourceLinks, option.checkedAt));
        }
        asList(item.planB).forEach((option) =>
          append("Plan B", option.title || option.label || item.title, option.sourceLinks, option.checkedAt));
        append("Place context", item.title, item.infoCard?.sourceLinks, item.infoCard?.checkedAt);
      });
      asList(day.planB).forEach((option) =>
        append("Plan B", option.title || option.label || day.title, option.sourceLinks, option.checkedAt));
    });
    asList(trip.pocketPicks).forEach((option) =>
      append("Plan B", option.title || option.label || "Pocket picks", option.sourceLinks, option.checkedAt));
    asList(trip.essentials).forEach((entry) =>
      append("Travel Essentials", entry.title, entry.sourceLinks, entry.checkedAt));
    asList(trip.researchNotes).forEach((note) =>
      append(note.category || "Other", note.title, note.sourceLinks, note.checkedAt));
    return rows;
  }
  function researchNotesHtml() {
    const groups = new Map();
    sourceRows().forEach((row) => {
      if (!groups.has(row.category)) groups.set(row.category, []);
      groups.get(row.category).push(row);
    });
    if (!groups.size) return "";
    const count = [...groups.values()].reduce((sum, entries) => sum + entries.length, 0);
    const body = [...groups].map(([category, rows]) =>
      '<section class="trip-research-group"><h3>' + escapeHtml(category) + '</h3><ul>' +
      rows.map((row) => '<li><strong>' + escapeHtml(row.title || row.label) + '</strong>' +
        (row.checkedAt ? '<small>' + localized("資料核對", "Researched") + ' · ' + escapeHtml(row.checkedAt) + '</small>' : "") +
        '<a class="inline-link" href="' + escapeAttr(row.url) +
        '" target="_blank" rel="noopener noreferrer">' + escapeHtml(row.label) + ' ↗</a></li>').join("") +
      '</ul></section>').join("");
    return '<details class="panel more-section trip-research-notes"><summary><span>' +
      localized("研究來源", "Research Notes") + '</span><span class="summary-count">' + count +
      '</span></summary><div class="more-body">' + body +
      '<p class="helper-text">' + localized(
        "來源網址與核對日期只表示曾參考的靜態資料，非即時可用性保證；外部網址須連線。",
        "Sources and research dates record static references, not live availability. External sites require Internet."
      ) + '</p></div></details>';
  }
  function annotateTransfers() {
    const day = (state.data?.days || []).find((entry) => entry.date === state.selectedDate);
    if (!day) return;
    const elements = [...root.querySelectorAll(".trip-day-view .trip-transfer")];
    const transfers = (day.items || []).slice(0, -1).filter((item) => item.transferAfter);
    elements.forEach((element, index) => {
      const transfer = transfers[index]?.transferAfter;
      if (!transfer) return;
      const links = sourceLinksHtml(transfer.sourceLinks);
      const researched = dateOnly(transfer.checkedAt);
      if (!links && !researched) return;
      const holder = element.querySelector(".trip-transfer-copy");
      holder?.insertAdjacentHTML("beforeend", '<div class="trip-research-meta">' +
        (researched ? '<small>' + localized("資料核對", "Researched") + ' · ' + escapeHtml(researched) + '</small>' : "") +
        links + '</div>');
    });
  }
  const originalTrip = renderTrip;
  renderTrip = function renderTrustedTrip() {
    originalTrip();
    annotateTransfers();
  };
  const originalMore = renderMore;
  renderMore = function renderTrustedMore() {
    originalMore();
    const stack = root.querySelector(".view-stack");
    if (stack) stack.insertAdjacentHTML("beforeend", researchNotesHtml());
  };
  window.TravelLiteTrust = Object.freeze({ publication, warningHtml, researchNotesHtml, sourceRows });
})();
