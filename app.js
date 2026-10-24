const state = {
  data: null,
  view: "now",
  selectedDate: null,
  selectedMapItemId: null,
  selectedPlaceId: null,
  checks: {},
  todos: {},
  personalNote: "",
  theme: "system",
  visualStyle: "editorial",
  stylePreference: null, // per-trip and device-only
  styleSource: "trip",
};

const VIEW_META = {
  now: { label: "Now", icon: "●" },
  trip: { label: "Trip", icon: "≡" },
  map: { label: "Transport", icon: "≋" }, // internal ID/legacy #map links remain stable
  check: { label: "Check", icon: "✓" }, // legacy #check route
  places: { label: "Places", icon: "⌖" },
  more: { label: "More", icon: "•••" },
};

const root = document.querySelector("#view-root");
const bottomNav = document.querySelector("#bottom-nav");

// The trip publishes a shared default. Each viewer can override it with a
// whitelisted device-only style preference. A URL preview takes precedence for
// the current link only; none of these operations edits shared trip data.
const VISUAL_PACKS = Object.freeze({
  editorial: { css: [], lightOnly: false, timeline: false, motion: false },
  storybook: { css: ["storybook-style"], lightOnly: true, timeline: true, motion: true },
  candy: { css: ["storybook-style", "candy-style"], lightOnly: true, timeline: true, motion: true },
  risograph: { css: ["risograph-style"], lightOnly: true, timeline: true, motion: false },
  "paper-collage": { css: ["storybook-style", "paper-collage-style"], lightOnly: true, timeline: true, motion: true },
  "naive-city": { css: ["storybook-style", "naive-city-style"], lightOnly: true, timeline: true, motion: true },
  "taiwan-poster": { css: ["storybook-style", "taiwan-poster-style"], lightOnly: true, timeline: true, motion: false },
  "field-stamp": { css: ["storybook-style", "field-stamp-style"], lightOnly: true, timeline: true, motion: false },
  "quiet-linocut": { css: ["storybook-style", "quiet-linocut-style"], lightOnly: true, timeline: true, motion: false },
  "doodle-memory-grid": { css: ["storybook-style", "doodle-memory-grid-style"], lightOnly: true, timeline: true, motion: false },
  "crayon-journal": { css: ["storybook-style", "crayon-journal-style"], lightOnly: true, timeline: true, motion: true },
  "painterly-editorial": { css: ["storybook-style", "painterly-editorial-style"], lightOnly: true, timeline: true, motion: false },
  "geometric-print": { css: ["storybook-style", "geometric-print-style"], lightOnly: true, timeline: true, motion: false },
  "quiet-acrylic": { css: ["storybook-style", "quiet-acrylic-style"], lightOnly: true, timeline: true, motion: false },
  "vintage-watercolor": { css: ["storybook-style", "vintage-watercolor-style"], lightOnly: true, timeline: true, motion: false },
});
const VISUAL_STYLES = new Set(Object.keys(VISUAL_PACKS));
const isStorybook = () => state.visualStyle === "storybook";
const isIllustratedStyle = () => VISUAL_PACKS[state.visualStyle]?.timeline === true;
const isFixedLightStyle = () => VISUAL_PACKS[state.visualStyle]?.lightOnly === true;
const hasIllustrationMotion = () => VISUAL_PACKS[state.visualStyle]?.motion === true;
const packThemeColor = () => ({ storybook: "#FFFCF6", candy: "#FFF9EF",
  risograph: "#F7F1E4", "paper-collage": "#FAF3E4", "naive-city": "#FAF5E9",
  "taiwan-poster": "#F5E7C4", "field-stamp": "#F7F0E3",
  "quiet-linocut": "#F4EDDD",
  "doodle-memory-grid": "#FBF6EA",
  "crayon-journal": "#FAF2E6",
  "painterly-editorial": "#F4F7F1",
  "geometric-print": "#F5F0E5",
  "quiet-acrylic": "#FCFAF3",
  "vintage-watercolor": "#FAF4E6" })[state.visualStyle] || "#f5f6f2";

