"""
Base Page Object for Appium mobile web tests.
All waits use WebDriverWait (not Appium implicit waits) for reliability.
"""
import logging
import os
from datetime import datetime
from pathlib import Path
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from appium.webdriver.common.appiumby import AppiumBy

SCREENSHOTS_DIR = Path(__file__).parent.parent / "Test Results" / "Screenshots"
log = logging.getLogger(__name__)


class MobileBasePage:
    TIMEOUT = 20

    def __init__(self, driver, base_url: str):
        self.driver   = driver
        self.base_url = base_url.rstrip("/")
        self.wait     = WebDriverWait(driver, self.TIMEOUT)

    # ── Navigation ────────────────────────────────────────────
    def goto(self, path: str = ""):
        if path.startswith("/") and not path.startswith("/#"):
            path = f"/#{path}"
        url = f"{self.base_url}{path}"
        log.info(f"[mobile-nav] → {url}")
        self.driver.get(url)
        return self

    def current_url(self) -> str:
        return self.driver.current_url

    def page_title(self) -> str:
        return self.driver.title

    # ── Element finders ───────────────────────────────────────
    def find(self, by, value, timeout=None):
        t = timeout or self.TIMEOUT
        return WebDriverWait(self.driver, t).until(
            EC.presence_of_element_located((by, value))
        )

    def find_visible(self, by, value, timeout=None):
        t = timeout or self.TIMEOUT
        return WebDriverWait(self.driver, t).until(
            EC.visibility_of_element_located((by, value))
        )

    def find_clickable(self, by, value, timeout=None):
        t = timeout or self.TIMEOUT
        return WebDriverWait(self.driver, t).until(
            EC.element_to_be_clickable((by, value))
        )

    def find_all(self, by, value):
        return self.driver.find_elements(by, value)

    def is_present(self, by, value, timeout=5) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, value))
            )
            return True
        except Exception:
            return False

    # ── Actions ───────────────────────────────────────────────
    def tap(self, by, value):
        self.find_clickable(by, value).click()

    def clear_and_type(self, by, value, text: str):
        el = self.find_visible(by, value)
        el.clear()
        el.send_keys(text)

    def get_text(self, by, value) -> str:
        return self.find_visible(by, value).text.strip()

    # ── Mobile gestures ───────────────────────────────────────
    def scroll_down(self):
        """Scroll down on mobile."""
        size   = self.driver.get_window_size()
        start_x = size["width"] // 2
        start_y = int(size["height"] * 0.8)
        end_y   = int(size["height"] * 0.2)
        self.driver.swipe(start_x, start_y, start_x, end_y, 800)

    def scroll_up(self):
        size   = self.driver.get_window_size()
        start_x = size["width"] // 2
        start_y = int(size["height"] * 0.2)
        end_y   = int(size["height"] * 0.8)
        self.driver.swipe(start_x, start_y, start_x, end_y, 800)

    # ── Screenshot ────────────────────────────────────────────
    def screenshot(self, name: str) -> str:
        SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
        ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = str(SCREENSHOTS_DIR / f"{name}_{ts}.png")
        self.driver.save_screenshot(path)
        log.info(f"[screenshot] → {path}")
        return path

    # ── Waits ─────────────────────────────────────────────────
    def wait_for_url_contains(self, fragment: str, timeout=20):
        WebDriverWait(self.driver, timeout).until(
            EC.url_contains(fragment)
        )

    def wait_for_page_load(self, timeout=30):
        """Wait until document.readyState is complete."""
        WebDriverWait(self.driver, timeout).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
