"""Login Page Object."""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class LoginPage(BasePage):
    # Locators
    EMAIL_INPUT    = (By.ID,   "email")
    PASSWORD_INPUT = (By.ID,   "password")
    SUBMIT_BTN     = (By.ID,   "btn-login")
    ERROR_MSG      = (By.CSS_SELECTOR, "[role='alert'], .text-rose-400")
    REGISTER_LINK  = (By.ID, "link-to-register")
    HEADING        = (By.TAG_NAME, "h1")

    def open(self):
        return self.goto("/login")

    def login(self, email: str, password: str):
        self.type_into(*self.EMAIL_INPUT, email)
        self.type_into(*self.PASSWORD_INPUT, password)
        self.click(*self.SUBMIT_BTN)
        return self

    def get_heading(self) -> str:
        return self.get_text(*self.HEADING)

    def is_error_shown(self) -> bool:
        return self.is_element_present(*self.ERROR_MSG, timeout=5)

    def click_register_link(self):
        self.click(*self.REGISTER_LINK)
        return self
