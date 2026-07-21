"""
settings.py — Configuration settings for the MediBook Live Selenium Web Framework.
"""
import os
from pathlib import Path

# Base Paths
AUTOMATION_ROOT = Path(__file__).parent.parent.resolve()
REPORTS_DIR     = AUTOMATION_ROOT / "reports"
SCREENSHOTS_DIR = AUTOMATION_ROOT / "screenshots"
LOGS_DIR        = AUTOMATION_ROOT / "logs"

# Ensure output directories exist
for d in [REPORTS_DIR, SCREENSHOTS_DIR, LOGS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Web E2E Target settings
# Reads BASE_URL pointing to the live GitHub Pages deployment or fallback
BASE_URL = os.getenv("BASE_URL", "http://localhost:5173").rstrip("/")
