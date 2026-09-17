const TravelLiteStorage = (() => {
  const DB_NAME = "travel-lite";
  const DB_VERSION = 1;
  const STORE = "kv";
  let dbPromise;
  let mode = "indexeddb";

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        mode = "localStorage";
        reject(new Error("IndexedDB unavailable"));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
      request.onblocked = () => reject(new Error("IndexedDB upgrade blocked"));
    }).catch((error) => {
      console.warn("Travel Lite storage fallback:", error);
      mode = "localStorage";
      return null;
    });
    return dbPromise;
  }

  function fallbackGet(key) {
    try {
      const raw = localStorage.getItem(`travel-lite:${key}`);
      return raw == null ? null : JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function fallbackSet(key, value) {
    try {
      localStorage.setItem(`travel-lite:${key}`, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  async function get(key) {
    const db = await openDb();
    if (!db) return fallbackGet(key);
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(key);
      request.onsuccess = () => resolve(request.result?.value ?? null);
      request.onerror = () => resolve(fallbackGet(key));
    });
  }

  async function set(key, value) {
    const db = await openDb();
    if (!db) return fallbackSet(key, value);
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ key, value, updatedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(fallbackSet(key, value));
      tx.onabort = () => resolve(fallbackSet(key, value));
    });
  }

  async function remove(key) {
    const db = await openDb();
    try { localStorage.removeItem(`travel-lite:${key}`); } catch {}
    if (!db) return;
    await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = tx.onerror = tx.onabort = () => resolve();
    });
  }

  async function requestPersistentStorage() {
    if (!navigator.storage?.persist) return false;
    try { return await navigator.storage.persist(); } catch { return false; }
  }

  async function estimate() {
    if (!navigator.storage?.estimate) return null;
    try { return await navigator.storage.estimate(); } catch { return null; }
  }

  function getMode() { return mode; }

  return { get, set, remove, requestPersistentStorage, estimate, getMode };
})();
