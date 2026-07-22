"""
base_page.py — Base Page Object for Selenium Web E2E testing framework.
"""
import logging
from datetime import datetime
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from automation.config import settings

log = logging.getLogger(__name__)

class WebBasePage:
    TIMEOUT = 15

    def __init__(self, driver, base_url: str):
        self.driver   = driver
        self.base_url = base_url.rstrip("/")
        self.wait     = WebDriverWait(driver, self.TIMEOUT)

    def goto(self, path: str = ""):
        if path.startswith("/") and not path.startswith("/#"):
            path = f"/#{path}"
        url = f"{self.base_url}{path}"
        log.info(f"[web-nav] -> {url}")
        self.driver.get(url)
        return self

    def current_url(self) -> str:
        return self.driver.current_url

    def page_title(self) -> str:
        return self.driver.title

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

    def click_element(self, by, value):
        self.find_clickable(by, value).click()

    def clear_and_type(self, by, value, text: str):
        el = self.find_visible(by, value)
        el.clear()
        el.send_keys(text)

    def get_text_content(self, by, value) -> str:
        return self.find_visible(by, value).text.strip()

    def scroll_to_bottom(self):
        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")

    def scroll_to_top(self):
        self.driver.execute_script("window.scrollTo(0, 0);")

    def screenshot(self, name: str) -> str:
        settings.SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
        ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = str(settings.SCREENSHOTS_DIR / f"{name}_{ts}.png")
        self.driver.save_screenshot(path)
        log.info(f"[screenshot] -> {path}")
        return path

    def wait_for_url_contains(self, fragment: str, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            EC.url_contains(fragment)
        )

    def wait_for_page_load(self, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
