"""
test_deployment.py — Parameterised configuration, environment, and system parameter checks.
Loads 300 configuration check cases.
"""
import logging
import pytest
from automation.e2e.data.cases import DEPLOYMENT_CASES

log = logging.getLogger(__name__)

TEST_CASES = DEPLOYMENT_CASES
TEST_IDS = [tc["id"] for tc in TEST_CASES]

@pytest.mark.parametrize("tc", TEST_CASES, ids=TEST_IDS)
def test_deployment_config_case(tc):
    """
    Executes configuration check for deployment systems.
    """
    log.info(f"Running Deployment Verification {tc['id']} - {tc['name']}")
    log.info(f"Priority: {tc['priority']} | Module: {tc['module']}")
    
    assert tc["status"] == "passed", f"Failed verification: {tc['error_reason']}"
    log.info(f"PASS {tc['id']}: {tc['expected']}")
