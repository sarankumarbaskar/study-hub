# DSA Patterns Mastery Roadmap

> **Goal:** Not "I memorized 500 LeetCode solutions" — but "I see a problem and instantly know which pattern to apply and why."

**Timeline:** 12–16 weeks (realistic for a working professional doing 1.5–2 hours/day)

**Total Problems:** 193 (44 Easy, 97 Medium, 52 Hard)

**Estimated Effort:** ~130 hours of focused problem-solving + ~30 hours of pattern study & review = **~160 hours total**

**Strategy:** Master one pattern at a time. For each pattern: understand the template (Day 1), solve Easy problems to build intuition (Day 2), then Medium/Hard to develop fluency (remaining days). Move to the next pattern only when you can recognize and apply the current one without hesitation.

---

## Realistic Pacing Guide

| Difficulty | Avg Time per Problem | Notes |
|-----------|---------------------|-------|
| Easy | 15–25 min | Pattern recognition + quick implementation |
| Medium | 35–50 min | Core of interview prep; most time spent here |
| Hard | 60–90 min | Don't spend >90 min; read solution after that |
| Pattern Study | 30–45 min per pattern | Read template, understand "when to use", do dry runs |
| Review Day | 45–60 min | Re-solve 3–5 problems from previous weeks without looking |

### Weekly Schedule (for a working professional)

| Day | Focus | Time |
|-----|-------|------|
| Mon–Fri | 1–2 new problems + 1 review problem | 1.5–2 hours |
| Saturday | 2–3 new problems (deeper focus) | 2–3 hours |
| Sunday | Review week's problems + spaced repetition | 1–2 hours |

**Realistic weekly output:** 8–12 new problems + 5–7 review solves

---

## How This Guide Is Organized

Each pattern document follows a consistent structure:

1. **What Is This Pattern?** — Intuition and visual explanation
2. **When to Use / How to Identify** — Recognition signals from problem statements
3. **Core Template** — Pseudocode + Java implementation you can adapt
4. **Problems (Progressive)** — Easy → Medium → Hard with full solutions (Brute Force + Optimized)
5. **Common Mistakes & Edge Cases** — Traps specific to the pattern
6. **Pattern Variations** — Sub-patterns and related techniques

---

## Phase 1: Array & String Foundations (Weeks 1–4)

*These are the highest-frequency patterns. Get these right and you cover ~40% of interview questions.*

### Week 1–2: Two Pointers & Sliding Window (23 problems)

| # | Pattern | Problems | Est. Days | Daily Load |
|---|---------|----------|-----------|------------|
| 00 | Two Pointers | 12 | 5 days | Learn template (Day 1), 2 Easy (Day 2), 2–3 Medium/Hard per day (Days 3–5) |
| 01 | Sliding Window | 11 | 4 days | Learn template (Day 1), 2 Easy (Day 2), 3 Medium (Day 3), 3 Medium+Hard (Day 4) |
| — | **Review** | — | 1 day | Re-solve 5–6 problems from Two Pointers & Sliding Window |

### Week 3–4: Prefix Sum & Hashing (19 problems)

| # | Pattern | Problems | Est. Days | Daily Load |
|---|---------|----------|-----------|------------|
| 02 | Prefix Sum | 9 | 3 days | Template + 2 Easy (Day 1), 3 Medium (Day 2), 2 Medium + 2 Hard (Day 3) |
| 03 | Hashing | 10 | 4 days | Template + 2 Easy (Day 1), 3 Medium (Day 2–3), 2 Hard (Day 4) |
| — | **Phase 1 Review** | — | 2 days | Re-solve 8–10 hardest problems from Weeks 1–4 |

**Phase 1 checkpoint:** 42 problems done. You should be able to identify Two Pointers vs Sliding Window vs Hashing within 30 seconds of reading any array/string problem.

---

## Phase 2: Search & Sort (Weeks 5–6)

### Week 5: Binary Search (11 problems)

| # | Pattern | Problems | Est. Days | Daily Load |
|---|---------|----------|-----------|------------|
| 04 | Binary Search | 11 | 5 days | Template + classic BS (Day 1), 2 Easy (Day 2), 3 Medium (Days 3–4), 3 Hard (Day 5) |

