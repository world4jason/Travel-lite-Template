const state = {
  data: null,
  view: "now",
  selectedDate: null,
  checklist: {},
};

const root = document.querySelector("#view-root");
const navButtons = [...document.querySelectorAll(".nav-item")];

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function zonedNow(timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
    minuteOfDay: Number(values.hour) * 60 + Number(values.minute),
  };
}

function toMinutes(time = "00:00") {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function prettyDate(dateString, options = {}) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...options,
  }).format(date);
}

function dateRangeLabel(trip) {
  return `${prettyDate(trip.startDate)} – ${prettyDate(trip.endDate, { year: "numeric" })}`;
}

function dayDiff(from, to) {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

function checklistStorageKey() {
  return `travel-lite:${state.data.trip.id}:checks`;
}

function loadChecklistState() {
  try {
    state.checklist = JSON.parse(localStorage.getItem(checklistStorageKey()) || "{}") || {};
  } catch {
    state.checklist = {};
  }
}

function saveChecklistState() {
  localStorage.setItem(checklistStorageKey(), JSON.stringify(state.checklist));
}

function flattenItems() {
  return state.data.days.flatMap((day) =>
    day.items.map((item, index) => ({ ...item, date: day.date, dayTitle: day.title, index }))
  );
}

function getNowContext() {
  const { trip, days } = state.data;
  const now = zonedNow(trip.timezone);
  const today = days.find((day) => day.date === now.date);
  const all = flattenItems();

  if (now.date < trip.startDate) {
    return { phase: "before", now, daysUntil: dayDiff(now.date, trip.startDate), next: all[0] || null };
  }

  if (now.date > trip.endDate) {
    return { phase: "after", now, today: null, current: null, next: null };
  }

  let current = null;
  let next = null;

  if (today) {
    current = today.items.find((item) => {
      const start = toMinutes(item.start);
      const end = toMinutes(item.end || item.start);
      return now.minuteOfDay >= start && now.minuteOfDay < end;
    }) || null;
  }

  next = all.find((item) => {
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

function itemActions(item) {
  if (!item?.mapsUrl) return "";
  return `<div class="action-row"><a class="button-link primary" href="${escapeHtml(item.mapsUrl)}" target="_blank" rel="noreferrer">Open map ↗</a></div>`;
}

function nextCard(label, item) {
  return `
    <section class="panel next-card">
      <div class="time-pill">${escapeHtml(item.start)}</div>
      <div>
        <p class="eyebrow">${escapeHtml(label)}</p>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.location || item.dayTitle || "")}</p>
        ${item.mapsUrl ? `<a class="inline-link" href="${escapeHtml(item.mapsUrl)}" target="_blank" rel="noreferrer">Directions ↗</a>` : ""}
      </div>
    </section>`;
}

function renderNow() {
  const context = getNowContext();

  if (context.phase === "before") {
    root.innerHTML = `
      <div class="view-stack">
        <section class="panel hero-card">
          <div class="status-row"><span class="status-dot upcoming"></span>Trip starts in ${context.daysUntil} day${context.daysUntil === 1 ? "" : "s"}</div>
          <h2 class="now-title">${escapeHtml(state.data.trip.title)}</h2>
          <p class="now-location">${dateRangeLabel(state.data.trip)}</p>
          <p class="now-note">Your trip data is ready. Use Check for pre-trip tasks and Trip to review the itinerary.</p>
        </section>
        ${context.next ? nextCard("First up", context.next) : ""}
      </div>`;
    return;
  }

  if (context.phase === "after") {
    root.innerHTML = `
      <section class="panel empty-state">
        <p class="eyebrow">Trip complete</p>
        <h2>${escapeHtml(state.data.trip.title)}</h2>
        <p>The itinerary remains available as a compact trip record.</p>
      </section>`;
    return;
  }

  const current = context.current;
  const today = context.today;
  const progress = today ? getDayProgress(today, context.now.minuteOfDay) : 0;

  root.innerHTML = `
    <div class="view-stack">
      <section class="panel hero-card">
        <div class="status-row"><span class="status-dot ${current ? "" : "upcoming"}"></span>${current ? "Happening now" : "Between activities"}</div>
        <h2 class="now-title">${escapeHtml(current?.title || today?.title || "Today")}</h2>
        <p class="now-location">${current ? `${escapeHtml(current.start)}–${escapeHtml(current.end || "")} · ${escapeHtml(current.location || "")}` : escapeHtml(today?.title || "No itinerary for today")}</p>
        ${current?.note ? `<p class="now-note">${escapeHtml(current.note)}</p>` : ""}
        ${itemActions(current)}
        ${today ? `
          <div class="progress-wrap">
            <div class="progress-meta"><span>${escapeHtml(today.label)} · ${escapeHtml(today.title)}</span><span>${progress}%</span></div>
            <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
          </div>` : ""}
      </section>
      ${context.next ? nextCard("Up next", context.next) : `
        <section class="panel next-card"><div class="time-pill">Done</div><div><h3>No more plans today</h3><p>Open Trip to review another day.</p></div></section>`}
    </div>`;
}

function renderTrip() {
  const currentDate = zonedNow(state.data.trip.timezone).date;
  const selected = state.data.days.find((day) => day.date === state.selectedDate) || state.data.days[0];
  state.selectedDate = selected?.date || null;

  const tabs = state.data.days.map((day) => `
    <button class="day-chip ${day.date === state.selectedDate ? "active" : ""}" type="button" data-date="${escapeHtml(day.date)}">
      <strong>${escapeHtml(day.label)}</strong>
      <small>${prettyDate(day.date)}</small>
    </button>`).join("");

  const timeline = selected.items.map((item) => {
    const now = zonedNow(state.data.trip.timezone);
    const isCurrent = selected.date === currentDate && now.minuteOfDay >= toMinutes(item.start) && now.minuteOfDay < toMinutes(item.end || item.start);
    return `
      <article class="timeline-item ${isCurrent ? "current" : ""}">
        <div class="timeline-time">${escapeHtml(item.start)}</div>
        <div class="timeline-rail"><div class="timeline-dot"></div></div>
        <div class="timeline-content">
          <h3>${escapeHtml(item.title)}</h3>
          ${item.location ? `<p>${escapeHtml(item.location)}</p>` : ""}
          ${item.note ? `<p class="timeline-note">${escapeHtml(item.note)}</p>` : ""}
          ${item.mapsUrl ? `<a class="inline-link" href="${escapeHtml(item.mapsUrl)}" target="_blank" rel="noreferrer">Map ↗</a>` : ""}
        </div>
      </article>`;
  }).join("");

  root.innerHTML = `
    <div class="day-tabs" aria-label="Trip days">${tabs}</div>
    <section class="panel day-summary">
      <p class="eyebrow">${escapeHtml(selected.label)} · ${prettyDate(selected.date, { weekday: "short" })}</p>
      <h2>${escapeHtml(selected.title)}</h2>
      <p>${selected.items.length} planned stop${selected.items.length === 1 ? "" : "s"}</p>
    </section>
    <section class="panel timeline">${timeline || `<div class="empty-state"><p>No plans yet.</p></div>`}</section>`;

  root.querySelectorAll("[data-date]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDate = button.dataset.date;
      renderTrip();
    });
  });
}

function renderCheck() {
  const groups = state.data.checklists.map((group) => {
    const done = group.items.filter((item) => state.checklist[`${group.id}:${item.id}`]).length;
    const items = group.items.map((item) => {
      const key = `${group.id}:${item.id}`;
      const checked = Boolean(state.checklist[key]);
      return `
        <label class="check-item">
          <input type="checkbox" data-check-key="${escapeHtml(key)}" ${checked ? "checked" : ""} />
          <span class="checkbox-ui">✓</span>
          <span class="check-label">${escapeHtml(item.label)}</span>
        </label>`;
    }).join("");

    return `
      <section class="panel check-group">
        <div class="check-title-row">
          <h2>${escapeHtml(group.title)}</h2>
          <span>${done}/${group.items.length}</span>
        </div>
        ${items}
      </section>`;
  }).join("");

  root.innerHTML = `<div class="view-stack">${groups}</div>`;

  root.querySelectorAll("[data-check-key]").forEach((input) => {
    input.addEventListener("change", () => {
      state.checklist[input.dataset.checkKey] = input.checked;
      saveChecklistState();
      renderCheck();
    });
  });
}

function render() {
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === state.view));
  if (state.view === "trip") renderTrip();
  else if (state.view === "check") renderCheck();
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
  document.querySelector("#trip-location").textContent = trip.homeLabel || "Travel Lite";
  document.querySelector("#trip-title").textContent = trip.title;
  document.querySelector("#trip-meta").textContent = `${trip.subtitle || ""}${trip.subtitle ? " · " : ""}${dateRangeLabel(trip)}`;
  state.selectedDate = state.data.days.some((day) => day.date === zonedNow(trip.timezone).date)
    ? zonedNow(trip.timezone).date
    : trip.startDate;
}

async function boot() {
  try {
    const response = await fetch("./trip.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`trip.json returned ${response.status}`);
    state.data = await response.json();
    loadChecklistState();
    hydrateHeader();
    updateClock();
    render();
    setInterval(() => {
      updateClock();
      if (state.view === "now") renderNow();
    }, 30_000);
  } catch (error) {
    console.error(error);
    root.replaceChildren(document.querySelector("#error-template").content.cloneNode(true));
  }
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    render();
  });
});

boot();
