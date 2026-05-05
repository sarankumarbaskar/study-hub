# Monotonic Stack — Interview Execution Playbook

> **Pattern Mastery Level:** This is the most "mechanical" advanced pattern — once you see the signal, the template writes itself. It appears in ~8% of FAANG coding rounds and is the backbone of histogram, span, and "next greater/smaller" families. If you can't write the decreasing stack template in 2 minutes, you're not ready.

---

## 1. Pattern Recognition Signals

### When to Use Monotonic Stack

```
INSTANT TRIGGERS (say "monotonic stack" within 5 seconds):
  ✓ "Next greater element" or "next smaller element"
  ✓ "Previous greater element" or "previous smaller element"
  ✓ "Daily temperatures" / "days until warmer"
  ✓ "Stock span" / "consecutive days ≤ price"
  ✓ "Histogram" + "largest rectangle"
  ✓ "Trapping rain water" (stack variant)
  ✓ "Remove k digits" / "smallest number after removal"
  ✓ "Remove duplicate letters" / "smallest subsequence"
```

### Keywords in Problem Statements

```
DIRECT SIGNALS:                 INDIRECT SIGNALS:
  "next greater"                  "histogram" / "bar chart"
  "next smaller"                  "span" / "consecutive"
  "previous greater"              "remove digits" / "minimize number"
  "daily temperature"             "maximal rectangle"
  "stock span"                    "subarray minimum/maximum"
  "asteroid collision"            "lexicographically smallest"
```

### When NOT to Use

```
✗ Need kth largest/smallest globally → use HEAP
✗ Sliding window min/max with fixed window size → use MONOTONIC DEQUE (both ends needed)
✗ Finding pairs with a target sum → use TWO POINTERS or HASHING
✗ Need to process elements in sorted order → use SORTING or HEAP
✗ Tree or graph traversal → use BFS/DFS with a regular stack
```

---

## 2. Thinking Framework (Step-by-Step Intuition)

### The 60-Second Decision Process

```
Step 1: "Does the problem ask about the NEXT or PREVIOUS element that is 
         GREATER or SMALLER than the current one?"
  YES → Classic monotonic stack. Go to Step 3.
  NO  → Continue to Step 2.

Step 2: "Does the problem involve boundaries/extents defined by 
         greater/smaller elements?"
  (histogram area, trapped water, subarray min contribution)
  YES → Monotonic stack to find left/right boundaries.
  NO  → Probably not a monotonic stack problem.

Step 3: "Do I need NEXT GREATER or NEXT SMALLER?"
  NEXT GREATER  → Monotonic DECREASING stack (pop when current > top)
  NEXT SMALLER  → Monotonic INCREASING stack (pop when current < top)

Step 4: "Do I need the VALUE or the INDEX?"
  INDEX → Store indices in the stack (most problems)
  VALUE → Store values directly (only when distance/width is irrelevant)
```

### The Core Insight (Memorize This)

```
THE STACK IS A WAITING ROOM.

Elements sit in the stack WAITING for their answer. When a new element
arrives that "beats" the stack top:
  - The new element IS the answer for the popped element
  - Pop it, record the answer, repeat

Why O(n)? Each element enters the waiting room once (push) and leaves
once (pop). Total operations = 2n = O(n).

WHY STORE INDICES, NOT VALUES:
  - Indices give you BOTH the value (arr[idx]) and the position
  - Position is needed for: distance (days until warmer), width 
    (histogram rectangle), or range (trapped water segment)
  - Values alone lose positional information permanently

DECREASING vs INCREASING — THE RULE:
  Monotonic DECREASING (big on bottom, small on top):
    → Pops when current > top → finds NEXT GREATER
  Monotonic INCREASING (small on bottom, big on top):
    → Pops when current < top → finds NEXT SMALLER
```

### The Four Variants (Next/Previous × Greater/Smaller)

```
┌─────────────────────┬────────────────────┬────────────────────┐
│                      │ GREATER            │ SMALLER            │
├─────────────────────┼────────────────────┼────────────────────┤
│ NEXT (look right)   │ Decreasing stack   │ Increasing stack   │
│                     │ L→R scan           │ L→R scan           │
│                     │ Pop when cur > top  │ Pop when cur < top  │
├─────────────────────┼────────────────────┼────────────────────┤
│ PREVIOUS (look left)│ Decreasing stack   │ Increasing stack   │
│                     │ After pop, peek =  │ After pop, peek =  │
│                     │ prev greater       │ prev smaller       │
└─────────────────────┴────────────────────┴────────────────────┘

Key: "Previous" comes free — after popping, the new stack top IS the
     previous greater (or smaller) for the current element.
```

