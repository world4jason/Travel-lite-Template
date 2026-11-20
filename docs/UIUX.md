# Travel Lite — UI/UX Product Contract

> **Normative / 必須遵守** — 此文件是 Travel Lite 的 UI/UX **Single Source of Truth**，適用於 Template、由 Template 衍生的獨立旅行站、Agent、人工修改與所有 Style Packs。`AGENTS.md` 是 Agent 的強制讀取入口，不是第二份 UI/UX 規格。

## 0. Scope, precedence and document ownership

- **P0 / Immutable**：不得因美觀、個人偏好、旅行目的地或 Theme 而取消。若實作與 P0 衝突，停止該實作路線，修正後才能提交；不要在 runtime 偷偷降級。
- **P1 / Required**：新功能與維護必須保持的可用性與一致性；有既有缺陷則如實列在驗收紀錄，不能暗稱已修好。
- **P2 / Flexible**：可依 Style Pack 或旅程特性改變，但不得破壞 P0 / P1。
- 優先序：**P0 > P1 > P2**。資料 Schema、Style Pack 及 Trip 專屬文件用於細節補充；若內容衝突，應修正規格與實作，不應默默選擇較寬鬆版本。法律、資安與其他較高權限的指令仍須遵守。
- 唯一產品 UI/UX 要求在此維護；[CHRONOLOGICAL_TIMELINE_CONTRACT.md](./CHRONOLOGICAL_TIMELINE_CONTRACT.md) 解釋 Timeline 實作／驗收，[TRIP_SCHEMA.md](./TRIP_SCHEMA.md) 定義資料，[STYLE_SURFACE_CONTRACT.md](./STYLE_SURFACE_CONTRACT.md) 定義跨 Theme 的表面幾何，[MAINTENANCE.md](./MAINTENANCE.md) 提供測試流程。不要再複製一份互相矛盾的 P0 規格。

## 0.1 Mandatory per-page specifications / 頁面規範索引

此文件持有不可變的 **P0 > P1 > P2** 產品契約；下列 `docs/uiux/*.md` 是本契約的**規範性延伸**，不是可忽略的建議、第二份相互競爭的總契約，也不是獨立產品分頁。開始更動任何頁面前，必須先讀完整的 `docs/UIUX.md`，再讀共用規範與受影響頁面的規範；涉及日期／天氣一定要讀 Weather。跨頁變更須讀所有受影響文件；新 Trip Repo 複製 Template 時必須一併帶入。

| 範圍 / owner | 必讀規範 | 主要設計責任 |
| --- | --- | --- |
| **全站 Shell／共用元件／Style Packs** | [SHARED.md](./uiux/SHARED.md) | 五分頁 IA、內容密度、資訊階層、圖示、RWD、框內距、桌面切邊、可及性、deep link、離線 |
| **Now／現在** | [NOW.md](./uiux/NOW.md) | 上一站／排定此刻／下一站、風險提醒、TBD、非 GPS |
| **Trip／行程** | [TRIP.md](./uiux/TRIP.md) | 總覽與單日、完整 Timeline、交通 Journey 合併、飛行摘要、時段與備註 |
| **Transport／交通** | [TRANSPORT.md](./uiux/TRANSPORT.md) | 單日交通、轉乘明細、地圖與站點、Google Maps A→B、地圖框線安全內距 |
| **Places／景點** | [PLACES.md](./uiux/PLACES.md) | 真正景點目錄、介紹、官方來源、授權圖片、break/event 排除、詳情及篩選 |
| **More／更多** | [MORE.md](./uiux/MORE.md) | 清單、Travel Essentials、票券對應、外觀偏好、裝置本機狀態與隱私 |
| **共用日期／天氣元件（不是第六分頁）** | [WEATHER.md](./uiux/WEATHER.md) | Trip／Transport／Places 日期天氣卡列、Open-Meteo 未來／歷史、地點、缺值、快取與無障礙 |

