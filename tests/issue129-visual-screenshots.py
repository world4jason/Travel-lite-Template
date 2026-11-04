#!/usr/bin/env python3
"""Reproducible synthetic 11-day screenshots for unified date navigation.

Serve this repository on port 8129 before running. Does not modify trip.json.
"""
import json
import os
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get("TRAVEL_LITE_TEST_URL", "http://127.0.0.1:8129/").rstrip("/") + "/"
OUT = ROOT / "docs/qa/issue129"
OUT.mkdir(parents=True, exist_ok=True)
CHROME = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
titles = [
    "淺草", "上野公園", "晴空塔", "日本橋", "新宿", "澀谷",
    "秋葉原", "東京站", "吉祥寺", "橫濱", "返程",
]
data = json.loads((ROOT / "trip.json").read_text())
data["trip"]["title"] = "東京 11 日｜日期導覽測試"
data["trip"]["subtitle"] = "Synthetic fixture · 2026/11/04–11/14"
data["trip"]["homeLabel"] = "Tokyo, Japan (test fixture)"
data["trip"]["startDate"] = "2026-11-04"
data["trip"]["endDate"] = "2026-11-14"
data["trip"]["timezone"] = "Asia/Tokyo"
data["ui"]["locale"] = "zh-TW"
source = data["days"][1]
data["days"] = []
for i, title in enumerate(titles):
    day = deepcopy(source)
    day["date"] = f"2026-11-{i+4:02d}"
    day["id"] = f"qa-{i+1:02d}"
    day["label"] = f"第 {i+1} 天"
    day["title"] = title
    for j, item in enumerate(day["items"]):
        item["id"] = f"qa-{i+1:02d}-stop-{j+1}"
    if i in [3, 8]:
        day["items"] = [{
            "id": f"qa-{i+1}-transfer", "type": "transport",
            "title": "已發布的交通行程", "start": "TBD", "location": "東京站"
        }]
    data["days"].append(day)

with sync_playwright() as pw:
    browser = pw.chromium.launch(
        headless=True, **({"executable_path": str(CHROME)} if CHROME.exists() else {})
    )
    for width, height, name in [(390, 844, "phone"), (320, 568, "small-phone"), (1100, 900, "desktop")]:
        page = browser.new_page(viewport={"width": width, "height": height})
        page.clock.install(time=datetime(2026, 11, 8, 12, 0, tzinfo=ZoneInfo("Asia/Tokyo")))
        page.route("**/trip.json", lambda route: route.fulfill(
            status=200, content_type="application/json",
            body=json.dumps(data, ensure_ascii=False)
        ))
        page.goto(BASE + "?previewStyle=vintage-watercolor#trip/overview", wait_until="domcontentloaded")
        page.wait_for_selector(".unified-date-nav", state="attached", timeout=12000)
        page.screenshot(path=str(OUT / f"{name}-trip-overview.png"), animations="disabled")
        if width < 900:
            page.locator("[data-unified-date-select]").select_option("2026-11-11")
        else:
            page.locator("[data-shell-day='2026-11-11']").click()
        page.wait_for_selector(".trip-day-view")
        page.screenshot(path=str(OUT / f"{name}-trip-day.png"), animations="disabled")
        page.locator("#bottom-nav [data-view='map']").click()
        page.wait_for_selector(".unified-date-nav", state="attached")
        page.screenshot(path=str(OUT / f"{name}-transport-day.png"), animations="disabled")
        page.locator("#bottom-nav [data-view='places']").click()
        page.wait_for_selector(".unified-date-nav", state="attached")
        page.screenshot(path=str(OUT / f"{name}-places-overview.png"), animations="disabled")
        page.locator("[data-unified-date-select]").select_option("2026-11-11")
        page.wait_for_selector(".places-card")
        page.screenshot(path=str(OUT / f"{name}-places-day.png"), animations="disabled")
        page.close()
        print("Captured",name,"five views")
    browser.close()
