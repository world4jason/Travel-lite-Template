/* Network/bootstrap status for the static companion. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const nativeFetch = window.fetch.bind(window);
  const lastNetworkKey = "travel-lite:last-network-trip-at";
  const status = window.TravelLiteRuntimeStatus = {
    tripSource: "loading",
    lastNetworkAt: localStorage.getItem(lastNetworkKey) || "",
    online: navigator.onLine,
  };

  function emit() {
    window.dispatchEvent(new CustomEvent("travel-lite-runtime-status", { detail: { ...status } }));
  }

  window.fetch = async (...args) => {
    const input = args[0];
    const rawUrl = typeof input === "string" ? input : input?.url || "";
    const isTrip = /(?:^|\/)trip\.json(?:[?#]|$)/.test(rawUrl);
    if (!isTrip) return nativeFetch(...args);

    try {
      const response = await nativeFetch(...args);
      const servedFromCache = response.headers.get("X-Travel-Lite-Source") === "cache";
      if (response.ok && !servedFromCache) {
        status.tripSource = "network";
        status.lastNetworkAt = new Date().toISOString();
        try { localStorage.setItem(lastNetworkKey, status.lastNetworkAt); } catch {}
      } else {
        status.tripSource = "cache";
      }
      emit();
      return response;
    } catch (error) {
      status.tripSource = "cache";
      emit();
      throw error;
    }
  };

  window.addEventListener("online", () => { status.online = true; emit(); });
  window.addEventListener("offline", () => { status.online = false; emit(); });
})();