**衝突處理：** `docs/UIUX.md` P0/P1/P2 優先；各頁細節不得降低本文件要求；`docs/UIUX_KANSAI.md` 僅增列關西特例；`TRIP_SCHEMA.md` 決定資料欄位；`CHRONOLOGICAL_TIMELINE_CONTRACT.md` 決定時間軸映射；`STYLE_SURFACE_CONTRACT.md` 決定 CSS 表面實作與驗收。若看到規範矛盾，先修文件與對應測試、再修程式，不得靜默選較寬鬆版本。

## P0 — Immutable product rules / 產品死律

### P0.1 Chronological Itinerary Timeline + Time-blocked Schedule

**Trip Day 主內容永遠是一條完整、可見、依原始資料時間順序排列的 Timeline。** 景點、餐飲、住宿、活動、等候與每一次**完整起點→終點交通 Journey** 在主 Timeline 都是同層時段。連續轉乘／步行仍以獨立 `days[].items[]` Leg 保存來源 ID 和時間，但主畫面只顯示一張交通卡，轉乘細節可展開；不是只有景點的清單加交通附註。

```text
10:00–11:00  參觀 XXX 景點
11:00–11:30  交通：地鐵 A 站 → B 站
11:30–13:00  午餐
13:00–15:00  交通：前往下一個目的地
```

以上僅為格式示意，**不是**可直接發布的真實時刻。對於有來源且已知的時段，顯示 `HH:MM–HH:MM`；缺某端時顯示 TBD / 已知資訊，不得補造。已排定交通的每個 Leg 使用獨立來源 `type: transport` item，含穩定 ID、已知交通模式與站點；相鄰同一 Journey 的 Leg 在主畫面合為一張時段卡並保留可展開的每段細節。可以用 `journeyId`／`journeyStart`／`journeyEnd` 明確切分兩趟不同旅程。**禁止**只把已知交通藏在 `transferAfter`、Journey Board、Transport 分頁或收合區塊。

主 Timeline 不得整段收合、被地圖替代、被 Theme 分割成景點／交通兩份清單，也不得重複顯示同一交通段。`days[].items[]` 是已發布的 canonical 順序；瀏覽器不能默默排序、補洞或調時。跨時區／跨午夜依 IANA timezone 比較絕對時刻，資料衝突需提示並回到來源修正。完整規格與邊界案例見 [Timeline Contract](./CHRONOLOGICAL_TIMELINE_CONTRACT.md)。

### P0.1a Door-to-door Journey Maps directions

完整 Journey 有來源確認的起點/終點時，使用 Google Maps URLs `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&travelmode=...`（不需座標或 API Key）建立可點擊路線。使用 URL 編碼；純步行用 walking、公共運輸與混合轉乘用 transit、純自駕用 driving。起終點不可信或涉及航班時不硬湊地面路線。Google Maps 可能產生與原行程不同的轉乘或班次，**路線預覽不代表即時或一定開啟導航**；來源交通資料絕不能被重排或改時刻。

### P0.2 Read-only schedule and honest status

Travel Lite 是**已規劃行程的旅行中查閱工具**，不是行程編輯器、路線最佳化器或即時交通 API。Now 顯示「排定的此刻／前一站／下一站」，不是 GPS 追蹤或聲稱已抵達。資料未知時保留 `TBD`；不能假裝知道交通 ETA、班次可用性、預約狀態、座標或末班時間。Plan B 僅為使用者提供或明確要求研究過的**選填、靜態、手動展開**資訊，不自動改排或替人選擇。

### P0.3 Fixed five-tab information architecture

唯一頂層導覽及順序固定為 **Now / Trip / Transport / Places / More**。保留既有路由、已發布項目 ID、景點詳細頁、書籤及歷史連結；**不可**擅自增添第六分頁、退回舊 Map/Check 頂層分頁或在 Transport 再造 Places 資料庫。

### P0.4 Shared date semantics without duplicated overview

