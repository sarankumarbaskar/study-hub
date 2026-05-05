# Sliding Window — Interview Execution Playbook

> **Pattern Mastery Level:** The second most common pattern in FAANG interviews (~20% of problems). If Two Pointers is about pairs, Sliding Window is about subarrays/substrings. Master both and you cover ~35% of coding interviews.

---

## 1. Pattern Recognition Signals

### When to Use Sliding Window

```
INSTANT TRIGGERS (say "sliding window" within 5 seconds):
  ✓ "Longest/shortest CONTIGUOUS subarray/substring satisfying X"
  ✓ "Maximum sum of K consecutive elements"
  ✓ "Subarray/substring with at most K distinct characters"
  ✓ "Minimum window containing all characters of T"
  ✓ "Count of subarrays with exactly K something"
  ✓ Any constraint on a CONTIGUOUS range that can be maintained incrementally
```

### Keywords in Problem Statements

```
DIRECT SIGNALS:              INDIRECT SIGNALS:
  "contiguous subarray"        "without repeating"
  "substring"                  "at most K"
  "consecutive elements"       "exactly K" (= atMost(K) - atMost(K-1))
  "window of size K"           "minimum length"
  "longest/shortest"           "maximum sum"
```

### When NOT to Use

```
✗ SUBSEQUENCE (not contiguous) → use DP or two pointers
✗ Need ALL subarrays enumerated → brute force O(n²) may be unavoidable
✗ Elements can be skipped/reordered → not a sliding window
✗ Condition involves non-adjacent elements → different pattern
✗ Array is not 1D → may need 2D DP
```

### Two Flavors — Fixed vs Variable

```
FIXED-SIZE WINDOW:
  "Maximum average of any subarray of size k"
  "Find all anagrams of pattern in string"
  Window size is GIVEN. Slide by adding right, removing left.

VARIABLE-SIZE WINDOW:
  "Longest substring without repeating characters"
  "Minimum window substring"
  Window size changes. EXPAND right to explore, SHRINK left to satisfy constraint.
```

---

## 2. Thinking Framework

### The 60-Second Decision Process

```
Step 1: "Is this about a CONTIGUOUS subarray or substring?"
  YES → sliding window candidate
  NO  → try DP, hashing, or other patterns

Step 2: "Is the window size fixed or variable?"
  FIXED  → simpler: add right element, remove left element, slide
  VARIABLE → expand right to explore, shrink left when constraint violated

Step 3: "What do I track inside the window?"
  Sum problems: running sum (add right, subtract left)
  Character problems: frequency map (increment right, decrement left)
  Distinct count: count of non-zero entries in frequency map
  Max/min in window: monotonic deque (separate pattern, covered in 07)

Step 4: "When do I shrink the window?"
  FIXED: always (maintain size k)
  VARIABLE: when the window VIOLATES the constraint
    "at most K distinct" → shrink when distinct > K
    "sum ≤ target" → shrink when sum > target

Step 5: "When do I record the answer?"
  FIXED: after every slide (window always valid)
  VARIABLE: every time the window is VALID (after potential shrink)
    For "longest": update answer when window is valid
    For "shortest": update answer when constraint is first satisfied
```

### The Core Insight

```
SLIDING WINDOW WORKS BECAUSE:
  Adding an element to the right ONLY expands the window.
  Removing an element from the left ONLY shrinks it.
  The window's properties can be UPDATED incrementally (O(1) per step)
  instead of RECOMPUTED from scratch (O(k) per step).
  
  Total: n expansions + at most n contractions = O(n) total work.
  Each element enters the window once (right pointer) and leaves once (left pointer).
```

---

## 3. Java Templates (Production-Quality)

### Template 1: Fixed-Size Window

```java
// USE FOR: Max sum of k elements, find anagrams, averages
// TIME: O(n) | SPACE: O(1) or O(k)
public int fixedWindow(int[] arr, int k) {
    int windowSum = 0, maxSum = Integer.MIN_VALUE;
    for (int i = 0; i < arr.length; i++) {
        windowSum += arr[i];                    // expand: add right
        if (i >= k) windowSum -= arr[i - k];    // shrink: remove left
        if (i >= k - 1) maxSum = Math.max(maxSum, windowSum); // record
    }
    return maxSum;
}
```

