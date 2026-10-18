/* Reusable read-only Places directory and context. No discovery or secrets. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  let filterDate = "all";
  const excludedTypes = new Set(["transport", "stay", "flight", "transfer", "lodging", "hotel", "drive", "bus", "train"]);
  const namedTypes = new Set(["place", "attraction", "museum", "landmark", "nature", "activity", "event", "food", "restaurant", "sight"]);
  const zh = () => /^zh/i.test(state.data?.ui?.locale || "");
  const label = (cn, en) => zh() ? cn : en;
  const safeHttp = (raw) => {
    if (typeof raw !== "string" || !raw.trim()) return "";
    try {
      // Allow relative public static-file links as well as explicit HTTP(S).
      const url = new URL(raw.trim(), window.location.href);
      return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
        ? url.href : "";
    } catch { return ""; }
  };
  const hasLocation = (item) => Boolean(item.location || item.mapQuery ||
    (item.lat != null && item.lng != null && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng))));
  function isPlace(item) {
    if (!item || !item.id || !item.title) return false;
    const type = String(item.type || "").trim().toLowerCase();
    if (excludedTypes.has(type)) return false;
    // An unspecific Lunch/Dinner stop is an itinerary task, not a researched venue.
    if (type === "food") return Boolean(item.infoCard || item.venueName || item.mapQuery || item.mapsUrl);
    if (type === "restaurant") return hasLocation(item) || Boolean(item.infoCard);
    return namedTypes.has(type) || Boolean(item.infoCard) || hasLocation(item);
  }
  function entries() {
    return state.data.days.flatMap((day) =>
      (day.items || []).filter(isPlace).map((item) => ({ item, day })));
  }
  function isUniquePlaceId(id) {
    // Published item IDs can accidentally collide across days. Do not associate
    // a ticket or booking with the wrong visit when source identity is ambiguous.
    return state.data.days.reduce((count,day) => count +
      (day.items || []).filter((item) => item.id === id).length, 0) === 1;
  }
  function linked(records, id) {
    if (!isUniquePlaceId(id)) return [];
    return (Array.isArray(records) ? records : []).filter((entry) =>
      entry && (entry.itemId === id || (Array.isArray(entry.itemIds) && entry.itemIds.includes(id))));
  }
  function badges(item) {
    const rs = linked(state.data.reservations, item.id);
    const fs = linked(state.data.files, item.id);
    return { reservations: rs, files: fs, hasEntry: Boolean(rs.length || fs.length) };
  }
  function smallDay(entry) {
    return [entry.day.label, prettyDate(entry.day.date, {weekday:"short"}),
      /^\d{2}:\d{2}$/.test(entry.item.start || "") ? entry.item.start : ""].filter(Boolean).join(" · ");
  }
  function linksHtml(links) {
    return (Array.isArray(links) ? links : []).flatMap((link) => {
      const url = safeHttp(link?.url);
      if (!url || !link?.label) return [];
      return [`<a class="places-source-link" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)} <span aria-hidden="true">↗</span></a>`];
    }).join("");
  }
  function cardHtml(entry) {
    const item = entry.item;
    const contents = badges(item);
    const info = item.infoCard || {};
    const excerpt = info.summary || item.note || item.location || label("尚無景點介紹", "Details not provided");
    return `<button class="places-card panel" data-open-place="${escapeAttr(item.id)}" type="button">
      <span class="places-card-meta">${escapeHtml(smallDay(entry))}</span>
      <span class="places-card-title">${escapeHtml(item.title)}</span>
      <span class="places-card-excerpt">${escapeHtml(excerpt)}</span>
      <span class="places-card-foot"><span>${escapeHtml(item.location || label("這趟行程的地點", "Planned place"))}</span>
      ${contents.hasEntry ? `<span class="places-entry-chip">${label("入場／預約", "Entry / booking")}</span>` : ""}
      <span class="places-card-arrow" aria-hidden="true">↗</span></span>
    </button>`;
  }
  function listView(all) {
    const selected = filterDate === "all" ? all : all.filter((entry) => entry.day.date === filterDate);
    const dates = [...new Set(all.map((entry) => entry.day.date))];
    const tabs = [`<button type="button" data-places-date="all" class="places-filter ${filterDate === "all" ? "active" : ""}" aria-pressed="${filterDate === "all"}">${label("全部日期", "All days")}</button>`]
      .concat(dates.map((date) => {
        const day = state.data.days.find((d) => d.date === date);
        return `<button type="button" data-places-date="${escapeAttr(date)}" class="places-filter ${filterDate === date ? "active" : ""}" aria-pressed="${filterDate === date}">${escapeHtml(day?.label || prettyDate(date))}</button>`;
      })).join("");
    // Avoid 32 clipped, unreachable day chips on long trips.
    const picker = dates.length > 7
      ? `<label class="places-date-picker"><span>${label("選擇日期", "Choose day")}</span><select data-places-select aria-label="${label("依日期篩選景點", "Filter places by day")}"><option value="all" ${filterDate === "all" ? "selected" : ""}>${label("全部日期", "All days")}</option>${dates.map((date) => {
          const day = state.data.days.find((d) => d.date === date);
          return `<option value="${escapeAttr(date)}" ${filterDate === date ? "selected" : ""}>${escapeHtml(day?.label || prettyDate(date))} · ${escapeHtml(prettyDate(date))}</option>`;
        }).join("")}</select></label>`
      : dates.length > 1 ? `<div class="places-filters" role="group" aria-label="${label("依日期篩選景點", "Filter places by day")}">${tabs}</div>` : "";
    root.innerHTML = `<div class="places-view view-stack">
      <header class="places-heading">
        <p class="eyebrow">${label("已安排景點與活動", "YOUR PLANNED PLACES")}</p>
        <h2>${label("景點指南", "Places")}</h2>
        <p>${label("查看這趟旅程已安排的地點、入場事項與背景介紹。", "Find the places in this itinerary, entry details and source-backed context.")}</p>
        <span class="places-count">${all.length} ${label("個地點", "places")}</span>
      </header>
      ${picker}
      <div class="places-grid">${selected.length ? selected.map(cardHtml).join("") :
        `<section class="panel empty-state"><h3>${label("這天沒有已安排的景點", "No planned places for this day")}</h3><p>${label("交通、住宿與未確定的地點不會被當成景點補入。", "Transport and accommodation are not invented as attractions.")}</p></section>`}</div>
    </div>`;
  }
  function reservationHtml(record) {
    const url = safeHttp(record.url);
    const status = record.status ? `<span class="places-status">${escapeHtml(record.status)}</span>` : "";
    return `<article class="places-booking-row"><div><strong>${escapeHtml(record.title || label("預約", "Reservation"))}</strong> ${status}
      <p>${escapeHtml([record.date || "", record.time || "", record.location || ""].filter(Boolean).join(" · "))}</p></div>
      ${url ? `<a class="places-source-link" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${label("開啟預約來源", "Open booking link")} ↗</a>` : ""}</article>`;
  }
  function fileHtml(record) {
    const url = safeHttp(record.url);
    // An attached private ticket URI is never accepted from untrusted schemes.
    return `<article class="places-booking-row"><div><strong>${escapeHtml(record.title || label("文件", "File"))}</strong>
      ${record.type ? `<p>${escapeHtml(record.type)}</p>` : ""}</div>
      ${url ? `<a class="places-source-link" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${label("開啟已提供的連結", "Open supplied link")} ↗</a>` : ""}</article>`;
  }
  function detailView(entry) {
    const item = entry.item;
    const info = item.infoCard || {};
    const content = badges(item);
    const photo = safeHttp(info.image);
    const map = safeHttp(googleMapsOpenUrl(item));
    const facts = (Array.isArray(info.facts) ? info.facts : []).filter(Boolean);
    const sources = linksHtml(info.sourceLinks);
    const extras = linksHtml(item.externalLinks);
    const hasAbout = Boolean(info.title || info.summary || facts.length || photo);
    const hasBooking = content.reservations.length || content.files.length;
    const ambiguousId = !isUniquePlaceId(item.id);
    root.innerHTML = `<div class="places-view places-detail-view view-stack">
      ${ambiguousId ? `<section class="panel places-identity-warning" role="alert">${label("景點 ID 重複：無法安全對應票券或唯一深連結，請修正行程來源。", "Duplicate place ID: booking association and unique deep links are unavailable until the source is corrected.")}</section>` : ""}
      <button type="button" class="places-back" data-places-back>← ${label("全部景點", "All places")}</button>
      <header class="places-detail-heading">
        <p class="eyebrow">${escapeHtml(smallDay(entry))}</p><h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.location || label("地點資訊未提供", "Location not provided"))}</p>
      </header>
      ${hasBooking ? `<section class="panel places-entry">
        <div class="places-section-top"><span aria-hidden="true">◫</span><div><p class="eyebrow">${label("入場與預約", "ENTRY & BOOKING")}</p><h3>${label("已連結的預約／票券", "Linked bookings & tickets")}</h3></div></div>
        ${content.reservations.map(reservationHtml).join("")}${content.files.map(fileHtml).join("")}
        <p class="places-disclaimer">${label("僅顯示已明確關聯的資料；預約狀態與現場規則請依業者確認。", "Only explicitly linked records are shown. Confirm reservation status and entry rules with the operator.")}</p>
      </section>` : ""}
      ${hasAbout ? `<section class="panel places-about">
        <p class="eyebrow">${label("景點介紹", "PLACE GUIDE")}</p>
        <h3>${escapeHtml(info.title || item.title)}</h3>
        ${photo ? `<img src="${escapeAttr(photo)}" alt="" loading="lazy" class="places-photo">` : ""}
        ${info.summary ? `<p>${escapeHtml(info.summary)}</p>` : ""}
        ${facts.length ? `<ul>${facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("")}</ul>` : ""}
        ${sources ? `<div class="places-links"><strong>${label("資料來源", "Sources")}</strong>${sources}</div>` : ""}
      </section>` : ""}
      ${item.note || extras ? `<section class="panel places-notes"><p class="eyebrow">${label("參觀與實用資訊", "PRACTICAL NOTES")}</p>
        ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
        ${extras ? `<div class="places-links">${extras}</div>` : ""}
      </section>` : ""}
      ${!hasAbout && !hasBooking && !item.note ? `<section class="panel places-empty-context"><p>${label("尚無已提供的景點介紹或入場資料；仍可查看已安排的時間與位置。", "No published guide or admission details for this place. Its itinerary and location remain available.")}</p></section>` : ""}
      ${window.TravelLitePlanB?.(item.planB) || ""}
      <nav class="panel places-actions" aria-label="${label("景點操作", "Place actions")}">
        <button type="button" class="button-link primary" data-places-trip="${escapeAttr(item.id)}">${label("查看當日行程", "View in Trip")}</button>
        ${map ? `<a class="button-link" href="${escapeAttr(map)}" target="_blank" rel="noopener noreferrer">${label("在地圖中開啟", "Open in Maps")} ↗</a>` : ""}
        <button type="button" class="button-link" data-places-transport="${escapeAttr(item.id)}">${label("交通與位置", "Transport & location")}</button>
      </nav>
    </div>`;
  }
  function render() {
    const all=entries();
    const selected=all.find((entry)=>entry.item.id === state.selectedPlaceId);
    if (state.selectedPlaceId && !selected) state.selectedPlaceId = null;
    if (selected) detailView(selected);
    else listView(all);
  }
  function open(id) {
    if (!entries().some((entry) => entry.item.id === id)) return;
    state.selectedPlaceId = id;
    setView("places");
  }
  root.addEventListener("click", (event) => {
    const target = event.target.closest("[data-open-place],[data-places-back],[data-places-date],[data-places-trip],[data-places-transport]");
    if (!target) return;
    if (target.hasAttribute("data-open-place")) open(target.dataset.openPlace);
    else if (target.hasAttribute("data-places-back")) { state.selectedPlaceId = null; render(); }
    else if (target.hasAttribute("data-places-date")) { filterDate=target.dataset.placesDate; render(); }
    else if (target.hasAttribute("data-places-trip") || target.hasAttribute("data-places-transport")) {
      const id=target.dataset.placesTrip || target.dataset.placesTransport;
      const entry=entries().find((row)=>row.item.id===id);
      if (!entry) return;
      state.selectedDate=entry.day.date;
      if (target.hasAttribute("data-places-transport")) {
        state.selectedMapItemId = id;
        setView("map");
      } else {
        setView("trip");
        requestAnimationFrame(() => {
          [...root.querySelectorAll("[data-trip-day]")].find((node) =>
            node.dataset.tripDay === entry.day.date)?.click();
        });
      }
    }
  });
  root.addEventListener("change", (event) => {
    const select = event.target.closest("[data-places-select]");
    if (!select) return;
    filterDate = select.value;
    render();
  });
  window.TravelLitePlaces = Object.freeze({isPlace,render,open,entries});
})();
