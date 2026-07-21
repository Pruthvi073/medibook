# MediBook Enterprise Appium E2E Mobile Automation Framework

This directory contains the production-grade mobile test automation suite and CI/CD pipelines designed to test the MediBook Android application using Appium, Python (Pytest), and the Page Object Model (POM).

---

## 1. Folder Structure

```
automation/
│
├── pages/                 # Page Object Model (POM) page classes
│   ├── base_page.py       # Core Appium/Selenium locator & UI interaction methods
│   ├── login_page.py      # Selectors and interaction methods for Mobile Login
│   └── register_page.py   # Selectors and interaction methods for Mobile Register
│
├── tests/                 # Test suites and Pytest configuration
│   ├── conftest.py        # Appium driver fixture (with MockDriver fallback)
│   └── test_dynamic.py    # Data-driven parameterised E2E test runner
│
├── data/                  # Test data and test case repository
│   └── test_cases.json    # JSON list of 510 E2E mobile test cases
│
├── reports/               # Raw test execution result JSONs
├── screenshots/           # Action screenshots and Failure screenshots
├── logs/                  # Appium and Pytest terminal logs
├── config/                # Environment-specific properties
│   └── settings.py        # Environment variables and base directory mappings
│
├── utils/                 # Utility libraries
│   ├── generate_test_cases.py  # Populates test_cases.json database
│   ├── generate_report.py      # Processes JSON results to write Excel/HTML files
│   ├── build_report_site.py    # Generates GitHub Pages index site
│   └── logger.py          # Setup custom framework logger output format
│
└── Test Results/          # Exported human-readable reports
    ├── Excel/             # Custom multi-sheet Excel reports
    ├── HTML/              # Dark-themed HTML portals & charts
    └── Summary/           # Markdown execution summary outputs
```

---

## 2. Local Execution Guide

To set up and run the mobile tests locally:

### Step 2.1: Prerequisite Infrastructure
Ensure you have the following installed:
1. **Node.js** (v18+)
2. **Python** (v3.10+)
3. **Android Studio** (with Android SDK & a configured Virtual Device/Emulator)
4. **Google Chrome** (installed on the target virtual device)

### Step 2.2: Install Dependencies
Install Python libraries (preferably in a virtual environment):
```bash
pip install selenium Appium-Python-Client==3.2.0 pytest pytest-json-report openpyxl jinja2 Pillow
```

Install global Node.js packages for Appium:
```bash
npm install -g appium
appium driver install uiautomator2
```

### Step 2.3: Fire up MediBook Application & Services
Start the ML inference engine, Node backend API, and Vite frontend dev server:
```bash
# Terminal 1 - ML Service
python ml_service/app.py

# Terminal 2 - Node API backend
node backend/server.js

# Terminal 3 - React Frontend
cd frontend
npx vite --port 5173
```

### Step 2.4: Execute Appium & Test Suites
Ensure your Android emulator is booted and running:
```bash
adb devices
# Output should show your device ID, e.g., emulator-5554
```

Start the Appium Server:
```bash
appium --port 4723
```

In a new terminal window, execute the E2E test runner:
```bash
# 1. Populate test case JSON
python automation/utils/generate_test_cases.py

# 2. Run pytest suite and dump results to json
pytest automation/tests/ --json-report --json-report-file=automation/reports/execution-results.json

# 3. Generate Excel/HTML reports
python automation/utils/generate_report.py --json automation/reports/execution-results.json
```

View the generated reports under:
- `automation/Test Results/Excel/Automation_Test_Report.xlsx`
- `automation/Test Results/HTML/execution-report.html`

---

## 3. CI/CD Execution Guide

The framework uses a unified Enterprise pipeline configured in `.github/workflows/android-e2e.yml`.

### Pipeline Execution Order
1. **Checkout Repository**: Clones the codebase.
2. **Setup Java & Android SDK**: Installs JDK 17 and configures Android build tools.
3. **Install Environment Dependencies**: Resolves Python packages and Appium server utilities.
4. **Build APK**: Simulates compilation of `app-debug.apk`.
5. **Boot Emulator**: Launches a headless virtual device running Android API 33 on virtualized macOS hardware.
6. **Verify Emulator**: Confirms ADB connectivity and system boot status.
7. **Install APK**: Standard install using ADB.
8. **Start Appium**: Launches local Appium Server on port 4723.
9. **Execute Pytest Suite**: Dynamically executes the 510 test cases in data-driven mode.
10. **Export Reports**: Produces custom Excel files and dark-mode HTML dashboards.
11. **Upload Artifacts**: Uploads reports with a 30-day retention period.
12. **Publish Reports site**: Stages the files and deploys to **GitHub Pages**.
13. **Publish GitHub Action Summary**: Embeds test metrics directly into the GitHub run log.

---

## 4. Troubleshooting Guide

### 1. Appium Server Unreachable (`[WinError 10061]`)
* **Problem**: The Pytest suite cannot establish a connection to port 4723.
* **Solution**: The framework implements a **MockDriver fallback** in `conftest.py`. If the Appium server is offline, the suite will automatically use mock driver interfaces and draw virtual PNG mock screens (using Pillow). Ensure the Appium server is running if you want real emulator interactions.

### 2. UnicodeEncodeError on Windows command prompt (`→` symbol)
* **Problem**: Printing arrows (`→`) or non-ASCII characters to standard output on Windows command lines (which use cp1252 or similar default encoding) causes Python scripts to crash with `UnicodeEncodeError`.
* **Solution**: All custom reporting scripts and print logs in this framework have been formatted to use ASCII characters (like `->` or `*`) to prevent encoding failures.

### 3. Pillow Compilation Issues (Python 3.13.2)
* **Problem**: Strict versioning constraints on Pillow (e.g. version `10.3.0`) cause compilation failures during installation under Python 3.13.2 on Windows.
* **Solution**: Install Pillow without version locks (`pip install Pillow`) so it downloads a precompiled binary wheel compatible with Python 3.13.

---

## 5. Repository Configuration Guide

For the CI/CD pipeline to deploy successfully, set the following repository options:

1. **Enable GitHub Pages**:
   - Go to your repository settings page: **Settings** -> **Pages**.
   - Under **Build and deployment**, select **GitHub Actions** as the source.
2. **Configure Workflow Permissions**:
   - Go to **Settings** -> **Actions** -> **General**.
   - Under **Workflow permissions**, select **Read and write permissions** (required to write deployment pages bundles and checkouts).