### Template 2: Variable-Size — Longest Valid Window

```java
// USE FOR: Longest substring without repeating, longest subarray with sum ≤ k
// TIME: O(n) | SPACE: O(k) for map
public int longestWindow(String s) {
    Map<Character, Integer> freq = new HashMap<>();
    int left = 0, maxLen = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        freq.merge(c, 1, Integer::sum);         // expand: add right
        
        while (/* window is INVALID */) {       // shrink from left
            char lc = s.charAt(left);
            freq.merge(lc, -1, Integer::sum);
            if (freq.get(lc) == 0) freq.remove(lc);
            left++;
        }
        maxLen = Math.max(maxLen, right - left + 1); // window is valid → record
    }
    return maxLen;
}
```

### Template 3: Variable-Size — Shortest Valid Window

```java
// USE FOR: Minimum window substring, shortest subarray with sum ≥ k
// TIME: O(n) | SPACE: O(k)
public int shortestWindow(int[] arr, int target) {
    int left = 0, sum = 0, minLen = Integer.MAX_VALUE;
    for (int right = 0; right < arr.length; right++) {
        sum += arr[right];                       // expand
        
        while (sum >= target) {                  // window SATISFIES constraint
            minLen = Math.min(minLen, right - left + 1); // record BEFORE shrink
            sum -= arr[left++];                  // shrink to find shorter
        }
    }
    return minLen == Integer.MAX_VALUE ? 0 : minLen;
}
```

### Template 4: Exactly K = atMost(K) - atMost(K-1)

```java
// USE FOR: Subarrays with Exactly K Distinct Integers
// TRICK: exactly(K) = atMost(K) - atMost(K-1)
public int subarraysWithExactlyK(int[] arr, int k) {
    return atMostK(arr, k) - atMostK(arr, k - 1);
}

private int atMostK(int[] arr, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    int left = 0, count = 0;
    for (int right = 0; right < arr.length; right++) {
        freq.merge(arr[right], 1, Integer::sum);
        while (freq.size() > k) {
            freq.merge(arr[left], -1, Integer::sum);
            if (freq.get(arr[left]) == 0) freq.remove(arr[left]);
            left++;
        }
        count += right - left + 1; // all subarrays ending at right with ≤ k distinct
    }
    return count;
}
```

---

## 4. Edge Case Checklist

```
□ Empty string/array → return 0
□ k > array length (fixed window) → return -1 or handle
□ k = 0 → "at most 0 distinct" = 0 or empty window
□ All same characters → entire string is one window
□ All unique characters → may need to shrink to size 1
□ Negative numbers in sum problems → can't shrink greedily! Use prefix sum instead
□ Single character string → valid palindrome, valid window
□ k = 1 → longest substring of same character
□ Window becomes empty (left > right) → reset, don't go negative
```

---

## 5. Problem Progression (LeetCode)

