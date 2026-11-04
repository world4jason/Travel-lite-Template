#!/usr/bin/env python3
"""Now floating item taxonomy: locale, Style Packs, readability, and escape safety."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "ui-proof"
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.getenv("TRAVEL_LITE_TEST_URL", "http://127.0.0.1:8111/").rstrip("/") + "/"
styles = ["editorial", "storybook", "candy", "paper-collage", "naive-city",
          "risograph", "taiwan-poster", "field-stamp", "quiet-linocut", "doodle-memory-grid",
          "crayon-journal", "painterly-editorial", "geometric-print", "quiet-acrylic", "vintage-watercolor"]
chromium = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, **({"executable_path": str(chromium)} if chromium.exists() else {}))
    errors = []
    for style in styles:
        for width in [320, 390, 1100]:
            page = browser.new_page(viewport={"width": width, "height": 844}, device_scale_factor=1)
            page.on("pageerror", lambda err: errors.append(str(err)))
            page.goto(BASE + "?previewStyle=" + style + "#now", wait_until="domcontentloaded")
            page.wait_for_function("typeof state !== 'undefined' && !!state.data", timeout=15000)
            page.evaluate("""() => {
                const now = zonedNow(state.data.trip.timezone).date;
                state.data.trip.startDate = now;
                state.data.trip.endDate = now;
                state.data.days = [{
                    id: "qa-now", date: now, title: "QA", label: "QA",
                    items: [
                        {id: "qa-timed", type: "activity", start: "00:01", end: "00:02",
                         title: "已排定的活動", location: "測試過去時間"},
                        {id: "qa-transfer", type: "transport", start: "TBD",
                         title: "列車移動", location: "大阪難波 → 伊勢市"},
                        {id: "qa-hotel", type: "stay", start: "TBD",
                         title: "入住旅館", location: "車站旁的旅館"},
                        {id: "qa-unknown", type: "<img src=x onerror=alert(1)>", start: "TBD",
                         title: "Untrusted category", location: "Safe content"}
                    ]
                }];
                state.data.ui.locale = "zh-TW";
                state.selectedDate = now;
                state.view = "now";
                render();
            }""")
            page.wait_for_function("document.querySelectorAll('.companion-floating-list .companion-kind-label').length === 3", timeout=10000)
            category = page.locator(".companion-floating-list .companion-kind-label")
            assert category.count() == 3, (style, width, category.count())
            labels = category.all_text_contents()
            assert labels[:2] == ["交通", "住宿"], (style, width, labels)
            assert labels[2] == "<img src=x onerror=alert(1)>", labels
            assert page.locator(".companion-floating-list img").count() == 0, "unsafe type rendered HTML"
            assert page.locator(".companion-floating-list .type-pill").count() == 0
            for pill in category.all():
                props = pill.evaluate("""el=>{
                    const s=getComputedStyle(el), r=el.getBoundingClientRect();
                    return {border:s.borderTopWidth, padding:s.paddingLeft, width:r.width,
                            height:r.height, overflow:s.overflow, whiteSpace:s.whiteSpace,
                            background:s.backgroundColor};
                }""")
                assert props["border"] == "0px", (style, width, props)
                assert props["padding"] == "0px", (style, width, props)
                assert props["width"] > 0 and props["height"] > 0, props
            # Simulate Android large system text without changing the source text.
            page.evaluate("document.documentElement.style.fontSize='200%'")
            dims = page.evaluate("""() => ({
                width: innerWidth, scroll: document.documentElement.scrollWidth,
                columns: [...document.querySelectorAll('.companion-floating-list article')].map(
                    el => [el.clientWidth, el.scrollWidth])
            })""")
            assert dims["scroll"] <= width + 3, (style, width, dims)
            assert all(a + 2 >= b for a, b in dims["columns"]), (style, width, dims)
            assert category.nth(0).evaluate("""el => el.getBoundingClientRect().bottom <=
                el.nextElementSibling.getBoundingClientRect().top"""), (style, width, "overlap")
            if style == "vintage-watercolor" and width == 390:
                page.evaluate("document.documentElement.style.fontSize='100%'")
                # Keep the visual evidence focused on realistic labels while
                # the separate XSS assertion still checks the unknown category.
                unknown = page.locator(".companion-floating-list article").nth(2)
                unknown.evaluate("el => { el.style.display = 'none'; }")
                page.locator(".companion-floating-list").screenshot(
                    path=str(OUT / "now-floating-categories-fixed.png"))
                unknown.evaluate("el => { el.style.display = ''; }")
            # English still reads as semantic copy, not literal Chinese values.
            page.evaluate("state.data.ui.locale='en'; render()")
            english = page.locator(".companion-floating-list .companion-kind-label")
            assert english.all_text_contents()[:2] == ["Transport", "Stay"], (style, width, english.all_text_contents())
            print(f"PASS {style} {width}px: 交通/住宿, escaped unknown, large text, en fallback")
            page.close()
    browser.close()
    assert not errors, errors
    print("PASS: 15 visual styles / 320-390-1100px / 200% text / no JS errors")
