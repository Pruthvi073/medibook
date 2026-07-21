"""
build_report_site.py
Assembles the GitHub Pages report portal from generated test artifacts.

Structure produced (pushed to gh-pages branch):
  reports/
  ├── index.html               ← Reports listing / portal
  ├── latest/
  │   ├── execution-report.html
  │   ├── summary.md
  │   ├── screenshots/         (copied)
  │   └── logs/                (copied)
  └── history/
      └── build-<RUN_NUMBER>/  (copy of latest)

Usage:
    python tests/appium/build_report_site.py \
        --run-number  42 \
        --base-url    https://user.github.io/medibook/ \
        --report-src  tests/appium/Test\ Results \
        --out-dir     ./gh-pages-reports
"""

import argparse
import json
import os
import shutil
from datetime import datetime
from pathlib import Path


# ─────────────────────────────────────────────────────────────
# Portal index.html (lists all builds)
# ─────────────────────────────────────────────────────────────
PORTAL_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>MediBook — Test Reports Portal</title>
  <style>
    *{{box-sizing:border-box;margin:0;padding:0}}
    body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          background:#0f0f1a;color:#e2e8f0;padding:2rem}}
    h1{{font-size:2rem;background:linear-gradient(135deg,#7c3aed,#2563eb);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.5rem}}
    .subtitle{{color:#64748b;margin-bottom:2rem}}
    .card{{background:#1e1b4b;border-radius:12px;padding:1.5rem;margin-bottom:1rem;
           display:flex;align-items:center;justify-content:space-between;
           border:1px solid #312e81;transition:border-color .2s}}
    .card:hover{{border-color:#7c3aed}}
    .card-left .build{{font-weight:700;font-size:1.1rem;color:#a5b4fc}}
    .card-left .date{{font-size:.8rem;color:#64748b;margin-top:.25rem}}
    .badge{{display:inline-block;padding:.25rem .75rem;border-radius:9999px;
            font-size:.75rem;font-weight:700;margin-right:.5rem}}
    .pass{{background:#064e3b;color:#10b981}}
    .fail{{background:#450a0a;color:#ef4444}}
    .btn{{background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;
          padding:.5rem 1.25rem;border-radius:8px;text-decoration:none;
          font-size:.875rem;font-weight:600;transition:opacity .2s}}
    .btn:hover{{opacity:.85}}
    .latest-banner{{background:linear-gradient(135deg,#1e1b4b,#312e81);
                    border:1px solid #4f46e5;border-radius:12px;padding:1.5rem;
                    margin-bottom:2rem}}
    .latest-banner h2{{color:#a5b4fc;margin-bottom:.5rem}}
    .latest-banner .url{{font-family:monospace;color:#7c3aed;font-size:.9rem;
                         word-break:break-all}}
    footer{{margin-top:2rem;text-align:center;color:#64748b;font-size:.8rem}}
  </style>
</head>
<body>
  <h1>MediBook — Test Reports Portal</h1>
  <p class="subtitle">Appium Mobile E2E · GitHub Pages CI/CD</p>

  <div class="latest-banner">
    <h2>🔗 Latest Report</h2>
    <p class="url"><a href="{base_url}reports/latest/execution-report.html"
       style="color:#7c3aed">{base_url}reports/latest/execution-report.html</a></p>
    <p style="color:#64748b;font-size:.8rem;margin-top:.5rem">
      Updated: {generated_at}
    </p>
  </div>

  <h2 style="margin-bottom:1rem;color:#94a3b8;font-size:1rem;
             text-transform:uppercase;letter-spacing:.1em">Build History</h2>
  {history_html}

  <footer>MediBook Selenium + Appium E2E Suite · Phase 7 CI/CD</footer>
</body>
</html>"""

BUILD_CARD_TEMPLATE = """
  <div class="card">
    <div class="card-left">
      <div class="build">Build #{run_number}</div>
      <div class="date">{date}</div>
      <div style="margin-top:.5rem">
        <span class="badge pass">✅ {passed} passed</span>
        <span class="badge fail">❌ {failed} failed</span>
        <span style="color:#94a3b8;font-size:.8rem">{total} total · {pct}% pass rate</span>
      </div>
    </div>
    <a class="btn" href="{report_url}" target="_blank">View Report</a>
  </div>"""


def load_json_stats(json_path: str) -> dict:
    """Load pytest JSON report and return summary stats."""
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        s = data.get("summary", {})
        t  = s.get("total",   0)
        p  = s.get("passed",  0)
        fa = s.get("failed",  0)
        sk = s.get("skipped", 0)
        return {
            "total": t, "passed": p, "failed": fa, "skipped": sk,
            "pct":   round(p / t * 100, 1) if t else 0,
        }
    except Exception:
        return {"total": 0, "passed": 0, "failed": 0, "skipped": 0, "pct": 0}


def build(run_number: str, base_url: str, report_src: str, out_dir: str,
          json_report: str = "test-results.json"):
    """
    Assembles the full GitHub Pages report site into out_dir.
    """
    src      = Path(report_src)
    dest_root = Path(out_dir) / "reports"
    latest   = dest_root / "latest"
    history  = dest_root / "history" / f"build-{run_number.zfill(3)}"

    dest_root.mkdir(parents=True, exist_ok=True)
    latest.mkdir(parents=True, exist_ok=True)
    history.mkdir(parents=True, exist_ok=True)

    # ── Copy HTML report ──────────────────────────────────────
    html_src = src / "HTML" / "execution-report.html"
    if html_src.exists():
        shutil.copy2(str(html_src), str(latest / "execution-report.html"))
        shutil.copy2(str(html_src), str(history / "execution-report.html"))
        print(f"[OK] HTML report copied -> {latest}")

    # ── Copy summary.md ───────────────────────────────────────
    md_src = src / "Summary" / "summary.md"
    if md_src.exists():
        shutil.copy2(str(md_src), str(latest / "summary.md"))
        shutil.copy2(str(md_src), str(history / "summary.md"))

    # ── Copy screenshots ──────────────────────────────────────
    ss_src = src / "Screenshots"
    if ss_src.exists() and any(ss_src.iterdir()):
        shutil.copytree(str(ss_src), str(latest / "screenshots"),  dirs_exist_ok=True)
        shutil.copytree(str(ss_src), str(history / "screenshots"), dirs_exist_ok=True)
        print(f"[OK] Screenshots copied.")

    # ── Copy logs ─────────────────────────────────────────────
    logs_src = src / "Logs"
    if logs_src.exists():
        shutil.copytree(str(logs_src), str(latest / "logs"),  dirs_exist_ok=True)
        shutil.copytree(str(logs_src), str(history / "logs"), dirs_exist_ok=True)

    # ── Load stats from JSON ──────────────────────────────────
    stats = load_json_stats(json_report)
    now   = datetime.now().strftime("%Y-%m-%d %H:%M UTC")

    # ── Build history cards ───────────────────────────────────
    builds = sorted(history.parent.iterdir()) if history.parent.exists() else []
    history_html_parts = []
    for b in reversed(list(builds)):
        if not b.is_dir():
            continue
        bnum  = b.name.replace("build-", "").lstrip("0") or "0"
        burl  = f"{base_url.rstrip('/')}/reports/history/{b.name}/execution-report.html"
        # Try to read stats from that build's summary
        bs_json = b / "test-results.json"
        bs      = load_json_stats(str(bs_json)) if bs_json.exists() else stats.copy()
        history_html_parts.append(BUILD_CARD_TEMPLATE.format(
            run_number = bnum,
            date       = now if b.name == f"build-{run_number.zfill(3)}" else "previous run",
            passed     = bs["passed"],
            failed     = bs["failed"],
            total      = bs["total"],
            pct        = bs["pct"],
            report_url = burl,
        ))

    portal_html = PORTAL_TEMPLATE.format(
        base_url     = base_url.rstrip("/") + "/",
        generated_at = now,
        history_html = "\n".join(history_html_parts) or "<p style='color:#64748b'>No builds yet.</p>",
    )

    # ── Write portal index.html ───────────────────────────────
    portal_path = Path(out_dir) / "index.html"
    with open(str(portal_path), "w", encoding="utf-8") as f:
        f.write(portal_html)
    print(f"[OK] Portal index -> {portal_path}")

    # ── Copy JSON for history stats ───────────────────────────
    if os.path.exists(json_report):
        shutil.copy2(json_report, str(history / "test-results.json"))

    print(f"\n[DONE] Report site built -> {out_dir}/")
    print(f"       Latest:  {base_url.rstrip('/')}/reports/latest/execution-report.html")
    return str(out_dir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build MediBook report site for GitHub Pages.")
    parser.add_argument("--run-number",  required=True,                  help="GitHub Actions run number")
    parser.add_argument("--base-url",    required=True,                  help="GitHub Pages base URL")
    parser.add_argument("--report-src",  default="tests/appium/Test Results", help="Source test results dir")
    parser.add_argument("--out-dir",     default="./gh-pages-reports",   help="Output directory for Pages")
    parser.add_argument("--json",        default="test-results.json",    help="pytest JSON report path")
    args = parser.parse_args()

    build(
        run_number  = args.run_number,
        base_url    = args.base_url,
        report_src  = args.report_src,
        out_dir     = args.out_dir,
        json_report = args.json,
    )
