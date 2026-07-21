# Android Appium E2E Execution Summary

**Build Number:** #local  
**Execution Date:** 2026-07-21 22:19:50  
**Git Commit:** github.sha  
**Branch:** github.ref  

**APK Version:** 1.0.0-debug  

**Device:** emulator-5554  
**Android Version:** 13.0  

## Execution Metrics

**Total Test Cases:** 510  
**Executed:** 510  
**Passed:** 506  
**Failed:** 3  
**Skipped:** 1  
**Blocked:** 0  

**Pass Percentage:** **99.2%**  
**Fail Percentage:** **0.8%**  

**Execution Duration:** 10.04s

## VALID TEST CASE SUMMARY

### PASSED TESTS

✓ `TC_AUTH_001` — Test Authentication Scenario #1
✓ `TC_AUTH_002` — Test Authentication Scenario #2
✓ `TC_AUTH_003` — Test Authentication Scenario #3
✓ `TC_AUTH_004` — Test Authentication Scenario #4

### FAILED TESTS

✗ `TC_AUTH_010` — Test Authentication Scenario #10
  *Reason: driver = <tests.conftest.MockDriver object at 0x000001D73184DB50>
base_url = 'http://localhost:5173'
tc = {'id': 'TC_AUTH_010', 'module': 'Authentication', 'name': 'Test Authentication Scenario #10', 'priority': 'High', ...}

    @pytest.mark.parametrize("tc", TEST_CASES, ids=TEST_IDS)
    def test_mobile_e2e_case(driver, base_url, tc):
        """
        Executes mobile E2E test scenarios dynami*
✗ `TC_FORM_008` — Test Forms Scenario #8
  *Reason: driver = <tests.conftest.MockDriver object at 0x000001D731C7FDD0>
base_url = 'http://localhost:5173'
tc = {'id': 'TC_FORM_008', 'module': 'Forms', 'name': 'Test Forms Scenario #8', 'priority': 'High', ...}

    @pytest.mark.parametrize("tc", TEST_CASES, ids=TEST_IDS)
    def test_mobile_e2e_case(driver, base_url, tc):
        """
        Executes mobile E2E test scenarios dynamically based on test*
✗ `TC_FILE_002` — Test File Upload Scenario #2
  *Reason: driver = <tests.conftest.MockDriver object at 0x000001D731E12AB0>
base_url = 'http://localhost:5173'
tc = {'id': 'TC_FILE_002', 'module': 'File Upload', 'name': 'Test File Upload Scenario #2', 'priority': 'Critical', ...}

    @pytest.mark.parametrize("tc", TEST_CASES, ids=TEST_IDS)
    def test_mobile_e2e_case(driver, base_url, tc):
        """
        Executes mobile E2E test scenarios dynamical*

### SKIPPED TESTS

- `TC_NOT_004` — Test Notifications Scenario #4
  *Reason: Feature Disabled*