### Level 1: Easy — Fixed Window

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 643 | [Max Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/) | Fixed window, track sum | O(n) |
| 219 | [Contains Duplicate II](https://leetcode.com/problems/contains-duplicate-ii/) | Fixed window with HashSet | O(n) |

### Level 2: Standard Medium

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 3 | [Longest Substring Without Repeating](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | Variable window + freq map, shrink when duplicate | O(n) |
| 209 | [Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/) | Variable window, shrink when sum ≥ target | O(n) |
| 424 | [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/) | Window valid when len - maxFreq ≤ k | O(n) |

### Level 3: Tricky Medium

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 438 | [Find All Anagrams](https://leetcode.com/problems/find-all-anagrams-in-a-string/) | Fixed window, compare freq arrays | O(n) |
| 567 | [Permutation in String](https://leetcode.com/problems/permutation-in-string/) | Same as anagrams with boolean return | O(n) |
| 904 | [Fruit Into Baskets](https://leetcode.com/problems/fruit-into-baskets/) | Longest subarray with ≤ 2 distinct | O(n) |
| 992 | [Subarrays with K Distinct](https://leetcode.com/problems/subarrays-with-k-different-integers/) | exactly(K) = atMost(K) - atMost(K-1) | O(n) |

### Level 4: Hard — FAANG Level

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 76 | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | Variable window, track "formed" vs "required" characters | O(n) |
| 239 | [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) | Monotonic deque (decreasing) for O(1) max in window | O(n) |
| 30 | [Substring with Concatenation](https://leetcode.com/problems/substring-with-concatenation-of-all-words/) | Fixed window with word-level hashing | O(n*m) |

### Solving Order

```
Day 1: 643 → 3 → 209 (fixed then variable, build intuition)
Day 2: 424 → 438 → 567 (character frequency problems)
Day 3: 76 → 904 → 992 (hard variable window + the atMost trick)
Day 4: 239 (monotonic deque — crossover with Pattern 07)
Day 5: Re-solve 3, 76, 992 without notes
```

---

## 6. Common Mistakes & Interview Traps

### Mistake 1: Using Sliding Window with Negative Numbers

```
WRONG: "Find shortest subarray with sum ≥ target" with negatives
  Sliding window assumes: adding elements INCREASES sum, removing DECREASES.
  With negatives: adding might decrease! Shrinking might increase!
  The monotonic property BREAKS → window won't converge.

CORRECT: Use prefix sum + monotonic deque for negatives.
```

### Mistake 2: Shrinking Too Late or Too Early

```
LONGEST: shrink when window is INVALID → record AFTER shrinking (window is valid)
SHORTEST: shrink when window is VALID → record BEFORE shrinking (capture smallest)

Getting this wrong gives wrong answers that PASS most test cases but fail edge cases.
```

### Mistake 3: Off-by-One in Window Size

```
Window [left, right] has size (right - left + 1), NOT (right - left).
Fixed window of size k: process when (i >= k - 1), NOT (i >= k).
```

### Mistake 4: Not Knowing the "Exactly K" Trick

```
"Count subarrays with exactly K distinct integers"
  Can't do this with a single sliding window!
  TRICK: exactly(K) = atMost(K) - atMost(K-1)
  
  Interviewers LOVE this. If you don't know the trick, you'll waste 20 minutes.
```

---

## 7. Interview Strategy

### Target Solving Times

```
Easy (fixed window):               5-7 minutes
Medium (variable window):          8-12 minutes
Hard (min window substring):       12-18 minutes
```

### How to Explain

```
"This is a sliding window problem because we need the [longest/shortest] CONTIGUOUS
[subarray/substring] satisfying [constraint]. I'll maintain a window with left and
right pointers. I expand right to explore, and shrink left when [constraint violated].
I track [sum/freq map/count] incrementally. Time is O(n) because each element enters
and leaves the window at most once."
```

### Follow-Up Questions

```
Q: "What if the array has negative numbers?"
A: "Sliding window won't work because adding elements can decrease the sum.
    I'd use prefix sum + monotonic deque instead."

Q: "Can you do it in O(1) space?"
A: "For character problems: yes, use int[128] array instead of HashMap.
    For general cases: the frequency map is bounded by the alphabet size."

Q: "What about exactly K distinct?"
A: "I'd decompose it: exactly(K) = atMost(K) - atMost(K-1).
    Each atMost is a standard sliding window. Total: O(n)."
```

---

## 8. Revision Strategy

### What to Memorize

```
✓ The 4 templates (fixed, longest, shortest, exactly-K)
✓ "Longest = shrink when INVALID, record after shrink"
✓ "Shortest = shrink when VALID, record before shrink"
✓ "exactly(K) = atMost(K) - atMost(K-1)"
✓ "Negative numbers break sliding window → use prefix sum"
```

### Mastery Signals

```
□ You write Minimum Window Substring in 12 minutes, correct on first run
□ You immediately say "exactly K = atMost trick" when you see the problem
□ You know when to use sliding window vs prefix sum vs two pointers
□ You can explain why each element enters/leaves at most once → O(n)
```

---

## Quick Reference Card

```
TYPE              TEMPLATE SHAPE                         RECORD WHEN
────────────────────────────────────────────────────────────────────────
Fixed-size        for r: add right, if r≥k: remove left  every step after k
Longest valid     for r: add right, while INVALID: shrink  after while (valid)
Shortest valid    for r: add right, while VALID: record+shrink  inside while
Count exactly K   atMost(K) - atMost(K-1)                 sum of (r-l+1)

DECISION: contiguous + constraint → SLIDING WINDOW
          contiguous + negatives → PREFIX SUM
          pairs in sorted → TWO POINTERS
```
