/* Passive theme presentation: one Style Picker owns colour selection.
 * Keep map colours and browser chrome in sync without a second theme button.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  "use strict";
  const modes = ["system", "light", "dark"];
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const defaultAccent = "#4f6f5e";
  let rememberedLightMapStyle = null;
  function currentMode() {
    if (typeof isFixedLightStyle === "function" && isFixedLightStyle()) return "light";
    const mode = document.documentElement.dataset.theme;
    return modes.includes(mode) ? mode : "light";
  }
  function effectiveMode() {
    return currentMode() === "system" ? (media.matches ? "dark" : "light") : currentMode();
  }
  function syncThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const fixed = typeof isFixedLightStyle === "function" && isFixedLightStyle();
    const tripColor = typeof state !== "undefined" ? state.data?.trip?.themeColor : null;
    meta.setAttribute("content", fixed && typeof packThemeColor === "function" ? packThemeColor()
      : effectiveMode() === "dark" ? "#0b1020" : (tripColor || "#f5f6f2"));
  }
  function syncAccent() {
    if (typeof state !== "undefined" && state?.data)
      document.documentElement.style.setProperty("--accent", state.data.trip?.accent || defaultAccent);
  }
  function syncMapStyle() {
    if (typeof state === "undefined" || !state?.data) return;
    state.data.providers ||= {};
    const providers = state.data.providers;
    const defaults = typeof TravelLiteProviders !== "undefined" ? TravelLiteProviders.config() : {};
    if (!rememberedLightMapStyle)
      rememberedLightMapStyle = providers.mapStyleLight || providers.mapStyle || defaults.mapStyleLight || defaults.mapStyle;
    providers.mapStyle = effectiveMode() === "dark"
      ? (providers.mapStyleDark || defaults.mapStyleDark || rememberedLightMapStyle)
      : (providers.mapStyleLight || rememberedLightMapStyle || defaults.mapStyleLight || defaults.mapStyle);
  }
  function sync() { syncThemeColor(); syncAccent(); syncMapStyle(); }
  function rerenderMapIfVisible() {
    if (typeof state !== "undefined" && state?.view === "map" && typeof renderMap === "function") renderMap();
  }
  function install() {
    // Do not create #quick-theme-toggle or a second set of theme controls.
    // Editorial Light and Editorial Dark are already selectable in More.
    document.querySelector("#quick-theme-toggle")?.remove();
    new MutationObserver(sync).observe(document.documentElement, {
      attributes: true, attributeFilter: ["data-theme", "data-visual-style"]
    });
    media.addEventListener?.("change", () => {
      sync();
      if (currentMode() === "system") rerenderMapIfVisible();
    });
    window.addEventListener("travel-lite-style-changed", () => { sync(); rerenderMapIfVisible(); });
    const ready = () => { sync(); rerenderMapIfVisible(); };
    if (typeof state !== "undefined" && state?.ready) ready();
    else window.addEventListener("travel-lite-ready", ready, {once:true});
    sync();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
})();
