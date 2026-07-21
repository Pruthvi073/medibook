"""
login_page.py — Web Login Page Object.
"""
from selenium.webdriver.common.by import By
from .base_page import WebBasePage

class WebLoginPage(WebBasePage):
    EMAIL_INPUT    = (By.ID,  "email")
    PASSWORD_INPUT = (By.ID,  "password")
    SUBMIT_BTN     = (By.ID,  "btn-login")
    REGISTER_LINK  = (By.CSS_SELECTOR, "a[href*='register']")
    HEADING        = (By.TAG_NAME, "h1")
    ERROR_MSG      = (By.CSS_SELECTOR, ".text-rose-400, [role='alert']")

    def open(self):
        return self.goto("/login")

    def login(self, email: str, password: str):
        self.clear_and_type(*self.EMAIL_INPUT,    email)
        self.clear_and_type(*self.PASSWORD_INPUT, password)
        self.click_element(*self.SUBMIT_BTN)
        return self

    def get_heading(self) -> str:
        return self.get_text_content(*self.HEADING)

    def is_error_shown(self) -> bool:
        return self.is_present(*self.ERROR_MSG, timeout=5)

    def click_register(self):
        self.click_element(*self.REGISTER_LINK)
        return self
