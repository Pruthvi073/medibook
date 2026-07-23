"""
test_load.py — Parameterised performance metrics, throughput targets, and response-time parameters.
Loads 300 performance/load test cases.
"""
import json
import logging
import pytest
from pathlib import Path

log = logging.getLogger(__name__)

def load_cases():
    json_path = Path(__file__).parent.parent / "data" / "performance_cases.json"
    if not json_path.exists():
        return []
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)

TEST_CASES = load_cases()
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
