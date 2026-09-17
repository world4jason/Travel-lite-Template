/* Hierarchical trip timezone semantics. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const baseZonedNow = zonedNow;
  const formatterCache = new Map();
  const zoneValidity = new Map();

  function validTimeZone(timeZone) {
    if (!timeZone) return false;
    if (zoneValidity.has(timeZone)) return zoneValidity.get(timeZone);
    let valid = true;
    try { new Intl.DateTimeFormat("en", { timeZone }).format(new Date()); }
    catch { valid = false; }
    zoneValidity.set(timeZone, valid);
    return valid;
  }

  function tripTimeZone() {
    const configured = state?.data?.trip?.timezone;
    return validTimeZone(configured) ? configured : (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }

  function effectiveDayTimeZone(day) {
    return validTimeZone(day?.timezone) ? day.timezone : tripTimeZone();
  }

  function effectiveItemTimeZone(item, day) {
    return validTimeZone(item?.timezone) ? item.timezone : effectiveDayTimeZone(day);
  }

  function formatter(timeZone) {
    const key = String(timeZone || "UTC");
    if (!formatterCache.has(key)) {
      formatterCache.set(key, new Intl.DateTimeFormat("en-CA", {
        timeZone: key,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hourCycle: "h23",
      }));
    }
    return formatterCache.get(key);
  }

  function zonedPartsAt(epochMs, timeZone) {
    const zone = validTimeZone(timeZone) ? timeZone : tripTimeZone();
    const values = {};
    formatter(zone).formatToParts(new Date(epochMs)).forEach((part) => {
      if (part.type !== "literal") values[part.type] = part.value;
    });
    const year = Number(values.year), month = Number(values.month), day = Number(values.day);
    const hour = Number(values.hour), minute = Number(values.minute), second = Number(values.second || 0);
    return {
      year, month, day, hour, minute, second,
      date: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      minuteOfDay: hour * 60 + minute,
      timeZone: zone,
    };
  }

  function parseDate(dateString) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateString || ""));
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  }

  function parseTime(timeString) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(timeString || "").trim());
    if (!match) return null;
    const hour = Number(match[1]), minute = Number(match[2]);
    if (hour > 23 || minute > 59) return null;
    return { hour, minute };
  }

  function addDays(dateString, amount) {
    const date = parseDate(dateString);
    if (!date) return dateString;
    const utc = new Date(Date.UTC(date.year, date.month - 1, date.day + amount));
    return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
  }

  // Convert a local wall-clock date/time in an IANA zone to an absolute instant.
  // Intl is used instead of Temporal so the base template stays widely compatible.
  function localDateTimeToEpoch(dateString, timeString, timeZone) {
    const date = parseDate(dateString), time = parseTime(timeString);
    if (!date || !time || !validTimeZone(timeZone)) return Number.NaN;
    const wallUtc = Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute, 0, 0);
    let candidate = wallUtc;

    for (let i = 0; i < 4; i += 1) {
      const rendered = zonedPartsAt(candidate, timeZone);
      const renderedAsUtc = Date.UTC(rendered.year, rendered.month - 1, rendered.day, rendered.hour, rendered.minute, rendered.second || 0, 0);
      const next = wallUtc - (renderedAsUtc - candidate);
      if (Math.abs(next - candidate) < 1000) { candidate = next; break; }
      candidate = next;
    }

    const check = zonedPartsAt(candidate, timeZone);
    return check.date === dateString && check.hour === time.hour && check.minute === time.minute ? candidate : Number.NaN;
  }

  function dayStartEpoch(day) {
    return localDateTimeToEpoch(day?.date, "00:00", effectiveDayTimeZone(day));
  }

  function dayEndEpoch(day) {
    return localDateTimeToEpoch(addDays(day?.date, 1), "00:00", effectiveDayTimeZone(day));
  }

  function decorateItem(day, item, index) {
    const timeZone = effectiveItemTimeZone(item, day);
    const startEpoch = localDateTimeToEpoch(day.date, item?.start, timeZone);
    let endEpoch = Number.NaN;
    if (parseTime(item?.end)) {
      endEpoch = localDateTimeToEpoch(day.date, item.end, timeZone);
      if (Number.isFinite(startEpoch) && Number.isFinite(endEpoch) && endEpoch <= startEpoch) endEpoch += 24 * 60 * 60 * 1000;
    }
    return {
      ...item,
      date: day.date,
      dayId: day.id,
      dayTitle: day.title,
      index,
      timeZone,
      __day: day,
      __startEpoch: startEpoch,
      __endEpoch: endEpoch,
    };
  }

  function allDecoratedItems() {
    return (state?.data?.days || []).flatMap((day) => (day.items || []).map((item, index) => decorateItem(day, item, index)));
  }

  function timedTimeline() {
    const timed = allDecoratedItems().filter((item) => Number.isFinite(item.__startEpoch)).sort((a, b) => a.__startEpoch - b.__startEpoch);
    timed.forEach((item, index) => {
      if (Number.isFinite(item.__endEpoch)) return;
      const fallbackEnd = item.__startEpoch + 2 * 60 * 60 * 1000;
      const nextStart = timed[index + 1]?.__startEpoch;
      item.__endEpoch = Number.isFinite(nextStart) && nextStart > item.__startEpoch ? Math.min(fallbackEnd, nextStart) : fallbackEnd;
    });
    return timed;
  }

  function currentTripDay(epochMs = Date.now()) {
    const days = state?.data?.days || [];
    const candidates = days.filter((day) => zonedPartsAt(epochMs, effectiveDayTimeZone(day)).date === day.date);
    if (!candidates.length) return null;
    if (candidates.length === 1) return candidates[0];

    const currentItem = timedTimeline().filter((item) => item.__startEpoch <= epochMs && epochMs < item.__endEpoch).sort((a, b) => b.__startEpoch - a.__startEpoch)[0];
    if (currentItem && candidates.some((day) => day.id === currentItem.dayId)) return currentItem.__day;

    return candidates
      .map((day) => ({ day, start: dayStartEpoch(day) }))
      .filter((entry) => Number.isFinite(entry.start) && entry.start <= epochMs)
      .sort((a, b) => b.start - a.start)[0]?.day || candidates[0];
  }

  function selectedOrCurrentDay() {
    const selected = state?.data?.days?.find((day) => day.date === state.selectedDate);
    const current = currentTripDay();
    if (["trip", "map"].includes(state?.view) && selected) return selected;
    return current || selected || state?.data?.days?.[0] || null;
  }

  function displayTimeZone() {
    return effectiveDayTimeZone(selectedOrCurrentDay());
  }

  // Calls that previously asked for the single trip timezone now follow the current/selected trip day.
  const originalZonedNow = baseZonedNow;
  zonedNow = function timezoneAwareZonedNow(timeZone) {
    const requested = timeZone || tripTimeZone();
    if (state?.data && requested === state.data.trip.timezone) return zonedPartsAt(Date.now(), displayTimeZone());
    return zonedPartsAt(Date.now(), validTimeZone(requested) ? requested : tripTimeZone());
  };

  getDayProgress = function timezoneAwareDayProgress(day) {
    const nowMs = Date.now();
    const timed = (day?.items || []).map((item, index) => decorateItem(day, item, index)).filter((item) => Number.isFinite(item.__startEpoch)).sort((a, b) => a.__startEpoch - b.__startEpoch);
    if (!timed.length) return 0;
    timed.forEach((item, index) => {
      if (Number.isFinite(item.__endEpoch)) return;
      const next = timed[index + 1]?.__startEpoch;
      item.__endEpoch = Number.isFinite(next) ? Math.min(next, item.__startEpoch + 2 * 60 * 60 * 1000) : item.__startEpoch + 2 * 60 * 60 * 1000;
    });
    const completed = timed.filter((item) => item.__endEpoch <= nowMs).length;
    const active = timed.some((item) => item.__startEpoch <= nowMs && nowMs < item.__endEpoch);
    return Math.min(100, Math.round(((completed + (active ? 0.5 : 0)) / timed.length) * 100));
  };

  getNowContext = function timezoneAwareNowContext() {
    const { trip, days } = state.data;
    const nowMs = Date.now();
    const timeline = timedTimeline();
    const firstDay = days[0], lastDay = days[days.length - 1];
    const tripStart = firstDay ? dayStartEpoch(firstDay) : Number.NaN;
    const tripEnd = lastDay ? dayEndEpoch(lastDay) : Number.NaN;
    const all = allDecoratedItems();

    if (Number.isFinite(tripStart) && nowMs < tripStart) {
      const zone = effectiveDayTimeZone(firstDay);
      return {
        phase: "before",
        now: zonedPartsAt(nowMs, zone),
        daysUntil: Math.max(0, Math.ceil((tripStart - nowMs) / 86400000)),
        next: timeline[0] || all[0] || null,
      };
    }
    if (Number.isFinite(tripEnd) && nowMs >= tripEnd) {
      const zone = effectiveDayTimeZone(lastDay);
      return { phase: "after", now: zonedPartsAt(nowMs, zone), today: null, previous: timeline.at(-1) || null, current: null, next: null, later: [], floating: [] };
    }

    const active = timeline.filter((item) => item.__startEpoch <= nowMs && nowMs < item.__endEpoch).sort((a, b) => b.__startEpoch - a.__startEpoch)[0] || null;
    const previous = timeline.filter((item) => item.__startEpoch < (active?.__startEpoch ?? nowMs)).at(-1) || null;
    const future = timeline.filter((item) => item.__startEpoch > nowMs);
    const today = active?.__day || currentTripDay(nowMs) || previous?.__day || future[0]?.__day || null;
    const zone = effectiveDayTimeZone(today);
    const now = zonedPartsAt(nowMs, zone);

    const floating = today
      ? (today.items || []).map((item, index) => decorateItem(today, item, index)).filter((item) => !Number.isFinite(item.__startEpoch))
      : [];

    return {
      phase: "during",
      now,
      today,
      previous,
      current: active,
      next: future[0] || null,
      later: future.slice(1, 3),
      floating,
    };
  };

  updateClock = function timezoneAwareClock() {
    if (!state.data) return;
    const zone = displayTimeZone();
    const now = zonedPartsAt(Date.now(), zone);
    document.querySelector("#local-time").textContent = now.time;
    document.querySelector("#timezone-label").textContent = zone.replaceAll("_", " ");
  };

  window.TravelLiteTime = {
    validTimeZone,
    effectiveDayTimeZone,
    effectiveItemTimeZone,
    localDateTimeToEpoch,
    zonedPartsAt,
    currentTripDay,
    displayTimeZone,
    timedTimeline,
  };
})();
