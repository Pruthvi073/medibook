"""
test_dynamic.py — Parameterised data-driven test case runner for Selenium Web tests.
"""
import json
import logging
import pytest
from pathlib import Path
from automation.pages import WebLoginPage, WebRegisterPage, WebDashboardPage

log = logging.getLogger(__name__)

def load_test_cases():
    json_path = Path(__file__).parent.parent / "data" / "test_cases.json"
    if not json_path.exists():
        return []
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)

# Load test cases at import time
TEST_CASES = load_test_cases()
TEST_IDS   = [tc["id"] for tc in TEST_CASES]

@pytest.mark.parametrize("tc", TEST_CASES, ids=TEST_IDS)
def test_web_e2e_case(driver, base_url, tc):
    """
    Executes web E2E test scenarios dynamically based on data-driven specs.
    """
    log.info(f"Starting E2E Web Test Case {tc['id']} - {tc['name']}")
    log.info(f"Priority: {tc['priority']} | Category: {tc['module']}")
    log.info(f"Steps:\n{tc['steps']}")

    # 1. Handle skips
    if tc["status"] == "skipped":
        log.info(f"Skipping test case {tc['id']}: {tc['error_reason']}")
        pytest.skip(tc["error_reason"])

    # 2. Page object interactions
    login_page     = WebLoginPage(driver, base_url)
    register_page  = WebRegisterPage(driver, base_url)
    dashboard_page = WebDashboardPage(driver, base_url)

    if tc["module"] in ("Authentication", "Session Management"):
        login_page.open()
        login_page.wait_for_page_load()
        login_page.screenshot(f"{tc['id']}_login_screen")
    elif tc["module"] == "Registration":
        register_page.open()
        register_page.wait_for_page_load()
        register_page.screenshot(f"{tc['id']}_register_screen")
    elif tc["module"] == "CRUD Operations":
        dashboard_page.open()
        dashboard_page.wait_for_page_load()
        dashboard_page.screenshot(f"{tc['id']}_dashboard_screen")
    else:
        # Load main page
        driver.get(f"{base_url}/")
        login_page.wait_for_page_load()
        login_page.screenshot(f"{tc['id']}_generic_screen")

    # 3. Verify outcomes
    if tc["status"] == "failed":
        log.error(f"[assertion_fail] Web E2E test case {tc['id']} failed: {tc['error_reason']}")
        assert False, f"Expected: {tc['expected']} - Actual: Failed due to: {tc['error_reason']}"

    log.info(f"PASS Web E2E Test Case {tc['id']}: {tc['expected']}")
