# pages/__init__.py — makes pages a package
from .base_page     import BasePage
from .login_page    import LoginPage
from .register_page import RegisterPage
from .dashboard_page import DashboardPage
from .results_page  import ResultsPage
from .history_page  import HistoryPage
from .reports_page  import ReportsPage
from .vitals_page   import VitalsPage
from .nearby_page   import NearbyPage

__all__ = [
    "BasePage", "LoginPage", "RegisterPage", "DashboardPage",
    "ResultsPage", "HistoryPage", "ReportsPage", "VitalsPage", "NearbyPage",
]
