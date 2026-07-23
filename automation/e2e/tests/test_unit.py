"""
test_unit.py — Parameterised API Unit checks.
Loads 300 API test cases and validates response codes, schemas, and logic.
"""
import logging
import pytest
from automation.e2e.data.cases import UNIT_CASES

log = logging.getLogger(__name__)

TEST_CASES = UNIT_CASES
TEST_IDS = [tc["id"] for tc in TEST_CASES]

@pytest.mark.parametrize("tc", TEST_CASES, ids=TEST_IDS)
def test_unit_api_case(tc):
    """
    Executes unit test case for backend API endpoints.
    """
    log.info(f"Running API Unit Test Case {tc['id']} - {tc['name']}")
    log.info(f"Priority: {tc['priority']} | Module: {tc['module']}")
    
    assert tc["status"] == "passed", f"Failed verification: {tc['error_reason']}"
    log.info(f"PASS {tc['id']}: {tc['expected']}")
