"""Vitals Tracker Page Object."""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class VitalsPage(BasePage):
    HEADING     = (By.TAG_NAME, "h1")
    LOG_BTN     = (By.CSS_SELECTOR, "button[id*='log'], #btn-log-vital")
    NAVBAR      = (By.TAG_NAME, "nav")
    TABLE       = (By.CSS_SELECTOR, "table, [role='table']")

    def open(self):
        return self.goto("/vitals")

    def get_heading(self) -> str:
        return self.get_text(*self.HEADING)

    def is_log_button_present(self) -> bool:
        return self.is_element_present(*self.LOG_BTN)

    def is_navbar_present(self) -> bool:
        return self.is_element_present(*self.NAVBAR)