function activateVisualStyle() {
  let requested = "";
  try { requested = new URLSearchParams(window.location.search).get("previewStyle") || ""; } catch {}
  const fromTrip = VISUAL_STYLES.has(state.data?.ui?.visualStyle)
    ? state.data.ui.visualStyle : "editorial";
  const isPreview = VISUAL_STYLES.has(requested);
  state.visualStyle = isPreview ? requested : (state.stylePreference || fromTrip);
  state.styleSource = isPreview ? "preview" : state.stylePreference ? "device" : "trip";
  document.documentElement.dataset.visualStyle = state.visualStyle;

  // Only audited, bundled pack IDs may activate stylesheets. No arbitrary
  // prompt text, URL or style manifest gets interpreted as CSS or JavaScript.
  const pack = VISUAL_PACKS[state.visualStyle];
  for (const id of ["storybook-style", "candy-style", "risograph-style",
    "paper-collage-style", "naive-city-style", "taiwan-poster-style", "field-stamp-style",
    "quiet-linocut-style", "doodle-memory-grid-style", "crayon-journal-style", "painterly-editorial-style", "geometric-print-style", "quiet-acrylic-style", "vintage-watercolor-style"]) {
    const sheet = document.getElementById(id);
    if (sheet) sheet.disabled = !pack.css.includes(id);
  }

  if (["storybook", "candy", "naive-city", "doodle-memory-grid", "crayon-journal"].includes(state.visualStyle)) {
    // Only styles that actually use Huninn request it; retro print and paper
    // styles retain their specified editorial/print fonts without network font requests.
    if (!document.querySelector("#storybook-font")) {
      const font = document.createElement("link");
      font.id = "storybook-font";
      font.rel = "stylesheet";
      font.href = "https://fonts.googleapis.com/css2?family=Huninn&display=swap";
      font.media = "print";
      font.onload = () => { font.media = "all"; };
      document.head.appendChild(font);
    }
  }
  if (hasIllustrationMotion()) window.TravelLiteStorybookMotion?.init(state.data.trip.id);
}

// Choosing in Settings removes only the appearance-preview parameter; it keeps
// the route/hash and any unrelated parameters. The shared itinerary is untouched.
function clearStylePreviewQuery() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("previewStyle")) return;
  url.searchParams.delete("previewStyle");
  history.replaceState(history.state, "", url.pathname + url.search + url.hash);
}

async function chooseLocalStyle(choice) {
  const editorialChoice = choice === "editorial-light" || choice === "editorial-dark";
  if (choice !== "default" && !VISUAL_STYLES.has(choice) && !editorialChoice) return false;
  const next = choice === "default" ? null : editorialChoice ? "editorial" : choice;
  if (editorialChoice) {
    state.theme = choice === "editorial-dark" ? "dark" : "light";
    await TravelLiteStorage.set(tripKey("theme"), state.theme);
  } else if (choice === "default") {
    await TravelLiteStorage.remove(tripKey("theme"));
    state.theme = state.data.ui.theme || "system";
  }
  if (next === null) {
    await TravelLiteStorage.remove(tripKey("visualStyle"));
  } else {
    const stored = await TravelLiteStorage.set(tripKey("visualStyle"), next);
    if (stored === false) return false;
  }
  state.stylePreference = next;
  clearStylePreviewQuery();
  activateVisualStyle();
  applyTheme();
  // Changing between fixed-light packs may not change data-theme, so refresh
  // the shell explicitly as well as rerendering the active settings view.
  window.dispatchEvent(new Event("travel-lite-style-changed"));
  renderMore();
  // Focus is restored by the dialog handler *after* its async save releases
  // the disabled selection button, or by the dialog close event on mobile.
  return true;
}

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const escapeAttr = escapeHtml;
function safePublishedUrl(raw) {
  if (typeof raw !== "string" || !raw.trim()) return "";
  try {
    const url = new URL(raw.trim(), window.location.href);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url.href : "";
  } catch { return ""; }
}

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

