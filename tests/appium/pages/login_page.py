"""Mobile Login Page Object."""
from selenium.webdriver.common.by import By
from .base_page import MobileBasePage


class MobileLoginPage(MobileBasePage):
    EMAIL_INPUT    = (By.ID,  "email")
    PASSWORD_INPUT = (By.ID,  "password")
    SUBMIT_BTN     = (By.ID,  "btn-login")
    REGISTER_LINK  = (By.ID, "link-to-register")
    HEADING        = (By.TAG_NAME, "h1")
    ERROR_MSG      = (By.CSS_SELECTOR, ".text-rose-400, [role='alert']")

    def open(self):
        return self.goto("/login")

    def login(self, email: str, password: str):
        self.clear_and_type(*self.EMAIL_INPUT,    email)
        self.clear_and_type(*self.PASSWORD_INPUT, password)
        self.tap(*self.SUBMIT_BTN)
        return self

    def get_heading(self) -> str:
        return self.get_text(*self.HEADING)

    def is_error_shown(self) -> bool:
        return self.is_present(*self.ERROR_MSG, timeout=5)

    def click_register(self):
        self.tap(*self.REGISTER_LINK)
        return self
