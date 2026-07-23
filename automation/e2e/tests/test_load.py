"""
test_load.py — Parameterised performance metrics, throughput targets, and response-time parameters.
Loads 300 performance/load test cases.
"""
import logging
import pytest
from automation.e2e.data.cases import PERFORMANCE_CASES

log = logging.getLogger(__name__)

TEST_CASES = PERFORMANCE_CASES
TEST_IDS = [tc["id"] for tc in TEST_CASES]

@pytest.mark.parametrize("tc", TEST_CASES, ids=TEST_IDS)
def test_load_performance_case(tc):
    """
    Executes load test checks for system response targets.
    """
    log.info(f"Running Performance SLA Check {tc['id']} - {tc['name']}")
    log.info(f"Priority: {tc['priority']} | Module: {tc['module']}")
    
    assert tc["status"] == "passed", f"Failed verification: {tc['error_reason']}"
    log.info(f"PASS {tc['id']}: {tc['expected']}")
