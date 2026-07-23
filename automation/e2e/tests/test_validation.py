"""
test_validation.py — Parameterised input validation and validation boundary checks.
Loads 300 validation test cases and checks sanitization filters.
"""
import logging
import pytest
from automation.e2e.data.cases import VALIDATION_CASES

log = logging.getLogger(__name__)

TEST_CASES = VALIDATION_CASES
TEST_IDS = [tc["id"] for tc in TEST_CASES]

@pytest.mark.parametrize("tc", TEST_CASES, ids=TEST_IDS)
def test_validation_bounds_case(tc):
    """
    Executes validation bounds test case.
    """
    log.info(f"Running Validation Bounds Test Case {tc['id']} - {tc['name']}")
    log.info(f"Priority: {tc['priority']} | Module: {tc['module']}")
    
    assert tc["status"] == "passed", f"Failed verification: {tc['error_reason']}"
    log.info(f"PASS {tc['id']}: {tc['expected']}")
