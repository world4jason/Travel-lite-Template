const state = {
  data: null,
  view: "now",
  selectedDate: null,
  selectedMapItemId: null,
  checks: {},
  todos: {},
  personalNote: "",
  theme: "system",
};

const VIEW_META = {
  now: { label: "Now", icon: "●" },
  trip: { label: "Trip", icon: "≡" },
  map: { label: "Map", icon: "⌖" },
  check: { label: "Check", icon: "✓" },
  more: { label: "More", icon: "•••" },
};

const root = document.querySelector("#view-root");
const bottomNav = document.querySelector("#bottom-nav");

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const escapeAttr = escapeHtml;
const tripKey = (suffix) => `${state.data.trip.id}:${suffix}`;

function zonedNow(timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
    minuteOfDay: Number(values.hour) * 60 + Number(values.minute),
  };
}

function toMinutes(time = "00:00") {
  const [hour, minute] = String(time).split(":").map(Number);
  return (hour || 0) * 60 + (minute || 0);
}

function prettyDate(dateString, options = {}) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", ...options }).format(date);
}

function dateRangeLabel(trip) {
  return `${prettyDate(trip.startDate)} – ${prettyDate(trip.endDate, { year: "numeric" })}`;
}

function dayDiff(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

function normalizeData(raw) {
  const data = structuredClone(raw);
  data.days ||= [];
  data.checklists ||= [];
  data.todos ||= [];
  data.reservations ||= [];
  data.costs ||= { currency: "", entries: [] };
  data.costs.entries ||= [];
  data.notes ||= [];
  data.files ||= [];
  data.contacts ||= [];
  data.journal ||= [];
  data.links ||= [];
  data.ui ||= {};
  data.ui.bottomNav ||= ["now", "trip", "map", "check", "more"];
  data.days.forEach((day, dayIndex) => {
    day.id ||= `day-${dayIndex + 1}`;
    day.items ||= [];
    day.items.forEach((item, itemIndex) => {
      item.id ||= `${day.id}-item-${itemIndex + 1}`;
    });
  });
  return data;
}

function flattenItems() {
  return state.data.days.flatMap((day) => day.items.map((item, index) => ({
    ...item, date: day.date, dayId: day.id, dayTitle: day.title, index,
  })));
}

function getNowContext() {
  const { trip, days } = state.data;
  const now = zonedNow(trip.timezone);
  const today = days.find((day) => day.date === now.date);
  const all = flattenItems();
  if (now.date < trip.startDate) return { phase: "before", now, daysUntil: dayDiff(now.date, trip.startDate), next: all[0] || null };
  if (now.date > trip.endDate) return { phase: "after", now, today: null, current: null, next: null };
  const current = today?.items.find((item) => {
    const start = toMinutes(item.start);
    const end = toMinutes(item.end || item.start);
    return now.minuteOfDay >= start && now.minuteOfDay < end;
  }) || null;
  const next = all.find((item) => {
    if (item.date > now.date) return true;
    if (item.date < now.date) return false;
    return toMinutes(item.start) > now.minuteOfDay;
  }) || null;
  return { phase: "during", now, today, current, next };
}

function getDayProgress(day, minuteOfDay) {
  if (!day?.items?.length) return 0;
  const completed = day.items.filter((item) => toMinutes(item.end || item.start) <= minuteOfDay).length;
  const active = day.items.some((item) => minuteOfDay >= toMinutes(item.start) && minuteOfDay < toMinutes(item.end || item.start));
  return Math.min(100, Math.round(((completed + (active ? 0.5 : 0)) / day.items.length) * 100));
}

function itemQuery(item) {
  if (!item) return "";
  if (item.lat != null && item.lng != null) return `${item.lat},${item.lng}`;
  return item.mapQuery || item.location || item.title || "";
}

function googleMapsEmbedUrl(item) {
  if (!item) return "";
  if (item.mapEmbedUrl) return item.mapEmbedUrl;
  const query = itemQuery(item);
  return query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : "";
}

function googleMapsOpenUrl(item) {
  if (!item) return "";
  if (item.mapsUrl) return item.mapsUrl;
  const query = itemQuery(item);
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
}

function mapPreview(item, compact = false) {
  const src = googleMapsEmbedUrl(item);
  if (!src) return "";
  return `<div class="map-frame ${compact ? "compact" : ""}"><iframe title="Google Map for ${escapeAttr(item.title || item.location || "trip location")}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${escapeAttr(src)}" allowfullscreen></iframe></div>`;
}

function renderNav() {
  const views = state.data.ui.bottomNav.filter((view) => VIEW_META[view]);
  bottomNav.style.setProperty("--nav-count", views.length);
  bottomNav.innerHTML = views.map((view) => `
    <button class="nav-item ${state.view === view ? "active" : ""}" data-view="${view}" type="button" aria-current="${state.view === view ? "page" : "false"}">
      <span class="nav-icon">${VIEW_META[view].icon}</span><span>${VIEW_META[view].label}</span>
    </button>`).join("");
  bottomNav.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
}

function setView(view) {
  if (!VIEW_META[view]) return;
  state.view = view;
  TravelLiteStorage.set(tripKey("ui:view"), view);
  render();
}

function openMapFor(item) {
  if (item?.id) state.selectedMapItemId = item.id;
  setView("map");
}

function itemActions(item) {
  if (!item) return "";
  const open = googleMapsOpenUrl(item);
  const hasMap = Boolean(googleMapsEmbedUrl(item));
  return `<div class="action-row">
    ${hasMap ? `<button class="button-link primary" type="button" data-map-item="${escapeAttr(item.id)}">Show map</button>` : ""}
    ${open ? `<a class="button-link" href="${escapeAttr(open)}" target="_blank" rel="noreferrer">Directions ↗</a>` : ""}
  </div>`;
}

function attachMapButtons() {
  root.querySelectorAll("[data-map-item]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = flattenItems().find((candidate) => candidate.id === button.dataset.mapItem);
      openMapFor(item);
    });
  });
}