Trip、Transport、Places 共用 `state.selectedDate`，日期切換應攜帶同一天並尊重明確 deep link。Trip Overview 與 Places「全部日期」是**各自獨立的 view mode**，不是一個虛構日期；Transport **僅單日**，不為了視覺對稱新增跨日 Overview。瀏覽器 Back/Forward、refresh、重新開啟與跨分頁 handoff 均不可破壞已選日期或 item。

### P0.5 One published truth; no invented transportation

`trip.json` 的 `days[].items[]` 是主行程事實與可見時序的唯一來源。Now / Trip / Transport / Journey Board 可以使用各自的閱讀方式投影同一資訊，**不得**另維護衝突的 `mobility.legs` 時刻表。沒有可信座標不能創造 pin；無座標或地圖失敗時保留站名、已發布行程與外部地圖連結。研究來源／核對日期 ≠ 即時營運 ≠ Human Gate 驗收。

### P0.6 No regression in access to core itinerary

任何 Style Pack、動畫、收合面板或離線故障處理，不得使主 Timeline、核心資訊、導覽、鍵盤可操作性與已存本機狀態消失。裝置偏好只存裝置，不可呈現成同行者共享決策；外部供應商失敗時靜態行程仍可使用。

## P1 — Required interaction and accessibility standards

### P1.1 Progressive disclosure and hierarchy

- 先顯示日期、主時段、名稱、必要狀態與交通重點；長備註、詳細班次、備案、研究來源及巡禮資訊可依需求展開，**主 Timeline 不可被折疊**。
- Trip 主責時間順序；Transport 主責已知上／下車站、轉乘與地圖／外部導航；Places 主責景點索引與內容；Now 是當日短版 handoff；More 是準備與偏好。減少跨分頁的同一資料重複輸入。
- 不宣稱來源快照是即時資料。必要的危險／未確認提醒應可辨識，不以顏色作唯一語意。

### P1.2 Responsive and inclusive reading

- 需覆蓋至少 **320px、390px、1100px** 代表寬度與 **200% 文字縮放**；長中文、日文、完整站名、時區、連結與多行時間不可被裁切或造成無法操作的水平捲動。
- 保留語意順序、可見鍵盤焦點、可理解的 ARIA/標籤與觸控目標；既有手機五分頁操作區依專案維護規則驗證，目標至少 **44px**。
- 長途日期控制採既有共用 Date Navigator，不因個別 Theme 或日期數量而改出第二套資料狀態。

### P1.3 Reliability and external handoff

- 靜態 GitHub Pages、PWA 既有快取、離線閱讀、正確 URL encode／safe HTTP(S)、Google Maps 或官方交通 handoff 不得退化；外部圖磚與即時服務不可用時提供清楚 fallback。
- MapLibre／標註座標只顯示已知的地點；若無精確地點，改用站名卡與外部查詢，不推估地理位置或交通路線。
- 保留固定五分頁及歷史 hash；所有已發布 source item 保留穩定 ID、來源與對應操作。

### P1.4 Style Pack semantic parity

