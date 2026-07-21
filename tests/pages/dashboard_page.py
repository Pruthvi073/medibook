"""Dashboard (Symptom Checker) Page Object."""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class DashboardPage(BasePage):
    # Locators
    SYMPTOM_SEARCH  = (By.ID,  "symptom-search")
    PREDICT_BTN     = (By.ID,  "btn-predict")
    HEADING         = (By.TAG_NAME, "h1")
    SYMPTOM_CHIPS   = (By.CSS_SELECTOR, ".symptom-chip, [data-symptom]")
    SELECTED_COUNT  = (By.CSS_SELECTOR, "[data-testid='selected-count']")
    CLEAR_BTN       = (By.CSS_SELECTOR, "button[aria-label*='clear'], #btn-clear-symptoms")
    NAVBAR          = (By.TAG_NAME, "nav")

    def open(self):
        return self.goto("/")

    def search_symptom(self, term: str):
        self.type_into(*self.SYMPTOM_SEARCH, term)
        return self

    def get_heading(self) -> str:
        return self.get_text(*self.HEADING)

    def is_predict_button_present(self) -> bool:
        return self.is_element_present(*self.PREDICT_BTN)

    def is_search_present(self) -> bool:
        return self.is_element_present(*self.SYMPTOM_SEARCH)

    def is_navbar_present(self) -> bool:
        return self.is_element_present(*self.NAVBAR)

    def click_predict(self):
        self.click(*self.PREDICT_BTN)
        return self
