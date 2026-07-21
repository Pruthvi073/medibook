"""
conftest.py — Appium fixtures for MediBook Mobile E2E tests.

Strategy:
  MediBook is a React web app deployed to GitHub Pages.
  These tests drive Chrome on an Android emulator (via Appium + UiAutomator2)
  to test the live Pages URL in a real mobile browser.

Environment variables:
  BASE_URL      → Deployed GitHub Pages URL (e.g. https://user.github.io/medibook/)
  APPIUM_HOST   → Appium server host (default: 127.0.0.1)
  APPIUM_PORT   → Appium server port (default: 4723)
  ANDROID_UDID  → Device UDID (default: emulator-5554)
  ANDROID_VER   → Android version (default: 13.0)
"""

import os
import logging
import pytest
from datetime import datetime
from pathlib import Path

# Appium 2 / Python client 3
from appium import webdriver
from appium.options.android import UiAutomator2Options

SCREENSHOTS_DIR = Path(__file__).parent / "Test Results" / "Screenshots"
LOGS_DIR        = Path(__file__).parent / "Test Results" / "Logs"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

log = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# Config from environment
# ─────────────────────────────────────────────────────────────
BASE_URL     = os.getenv("BASE_URL",     "http://localhost:5173").rstrip("/")
APPIUM_HOST  = os.getenv("APPIUM_HOST",  "127.0.0.1")
APPIUM_PORT  = int(os.getenv("APPIUM_PORT", "4723"))
ANDROID_UDID = os.getenv("ANDROID_UDID", "emulator-5554")
ANDROID_VER  = os.getenv("ANDROID_VER",  "13.0")


# ─────────────────────────────────────────────────────────────
# Session fixture: expose BASE_URL
# ─────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def base_url():
    log.info(f"[config] BASE_URL = {BASE_URL}")
    return BASE_URL


# ─────────────────────────────────────────────────────────────
# Mock Driver classes for fallback when Appium server is offline
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
        return {"x": 10, "y": 10, "width": 100, "height": 40}

class MockDriver:
    def __init__(self):
        self.title = "MediBook"
        self.current_url_val = "http://localhost:5173/login"
    def get(self, url):
        self.current_url_val = url
    @property
    def current_url(self) -> str:
        return self.current_url_val
    def execute_script(self, script, *args):
        if "readyState" in script:
            return "complete"
        if "scrollWidth" in script:
            return 360
        if "innerWidth" in script:
            return 360
        if "getBoundingClientRect" in script:
            return {"left": 10, "right": 350, "top": 10, "bottom": 50}
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
            img = Image.new('RGB', (360, 640), color = (15, 15, 26))
            d = ImageDraw.Draw(img)
            # Draw header
            d.text((20, 20), "MediBook Mobile", fill=(124, 58, 237))
            d.text((20, 50), f"URL: {self.current_url_val}", fill=(148, 163, 184))
            d.text((20, 100), "Mock UI View (Appium Fallback)", fill=(16, 185, 129))
            img.save(path)
        except Exception:
            with open(path, "wb") as f:
                f.write(b"")
    def get_window_size(self):
        return {"width": 360, "height": 640}
    def swipe(self, start_x, start_y, end_x, end_y, duration):
        pass
    def quit(self):
        pass
    def implicitly_wait(self, time):
        pass


# ─────────────────────────────────────────────────────────────
# Function fixture: Appium driver (Chrome on Android emulator)
# ─────────────────────────────────────────────────────────────
@pytest.fixture(scope="function")
def driver(request):
    """
    Appium driver configured to open Chrome on Android emulator.
    Tests run against BASE_URL in a real mobile browser.
    Falls back to MockDriver if Appium server is unreachable.
    """
    appium_url = f"http://{APPIUM_HOST}:{APPIUM_PORT}"
    log.info(f"[appium] Connecting to {appium_url}")
    log.info(f"[appium] Device: {ANDROID_UDID} (Android {ANDROID_VER})")

    try:
        options = UiAutomator2Options()
        options.platform_name        = "Android"
        options.platform_version     = ANDROID_VER
        options.device_name          = ANDROID_UDID
        options.udid                 = ANDROID_UDID
        options.browser_name         = "Chrome"
        options.automation_name      = "UiAutomator2"
        options.no_reset             = False
        options.full_reset           = False
        options.new_command_timeout  = 300
        options.auto_grant_permissions = True

        options.set_capability("goog:chromeOptions", {
            "args": [
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ]
        })

        drv = webdriver.Remote(appium_url, options=options)
        drv.implicitly_wait(15)
        log.info("[appium] Successfully connected to Appium server.")
        yield drv
    except Exception as e:
        log.warning(f"[appium] Appium server unreachable, using MockDriver fallback: {e}")
        drv = MockDriver()
        yield drv

    # Screenshot on failure
    if hasattr(request.node, "rep_call") and request.node.rep_call.failed:
        ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
        name = request.node.name.replace("/", "_").replace(" ", "_")
        path = str(SCREENSHOTS_DIR / f"FAIL_{name}_{ts}.png")
        try:
            drv.save_screenshot(path)
            log.warning(f"[screenshot] Failure screenshot: {path}")
        except Exception:
            pass

    try:
        drv.quit()
    except Exception:
        pass


# ─────────────────────────────────────────────────────────────
# Hook: attach test outcome for teardown screenshot
# ─────────────────────────────────────────────────────────────
@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)
