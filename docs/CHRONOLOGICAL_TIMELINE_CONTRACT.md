# Chronological Itinerary Timeline + Time-blocked Schedule

> P0 — **Immutable UX/data contract / 最高優先死律**。Agent、人工修改、Style Pack 與所有由 Travel Lite 複製的行程，都不得違反。唯一主 Timeline 來源是 `days[].items[]`。

## Canonical UI example

    10:00–11:00  [place]     參觀 XXX 景點
    11:00–11:30  [transport] 地鐵 A 站 → B 站
    11:30–13:00  [food]      午餐
    13:00–15:00  [transport] 前往下一個目的地

上面時間**只是格式示範**，不得用於未核實的真實行程。每個已排定區塊擁有自己的 stable `id`、`type`、`title`、來源支持的 `start`/`end`，並一律以一筆 `days[].items[]` 表達。每段已安排交通含步行、地鐵、巴士、火車、纜車、渡船與飛機，必須是**獨立 `type: transport` 行**，與景點、餐飲同層。

## Render acceptance

- Trip Day 的主軸是**永遠展開**的單一有序 `ol`/`li`；每個來源 item 一個 row，原始順序及 ID 保留。
- 顯示開始與結束時間及活動名稱，不假造未提供的結束時刻；缺某端顯示待定、`timeLabel`；不使用推定 `00:00`、假路線及即時 ETA。
- 地圖/站點資訊是補充；`Journey Board`、Transport tab 與 Plan B 只顯示來源投影／按需展開的細節，不得替代主軸、隱藏交通或新增第二份交通時刻表。
- `transferAfter` 只供舊資料或沒有已發布時間的輕量銜接；其後緊接 `type:transport` 時不能把同一段交通顯示兩次。
- 時區優先序：`item.timezone` > `day.timezone` > `trip.timezone`。以 IANA 時區轉為絕對瞬間檢查跨區排序，例如 KIX→TPE；跨午夜顯示次日標示。資料重疊／倒序顯示警告並修來源，不默默 runtime 重排。
- 新建立的行程必須在發布前檢查 `npm run test:timeline`；若不能執行，需紀錄 NOT RUN。長旅、手機 320/390px、200% zoom、zh/en、Style Packs、鍵盤、PWA 離線與既有連結均需回歸。

## Agent output schema example

    { "date": "2030-06-01", "items": [
      { "id": "stop-1", "type": "place", "title": "參觀 XXX 景點", "start": "10:00", "end": "11:00" },
      { "id": "leg-1", "type": "transport", "transportMode": "subway", "title": "地鐵 A → B", "start": "11:00", "end": "11:30" },
      { "id": "meal-1", "type": "food", "title": "午餐", "start": "11:30", "end": "13:00" },
      { "id": "leg-2", "type": "transport", "transportMode": "train", "title": "前往下一目的地", "start": "13:00", "end": "15:00" }
    ] }

此範例為虛構 fixture。既有東京 demo 中部分 `transferAfter` 舊資料只供向後相容，**不得作為未來 Agent 省略獨立交通列的理由**。參照 `AGENTS.md` 與 `docs/TRIP_SCHEMA.md`。
