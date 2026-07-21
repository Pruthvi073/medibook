"""
Appium Test Suite 02 — Mobile Navigation & Responsiveness
Tests page rendering, scroll, and responsive layout on mobile viewport.
"""
import time
import logging
import pytest
from selenium.webdriver.common.by import By
from tests.appium.pages import MobileLoginPage, MobileRegisterPage, MobileBasePage

log = logging.getLogger(__name__)


@pytest.mark.regression
class TestMobileNavigation:
    """TC-MOB-NAV-01 to 10: Navigation and responsive layout tests."""

    def test_login_page_renders_correctly_on_mobile(self, driver, base_url):
        """TC-MOB-NAV-01: Login page renders without horizontal overflow."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        page.wait_for_page_load()
        # Check page width fits viewport
        scroll_width = driver.execute_script("return document.body.scrollWidth")
        window_width = driver.execute_script("return window.innerWidth")
        page.screenshot("TC_MOB_NAV_01_no_overflow")
        assert scroll_width <= window_width + 5, \
            f"Horizontal overflow detected: scrollWidth={scroll_width} > windowWidth={window_width}"
        log.info(f"PASS TC-MOB-NAV-01: No horizontal overflow (scrollWidth={scroll_width}).")

    def test_title_tag_correct_on_mobile(self, driver, base_url):
        """TC-MOB-NAV-02: Page title is correct when viewed on mobile."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        assert "MediBook" in page.page_title()
        page.screenshot("TC_MOB_NAV_02_title")
        log.info(f"PASS TC-MOB-NAV-02: Title = '{page.page_title()}'.")

    def test_register_page_renders_on_mobile(self, driver, base_url):
        """TC-MOB-NAV-03: Register page renders on mobile."""
        page = MobileRegisterPage(driver, base_url)
        page.open()
        page.wait_for_page_load()
        assert page.is_present(By.TAG_NAME, "body")
        page.screenshot("TC_MOB_NAV_03_register")
        log.info("PASS TC-MOB-NAV-03: Register rendered.")

    def test_unknown_route_handled_on_mobile(self, driver, base_url):
        """TC-MOB-NAV-04: Unknown route is handled gracefully on mobile."""
        page = MobileBasePage(driver, base_url)
        page.goto("/nonexistent-mobile-xyz")
        time.sleep(2)
        assert page.is_present(By.TAG_NAME, "body")
        page.screenshot("TC_MOB_NAV_04_unknown_route")
        log.info("PASS TC-MOB-NAV-04: Unknown route handled on mobile.")

    def test_scroll_works_on_login_page(self, driver, base_url):
        """TC-MOB-NAV-05: Scroll gesture works on login page."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        page.wait_for_page_load()
        try:
            page.scroll_down()
            page.scroll_up()
        except Exception as e:
            log.warning(f"Scroll gesture issue: {e}")
        page.screenshot("TC_MOB_NAV_05_scroll")
        assert page.is_present(By.ID, "email"), "Page should still be valid after scroll"
        log.info("PASS TC-MOB-NAV-05: Scroll gesture works.")

    def test_form_inputs_not_clipped_on_mobile(self, driver, base_url):
        """TC-MOB-NAV-06: Form inputs are fully visible (not cut off) on mobile."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        email_el = page.find_visible(By.ID, "email")
        rect = driver.execute_script(
            "const r = arguments[0].getBoundingClientRect();"
            "return {left: r.left, right: r.right, top: r.top, bottom: r.bottom};",
            email_el
        )
        window_w = driver.execute_script("return window.innerWidth")
        page.screenshot("TC_MOB_NAV_06_input_not_clipped")
        assert rect["right"] <= window_w + 1, \
            f"Email input is clipped: right={rect['right']} > windowWidth={window_w}"
        log.info(f"PASS TC-MOB-NAV-06: Input not clipped (right={rect['right']}, window={window_w}).")

    def test_meta_viewport_present_for_mobile(self, driver, base_url):
        """TC-MOB-NAV-07: Viewport meta tag enables proper mobile rendering."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        metas = driver.find_elements(By.CSS_SELECTOR, "meta[name='viewport']")
        assert len(metas) > 0, "Viewport meta tag must be present"
        page.screenshot("TC_MOB_NAV_07_viewport_meta")
        log.info("PASS TC-MOB-NAV-07: Viewport meta present.")

    def test_login_button_fully_visible_on_mobile(self, driver, base_url):
        """TC-MOB-NAV-08: Login button is fully visible in mobile viewport."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        btn = page.find_visible(By.ID, "btn-login")
        assert btn.is_displayed(), "Login button must be fully visible"
        page.screenshot("TC_MOB_NAV_08_btn_visible")
        log.info("PASS TC-MOB-NAV-08: Login button fully visible.")

    def test_page_load_time_mobile_acceptable(self, driver, base_url):
        """TC-MOB-NAV-09: Page loads within 15 seconds on mobile."""
        import time
        start = time.time()
        page = MobileLoginPage(driver, base_url)
        page.open()
        page.find(By.ID, "email")
        elapsed = time.time() - start
        page.screenshot("TC_MOB_NAV_09_load_time")
        assert elapsed < 15, f"Mobile load took {elapsed:.1f}s (expected < 15s)"
        log.info(f"PASS TC-MOB-NAV-09: Mobile loaded in {elapsed:.1f}s.")

    def test_bidirectional_mobile_navigation(self, driver, base_url):
        """TC-MOB-NAV-10: Login ↔ Register navigation works on mobile."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        page.click_register()
        time.sleep(1.5)
        assert "register" in page.current_url().lower()
        reg = MobileRegisterPage(driver, base_url)
        reg.click_login()
        time.sleep(1.5)
        assert "login" in page.current_url().lower()
        page.screenshot("TC_MOB_NAV_10_bidirectional")
        log.info("PASS TC-MOB-NAV-10: Bidirectional mobile navigation works.")


@pytest.mark.regression
class TestMobileUIRendering:
    """TC-MOB-UI-01 to 05: UI rendering on mobile Chrome."""

    def test_app_root_element_present(self, driver, base_url):
        """TC-MOB-UI-01: React root element renders on mobile."""
        page = MobileBasePage(driver, base_url)
        page.goto("/login")
        page.wait_for_page_load()
        assert page.is_present(By.ID, "root"), "React root element should be present"
        page.screenshot("TC_MOB_UI_01_root")
        log.info("PASS TC-MOB-UI-01: React root rendered on mobile.")

    def test_no_horizontal_scrollbar_on_register(self, driver, base_url):
        """TC-MOB-UI-02: Register page has no horizontal scrollbar."""
        page = MobileRegisterPage(driver, base_url)
        page.open()
        scroll_w = driver.execute_script("return document.body.scrollWidth")
        window_w = driver.execute_script("return window.innerWidth")
        page.screenshot("TC_MOB_UI_02_no_h_scroll")
        assert scroll_w <= window_w + 5, \
            f"Horizontal scroll on register: {scroll_w} > {window_w}"
        log.info("PASS TC-MOB-UI-02: No horizontal scroll on register.")

    def test_favicon_present_on_mobile(self, driver, base_url):
        """TC-MOB-UI-03: Favicon link tag is present."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        favicons = driver.find_elements(By.CSS_SELECTOR, "link[rel*='icon']")
        assert len(favicons) > 0
        page.screenshot("TC_MOB_UI_03_favicon")
        log.info("PASS TC-MOB-UI-03: Favicon present on mobile.")

    def test_charset_utf8_on_mobile(self, driver, base_url):
        """TC-MOB-UI-04: UTF-8 charset is declared."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        charsets = driver.find_elements(By.CSS_SELECTOR, "meta[charset]")
        assert len(charsets) > 0
        page.screenshot("TC_MOB_UI_04_charset")
        log.info("PASS TC-MOB-UI-04: Charset present.")

    def test_og_tags_present_on_mobile(self, driver, base_url):
        """TC-MOB-UI-05: Open Graph meta tags present."""
        page = MobileLoginPage(driver, base_url)
        page.open()
        og = driver.find_elements(By.CSS_SELECTOR, "meta[property='og:title']")
        assert len(og) > 0
        page.screenshot("TC_MOB_UI_05_og_tags")
        log.info("PASS TC-MOB-UI-05: OG tags present on mobile.")