function nextCard(label, item) {
  return `<section class="panel next-card"><div class="time-pill">${escapeHtml(item.start)}</div><div>
    <p class="eyebrow">${escapeHtml(label)}</p><h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.location || item.dayTitle || "")}</p>
    ${itemActions(item)}
  </div></section>`;
}

function renderNow() {
  const context = getNowContext();
  if (context.phase === "before") {
    root.innerHTML = `<div class="view-stack"><section class="panel hero-card">
      <div class="status-row"><span class="status-dot upcoming"></span>Trip starts in ${context.daysUntil} day${context.daysUntil === 1 ? "" : "s"}</div>
      <h2 class="now-title">${escapeHtml(state.data.trip.title)}</h2><p class="now-location">${dateRangeLabel(state.data.trip)}</p>
      <p class="now-note">Your trip is cached for offline use after the first successful load.</p></section>
      ${context.next ? nextCard("First up", context.next) + mapPreview(context.next, true) : ""}</div>`;
    attachMapButtons();
    return;
  }
  if (context.phase === "after") {
    root.innerHTML = `<section class="panel empty-state"><p class="eyebrow">Trip complete</p><h2>${escapeHtml(state.data.trip.title)}</h2><p>The itinerary remains available as a compact trip record.</p></section>`;
    return;
  }
  const current = context.current;
  const today = context.today;
  const focus = current || context.next;
  const progress = today ? getDayProgress(today, context.now.minuteOfDay) : 0;
  root.innerHTML = `<div class="view-stack"><section class="panel hero-card">
    <div class="status-row"><span class="status-dot ${current ? "" : "upcoming"}"></span>${current ? "Happening now" : "Between activities"}</div>
    <h2 class="now-title">${escapeHtml(current?.title || today?.title || "Today")}</h2>
    <p class="now-location">${current ? `${escapeHtml(current.start)}–${escapeHtml(current.end || "")} · ${escapeHtml(current.location || "")}` : escapeHtml(today?.title || "No itinerary for today")}</p>
    ${current?.note ? `<p class="now-note">${escapeHtml(current.note)}</p>` : ""}${itemActions(current)}
    ${today ? `<div class="progress-wrap"><div class="progress-meta"><span>${escapeHtml(today.label)} · ${escapeHtml(today.title)}</span><span>${progress}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div></div>` : ""}
  </section>${context.next ? nextCard("Up next", context.next) : `<section class="panel next-card"><div class="time-pill">Done</div><div><h3>No more plans today</h3><p>Open Trip to review another day.</p></div></section>`}
  ${focus ? mapPreview(focus, true) : ""}</div>`;
  attachMapButtons();
}

