# Agent Instructions — Personal Study Hub

This repo uses **shared state files** so new Cursor chats and subagents do not lose context.

## Start every session

```bash
python3 scripts/pull_study_state.py
```

Then read:

1. `study-session-state.json` — DSA progress, daily plan, next problems
2. `tracker-data.json` — interviews, machine coding, career notes (`job_search_daily` → 10 apps/day)

## Job search (dual track with Stripe prep)

- **Never pause** outbound applications during interview prep.
- **Daily:** 10 quality applies — see `career/DAILY-JOB-SEARCH.md`
- **Log:** `career/APPLICATION-TRACKER.md` after each batch
- **Referrals:** `cold-referral` skill (paste job link → JD-aligned draft) + UI `python3 career/referral_server.py` → http://127.0.0.1:8765; see `career/REFERRAL-COPILOT.md`
- **Commands:** `find jobs`, `check mail`, `job progress`, `referral`

## User commands

| Command | Agent must |
|---------|------------|
| `Today` | Read session state → generate/seed daily plan in Supabase |
| `Done` | Sync Supabase → run `pull_study_state.py` |
| `Progress` | Read session state (refresh if stale) |
| `referral` | Use `cold-referral` skill for JD-aligned drafts; track in `referral-tracker.json` / UI |

## Source of truth

- **DSA progress:** Supabase table `study_progress`
- **Career/interview:** `tracker-data.json`
- **Handoff snapshot:** `study-session-state.json` (auto-generated)

## Subagents

Task subagents do **not** see parent chat history. Parent must paste relevant context from `study-session-state.json` into the subagent prompt.