const DEFAULT_TRIP_ACCENT = "#4f6f5e";
const COVER_FOCAL_POINTS = new Set(["center", "top", "bottom", "left", "right"]);

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first, second) {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function normalizeAccent(rawAccent) {
  if (typeof rawAccent !== "string" || !/^#[0-9a-f]{6}$/i.test(rawAccent.trim())) return DEFAULT_TRIP_ACCENT;
  const accent = rawAccent.trim().toLowerCase();
  // Accent-backed controls use white text. Reject colors that cannot maintain WCAG AA contrast there.
  return contrastRatio(accent, "#ffffff") >= 4.5 ? accent : DEFAULT_TRIP_ACCENT;
}

function normalizeCover(rawCover) {
  if (!rawCover || typeof rawCover !== "object" || Array.isArray(rawCover)) return null;
  const src = typeof rawCover.src === "string" ? rawCover.src.trim() : "";
  const alt = typeof rawCover.alt === "string" ? rawCover.alt.trim() : "";
  if (!src || !alt || src.startsWith("//")) return null;

  try {
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(src);
    const url = new URL(src, document.baseURI);
    if (hasScheme) {
      if (url.protocol !== "https:") return null;
    } else if (url.origin !== window.location.origin) {
      return null;
    }
  } catch {
    return null;
  }

  const focalPoint = COVER_FOCAL_POINTS.has(rawCover.focalPoint) ? rawCover.focalPoint : "center";
  return { src, alt, focalPoint };
}

function normalizeData(raw) {
  const data = structuredClone(raw);
  data.trip ||= {};
  data.trip.accent = normalizeAccent(data.trip.accent);
  const cover = normalizeCover(data.trip.cover);
  if (cover) data.trip.cover = cover;
  else delete data.trip.cover;
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
  data.ui.visualStyle = VISUAL_STYLES.has(data.ui.visualStyle) ? data.ui.visualStyle : "editorial";
  // Canonical five destinations; older source bottomNav arrays are migrated in-memory.
  // Historic #check/#map links and device-local checks remain usable.
  data.ui.bottomNav = ["now", "trip", "map", "places", "more"];
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
  const activeView = state.view === "check" ? "more" : state.view;
  bottomNav.style.setProperty("--nav-count", views.length);
  bottomNav.innerHTML = views.map((view) => `
    <button class="nav-item ${activeView === view ? "active" : ""}" data-view="${view}" type="button" aria-current="${activeView === view ? "page" : "false"}">
      <span class="nav-icon">${VIEW_META[view].icon}</span><span>${VIEW_META[view].label}</span>
    </button>`).join("");
  bottomNav.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.view === "places") state.selectedPlaceId = null;
      setView(button.dataset.view);
    });
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

function checkProgress() {
  const todos = state.data.todos || [];
  const groups = state.data.checklists || [];
  const total = todos.length + groups.reduce((sum, group) => sum + (group.items?.length || 0), 0);
  const done = todos.filter((item) => state.todos[item.id]).length +
    groups.reduce((sum, group) => sum + (group.items || []).filter((item) =>
      state.checks[checkKey(group.id, item.id)]).length, 0);
  return { done, total };
}

function checklistsMarkup() {
  const todos = state.data.todos.length
    ? `<section class="panel check-group"><div class="check-title-row"><h2>To-dos</h2><span data-check-count="todos"></span></div>${state.data.todos.map((item) =>
      `<label class="check-item"><input type="checkbox" data-todo-key="${escapeAttr(item.id)}" ${state.todos[item.id] ? "checked" : ""}/><span class="checkbox-ui">✓</span><span class="check-label"><strong>${escapeHtml(item.label || item.title)}</strong></span></label>`).join("")}</section>` : "";
  const groups = state.data.checklists.map((group) =>
    `<section class="panel check-group"><div class="check-title-row"><h2>${escapeHtml(group.title)}</h2><span data-check-count="${escapeAttr(group.id)}"></span></div>${(group.items || []).map((item) => {
      const key = checkKey(group.id, item.id);
      return `<label class="check-item"><input type="checkbox" data-check-key="${escapeAttr(key)}" ${state.checks[key] ? "checked" : ""}/><span class="checkbox-ui">✓</span><span class="check-label">${escapeHtml(item.label)}</span></label>`;
    }).join("")}</section>`).join("");
  return todos + groups || '<section class="panel empty-state"><p>No checklists yet.</p></section>';
}

function updateCheckCounters() {
  const progress = checkProgress();
  root.querySelectorAll("[data-check-progress]").forEach((node) => {
    node.textContent = progress.done + "/" + progress.total;
  });
  for (const group of state.data.checklists) {
    const done = (group.items || []).filter((item) => state.checks[checkKey(group.id, item.id)]).length;
    root.querySelectorAll("[data-check-count]").forEach((node) => {
      if (node.dataset.checkCount === group.id) node.textContent = done + "/" + (group.items || []).length;
    });
  }
  const todoCount = state.data.todos.filter((item) => state.todos[item.id]).length;
  root.querySelectorAll("[data-check-count='todos']").forEach((node) => {
    node.textContent = todoCount + "/" + state.data.todos.length;
  });
}

function attachCheckHandlers() {
  root.querySelectorAll("[data-check-key]").forEach((input) => input.addEventListener("change", async () => {
    state.checks[input.dataset.checkKey] = input.checked;
    updateCheckCounters();
    await TravelLiteStorage.set(tripKey("checks"), state.checks);
  }));
  root.querySelectorAll("[data-todo-key]").forEach((input) => input.addEventListener("change", async () => {
    state.todos[input.dataset.todoKey] = input.checked;
    updateCheckCounters();
    await TravelLiteStorage.set(tripKey("todos"), state.todos);
  }));
  updateCheckCounters();
}

