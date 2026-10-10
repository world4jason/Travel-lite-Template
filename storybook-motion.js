/* Optional Storybook motion preference (device-local per trip).  SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const options = new Set(["system", "reduce"]);
  let selected = "system";
  let key = "";
  const storage = () => {
    try { return localStorage; } catch { return null; }
  };
  const apply = () => { document.documentElement.dataset.motion = selected; };

  window.TravelLiteStorybookMotion = Object.freeze({
    init(tripId) {
      if (typeof tripId !== "string" || !tripId.trim()) return;
      key = `travel-lite:${tripId}:storybook-motion`;
      let saved = null;
      try { saved = storage()?.getItem(key) || null; } catch {}
      selected = options.has(saved) ? saved : "system";
      apply();
    },
    get() { return selected; },
    isReduced() {
      return selected === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },
    set(next) {
      if (!key || !options.has(next)) return false;
      selected = next;
      try { storage()?.setItem(key, selected); } catch {}
      apply();
      return true;
    },
  });
})();