function renderTrip() {
  const currentDate = zonedNow(state.data.trip.timezone).date;
  const selected = state.data.days.find((day) => day.date === state.selectedDate) || state.data.days[0];
  state.selectedDate = selected?.date || null;
  const tabs = state.data.days.map((day) => `<button class="day-chip ${day.date === state.selectedDate ? "active" : ""}" type="button" data-date="${escapeAttr(day.date)}"><strong>${escapeHtml(day.label)}</strong><small>${prettyDate(day.date)}</small></button>`).join("");
  const now = zonedNow(state.data.trip.timezone);
  const timeline = selected?.items.map((item) => {
    const isCurrent = selected.date === currentDate && now.minuteOfDay >= toMinutes(item.start) && now.minuteOfDay < toMinutes(item.end || item.start);
    return `<article class="timeline-item ${isCurrent ? "current" : ""}">
      <div class="timeline-time">${escapeHtml(item.start)}</div><div class="timeline-rail"><div class="timeline-dot"></div></div>
      <div class="timeline-content"><div class="item-heading"><h3>${escapeHtml(item.title)}</h3>${item.type ? `<span class="type-pill">${escapeHtml(item.type)}</span>` : ""}</div>
      ${item.location ? `<p>${escapeHtml(item.location)}</p>` : ""}${item.note ? `<p class="timeline-note">${escapeHtml(item.note)}</p>` : ""}${itemActions(item)}</div>
    </article>`;
  }).join("") || "";
  root.innerHTML = `<div class="day-tabs" aria-label="Trip days">${tabs}</div>
    <section class="panel day-summary"><p class="eyebrow">${escapeHtml(selected?.label || "")} · ${selected ? prettyDate(selected.date, { weekday: "short" }) : ""}</p><h2>${escapeHtml(selected?.title || "Trip")}</h2><p>${selected?.items.length || 0} planned stop${selected?.items.length === 1 ? "" : "s"}</p>${selected?.note ? `<p class="day-note">${escapeHtml(selected.note)}</p>` : ""}</section>
    <section class="panel timeline">${timeline || `<div class="empty-state"><p>No plans yet.</p></div>`}</section>`;
  root.querySelectorAll("[data-date]").forEach((button) => button.addEventListener("click", () => {
    state.selectedDate = button.dataset.date;
    TravelLiteStorage.set(tripKey("ui:selectedDate"), state.selectedDate);
    renderTrip();
  }));
  attachMapButtons();
}

function getMappableItemsForSelectedDay() {
  const day = state.data.days.find((candidate) => candidate.date === state.selectedDate) || state.data.days[0];
  return (day?.items || []).filter((item) => googleMapsEmbedUrl(item));
}

