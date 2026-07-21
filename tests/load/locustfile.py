"""
locustfile.py — MediBook Baseline / Load Test
==============================================

Configuration:
  100 virtual users, 1-minute duration.

Flow:
  Each simulated user:
    1. Registers (once) / Logs in  → gets JWT token
    2. Hits API endpoints in weighted rotation:
       - GET  /api/symptoms          (40% of requests — public, no auth)
       - POST /api/diagnose          (30% of requests — authenticated)
       - GET  /api/history           (20% of requests — authenticated)
       - GET  /api/vitals            (10% of requests — authenticated)

Usage:
  # Headless (CI/CD)
  locust -f tests/load/locustfile.py \
         --headless \
         --users 100 \
         --spawn-rate 10 \
         --run-time 1m \
         --host http://localhost:5000 \
         --csv tests/load/results/stats \
         --html tests/load/results/locust-report.html

  # With Web UI (manual)
  locust -f tests/load/locustfile.py --host http://localhost:5000
  # Then open http://localhost:8089 and set 100 users / 10 spawn rate
"""

import random
import string
import logging
import time
from locust import HttpUser, task, between, events
from locust.exception import RescheduleTask

log = logging.getLogger("medibook-load")

# ─────────────────────────────────────────────────────────────
# Symptom pool (sampled from the 126-symptom list)
# ─────────────────────────────────────────────────────────────
SYMPTOMS = [
    "high_fever", "headache", "nausea", "fatigue", "cough",
    "chest_pain", "shortness_of_breath", "dizziness", "vomiting",
    "back_pain", "joint_pain", "skin_rash", "itching", "loss_of_appetite",
    "abdominal_pain", "weight_loss", "muscle_weakness", "blurred_vision",
    "sweating", "chills",
]

# Pre-defined credential pool — avoids hammering bcrypt with 100 simultaneous
# registrations. Each virtual user picks one of these credentials.
# Accounts are created lazily on first use of each slot.
CREDENTIAL_POOL = [
    {"email": f"loadtest_user{i:03d}@example.com", "password": "LoadTest@123",
     "name":  f"Load Tester {i:03d}"}
    for i in range(1, 21)   # 20 unique accounts — shared by 100 VUs
]
_registered = set()   # track which pool slots have been registered


def _rand_email() -> str:
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"loadtest_{suffix}@example.com"


