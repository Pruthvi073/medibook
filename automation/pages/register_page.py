"""
register_page.py — Web Register Page Object.
"""
from selenium.webdriver.common.by import By
from .base_page import WebBasePage

class WebRegisterPage(WebBasePage):
    NAME_INPUT     = (By.ID,  "name")
    EMAIL_INPUT    = (By.ID,  "email")
    PASSWORD_INPUT = (By.ID,  "password")
    SUBMIT_BTN     = (By.ID,  "btn-register")
    LOGIN_LINK     = (By.CSS_SELECTOR, "a[href*='login']")
    HEADING        = (By.TAG_NAME, "h1")

    def open(self):
        return self.goto("/register")

    def register(self, name: str, email: str, password: str):
        self.clear_and_type(*self.NAME_INPUT,     name)
        self.clear_and_type(*self.EMAIL_INPUT,    email)
        self.clear_and_type(*self.PASSWORD_INPUT, password)
        self.click_element(*self.SUBMIT_BTN)
        return self

    def get_heading(self) -> str:
        return self.get_text_content(*self.HEADING)

    def click_login(self):
        self.click_element(*self.LOGIN_LINK)
        return self
