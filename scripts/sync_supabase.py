#!/usr/bin/env python3
"""
Sync study progress to Supabase study_progress table.

Usage:
  python3 scripts/sync_supabase.py              # full sync (DSA + daily plans)
  python3 scripts/sync_supabase.py --status     # show current state
  python3 scripts/sync_supabase.py --dsa-only    # DSA tracker rows only
  python3 scripts/sync_supabase.py --plan DATE   # seed one daily plan
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# This repo is public. The key grants read/write access to study_progress, so it
# is supplied at runtime rather than committed.
#   export SUPABASE_URL="https://<project>.supabase.co/rest/v1"
#   export SUPABASE_KEY="sb_publishable_..."
SUPABASE_REST_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
TABLE = "study_progress"
USER = "sbaskar"


def require_credentials() -> None:
    missing = [n for n, v in (("SUPABASE_URL", SUPABASE_REST_URL),
                              ("SUPABASE_KEY", SUPABASE_KEY)) if not v]
    if missing:
        sys.exit(f"Missing environment variable(s): {', '.join(missing)}. "
                 "See scripts/README.md.")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_row(topic_id: str, doc_id: str, row_id: str, field: str, value) -> dict:
    key = f"{USER}::{topic_id}::{doc_id}::{row_id}::{field}"
    return {
        "id": key,
        "user_id": USER,
        "topic_id": topic_id,
        "doc_id": doc_id,
        "row_id": row_id,
        "field": field,
        "value": value,
        "updated_at": now_iso(),
    }


def dsa_solved(row_id: str, confidence: str = "3") -> list[dict]:
    return [
        make_row("dsa-patterns", "roadmap", row_id, "attempted", True),
        make_row("dsa-patterns", "roadmap", row_id, "solved", True),
        make_row("dsa-patterns", "roadmap", row_id, "confidence (1-5)", confidence),
    ]


def daily_task(
    plan_date: str,
    task_id: str,
    track: str,
    title: str,
    description: str,
    *,
    link: str = "",
    minutes: int = 0,
    status: str = "pending",
    priority: str = "high",
    source_date: str | None = None,
) -> dict:
    return make_row(
        "daily-plan",
        plan_date,
        task_id,
        "task",
        {
            "track": track,
            "title": title,
            "description": description,
            "resource_link": link,
            "estimated_min": minutes,
            "status": status,
            "priority": priority,
            "plan_date": plan_date,
            "source_date": source_date or plan_date,
        },
    )


def picnic_row(field: str, value) -> dict:
    return make_row("picnic-prep", "interview", "main", field, value)


def build_sync_payload() -> list[dict]:
    rows: list[dict] = []

    # Catch-up DSA rows missing from Supabase (Aug 24–25 session)
    dsa_updates = {
        "20": ("3",),   # LC #239 Sliding Window Maximum
        "21": ("3",),   # LC #33 Search in Rotated Sorted Array
        "22": ("3",),   # LC #153 Find Min in Rotated Sorted Array
        "23": ("3",),   # LC #162 Find Peak Element
        "24": ("3",),   # LC #875 Koko Eating Bananas
        "33": ("3",),   # LC #338 Counting Bits
        "34": ("3",),   # LC #371 Sum of Two Integers
        "35": ("3",),   # LC #739 Daily Temperatures
        "37": ("3",),   # LC #394 Decode String
    }
    for row_id, (confidence,) in dsa_updates.items():
        rows.extend(dsa_solved(row_id, confidence))

    # Aug 24 daily plan
    aug24 = "2026-08-24"
    rows.extend(
        [
            daily_task(
                aug24,
                "lc-239-done",
                "DSA",
                "LC #239 Sliding Window Maximum",
                "Hard. Monotonic Deque. FINISHES Sliding Window pattern.",
                link="https://leetcode.com/problems/sliding-window-maximum/",
                minutes=55,
                status="done",
            ),
            daily_task(
                aug24,
                "lc-33-search-rotated",
                "DSA",
                "LC #33 Search in Rotated Sorted Array",
                "Binary Search. One half is always sorted.",
                link="https://leetcode.com/problems/search-in-rotated-sorted-array/",
                minutes=45,
                status="done",
            ),
            daily_task(
                aug24,
                "lc-153-find-min-rotated",
                "DSA",
                "LC #153 Find Min in Rotated Sorted Array",
                "Binary Search. Compare mid with right.",
                link="https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
                minutes=35,
                status="done",
            ),
            daily_task(
                aug24,
                "lc-162-find-peak",
                "DSA",
                "LC #162 Find Peak Element",
                "Binary Search. Move toward higher neighbor.",
                link="https://leetcode.com/problems/find-peak-element/",
                minutes=30,
                status="done",
            ),
            daily_task(
                aug24,
                "algomaster-scalability",
                "System Design",
                "AlgoMaster: Scalability + Availability",
                "Read 2 core concepts (15 min each). Replace DDIA Ch1 for now.",
                link="https://algomaster.io/learn/system-design/top-30-system-design-concepts",
                minutes=30,
                status="pending",
                priority="medium",
            ),
            daily_task(
                aug24,
                "picnic-bugfix",
                "Career",
                "Picnic Prep: Hand-write 1 bug-fix exercise",
                "45 min block. No IDE autocomplete.",
                minutes=45,
                status="pending",
                priority="high",
            ),
        ]
    )

    # Aug 25 daily plan (today)
    aug25 = "2026-08-25"
    rows.extend(
        [
            daily_task(
                aug25,
                "lc-875-koko",
                "DSA",
                "LC #875 Koko Eating Bananas",
                "Binary Search on answer space. ceil(pile/speed) trick.",
                link="https://leetcode.com/problems/koko-eating-bananas/",
                minutes=40,
                status="done",
            ),
            daily_task(
                aug25,
                "lc-1011-ship",
                "DSA",
                "LC #1011 Capacity to Ship Packages Within D Days",
                "Same BS-on-answer pattern as LC #875.",
                link="https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/",
                minutes=35,
                status="pending",
            ),
            daily_task(
                aug25,
                "revision-binary-search",
                "DSA Revision",
                "Revision: LC #33, #153, #162 (15 min)",
                "Say pattern + key insight for each. No notes.",
                minutes=15,
                status="pending",
            ),
            daily_task(
                aug25,
                "algomaster-reliability",
                "System Design",
                "AlgoMaster: Reliability + SPOF + Latency vs Throughput",
                "3 concepts, ~30 min total.",
                link="https://algomaster.io/learn/system-design/top-30-system-design-concepts",
                minutes=30,
                status="pending",
                priority="medium",
            ),
            daily_task(
                aug25,
                "picnic-java-spring",
                "Career",
                "Picnic Prep: Java/Spring revision (R1 deep-dive)",
                "Harbor architecture + Vodafone stories. 30 min out loud.",
                minutes=30,
                status="pending",
                priority="high",
            ),
        ]
    )

    # Sep 3 daily plan (Wednesday — Stripe sprint Week 1, day 3)
    sep03 = "2026-09-03"
    rows.extend(
        [
            daily_task(
                sep03,
                "stripe-router-cold",
                "Stripe MC",
                "Proximity router cold rebuild — 45m timer",
                "solution/src/ only. question.md OK. NO archive peek. NO AI.",
                minutes=45,
                priority="high",
                source_date="2026-09-01",
            ),
            daily_task(
                sep03,
                "lc-338",
                "DSA",
                "LC #338 Counting Bits",
                "Bit Manip #3 — DP: ans[i] = ans[i>>1] + (i&1). Close pattern toward 4/4.",
                link="https://leetcode.com/problems/counting-bits/",
                minutes=35,
            ),
            daily_task(
                sep03,
                "lc-371",
                "DSA",
                "LC #371 Sum of Two Integers — if time",
                "Bit Manip #4 — XOR/add without +. Only after #338. No bitwise forbidden ops.",
                link="https://leetcode.com/problems/sum-of-two-integers/",
                minutes=40,
                priority="medium",
            ),
            daily_task(
                sep03,
                "revision",
                "DSA Revision",
                "Revision: #191 (Day 1), #136 (Day 2), BS #875 feasibility",
                "Out loud: Kernighan, XOR cancel, Koko feasibility check. 15 min.",
                minutes=15,
            ),
            daily_task(
                sep03,
                "stripe-sd-idempotency",
                "Stripe SD",
                "Payment API idempotency sketch (30 min)",
                "POST /v1/charges: Idempotency-Key header, 24h store, replay same response.",
                minutes=30,
            ),
            daily_task(
                sep03,
                "wallet-p1",
                "Stripe MC",
                "Payment Wallet Part 1 — CREATE / CREDIT / BALANCE",
                "002-payment-wallet. stdin ledger. Evening 60m if router done.",
                minutes=60,
                source_date="2026-09-02",
            ),
            daily_task(
                sep03,
                "spring-di",
                "Java",
                "Spring DI + bean lifecycle (CARRIED)",
                "JAVA-SPRING-REVISION.md §1–2. @Component vs @Bean, constructor injection.",
                minutes=60,
                source_date="2026-09-01",
            ),
            daily_task(
                sep03,
                "stripe-ingrid",
                "Career",
                "Email Ingrid — Sep 29 loop format (CARRIED)",
                "5 questions STRIPE-MASTER-PREP.md §9. Send before EOD.",
                minutes=15,
                source_date="2026-09-01",
            ),
            daily_task(
                sep03,
                "httpclient-drill",
                "Stripe MC",
                "HttpClient POST + Idempotency-Key from memory (CARRIED)",
                "15 min blind write. Pairs with SD idempotency.",
                minutes=15,
                source_date="2026-09-01",
            ),
            daily_task(
                sep03,
                "stripe-sd-webhooks",
                "Stripe SD",
                "Webhook delivery sketch (CARRIED)",
                "At-least-once, signing, retry backoff, dedup event_id. Only if idempotency done.",
                minutes=30,
                priority="medium",
                source_date="2026-09-02",
            ),
            daily_task(
                sep03,
                "lc-4-carry",
                "DSA",
                "LC #4 Median Two Sorted Arrays — stretch",
                "BS capstone. Only if #338+#371 done early. Hard — 50m.",
                link="https://leetcode.com/problems/median-of-two-sorted-arrays/",
                minutes=50,
                priority="medium",
                source_date="2026-09-01",
            ),
        ]
    )

    # Sep 4 daily plan (Friday — Stack study block + problem 1)
    sep04 = "2026-09-04"
    rows.extend(
        [
            daily_task(
                sep04,
                "stack-study",
                "DSA",
                "Stack study block — read before problems",
                "dsa-patterns/internals/06-stack.md — monotonic stack, ArrayDeque, templates.",
                minutes=30,
            ),
            daily_task(
                sep04,
                "lc-739",
                "DSA",
                "LC #739 Daily Temperatures",
                "Stack #1 — monotonic decreasing indices. Pattern intro problem.",
                link="https://leetcode.com/problems/daily-temperatures/",
                minutes=45,
            ),
            daily_task(
                sep04,
                "lc-503",
                "DSA",
                "LC #503 Next Greater Element II — if time",
                "Stack #2 — circular NGE. Only after #739.",
                link="https://leetcode.com/problems/next-greater-element-ii/",
                minutes=40,
                priority="medium",
            ),
            daily_task(
                sep04,
                "revision-bit-stack",
                "DSA Revision",
                "Revision: #338 dp[i>>1], #739 monotonic idea (10m)",
                "Out loud before coding.",
                minutes=10,
            ),
            daily_task(
                sep04,
                "stripe-mock-30",
                "Stripe MC",
                "30 min intro + wallet/router explain out loud",
                "Sep 29 = 30min call prep. No AI.",
                minutes=30,
            ),
            daily_task(
                sep04,
                "spring-di",
                "Java",
                "Spring DI + bean lifecycle (CARRIED)",
                "JAVA-SPRING-REVISION.md §5–6. 60m evening.",
                minutes=60,
                source_date="2026-09-01",
            ),
            daily_task(
                sep04,
                "stripe-sd-idempotency",
                "Stripe SD",
                "Payment API idempotency sketch (CARRIED)",
                "30m boxes + arrows.",
                minutes=30,
                source_date="2026-09-03",
            ),
            daily_task(
                sep04,
                "career-followup",
                "Career",
                "Career block — Ingrid email + 1 follow-up",
                "Confirm Sep 29 round type. Adyen or Mollie.",
                minutes=25,
            ),
            daily_task(
                sep04,
                "lc-4-weekend",
                "DSA",
                "LC #4 Median — weekend stretch",
                "BS capstone. Sat/Sun 50m — close Phase 1.",
                link="https://leetcode.com/problems/median-of-two-sorted-arrays/",
                minutes=50,
                priority="medium",
                source_date="2026-09-01",
            ),
        ]
    )

    # Sep 5 daily plan (Saturday — STACK focus day)
    sep05 = "2026-09-05"
    rows.extend(
        [
            daily_task(
                sep05,
                "stack-refresh",
                "DSA",
                "Stack refresh (10m) — monotonic vs parsing",
                "06-stack.md templates #1 and #3. Before coding.",
                minutes=10,
            ),
            daily_task(
                sep05,
                "lc-503",
                "DSA",
                "LC #503 Next Greater Element II",
                "Stack #2 — circular NGE. Same pattern as #739, scan 2n or i%n.",
                link="https://leetcode.com/problems/next-greater-element-ii/",
                minutes=45,
            ),
            daily_task(
                sep05,
                "lc-735",
                "DSA",
                "LC #735 Asteroid Collision",
                "Stack #3 — simulation. Pop while collision rules apply.",
                link="https://leetcode.com/problems/asteroid-collision/",
                minutes=45,
            ),
            daily_task(
                sep05,
                "lc-402",
                "DSA",
                "LC #402 Remove K Digits — if time",
                "Stack #4 — monotonic increasing. Greedy digit removal.",
                link="https://leetcode.com/problems/remove-k-digits/",
                minutes=45,
                priority="medium",
            ),
            daily_task(
                sep05,
                "lc-4-sunday",
                "DSA",
                "LC #4 Median — moved to Sunday",
                "BS capstone closes Phase 1. Not today — stack day.",
                link="https://leetcode.com/problems/median-of-two-sorted-arrays/",
                minutes=90,
                priority="medium",
                source_date="2026-09-01",
            ),
            daily_task(
                sep05,
                "revision",
                "DSA Revision",
                "Revision: #739 monotonic, #394 stack parse, #338 dp (15m)",
                "Day 1/3 for #739 and #394.",
                minutes=15,
            ),
            daily_task(
                sep05,
                "stripe-mock-45",
                "Stripe MC",
                "45 min timed mock — wallet OR router from blank",
                "NO AI. NO hints. Timer hard stop. First mock of 8.",
                minutes=45,
                priority="high",
            ),
            daily_task(
                sep05,
                "bug-squash",
                "Stripe MC",
                "Bug Squash practice (60m)",
                "OrderService or unfamiliar Java repo — fix without AI.",
                minutes=60,
                priority="medium",
            ),
            daily_task(
                sep05,
                "stripe-sd-idempotency",
                "Stripe SD",
                "Payment API idempotency — TIMED 90m whiteboard",
                "POST /v1/charges, Idempotency-Key store, replay. Carried from week.",
                minutes=90,
                priority="high",
            ),
            daily_task(
                sep05,
                "spring-di",
                "Java",
                "Spring DI + bean lifecycle (CARRIED)",
                "JAVA-SPRING-REVISION.md §5–6. Evening 60m.",
                minutes=60,
                source_date="2026-09-01",
            ),
            daily_task(
                sep05,
                "career-block",
                "Career",
                "Ingrid email + apply Mollie + 1 follow-up",
                "Confirm Sep 29 round type. career/APPLICATION-TRACKER.md.",
                minutes=45,
                priority="high",
            ),
            daily_task(
                sep05,
                "week1-review",
                "Career",
                "Week 1 scorecard + Sun plan (30m)",
                "DSA/Stripe/MC/SD/Career counts. Energy 1-5.",
                minutes=30,
                priority="medium",
            ),
        ]
    )

    # Sep 6 daily plan (Sunday — Week 1 close + revision + LC #4)
    sep06 = "2026-09-06"
    rows.extend(
        [
            daily_task(
                sep06,
                "week1-revision-quiz",
                "DSA Revision",
                "Week 1 revision quiz (45m)",
                "Bit Manip #136,#191,#338,#371 + Stack #739,#394,#503. Out loud, no IDE.",
                minutes=45,
                priority="high",
            ),
            daily_task(
                sep06,
                "lc-503-sync",
                "DSA",
                "LC #503 — confirm submitted (index vs value fix)",
                "If pass on LC, say Done to sync row 36.",
                link="https://leetcode.com/problems/next-greater-element-ii/",
                minutes=5,
            ),
            daily_task(
                sep06,
                "lc-4",
                "DSA",
                "LC #4 Median of Two Sorted Arrays",
                "BS capstone — CLOSES Phase 1. Binary search on partition.",
                link="https://leetcode.com/problems/median-of-two-sorted-arrays/",
                minutes=90,
                priority="high",
            ),
            daily_task(
                sep06,
                "lc-735",
                "DSA",
                "LC #735 Asteroid Collision — if #4 done / break",
                "Stack #3. Simulation stack.",
                link="https://leetcode.com/problems/asteroid-collision/",
                minutes=45,
                priority="medium",
            ),
            daily_task(
                sep06,
                "stripe-mock-45",
                "Stripe MC",
                "45 min timed mock (CARRIED)",
                "Wallet or router from blank. NO AI.",
                minutes=45,
                priority="high",
                source_date="2026-09-05",
            ),
            daily_task(
                sep06,
                "stripe-sd-idempotency",
                "Stripe SD",
                "Payment idempotency sketch (CARRIED)",
                "60m whiteboard — Idempotency-Key, 24h store.",
                minutes=60,
                priority="high",
                source_date="2026-09-03",
            ),
            daily_task(
                sep06,
                "spring-di",
                "Java",
                "Spring DI (CARRIED)",
                "JAVA-SPRING-REVISION.md §5–6.",
                minutes=60,
                source_date="2026-09-01",
            ),
            daily_task(
                sep06,
                "career-block",
                "Career",
                "Ingrid + Mollie + Week 1 scorecard",
                "Sep 29 = 30min call. Log APPLICATION-TRACKER.md.",
                minutes=45,
                priority="high",
            ),
            daily_task(
                sep06,
                "week2-plan",
                "Career",
                "Plan Week 2 (Sep 8–14)",
                "Stack 4 more, Spring, SD ledger, mocks.",
                minutes=30,
            ),
        ]
    )

    # Picnic interview tracker
    rows.extend(
        [
            picnic_row("screening_passed", "2026-08-24"),
            picnic_row("round_1_status", "pending"),
            picnic_row("round_2_status", "pending"),
            picnic_row("round_3_status", "pending"),
            picnic_row("round_4_status", "pending"),
            picnic_row("exercises_completed", 1),
            picnic_row("current_exercise", 2),
            picnic_row("last_practice_date", "2026-08-24"),
        ]
    )

    return rows


def upsert_rows(rows: list[dict]) -> None:
    require_credentials()
    url = f"{SUPABASE_REST_URL}/{TABLE}?on_conflict=id"
    body = json.dumps(rows).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        if resp.status not in (200, 201, 204):
            raise RuntimeError(f"Unexpected status: {resp.status}")


def fetch_status() -> None:
    require_credentials()
    url = (
        f"{SUPABASE_REST_URL}/{TABLE}?user_id=eq.{USER}"
        f"&select=topic_id,field,row_id,doc_id,updated_at"
    )
    req = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        rows = json.loads(resp.read().decode())

    solved = sorted(
        {r["row_id"] for r in rows if r["topic_id"] == "dsa-patterns" and r["field"] == "solved"},
        key=lambda x: int(x) if x.isdigit() else x,
    )
    plan_dates = sorted(
        {r["doc_id"] for r in rows if r["topic_id"] == "daily-plan" and r["field"] == "task"},
        reverse=True,
    )
    print(f"Total rows: {len(rows)}")
    print(f"DSA solved: {len(solved)} -> {solved}")
    print(f"Daily plan dates: {plan_dates[:10]}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync study progress to Supabase")
    parser.add_argument("--status", action="store_true", help="Show current Supabase state")
    parser.add_argument("--dsa-only", action="store_true", help="Sync only DSA rows")
    parser.add_argument("--plan", metavar="DATE", help="Sync only one daily plan (YYYY-MM-DD)")
    args = parser.parse_args()

    if args.status:
        fetch_status()
        return 0

    rows = build_sync_payload()
    if args.dsa_only:
        rows = [r for r in rows if r["topic_id"] == "dsa-patterns"]
    elif args.plan:
        rows = [r for r in rows if r["topic_id"] == "daily-plan" and r["doc_id"] == args.plan]

    print(f"Upserting {len(rows)} rows...")
    try:
        upsert_rows(rows)
    except urllib.error.HTTPError as exc:
        print(f"HTTP error {exc.code}: {exc.read().decode()}", file=sys.stderr)
        return 1
    except urllib.error.URLError as exc:
        print(f"Network error: {exc.reason}", file=sys.stderr)
        return 1

    print("Sync complete.")
    fetch_status()
    return 0


def refresh_session_state() -> None:
    pull_script = Path(__file__).resolve().parent / "pull_study_state.py"
    if pull_script.exists():
        import subprocess
        subprocess.run([sys.executable, str(pull_script)], check=False)


if __name__ == "__main__":
    code = main()
    if code == 0 and "--status" not in sys.argv:
        refresh_session_state()
    raise SystemExit(code)