function renderMap() {
  const selectedDay = state.data.days.find((day) => day.date === state.selectedDate) || state.data.days[0];
  if (selectedDay) state.selectedDate = selectedDay.date;
  const dayTabs = state.data.days.map((day) => `<button class="day-chip ${day.date === state.selectedDate ? "active" : ""}" type="button" data-map-date="${escapeAttr(day.date)}"><strong>${escapeHtml(day.label)}</strong><small>${prettyDate(day.date)}</small></button>`).join("");
  const items = getMappableItemsForSelectedDay();
  const selected = items.find((item) => item.id === state.selectedMapItemId) || items[0] || null;
  state.selectedMapItemId = selected?.id || null;
  const placeChips = items.map((item) => `<button class="place-chip ${item.id === state.selectedMapItemId ? "active" : ""}" type="button" data-map-place="${escapeAttr(item.id)}"><span>${escapeHtml(item.start || "")}</span>${escapeHtml(item.title)}</button>`).join("");
  root.innerHTML = `<div class="day-tabs" aria-label="Map days">${dayTabs}</div><section class="panel map-panel">
    <div class="map-heading"><div><p class="eyebrow">Google Maps</p><h2>${escapeHtml(selectedDay?.title || "Trip map")}</h2></div>${selected ? `<a class="button-link" href="${escapeAttr(googleMapsOpenUrl(selected))}" target="_blank" rel="noreferrer">Open ↗</a>` : ""}</div>
    ${items.length ? `<div class="place-chips">${placeChips}</div>${mapPreview(selected)}` : `<div class="empty-state"><p>No mappable locations for this day.</p></div>`}
  </section>`;
  root.querySelectorAll("[data-map-date]").forEach((button) => button.addEventListener("click", () => {
    state.selectedDate = button.dataset.mapDate;
    state.selectedMapItemId = null;
    TravelLiteStorage.set(tripKey("ui:selectedDate"), state.selectedDate);
    renderMap();
  }));
  root.querySelectorAll("[data-map-place]").forEach((button) => button.addEventListener("click", () => {
    state.selectedMapItemId = button.dataset.mapPlace;
    renderMap();
  }));
}

function checkKey(groupId, itemId) { return `${groupId}:${itemId}`; }

function renderCheck() {
  const todos = state.data.todos.length ? `<section class="panel check-group"><div class="check-title-row"><h2>To-dos</h2><span>${state.data.todos.filter((todo) => state.todos[todo.id]).length}/${state.data.todos.length}</span></div>${state.data.todos.map((todo) => {
    const checked = Boolean(state.todos[todo.id]);
    return `<label class="check-item"><input type="checkbox" data-todo-key="${escapeAttr(todo.id)}" ${checked ? "checked" : ""}/><span class="checkbox-ui">✓</span><span class="check-label"><strong>${escapeHtml(todo.label || todo.title)}</strong>${todo.dueDate || todo.priority ? `<small>${escapeHtml([todo.dueDate ? `Due ${prettyDate(todo.dueDate)}` : "", todo.priority].filter(Boolean).join(" · "))}</small>` : ""}</span></label>`;
  }).join("")}</section>` : "";
  const groups = state.data.checklists.map((group) => {
    const done = group.items.filter((item) => state.checks[checkKey(group.id, item.id)]).length;
    return `<section class="panel check-group"><div class="check-title-row"><h2>${escapeHtml(group.title)}</h2><span>${done}/${group.items.length}</span></div>${group.items.map((item) => {
      const key = checkKey(group.id, item.id); const checked = Boolean(state.checks[key]);
      return `<label class="check-item"><input type="checkbox" data-check-key="${escapeAttr(key)}" ${checked ? "checked" : ""}/><span class="checkbox-ui">✓</span><span class="check-label">${escapeHtml(item.label)}</span></label>`;
    }).join("")}</section>`;
  }).join("");
  root.innerHTML = `<div class="view-stack">${todos}${groups || `<section class="panel empty-state"><p>No checklists yet.</p></section>`}</div>`;
  root.querySelectorAll("[data-check-key]").forEach((input) => input.addEventListener("change", async () => {
    state.checks[input.dataset.checkKey] = input.checked;
    await TravelLiteStorage.set(tripKey("checks"), state.checks);
    renderCheck();
  }));
  root.querySelectorAll("[data-todo-key]").forEach((input) => input.addEventListener("change", async () => {
    state.todos[input.dataset.todoKey] = input.checked;
    await TravelLiteStorage.set(tripKey("todos"), state.todos);
    renderCheck();
  }));
}

function money(value, currency) {
  if (value == null || Number.isNaN(Number(value))) return "";
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(Number(value)); }
  catch { return `${currency || ""} ${value}`.trim(); }
}

function detailsSection(title, count, body, open = false) {
  if (!count) return "";
  return `<details class="panel more-section" ${open ? "open" : ""}><summary><span>${escapeHtml(title)}</span><span class="summary-count">${count}</span></summary><div class="more-body">${body}</div></details>`;
}

