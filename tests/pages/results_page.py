"""Results Page Object."""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class ResultsPage(BasePage):
    DISEASE_NAME    = (By.CSS_SELECTOR, "h2, [data-testid='disease-name']")
    CONFIDENCE_DIAL = (By.CSS_SELECTOR, ".confidence, [data-testid='confidence']")
    PRECAUTIONS     = (By.CSS_SELECTOR, "ul li, [data-testid='precaution']")
    BACK_BTN        = (By.CSS_SELECTOR, "a[href='/'], button[aria-label*='back']")
    HEADING         = (By.TAG_NAME, "h1")

    def open(self):
        return self.goto("/results")

    def get_disease(self) -> str:
        try:
            return self.get_text(*self.DISEASE_NAME)
        except Exception:
            return ""

    def get_precautions_count(self) -> int:
        return len(self.find_all(*self.PRECAUTIONS))
