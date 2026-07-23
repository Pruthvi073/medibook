"""
generate_e2e_cases.py — Generates a Python module (cases.py) containing
the 1,800 test cases (300 per QA domain) directly as Python list of dicts.
This completely removes JSON storage.
"""
import reprlib
from pathlib import Path

# Setup directories
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DOMAINS = [
    ("Selenium",    "SELENIUM_CASES",    "TC_SEL",  "Website Tests"),
    ("Appium",      "APPIUM_CASES",      "TC_APP",  "Android Tests"),
    ("Unit",        "UNIT_CASES",        "TC_UNI",  "API Unit Tests"),
    ("Validation",  "VALIDATION_CASES",  "TC_VAL",  "Validation Tests"),
    ("Deployment",  "DEPLOYMENT_CASES",  "TC_DEP",  "Deployment Status"),
    ("Performance", "PERFORMANCE_CASES", "TC_PERF", "Load Testing")
]

def get_priority(index):
    if index <= 30:
        return "Critical"
    elif index <= 90:
        return "High"
    elif index <= 180:
        return "Medium"
    else:
        return "Low"

def main():
    py_content = [
        '"""',
        'cases.py — Auto-generated E2E test cases dataset.',
        '"""',
        ''
    ]
    
    for name, var_name, prefix, label in DOMAINS:
        cases = []
        for i in range(1, 301):
            tc_id = f"{prefix}_{i:03d}"
            priority = get_priority(i)
            preconditions = f"Service/Component for {name} is configured and deployed."
            steps = (
                f"1. Initialize runner for {name}\\n"
                f"2. Execute check #{i} for {label}\\n"
                f"3. Evaluate output assertions against specifications."
            )
            expected = f"Domain validation of {label} case #{i} matches the expected performance parameters."
            status = "passed"
            error_reason = ""
            
            cases.append({
                "id": tc_id,
                "module": label,
                "name": f"{name} verification check {i:03d}",
                "priority": priority,
                "preconditions": preconditions,
                "steps": steps,
                "expected": expected,
                "status": status,
                "error_reason": error_reason
            })
        
        # Serialize list as a Python string list assignment
        py_content.append(f"{var_name} = [")
        for c in cases:
            py_content.append(
                f"  {{"
                f'  "id": "{c["id"]}", '
                f'  "module": "{c["module"]}", '
                f'  "name": "{c["name"]}", '
                f'  "priority": "{c["priority"]}", '
                f'  "preconditions": "{c["preconditions"]}", '
                f'  "steps": "{c["steps"]}", '
                f'  "expected": "{c["expected"]}", '
                f'  "status": "{c["status"]}", '
                f'  "error_reason": "{c["error_reason"]}"'
                f"  }},"
            )
        py_content.append("]\n")
        
    out_path = DATA_DIR / "cases.py"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(py_content))
    print(f"[OK] Generated cases.py Python module: {out_path}")

if __name__ == "__main__":
    main()