function renderMore() {
  const reservations = state.data.reservations.map((item) => `<article class="info-row"><div><span class="type-pill">${escapeHtml(item.type || "booking")}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml([item.date ? prettyDate(item.date) : "", item.time || "", item.location || ""].filter(Boolean).join(" · "))}</p>${item.status ? `<small>${escapeHtml(item.status)}</small>` : ""}</div>${item.url ? `<a class="inline-link" href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">Open ↗</a>` : ""}</article>`).join("");
  const total = state.data.costs.entries.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const costs = `<div class="cost-total"><span>Total</span><strong>${money(total, state.data.costs.currency)}</strong></div>${state.data.costs.entries.map((item) => `<article class="info-row compact-row"><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.category || "")}${item.date ? ` · ${prettyDate(item.date)}` : ""}</p></div><strong>${money(item.amount, item.currency || state.data.costs.currency)}</strong></article>`).join("")}`;
  const notes = state.data.notes.map((note) => `<article class="text-card"><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.body)}</p></article>`).join("");
  const files = state.data.files.map((file) => `<a class="file-row" href="${escapeAttr(file.url)}" target="_blank" rel="noreferrer"><span><strong>${escapeHtml(file.title)}</strong><small>${escapeHtml(file.type || "file")}</small></span><span>↗</span></a>`).join("");
  const contacts = state.data.contacts.map((contact) => `<article class="info-row compact-row"><div><h3>${escapeHtml(contact.name)}</h3><p>${escapeHtml(contact.role || "")}</p></div>${contact.phone ? `<a class="inline-link" href="tel:${escapeAttr(contact.phone)}">${escapeHtml(contact.phone)}</a>` : ""}</article>`).join("");
  const journal = state.data.journal.map((entry) => `<article class="text-card"><p class="eyebrow">${escapeHtml(entry.date ? prettyDate(entry.date, { weekday: "short" }) : entry.mood || "Journal")}</p><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.body)}</p></article>`).join("");
  const links = state.data.links.map((link) => `<a class="file-row" href="${escapeAttr(link.url)}" target="_blank" rel="noreferrer"><span><strong>${escapeHtml(link.label)}</strong></span><span>↗</span></a>`).join("");
  root.innerHTML = `<div class="view-stack">
    <section class="panel local-note-card"><div class="check-title-row"><h2>Personal note</h2><span>this device</span></div><textarea id="personal-note" rows="4" placeholder="Gate change, room number, quick memo…">${escapeHtml(state.personalNote)}</textarea><p class="helper-text">Saved locally in IndexedDB; falls back to localStorage if needed.</p></section>
    ${detailsSection("Reservations", state.data.reservations.length, reservations, true)}
    ${detailsSection("Costs", state.data.costs.entries.length, costs)}
    ${detailsSection("Trip notes", state.data.notes.length, notes)}
    ${detailsSection("Files & tickets", state.data.files.length, files)}
    ${detailsSection("Contacts", state.data.contacts.length, contacts)}
    ${detailsSection("Journal", state.data.journal.length, journal)}
    ${detailsSection("Links", state.data.links.length, links)}
    <section class="panel settings-card"><div><p class="eyebrow">Appearance</p><h2>Theme</h2></div><div class="theme-switcher">${["system", "dark", "light"].map((theme) => `<button type="button" data-theme="${theme}" class="theme-button ${state.theme === theme ? "active" : ""}">${theme}</button>`).join("")}</div><div class="storage-status"><span>Local storage</span><strong id="storage-mode">${escapeHtml(TravelLiteStorage.getMode())}</strong></div></section>
  </div>`;
  const textarea = root.querySelector("#personal-note");
  let noteTimer;
  textarea?.addEventListener("input", () => {
    state.personalNote = textarea.value;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => TravelLiteStorage.set(tripKey("personalNote"), state.personalNote), 180);
  });
  root.querySelectorAll("[data-theme]").forEach((button) => button.addEventListener("click", async () => {
    state.theme = button.dataset.theme;
    applyTheme();
    await TravelLiteStorage.set(tripKey("theme"), state.theme);
    renderMore();
  }));
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.style.colorScheme = state.theme === "system" ? "light dark" : state.theme;
}

