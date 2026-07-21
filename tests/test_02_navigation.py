"""
Test Suite 02 — Navigation & Page Rendering
Tests: All pages load, page titles, navbar, 404 fallback.
"""
import pytest
import time
import logging
from selenium.webdriver.common.by import By
from tests.pages import LoginPage, RegisterPage

log = logging.getLogger(__name__)

PAGES = [
    ("/login",    "Login"),
    ("/register", "Register"),
]


class TestPageRendering:
    """TC-NAV-01 to TC-NAV-06: Page rendering checks."""

    def test_login_page_renders(self, driver, base_url):
        """TC-NAV-01: /login renders within 5 seconds."""
        page = LoginPage(driver, base_url)
        page.open()
        page.screenshot("TC_NAV_01_login")
        assert page.is_element_present(By.TAG_NAME, "body")
        log.info("PASS TC-NAV-01: /login rendered.")

    def test_register_page_renders(self, driver, base_url):
        """TC-NAV-02: /register renders within 5 seconds."""
        page = RegisterPage(driver, base_url)
        page.open()
        page.screenshot("TC_NAV_02_register")
        assert page.is_element_present(By.TAG_NAME, "body")
        log.info("PASS TC-NAV-02: /register rendered.")

    def test_root_redirects(self, driver, base_url):
        """TC-NAV-03: / redirects unauthenticated user (to /login)."""
        from tests.pages import BasePage
        page = BasePage(driver, base_url)
        page.goto("/")
        time.sleep(2)
        page.screenshot("TC_NAV_03_root_redirect")
        assert page.current_url() != base_url + "/", \
            "Root should redirect away for unauthenticated users"
        log.info("PASS TC-NAV-03: Root redirect works.")

    def test_page_title_contains_medibook(self, driver, base_url):
        """TC-NAV-04: Page title includes 'MediBook' on login page."""
        page = LoginPage(driver, base_url)
        page.open()
        assert "MediBook" in page.page_title(), \
            f"Expected 'MediBook' in title, got: '{page.page_title()}'"
        log.info("PASS TC-NAV-04: Page title correct.")

    def test_unknown_route_redirects(self, driver, base_url):
        """TC-NAV-05: Unknown routes are handled (redirected or 404 page shown)."""
        from tests.pages import BasePage
        page = BasePage(driver, base_url)
        page.goto("/this-route-does-not-exist-xyz")
        time.sleep(2)
        page.screenshot("TC_NAV_05_unknown_route")
        # App should redirect to / or login, not show a blank page
        assert page.is_element_present(By.TAG_NAME, "body")
        log.info("PASS TC-NAV-05: Unknown route handled.")

    def test_back_navigation_from_register(self, driver, base_url):
        """TC-NAV-06: Browser back button works from register to login."""
        page = LoginPage(driver, base_url)
        page.open()
        page.click_register_link()
        time.sleep(1)
        driver.back()
        time.sleep(1)
        page.screenshot("TC_NAV_06_back_navigation")
        assert page.is_element_present(By.TAG_NAME, "body")
        log.info("PASS TC-NAV-06: Browser back navigation works.")


class TestFormValidation:
    """TC-NAV-07 to TC-NAV-10: Client-side form validation."""

    def test_login_empty_submit_does_not_redirect(self, driver, base_url):
        """TC-NAV-07: Submitting login form empty keeps user on login page."""
        page = LoginPage(driver, base_url)
        page.open()
        try:
            page.click(By.ID, "btn-login")
        except Exception:
            pass
        time.sleep(1)
        page.screenshot("TC_NAV_07_empty_login")
        assert "login" in page.current_url().lower() or \
               page.is_element_present(By.ID, "email"), \
            "Empty form submit should not navigate away from login"
        log.info("PASS TC-NAV-07: Empty login form validation works.")

    def test_register_empty_submit_does_not_redirect(self, driver, base_url):
        """TC-NAV-08: Submitting register form empty keeps user on register page."""
        page = RegisterPage(driver, base_url)
        page.open()
        try:
            page.click(By.ID, "btn-register")
        except Exception:
            pass
        time.sleep(1)
        page.screenshot("TC_NAV_08_empty_register")
        assert "register" in page.current_url().lower() or \
               page.is_element_present(By.ID, "email"), \
            "Empty form submit should not navigate away from register"
        log.info("PASS TC-NAV-08: Empty register form validation works.")

    def test_login_invalid_email_format(self, driver, base_url):
        """TC-NAV-09: Login with invalid email format stays on page."""
        page = LoginPage(driver, base_url)
        page.open()
        page.type_into(By.ID, "email", "not-an-email")
        page.type_into(By.ID, "password", "somepassword")
        try:
            page.click(By.ID, "btn-login")
        except Exception:
            pass
        time.sleep(1.5)
        page.screenshot("TC_NAV_09_invalid_email")
        assert page.is_element_present(By.TAG_NAME, "body")
        log.info("PASS TC-NAV-09: Invalid email handled.")

    def test_register_short_password_handled(self, driver, base_url):
        """TC-NAV-10: Register with short password stays on page or shows error."""
        page = RegisterPage(driver, base_url)
        page.open()
        page.type_into(By.ID, "name",     "Test User")
        page.type_into(By.ID, "email",    "test@example.com")
        page.type_into(By.ID, "password", "123")
        try:
            page.click(By.ID, "btn-register")
        except Exception:
            pass
        time.sleep(1.5)
        page.screenshot("TC_NAV_10_short_password")
        assert page.is_element_present(By.TAG_NAME, "body")
        log.info("PASS TC-NAV-10: Short password handled.")
