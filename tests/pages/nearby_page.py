"""Nearby Doctors Page Object."""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class NearbyPage(BasePage):
    HEADING   = (By.TAG_NAME, "h1")
    MAP       = (By.CSS_SELECTOR, ".leaflet-container, #map, [data-testid='map']")
    NAVBAR    = (By.TAG_NAME, "nav")
    DOCTOR_CARDS = (By.CSS_SELECTOR, ".doctor-card, [data-testid='doctor-card']")

    def open(self):
        return self.goto("/nearby")

    def get_heading(self) -> str:
        return self.get_text(*self.HEADING)

    def is_map_present(self) -> bool:
        return self.is_element_present(*self.MAP, timeout=10)

    def is_navbar_present(self) -> bool:
        return self.is_element_present(*self.NAVBAR)
