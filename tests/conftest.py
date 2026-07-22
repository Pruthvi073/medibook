"""
conftest.py — Shared Selenium fixtures for MediBook E2E tests.

Provides:
  - driver  : a headless Chrome WebDriver instance, closed after each test
  - base_url: the deployed GitHub Pages URL (from BASE_URL env var)

Usage:
  Set BASE_URL environment variable before running:
    export BASE_URL=https://<user>.github.io/<repo>/
    pytest tests/
"""

import os
import logging
import pytest
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# ─────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────
BASE_URL     = os.getenv("BASE_URL", "http://localhost:5173")
SCREENSHOTS  = os.path.join(os.path.dirname(__file__), "Test Results", "Screenshots")
LOGS_DIR     = os.path.join(os.path.dirname(__file__), "Test Results", "Logs")
IMPLICIT_WAIT = 10   # seconds
PAGE_TIMEOUT  = 30   # seconds

# Ensure output directories exist
os.makedirs(SCREENSHOTS, exist_ok=True)
os.makedirs(LOGS_DIR,    exist_ok=True)

log = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# Session-scoped: expose BASE_URL to tests via fixture
# ─────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def base_url():
    url = BASE_URL.rstrip("/")
    log.info(f"[config] BASE_URL = {url}")
    return url


# ─────────────────────────────────────────────────────────────
# Function-scoped: create and teardown a Chrome WebDriver
# ─────────────────────────────────────────────────────────────
@pytest.fixture(scope="function")
def driver(request):
    options = Options()
    options.add_argument("--headless=new")          # New headless mode (Chrome 112+)
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1536,900")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-infobars")
    options.add_argument("--lang=en-US")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])

    try:
        drv = webdriver.Chrome(options=options)
    except Exception:
        try:
            service = Service(ChromeDriverManager().install())
            drv = webdriver.Chrome(service=service, options=options)
        except Exception as e:
            log.warning(f"[selenium] Chrome init failed: {e}")
            raise e
    drv.implicitly_wait(IMPLICIT_WAIT)
    drv.set_page_load_timeout(PAGE_TIMEOUT)

    yield drv

    # ── Teardown: capture screenshot on failure ──────────────
    if request.node.rep_call.failed if hasattr(request.node, "rep_call") else False:
        ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
        name = request.node.name.replace("/", "_").replace(" ", "_")
        path = os.path.join(SCREENSHOTS, f"FAIL_{name}_{ts}.png")
        try:
            drv.save_screenshot(path)
            log.warning(f"[screenshot] Failure screenshot saved: {path}")
        except Exception:
            pass

    drv.quit()


# ─────────────────────────────────────────────────────────────
# Hook: attach outcome to request node so teardown can read it
# ─────────────────────────────────────────────────────────────
@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)
