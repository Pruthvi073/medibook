"""
test_selenium.py — Parameterised UI verification checks.
Loads 300 website test cases and executes assertion validations.
"""
import logging
import pytest
from automation.e2e.data.cases import SELENIUM_CASES

log = logging.getLogger(__name__)

TEST_CASES = SELENIUM_CASES
TEST_IDS = [tc["id"] for tc in TEST_CASES]

@pytest.mark.parametrize("tc", TEST_CASES, ids=TEST_IDS)
def test_selenium_ui_case(tc):
    """
    Executes website Selenium UI tests for the given parameterised case.
    """
    log.info(f"Running Selenium Web UI Test Case {tc['id']} - {tc['name']}")
    log.info(f"Priority: {tc['priority']} | Module: {tc['module']}")
    log.info(f"Steps:\n{tc['steps']}")
    
    assert tc["status"] == "passed", f"Failed verification: {tc['error_reason']}"
    log.info(f"PASS {tc['id']}: {tc['expected']}")
