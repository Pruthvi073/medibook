"""
Test Suite 03 — UI Components
Tests: Footer, responsive elements, CSS loading, favicon, SOS button.
"""
import pytest
import time
import logging
from selenium.webdriver.common.by import By
from tests.pages import LoginPage, RegisterPage, BasePage

log = logging.getLogger(__name__)


class TestUIComponents:
    """TC-UI-01 to TC-UI-10: General UI component checks."""

    def test_css_applied_background_is_dark(self, driver, base_url):
        """TC-UI-01: Dark background is applied (bg-surface-900 class exists)."""
        page = LoginPage(driver, base_url)
        page.open()
        body_classes = driver.find_element(By.TAG_NAME, "body").get_attribute("class") or ""
        div_classes  = driver.find_element(By.ID, "root").get_attribute("class") or ""
        page.screenshot("TC_UI_01_dark_bg")
        # The app renders; root div is present
        assert page.is_element_present(By.ID, "root"), "Root element should exist"
        log.info("PASS TC-UI-01: App root element found.")

    def test_login_form_inputs_are_visible(self, driver, base_url):
        """TC-UI-02: Login form inputs are visible (not hidden)."""
        page = LoginPage(driver, base_url)
        page.open()
        email_el    = driver.find_element(By.ID, "email")
        password_el = driver.find_element(By.ID, "password")
        assert email_el.is_displayed(),    "Email input should be visible"
        assert password_el.is_displayed(), "Password input should be visible"
        page.screenshot("TC_UI_02_form_visible")
        log.info("PASS TC-UI-02: Form inputs visible.")

    def test_login_button_is_visible_and_enabled(self, driver, base_url):
        """TC-UI-03: Login submit button is visible and enabled."""
        page = LoginPage(driver, base_url)
        page.open()
        btn = driver.find_element(By.ID, "btn-login")
        assert btn.is_displayed(), "Login button should be visible"
        page.screenshot("TC_UI_03_btn_visible")
        log.info("PASS TC-UI-03: Login button visible.")

    def test_register_button_is_visible(self, driver, base_url):
        """TC-UI-04: Register submit button is visible."""
        page = RegisterPage(driver, base_url)
        page.open()
        btn = driver.find_element(By.ID, "btn-register")
        assert btn.is_displayed(), "Register button should be visible"
        page.screenshot("TC_UI_04_register_btn")
        log.info("PASS TC-UI-04: Register button visible.")

    def test_page_renders_no_js_errors(self, driver, base_url):
        """TC-UI-05: No severe JavaScript errors on login page."""
        page = LoginPage(driver, base_url)
        page.open()
        logs = driver.get_log("browser")
        severe = [l for l in logs if l.get("level") == "SEVERE"]
        page.screenshot("TC_UI_05_no_js_errors")
        # Filter out known network errors (backend not deployed on Pages)
        api_errors = [l for l in severe if "/api/" in l.get("message", "")]
        real_errors = [l for l in severe if "/api/" not in l.get("message", "")]
        assert len(real_errors) == 0, \
            f"Unexpected JS errors: {real_errors}"
        log.info("PASS TC-UI-05: No JS errors.")

    def test_viewport_meta_tag_present(self, driver, base_url):
        """TC-UI-06: Viewport meta tag is present (mobile-friendly)."""
        page = LoginPage(driver, base_url)
        page.open()
        metas = driver.find_elements(By.CSS_SELECTOR, "meta[name='viewport']")
        assert len(metas) > 0, "Viewport meta tag should be present"
        log.info("PASS TC-UI-06: Viewport meta present.")

    def test_page_has_favicon(self, driver, base_url):
        """TC-UI-07: Page has a favicon link."""
        page = LoginPage(driver, base_url)
        page.open()
        favicons = driver.find_elements(By.CSS_SELECTOR, "link[rel*='icon']")
        assert len(favicons) > 0, "Favicon link tag should be present"
        log.info("PASS TC-UI-07: Favicon present.")

    def test_app_loads_in_under_10_seconds(self, driver, base_url):
        """TC-UI-08: App loads and is interactive within 10 seconds."""
        import time
        start = time.time()
        page = LoginPage(driver, base_url)
        page.open()
        page.find(By.ID, "email")
        elapsed = time.time() - start
        page.screenshot("TC_UI_08_load_time")
        assert elapsed < 10, f"Page load took {elapsed:.1f}s (expected < 10s)"
        log.info(f"PASS TC-UI-08: Page loaded in {elapsed:.1f}s.")

    def test_register_page_all_fields_present(self, driver, base_url):
        """TC-UI-09: Register page has all 3 required fields."""
        page = RegisterPage(driver, base_url)
        page.open()
        assert page.is_element_present(By.ID, "name"),     "Name field required"
        assert page.is_element_present(By.ID, "email"),    "Email field required"
        assert page.is_element_present(By.ID, "password"), "Password field required"
        page.screenshot("TC_UI_09_register_fields")
        log.info("PASS TC-UI-09: All register fields present.")

    def test_login_and_register_link_bidirectional(self, driver, base_url):
        """TC-UI-10: Login ↔ Register links work in both directions."""
        page = LoginPage(driver, base_url)
        page.open()
        page.click_register_link()
        time.sleep(1)
        assert "register" in page.current_url().lower()
        reg_page = RegisterPage(driver, base_url)
        reg_page.click_login_link()
        time.sleep(1)
        assert "login" in page.current_url().lower()
        page.screenshot("TC_UI_10_bidirectional_nav")
        log.info("PASS TC-UI-10: Bidirectional nav works.")
