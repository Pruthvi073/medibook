"""
Test Suite 01 — Authentication
Tests: Login page UI, Register page UI, client-side validation,
       redirect on unauthenticated access.
"""
import pytest
import time
import logging
from selenium.webdriver.common.by import By
from tests.pages import LoginPage, RegisterPage

log = logging.getLogger(__name__)


class TestLoginPage:
    """TC-AUTH-01 to TC-AUTH-05: Login page tests."""

    def test_login_page_loads(self, driver, base_url):
        """TC-AUTH-01: Login page renders with correct title."""
        page = LoginPage(driver, base_url)
        page.open()
        page.screenshot("TC_AUTH_01_login_page")
        assert "MediBook" in page.page_title(), "Page title should contain MediBook"
        log.info("PASS TC-AUTH-01: Login page loaded.")

    def test_login_page_has_email_field(self, driver, base_url):
        """TC-AUTH-02: Login page contains email input."""
        page = LoginPage(driver, base_url)
        page.open()
        assert page.is_element_present(By.ID, "email"), "Email input should be present"
        log.info("PASS TC-AUTH-02: Email field present.")

    def test_login_page_has_password_field(self, driver, base_url):
        """TC-AUTH-03: Login page contains password input."""
        page = LoginPage(driver, base_url)
        page.open()
        assert page.is_element_present(By.ID, "password"), "Password input should be present"
        log.info("PASS TC-AUTH-03: Password field present.")

    def test_login_page_has_submit_button(self, driver, base_url):
        """TC-AUTH-04: Login page has a submit button."""
        page = LoginPage(driver, base_url)
        page.open()
        assert page.is_element_present(By.ID, "btn-login"), "Submit button should be present"
        log.info("PASS TC-AUTH-04: Submit button present.")

    def test_login_page_register_link_navigates(self, driver, base_url):
        """TC-AUTH-05: Register link on login page navigates to /register."""
        page = LoginPage(driver, base_url)
        page.open()
        page.click_register_link()
        time.sleep(1)
        assert "register" in page.current_url().lower(), \
            f"Should navigate to register, got: {page.current_url()}"
        page.screenshot("TC_AUTH_05_register_link")
        log.info("PASS TC-AUTH-05: Register link works.")


class TestRegisterPage:
    """TC-AUTH-06 to TC-AUTH-10: Register page tests."""

    def test_register_page_loads(self, driver, base_url):
        """TC-AUTH-06: Register page renders correctly."""
        page = RegisterPage(driver, base_url)
        page.open()
        page.screenshot("TC_AUTH_06_register_page")
        assert "MediBook" in page.page_title(), "Page title should contain MediBook"
        log.info("PASS TC-AUTH-06: Register page loaded.")

    def test_register_page_has_name_field(self, driver, base_url):
        """TC-AUTH-07: Register page contains name input."""
        page = RegisterPage(driver, base_url)
        page.open()
        assert page.is_element_present(By.ID, "name"), "Name input should be present"
        log.info("PASS TC-AUTH-07: Name field present.")

    def test_register_page_has_email_field(self, driver, base_url):
        """TC-AUTH-08: Register page contains email input."""
        page = RegisterPage(driver, base_url)
        page.open()
        assert page.is_element_present(By.ID, "email"), "Email input should be present"
        log.info("PASS TC-AUTH-08: Email field present.")

    def test_register_page_has_password_field(self, driver, base_url):
        """TC-AUTH-09: Register page contains password input."""
        page = RegisterPage(driver, base_url)
        page.open()
        assert page.is_element_present(By.ID, "password"), "Password input should be present"
        log.info("PASS TC-AUTH-09: Password field present.")

    def test_register_login_link_navigates(self, driver, base_url):
        """TC-AUTH-10: Login link on register page navigates to /login."""
        page = RegisterPage(driver, base_url)
        page.open()
        page.click_login_link()
        time.sleep(1)
        assert "login" in page.current_url().lower(), \
            f"Should navigate to login, got: {page.current_url()}"
        page.screenshot("TC_AUTH_10_login_link")
        log.info("PASS TC-AUTH-10: Login link works.")


class TestRedirects:
    """TC-AUTH-11: Unauthenticated access redirects to login."""

    def test_protected_route_redirects_to_login(self, driver, base_url):
        """TC-AUTH-11: Accessing / without auth redirects to /login."""
        from tests.pages import BasePage
        page = BasePage(driver, base_url)
        page.goto("/")
        time.sleep(2)
        url = page.current_url()
        page.screenshot("TC_AUTH_11_redirect")
        assert "login" in url.lower(), \
            f"Unauthenticated access should redirect to login, got: {url}"
        log.info("PASS TC-AUTH-11: Protected route redirect works.")
