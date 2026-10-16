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
  function warningHtml(onlyWarnings = false) {
    const { status, humanGate } = publication();
    if (!status && !humanGate) return "";
    const showWarning = status === "draft" || humanGate === "waived" || humanGate === "not-run";
    if (onlyWarnings && !showWarning) return "";
    const names = {
      draft: localized("草案", "Draft"),
      reviewed: localized("已人工審閱", "Reviewed"),
      final: localized("已發佈版本", "Final")
    };
    const gate = humanGate === "passed" ? localized("人工驗收已登記", "Human review recorded") :
      humanGate === "waived" ? localized("人工驗收未執行（已豁免）", "Human Gate NOT RUN / waived") :
      humanGate === "not-run" ? localized("人工驗收尚未執行", "Human Gate NOT RUN") : "";
    return '<aside class="trip-trust-notice" role="note">' +
      '<strong>' + escapeHtml(names[status] || localized("行程版本狀態", "Trip publication")) +
      (gate ? ' · ' + escapeHtml(gate) : "") + '</strong>' +
      (showWarning ? '<p>' + localized(
        "行程草案／未完成驗收不代表訂票或預約完成；班次、路況與營業請向業者即時確認。",
        "Draft or unreviewed plans do not confirm tickets or reservations. Confirm live schedules, disruptions and opening with providers."
      ) + '</p>' : '<p>' + localized(
        "發佈狀態不代表交通、訂位或營業資訊即時有效。",
        "Publication status does not confirm live transit, bookings or opening."
      ) + '</p>') + '</aside>';
  }
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
  function attachNotice() {
    const html = warningHtml(true);
    if (!html || root.querySelector(".trip-trust-notice")) return;
    const tabs = root.querySelector(".trip-v2-tabs");
    if (tabs) tabs.insertAdjacentHTML("afterend", html);
    else {
      const stack = root.querySelector(".view-stack");
      if (stack) stack.insertAdjacentHTML("afterbegin", html);
      else root.insertAdjacentHTML("afterbegin", html);
    }
  }

  const originalTrip = renderTrip;
  renderTrip = function renderTrustedTrip() {
    originalTrip();
    annotateTransfers();
    attachNotice();
  };
  const originalNow = renderNow;
  renderNow = function renderTrustedNow() { originalNow(); attachNotice(); };
  const originalMap = renderMap;
  renderMap = function renderTrustedMap() { originalMap(); attachNotice(); };
  const originalCheck = renderCheck;
  renderCheck = function renderTrustedCheck() { originalCheck(); attachNotice(); };
  const originalMore = renderMore;
  renderMore = function renderTrustedMore() {
    originalMore();
    const stack = root.querySelector(".view-stack");
    if (stack) {
      stack.insertAdjacentHTML("beforeend", researchNotesHtml());
      const publicationNote = warningHtml(false);
      if (publicationNote) stack.insertAdjacentHTML("afterbegin", publicationNote);
    }
  };
  window.TravelLiteTrust = Object.freeze({ warningHtml, researchNotesHtml, sourceRows });
})();
