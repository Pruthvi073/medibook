# pages/__init__.py
from .base_page      import MobileBasePage
from .login_page     import MobileLoginPage
from .register_page  import MobileRegisterPage
from .dashboard_page import MobileDashboardPage

__all__ = [
    "MobileBasePage", "MobileLoginPage",
    "MobileRegisterPage", "MobileDashboardPage",
]
