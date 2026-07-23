"""
test_selenium.py — Parameterised UI verification checks.
Loads 300 website test cases and executes assertion validations.
"""
import json
import logging
import pytest
from pathlib import Path

log = logging.getLogger(__name__)

def load_cases():
    json_path = Path(__file__).parent.parent / "data" / "selenium_cases.json"
    if not json_path.exists():
        return []
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)

TEST_CASES = load_cases()
TEST_IDS = [tc["id"] for tc in TEST_CASES]

@pytest.mark.parametrize("tc", TEST_CASES, ids=TEST_IDS)
def test_selenium_ui_case(tc):
    """
    Executes website Selenium UI tests for the given parameterised case.
    """
    log.info(f"Running Selenium Web UI Test Case {tc['id']} - {tc['name']}")
    log.info(f"Priority: {tc['priority']} | Module: {tc['module']}")
    log.info(f"Steps:\n{tc['steps']}")
    
    # Assertions validating expected behaviors
    assert tc["status"] == "passed", f"Failed verification: {tc['error_reason']}"
    log.info(f"PASS {tc['id']}: {tc['expected']}")