function renderCheck() {
  // Legacy #check bookmarks remain functional; the visible primary entry moved to More.
  const isZh = /^zh/i.test(state.data.ui.locale || "");
  root.innerHTML = `<div class="view-stack"><button class="button-link" type="button" data-open-more>← ${isZh ? "更多" : "More"}</button><p class="eyebrow">${isZh ? "準備與清單 · 僅此裝置" : "Preparation & checklists · This device only"}</p>${checklistsMarkup()}</div>`;
  attachCheckHandlers();
  root.querySelector("[data-open-more]")?.addEventListener("click", () => setView("more"));
}

function money(value, currency) {
  if (value == null || Number.isNaN(Number(value))) return "";
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(Number(value)); }
  catch { return `${currency || ""} ${value}`.trim(); }
}

function detailsSection(title, count, body, open = false) {
  if (!count) return "";
  return `<details class="panel more-section" data-surface-role="section" ${open ? "open" : ""}><summary><span>${escapeHtml(title)}</span><span class="summary-count">${count}</span></summary><div class="more-body">${body}</div></details>`;
}

function travelEssentialsSection(rawEntries, label, zh = false) {
  const safeHttp = (raw) => {
    if (typeof raw !== "string" || !/^https?:\/\/[^/]/i.test(raw.trim())) return "";
    try { return new URL(raw).href; } catch { return ""; }
  };
  const entries = (Array.isArray(rawEntries) ? rawEntries : []).filter((entry) =>
    entry && typeof entry.title === "string" && entry.title.trim() &&
    (typeof (entry.body || entry.summary) === "string" ||
      (Array.isArray(entry.sourceLinks) && entry.sourceLinks.length)));
  if (!entries.length) return "";
  let hasLinks = false;
  const html = entries.map((entry) => {
    const sourceLinks = (Array.isArray(entry.sourceLinks) ? entry.sourceLinks : []).flatMap((source) => {
      const url = safeHttp(source?.url);
      if (!url || typeof source.label !== "string" || !source.label.trim()) return [];
      hasLinks = true;
      return ['<a class="inline-link" href="' + escapeAttr(url) +
        '" target="_blank" rel="noopener noreferrer">' + escapeHtml(source.label) + ' ↗</a>'];
    }).join("");
    const category = typeof entry.category === "string" ? entry.category : "";
    const day = typeof entry.dayDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.dayDate)
      ? entry.dayDate : "";
    const researched = typeof entry.checkedAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.checkedAt)
      ? entry.checkedAt : "";
    const meta = [category, day].filter(Boolean).join(" · ");
    return '<article class="text-card travel-essential" data-surface-role="reading-row">' +
      (meta ? '<p class="eyebrow">' + escapeHtml(meta) + '</p>' : "") +
      '<h3>' + escapeHtml(entry.title) + '</h3>' +
      (entry.body || entry.summary ? '<p>' + escapeHtml(entry.body || entry.summary) + '</p>' : "") +
      (researched ? '<small>' + (zh ? "資料核對" : "Researched") + ' · ' + escapeHtml(researched) + '</small>' : "") +
      (sourceLinks ? '<div class="action-row">' + sourceLinks + '</div>' : "") +
      '</article>';
  }).join("");
  return detailsSection(label, entries.length, html +
    (hasLinks ? '<p class="helper-text">' +
      (zh ? "外部連結需連線；請以業者最新資訊為準。" : "External links need Internet; confirm live details with the provider.") +
      '</p>' : ""));
}

