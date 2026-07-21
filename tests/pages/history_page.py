"""History Page Object."""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class HistoryPage(BasePage):
    HEADING        = (By.TAG_NAME, "h1")
    HISTORY_ITEMS  = (By.CSS_SELECTOR, ".history-item, [data-testid='history-item']")
    EMPTY_STATE    = (By.CSS_SELECTOR, ".empty-state, [data-testid='empty-history']")
    NAVBAR         = (By.TAG_NAME, "nav")

    def open(self):
        return self.goto("/history")

    def get_heading(self) -> str:
        return self.get_text(*self.HEADING)

    def get_history_count(self) -> int:
        return len(self.find_all(*self.HISTORY_ITEMS))

    def is_navbar_present(self) -> bool:
        return self.is_element_present(*self.NAVBAR)
