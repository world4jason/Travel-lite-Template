/* Minimal More → Export actions. No backend, accounts, or trip editing.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  "use strict";

  const baseRenderMore = renderMore;
  const core = globalThis.TravelLiteExportCore;

  function isZh() {
    return /^zh(?:-|$)/i.test(state?.data?.ui?.locale || "");
  }

  function label(en, zh) { return isZh() ? zh : en; }

  function setStatus(message) {
    const status = document.querySelector("#travel-export-status");
    if (status) status.textContent = message;
  }

  function printTrip(format) {
    // Called from a direct click, before any asynchronous work. Popup blockers
    // may still refuse it, in which case leave the main itinerary unchanged.
    const child = window.open("", "_blank");
    if (!child) {
      setStatus(label("Allow pop-ups to open the print preview.", "請允許彈出視窗以開啟列印預覽。"));
      return;
    }
    try {
      child.opener = null;
      child.document.open();
      child.document.write(core.printHtml(state.data, format, isZh() ? "zh" : "en"));
      child.document.close();
      child.document.getElementById("print-now")?.addEventListener("click", () => child.print());
      child.focus();
      setStatus(label("Print preview opened in a new tab.", "已在新分頁開啟列印預覽。"));
    } catch (error) {
      child.close();
      setStatus(label("Unable to open print preview.", "無法開啟列印預覽。"));
      console.warn("Travel Lite print preview", error);
    }
  }

  function downloadCalendar() {
    const raw = Number(document.querySelector("#travel-export-alarm")?.value || 0);
    const alarmMinutes = raw === 30 ? 30 : 0;
    try {
      const result = core.buildIcs(state.data, globalThis.TravelLiteTime, { alarmMinutes });
      const reasons = result.skipReasons;
      const reasonText = [
        reasons.noTime && label(`${reasons.noTime} without fixed time`, `${reasons.noTime} 個時間未定`),
        reasons.invalidDateOrTime && label(`${reasons.invalidDateOrTime} invalid/ambiguous time`, `${reasons.invalidDateOrTime} 個時間無法確認`),
        reasons.invalidTimeZone && label(`${reasons.invalidTimeZone} invalid time zone`, `${reasons.invalidTimeZone} 個時區無效`),
        reasons.missingId && label(`${reasons.missingId} missing stable ID`, `${reasons.missingId} 個缺少穩定 ID`)
      ].filter(Boolean).join("; ");
      const status = label(`Exported ${result.included} events. ${result.skipped} skipped${reasonText ? ": " + reasonText : ""}.`,
        `已匯出 ${result.included} 個活動；略過 ${result.skipped} 個${reasonText ? "：" + reasonText : ""}。`);
      if (!result.included) {
        setStatus(status);
        return;
      }
      const objectUrl = URL.createObjectURL(new Blob([result.text], { type: "text/calendar;charset=utf-8" }));
      const anchor = document.createElement("a");
      const id = String(state.data.trip.id || "trip").replace(/[^a-z0-9_-]/gi, "-").slice(0, 70) || "trip";
      anchor.href = objectUrl;
      anchor.download = id + ".ics";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
      setStatus(status);
    } catch (error) {
      console.warn("Travel Lite ICS export", error);
      setStatus(label("Calendar export failed. Please check itinerary times.", "日曆匯出失敗，請檢查行程時間與時區。"));
    }
  }

  function insertExportActions() {
    if (state?.view !== "more" || !state.data || !core) return;
    const nextTo = document.querySelector("#view-root .local-note-card");
    if (!nextTo || document.getElementById("travel-export-actions")) return;
    const section = document.createElement("section");
    section.id = "travel-export-actions";
    section.className = "panel travel-export-panel";
    section.innerHTML = `<div class="travel-export-heading">
        <div><p class="eyebrow">Export / 匯出</p>
          <h2>${label("Take your itinerary with you", "把行程帶著走")}</h2></div>
        <p class="helper-text">${label("Exports are snapshots of the published trip.", "匯出的是已發佈行程的靜態快照。")}</p>
      </div>
      <div class="travel-export-buttons">
        <button type="button" data-travel-export="a4">${label("A4 itinerary · Print / PDF", "A4 完整行程 · 列印 / PDF")}</button>
        <button type="button" data-travel-export="a5">${label("A5 booklet · Print / PDF", "A5 旅行小手冊 · 列印 / PDF")}</button>
        <button type="button" data-travel-export="ics">${label("Calendar · Download .ics", "行事曆 · 下載 .ics")}</button>
      </div>
      <label class="travel-export-alarm" for="travel-export-alarm">
        <span>${label("Calendar event reminders", "日曆活動提醒")}</span>
        <select id="travel-export-alarm">
          <option value="0">${label("None", "不提醒")}</option>
          <option value="30">${label("30 minutes before", "開始前 30 分鐘")}</option>
        </select>
      </label>
      <p class="helper-text">${label("Calendar import does not automatically sync future changes. Device calendar controls alarms.", "日曆匯入後不會自動同步更新；實際通知由手機日曆控制。")}</p>
      <p id="travel-export-ics-warning" class="helper-text" role="note">${label("Compatibility notice: importing .ics into Apple, Google or Outlook Calendar has not been manually verified. Check dates, times, time zones and reminders in your calendar before relying on imported events.", "相容性提醒：尚未經 Apple、Google 或 Outlook 行事曆的實際匯入人工驗收。匯入後請核對日期、時間、時區及提醒，再依賴匯入的活動安排旅行。")}</p>
      <p id="travel-export-status" role="status" aria-live="polite" class="travel-export-status"></p>`;
    nextTo.before(section);
    section.addEventListener("click", (event) => {
      const action = event.target.closest("[data-travel-export]")?.dataset.travelExport;
      if (action === "a4" || action === "a5") printTrip(action);
      else if (action === "ics") downloadCalendar();
    });
  }

  renderMore = function travelExportRenderMore() {
    baseRenderMore();
    insertExportActions();
  };

  if (state?.ready && state.view === "more") renderMore();
  else window.addEventListener("travel-lite-ready", () => {
    if (state?.view === "more") renderMore();
  }, { once: true });
})();
