"""Mobile Dashboard Page Object."""
from selenium.webdriver.common.by import By
from .base_page import MobileBasePage


class MobileDashboardPage(MobileBasePage):
    SYMPTOM_SEARCH = (By.ID,  "symptom-search")
    PREDICT_BTN    = (By.ID,  "btn-predict")
    HEADING        = (By.TAG_NAME, "h1")
    NAVBAR         = (By.TAG_NAME, "nav")
    HAMBURGER      = (By.CSS_SELECTOR, "button[aria-label*='menu'], .hamburger, #mobile-menu-btn")

    def open(self):
        return self.goto("/")

    def get_heading(self) -> str:
        return self.get_text(*self.HEADING)

    def is_search_present(self) -> bool:
        return self.is_present(*self.SYMPTOM_SEARCH)

    def is_predict_button_present(self) -> bool:
        return self.is_present(*self.PREDICT_BTN)

    def is_navbar_present(self) -> bool:
        return self.is_present(*self.NAVBAR)

    def search_symptom(self, term: str):
        self.clear_and_type(*self.SYMPTOM_SEARCH, term)
        return self
