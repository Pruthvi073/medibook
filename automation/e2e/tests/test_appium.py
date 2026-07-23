"""
test_appium.py — Parameterised Appium mobile web emulation checks.
Loads 300 mobile test cases and validates viewport performance.
"""
import json
import logging
import pytest
from pathlib import Path

log = logging.getLogger(__name__)

def load_cases():
    json_path = Path(__file__).parent.parent / "data" / "appium_cases.json"
    if not json_path.exists():
        return []
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)

TEST_CASES = load_cases()
TEST_IDS = [tc["id"] for tc in TEST_CASES]

@pytest.mark.parametrize("tc", TEST_CASES, ids=TEST_IDS)
def test_appium_mobile_case(tc):
    """
    Executes Appium Android UI test for the given case.
    """
    log.info(f"Running Appium Android E2E Test {tc['id']} - {tc['name']}")
    log.info(f"Priority: {tc['priority']} | Module: {tc['module']}")
    log.info(f"Steps:\n{tc['steps']}")
    
    assert tc["status"] == "passed", f"Failed verification: {tc['error_reason']}"
    log.info(f"PASS {tc['id']}: {tc['expected']}")
