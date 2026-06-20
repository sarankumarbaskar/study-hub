# DSA Master Tracker & Study Guide

> **Profile:** 5 YoE Java Backend Engineer | Target: SDE-2 / Senior SWE
> **Target Companies:** Amazon, Microsoft, Google, Uber, Airbnb, Atlassian, Stripe, Databricks, Rubrik, Confluent
> **Language:** Java | **LeetCode Solved:** ~160 | **Strategy:** Master patterns, not problem count

---

## Table of Contents

- [Section 1: Overview](#section-1-overview)
- [Section 2: Pattern Guide](#section-2-pattern-guide)
- [Section 3: Problem Tracker](#section-3-problem-tracker)
- [Section 4: Revision Tracker](#section-4-revision-tracker)
- [Section 5: Interview Readiness Tracker](#section-5-interview-readiness-tracker)
- [Section 6: Mock Interview Tracker](#section-6-mock-interview-tracker)
- [Section 7: Weakness Analysis](#section-7-weakness-analysis)

---

## Section 1: Overview

### Total Problem Count: 142

| Difficulty | Count | Percentage |
|-----------|-------|------------|
| Easy | 11 | 7.7% |
| Medium | 98 | 69.0% |
| Hard | 33 | 23.2% |

### Pattern Distribution

| Pattern | Count | Phase |
|---------|-------|-------|
| Arrays & Hashing | 7 | Phase 1: Foundations |
| Two Pointers | 5 | Phase 1: Foundations |
| Sliding Window | 11 | Phase 1: Foundations |
| Binary Search | 10 | Phase 1: Foundations |
| Bit Manipulation | 4 | Phase 1: Foundations |
| Stack | 8 | Phase 2: Data Structures |
| Heap | 7 | Phase 2: Data Structures |
| Linked List | 7 | Phase 2: Data Structures |
| Intervals | 4 | Phase 2: Data Structures |
| Trees | 15 | Phase 3: Trees & Graphs |
| Graphs | 20 | Phase 3: Trees & Graphs |
| Dynamic Programming | 22 | Phase 4: DP + Greedy + Backtracking |
| Greedy | 5 | Phase 4: DP + Greedy + Backtracking |
| Backtracking | 6 | Phase 4: DP + Greedy + Backtracking |
| Design | 11 | Phase 5: Design |
| **Total** | **142** | |

### Estimated Timeline: 10–14 Weeks

| Phase | Weeks | Problems | Focus |
|-------|-------|----------|-------|
| Phase 1: Foundations | Weeks 1–3 | 37 | Arrays, Two Pointers, Sliding Window, Binary Search, Bits |
| Phase 2: Data Structures | Weeks 4–6 | 26 | Stack, Heap, Linked List, Intervals |
| Phase 3: Trees & Graphs | Weeks 7–9 | 35 | Trees, Graphs (BFS/DFS/Union-Find/Dijkstra) |
| Phase 4: DP + Greedy + Backtracking | Weeks 10–12 | 33 | 1D/2D DP, Greedy, Backtracking |
| Phase 5: Design | Week 13 | 11 | LRU/LFU Cache, Trie, HashMap Design |
| Review & Mock Interviews | Week 14 | — | Revision, timed mocks, weakness drilling |

### Recommended Study Order

```
Phase 1 ─── Arrays & Hashing → Two Pointers → Sliding Window → Binary Search → Bit Manipulation
                │
Phase 2 ─── Stack → Heap → Linked List → Intervals
                │
Phase 3 ─── Trees → Graphs
                │
Phase 4 ─── Dynamic Programming → Greedy → Backtracking
                │
Phase 5 ─── Design
                │
Final ──── Review + Mock Interviews
```

### Revision Strategy

| Timing | Action | Duration |
|--------|--------|----------|
| Day 0 | Solve the problem | Full session |
| Day 1 | Review solution mentally (read, don't re-solve) | 5–10 min |
| Day 3 | Re-solve from scratch | 15–25 min |
| Day 7 | Re-solve (should be fast) | 10–15 min |
| Day 14 | Quick check — if instant recall, mark confident | 5 min |
| Day 30 | Final validation — can you explain approach to someone? | 5 min |

### Weekly Schedule (Working Professional)

| Day | Focus | Time |
|-----|-------|------|
| Mon–Fri | 1–2 new problems + 1 review problem | 1.5–2 hours |
| Saturday | 2–3 new problems (deeper focus on Hard) | 2–3 hours |
| Sunday | Review week's problems + spaced repetition | 1–2 hours |

**Realistic weekly output:** 8–12 new problems + 5–7 review solves

### Time Estimates by Difficulty

| Difficulty | Avg Time | Total Hours |
|-----------|----------|-------------|
| 11 Easy × 20 min | 20 min | ~4 hours |
| 98 Medium × 40 min | 40 min | ~65 hours |
| 33 Hard × 70 min | 70 min | ~39 hours |
| Pattern study (15 × 40 min) | 40 min | ~10 hours |
| Review & spaced repetition | — | ~25 hours |
| **Grand Total** | | **~143 hours** |

---

## Section 2: Pattern Guide

Each pattern has a dedicated deep-dive document in `internals/`.

| # | Pattern | Guide | Problems |
|---|---------|-------|----------|
| 01 | Arrays & Hashing | [internals/01-arrays-and-hashing.md](internals/01-arrays-and-hashing.md) | 7 |
| 02 | Two Pointers | [internals/02-two-pointers.md](internals/02-two-pointers.md) | 5 |
| 03 | Sliding Window | [internals/03-sliding-window.md](internals/03-sliding-window.md) | 11 |
| 04 | Binary Search | [internals/04-binary-search.md](internals/04-binary-search.md) | 10 |
| 05 | Bit Manipulation | [internals/05-bit-manipulation.md](internals/05-bit-manipulation.md) | 4 |
| 06 | Stack | [internals/06-stack.md](internals/06-stack.md) | 8 |
| 07 | Heap | [internals/07-heap.md](internals/07-heap.md) | 7 |
| 08 | Linked List | [internals/08-linked-list.md](internals/08-linked-list.md) | 7 |
| 09 | Intervals | [internals/09-intervals.md](internals/09-intervals.md) | 4 |
| 10 | Trees | [internals/10-trees.md](internals/10-trees.md) | 15 |
| 11 | Graphs | [internals/11-graphs.md](internals/11-graphs.md) | 20 |
| 12 | Dynamic Programming | [internals/12-dynamic-programming.md](internals/12-dynamic-programming.md) | 22 |
| 13 | Greedy | [internals/13-greedy.md](internals/13-greedy.md) | 5 |
| 14 | Backtracking | [internals/14-backtracking.md](internals/14-backtracking.md) | 6 |
| 15 | Design | [internals/15-design.md](internals/15-design.md) | 11 |

---

## Section 3: Problem Tracker

### Phase 1: Foundations

#### Arrays & Hashing

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 1 | [Two Sum](https://leetcode.com/problems/two-sum/) | 1 | Easy | Arrays & Hashing | Very High | | | | | | | |
| 2 | [Group Anagrams](https://leetcode.com/problems/group-anagrams/) | 49 | Medium | Arrays & Hashing | Very High | | | | | | | |
| 3 | [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) | 238 | Medium | Arrays & Hashing | Very High | | | | | | | |
| 4 | [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/) | 128 | Medium | Arrays & Hashing | High | | | | | | | |
| 5 | [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) | 347 | Medium | Arrays & Hashing | Very High | | | | | | | |
| 135 | [Rotate Image](https://leetcode.com/problems/rotate-image/) | 48 | Medium | Arrays & Hashing | Very High | | | | | | | |
| 136 | [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/) | 54 | Medium | Arrays & Hashing | Very High | | | | | | | |

#### Two Pointers

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 6 | [Container With Most Water](https://leetcode.com/problems/container-with-most-water/) | 11 | Medium | Two Pointers | Very High | | | | | | | |
| 7 | [3Sum](https://leetcode.com/problems/3sum/) | 15 | Medium | Two Pointers | Very High | | | | | | | |
| 8 | [Sort Colors](https://leetcode.com/problems/sort-colors/) | 75 | Medium | Two Pointers | High | | | | | | | |
| 9 | [Find the Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/) | 287 | Medium | Two Pointers | High | | | | | | | |
| 10 | [Longest Palindromic Substring](https://leetcode.com/problems/longest-palindromic-substring/) | 5 | Medium | Two Pointers | Very High | | | | | | | |

#### Sliding Window

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 11 | [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | 3 | Medium | Sliding Window | Very High | | | | | | | |
| 12 | [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/) | 424 | Medium | Sliding Window | High | | | | | | | |
| 13 | [Permutation in String](https://leetcode.com/problems/permutation-in-string/) | 567 | Medium | Sliding Window | High | | | | | | | |
| 14 | [Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string/) | 438 | Medium | Sliding Window | High | | | | | | | |
| 15 | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | 76 | Hard | Sliding Window | Very High | | | | | | | |
| 16 | [Fruit Into Baskets](https://leetcode.com/problems/fruit-into-baskets/) | 904 | Medium | Sliding Window | Medium | | | | | | | |
| 17 | [Max Consecutive Ones III](https://leetcode.com/problems/max-consecutive-ones-iii/) | 1004 | Medium | Sliding Window | Medium | | | | | | | |
| 18 | [Subarray Product Less Than K](https://leetcode.com/problems/subarray-product-less-than-k/) | 713 | Medium | Sliding Window | Medium | | | | | | | |
| 19 | [Frequency of the Most Frequent Element](https://leetcode.com/problems/frequency-of-the-most-frequent-element/) | 1838 | Medium | Sliding Window | Medium | | | | | | | |
| 20 | [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) | 239 | Hard | Sliding Window | Very High | | | | | | | |
| 137 | [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) | 121 | Easy | Sliding Window | Very High | | | | | | | |

#### Binary Search

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 21 | [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/) | 33 | Medium | Binary Search | Very High | | | | | | | |
| 22 | [Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/) | 153 | Medium | Binary Search | High | | | | | | | |
| 23 | [Find Peak Element](https://leetcode.com/problems/find-peak-element/) | 162 | Medium | Binary Search | High | | | | | | | |
| 24 | [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/) | 875 | Medium | Binary Search | Very High | | | | | | | |
| 25 | [Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/) | 1011 | Medium | Binary Search | High | | | | | | | |
| 26 | [Minimum Number of Days to Make m Bouquets](https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/) | 1482 | Medium | Binary Search | Medium | | | | | | | |
| 27 | [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/) | 410 | Hard | Binary Search | High | | | | | | | |
| 28 | [Find First and Last Position of Element in Sorted Array](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/) | 34 | Medium | Binary Search | Very High | | | | | | | |
| 29 | [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/) | 4 | Hard | Binary Search | Very High | | | | | | | |
| 30 | [Kth Smallest Element in a Sorted Matrix](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/) | 378 | Medium | Binary Search | High | | | | | | | |

#### Bit Manipulation

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 31 | [Single Number](https://leetcode.com/problems/single-number/) | 136 | Easy | Bit Manipulation | Very High | | | | | | | |
| 32 | [Number of 1 Bits](https://leetcode.com/problems/number-of-1-bits/) | 191 | Easy | Bit Manipulation | High | | | | | | | |
| 33 | [Counting Bits](https://leetcode.com/problems/counting-bits/) | 338 | Easy | Bit Manipulation | Medium | | | | | | | |
| 34 | [Sum of Two Integers](https://leetcode.com/problems/sum-of-two-integers/) | 371 | Medium | Bit Manipulation | Medium | | | | | | | |

### Phase 2: Data Structures

#### Stack

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 35 | [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) | 739 | Medium | Stack | Very High | | | | | | | |
| 36 | [Next Greater Element II](https://leetcode.com/problems/next-greater-element-ii/) | 503 | Medium | Stack | Medium | | | | | | | |
| 37 | [Decode String](https://leetcode.com/problems/decode-string/) | 394 | Medium | Stack | High | | | | | | | |
| 38 | [Asteroid Collision](https://leetcode.com/problems/asteroid-collision/) | 735 | Medium | Stack | High | | | | | | | |
| 39 | [Remove K Digits](https://leetcode.com/problems/remove-k-digits/) | 402 | Medium | Stack | High | | | | | | | |
| 40 | [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) | 84 | Hard | Stack | Very High | | | | | | | |
| 41 | [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/) | 42 | Hard | Stack | Very High | | | | | | | |
| 42 | [Sum of Subarray Minimums](https://leetcode.com/problems/sum-of-subarray-minimums/) | 907 | Medium | Stack | Medium | | | | | | | |

#### Heap

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 43 | [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/) | 215 | Medium | Heap | Very High | | | | | | | |
| 44 | [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) | 347 | Medium | Heap | Very High | | | | | | | |
| 45 | [K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/) | 973 | Medium | Heap | High | | | | | | | |
| 46 | [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/) | 295 | Hard | Heap | Very High | | | | | | | |
| 47 | [Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/) | 253 | Medium | Heap | Very High | | | | | | | |
| 48 | [Merge K Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/) | 23 | Hard | Heap | Very High | | | | | | | |
| 49 | [Smallest Range Covering Elements from K Lists](https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/) | 632 | Hard | Heap | Medium | | | | | | | |

#### Linked List

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 50 | [Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/) | 206 | Easy | Linked List | Very High | | | | | | | |
| 51 | [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/) | 141 | Easy | Linked List | Very High | | | | | | | |
| 52 | [Reorder List](https://leetcode.com/problems/reorder-list/) | 143 | Medium | Linked List | High | | | | | | | |
| 53 | [Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) | 19 | Medium | Linked List | Very High | | | | | | | |
| 54 | [Copy List with Random Pointer](https://leetcode.com/problems/copy-list-with-random-pointer/) | 138 | Medium | Linked List | High | | | | | | | |
| 55 | [Add Two Numbers](https://leetcode.com/problems/add-two-numbers/) | 2 | Medium | Linked List | Very High | | | | | | | |
| 56 | [Reverse Nodes in k-Group](https://leetcode.com/problems/reverse-nodes-in-k-group/) | 25 | Hard | Linked List | High | | | | | | | |

#### Intervals

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 57 | [Merge Intervals](https://leetcode.com/problems/merge-intervals/) | 56 | Medium | Intervals | Very High | | | | | | | |
| 58 | [Insert Interval](https://leetcode.com/problems/insert-interval/) | 57 | Medium | Intervals | High | | | | | | | |
| 59 | [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/) | 435 | Medium | Intervals | High | | | | | | | |
| 60 | [Meeting Rooms](https://leetcode.com/problems/meeting-rooms/) | 252 | Easy | Intervals | High | | | | | | | |

### Phase 3: Trees & Graphs

#### Trees

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 61 | [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) | 102 | Medium | Trees | Very High | | | | | | | |
| 62 | [Binary Tree Right Side View](https://leetcode.com/problems/binary-tree-right-side-view/) | 199 | Medium | Trees | Very High | | | | | | | |
| 63 | [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/) | 98 | Medium | Trees | Very High | | | | | | | |
| 64 | [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/) | 230 | Medium | Trees | High | | | | | | | |
| 65 | [Construct Binary Tree from Preorder and Inorder Traversal](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) | 105 | Medium | Trees | High | | | | | | | |
| 66 | [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/) | 543 | Easy | Trees | Very High | | | | | | | |
| 67 | [Balanced Binary Tree](https://leetcode.com/problems/balanced-binary-tree/) | 110 | Easy | Trees | High | | | | | | | |
| 68 | [Lowest Common Ancestor of a BST](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/) | 235 | Medium | Trees | Very High | | | | | | | |
| 69 | [Lowest Common Ancestor of a Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) | 236 | Medium | Trees | Very High | | | | | | | |
| 70 | [House Robber III](https://leetcode.com/problems/house-robber-iii/) | 337 | Medium | Trees | Medium | | | | | | | |
| 71 | [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/) | 124 | Hard | Trees | Very High | | | | | | | |
| 72 | [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) | 297 | Hard | Trees | Very High | | | | | | | |
| 73 | [All Nodes Distance K in Binary Tree](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/) | 863 | Medium | Trees | High | | | | | | | |
| 74 | [Find Duplicate Subtrees](https://leetcode.com/problems/find-duplicate-subtrees/) | 652 | Medium | Trees | Medium | | | | | | | |
| 75 | [Flatten Binary Tree to Linked List](https://leetcode.com/problems/flatten-binary-tree-to-linked-list/) | 114 | Medium | Trees | High | | | | | | | |

#### Graphs

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 76 | [Number of Islands](https://leetcode.com/problems/number-of-islands/) | 200 | Medium | Graphs | Very High | | | | | | | |
| 77 | [Max Area of Island](https://leetcode.com/problems/max-area-of-island/) | 695 | Medium | Graphs | High | | | | | | | |
| 78 | [Rotting Oranges](https://leetcode.com/problems/rotting-oranges/) | 994 | Medium | Graphs | Very High | | | | | | | |
| 79 | [Pacific Atlantic Water Flow](https://leetcode.com/problems/pacific-atlantic-water-flow/) | 417 | Medium | Graphs | High | | | | | | | |
| 80 | [Course Schedule](https://leetcode.com/problems/course-schedule/) | 207 | Medium | Graphs | Very High | | | | | | | |
| 81 | [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/) | 210 | Medium | Graphs | Very High | | | | | | | |
| 82 | [Clone Graph](https://leetcode.com/problems/clone-graph/) | 133 | Medium | Graphs | High | | | | | | | |
| 83 | [Number of Provinces](https://leetcode.com/problems/number-of-provinces/) | 547 | Medium | Graphs | High | | | | | | | |
| 84 | [Redundant Connection](https://leetcode.com/problems/redundant-connection/) | 684 | Medium | Graphs | Medium | | | | | | | |
| 85 | [Accounts Merge](https://leetcode.com/problems/accounts-merge/) | 721 | Medium | Graphs | High | | | | | | | |
| 86 | [Network Delay Time](https://leetcode.com/problems/network-delay-time/) | 743 | Medium | Graphs | High | | | | | | | |
| 87 | [Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/) | 787 | Medium | Graphs | High | | | | | | | |
| 88 | [Path With Minimum Effort](https://leetcode.com/problems/path-with-minimum-effort/) | 1631 | Medium | Graphs | Medium | | | | | | | |
| 89 | [Word Ladder](https://leetcode.com/problems/word-ladder/) | 127 | Hard | Graphs | Very High | | | | | | | |
| 90 | [Graph Valid Tree](https://leetcode.com/problems/graph-valid-tree/) | 261 | Medium | Graphs | High | | | | | | | |
| 91 | [Critical Connections in a Network](https://leetcode.com/problems/critical-connections-in-a-network/) | 1192 | Hard | Graphs | Medium | | | | | | | |
| 92 | [Min Cost to Connect All Points](https://leetcode.com/problems/min-cost-to-connect-all-points/) | 1584 | Medium | Graphs | Medium | | | | | | | |
| 93 | [Number of Connected Components in an Undirected Graph](https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/) | 323 | Medium | Graphs | High | | | | | | | |
| 94 | [Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/) | 802 | Medium | Graphs | Medium | | | | | | | |
| 95 | [Alien Dictionary](https://leetcode.com/problems/alien-dictionary/) | 269 | Hard | Graphs | Very High | | | | | | | |

### Phase 4: DP + Greedy + Backtracking

#### Dynamic Programming

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 96 | [House Robber](https://leetcode.com/problems/house-robber/) | 198 | Medium | DP | Very High | | | | | | | |
| 97 | [House Robber II](https://leetcode.com/problems/house-robber-ii/) | 213 | Medium | DP | High | | | | | | | |
| 98 | [Decode Ways](https://leetcode.com/problems/decode-ways/) | 91 | Medium | DP | Very High | | | | | | | |
| 99 | [Coin Change](https://leetcode.com/problems/coin-change/) | 322 | Medium | DP | Very High | | | | | | | |
| 100 | [Coin Change II](https://leetcode.com/problems/coin-change-ii/) | 518 | Medium | DP | High | | | | | | | |
| 101 | [Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/) | 416 | Medium | DP | High | | | | | | | |
| 102 | [Target Sum](https://leetcode.com/problems/target-sum/) | 494 | Medium | DP | High | | | | | | | |
| 103 | [Word Break](https://leetcode.com/problems/word-break/) | 139 | Medium | DP | Very High | | | | | | | |
| 104 | [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/) | 1143 | Medium | DP | Very High | | | | | | | |
| 105 | [Edit Distance](https://leetcode.com/problems/edit-distance/) | 72 | Medium | DP | Very High | | | | | | | |
| 106 | [Longest Palindromic Subsequence](https://leetcode.com/problems/longest-palindromic-subsequence/) | 516 | Medium | DP | Medium | | | | | | | |
| 107 | [Unique Paths](https://leetcode.com/problems/unique-paths/) | 62 | Medium | DP | Very High | | | | | | | |
| 108 | [Minimum Path Sum](https://leetcode.com/problems/minimum-path-sum/) | 64 | Medium | DP | High | | | | | | | |
| 109 | [Maximal Square](https://leetcode.com/problems/maximal-square/) | 221 | Medium | DP | High | | | | | | | |
| 110 | [Longest Increasing Subsequence](https://leetcode.com/problems/longest-increasing-subsequence/) | 300 | Medium | DP | Very High | | | | | | | |
| 111 | [Russian Doll Envelopes](https://leetcode.com/problems/russian-doll-envelopes/) | 354 | Hard | DP | Medium | | | | | | | |
| 112 | [Best Time to Buy and Sell Stock III](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/) | 123 | Hard | DP | High | | | | | | | |
| 113 | [Best Time to Buy and Sell Stock with Cooldown](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/) | 309 | Medium | DP | High | | | | | | | |
| 114 | [Burst Balloons](https://leetcode.com/problems/burst-balloons/) | 312 | Hard | DP | High | | | | | | | |
| 115 | [Different Ways to Add Parentheses](https://leetcode.com/problems/different-ways-to-add-parentheses/) | 241 | Medium | DP | Medium | | | | | | | |
| 138 | [Maximum Product Subarray](https://leetcode.com/problems/maximum-product-subarray/) | 152 | Medium | DP | Very High | | | | | | | |
| 139 | [Longest Increasing Path in a Matrix](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/) | 329 | Hard | DP | Very High | | | | | | | |

#### Greedy

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 116 | [Jump Game](https://leetcode.com/problems/jump-game/) | 55 | Medium | Greedy | Very High | | | | | | | |
| 117 | [Jump Game II](https://leetcode.com/problems/jump-game-ii/) | 45 | Medium | Greedy | Very High | | | | | | | |
| 118 | [Gas Station](https://leetcode.com/problems/gas-station/) | 134 | Medium | Greedy | High | | | | | | | |
| 119 | [Task Scheduler](https://leetcode.com/problems/task-scheduler/) | 621 | Medium | Greedy | Very High | | | | | | | |
| 140 | [Maximum Subarray](https://leetcode.com/problems/maximum-subarray/) | 53 | Medium | Greedy | Very High | | | | | | | |

#### Backtracking

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 120 | [Combination Sum](https://leetcode.com/problems/combination-sum/) | 39 | Medium | Backtracking | Very High | | | | | | | |
| 121 | [Permutations](https://leetcode.com/problems/permutations/) | 46 | Medium | Backtracking | Very High | | | | | | | |
| 122 | [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/) | 22 | Medium | Backtracking | Very High | | | | | | | |
| 123 | [Word Search](https://leetcode.com/problems/word-search/) | 79 | Medium | Backtracking | Very High | | | | | | | |
| 124 | [N-Queens](https://leetcode.com/problems/n-queens/) | 51 | Hard | Backtracking | High | | | | | | | |
| 141 | [Subsets](https://leetcode.com/problems/subsets/) | 78 | Medium | Backtracking | Very High | | | | | | | |

### Phase 5: Design

| # | Problem | LC# | Difficulty | Pattern | Frequency | Attempted | Solved | Rev 1 | Rev 2 | Rev 3 | Confidence (1-5) | Notes |
|---|---------|-----|-----------|---------|-----------|-----------|--------|-------|-------|-------|-------------------|-------|
| 125 | [LRU Cache](https://leetcode.com/problems/lru-cache/) | 146 | Medium | Design | Very High | | | | | | | |
| 126 | [LFU Cache](https://leetcode.com/problems/lfu-cache/) | 460 | Hard | Design | High | | | | | | | |
| 127 | [Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/) | 208 | Medium | Design | Very High | | | | | | | |
| 128 | [Design Add and Search Words Data Structure](https://leetcode.com/problems/design-add-and-search-words-data-structure/) | 211 | Medium | Design | High | | | | | | | |
| 129 | [Time Based Key-Value Store](https://leetcode.com/problems/time-based-key-value-store/) | 981 | Medium | Design | High | | | | | | | |
| 130 | [Design HashMap](https://leetcode.com/problems/design-hashmap/) | 706 | Easy | Design | High | | | | | | | |
| 131 | [Insert Delete GetRandom O(1)](https://leetcode.com/problems/insert-delete-getrandom-o1/) | 380 | Medium | Design | Very High | | | | | | | |
| 132 | [Snapshot Array](https://leetcode.com/problems/snapshot-array/) | 1146 | Medium | Design | Medium | | | | | | | |
| 133 | [Stock Price Fluctuation](https://leetcode.com/problems/stock-price-fluctuation/) | 2034 | Medium | Design | Medium | | | | | | | |
| 134 | [Design Search Autocomplete System](https://leetcode.com/problems/design-search-autocomplete-system/) | 642 | Hard | Design | High | | | | | | | |
| 142 | [Word Search II](https://leetcode.com/problems/word-search-ii/) | 212 | Hard | Design | Very High | | | | | | | |

---

## Section 4: Revision Tracker (Spaced Repetition)

### How to Use

1. After solving a problem, record the **Date Solved** below
2. Calculate your revision dates using the schedule: **Day 1 → Day 3 → Day 7 → Day 14 → Day 30**
3. On each revision day, re-solve from scratch without looking at your previous solution
4. Mark each revision with a checkmark (✅) or cross (❌)
5. If you fail a revision (❌), reset the spaced repetition cycle from Day 1

### Phase 1: Foundations

| # | Problem | Date Solved | Day 1 | Day 3 | Day 7 | Day 14 | Day 30 | Status |
|---|---------|-------------|-------|-------|-------|--------|--------|--------|
| 1 | Two Sum | | | | | | | |
| 2 | Group Anagrams | | | | | | | |
| 3 | Product of Array Except Self | | | | | | | |
| 4 | Longest Consecutive Sequence | | | | | | | |
| 5 | Top K Frequent Elements | | | | | | | |
| 135 | Rotate Image | | | | | | | |
| 136 | Spiral Matrix | | | | | | | |
| 6 | Container With Most Water | | | | | | | |
| 7 | 3Sum | | | | | | | |
| 8 | Sort Colors | | | | | | | |
| 9 | Find the Duplicate Number | | | | | | | |
| 10 | Longest Palindromic Substring | | | | | | | |
| 11 | Longest Substring Without Repeating Characters | | | | | | | |
| 12 | Longest Repeating Character Replacement | | | | | | | |
| 13 | Permutation in String | | | | | | | |
| 14 | Find All Anagrams in a String | | | | | | | |
| 15 | Minimum Window Substring | | | | | | | |
| 16 | Fruit Into Baskets | | | | | | | |
| 17 | Max Consecutive Ones III | | | | | | | |
| 18 | Subarray Product Less Than K | | | | | | | |
| 19 | Frequency of the Most Frequent Element | | | | | | | |
| 20 | Sliding Window Maximum | | | | | | | |
| 137 | Best Time to Buy and Sell Stock | | | | | | | |
| 21 | Search in Rotated Sorted Array | | | | | | | |
| 22 | Find Minimum in Rotated Sorted Array | | | | | | | |
| 23 | Find Peak Element | | | | | | | |
| 24 | Koko Eating Bananas | | | | | | | |
| 25 | Capacity To Ship Packages Within D Days | | | | | | | |
| 26 | Minimum Number of Days to Make m Bouquets | | | | | | | |
| 27 | Split Array Largest Sum | | | | | | | |
| 28 | Find First and Last Position of Element in Sorted Array | | | | | | | |
| 29 | Median of Two Sorted Arrays | | | | | | | |
| 30 | Kth Smallest Element in a Sorted Matrix | | | | | | | |
| 31 | Single Number | | | | | | | |
| 32 | Number of 1 Bits | | | | | | | |
| 33 | Counting Bits | | | | | | | |
| 34 | Sum of Two Integers | | | | | | | |

### Phase 2: Data Structures

| # | Problem | Date Solved | Day 1 | Day 3 | Day 7 | Day 14 | Day 30 | Status |
|---|---------|-------------|-------|-------|-------|--------|--------|--------|
| 35 | Daily Temperatures | | | | | | | |
| 36 | Next Greater Element II | | | | | | | |
| 37 | Decode String | | | | | | | |
| 38 | Asteroid Collision | | | | | | | |
| 39 | Remove K Digits | | | | | | | |
| 40 | Largest Rectangle in Histogram | | | | | | | |
| 41 | Trapping Rain Water | | | | | | | |
| 42 | Sum of Subarray Minimums | | | | | | | |
| 43 | Kth Largest Element in an Array | | | | | | | |
| 44 | Top K Frequent Elements | | | | | | | |
| 45 | K Closest Points to Origin | | | | | | | |
| 46 | Find Median from Data Stream | | | | | | | |
| 47 | Meeting Rooms II | | | | | | | |
| 48 | Merge K Sorted Lists | | | | | | | |
| 49 | Smallest Range Covering Elements from K Lists | | | | | | | |
| 50 | Reverse Linked List | | | | | | | |
| 51 | Linked List Cycle | | | | | | | |
| 52 | Reorder List | | | | | | | |
| 53 | Remove Nth Node From End of List | | | | | | | |
| 54 | Copy List with Random Pointer | | | | | | | |
| 55 | Add Two Numbers | | | | | | | |
| 56 | Reverse Nodes in k-Group | | | | | | | |
| 57 | Merge Intervals | | | | | | | |
| 58 | Insert Interval | | | | | | | |
| 59 | Non-overlapping Intervals | | | | | | | |
| 60 | Meeting Rooms | | | | | | | |

### Phase 3: Trees & Graphs

| # | Problem | Date Solved | Day 1 | Day 3 | Day 7 | Day 14 | Day 30 | Status |
|---|---------|-------------|-------|-------|-------|--------|--------|--------|
| 61 | Binary Tree Level Order Traversal | | | | | | | |
| 62 | Binary Tree Right Side View | | | | | | | |
| 63 | Validate Binary Search Tree | | | | | | | |
| 64 | Kth Smallest Element in a BST | | | | | | | |
| 65 | Construct Binary Tree from Preorder and Inorder | | | | | | | |
| 66 | Diameter of Binary Tree | | | | | | | |
| 67 | Balanced Binary Tree | | | | | | | |
| 68 | Lowest Common Ancestor of a BST | | | | | | | |
| 69 | Lowest Common Ancestor of a Binary Tree | | | | | | | |
| 70 | House Robber III | | | | | | | |
| 71 | Binary Tree Maximum Path Sum | | | | | | | |
| 72 | Serialize and Deserialize Binary Tree | | | | | | | |
| 73 | All Nodes Distance K in Binary Tree | | | | | | | |
| 74 | Find Duplicate Subtrees | | | | | | | |
| 75 | Flatten Binary Tree to Linked List | | | | | | | |
| 76 | Number of Islands | | | | | | | |
| 77 | Max Area of Island | | | | | | | |
| 78 | Rotting Oranges | | | | | | | |
| 79 | Pacific Atlantic Water Flow | | | | | | | |
| 80 | Course Schedule | | | | | | | |
| 81 | Course Schedule II | | | | | | | |
| 82 | Clone Graph | | | | | | | |
| 83 | Number of Provinces | | | | | | | |
| 84 | Redundant Connection | | | | | | | |
| 85 | Accounts Merge | | | | | | | |
| 86 | Network Delay Time | | | | | | | |
| 87 | Cheapest Flights Within K Stops | | | | | | | |
| 88 | Path With Minimum Effort | | | | | | | |
| 89 | Word Ladder | | | | | | | |
| 90 | Graph Valid Tree | | | | | | | |
| 91 | Critical Connections in a Network | | | | | | | |
| 92 | Min Cost to Connect All Points | | | | | | | |
| 93 | Number of Connected Components in an Undirected Graph | | | | | | | |
| 94 | Find Eventual Safe States | | | | | | | |
| 95 | Alien Dictionary | | | | | | | |

### Phase 4: DP + Greedy + Backtracking

| # | Problem | Date Solved | Day 1 | Day 3 | Day 7 | Day 14 | Day 30 | Status |
|---|---------|-------------|-------|-------|-------|--------|--------|--------|
| 96 | House Robber | | | | | | | |
| 97 | House Robber II | | | | | | | |
| 98 | Decode Ways | | | | | | | |
| 99 | Coin Change | | | | | | | |
| 100 | Coin Change II | | | | | | | |
| 101 | Partition Equal Subset Sum | | | | | | | |
| 102 | Target Sum | | | | | | | |
| 103 | Word Break | | | | | | | |
| 104 | Longest Common Subsequence | | | | | | | |
| 105 | Edit Distance | | | | | | | |
| 106 | Longest Palindromic Subsequence | | | | | | | |
| 107 | Unique Paths | | | | | | | |
| 108 | Minimum Path Sum | | | | | | | |
| 109 | Maximal Square | | | | | | | |
| 110 | Longest Increasing Subsequence | | | | | | | |
| 111 | Russian Doll Envelopes | | | | | | | |
| 112 | Best Time to Buy and Sell Stock III | | | | | | | |
| 113 | Best Time to Buy and Sell Stock with Cooldown | | | | | | | |
| 114 | Burst Balloons | | | | | | | |
| 115 | Different Ways to Add Parentheses | | | | | | | |
| 138 | Maximum Product Subarray | | | | | | | |
| 139 | Longest Increasing Path in a Matrix | | | | | | | |
| 116 | Jump Game | | | | | | | |
| 117 | Jump Game II | | | | | | | |
| 118 | Gas Station | | | | | | | |
| 119 | Task Scheduler | | | | | | | |
| 140 | Maximum Subarray | | | | | | | |
| 120 | Combination Sum | | | | | | | |
| 121 | Permutations | | | | | | | |
| 122 | Generate Parentheses | | | | | | | |
| 123 | Word Search | | | | | | | |
| 124 | N-Queens | | | | | | | |
| 141 | Subsets | | | | | | | |

### Phase 5: Design

| # | Problem | Date Solved | Day 1 | Day 3 | Day 7 | Day 14 | Day 30 | Status |
|---|---------|-------------|-------|-------|-------|--------|--------|--------|
| 125 | LRU Cache | | | | | | | |
| 126 | LFU Cache | | | | | | | |
| 127 | Implement Trie (Prefix Tree) | | | | | | | |
| 128 | Design Add and Search Words Data Structure | | | | | | | |
| 129 | Time Based Key-Value Store | | | | | | | |
| 130 | Design HashMap | | | | | | | |
| 131 | Insert Delete GetRandom O(1) | | | | | | | |
| 132 | Snapshot Array | | | | | | | |
| 133 | Stock Price Fluctuation | | | | | | | |
| 134 | Design Search Autocomplete System | | | | | | | |
| 142 | Word Search II | | | | | | | |

---

## Section 5: Interview Readiness Tracker

### Readiness Levels

| Level | Description | What It Means |
|-------|-------------|---------------|
| **1** | Can solve with hints | You need external help (editorial, discussion, hints) to arrive at a solution |
| **2** | Can solve independently | You can solve it on your own but may take longer than interview time limits |
| **3** | Can explain optimization | You can articulate why the optimal approach works, trade-offs, and alternatives |
| **4** | Can code in Java without mistakes | Clean, bug-free Java implementation within interview time (25–40 min) |
| **5** | Can solve variants unseen before | You recognize the pattern and can adapt to modified/harder versions on the spot |

### Readiness Assessment by Pattern

| Pattern | Level (1-5) | Weak Areas | Action Items |
|---------|-------------|------------|-------------|
| Arrays & Hashing | | | |
| Two Pointers | | | |
| Sliding Window | | | |
| Binary Search | | | |
| Bit Manipulation | | | |
| Stack | | | |
| Heap | | | |
| Linked List | | | |
| Intervals | | | |
| Trees | | | |
| Graphs | | | |
| Dynamic Programming | | | |
| Greedy | | | |
| Backtracking | | | |
| Design | | | |

### Readiness Assessment by Problem

| # | Problem | Level (1-5) | Last Assessed | Next Review |
|---|---------|-------------|---------------|-------------|
| 1 | Two Sum | | | |
| 2 | Group Anagrams | | | |
| 3 | Product of Array Except Self | | | |
| 4 | Longest Consecutive Sequence | | | |
| 5 | Top K Frequent Elements | | | |
| 135 | Rotate Image | | | |
| 136 | Spiral Matrix | | | |
| 6 | Container With Most Water | | | |
| 7 | 3Sum | | | |
| 8 | Sort Colors | | | |
| 9 | Find the Duplicate Number | | | |
| 10 | Longest Palindromic Substring | | | |
| 11 | Longest Substring Without Repeating Characters | | | |
| 12 | Longest Repeating Character Replacement | | | |
| 13 | Permutation in String | | | |
| 14 | Find All Anagrams in a String | | | |
| 15 | Minimum Window Substring | | | |
| 16 | Fruit Into Baskets | | | |
| 17 | Max Consecutive Ones III | | | |
| 18 | Subarray Product Less Than K | | | |
| 19 | Frequency of the Most Frequent Element | | | |
| 20 | Sliding Window Maximum | | | |
| 137 | Best Time to Buy and Sell Stock | | | |
| 21 | Search in Rotated Sorted Array | | | |
| 22 | Find Minimum in Rotated Sorted Array | | | |
| 23 | Find Peak Element | | | |
| 24 | Koko Eating Bananas | | | |
| 25 | Capacity To Ship Packages Within D Days | | | |
| 26 | Minimum Number of Days to Make m Bouquets | | | |
| 27 | Split Array Largest Sum | | | |
| 28 | Find First and Last Position of Element in Sorted Array | | | |
| 29 | Median of Two Sorted Arrays | | | |
| 30 | Kth Smallest Element in a Sorted Matrix | | | |
| 31 | Single Number | | | |
| 32 | Number of 1 Bits | | | |
| 33 | Counting Bits | | | |
| 34 | Sum of Two Integers | | | |
| 35 | Daily Temperatures | | | |
| 36 | Next Greater Element II | | | |
| 37 | Decode String | | | |
| 38 | Asteroid Collision | | | |
| 39 | Remove K Digits | | | |
| 40 | Largest Rectangle in Histogram | | | |
| 41 | Trapping Rain Water | | | |
| 42 | Sum of Subarray Minimums | | | |
| 43 | Kth Largest Element in an Array | | | |
| 44 | Top K Frequent Elements | | | |
| 45 | K Closest Points to Origin | | | |
| 46 | Find Median from Data Stream | | | |
| 47 | Meeting Rooms II | | | |
| 48 | Merge K Sorted Lists | | | |
| 49 | Smallest Range Covering Elements from K Lists | | | |
| 50 | Reverse Linked List | | | |
| 51 | Linked List Cycle | | | |
| 52 | Reorder List | | | |
| 53 | Remove Nth Node From End of List | | | |
| 54 | Copy List with Random Pointer | | | |
| 55 | Add Two Numbers | | | |
| 56 | Reverse Nodes in k-Group | | | |
| 57 | Merge Intervals | | | |
| 58 | Insert Interval | | | |
| 59 | Non-overlapping Intervals | | | |
| 60 | Meeting Rooms | | | |
| 61 | Binary Tree Level Order Traversal | | | |
| 62 | Binary Tree Right Side View | | | |
| 63 | Validate Binary Search Tree | | | |
| 64 | Kth Smallest Element in a BST | | | |
| 65 | Construct Binary Tree from Preorder and Inorder Traversal | | | |
| 66 | Diameter of Binary Tree | | | |
| 67 | Balanced Binary Tree | | | |
| 68 | Lowest Common Ancestor of a BST | | | |
| 69 | Lowest Common Ancestor of a Binary Tree | | | |
| 70 | House Robber III | | | |
| 71 | Binary Tree Maximum Path Sum | | | |
| 72 | Serialize and Deserialize Binary Tree | | | |
| 73 | All Nodes Distance K in Binary Tree | | | |
| 74 | Find Duplicate Subtrees | | | |
| 75 | Flatten Binary Tree to Linked List | | | |
| 76 | Number of Islands | | | |
| 77 | Max Area of Island | | | |
| 78 | Rotting Oranges | | | |
| 79 | Pacific Atlantic Water Flow | | | |
| 80 | Course Schedule | | | |
| 81 | Course Schedule II | | | |
| 82 | Clone Graph | | | |
| 83 | Number of Provinces | | | |
| 84 | Redundant Connection | | | |
| 85 | Accounts Merge | | | |
| 86 | Network Delay Time | | | |
| 87 | Cheapest Flights Within K Stops | | | |
| 88 | Path With Minimum Effort | | | |
| 89 | Word Ladder | | | |
| 90 | Graph Valid Tree | | | |
| 91 | Critical Connections in a Network | | | |
| 92 | Min Cost to Connect All Points | | | |
| 93 | Number of Connected Components in an Undirected Graph | | | |
| 94 | Find Eventual Safe States | | | |
| 95 | Alien Dictionary | | | |
| 96 | House Robber | | | |
| 97 | House Robber II | | | |
| 98 | Decode Ways | | | |
| 99 | Coin Change | | | |
| 100 | Coin Change II | | | |
| 101 | Partition Equal Subset Sum | | | |
| 102 | Target Sum | | | |
| 103 | Word Break | | | |
| 104 | Longest Common Subsequence | | | |
| 105 | Edit Distance | | | |
| 106 | Longest Palindromic Subsequence | | | |
| 107 | Unique Paths | | | |
| 108 | Minimum Path Sum | | | |
| 109 | Maximal Square | | | |
| 110 | Longest Increasing Subsequence | | | |
| 111 | Russian Doll Envelopes | | | |
| 112 | Best Time to Buy and Sell Stock III | | | |
| 113 | Best Time to Buy and Sell Stock with Cooldown | | | |
| 114 | Burst Balloons | | | |
| 115 | Different Ways to Add Parentheses | | | |
| 138 | Maximum Product Subarray | | | |
| 139 | Longest Increasing Path in a Matrix | | | |
| 116 | Jump Game | | | |
| 117 | Jump Game II | | | |
| 118 | Gas Station | | | |
| 119 | Task Scheduler | | | |
| 140 | Maximum Subarray | | | |
| 120 | Combination Sum | | | |
| 121 | Permutations | | | |
| 122 | Generate Parentheses | | | |
| 123 | Word Search | | | |
| 124 | N-Queens | | | |
| 141 | Subsets | | | |
| 125 | LRU Cache | | | |
| 126 | LFU Cache | | | |
| 127 | Implement Trie (Prefix Tree) | | | |
| 128 | Design Add and Search Words Data Structure | | | |
| 129 | Time Based Key-Value Store | | | |
| 130 | Design HashMap | | | |
| 131 | Insert Delete GetRandom O(1) | | | |
| 132 | Snapshot Array | | | |
| 133 | Stock Price Fluctuation | | | |
| 134 | Design Search Autocomplete System | | | |
| 142 | Word Search II | | | |

---

## Section 6: Mock Interview Tracker

### Mock Interview Log

| Date | Company | Question | Pattern | Difficulty | Time Taken | Outcome | Mistakes | Follow-up Questions |
|------|---------|----------|---------|-----------|------------|---------|----------|---------------------|
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |

### Outcome Legend

| Symbol | Meaning |
|--------|---------|
| ✅ Solved | Solved optimally within time |
| ⚠️ Partial | Had the right approach but made implementation errors |
| 🔄 Hints | Needed hints to arrive at the approach |
| ❌ Failed | Could not solve — needs re-study |

### Mock Interview Schedule Template

| Week | Day | Type | Duration | Focus |
|------|-----|------|----------|-------|
| Any | Monday | Timed Mock | 45 min × 2 | 2 random Medium problems |
| Any | Wednesday | Timed Mock | 20 + 60 min | 1 Easy + 1 Hard |
| Any | Friday | Company-Specific | 90 min | 2 problems tagged for target company |

---

## Section 7: Weakness Analysis

### Pattern-Wise Accuracy

| Pattern | Total | Attempted | Solved First Try | Accuracy % | Avg Time | Weakness Level |
|---------|-------|-----------|-----------------|------------|----------|---------------|
| Arrays & Hashing | 7 | | | | | |
| Two Pointers | 5 | | | | | |
| Sliding Window | 11 | | | | | |
| Binary Search | 10 | | | | | |
| Bit Manipulation | 4 | | | | | |
| Stack | 8 | | | | | |
| Heap | 7 | | | | | |
| Linked List | 7 | | | | | |
| Intervals | 4 | | | | | |
| Trees | 15 | | | | | |
| Graphs | 20 | | | | | |
| Dynamic Programming | 22 | | | | | |
| Greedy | 5 | | | | | |
| Backtracking | 6 | | | | | |
| Design | 11 | | | | | |

**Weakness Levels:** 🟢 Strong (>80%) | 🟡 Moderate (50–80%) | 🔴 Weak (<50%)

### Difficulty-Wise Accuracy

| Difficulty | Total | Attempted | Solved First Try | Accuracy % | Avg Time | Target Time |
|-----------|-------|-----------|-----------------|------------|----------|-------------|
| Easy | 11 | | | | | < 15 min |
| Medium | 98 | | | | | < 30 min |
| Hard | 33 | | | | | < 45 min |

### Most Forgotten Problems (Reset During Revision)

| # | Problem | Pattern | Times Forgotten | Last Failed Revision | Root Cause |
|---|---------|---------|----------------|---------------------|------------|
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |

### Topics Needing Revision (Update Weekly)

| Priority | Pattern / Topic | Specific Weakness | Action Plan | Target Date | Status |
|----------|----------------|-------------------|-------------|-------------|--------|
| 🔴 Critical | | | | | |
| 🔴 Critical | | | | | |
| 🟡 Moderate | | | | | |
| 🟡 Moderate | | | | | |
| 🟢 Polish | | | | | |
| 🟢 Polish | | | | | |

### Company-Specific Focus Areas

| Company | Top Patterns | Must-Solve Problems |
|---------|-------------|---------------------|
| **Amazon** | BFS, Greedy, Two Pointers, Hashing | Number of Islands, Task Scheduler, Two Sum, Meeting Rooms II |
| **Google** | Binary Search, DFS/BFS, DP, Backtracking | Median of Two Sorted Arrays, Word Search, Burst Balloons, Trapping Rain Water |
| **Microsoft** | DP, Trees, Graphs, Hashing | LIS, Coin Change, Course Schedule, Serialize/Deserialize Tree |
| **Uber** | Graphs, DP, Intervals, Greedy | Alien Dictionary, Edit Distance, Merge Intervals, Jump Game II |
| **Airbnb** | Graphs, Backtracking, Design | Word Search, N-Queens, LRU Cache, Alien Dictionary |
| **Atlassian** | Design, Trees, Hashing | LRU Cache, Trie, Group Anagrams, Binary Tree Level Order |
| **Stripe** | Design, Arrays, Sliding Window | Design HashMap, Insert Delete GetRandom, Minimum Window Substring |
| **Databricks** | DP, Binary Search, Graphs | Edit Distance, Median of Two Sorted Arrays, Course Schedule |
| **Rubrik** | Design, Graphs, DP | LRU Cache, Number of Islands, Coin Change |
| **Confluent** | Design, Graphs, Intervals | Time Based Key-Value Store, Course Schedule II, Merge Intervals |

---

*This document is the master index. Pattern-specific deep dives are in `internals/`. Progress is tracked here. Update weekly.*
