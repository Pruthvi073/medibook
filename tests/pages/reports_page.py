"""Reports Upload Page Object."""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class ReportsPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    UPLOAD_ZONE   = (By.CSS_SELECTOR, "[ondrop], .upload-zone, input[type='file']")
    ANALYSE_BTN   = (By.ID,  "btn-analyse-report")
    FILE_INPUT    = (By.ID,  "report-file-input")
    NAVBAR        = (By.TAG_NAME, "nav")
    TABS          = (By.CSS_SELECTOR, "[role='tab'], button.tab-btn, .tab-button")
    RESULT_AREA   = (By.CSS_SELECTOR, ".result-card, [data-testid='report-result']")

    def open(self):
        return self.goto("/reports")

    def get_heading(self) -> str:
        return self.get_text(*self.HEADING)

    def is_upload_area_present(self) -> bool:
        return self.is_element_present(*self.UPLOAD_ZONE)

    def is_analyse_button_present(self) -> bool:
        return self.is_element_present(*self.ANALYSE_BTN)

    def is_navbar_present(self) -> bool:
        return self.is_element_present(*self.NAVBAR)