### Relationship to Sliding Window Maximum

```
Monotonic stack:  finds next/previous greater/smaller for ALL elements
Monotonic deque:  maintains max/min within a SLIDING WINDOW of fixed size

Sliding window max (LC 239) uses a monotonic DEQUE because:
  - We need to add from one end (new element) and remove from the other 
    (element leaving the window)
  - A stack only has one end → can't expire old elements efficiently

Rule of thumb:
  - Fixed window size → Monotonic DEQUE
  - No window / variable boundaries → Monotonic STACK
```

---

## 3. Java Templates (Production-Quality)

### Template 1: Next Greater Element (Monotonic Decreasing Stack)

```java
// USE FOR: Next Greater Element I/II, Daily Temperatures
// Stack maintains DECREASING order (big on bottom)
// Pop when current > top → current IS the next greater for popped element
// TIME: O(n) | SPACE: O(n)
public int[] nextGreater(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>(); // stores INDICES

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i]) {
            int idx = stack.pop();
            result[idx] = arr[i]; // or (i - idx) for distance
        }
        stack.push(i);
    }
    return result;
}
```

### Template 2: Previous Smaller Element (Monotonic Increasing Stack)

```java
// USE FOR: Histogram boundaries, subarray min contribution
// Stack maintains INCREASING order (small on bottom)
// Pop when current ≤ top → top has no use anymore
// After pops, peek = previous smaller for current element
// TIME: O(n) | SPACE: O(n)
public int[] previousSmaller(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1); // -1 means no previous smaller
    Deque<Integer> stack = new ArrayDeque<>(); // stores INDICES

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] >= arr[i]) {
            stack.pop();
        }
        result[i] = stack.isEmpty() ? -1 : stack.peek();
        stack.push(i);
    }
    return result;
}
```

### Template 3: Monotonic Decreasing Stack (Histogram / Boundary Pattern)

```java
// USE FOR: Largest Rectangle in Histogram, Maximal Rectangle, Trapping Rain Water
// When an element pops, we know BOTH its boundaries:
//   right boundary = current index (the element that caused the pop)
//   left boundary  = new stack top (the element just beneath in stack)
// TIME: O(n) | SPACE: O(n)
public int histogramArea(int[] heights) {
    int n = heights.length;
    Deque<Integer> stack = new ArrayDeque<>();
    int maxArea = 0;

    for (int i = 0; i <= n; i++) {
        int h = (i == n) ? 0 : heights[i]; // sentinel triggers final cleanup
        while (!stack.isEmpty() && heights[stack.peek()] > h) {
            int idx = stack.pop();
            int left = stack.isEmpty() ? -1 : stack.peek();
            int width = i - left - 1;
            maxArea = Math.max(maxArea, heights[idx] * width);
        }
        stack.push(i);
    }
    return maxArea;
}
```

### Template 4: Monotonic Increasing Stack (Greedy Removal)

```java
// USE FOR: Remove K Digits, Remove Duplicate Letters
// Maintain smallest possible sequence by removing larger preceding elements
// Stack is increasing: pop larger elements when a smaller one arrives
// TIME: O(n) | SPACE: O(n)
public String removeKDigits(String num, int k) {
    StringBuilder stack = new StringBuilder();

    for (char c : num.toCharArray()) {
        while (k > 0 && stack.length() > 0 
               && stack.charAt(stack.length() - 1) > c) {
            stack.setLength(stack.length() - 1);
            k--;
        }
        if (stack.length() > 0 || c != '0') {
            stack.append(c);
        }
    }

    while (k-- > 0 && stack.length() > 0) {
        stack.setLength(stack.length() - 1);
    }
    return stack.length() == 0 ? "0" : stack.toString();
}
```

---

## 4. Edge Case Checklist

