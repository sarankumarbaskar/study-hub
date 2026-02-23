# DSA Patterns Mastery Roadmap

> **Goal:** Not "I memorized 500 LeetCode solutions" — but "I see a problem and instantly know which pattern to apply and why."

**Timeline:** 6–8 weeks (2–3 problems/day, pattern-by-pattern)

**Strategy:** Master one pattern at a time. For each pattern: understand the template, solve Easy problems to build intuition, then Medium/Hard to develop fluency. Move to the next pattern only when you can recognize and apply the current one without hesitation.

---

## How This Guide Is Organized

Each pattern document follows a consistent structure:

1. **What Is This Pattern?** — Intuition and visual explanation
2. **When to Use / How to Identify** — Recognition signals from problem statements
3. **Core Template** — Pseudocode + Java implementation you can adapt
4. **Problems (Progressive)** — Easy → Medium → Hard with full solutions
5. **Common Mistakes & Edge Cases** — Traps specific to the pattern
6. **Pattern Variations** — Sub-patterns and related techniques

---

## Pattern Order (Recommended)

Start with array/string patterns (highest frequency, easiest to visualize), then build toward graphs and DP (hardest, most conceptual).

### Week 1–2: Arrays & Hashing Foundations

| # | Pattern | Time | Why First |
|---|---------|------|-----------|
| 00 | Two Pointers | 2 days | Foundation for many array problems; simple to visualize |
| 01 | Sliding Window | 2 days | Builds on two pointers; extremely common in interviews |
| 02 | Prefix Sum | 1 day | Quick pattern; unlocks subarray sum problems |
| 03 | Hashing | 2 days | Most versatile tool; used as a building block everywhere |

### Week 3: Sorting & Searching

| # | Pattern | Time | Why Here |
|---|---------|------|----------|
| 04 | Binary Search | 2 days | Core technique; "binary search on answer" is a FAANG favorite |
| 05 | Sorting Patterns | 2 days | Quick Select, custom comparators, merge sort applications |

### Week 3–4: Linked Lists & Stacks

| # | Pattern | Time | Why Here |
|---|---------|------|----------|
| 06 | Fast & Slow Pointers | 1 day | Cycle detection, middle finding — small but critical pattern |
| 07 | Monotonic Stack | 2 days | Unlocks "next greater element" family; histogram problems |

### Week 4–5: Trees & Graphs

| # | Pattern | Time | Why Here |
|---|---------|------|----------|
| 08 | BFS | 2 days | Shortest path, level-order — most common graph technique |
| 09 | DFS | 2 days | Tree/graph traversal, path finding, connected components |
| 10 | Backtracking | 2 days | Permutations, combinations — builds on DFS |
| 11 | Trie | 1 day | Prefix matching, autocomplete — specialized but common |
| 12 | Union-Find | 1 day | Connected components, cycle detection in undirected graphs |
| 13 | Topological Sort | 1 day | Dependency ordering — common in system design crossover |

### Week 6–7: Dynamic Programming

| # | Pattern | Time | Why Here |
|---|---------|------|----------|
| 14 | 1D DP | 3 days | Foundation: climbing stairs → house robber → LIS |
| 15 | 2D DP | 3 days | Grid paths, LCS, knapsack — builds on 1D |
| 16 | Interval/State Machine DP | 2 days | Stock problems, burst balloons — advanced DP |

### Week 7–8: Greedy, Intervals & Bit Manipulation

| # | Pattern | Time | Why Here |
|---|---------|------|----------|
| 17 | Greedy | 2 days | Activity selection, jump game — proof-based reasoning |
| 18 | Intervals | 1 day | Merge, insert, meeting rooms — very common in interviews |
| 19 | Bit Manipulation | 1 day | XOR tricks, counting bits — quick wins |

---

## Company-Specific Focus Areas

| Company | Top Patterns | Notes |
|---------|-------------|-------|
| **Google** | Binary Search, DFS/BFS, DP (all types), Backtracking | Loves "binary search on answer space" and graph problems |
| **Amazon** | BFS, Greedy, Two Pointers, Hashing, Sorting | Practical problems; often involves optimization |
| **Meta** | Two Pointers, Sliding Window, Trees (DFS/BFS), Hashing | String/array heavy; tree problems are a staple |
| **Apple** | Arrays, Trees, Sorting, Hashing | Clean code emphasis; moderate difficulty |
| **Microsoft** | DP, Trees, Graphs, Hashing | Balanced across all patterns |
| **Netflix/Uber** | System Design + DP, Graphs, Intervals | Often combines DSA with design thinking |

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
| **Total** | **44** | **97** | **52** | **~200** |

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