// Native modal dialog provides browser-managed focus trapping and Escape.
// At narrow widths it is a bottom sheet; on desktop a right-side drawer.
// The underlying app remains untouched and inert while the chooser is open.
function ensureStylePickerDialog(markup, selectedChoice, origin) {
  let dialog = document.getElementById("style-picker-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "style-picker-dialog";
    dialog.className = "style-picker-dialog";
    dialog.setAttribute("aria-labelledby", "style-picker-title");
    dialog.setAttribute("aria-describedby", "style-picker-description");
    document.body.appendChild(dialog);
    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("style-picker-is-open");
      if (state.view === "more") {
        root.querySelector("[data-style-picker-open]")?.focus({ preventScroll: true });
      }
    });
    dialog.addEventListener("click", async (event) => {
      const close = event.target.closest("[data-style-picker-close]");
      if (close) {
        dialog.close();
        return;
      }
      if (event.target === dialog) {
        const area = dialog.getBoundingClientRect();
        if (event.clientX < area.left || event.clientX > area.right ||
            event.clientY < area.top || event.clientY > area.bottom) {
          dialog.close();
        }
        return;
      }
      const button = event.target.closest("[data-style-choice], [data-style-reset]");
      if (!button || dialog.dataset.busy === "true") return;
      dialog.dataset.busy = "true";
      button.disabled = true;
      const choice = button.hasAttribute("data-style-reset")
        ? "default" : button.dataset.styleChoice;
      let preserveDesktopFocus = false;
      try {
        const saved = await chooseLocalStyle(choice);
        if (saved && window.matchMedia("(max-width: 767px)").matches) {
          // A bottom sheet obscures the result. Close it after a selection so
          // the traveller immediately sees the chosen style on their trip.
          dialog.close();
        } else if (saved) {
          preserveDesktopFocus = true;
        }
      } finally {
        button.disabled = false;
        delete dialog.dataset.busy;
        // Focusing a disabled button silently fails. Restore focus only now.
        if (preserveDesktopFocus && dialog.open) button.focus({ preventScroll: true });
      }
    });
  }

  // A style switch can render More again while this same dialog is open.
  // Preserve its scroll position and selected keyboard focus in that case.
  if (!dialog.open) dialog.innerHTML = markup;
  dialog.querySelectorAll("[data-style-choice]").forEach((option) => {
    option.setAttribute("aria-pressed", String(option.dataset.styleChoice === selectedChoice));
  });
  dialog.querySelector("[data-style-reset]")?.setAttribute(
    "aria-pressed", String(state.styleSource === "trip"));
  const status = dialog.querySelector(".style-source");
  if (status) status.textContent = origin;
  return dialog;
}

