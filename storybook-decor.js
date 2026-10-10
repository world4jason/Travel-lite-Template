/* Artwork selection for the opt-in Storybook style.
   Only explicit artwork keys and structured trip metadata are read.
   It never guesses from title text, URL, location, or personal preferences.
   SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const root = document.querySelector("#view-root");
  if (!root) return;

  const art = new Set(["map", "city", "plane", "car", "boat", "train", "food",
    "hotel", "landmark", "nature", "sea"]);
  const transportArt = { flight: "plane", drive: "car", boat: "boat",
    train: "train", bus: "car", walk: "map" };

  function validArt(key, fallback = "map") {
    return typeof key === "string" && art.has(key) ? key : fallback;
  }
  function itemArt(item) {
    if (art.has(item?.illustration)) return item.illustration;
    if (Object.hasOwn(transportArt, item?.transportMode)) return transportArt[item.transportMode];
    if (["food", "cafe", "meal"].includes(item?.type)) return "food";
    if (["stay", "hotel"].includes(item?.type)) return "hotel";
    return "map";
  }
  function decorate() {
    scheduled = false;
    if (typeof isStorybook !== "function" || !isStorybook() || !state?.data) return;
    const allDays = state.data.days || [];
    const byDate = new Map(allDays.map(day => [day.date, day]));

    const neutralDayArt = ["city", "nature", "map"];
    root.querySelectorAll(".trip-overview-day[data-trip-day]").forEach((button, index) => {
      const day = byDate.get(button.dataset.tripDay);
      button.dataset.storybookArt = validArt(day?.illustration, neutralDayArt[index % neutralDayArt.length]);
    });
    root.querySelectorAll(".trip-highlight-card").forEach((card, index) => {
      card.dataset.storybookArt = validArt(state.data.highlights?.[index]?.illustration, "nature");
    });
    root.querySelectorAll(".trip-open-decision").forEach(card => {
      card.dataset.storybookArt = "map";
    });

    const selectedDate = root.querySelector(".trip-v2-tabs [data-trip-day].active")?.dataset.tripDay;
    const selectedDay = byDate.get(selectedDate);
    const header = root.querySelector(".trip-day-view > .day-summary");
    if (header) header.dataset.storybookArt = validArt(selectedDay?.illustration, "city");
    root.querySelectorAll(".trip-v2-timeline > .trip-stop-wrap > .trip-v2-item").forEach((card, index) => {
      card.dataset.storybookKind = itemArt(selectedDay?.items?.[index]);
    });
  }

  let scheduled = false;
  function schedule() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(decorate);
    }
  }

  // Observe child replacement, not attribute mutations made by decorate().
  new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  window.addEventListener("travel-lite-ready", schedule);
  schedule();
})();
