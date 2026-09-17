/* Responsive-shell theme controls. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const MODES = ["system", "light", "dark"];
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const DEFAULT_ACCENT = "#4f6f5e";
  let button = null;
  let rememberedLightMapStyle = null;

  function currentMode() {
    const mode = document.documentElement.dataset.theme;
    return MODES.includes(mode) ? mode : "system";
  }

  function effectiveMode() {
    const mode = currentMode();
    if (mode !== "system") return mode;
    return media.matches ? "dark" : "light";
  }

  function updateThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute("content", effectiveMode() === "dark" ? "#111411" : "#f5f6f2");
  }

  function syncAccent() {
    if (typeof state === "undefined" || !state?.data) return;
    if (!state.data.trip?.accent) document.documentElement.style.setProperty("--accent", DEFAULT_ACCENT);
  }

  function syncMapStyle() {
    if (typeof state === "undefined" || !state?.data) return;
    state.data.providers ||= {};
    const providers = state.data.providers;
    const defaults = typeof TravelLiteProviders !== "undefined" ? TravelLiteProviders.config() : {};
    if (!rememberedLightMapStyle) {
      rememberedLightMapStyle = providers.mapStyleLight || providers.mapStyle || defaults.mapStyleLight || defaults.mapStyle;
    }
    if (effectiveMode() === "dark") {
      providers.mapStyle = providers.mapStyleDark || defaults.mapStyleDark || rememberedLightMapStyle;
    } else {
      providers.mapStyle = providers.mapStyleLight || rememberedLightMapStyle || defaults.mapStyleLight || defaults.mapStyle;
    }
  }

  function updateButton() {
    if (!button) return;
    const mode = currentMode();
    const effective = effectiveMode();
    const icon = effective === "dark" ? "☾" : "☀";
    const label = mode === "system" ? "Auto" : mode[0].toUpperCase() + mode.slice(1);
    button.innerHTML = `<span class="quick-theme-icon" aria-hidden="true">${icon}</span><span class="quick-theme-label">${label}</span>`;
    button.setAttribute("aria-label", `Theme: ${label}. Switch theme.`);
    button.title = `Theme: ${label}`;
    updateThemeColor();
    syncAccent();
    syncMapStyle();
  }

  function rerenderMapIfVisible() {
    if (typeof state !== "undefined" && state?.view === "map" && typeof renderMap === "function") renderMap();
  }

  async function setMode(mode) {
    if (!MODES.includes(mode)) return;
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode === "system" ? "light dark" : mode;

    if (typeof state !== "undefined") state.theme = mode;
    if (typeof TravelLiteStorage !== "undefined" && typeof tripKey === "function" && state?.data) {
      await TravelLiteStorage.set(tripKey("theme"), mode).catch(() => {});
    }

    updateButton();
    if (typeof state !== "undefined" && state?.view === "more" && typeof renderMore === "function") renderMore();
    else rerenderMapIfVisible();
  }

  function install() {
    if (document.querySelector("#quick-theme-toggle")) return;
    const header = document.querySelector(".trip-header");
    if (!header) return;

    const liveTime = header.querySelector(".live-time");
    const actions = document.createElement("div");
    actions.className = "header-actions";

    button = document.createElement("button");
    button.id = "quick-theme-toggle";
    button.className = "quick-theme-toggle";
    button.type = "button";
    button.addEventListener("click", () => {
      const mode = currentMode();
      const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      setMode(next);
    });

    actions.appendChild(button);
    if (liveTime) actions.appendChild(liveTime);
    header.appendChild(actions);

    new MutationObserver(updateButton).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    media.addEventListener?.("change", () => {
      updateButton();
      if (currentMode() === "system") rerenderMapIfVisible();
    });

    updateButton();
    const waitForTrip = window.setInterval(() => {
      if (typeof state !== "undefined" && state?.data) {
        window.clearInterval(waitForTrip);
        updateButton();
        rerenderMapIfVisible();
      }
    }, 100);
    window.setTimeout(() => window.clearInterval(waitForTrip), 5000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
})();