所有主題必須保留相同的核心資料、DOM 語意、閱讀順序、必需欄位、焦點與操作能力；可更改視覺材料但不能改掉資訊架構。CSS 表面幾何依 `docs/STYLE_SURFACE_CONTRACT.md`（若衍生 Repo 未附此檔，請參考 [Template 上游版](https://github.com/world4jason/Travel-lite-Template/blob/main/docs/STYLE_SURFACE_CONTRACT.md)） 與現有 Playwright matrix 驗證。

### P1.5 Shared weather-integrated date strip

Trip、Transport、Places 使用**同一個**可橫向捲動的日期卡列（D 編號、日期、每日短標題、天氣圖示和有資料才顯示的溫度），以取代主要 Dropdown 外觀；共同使用原本的 `state.selectedDate`、deep link、Back/Forward 與 view-specific Overview。長旅程向側邊延伸，不建立第二份日期狀態。保留「總覽」「今天」、前後一天及可存取的 Jump-to-day 下拉作為輔助操作；320px / 390px / 1100px、200% 字體與鍵盤仍可操作。卡片必須一直可選，不因天氣 API 失效而禁用。

天氣由 Open-Meteo 提供：**未來最多 16 天**顯示預報，**過去 92 天內**使用 Forecast API 的 `past_days`，更久的日期使用 Historical Weather API／reanalysis。歷史資料必須明確標成「歷史天氣（模式估計）」而不是即時／測站實測；歷史可呈現降水總量（mm），不能冒充歷史降雨機率。僅當資料確實包含當日 weather code 和最高／最低溫時才補上 SVG 天氣圖示與數值。**沒有資料時只保留日期、Day 標記與行程主題，隱藏天氣欄位、圖示及溫度**，不得重複顯示方格、假雲、假雪或 `—` 佔位。不同日期採當日地點／明確 `weatherLocation`，不拿首日城市代表整趟旅程；離線快取須標註 stale，不可影響日期切換。

### P1.6 Flight overview without a second schedule

如果 `days[].items[]` 存在明確 `type: "transport", transportMode: "flight"` 的航班，Trip Overview 以摘要卡顯示航班號、機場、已發布起降時間；Transport 對應日期呈現完整航段資訊（含有來源才顯示的航廈、航空公司與提醒）；飛行與機場前後交通仍保留在主 Timeline。沒有航班的旅行不出現空白卡。所有顯示必須由**同一筆 source item** 投影，絕不維護第二份機票時間；跨時區轉換依 IANA zone 與明確來源，不得猜測航廈、航班狀態或訂位資訊。公開網站不得放票號、訂位碼、登機證條碼等私密內容。

### P1.7 Framed card safe insets & semantic UI icons — Mandatory dual gate

**所有有框線的卡片與閱讀區塊，內文不可貼邊或被截斷。** 文字實際排版框至左右內側邊框至少保留 **12 CSS px** 的淨距離（推薦 16px）；不准用 padding:0、負 margin、clip/overflow:hidden 蓋掉裁切問題。插畫、絕對定位圖案須另外預留與文字不重疊的空間。無框 editorial row 可保留其分隔線閱讀語法，不需為了 Lint 畫假框。

地鐵／火車／纜車／公車／Google Maps 連結／景點／票券等控制圖示，只能使用本地固定白名單 `ui-icons.js` 的語意 SVG：地鐵與火車圖像須不同；地圖使用通用定位針。**不得**以易缺字或意義不明的 `⌖`、`◫`、`≋`、`📍` 字型符號當操作圖示。使用語意 label / aria-label；不仿製第三方品牌商標。

**雙重驗收：** (1) `npm run lint:uiux` 靜態檢查 icon whitelist、禁止 glyph、PWA 引用、必需的安全內距與文件；(2) `npm run test:uiux:geometry` 在 Chromium 中以 getBoundingClientRect 量測真正渲染的卡片與文字距離，覆蓋 320/390/1100px、200% 字體與支援的 Style Packs。兩者缺一不可。靜態 PASS 不等於視覺 PASS；CI FAIL 時不應宣稱完成。
### P1.8 Desktop clipping and walking icon

桌面 **1024／1280／1440／1920px** 及 200% 文字縮放必須驗證 Trip 完整 Journey、Transport 地圖與轉乘站點、日期導覽；不得用 `overflow:hidden` 直接裁切文字掩飾問題，需讓 Grid/Flex 使用 `min-width:0`、可換行文字與足夠框內距。**步行 icon 使用雙腳印 `footprints` SVG**，不使用奔跑人形。`npm run test:journey:browser` 驗證無水平溢出、長站名與 A→B 路線連結。

### P1.9 Map Workspace frame–inset pairing (不可再犯的設計契約)

**Transport「地圖與站點」的外框與內容內距是同一組不可分離的設計 Token。** 任何 Style Pack 設定可見 `--ui-map-workspace-frame`（非 0）時，**同一個主題規則必須設定非零 `--ui-map-workspace-padding`，四邊至少 12px，建議 16–24px**。不能只加框線卻繼承 `runtime.css` 的 0px inset。Storybook 使用既有 17px；Editorial、Risograph、Vintage Watercolor 為刻意無外框設計，frame 與 padding 均可為 0，不能為了通過檢查硬加外框。**CSS cascade 優先權也是合約的一部分**：`surface-contract.css` 的 map-workspace selector 必須高於（或在同權重時後於）所有 Style Pack 的 `.panel` 與 `:is(...,.panel,...)` 框線規則；開放式主題不得從通用 `.panel` 意外繼承邊框。Vintage 的地圖全幅可維持，但地圖標題、站點列與交通摘要須各保留 16px 的功能性側邊留白。CI 同時檢查 Token、CSS selector specificity、Chromium computed border/padding、桌面 1920px 與 200% 字體，不可單憑存在 `padding` 變數就宣稱通過。

`surface-contract.css` 使用成對 Token，且地圖工作區必須設 `box-sizing:border-box`、`min-width:0`；確保 Padding 計入實際寬度，不再靠 `overflow:hidden` 裁切內容。標題、`交通與位置`、路線文字、站點列以及地圖控制項都必須保持框線內的安全距離；地圖瓦片本身可在內部獨立裁切。

**雙重必要檢查：** `npm run lint:map-insets`（掃描 Template/衍生 repo 所有已安裝 Style Packs，驗證 framed/open token 配對、HTML/PWA URL 一致性、遺漏主題的負向測試），以及 `npm run test:map-insets:browser`（Chromium 量測各外觀實際 `getComputedStyle` Padding、標題與站點位置，涵蓋 320/390/1024/1280/1440/1920px、200% 放大字體與故意破壞內距的負向測試）。兩項已整合到 `lint:uiux` 與 `test:uiux:geometry`，**不可只看靜態檢查就宣稱版面通過**。


### P1.10 Information economy / no redundant helper subtitles

**頁面預設只顯示能幫助下一個動作的資訊。** Day 標題、日期、時段、景點／交通名稱與必要狀態優先；禁止用解釋元件如何運作的句子重複描述已可從介面看出的事實，例如「依時間排列：景點、交通、餐飲皆為獨立時段」或每一天都相同的「依實走順序串起交通與遊覽……」。泛用介紹、裝飾性 eyebrow、小標、重複分類（如 Transport＋步行）及過度冗長的天氣說明應從預設畫面移除，不能以縮小字體掩飾密度。資料來源歸屬維持簡潔可見。

真實行程的**關鍵風險／未核對狀態、站點時刻、票券條件與必要安全提醒不可刪除**；長篇研究、班次免責或非當下決策所需的背景可放到可存取的展開詳情。行程來源資料 `days[].items[]` 不因精簡文案而刪除或修改；有資訊價值的 `day.note` 改用 `<details>`，各天完全重複的樣板式說明不渲染。Now 與 Trip 不可把同一段冗餘說明各顯示一次。當 `item.location` 與標題完全相同，或 `item.note` 僅重複時段與單純步行／停留分鐘數時，視覺只顯示一次；來源的 `title/location/note` 仍保留原值，不為精簡顯示而修改實際行程。

**Style Pack 責任：** 主題可以改變字體／裝飾，但不得把一欄的語意卡片強制改成三欄並留下大片空白。Storybook 的 `.trip-v2-item` 為時間在上、內容在下的**單欄 Grid**；`journey-groups.css` 只管 Journey 內容與展開，不得重定義全主題通用 `grid-template-columns`。CI 必須同時檢查這個 CSS 契約和真實 Storybook 畫面，覆蓋 320／390／980／1100px、200% 文字，驗證內容佔用可用寬度且無水平裁切。


### P1.11 Curated Places ≠ every scheduled activity

Places 是**真正可介紹的景點／場域目錄**，不是所有有座標或 Google Maps 連結的行程項目。只有經確認的神社、寺院、古道、景點、公園、博物館、名勝等 `type: place|attraction|museum|landmark|nature|sight` 可進景點列表；單純的 `break`（看書、候場、休息、飯店日常泡湯）、`event`（祭典、煙火、市集、演出）、`transport`、`stay` 與一般 `food` 應只在 Chronological Timeline 保留，不可因 `location`、座標、`mapQuery` 或 `infoCard` 自動被認作景點。具明確店名和一手背景的 `restaurant` 可另作實體場域，不把未指定餐廳的午餐變景點。

每個正式發布的景點應有簡短但具體的 `infoCard.summary`、**至少一個可查證的一手 `sourceLinks`**，如景點自身官網或官方觀光機構。明確區分「景點官網」和「政府／觀光協會介紹」，不可把後者冒稱為景點官方網站。照片為*可選*欄位，只有確認主體相符、圖片來源、作者及授權（或明確可用的公開授權）時才能嵌入；必須保留 `imageAlt`、`imageSource`、`imageCredit`、`imageLicense` 和來源連結。不可以抓任意官網照片後直接熱鏈當作已授權素材。圖片載入失敗時只隱藏圖片，不出現破圖符號、不影響介紹與官網連結。

資料分類錯誤需回到 `trip.json` 改 `type`；**保留**每日時間軸的原始 ID、開始／結束時間、順序與備註。Places 的標題是可辨識的場館／景點名詞，不是「參拜／散步／等候／夜間點燈」等行程動詞；若需要在 Trip 保留「參拜 XXX」，可在該 item 明確提供 `venueName: "XXX"` 讓 Places 顯示純名稱，不得修改 Timeline 的原始時刻、ID 或既有 `title`。沒有明確 `venueName` 才退回 `item.title`；禁止透過字串刪字推測地點。Places 卡片摘要只使用 `infoCard.summary`，**不得**拿「約 15:00–16:00｜停留 60 分鐘」這類排程 `item.note` 充當景點介紹。新旅行複製 Template 時，Agent 必須先查官方來源，缺資料時明確標記「介紹待整理」，不能虛構文字或顯示誤導圖片。

必要驗證：`npm run test:places-curation`、`npm run test:places-curation:browser`、現有 Places/Timeline/ID/Style Pack 檢查；檢查負向案例「有座標的候場／活動仍不得進景點清單」，以及照片作者與授權欄位。

### P1.12 Compact Trip Overview — source-led, no generic sticker wall

**Trip Overview 必須簡約、可快速掃讀。** 預設首屏只保留緊湊的旅程標題、日期與少量有意義統計，接續可直接進入單日的摘要卡；**任何 Style Pack 都不能把總覽變成大幅通用插畫或空白裝飾板**。統計 `days[].items[]` 的總筆數必須標為「行程項目 / itinerary items」，而非 `planned stops`（其中包含交通、活動、住宿、休息，並非都是景點／停靠站）。

- **每日卡必要資訊：** 日期、Day 序號、行程主題、來源支援的路線摘要；可從既有 `days[].items[]` 交通記錄投影最多三個語意 SVG（飛機、車、鐵路等）。只有來源明確時才顯示重點／未解決事項；不加入「5 planned」等無行動價值副標、假天氣或泛用旅行口號。沒資料的右側區域留空，不用裝飾補版。
- 資料來源僅限現有 `days[].routeSummary` 或 `days[].items[]`；不因新旅行缺少大阪專屬的 `mobility` 就降級畫面，也不得新增第二份時刻表。每日卡仍須導向正確單日；已發布的 Flight Overview、必要警告與選填亮點仍可使用。
- **主題只改字體、配色、框線等材料。** `::before`／`::after` 的九宮格貼圖、通用旅行道具、與旅行無關的 SVG、巨大固定尺寸或斜轉動畫，不得占據 Overview 的 Hero 與日卡。封面圖片必須與旅程相符、具來源及使用權；沒有就使用無圖版型。不可用 `overflow:hidden` 偽裝解決文字溢出。
- **根據可用內容寬度響應，不根據 viewport 猜。** 桌面／手機（320、390、980、1100、1440、1920px）與文字放大 200% 都不得裁切主題、日期、路線或造成整頁水平捲動，且卡片左右文字安全內距仍符合 P1.7。
- **選填 Highlights 與待確認事項同樣受 Compact Overview 約束。** `highlights` 是來源提供的活動備選／安全提醒，不應刪資料，也不得預設展示成大型卡片牆；有資料時呈現預設收合、可用鍵盤展開的精簡清單。內容要依 locale 顯示中文／英文，開啟後保留日期、狀態、備註與連結；任何 Style Pack 不得在 Highlight 或 Open Decision 卡自動加入重複的九宮格／通用 sticker，必須檢查 `::before`、`::after`。沒有 Highlights 不顯示空區塊。重要警告仍由對應 Day/Now 的來源提醒保留，不可只藏在 Highlights。
- **右側 Context Rail 不能複製主總覽統計。** 僅在有不同的、來源可信的預約／提醒等實用內容時出現，否則收起。裝置本機選擇 Style Pack 不得破壞上述結構。
- **雙重驗收：** `npm run test:overview`、`npm run test:overview:browser`，且加入正式 `test:contracts`；要檢查 DOM、Pseudo-elements、Hero 實際高度、文字／卡片安全內距、不同風格和深連結。測試未跑必須回報 NOT RUN，不得宣稱視覺 PASS。


**可選的旅程主視覺（Owner-curated）：** 只有建立行程的人明確選擇真實 `days[].items[]` 的代表時刻，並提供已審核、具合法使用權的本地圖片後，Trip Overview 才能在緊湊標題區後顯示 **1～3 張、單圖高度不超過 178px** 的圖片。代表時刻允許原始 `event`、`place`、`break` 等來源 ID；選材不會修改其原始 `type` 或把煙火／泡湯變成 Places 景點。沒有審核圖片、風格不匹配或載入失敗時，無圖版型照常運作。此功能不可新增通用裝飾 Hero、額外導航、編造場景，或使總覽與 Timeline 的閱讀效率退化。


**獨立封面驗收：** 針對全部 Style Pack 產製的封面，必須各自有原生圖檔與可追溯生成紀錄；多風格九宮格裁切素材只能當預覽，不可冒充獨立高品質封面。`trip.overviewArtwork.qaStatus: pending` 時正式版不得顯示，僅限 `?previewArtwork=1` 預覽；必須由離線獨立驗證器（原始像素、雜湊、來源、獨立視覺模型、人工審核）全部合格才可設為 `approved`。GitHub Actions 取消不等於免除手動驗收。

### P1.13 One appearance selector, light by default

**更多 → 外觀只有一個樣式選擇入口。** Editorial Light / Editorial Dark 已在同一個 Style Picker 內，不能再顯示第二個 `System / Dark / Light` Theme Switcher，**也不在頂部再放獨立的 Quick Theme Toggle**，避免兩套設定互相覆蓋。主題切換後的地圖配色與瀏覽器工具列仍應同步，但不另建立顏色控制。動態偏好僅在動畫主題確實需要時獨立提供，不是第二組顏色控制。新的 Template 預設 Editorial Light（`ui.visualStyle: editorial`、`ui.theme: light`）；舊裝置已儲存的偏好不應被改版任意清掉，選擇「跟隨行程預設」會清除本機覆蓋並回到發布者預設。新旅程可在 `trip.json` 顯式選擇其他主題，但不得偷偷由作業系統深色模式改變發布者的 Light 預設。瀏覽器載入前的 `html[data-theme]` 也要採 Light，避免初始閃爍。必須測試深色選項可切換、重整後能保留、回預設可恢復。

### P1.14 Quiet publication metadata, without recurring disclaimer banners

**網站前台不得自動顯示泛用的「草案 · 人工驗收尚未執行」或「行程草案／未完成驗收不代表訂票或預約完成」橫幅**，無論處於 Now、Trip（Overview／Day）、Transport、Places、More 或任何 Style Pack，都不應重複插入發布狀態說明、免責聲明、預設註腳或以折疊卡取代。這類發布／驗收狀態屬於資料來源與維護流程，不是旅途中需要反覆閱讀的行程內容。

- **保留正確事實：** `trip.publication.state` / `humanGate` 的原始值不得因移除提示而修改，也不得把草案宣稱為已審閱、已驗收、票券已購或預約已確認。保留官方來源、核對日期與供內部／發布者檢視的資料，避免無意的承諾。
- **保留真正重要的提醒：** 個別班次、接駁期限、天候風險、營業時間或需現場確認的預約條件，仍應出現在對應的行程項目／操作附近；缺值標為 TBD，不得假造完成狀態。已發布的 `researchNotes` 仍可在 More 展開。
- **程式與測試：** `journey-trust.js` 可繼續提供資料來源／`publication()` 供查詢，但不得插入 `.trip-trust-notice` 或其他全站狀態 Banner。新版測試覆蓋 draft / not-run / waived / reviewed，驗證沒有通用提示、狀態未遭改寫，並確保來源連結和具體風險保持有效。不要僅用 CSS 隱藏現存 DOM。

## P2 — Flexible visual direction

Style Pack 可選字體、色彩、圖像、色塊、裝飾性網格、卡片圓角、框線、陰影、微動畫及日概覽呈現手法。這些是**材料與排版選擇**，不得改變 P0 Timeline／五分頁／資料來源、P1 易讀性或操作順序。旅行專屬 UI 可在額外的 `docs/UIUX_<TRIP>.md` 中補充，但不得降低本文件要求。

## Agent preflight / change / release acceptance

1. Agent 在**開始任何 UI/UX、Timeline、資料正規化、導航、Style Pack、CSS、頁面修改或產生新旅行站之前**，必須實際讀取 `AGENTS.md`、**完整** `docs/UIUX.md`，再讀取 `docs/uiux/SHARED.md`、受影響的五分頁頁面規範、日期／天氣改動時的 `docs/uiux/WEATHER.md`，及相關延伸契約。只有看到一段摘錄或 README 連結不算完成閱讀。
2. 新旅行 Repo 應保留 `AGENTS.md`、`docs/UIUX.md`、完整 `docs/uiux/` 七份分頁／共用規範、Timeline Contract、Schema 及相容的測試；不得複製一份較寬鬆的文件取代。新增產品要求先修改此文件及相應測試，再修改程式。
3. **必跑** `npm run test:uiux` 與 `npm run test:timeline`；涉及 UI 行為再跑專案既有 Chromium／Style Pack、手機、PWA、離線與 deep-link 回歸。報告精確指令與 **PASS / FAIL / NOT RUN**，不能把靜態閱讀等同於視覺驗收。
4. P0 衝突／測試失敗不得宣稱已完成或已具備合併條件。PR 應維持 Draft / 未合併至問題修復且 Owner 完成實際視覺驗收。GitHub Actions 只在 Repo 設定為 required status check 時才會形成伺服器側合併阻擋。

## References / precedence guard

- [Chronological Timeline Contract](./CHRONOLOGICAL_TIMELINE_CONTRACT.md) — 時段、未知值、跨區、映射與驗收詳述
- [Trip Schema](./TRIP_SCHEMA.md) — 單一資料來源、item、type、時間、來源
- [Maintenance Guide](./MAINTENANCE.md) — 發布／回歸流程
- `docs/STYLE_SURFACE_CONTRACT.md`（若衍生 Repo 未附此檔，請參考 [Template 上游版](https://github.com/world4jason/Travel-lite-Template/blob/main/docs/STYLE_SURFACE_CONTRACT.md)） — 有此檔案的 repo 依此驗證 Style Pack
- [AGENTS.md](../AGENTS.md) — Agent 的強制入口，不複製另一份不同規則
