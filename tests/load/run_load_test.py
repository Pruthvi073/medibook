"""
run_load_test.py
================
One-command runner for the MediBook baseline load test.

  1. Verifies the backend is reachable
  2. Runs Locust in headless mode (100 users, 1 minute)
  3. Generates HTML + Excel + Markdown reports
  4. Prints a formatted summary to console

Usage:
    python tests/load/run_load_test.py
    python tests/load/run_load_test.py --host http://localhost:5000
    python tests/load/run_load_test.py --host https://my-api.com --users 100 --duration 60
"""

import argparse
import subprocess
import sys
import time
import os
from pathlib import Path
from datetime import datetime

# ─────────────────────────────────────────────────────────────
# Defaults
# ─────────────────────────────────────────────────────────────
DEFAULT_HOST       = "http://localhost:5000"
DEFAULT_USERS      = 100
DEFAULT_SPAWN_RATE = 10          # users spawned per second
DEFAULT_DURATION   = 60          # seconds

RESULTS_DIR  = Path(__file__).parent / "results"
LOCUSTFILE   = Path(__file__).parent / "locustfile.py"
CSV_PREFIX   = str(RESULTS_DIR / "stats")
HTML_LOCUST  = str(RESULTS_DIR / "locust-native-report.html")

RESULTS_DIR.mkdir(parents=True, exist_ok=True)


# ─────────────────────────────────────────────────────────────
# Helper: check backend is up
# ─────────────────────────────────────────────────────────────
def wait_for_backend(host: str, retries: int = 10) -> bool:
    import urllib.request
    import urllib.error

    url = f"{host}/api/symptoms"   # fast public endpoint
    print(f"[check] Waiting for backend at {url} ...")
    for i in range(retries):
        try:
            urllib.request.urlopen(url, timeout=5)
            print(f"[check] OK - Backend is reachable.")
            return True
        except Exception as e:
            print(f"[check]   Attempt {i+1}/{retries}: {e}")
            time.sleep(3)
    return False


# ─────────────────────────────────────────────────────────────
# Helper: pre-register load test users to avoid BCrypt race conditions
# ─────────────────────────────────────────────────────────────
def pre_register_users(host: str):
    import requests
    print(f"[setup] Pre-registering load test credentials pool...")
    for i in range(1, 21):
        email = f"loadtest_user{i:03d}@example.com"
        password = "LoadTest@123"
        name = f"Load Tester {i:03d}"
        url = f"{host}/api/auth/register"
        try:
            resp = requests.post(url, json={"name": name, "email": email, "password": password}, timeout=15)
            if resp.status_code == 201:
                print(f"[setup]   Registered {email}")
            elif resp.status_code == 409:
                print(f"[setup]   {email} already exists (OK)")
            else:
                print(f"[setup]   Failed to register {email}: status {resp.status_code}")
        except Exception as e:
            print(f"[setup]   Error registering {email}: {e}")
    print("[setup] Credentials pool registration complete.\n")