```
INPUT EDGE CASES:
  □ Empty array (length 0) → return empty/0
  □ Single element → no next greater/smaller exists, return -1/default
  □ All elements identical → no element is strictly greater/smaller
  □ Strictly increasing array → stack never pops (all get -1 for next greater)
  □ Strictly decreasing array → every element pops immediately
  □ Array with all same values → strict vs non-strict comparison matters

COMPARISON EDGE CASES:
  □ Strict (< / >) vs non-strict (≤ / ≥) — changes behavior with duplicates
  □ For "next greater": use STRICT (arr[top] < arr[i]) to pop
  □ For contribution counting with duplicates: use asymmetric comparisons
    (one side strict, one side non-strict) to avoid double-counting

STACK CLEANUP:
  □ Elements remaining in stack after the loop have NO answer
  □ Set their result to -1, n, or 0 depending on problem semantics
  □ Histogram trick: append a sentinel height 0 to force all pops

SPECIAL PATTERNS:
  □ Circular array → iterate 2n elements, use i % n, only push when i < n
  □ Leading zeros → in Remove K Digits, skip leading '0' pushes
  □ Integer overflow → use long for multiplication (subarray min contribution)
  □ Width calculation → width = rightBoundary - leftBoundary - 1 (exclusive)
  □ Trapped water → after popping floor, check if stack is empty before computing
```

---

## 5. Problem Progression (LeetCode)

### Level 1: Easy — Template Application

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 496 | [Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/) | Decreasing stack on nums2, HashMap to map answers to nums1 | O(n+m) |
| 739 | [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) | Next greater by INDEX; result[idx] = i - idx gives days to wait | O(n) |

