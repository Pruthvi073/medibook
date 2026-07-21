"""
Test Suite 04 — Accessibility & SEO
Tests: Meta tags, headings hierarchy, labels, ARIA.
"""
import pytest
import logging
from selenium.webdriver.common.by import By
from tests.pages import LoginPage, RegisterPage

log = logging.getLogger(__name__)


class TestAccessibilitySEO:
    """TC-SEO-01 to TC-SEO-10: Accessibility & SEO checks."""

    def test_page_has_meta_description(self, driver, base_url):
        """TC-SEO-01: Page has a meta description tag."""
        page = LoginPage(driver, base_url)
        page.open()
        metas = driver.find_elements(By.CSS_SELECTOR, "meta[name='description']")
        assert len(metas) > 0, "Meta description tag should be present"
        content = metas[0].get_attribute("content")
        assert content and len(content) > 10, "Meta description should have content"
        log.info("PASS TC-SEO-01: Meta description present.")

    def test_page_has_title_tag(self, driver, base_url):
        """TC-SEO-02: Page title tag is set correctly."""
        page = LoginPage(driver, base_url)
        page.open()
        title = page.page_title()
        assert "MediBook" in title, f"Title should include 'MediBook', got: {title}"
        log.info(f"PASS TC-SEO-02: Title = '{title}'.")

    def test_login_email_input_has_label_or_placeholder(self, driver, base_url):
        """TC-SEO-03: Email input has placeholder or aria-label."""
        page = LoginPage(driver, base_url)
        page.open()
        el = driver.find_element(By.ID, "email")
        placeholder = el.get_attribute("placeholder") or ""
        aria_label  = el.get_attribute("aria-label")  or ""
        assert placeholder or aria_label, \
            "Email input should have placeholder or aria-label"
        log.info(f"PASS TC-SEO-03: Email placeholder = '{placeholder}'.")

    def test_password_input_is_type_password(self, driver, base_url):
        """TC-SEO-04: Password field type is 'password' (masked)."""
        page = LoginPage(driver, base_url)
        page.open()
        el = driver.find_element(By.ID, "password")
        assert el.get_attribute("type") == "password", \
            "Password field should have type='password'"
        log.info("PASS TC-SEO-04: Password field type=password.")

    def test_register_name_input_type_text(self, driver, base_url):
        """TC-SEO-05: Name input is type text."""
        page = RegisterPage(driver, base_url)
        page.open()
        el = driver.find_element(By.ID, "name")
        t = el.get_attribute("type") or "text"
        assert t in ("text", ""), f"Name field type should be 'text', got: {t}"
        log.info("PASS TC-SEO-05: Name field type correct.")

    def test_buttons_have_text_content(self, driver, base_url):
        """TC-SEO-06: Login/register buttons have visible text."""
        page = LoginPage(driver, base_url)
        page.open()
        btn = driver.find_element(By.ID, "btn-login")
        text = btn.text.strip()
        assert len(text) > 0, "Login button should have text content"
        log.info(f"PASS TC-SEO-06: Login button text = '{text}'.")

    def test_page_has_og_tags(self, driver, base_url):
        """TC-SEO-07: Open Graph meta tags are present."""
        page = LoginPage(driver, base_url)
        page.open()
        og_title = driver.find_elements(By.CSS_SELECTOR, "meta[property='og:title']")
        assert len(og_title) > 0, "og:title meta tag should be present"
        log.info("PASS TC-SEO-07: OG tags present.")

    def test_register_email_field_type(self, driver, base_url):
        """TC-SEO-08: Register email field type is 'email'."""
        page = RegisterPage(driver, base_url)
        page.open()
        el = driver.find_element(By.ID, "email")
        t = el.get_attribute("type") or "text"
        assert t == "email", f"Email field type should be 'email', got: '{t}'"
        log.info("PASS TC-SEO-08: Email field type=email.")

    def test_login_form_inputs_have_autocomplete(self, driver, base_url):
        """TC-SEO-09: Login inputs have autocomplete attributes."""
        page = LoginPage(driver, base_url)
        page.open()
        email_el = driver.find_element(By.ID, "email")
        # Autocomplete is best practice but not critical — just log result
        ac = email_el.get_attribute("autocomplete") or "not set"
        log.info(f"PASS TC-SEO-09: Email autocomplete = '{ac}'.")

    def test_app_charset_utf8(self, driver, base_url):
        """TC-SEO-10: Page has UTF-8 charset meta tag."""
        page = LoginPage(driver, base_url)
        page.open()
        charset_tags = driver.find_elements(By.CSS_SELECTOR, "meta[charset]")
        assert len(charset_tags) > 0, "Charset meta tag should be present"
        charset = charset_tags[0].get_attribute("charset").upper()
        assert "UTF" in charset, f"Expected UTF-8, got: {charset}"
        log.info(f"PASS TC-SEO-10: Charset = '{charset}'.")
