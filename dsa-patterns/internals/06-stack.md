# Stack — Complete Study Guide

> **Phase 2, Data Structure #1** | 8 problems | You: **0/8 solved**
> **Read this fully before solving any Stack problems.**

---

## Table of Contents

1. [Description](#1-description)
2. [Applications](#2-applications)
3. [Types / Variants](#3-types--variants)
4. [Java Implementation](#4-java-implementation)
5. [Methods & Operations](#5-methods--operations)
6. [When to Recognize in Problems](#6-when-to-recognize-in-problems)
7. [Templates](#7-templates)
8. [Complexity Summary](#8-complexity-summary)
9. [Common Mistakes](#9-common-mistakes)
10. [Your Progress & Problem Order](#10-your-progress--problem-order)

---

## 1. Description

A **stack** is LIFO — Last In, First Out. Push on top, pop from top, peek at top.

```text
        push(3)  push(7)  pop() → 7
           │        │
    ┌───┬───┬───┬───┐
    │ 1 │ 3 │ 7 │   │  ← top
    └───┴───┴───┴───┘
```

Think: stack of plates — you only touch the top one.

**Core interview use:** maintain a **monotonic** sequence (always increasing or always decreasing) while scanning an array — when the invariant breaks, pop and process.

---

## 2. Applications

| Use case | Example |
|----------|---------|
| Next greater / smaller element | LC #739, #503 |
| Nested structure parsing | LC #394 brackets, decode string |
| Simulation with collision | LC #735 asteroids |
| Greedy digit removal | LC #402 remove K digits |
| Histogram / area | LC #84, #42 trapping water |
| Contribution counting | LC #907 subarray minimums |
| DFS (iterative) | Tree/graph traversal |
| Undo / backtrack | Editors, browsers |

---

## 3. Types / Variants

| Variant | What it stores | When |
|---------|----------------|------|
| **Monotonic decreasing** | Indices or values, largest at bottom | **Next greater element** — pop while `current > stack.top` |
| **Monotonic increasing** | Smallest at bottom | **Next smaller**, remove K digits |
| **Two stacks** | Count stack + string stack | Decode nested string |
| **Stack of indices** | Index not value | Histogram — need width on pop |
| **Min stack** | Values + min tracker | Get min in O(1) |

**Monotonic stack insight:** Each element is pushed once and popped at most once → **O(n)** total.

---

## 4. Java Implementation

**Always use `ArrayDeque` — never `java.util.Stack` (legacy, synchronized, extends Vector).**

```java
Deque<Integer> stack = new ArrayDeque<>();

stack.push(10);           // add to front (top)
stack.peek();             // see top without remove
stack.pop();              // remove top
stack.isEmpty();

// Iteration: bottom to top
for (int x : stack) { ... }
```

For **indices** in monotonic stack:

```java
Deque<Integer> stack = new ArrayDeque<>(); // stores indices
int[] nums = ...;
for (int i = 0; i < nums.length; i++) {
    while (!stack.isEmpty() && nums[i] > nums[stack.peek()]) {
        int idx = stack.pop();
        // process: nums[idx]'s answer is nums[i]
    }
    stack.push(i);
}
```

---

## 5. Methods & Operations

| Operation | `ArrayDeque` | Time |
|-----------|--------------|------|
| push | `push(e)` / `addFirst(e)` | O(1) |
| pop | `pop()` / `removeFirst()` | O(1) |
| peek | `peek()` / `peekFirst()` | O(1) |
| size | `size()` | O(1) |
| empty check | `isEmpty()` | O(1) |

**Never** call `peek()` or `pop()` without checking `isEmpty()` first.

---

## 6. When to Recognize in Problems

| Signal phrase | Reach for |
|---------------|-----------|
| "Next greater / smaller element" | Monotonic stack |
| "How many days until warmer" | Monotonic decreasing stack of indices |
| "Decode nested `k[string]`" | Stack of strings + counts |
| "Remove K digits to get smallest" | Monotonic increasing stack |
| "Largest rectangle in histogram" | Monotonic increasing stack of indices |
| "Trapping rain water" | Stack OR two pointers OR prefix max |
| "Subarray minimums sum" | Monotonic stack + contribution |

---

## 7. Templates

### Template 1 — Next Greater Element (LC #739 style)

```text
result = array of -1 (or 0 for days count)
stack = empty  // indices

for i from 0 to n-1:
    while stack not empty AND nums[i] > nums[stack.top]:
        idx = stack.pop()
        result[idx] = i - idx   // or nums[i] for NGE value
    stack.push(i)

return result
```

### Template 2 — Circular array (LC #503)

Double the scan or use modulo: `nums[i % n]` for `i` in `0..2n-1`.

### Template 3 — Decode String (LC #394)

```text
countStack, stringStack
currentString = "", currentCount = 0

for each char c:
    if digit: build currentCount
    if '[': push currentString and currentCount; reset both
    if ']': pop prevString and prevCount; currentString = prev + repeat(current, count)
    if letter: append to currentString
```

### Template 4 — Largest Rectangle in Histogram (LC #84)

```text
stack = increasing indices
maxArea = 0
append sentinel height 0 at end

for i from 0 to n (with sentinel):
    while stack not empty AND heights[i] < heights[stack.top]:
        h = heights[stack.pop()]
        w = stack empty ? i : i - stack.top - 1
        maxArea = max(maxArea, h * w)
    stack.push(i)
```

---

## 8. Complexity Summary

| Approach | Time | Space |
|----------|------|-------|
| Brute force (nested loops) | O(n²) | O(1) |
| Monotonic stack | O(n) | O(n) |
| Stack parsing | O(n) | O(n) |

---

## 9. Common Mistakes

- Using `Stack` class instead of `ArrayDeque`
- Forgetting to **drain stack** after main loop (remaining indices still need answers)
- **Monotonic direction** wrong — draw one example before coding
- Histogram: using values instead of **indices** (width calculation needs index)
- `peek()` on empty stack → `NoSuchElementException`
- Confusing `#739` (days until warmer) with `#503` (next greater value, circular)

---

## 10. Your Progress & Problem Order

| Order | Row | Problem | LC# | Focus |
|-------|-----|---------|-----|-------|
| 1 | 35 | Daily Temperatures | 739 | Monotonic stack intro — **start here** |
| 2 | 36 | Next Greater Element II | 503 | Circular variant |
| 3 | 37 | Decode String | 394 | Two-stack parsing |
| 4 | 38 | Asteroid Collision | 735 | Simulation |
| 5 | 39 | Remove K Digits | 402 | Greedy + monotonic increasing |
| 6 | 40 | Largest Rectangle in Histogram | 84 | Hard — index stack |
| 7 | 41 | Trapping Rain Water | 42 | Hard — know stack + 2-pointer |
| 8 | 42 | Sum of Subarray Minimums | 907 | Contribution technique |

**Phase 1 note:** LC #4 (Median) still open — finish this weekend; don't block Stack start.

---

## Quick reference card

```text
LIFO: ArrayDeque, never java.util.Stack
Next greater → monotonic DECREASING stack (pop when current > top)
Next smaller → monotonic INCREASING stack
Each element pushed/popped once → O(n)
Always check isEmpty() before peek/pop
```
