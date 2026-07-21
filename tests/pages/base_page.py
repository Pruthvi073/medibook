"""
Base Page Object — shared utilities for all page objects.
"""
import logging
import os
from datetime import datetime
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

SCREENSHOTS = os.path.join(os.path.dirname(__file__), "..", "Test Results", "Screenshots")
log = logging.getLogger(__name__)


class BasePage:
    def __init__(self, driver, base_url: str):
        self.driver   = driver
        self.base_url = base_url.rstrip("/")
        self.wait     = WebDriverWait(driver, 15)

    # ── Navigation ────────────────────────────────────────────
    def goto(self, path: str = ""):
        url = f"{self.base_url}{path}"
        log.info(f"[nav] → {url}")
        self.driver.get(url)
        return self

    def current_url(self) -> str:
        return self.driver.current_url

    def page_title(self) -> str:
        return self.driver.title

    # ── Element helpers ───────────────────────────────────────
    def find(self, by, value, timeout=15):
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )

    def find_visible(self, by, value, timeout=15):
        return WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located((by, value))
        )

    def find_clickable(self, by, value, timeout=15):
        return WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable((by, value))
        )

    def find_all(self, by, value):
        return self.driver.find_elements(by, value)

    def is_element_present(self, by, value, timeout=5) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, value))
            )
            return True
        except Exception:
            return False

    def get_text(self, by, value) -> str:
        return self.find_visible(by, value).text.strip()

    def click(self, by, value):
        self.find_clickable(by, value).click()

    def type_into(self, by, value, text: str):
        el = self.find_visible(by, value)
        el.clear()
        el.send_keys(text)

    # ── Screenshot ────────────────────────────────────────────
    def screenshot(self, name: str) -> str:
        os.makedirs(SCREENSHOTS, exist_ok=True)
        ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = os.path.join(SCREENSHOTS, f"{name}_{ts}.png")
        self.driver.save_screenshot(path)
        log.info(f"[screenshot] saved → {path}")
        return path

    # ── Wait helpers ──────────────────────────────────────────
    def wait_for_url_contains(self, fragment: str, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            EC.url_contains(fragment)
        )

    def wait_for_title_contains(self, fragment: str, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            EC.title_contains(fragment)
        )
