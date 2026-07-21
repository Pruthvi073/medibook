"""
dashboard_page.py — Web Dashboard Page Object.
"""
from selenium.webdriver.common.by import By
from .base_page import WebBasePage

class WebDashboardPage(WebBasePage):
    HEADING      = (By.TAG_NAME, "h1")
    LOGOUT_BTN   = (By.ID, "btn-logout")
    VITALS_LINK  = (By.CSS_SELECTOR, "a[href*='vitals']")
    REPORTS_LINK = (By.CSS_SELECTOR, "a[href*='reports']")
    HISTORY_LINK = (By.CSS_SELECTOR, "a[href*='history']")

    def open(self):
        return self.goto("/dashboard")

    def get_heading(self) -> str:
        return self.get_text_content(*self.HEADING)

    def logout(self):
        self.click_element(*self.LOGOUT_BTN)
        return self

    def navigate_to_vitals(self):
        self.click_element(*self.VITALS_LINK)
        return self
