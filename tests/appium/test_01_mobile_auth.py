"""
Appium Test Suite 01 — Mobile Authentication
Tests login/register pages on Chrome Android emulator.
"""
import time
import logging
import pytest
from selenium.webdriver.common.by import By
from tests.appium.pages import MobileLoginPage, MobileRegisterPage

log = logging.getLogger(__name__)


@pytest.mark.smoke
class TestMobileLoginPage:
    """TC-MOB-AUTH-01 to 06: Login page on mobile Chrome."""

    def test_login_page_loads_on_mobile(self, driver, base_url):
        """TC-MOB-AUTH-01: Login page loads on mobile Chrome."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        page.wait_for_page_load()
        page.screenshot("TC_MOB_AUTH_01_login")
        assert "MediBook" in page.page_title(), \
            f"Title should contain MediBook, got: {page.page_title()}"
        log.info("PASS TC-MOB-AUTH-01: Login page loaded on mobile.")

    def test_login_email_input_tappable(self, driver, base_url):
        """TC-MOB-AUTH-02: Email input is tappable on mobile."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        el = page.find_clickable(By.ID, "email")
        assert el.is_displayed(), "Email input must be tappable"
        el.click()
        page.screenshot("TC_MOB_AUTH_02_email_tap")
        log.info("PASS TC-MOB-AUTH-02: Email input tappable.")

    def test_login_password_input_tappable(self, driver, base_url):
        """TC-MOB-AUTH-03: Password input is tappable on mobile."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        el = page.find_clickable(By.ID, "password")
        assert el.is_displayed(), "Password input must be tappable"
        page.screenshot("TC_MOB_AUTH_03_password_tap")
        log.info("PASS TC-MOB-AUTH-03: Password input tappable.")

    def test_login_submit_button_tappable(self, driver, base_url):
        """TC-MOB-AUTH-04: Login button is tappable on mobile."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        el = page.find_clickable(By.ID, "btn-login")
        assert el.is_displayed(), "Login button must be visible"
        page.screenshot("TC_MOB_AUTH_04_login_btn")
        log.info("PASS TC-MOB-AUTH-04: Login button tappable.")

    def test_login_to_register_navigation(self, driver, base_url):
        """TC-MOB-AUTH-05: Register link navigates from login page."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        page.click_register()
        time.sleep(2)
        page.screenshot("TC_MOB_AUTH_05_to_register")
        assert "register" in page.current_url().lower(), \
            f"Expected /register, got: {page.current_url()}"
        log.info("PASS TC-MOB-AUTH-05: Register link works on mobile.")

    def test_unauthenticated_redirect_on_mobile(self, driver, base_url):
        """TC-MOB-AUTH-06: Unauthenticated access redirects to login on mobile."""
        from tests.appium.pages import MobileBasePage
        page = MobileBasePage(driver, base_url)
        page.goto("/")
        time.sleep(3)
        page.screenshot("TC_MOB_AUTH_06_auth_redirect")
        assert "login" in page.current_url().lower(), \
            f"Should redirect to login, got: {page.current_url()}"
        log.info("PASS TC-MOB-AUTH-06: Auth redirect works on mobile.")


@pytest.mark.smoke
class TestMobileRegisterPage:
    """TC-MOB-AUTH-07 to 10: Register page on mobile Chrome."""

    def test_register_page_loads_on_mobile(self, driver, base_url):
        """TC-MOB-AUTH-07: Register page loads on mobile Chrome."""
        page = MobileRegisterPage(driver, base_url)
        page.open()
        page.wait_for_page_load()
        page.screenshot("TC_MOB_AUTH_07_register")
        assert "MediBook" in page.page_title()
        log.info("PASS TC-MOB-AUTH-07: Register page loaded on mobile.")

    def test_register_all_fields_visible_on_mobile(self, driver, base_url):
        """TC-MOB-AUTH-08: All register form fields visible on mobile viewport."""
        page = MobileRegisterPage(driver, base_url)
        page.open()
        assert page.is_present(By.ID, "name"),     "Name field required"
        assert page.is_present(By.ID, "email"),    "Email field required"
        assert page.is_present(By.ID, "password"), "Password field required"
        page.screenshot("TC_MOB_AUTH_08_register_fields")
        log.info("PASS TC-MOB-AUTH-08: All register fields visible on mobile.")

    def test_register_login_link_works_on_mobile(self, driver, base_url):
        """TC-MOB-AUTH-09: Login link on register page works on mobile."""
        page = MobileRegisterPage(driver, base_url)
        page.open()
        page.click_login()
        time.sleep(2)
        page.screenshot("TC_MOB_AUTH_09_to_login")
        assert "login" in page.current_url().lower()
        log.info("PASS TC-MOB-AUTH-09: Login link works on mobile.")

    def test_mobile_keyboard_appears_on_input_tap(self, driver, base_url):
        """TC-MOB-AUTH-10: Tapping email field triggers keyboard (or at least focuses)."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        el = page.find_clickable(By.ID, "email")
        el.click()
        el.send_keys("test")
        val = el.get_attribute("value") or ""
        page.screenshot("TC_MOB_AUTH_10_keyboard_input")
        assert "test" in val, f"Typing into email field failed, got: '{val}'"
        log.info("PASS TC-MOB-AUTH-10: Keyboard input works on mobile.")