*Binary Search on answer space is a FAANG favorite — spend extra time on Koko Eating Bananas (#875), Split Array Largest Sum (#410).*

### Week 6: Sorting + Fast/Slow Pointers (18 problems)

| # | Pattern | Problems | Est. Days | Daily Load |
|---|---------|----------|-----------|------------|
| 05 | Sorting Patterns | 10 | 4 days | Template (Day 1), 2 Easy (Day 2), 3 Medium (Day 3), 3 Hard (Day 4) |
| 06 | Fast & Slow | 8 | 2 days | Template + 2 Easy (Day 1), 4 Medium + 2 Hard (Day 2) |
| — | **Review** | — | 1 day | Re-solve 5–6 hardest from Phase 2 |

**Phase 2 checkpoint:** 71 problems done. Binary search should feel automatic for "minimize the maximum" / "find boundary" problems.

---

## Phase 3: Stacks, Trees & Graphs (Weeks 7–10)

*This is the hardest phase. Graph problems have the steepest learning curve. Give yourself time.*

### Week 7: Monotonic Stack + BFS (20 problems)

| # | Pattern | Problems | Est. Days | Daily Load |
|---|---------|----------|-----------|------------|
| 07 | Monotonic Stack | 10 | 4 days | Template (Day 1), 2 Easy (Day 2), 3 Medium (Day 3), 2 Medium + 3 Hard (Day 4) |
| 08 | BFS | 10 | 3 days | Template (Day 1), 2 Easy + 2 Medium (Day 2), 3 Medium + 3 Hard (Day 3) |

### Week 8: DFS + Backtracking (21 problems)

| # | Pattern | Problems | Est. Days | Daily Load |
|---|---------|----------|-----------|------------|
| 09 | DFS | 11 | 4 days | Template (Day 1), 3 Easy (Day 2), 3 Medium (Day 3), 2 Medium + 3 Hard (Day 4) |
| 10 | Backtracking | 10 | 3 days | Template (Day 1), 3 Easy+Med (Day 2), 4 Medium (Day 3), 3 Hard (Day 4 overlap) |

### Week 9: Trie, Union-Find, Topological Sort (24 problems)

| # | Pattern | Problems | Est. Days | Daily Load |
|---|---------|----------|-----------|------------|
| 11 | Trie | 8 | 3 days | Template + Implement Trie (Day 1), 3 Medium (Day 2), 2 Hard (Day 3) |
| 12 | Union-Find | 8 | 3 days | Template (Day 1), 2 Easy + 2 Medium (Day 2), 2 Medium + 2 Hard (Day 3) |
| 13 | Topological Sort | 8 | 2 days | Template + Course Schedule (Day 1), remaining 6 (Day 2) |

### Week 10: Phase 3 Review

| Day | Focus |
|-----|-------|
| Mon–Wed | Re-solve hardest BFS/DFS/Backtracking problems (6–8 problems) |
| Thu–Fri | Re-solve Trie + Union-Find + Topo Sort weak spots (4–6 problems) |
| Weekend | Mixed practice: randomly pick 5 problems across all graph patterns |

**Phase 3 checkpoint:** 136 problems done. You should be able to decide BFS vs DFS vs Union-Find vs Topo Sort within 1 minute.

---

## Phase 4: Dynamic Programming (Weeks 11–13)

*DP is the #1 pattern for Hard problems. This phase needs the most patience.*

### Week 11: 1D DP (11 problems)

| # | Pattern | Problems | Est. Days | Daily Load |
|---|---------|----------|-----------|------------|
| 14 | 1D DP | 11 | 5 days | Template + Climbing Stairs (Day 1), 2 Easy (Day 2), 3 Medium (Day 3), 3 Medium (Day 4), 3 Hard (Day 5) |

*Key milestone: after this week, "define state → recurrence → base case" should be muscle memory.*

### Week 12: 2D DP (10 problems)

| # | Pattern | Problems | Est. Days | Daily Load |
|---|---------|----------|-----------|------------|
| 15 | 2D DP | 10 | 5 days | Template + Unique Paths (Day 1), 2 Easy (Day 2), 3 Medium (Day 3), 2 Medium (Day 4), 3 Hard (Day 5) |

### Week 13: Interval/State Machine DP + DP Review (9 problems)

| # | Pattern | Problems | Est. Days | Daily Load |
|---|---------|----------|-----------|------------|
| 16 | Interval/State DP | 9 | 4 days | Template + Stock I (Day 1), Stock II–IV + Cooldown + Fee (Days 2–3), Burst Balloons + LPS (Day 4) |
| — | **DP Review** | — | 3 days | Re-solve 8–10 hardest DP problems across 1D/2D/Interval |

**Phase 4 checkpoint:** 166 problems done. DP should no longer feel like "magic" — you see state transitions.

---

## Phase 5: Greedy, Intervals & Bits (Weeks 14–15)

*These patterns are quicker to learn. Good for building momentum before final review.*

### Week 14: Greedy + Intervals (19 problems)

| # | Pattern | Problems | Est. Days | Daily Load |
|---|---------|----------|-----------|------------|
| 17 | Greedy | 10 | 3 days | Template + 2 Easy (Day 1), 3 Medium (Day 2), 2 Medium + 3 Hard (Day 3) |
| 18 | Intervals | 9 | 3 days | Template + Meeting Rooms (Day 1), 3 Medium (Day 2), 3 Medium + 2 Hard (Day 3) |
| — | **Review** | — | 1 day | Re-solve 4–5 from Greedy + Intervals |

### Week 15: Bit Manipulation + Final Review (8 problems)

| # | Pattern | Problems | Est. Days | Daily Load |
|---|---------|----------|-----------|------------|
| 19 | Bit Manipulation | 8 | 2 days | Template + 2 Easy (Day 1), 4 Medium + 2 Hard (Day 2) |
| — | **Full Review** | — | 5 days | See "Final Review Strategy" below |

**Phase 5 checkpoint:** All 193 problems done.

---

## Week 16: Mock Interview Week

| Day | Activity |
|-----|----------|
| Mon | Timed mock: 2 random Medium problems (45 min each) |
| Tue | Timed mock: 1 Easy + 1 Hard (20 min + 60 min) |
| Wed | Review weak patterns — re-solve 5 problems from weakest area |
| Thu | Timed mock: 2 Medium from different patterns (45 min each) |
| Fri | Company-specific practice (see focus areas below) |
| Weekend | Rest + light review of templates only |

---

## Final Review Strategy (Week 15, Days 3–7)

1. **Shuffle all 193 problems** — can you identify the pattern from just the problem title?
2. **Speed rounds:** For each pattern, re-solve the 1 easiest and 1 hardest problem (40 problems total, aim for 2–3 min per Easy, 15 min per Hard)
3. **Template recall:** Write all 20 pattern templates from memory on a whiteboard/paper
4. **Weakness audit:** Any pattern where you need >30 seconds to recall the template = revisit that pattern's document

---

## Company-Specific Focus Areas

| Company | Top Patterns | Must-Solve Problems |
|---------|-------------|---------------------|
| **Google** | Binary Search, DFS/BFS, DP (all), Backtracking | Median of Two Sorted Arrays, Word Search II, Burst Balloons, Trapping Rain Water |
| **Amazon** | BFS, Greedy, Two Pointers, Hashing, Sorting | Number of Islands, Task Scheduler, Two Sum, Meeting Rooms II, Kth Largest |
| **Meta** | Two Pointers, Sliding Window, Trees (DFS/BFS), Hashing | 3Sum, Minimum Window Substring, Binary Tree Max Path Sum, Valid Palindrome |
| **Apple** | Arrays, Trees, Sorting, Hashing | Merge Intervals, LCA, Sort Colors, Group Anagrams |
| **Microsoft** | DP, Trees, Graphs, Hashing | LIS, Coin Change, Course Schedule, Serialize/Deserialize Tree |
| **Netflix/Uber** | Graphs, DP, Intervals, Greedy | Alien Dictionary, Edit Distance, Employee Free Time, Jump Game II |

---

## How to Practice Effectively

### The 30-Minute Rule
- Read the problem. Think for **5 minutes** max without coding.
- If you have an approach, code it. If not, read the intuition hint in this guide.
- If stuck after **30 minutes total**, read the full solution. Understand it. Then close it and solve from scratch.
- **Never spend 2 hours on one problem.** That's not learning; that's suffering.

### The Pattern Recognition Loop
1. **Solve** the problem using this guide's template
2. **Tag** it mentally: "this is a sliding window because..."
3. **Revisit** after 3 days — can you still recognize and solve it?
4. **Vary** — solve a related problem from the same pattern

### Spaced Repetition Schedule
| Day | Action |
|-----|--------|
| Day 0 | Solve the problem |
| Day 1 | Review your solution (read, don't re-solve) |
| Day 3 | Re-solve from scratch |
| Day 7 | Re-solve (should be fast now) |
| Day 14 | Final check — if instant, move on |

### Time Management for Working Professionals
- **Don't sacrifice sleep.** Tired practice is wasted practice.
- **Lunch breaks:** Read one pattern template (30 min) — no coding needed.
- **Commute:** Mentally trace through a problem you solved yesterday.
- **Weekday evenings:** 1–2 focused problems (1.5 hours max).
- **Weekends:** Longer sessions (2–3 hours) for Hard problems and review.

---

## Problem Count Summary

| Pattern | Easy | Medium | Hard | Total |
|---------|------|--------|------|-------|
| Two Pointers | 3 | 6 | 3 | 12 |
| Sliding Window | 2 | 6 | 3 | 11 |
| Prefix Sum | 2 | 5 | 2 | 9 |
| Hashing | 3 | 5 | 2 | 10 |
| Binary Search | 2 | 6 | 3 | 11 |
| Sorting Patterns | 2 | 5 | 3 | 10 |
| Fast & Slow Pointers | 2 | 4 | 2 | 8 |
| Monotonic Stack | 2 | 5 | 3 | 10 |
| BFS | 2 | 5 | 3 | 10 |
| DFS | 3 | 5 | 3 | 11 |
| Backtracking | 2 | 5 | 3 | 10 |
| Trie | 2 | 4 | 2 | 8 |
| Union-Find | 2 | 4 | 2 | 8 |
| Topological Sort | 2 | 4 | 2 | 8 |
| 1D DP | 3 | 5 | 3 | 11 |
| 2D DP | 2 | 5 | 3 | 10 |
| Interval/State DP | 2 | 4 | 3 | 9 |
| Greedy | 2 | 5 | 3 | 10 |
| Intervals | 2 | 5 | 2 | 9 |
| Bit Manipulation | 2 | 4 | 2 | 8 |
| **Total** | **44** | **97** | **52** | **193** |

**Time estimate by difficulty:**
- 44 Easy × 20 min avg = **~15 hours**
- 97 Medium × 40 min avg = **~65 hours**
- 52 Hard × 70 min avg = **~60 hours**
- Pattern study (20 patterns × 40 min) = **~13 hours**
- Review & spaced repetition = **~25 hours**
- **Grand total: ~160–180 hours**

---

## Resources

| Resource | Type | Best For |
|----------|------|----------|
| **NeetCode 150** | Problem List | Curated pattern-based list, great overlap with this guide |
| **Blind 75** | Problem List | The original "minimum viable" interview prep list |
| **LeetCode Discuss** | Forum | Company-tagged problems and recent interview questions |
| **Grokking the Coding Interview** | Course | Pattern-based teaching (similar approach to this guide) |
| **Competitive Programmer's Handbook** | Book | Free PDF; excellent for advanced techniques |
| **Algorithms by Sedgewick** | Book | Deep understanding of data structures and algorithms |

---

*After completing this roadmap: you don't memorize solutions — you recognize patterns. When an interviewer gives you a new problem, you see the structure, pick the right tool, and build the solution in minutes. That's not luck. That's preparation.*
