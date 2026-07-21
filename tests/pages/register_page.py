"""Register Page Object."""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class RegisterPage(BasePage):
    # Locators
    NAME_INPUT     = (By.ID,  "name")
    EMAIL_INPUT    = (By.ID,  "email")
    PASSWORD_INPUT = (By.ID,  "password")
    SUBMIT_BTN     = (By.ID,  "btn-register")
    LOGIN_LINK     = (By.CSS_SELECTOR, "a[href*='login']")
    HEADING        = (By.TAG_NAME, "h1")
    ERROR_MSG      = (By.CSS_SELECTOR, ".text-rose-400, [role='alert']")

    def open(self):
        return self.goto("/register")

    def register(self, name: str, email: str, password: str):
        self.type_into(*self.NAME_INPUT,     name)
        self.type_into(*self.EMAIL_INPUT,    email)
        self.type_into(*self.PASSWORD_INPUT, password)
        self.click(*self.SUBMIT_BTN)
        return self

    def get_heading(self) -> str:
        return self.get_text(*self.HEADING)

    def is_error_shown(self) -> bool:
        return self.is_element_present(*self.ERROR_MSG, timeout=5)

    def click_login_link(self):
        self.click(*self.LOGIN_LINK)
        return self