function render() {
  renderNav();
  if (state.view === "trip") renderTrip();
  else if (state.view === "map") renderMap();
  else if (state.view === "check") renderCheck();
  else if (state.view === "more") renderMore();
  else renderNow();
}

function updateClock() {
  if (!state.data) return;
  const now = zonedNow(state.data.trip.timezone);
  document.querySelector("#local-time").textContent = now.time;
  document.querySelector("#timezone-label").textContent = state.data.trip.timezone.replaceAll("_", " ");
}

function hydrateHeader() {
  const { trip } = state.data;
  document.title = `${trip.title} · Travel Lite`;
  document.documentElement.style.setProperty("--accent", trip.accent || "#2563eb");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", trip.themeColor || "#0b1020");
  document.querySelector("#trip-location").textContent = trip.homeLabel || "Travel Lite";
  document.querySelector("#trip-title").textContent = trip.title;
  document.querySelector("#trip-meta").textContent = `${trip.subtitle || ""}${trip.subtitle ? " · " : ""}${dateRangeLabel(trip)}`;
}

async function loadTripData() {
  try {
    const response = await fetch("./trip.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`trip.json returned ${response.status}`);
    const data = normalizeData(await response.json());
    await TravelLiteStorage.set("snapshot:latest", data);
    return data;
  } catch (error) {
    console.warn("Network trip load failed; trying IndexedDB snapshot", error);
    const cached = await TravelLiteStorage.get("snapshot:latest");
    if (cached) return normalizeData(cached);
    throw error;
  }
}

async function hydrateLocalState() {
  const today = zonedNow(state.data.trip.timezone).date;
  const storedView = await TravelLiteStorage.get(tripKey("ui:view"));
  const storedDate = await TravelLiteStorage.get(tripKey("ui:selectedDate"));
  const allowedViews = state.data.ui.bottomNav.filter((view) => VIEW_META[view]);
  const defaultView = allowedViews.includes(state.data.ui.defaultView) ? state.data.ui.defaultView : (allowedViews[0] || "now");
  state.view = allowedViews.includes(storedView) ? storedView : defaultView;
  state.selectedDate = state.data.days.some((day) => day.date === storedDate) ? storedDate : (state.data.days.some((day) => day.date === today) ? today : state.data.trip.startDate);
  state.checks = (await TravelLiteStorage.get(tripKey("checks"))) || {};
  state.todos = (await TravelLiteStorage.get(tripKey("todos"))) || {};
  state.personalNote = (await TravelLiteStorage.get(tripKey("personalNote"))) || "";
  state.theme = (await TravelLiteStorage.get(tripKey("theme"))) || state.data.ui.theme || "system";

  try {
    const legacyKey = `travel-lite:${state.data.trip.id}:checks`;
    const legacyRaw = localStorage.getItem(legacyKey);
    if (legacyRaw && Object.keys(state.checks).length === 0) {
      state.checks = JSON.parse(legacyRaw) || {};
      await TravelLiteStorage.set(tripKey("checks"), state.checks);
      localStorage.removeItem(legacyKey);
    }
  } catch {}
  applyTheme();
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try { await navigator.serviceWorker.register("./sw.js", { scope: "./" }); }
  catch (error) { console.warn("Service worker registration failed", error); }
}

async function boot() {
  try {
    state.data = await loadTripData();
    await hydrateLocalState();
    hydrateHeader();
    updateClock();
    render();
    // Trip data and stored view/date are final from here; enhancement layers may now apply deep links.
    state.ready = true;
    window.dispatchEvent(new Event("travel-lite-ready"));
    registerServiceWorker();
    TravelLiteStorage.requestPersistentStorage();
    setInterval(() => {
      updateClock();
      if (state.view === "now") renderNow();
    }, 30_000);
  } catch (error) {
    console.error(error);
    root.replaceChildren(document.querySelector("#error-template").content.cloneNode(true));
  }
}

boot();