# ─────────────────────────────────────────────────────────────
# Helper: pretty-print terminal summary
# ─────────────────────────────────────────────────────────────
def print_summary(csv_prefix: str, users: int, duration: int, host: str):
    import csv, os
    stats_file = f"{csv_prefix}_stats.csv"
    if not os.path.exists(stats_file):
        print("\n[warn] No CSV stats found - cannot print summary.")
        return

    with open(stats_file, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    total = next((r for r in rows if r.get("Name") in ("Aggregated", "Total")), None)
    if not total:
        return

    rps     = float(total.get("Requests/s",              0))
    avg     = float(total.get("Average Response Time",   0))
    min_rt  = float(total.get("Min Response Time",       0))
    max_rt  = float(total.get("Max Response Time",       0))
    p50     = float(total.get("50%",  0))
    p90     = float(total.get("90%",  0))
    p99     = float(total.get("99%",  0))
    reqs    = int(total.get("Request Count",  0))
    fails   = int(total.get("Failure Count",  0))
    fail_pct = round(fails / reqs * 100, 1) if reqs else 0.0

    status = "EXCELLENT" if avg < 300 and fail_pct < 1 \
        else "GOOD"      if avg < 800 and fail_pct < 5 \
        else "ACCEPTABLE" if avg < 2000 \
        else "SLOW"

    W = 58
    print("\n" + "=" * W)
    print(f"  MEDIBOOK BASELINE LOAD TEST - RESULTS")
    print("=" * W)
    print(f"  Host         : {host}")
    print(f"  Virtual Users: {users}")
    print(f"  Duration     : {duration}s")
    print(f"  Timestamp    : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * W)
    print(f"  Throughput   : {rps:.1f}  req/sec")
    print()
    print(f"  Response Time:")
    print(f"    Average    : {avg:.0f} ms")
    print(f"    Min        : {min_rt:.0f} ms")
    print(f"    Max        : {max_rt:.0f} ms")
    print(f"    P50 (med)  : {p50:.0f} ms")
    print(f"    P90        : {p90:.0f} ms")
    print(f"    P99        : {p99:.0f} ms")
    print()
    print(f"  Totals:")
    print(f"    Requests   : {reqs}")
    print(f"    Failures   : {fails}  ({fail_pct}%)")
    print()
    print(f"  Verdict      : {status}")
    print("=" * W)
    print(f"  Reports      : tests/load/results/")
    print(f"     HTML      : load-test-report.html")
    print(f"     Excel     : Load_Test_Report.xlsx")
    print(f"     Summary   : summary.md")
    print("=" * W + "\n")


# -------------------------------------------------------------
# Main
# -------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Run MediBook baseline load test.")
    parser.add_argument("--host",       default=DEFAULT_HOST,       help="Backend API base URL")
    parser.add_argument("--users",      type=int, default=DEFAULT_USERS,  help="Number of virtual users")
    parser.add_argument("--spawn-rate", type=int, default=DEFAULT_SPAWN_RATE, help="Users spawned per second")
    parser.add_argument("--duration",   type=int, default=DEFAULT_DURATION, help="Test duration in seconds")
    parser.add_argument("--skip-check", action="store_true",        help="Skip backend reachability check")
    args = parser.parse_args()

    print(f"\n" + "="*58)
    print(f"  MediBook Baseline Load Test  |  {args.users} users  |  {args.duration}s")
    print(f"="*58 + "\n")

    # -- Step 1: Check backend ---------------------------------
    if not args.skip_check:
        if not wait_for_backend(args.host):
            print("[ERROR] Backend unreachable. Start the server first:\n"
                  "        cd backend && node server.js")
            sys.exit(1)

    # -- Pre-register load test users to avoid bcrypt bottlenecks --
    pre_register_users(args.host)

    # ── Step 2: Run Locust headlessly ─────────────────────────
    locust_cmd = [
        sys.executable, "-m", "locust",
        "-f",           str(LOCUSTFILE),
        "--headless",
        "--host",       args.host,
        "--users",      str(args.users),
        "--spawn-rate", str(args.spawn_rate),
        "--run-time",   f"{args.duration}s",
        "--csv",        CSV_PREFIX,
        "--html",       HTML_LOCUST,
        "--csv-full-history",
        "--only-summary",
    ]

    print(f"[run] Starting Locust - {args.users} users, {args.duration}s ...\n")
    start_time = time.time()

    result = subprocess.run(locust_cmd, capture_output=False)
    elapsed = time.time() - start_time

    if result.returncode not in (0, 1):   # Locust exits 1 when failures exist — that's OK
        print(f"[warn] Locust exited with code {result.returncode}")

    print(f"\n[run] Completed in {elapsed:.0f}s")

    # -- Step 3: Generate custom reports -----------------------
    print("\n[report] Generating reports ...")
    report_cmd = [
        sys.executable,
        str(Path(__file__).parent / "generate_load_report.py"),
        "--csv-prefix", CSV_PREFIX,
        "--users",      str(args.users),
        "--duration",   str(args.duration),
        "--host",       args.host,
    ]
    subprocess.run(report_cmd, check=False)

    # ── Step 4: Print terminal summary ───────────────────────
    print_summary(CSV_PREFIX, args.users, args.duration, args.host)


if __name__ == "__main__":
    main()