# ─────────────────────────────────────────────────────────────
# Main User class
# ─────────────────────────────────────────────────────────────
class MediBookUser(HttpUser):
    """
    Simulates a real MediBook user:
      - wait_time: think time between requests (0.5–2s realistic browser gap)
    """
    wait_time = between(0.5, 2.0)

    def on_start(self):
        """
        Pick a credential from the pool (shared across all VUs).
        Only register if this slot hasn't been registered yet.
        Stagger startup to avoid hammering bcrypt simultaneously.
        """
        self.token = None

        # Pick a random credential slot from the shared pool
        cred = random.choice(CREDENTIAL_POOL)
        self.email    = cred["email"]
        self.password = cred["password"]

        # Stagger: each VU sleeps a random 0-2s on startup
        time.sleep(random.uniform(0, 2))

        # Register only once per credential slot (idempotent)
        if self.email not in _registered:
            _registered.add(self.email)
            with self.client.post(
                "/api/auth/register",
                json={"name": cred["name"], "email": self.email, "password": self.password},
                name="/api/auth/register [setup]",
                catch_response=True,
            ) as resp:
                if resp.status_code in (201, 409):
                    resp.success()
                else:
                    resp.failure(f"Registration failed: {resp.status_code}")

        # Login (fast — bcrypt verify of existing hash)
        for attempt in range(3):
            try:
                resp = self.client.post(
                    "/api/auth/login",
                    json={"email": self.email, "password": self.password},
                    name="/api/auth/login [setup]",
                )
                if resp.status_code == 200:
                    data = resp.json()
                    self.token = data.get("token") or data.get("data", {}).get("token")
                    return
                break
            except Exception as e:
                log.warning(f"[user] Login attempt {attempt+1} failed: {e}")
                time.sleep(1)

        log.warning(f"[user] Login failed after retries — protected endpoints will skip.")

    def _auth_headers(self) -> dict:
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}

    # ── Task 1 (weight=4): GET /api/symptoms — Public ────────
    @task(4)
    def get_symptoms(self):
        """
        Fetch the full symptom list.
        Weight 4 = ~40% of all requests.
        Expected: HTTP 200, fast cached response.
        """
        with self.client.get(
            "/api/symptoms",
            name="GET /api/symptoms",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Expected 200, got {resp.status_code}")

    # ── Task 2 (weight=3): POST /api/diagnose — Authenticated ─
    @task(3)
    def post_diagnose(self):
        """
        Submit 3–6 random symptoms for disease prediction.
        Weight 3 = ~30% of all requests.
        Expected: HTTP 200 with predicted disease.
        """
        if not self.token:
            raise RescheduleTask()

        symptoms = random.sample(SYMPTOMS, k=random.randint(3, 6))
        with self.client.post(
            "/api/diagnose",
            json={"symptoms": symptoms},
            headers=self._auth_headers(),
            name="POST /api/diagnose",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 401:
                resp.failure("Unauthorized — token expired")
                self.token = None
            else:
                resp.failure(f"Diagnose failed: {resp.status_code}")

    # ── Task 3 (weight=2): GET /api/history — Authenticated ──
    @task(2)
    def get_history(self):
        """
        Fetch prediction history for the logged-in user.
        Weight 2 = ~20% of all requests.
        Expected: HTTP 200 with array of past diagnoses.
        """
        if not self.token:
            raise RescheduleTask()

        with self.client.get(
            "/api/history",
            headers=self._auth_headers(),
            name="GET /api/history",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 401:
                resp.failure("Unauthorized")
                self.token = None
            else:
                resp.failure(f"History failed: {resp.status_code}")

    # ── Task 4 (weight=1): GET /api/vitals — Authenticated ───
    @task(1)
    def get_vitals(self):
        """
        Fetch vitals readings.
        Weight 1 = ~10% of all requests.
        Expected: HTTP 200 with vitals array.
        """
        if not self.token:
            raise RescheduleTask()

        with self.client.get(
            "/api/vitals",
            headers=self._auth_headers(),
            name="GET /api/vitals",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 304):
                resp.success()
            elif resp.status_code == 401:
                resp.failure("Unauthorized")
                self.token = None
            else:
                resp.failure(f"Vitals failed: {resp.status_code}")


# ─────────────────────────────────────────────────────────────
# Event hooks — print live summary to console
# ─────────────────────────────────────────────────────────────
@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    stats = environment.stats
    total = stats.total
    print("\n" + "=" * 60)
    print("  MEDIBOOK BASELINE LOAD TEST — RESULTS SUMMARY")
    print("=" * 60)
    print(f"  Total Requests  : {total.num_requests}")
    print(f"  Failures        : {total.num_failures}")
    print(f"  RPS (avg)       : {total.current_rps:.1f} req/sec")
    print(f"  Response Time   :")
    print(f"    Average       : {total.avg_response_time:.0f} ms")
    print(f"    Min           : {total.min_response_time:.0f} ms")
    print(f"    Max           : {total.max_response_time:.0f} ms")
    print(f"    P50 (median)  : {total.get_response_time_percentile(0.50):.0f} ms")
    print(f"    P90           : {total.get_response_time_percentile(0.90):.0f} ms")
    print(f"    P99           : {total.get_response_time_percentile(0.99):.0f} ms")
    print(f"  Failure Rate    : {total.fail_ratio * 100:.1f}%")
    print("=" * 60 + "\n")