### Level 2: Standard Medium

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 901 | [Online Stock Span](https://leetcode.com/problems/online-stock-span/) | Previous greater via decreasing stack; accumulate spans when popping | O(1) amortized |
| 503 | [Next Greater Element II](https://leetcode.com/problems/next-greater-element-ii/) | Circular array: iterate 2n, use i % n, push only when i < n | O(n) |
| 402 | [Remove K Digits](https://leetcode.com/problems/remove-k-digits/) | Increasing stack; pop larger preceding digits to minimize number | O(n) |
| 316 | [Remove Duplicate Letters](https://leetcode.com/problems/remove-duplicate-letters/) | Increasing stack + frequency count + inStack boolean array | O(n) |

### Level 3: Hard — FAANG Interview Level

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 84 | [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) | Increasing stack; on pop, both boundaries known → width × height | O(n) |
| 85 | [Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/) | Build histogram per row, run LC 84 on each row | O(rows×cols) |
| 42 | [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/) | Decreasing stack; pop = valley floor; water = min(walls) - floor × width | O(n) |

### Solving Order for Maximum Learning

```
Day 1: 496 → 739 (build the "next greater" muscle memory)
Day 2: 901 → 503 (previous greater, circular arrays)
Day 3: 402 → 316 (greedy removal — different application of same idea)
Day 4: 84 → 85  (histogram family — the hardest template)
Day 5: 42 (trapping rain water — stack approach, compare with two-pointer approach)
Day 6: Re-solve 84 and 42 from memory (no notes). If you can't, repeat Day 4-5.
```

---

## 6. Common Mistakes & Interview Traps

### Mistake 1: Storing Values Instead of Indices

```
WRONG: stack.push(arr[i])
  You lose positional information. Can't compute distance, width, or range.

CORRECT: stack.push(i)
  Access value via arr[stack.peek()]. You get BOTH position AND value.

EXCEPTION: LC 496 (Next Greater Element I) — values are unique and you only 
need the value mapping, so storing values directly is acceptable.
Stock Span stores (price, span) pairs — still positional via accumulated span.
```

### Mistake 2: Wrong Comparison Direction

```
WRONG: Using > when you need < (or vice versa)

REMEMBER:
  Next GREATER → pop when arr[top] < arr[i]   (current beats top)
  Next SMALLER → pop when arr[top] > arr[i]   (current beats top)

The comparison is ALWAYS "top vs current". The question is:
  "Does the current element ANSWER the question for the top element?"
  If top is waiting for a GREATER element and current IS greater → pop.
  If top is waiting for a SMALLER element and current IS smaller → pop.
```

### Mistake 3: Forgetting Stack Cleanup After the Loop

```
WRONG: Returning result without handling remaining stack elements
  Elements left in stack have no next greater/smaller → need default values

FIX: Either:
  (a) Pre-fill result with defaults: Arrays.fill(result, -1) or Arrays.fill(result, n)
  (b) Use a sentinel value at the end (histogram: append height 0)
  (c) Process remaining stack in a second loop

Best practice: Pre-fill with defaults. It's the cleanest.
```

### Mistake 4: Double-Counting Duplicates in Contribution Problems

```
PROBLEM: In LC 907 (Sum of Subarray Minimums), duplicate values cause
  the same subarray to be counted by two different elements.

FIX: Use asymmetric comparisons:
  Left boundary:  previous SMALLER OR EQUAL (>=, pop equal values)
  Right boundary: next strictly SMALLER   (<, stop at equal values)
  
  This assigns each subarray to exactly one element (the LEFTMOST minimum).
```

### Mistake 5: Off-by-One in Width Calculation

```
WRONG: width = right - left
  This includes one boundary → overcounts by 1

CORRECT: width = right - left - 1
  Exclusive boundaries: elements BETWEEN left boundary and right boundary

Drawing it out:
  indices: ... [left] [x] [x] [x] [right] ...
  width = right - left - 1 = number of x's

Always draw the boundary picture if you're unsure.
```

### What Interviewers Actually Look For

```
JUNIOR:    Can write next greater element with the template
SENIOR:    Knows when to use increasing vs decreasing, handles histogram,
           explains why O(n) despite nested while loop
STAFF:     Immediately sees the monotonic stack signal, chooses between
           stack/two-pointer/DP approaches, discusses trade-offs,
           handles all edge cases without prompting
```

---

## 7. Interview Strategy

### Target Solving Times

```
Easy (Next Greater I, Daily Temps):          5-8 minutes
Medium (Stock Span, Remove K Digits):        10-15 minutes
Hard (Histogram, Trapping Rain Water):       15-20 minutes

If you're taking longer, you haven't internalized the templates.
```

### How to Explain Your Approach (Script)

```
STEP 1 (30 seconds): State the brute force
  "Brute force: for each element, scan right to find the next greater.
   That's O(n²) — each element scans up to n elements."

STEP 2 (30 seconds): Identify the optimization
  "I'll use a monotonic stack. Elements wait in the stack for their answer.
   When a new element arrives that's greater, it answers all smaller elements
   on top. Each element is pushed once and popped once, so it's O(n)."

STEP 3 (15 seconds): State the stack type
  "I need next GREATER, so I'll use a monotonic DECREASING stack —
   I pop when the current element is greater than the top."

STEP 4 (15 seconds): Clarify index vs value
  "I'll store indices in the stack so I can compute distances/widths."

STEP 5: Code (5-12 minutes)

STEP 6 (30 seconds): Dry run with example
  "For [2,1,4,3]: 
   i=0: push 0 (stack: [0])
   i=1: 1 < 2, push 1 (stack: [0,1])
   i=2: 4 > 1, pop 1 → result[1]=4. 4 > 2, pop 0 → result[0]=4. Push 2.
   i=3: 3 < 4, push 3 (stack: [2,3])
   Remaining: result[2]=-1, result[3]=-1
   Result: [4, 4, -1, -1] ✓"
```

### The "Why O(n)?" Question (They WILL Ask)

```
"Even though there's a while loop inside the for loop, the total work
is still O(n). Here's why: each of the n elements is pushed onto the 
stack EXACTLY once and popped AT MOST once. So the total number of push 
operations is n, and the total number of pop operations is at most n. 
The while loop across ALL iterations of the for loop does at most n pops 
total. So the overall work is O(2n) = O(n)."

This is called AMORTIZED analysis. Same argument applies to:
  - Two pointer convergence
  - Sliding window expand/shrink
  - Union-Find with path compression
```

### Follow-Up Questions Interviewers Ask

```
Q: "Can you do this without extra space?"
A: "Not with this approach — the stack is essential. But for some variants
    like Trapping Rain Water, a two-pointer approach achieves O(1) space."

Q: "What if the array is circular?"
A: "Iterate 2n elements using i % n. Only push indices in the first n
    iterations. The second pass resolves wrap-around cases."

Q: "What's the difference between this and a priority queue approach?"
A: "A priority queue gives you the global max/min in O(log n) per operation.
    A monotonic stack gives you the NEAREST greater/smaller in O(1) amortized.
    Different questions — 'what's the biggest?' vs 'what's the closest bigger?'"

Q: "How does the histogram problem use this?"
A: "Each bar waits in the stack. When a shorter bar arrives, it tells us the
    right boundary of the popped bar. The new stack top is the left boundary.
    Width = right - left - 1. Area = height × width. One pass, O(n)."
```

---

## 8. Revision Strategy

### Weekly Revision Plan

```
WEEK 1: Solve all 9 problems from scratch. Time yourself.
WEEK 2: Re-solve only the ones you couldn't do in target time.
WEEK 3: Solve LC 84 (Histogram) and LC 42 (Trapping Rain Water) from memory.
WEEK 4: Mix with other patterns (two pointers for trap water, DP for subarray min)
         to practice approach selection.
```

### What to Memorize vs Understand

```
MEMORIZE:
  ✓ The 4 templates (next greater, previous smaller, histogram, greedy removal)
  ✓ "Decreasing stack → next GREATER, Increasing stack → next SMALLER"
  ✓ "Store INDICES, not values" (with rare exceptions)
  ✓ "Sentinel value of 0 at end" trick for histogram cleanup
  ✓ Asymmetric comparison rule for duplicate handling

UNDERSTAND (don't memorize — derive each time):
  ✓ WHY it's O(n) (amortized: each element pushed once, popped at most once)
  ✓ WHY decreasing finds next greater (because we pop when something bigger comes)
  ✓ HOW the histogram boundary calculation works (draw the picture)
  ✓ HOW trapping rain water uses the stack (valley = floor between two walls)
  ✓ WHY Remove K Digits uses an increasing stack (greedy: remove large before small)
```

### Signals That Indicate Mastery

```
□ You see "next greater element" and write the template in under 2 minutes
□ You can solve LC 84 (Histogram) without looking at notes in 12 minutes
□ You can explain why the nested while loop is still O(n) total
□ You know when to use strict vs non-strict comparison for duplicates
□ You can solve Trapping Rain Water BOTH ways (stack and two-pointer)
□ You immediately recognize LC 85 as "histogram per row"
□ You can derive the Remove Duplicate Letters solution from the Remove K Digits template
```

---

## Quick Reference Card (Print This)

```
PATTERN              STACK TYPE    COMPARISON        USE CASE
───────────────────────────────────────────────────────────────────
Next greater         Decreasing    cur > top → pop   LC 496, 739, 503
Next smaller         Increasing    cur < top → pop   Histogram bounds
Previous greater     Decreasing    peek after pops   LC 901 (Stock Span)
Previous smaller     Increasing    peek after pops   LC 907 (Subarray Min)
Histogram area       Increasing    sentinel cleanup  LC 84, 85
Trapped water        Decreasing    valley detection  LC 42
Greedy removal       Increasing    pop larger prefix LC 402, 316

DECISION TREE:
  "next/prev greater/smaller?"    → monotonic stack
  "histogram / rectangle area?"   → increasing stack + boundary calc
  "minimize number by removal?"   → increasing stack (greedy)
  "sliding window max/min?"       → monotonic DEQUE (not stack)

KEY RULES:
  1. Store INDICES (not values) in the stack
  2. Decreasing stack → next GREATER | Increasing stack → next SMALLER
  3. Each element pushed once, popped once → O(n) amortized
  4. Width = right_boundary - left_boundary - 1 (exclusive)
  5. Sentinel trick: append 0 to force final cleanup in histogram
```

---

## Appendix: Full Solutions for Key Problems

### LC 496 — Next Greater Element I

```java
class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {
        Map<Integer, Integer> nextGreater = new HashMap<>();
        Deque<Integer> stack = new ArrayDeque<>();

        for (int num : nums2) {
            while (!stack.isEmpty() && stack.peek() < num) {
                nextGreater.put(stack.pop(), num);
            }
            stack.push(num);
        }

        int[] result = new int[nums1.length];
        for (int i = 0; i < nums1.length; i++) {
            result[i] = nextGreater.getOrDefault(nums1[i], -1);
        }
        return result;
    }
}
// Values are unique → storing values (not indices) is fine here.
// Time O(n + m) | Space O(n)
```

### LC 739 — Daily Temperatures

```java
class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] result = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();

        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
                int idx = stack.pop();
                result[idx] = i - idx;
            }
            stack.push(i);
        }
        return result;
    }
}
// Classic next-greater-by-index. Result is DISTANCE, not value.
// Time O(n) | Space O(n)
```

### LC 84 — Largest Rectangle in Histogram

```java
class Solution {
    public int largestRectangleArea(int[] heights) {
        int n = heights.length;
        Deque<Integer> stack = new ArrayDeque<>();
        int maxArea = 0;

        for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];
            while (!stack.isEmpty() && heights[stack.peek()] > h) {
                int idx = stack.pop();
                int width = stack.isEmpty() ? i : i - stack.peek() - 1;
                maxArea = Math.max(maxArea, heights[idx] * width);
            }
            stack.push(i);
        }
        return maxArea;
    }
}
// Sentinel h=0 at i=n forces all remaining bars to pop.
// On pop: right boundary = i, left boundary = stack.peek() (or -1 if empty).
// Time O(n) | Space O(n)
```

### LC 85 — Maximal Rectangle

```java
class Solution {
    public int maximalRectangle(char[][] matrix) {
        if (matrix.length == 0 || matrix[0].length == 0) return 0;
        int cols = matrix[0].length;
        int[] heights = new int[cols];
        int maxArea = 0;

        for (char[] row : matrix) {
            for (int j = 0; j < cols; j++) {
                heights[j] = row[j] == '1' ? heights[j] + 1 : 0;
            }
            maxArea = Math.max(maxArea, largestRectangleArea(heights));
        }
        return maxArea;
    }

    private int largestRectangleArea(int[] heights) {
        int n = heights.length;
        Deque<Integer> stack = new ArrayDeque<>();
        int maxArea = 0;

        for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];
            while (!stack.isEmpty() && heights[stack.peek()] > h) {
                int idx = stack.pop();
                int width = stack.isEmpty() ? i : i - stack.peek() - 1;
                maxArea = Math.max(maxArea, heights[idx] * width);
            }
            stack.push(i);
        }
        return maxArea;
    }
}
// Row i histogram: heights[j] = consecutive 1's above (including row i).
// Reset to 0 on '0'. Run LC 84 per row.
// Time O(rows × cols) | Space O(cols)
```

### LC 42 — Trapping Rain Water (Stack Approach)

```java
class Solution {
    public int trap(int[] height) {
        Deque<Integer> stack = new ArrayDeque<>();
        int water = 0;

        for (int i = 0; i < height.length; i++) {
            while (!stack.isEmpty() && height[stack.peek()] < height[i]) {
                int floor = stack.pop();
                if (stack.isEmpty()) break;
                int left = stack.peek();
                int w = i - left - 1;
                int h = Math.min(height[left], height[i]) - height[floor];
                water += w * h;
            }
            stack.push(i);
        }
        return water;
    }
}
// Decreasing stack. On pop: popped bar is the FLOOR of a valley.
// Left wall = new stack top. Right wall = current index.
// Water in this layer = (min wall height - floor height) × width.
// Time O(n) | Space O(n)
```

### LC 901 — Online Stock Span

```java
class StockSpanner {
    private Deque<int[]> stack; // [price, span]

    public StockSpanner() {
        stack = new ArrayDeque<>();
    }

    public int next(int price) {
        int span = 1;
        while (!stack.isEmpty() && stack.peek()[0] <= price) {
            span += stack.pop()[1];
        }
        stack.push(new int[]{price, span});
        return span;
    }
}
// Decreasing stack storing (price, accumulated span).
// Pop ≤ prices and absorb their spans. Push (price, totalSpan).
// Amortized O(1) per call | Space O(n) worst case
```

### LC 402 — Remove K Digits

```java
class Solution {
    public String removeKdigits(String num, int k) {
        if (num.length() <= k) return "0";

        StringBuilder stack = new StringBuilder();
        for (char c : num.toCharArray()) {
            while (k > 0 && stack.length() > 0 
                   && stack.charAt(stack.length() - 1) > c) {
                stack.setLength(stack.length() - 1);
                k--;
            }
            if (stack.length() > 0 || c != '0') {
                stack.append(c);
            }
        }

        while (k-- > 0 && stack.length() > 0) {
            stack.setLength(stack.length() - 1);
        }

        return stack.length() == 0 ? "0" : stack.toString();
    }
}
// Increasing stack: pop larger preceding digits when smaller digit arrives.
// Skip leading zeros. If k remains, trim from end (already increasing).
// Time O(n) | Space O(n)
```

### LC 316 — Remove Duplicate Letters

```java
class Solution {
    public String removeDuplicateLetters(String s) {
        int[] freq = new int[26];
        boolean[] inStack = new boolean[26];
        for (char c : s.toCharArray()) freq[c - 'a']++;

        StringBuilder stack = new StringBuilder();
        for (char c : s.toCharArray()) {
            freq[c - 'a']--;
            if (inStack[c - 'a']) continue;

            while (stack.length() > 0 
                   && stack.charAt(stack.length() - 1) > c
                   && freq[stack.charAt(stack.length() - 1) - 'a'] > 0) {
                inStack[stack.charAt(stack.length() - 1) - 'a'] = false;
                stack.setLength(stack.length() - 1);
            }
            stack.append(c);
            inStack[c - 'a'] = true;
        }
        return stack.toString();
    }
}
// Increasing stack + two extra constraints vs Remove K Digits:
//   1. Each letter appears exactly once in result (inStack check)
//   2. Only pop if the letter appears again later (freq > 0 check)
// Time O(n) | Space O(1) — stack holds at most 26 characters
```
