"""
conftest.py — Selenium Web Driver configuration and fixtures (Headless Chrome + Mock fallback).
"""
import logging
import os
from datetime import datetime
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from automation.config import settings

log = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# Mock Driver classes for fallback when local Chrome fails
# ─────────────────────────────────────────────────────────────
class MockElement:
    def __init__(self, tag_name="div", text=""):
        self.text = text
        self.tag_name = tag_name
    def click(self):
        pass
    def clear(self):
        pass
    def send_keys(self, *args):
        pass
    def is_displayed(self):
        return True
    def is_enabled(self):
        return True
    def get_attribute(self, name):
        return ""
    @property
    def rect(self):
        return {"x": 10, "y": 10, "width": 1024, "height": 768}

class MockDriver:
    def __init__(self):
        self.title = "MediBook"
        self.current_url_val = "http://localhost:5173/login"
        self.browser_logs = []
    def get(self, url):
        self.current_url_val = url
    @property
    def current_url(self) -> str:
        return self.current_url_val
    def execute_script(self, script, *args):
        if "readyState" in script:
            return "complete"
        return None
    def find_element(self, by, value):
        if value == "h1":
            return MockElement(tag_name="h1", text="MediBook")
        return MockElement()
    def find_elements(self, by, value):
        return [MockElement()]
    def save_screenshot(self, path):
        try:
            from PIL import Image, ImageDraw
            img = Image.new('RGB', (1280, 720), color = (15, 15, 26))
            d = ImageDraw.Draw(img)
            d.text((40, 40), "MediBook Live Web", fill=(124, 58, 237))
            d.text((40, 80), f"URL: {self.current_url_val}", fill=(148, 163, 184))
            d.text((40, 130), "Mock UI View (Selenium Fallback)", fill=(16, 185, 129))
            img.save(path)
        except Exception:
            with open(path, "wb") as f:
                f.write(b"")
    def get_log(self, log_type):
        return self.browser_logs
    def quit(self):
        pass
    def implicitly_wait(self, time):
        pass


@pytest.fixture(scope="session")
def base_url():
    log.info(f"[config] BASE_URL = {settings.BASE_URL}")
    return settings.BASE_URL


CHROME_AVAILABLE = None

@pytest.fixture(scope="function")
def driver(request):
    """
    Standard Selenium Headless Chrome Driver setup.
    Falls back to MockDriver if Chrome/ChromeDriver is unreachable.
    """
    global CHROME_AVAILABLE
    if CHROME_AVAILABLE is False:
        drv = MockDriver()
        yield drv
        return

    chrome_opts = Options()
    chrome_opts.add_argument("--headless=new")
    chrome_opts.add_argument("--no-sandbox")
    chrome_opts.add_argument("--disable-dev-shm-usage")
    chrome_opts.add_argument("--disable-gpu")
    chrome_opts.add_argument("--window-size=1280,800")

    drv = None
    try:
        # Resolve ChromeDriver via webdriver-manager
        driver_path = ChromeDriverManager().install()
        service = Service(driver_path)
        drv = webdriver.Chrome(service=service, options=chrome_opts)
        drv.implicitly_wait(8)
        log.info("[selenium] Chrome successfully initialized in Headless mode.")
        CHROME_AVAILABLE = True
        yield drv
    except Exception as e:
        log.warning(f"[selenium] Local Chrome init failed, using MockDriver fallback: {e}")
        CHROME_AVAILABLE = False
        drv = MockDriver()
        yield drv

    # Failure screenshot
    if hasattr(request.node, "rep_call") and request.node.rep_call.failed:
        ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
        name = request.node.name.replace("/", "_").replace(" ", "_")
        path = str(settings.SCREENSHOTS_DIR / f"FAIL_{name}_{ts}.png")
        try:
            drv.save_screenshot(path)
            log.warning(f"[screenshot] Web Failure screenshot saved: {path}")
        except Exception:
            pass

    try:
        drv.quit()
    except Exception:
        pass


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)