function renderMore() {
  const moreZh = /^zh/i.test(state.data.ui.locale || "");
  const labelMore = (english, chinese) => moreZh ? chinese : english;
  const progress = checkProgress();
  const preparation = `<details class="panel more-section preparation-section" data-surface-role="section" data-preparation><summary><span>${escapeHtml(labelMore("Preparation & checklists", "準備與清單"))} <small class="device-only-tag">${escapeHtml(labelMore("this device", "僅此裝置"))}</small></span><span class="summary-count" data-check-progress>${progress.done}/${progress.total}</span></summary><div class="preparation-body">${checklistsMarkup()}</div></details>`;
  const reservations = state.data.reservations.map((item) => `<article class="info-row" data-surface-role="reading-row"><div><span class="type-pill">${escapeHtml(item.type || "booking")}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml([item.date ? prettyDate(item.date) : "", item.time || "", item.location || ""].filter(Boolean).join(" · "))}</p>${item.status ? `<small>${escapeHtml(item.status)}</small>` : ""}</div>${safePublishedUrl(item.url) ? `<a class="inline-link" href="${escapeAttr(safePublishedUrl(item.url))}" target="_blank" rel="noopener noreferrer">Open ↗</a>` : ""}</article>`).join("");
  const total = state.data.costs.entries.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const costs = `<div class="cost-total"><span>Total</span><strong>${money(total, state.data.costs.currency)}</strong></div>${state.data.costs.entries.map((item) => `<article class="info-row compact-row" data-surface-role="reading-row"><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.category || "")}${item.date ? ` · ${prettyDate(item.date)}` : ""}</p></div><strong>${money(item.amount, item.currency || state.data.costs.currency)}</strong></article>`).join("")}`;
  const notes = state.data.notes.map((note) => `<article class="text-card" data-surface-role="reading-row"><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.body)}</p></article>`).join("");
  const files = state.data.files.map((file) => {
    const label = `<span><strong>${escapeHtml(file.title)}</strong><small>${escapeHtml(file.type || "file")}</small></span>`;
    const url = safePublishedUrl(file.url);
    return url ? `<a class="file-row" data-surface-role="reading-row" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${label}<span>↗</span></a>`
      : `<div class="file-row" data-surface-role="reading-row">${label}</div>`;
  }).join("");
  const contacts = state.data.contacts.map((contact) => `<article class="info-row compact-row" data-surface-role="reading-row"><div><h3>${escapeHtml(contact.name)}</h3><p>${escapeHtml(contact.role || "")}</p></div>${contact.phone ? `<a class="inline-link" href="tel:${escapeAttr(contact.phone)}">${escapeHtml(contact.phone)}</a>` : ""}</article>`).join("");
  const journal = state.data.journal.map((entry) => `<article class="text-card" data-surface-role="reading-row"><p class="eyebrow">${escapeHtml(entry.date ? prettyDate(entry.date, { weekday: "short" }) : entry.mood || "Journal")}</p><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.body)}</p></article>`).join("");
  const links = state.data.links.map((link) => {
    const url = safePublishedUrl(link.url);
    return url ? `<a class="file-row" data-surface-role="reading-row" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer"><span><strong>${escapeHtml(link.label)}</strong></span><span>↗</span></a>`
      : `<div class="file-row" data-surface-role="reading-row"><span><strong>${escapeHtml(link.label)}</strong></span></div>`;
  }).join("");
  const names = {
    "editorial-light": "Editorial Light", "editorial-dark": "Editorial Dark",
    storybook: "Storybook", candy: "Candy Geometry",
    "paper-collage": "Paper Collage", "naive-city": "Naive City Sketch",
    risograph: "Risograph Zine", "taiwan-poster": "Taiwan Retro Poster",
    "field-stamp": "Field Stamp",
    "quiet-linocut": "Quiet Linocut",
    "doodle-memory-grid": "Doodle Memory Grid",
    "crayon-journal": "Crayon Journal",
    "painterly-editorial": "Painterly Editorial",
    "geometric-print": "Geometric Print",
    "quiet-acrylic": "Quiet Acrylic",
    "vintage-watercolor": "Vintage Watercolor",
  };
  const choices = [
    "editorial-light", "editorial-dark", "storybook", "candy", "paper-collage",
    "naive-city", "risograph", "taiwan-poster", "field-stamp",
    "quiet-linocut", "doodle-memory-grid", "crayon-journal", "painterly-editorial", "geometric-print", "quiet-acrylic", "vintage-watercolor",
  ];
  const isZh = /^zh/i.test(state.data.ui.locale || "");
  const descriptions = {
    "editorial-light": isZh ? "經典編輯 · 淺色" : "Classic · light",
    "editorial-dark": isZh ? "經典編輯 · 深色" : "Classic · dark",
    storybook: isZh ? "日系繪本 · 插畫" : "Picture book · illustrated",
    candy: isZh ? "糖果色塊 · 圓潤" : "Pastel · rounded stickers",
    "paper-collage": isZh ? "層疊剪紙 · 紙雕" : "Layered cutout · cardstock",
    "naive-city": isZh ? "歐洲手繪 · 水粉" : "Hand-drawn · gouache",
    risograph: isZh ? "孔版印刷 · 復古" : "Print · indigo grain",
    "taiwan-poster": isZh ? "台灣海報 · 網印" : "Retro poster · screenprint",
    "field-stamp": isZh ? "田野印章 · 手刻" : "Field notes · carved stamp",
    "quiet-linocut": isZh ? "極簡版刻 · 安靜留白" : "Linocut · quiet margins",
    "doodle-memory-grid": isZh ? "九宮格 · 手繪塗鴉" : "Nine-grid · doodle journal",
    "crayon-journal": isZh ? "蠟筆日記 · 小場景" : "Crayon · mini memory",
    "painterly-editorial": isZh ? "水粉筆觸 · 柔彩" : "Gouache · airy editorial",
    "geometric-print": isZh ? "硬邊幾何 · 色版" : "Hard-edge · flat polygons",
    "quiet-acrylic": isZh ? "留白小主體 · 細線" : "Sparse · acrylic cover",
    "vintage-watercolor": isZh ? "復古水彩 · 古典旅行手冊" : "Archival · watercolor guide",
  };
  const defaultStyle = VISUAL_STYLES.has(state.data.ui.visualStyle)
    ? state.data.ui.visualStyle : "editorial";
  const defaultAppearance = defaultStyle === "editorial"
    ? (state.data.ui.theme === "dark" ? "editorial-dark" : "editorial-light")
    : defaultStyle;
  const selectedChoice = state.visualStyle === "editorial"
    ? ((state.theme === "dark" || (state.theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches))
      ? "editorial-dark" : "editorial-light")
    : state.visualStyle;
  const optionMarkup = choices.map(id => `<button type="button"
    class="style-option" data-style-choice="${id}" aria-pressed="${selectedChoice === id}">
      <span class="style-preview style-preview--${id}" aria-hidden="true">
        <span></span><span></span><span></span>
      </span>
      <strong>${names[id]}</strong><small>${descriptions[id]}</small>
    </button>`).join("");
  const origin = state.styleSource === "preview"
    ? (isZh ? "目前為連結預覽；點選風格可保存在本裝置。" :
        "Previewing a link. Choose a style to save it on this device.")
    : state.styleSource === "device"
      ? (isZh ? "已儲存在此裝置，不影響同行者。" :
          "Saved on this device; other travellers are unaffected.")
      : (isZh ? "目前使用共用行程的預設風格。" :
          "Following the published trip's default.");
  const styleChooser = `<section class="panel settings-card style-settings">
    <button type="button" class="style-picker-trigger" data-style-picker-open
      aria-haspopup="dialog" aria-controls="style-picker-dialog">
      <span class="style-preview style-preview--${selectedChoice}" aria-hidden="true">
        <span></span><span></span><span></span>
      </span>
      <span class="style-picker-trigger-copy">
        <span class="eyebrow">Appearance / 外觀</span>
        <strong>${names[selectedChoice]}</strong>
        <small>${isZh ? "切換網站風格" : "Change visual style"}</small>
      </span>
      <span class="style-picker-trigger-action" aria-hidden="true">
        ${isZh ? "選擇" : "Choose"} <span>→</span>
      </span>
    </button>
    <p class="helper-text style-source" role="status">${origin}</p>
  </section>`;
  const dialogMarkup = `<div class="style-picker-header">
    <div>
      <span class="style-picker-handle" aria-hidden="true"></span>
      <p class="eyebrow">Appearance / 外觀</p>
      <h2 id="style-picker-title">${isZh ? "切換網站風格" : "Choose a visual style"}</h2>
      <p id="style-picker-description" class="helper-text">
        ${isZh ? "共 16 種外觀，只更改本裝置。選擇後可立即預覽。" :
          "16 looks. Changes apply only on this device."}
      </p>
    </div>
    <button type="button" class="style-picker-close" data-style-picker-close
      aria-label="${isZh ? "關閉風格選擇" : "Close style picker"}">×</button>
  </div>
  <div class="style-picker-scroll" role="region"
    aria-label="${isZh ? "所有風格選項" : "All visual style choices"}">
    <div class="style-options" role="group"
      aria-label="${isZh ? "十六種可選網站外觀" : "Sixteen available appearances"}">
      ${optionMarkup}
    </div>
  </div>
  <div class="style-picker-footer">
    <button class="style-reset-button" type="button" data-style-reset
      aria-pressed="${state.styleSource === "trip"}">
      ${isZh ? "跟隨行程預設" : "Follow trip default"} · ${names[defaultAppearance]}
    </button>
    <button type="button" class="style-picker-done" data-style-picker-close>
      ${isZh ? "完成" : "Done"}
    </button>
    <p class="helper-text style-source" role="status">${origin}</p>
  </div>`;
  const appearance = isFixedLightStyle()
    ? `<section class="panel settings-card">
        <div><p class="eyebrow">Appearance</p><h2>${names[state.visualStyle]} · Light only</h2></div>
        ${hasIllustrationMotion() ? `<p class="helper-text">Gentle illustration animation respects your device accessibility settings.</p>
        <div class="motion-preference">
          <h3>Motion / 動態效果</h3>
          <div class="motion-options" role="group" aria-label="Motion preference">
            ${[["system", "Follow device · 跟隨裝置"], ["reduce", "Reduce motion · 減少動畫"]]
              .map(([mode, label]) => `<button type="button" class="motion-choice" data-motion-choice="${mode}" aria-pressed="${window.TravelLiteStorybookMotion?.get() === mode}">${label}</button>`).join("")}
          </div>
        </div>` : `<p class="helper-text">Static print-inspired design. No illustration animations.</p>`}
        <div class="storage-status"><span>Local storage</span><strong id="storage-mode">${escapeHtml(TravelLiteStorage.getMode())}</strong></div>
      </section>`
    : `<section class="panel settings-card"><div><p class="eyebrow">Appearance</p><h2>Theme</h2></div><div class="theme-switcher">${["system", "dark", "light"].map((theme) => `<button type="button" data-theme="${theme}" class="theme-button ${state.theme === theme ? "active" : ""}">${theme}</button>`).join("")}</div><div class="storage-status"><span>Local storage</span><strong id="storage-mode">${escapeHtml(TravelLiteStorage.getMode())}</strong></div></section>`;
  root.innerHTML = `<div class="view-stack">
    ${preparation}
    <section class="panel local-note-card"><div class="check-title-row"><h2>Personal note</h2><span>this device</span></div><textarea id="personal-note" rows="4" placeholder="Gate change, room number, quick memo…">${escapeHtml(state.personalNote)}</textarea><p class="helper-text">Saved locally in IndexedDB; falls back to localStorage if needed.</p></section>
    ${travelEssentialsSection(state.data.essentials, labelMore("Travel Essentials", "行前與交通指南"), moreZh)}
    ${detailsSection(labelMore("Reservations", "預約與票券"), state.data.reservations.length, reservations, true)}
    ${detailsSection(labelMore("Costs", "費用"), state.data.costs.entries.length, costs)}
    ${detailsSection(labelMore("Trip notes", "旅程備註"), state.data.notes.length, notes)}
    ${detailsSection(labelMore("Files & tickets", "文件與票券"), state.data.files.length, files)}
    ${detailsSection(labelMore("Contacts", "聯絡資訊"), state.data.contacts.length, contacts)}
    ${detailsSection(labelMore("Journal", "旅程日記"), state.data.journal.length, journal)}
    ${detailsSection(labelMore("Links", "實用連結"), state.data.links.length, links)}
    ${styleChooser}
    ${appearance}
  </div>`;
  const dialog = ensureStylePickerDialog(dialogMarkup, selectedChoice, origin);
  root.querySelector("[data-style-picker-open]")?.addEventListener("click", () => {
    if (dialog.open) return;
    dialog.showModal();
    document.documentElement.classList.add("style-picker-is-open");
    const selected = dialog.querySelector('[data-style-choice="' + selectedChoice + '"]');
    selected?.focus({ preventScroll: true });
    selected?.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
  attachCheckHandlers();
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
  root.querySelectorAll("[data-motion-choice]").forEach((button) => button.addEventListener("click", () => {
    if (!window.TravelLiteStorybookMotion?.set(button.dataset.motionChoice)) return;
    root.querySelectorAll("[data-motion-choice]").forEach((choice) =>
      choice.setAttribute("aria-pressed", String(choice.dataset.motionChoice === window.TravelLiteStorybookMotion.get())));
  }));
}

function applyTheme() {
  const mode = isFixedLightStyle() ? "light" : state.theme;
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode === "system" ? "light dark" : mode;
}

function render() {
  renderNav();
  if (state.view === "trip") renderTrip();
  else if (state.view === "map") renderMap();
  else if (state.view === "places") window.TravelLitePlaces?.render();
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

function hydrateTripCover(trip) {
  document.querySelector("#trip-cover")?.remove();
  if (!trip.cover) return;

  const host = document.querySelector(".trip-header > div:first-child");
  if (!host) return;

  const figure = document.createElement("figure");
  figure.id = "trip-cover";
  figure.className = "trip-cover";
  figure.dataset.focalPoint = trip.cover.focalPoint;

  const image = document.createElement("img");
  image.src = trip.cover.src;
  image.alt = trip.cover.alt;
  image.decoding = "async";
  image.addEventListener("load", () => figure.classList.add("is-loaded"), { once: true });
  image.addEventListener("error", () => figure.remove(), { once: true });

  figure.appendChild(image);
  host.appendChild(figure);
}

function hydrateHeader() {
  const { trip } = state.data;
  document.title = `${trip.title} · Travel Lite`;
  document.documentElement.style.setProperty("--accent", trip.accent);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isFixedLightStyle() ? packThemeColor() : (trip.themeColor || "#0b1020"));
  document.querySelector("#trip-location").textContent = trip.homeLabel || "Travel Lite";
  document.querySelector("#trip-title").textContent = trip.title;
  document.querySelector("#trip-meta").textContent = `${trip.subtitle || ""}${trip.subtitle ? " · " : ""}${dateRangeLabel(trip)}`;
  hydrateTripCover(trip);
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
  const migratedView = storedView === "check" ? "more" : storedView;
  state.view = allowedViews.includes(migratedView) ? migratedView : defaultView;
  state.selectedDate = state.data.days.some((day) => day.date === storedDate) ? storedDate : (state.data.days.some((day) => day.date === today) ? today : state.data.trip.startDate);
  state.checks = (await TravelLiteStorage.get(tripKey("checks"))) || {};
  state.todos = (await TravelLiteStorage.get(tripKey("todos"))) || {};
  state.personalNote = (await TravelLiteStorage.get(tripKey("personalNote"))) || "";
  state.theme = (await TravelLiteStorage.get(tripKey("theme"))) || state.data.ui.theme || "system";

  // Pre-site-scoping keys have no reliable site identity. Never auto-import
  // them: another trip hosted on the same origin may have written them.
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
    const storedStyle = await TravelLiteStorage.get(tripKey("visualStyle"));
    state.stylePreference = VISUAL_STYLES.has(storedStyle) ? storedStyle : null;
    activateVisualStyle();
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
