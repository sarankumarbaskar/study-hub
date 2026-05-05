# Two Pointers — Interview Execution Playbook

> **Pattern Mastery Level:** This is the #1 gateway pattern. If you can't instantly recognize and execute two pointers in under 10 minutes, you're not interview-ready. It appears in ~15% of FAANG coding rounds.

---

## 1. Pattern Recognition Signals

### When to Use Two Pointers

```
INSTANT TRIGGERS (say "two pointers" within 5 seconds):
  ✓ "Sorted array" + "find pair/triplet with target sum"
  ✓ "In-place" + "remove/deduplicate" + "O(1) space"
  ✓ "Palindrome" + "string/array"
  ✓ "Merge two sorted arrays"
  ✓ "Container/trap water" + "height array"
  ✓ "Partition array into groups" (Dutch flag)
```

### Keywords in Problem Statements

```
DIRECT SIGNALS:          INDIRECT SIGNALS:
  "sorted array"           "without extra space"
  "find two numbers"       "in-place"
  "pair that sums to"      "minimum/maximum window"
  "palindrome"             "merge two arrays"
  "remove duplicates"      "partition"
  "closest to target"      "move all X to end"
```

### When NOT to Use

```
✗ Unsorted array + need to find pairs → use HASHING (O(n) vs O(n log n) for sort)
✗ Subarray sum on unsorted data → use PREFIX SUM or SLIDING WINDOW
✗ Need to find ALL pairs (not just existence) → may still need O(n²)
✗ Non-linear relationship between pointer movement and result → won't converge correctly
```

---

## 2. Thinking Framework (Step-by-Step Intuition)

### The 60-Second Decision Process

```
Step 1: "Can I sort the input?" (or is it already sorted?)
  YES → Two pointers likely works
  NO  → Check if comparing from both ends makes sense (palindrome, container)

Step 2: "What's the brute force?"
  Usually O(n²) nested loops checking all pairs
  
Step 3: "Why can I skip pairs?"
  In a SORTED array: if sum too small → moving left pointer right ONLY increases sum
                     if sum too big → moving right pointer left ONLY decreases sum
  This monotonic property lets us eliminate half the search space with each comparison

Step 4: "Which variant do I need?"
  Finding pair/triplet → CONVERGING (opposite ends)
  In-place removal/filter → SAME-DIRECTION (read/write)
  3Sum/4Sum → FIXED + CONVERGING (outer loop + inner two pointers)
  Partition into groups → THREE-WAY (Dutch flag)
```

### The Core Insight (Memorize This)

```
TWO POINTERS WORKS BECAUSE:
  Sorted data creates a MONOTONIC relationship between pointer position and value.
  Moving left pointer right → value increases (or stays same)
  Moving right pointer left → value decreases (or stays same)
  
  This means: once we determine "sum too small", we KNOW that keeping left
  where it is and moving right further left will only make it worse.
  So we can safely skip ALL those pairs → O(n) instead of O(n²).
```

---

## 3. Java Templates (Production-Quality)

### Template 1: Converging Pointers (Pair Finding)

```java
// USE FOR: Two Sum II, Container With Most Water, Valid Palindrome
// TIME: O(n) | SPACE: O(1)
public int[] convergingPointers(int[] arr, int target) {
    int lo = 0, hi = arr.length - 1;
    while (lo < hi) {
        int sum = arr[lo] + arr[hi];
        if (sum == target) return new int[]{lo, hi};
        if (sum < target) lo++;
        else hi--;
    }
    return new int[]{-1, -1};
}
```

### Template 2: Same-Direction (In-Place Filter)

```java
// USE FOR: Remove Duplicates, Move Zeroes, Remove Element
// TIME: O(n) | SPACE: O(1)
public int filterInPlace(int[] arr) {
    int w = 0; // write pointer
    for (int r = 0; r < arr.length; r++) { // read pointer
        if (shouldKeep(arr, r, w)) {
            arr[w++] = arr[r];
        }
    }
    return w; // new length
}
```

### Template 3: kSum (Generalized)

```java
// USE FOR: 3Sum, 4Sum, kSum — O(n^(k-1))
// Sort first. Fix outer elements, two-pointer on inner pair.
public List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> res = new ArrayList<>();
    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue; // skip duplicates
        int lo = i + 1, hi = nums.length - 1;
        int target = -nums[i];
        while (lo < hi) {
            int sum = nums[lo] + nums[hi];
            if (sum == target) {
                res.add(List.of(nums[i], nums[lo], nums[hi]));
                while (lo < hi && nums[lo] == nums[lo + 1]) lo++; // skip dupes
                while (lo < hi && nums[hi] == nums[hi - 1]) hi--;
                lo++; hi--;
            } else if (sum < target) lo++;
            else hi--;
        }
    }
    return res;
}
```

### Template 4: Dutch National Flag (Three-Way Partition)

```java
// USE FOR: Sort Colors, Partition around pivot
// TIME: O(n) | SPACE: O(1)
public void threeWayPartition(int[] arr) {
    int lo = 0, mid = 0, hi = arr.length - 1;
    while (mid <= hi) {
        if (arr[mid] == 0) swap(arr, lo++, mid++);
        else if (arr[mid] == 2) swap(arr, mid, hi--); // DON'T advance mid!
        else mid++;
    }
}
```

---

## 4. Edge Case Checklist

```
INPUT EDGE CASES:
  □ Empty array (length 0) → return empty/0
  □ Single element → can't form a pair
  □ Two elements → exactly one comparison
  □ All same elements → duplicate handling critical
  □ All negative numbers → sum comparisons still work
  □ Integer overflow → use long for sum in 4Sum (target - a - b can overflow)

POINTER EDGE CASES:
  □ lo < hi (strict) vs lo <= hi → use < when pointers must not cross
  □ Off-by-one on boundaries (lo = i+1, not lo = i)
  □ Duplicate skipping: while (lo < hi && nums[lo] == nums[lo+1]) → bounds check first!

PATTERN-SPECIFIC:
  □ 3Sum: i > 0 check before skipping duplicate i (not i >= 0)
  □ Merge Sorted Array: merge from END to avoid overwriting
  □ Sort Colors: DON'T advance mid after swapping with hi (new value needs check)
  □ Trapping Rain Water: compare height[lo] vs height[hi], not leftMax vs rightMax
  □ Palindrome: skip non-alphanumeric BEFORE comparing
```

---

## 5. Problem Progression (LeetCode)

### Level 1: Easy — Pattern Recognition

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 167 | [Two Sum II](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) | Sorted → converging pointers, sum too small = move left | O(n) |
| 125 | [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/) | Skip non-alphanumeric, compare from both ends | O(n) |
| 88 | [Merge Sorted Array](https://leetcode.com/problems/merge-sorted-array/) | Merge from END to avoid overwriting | O(m+n) |
| 283 | [Move Zeroes](https://leetcode.com/problems/move-zeroes/) | Same-direction: write pointer for non-zeros | O(n) |

### Level 2: Standard Medium

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 15 | [3Sum](https://leetcode.com/problems/3sum/) | Sort + fix one + two pointers + skip duplicates | O(n²) |
| 11 | [Container With Most Water](https://leetcode.com/problems/container-with-most-water/) | Move the SHORTER side inward (only way to improve) | O(n) |
| 80 | [Remove Duplicates II](https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/) | Compare with nums[write-2] for "at most 2" rule | O(n) |

### Level 3: Tricky Medium

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 75 | [Sort Colors](https://leetcode.com/problems/sort-colors/) | Dutch flag: DON'T advance mid after swap with hi | O(n) |
| 16 | [3Sum Closest](https://leetcode.com/problems/3sum-closest/) | Track min abs diff, no duplicate skipping needed | O(n²) |
| 881 | [Boats to Save People](https://leetcode.com/problems/boats-to-save-people/) | Sort + pair heaviest with lightest | O(n log n) |

### Level 4: Hard — FAANG Interview Level

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 42 | [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/) | Converging + leftMax/rightMax: process side with smaller max | O(n) |
| 18 | [4Sum](https://leetcode.com/problems/4sum/) | Two outer loops + two pointers + long for overflow | O(n³) |
| 76 | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | Two pointers as sliding window (expand/contract) | O(n) |

### Solving Order for Maximum Learning

```
Day 1: 167 → 125 → 88 (build muscle memory for the templates)
Day 2: 15 → 11 (learn the "fix one + two pointers" reduction)
Day 3: 75 → 80 (master same-direction and three-way partition)
Day 4: 42 → 16 → 18 (hard problems — combine multiple sub-patterns)
Day 5: Re-solve Day 1-2 problems WITHOUT looking at notes (test recall)
```

---

## 6. Common Mistakes & Interview Traps

### Mistake 1: Using Two Pointers on Unsorted Data

```
WRONG: "Find two numbers that sum to target" on unsorted array
  Two pointers needs monotonic property → needs sorted data
  Sorting costs O(n log n) → if you need O(n), use a HashMap instead

INTERVIEWER TEST: they give you unsorted data and ask for two-sum
  CORRECT: "The optimal approach is hashing in O(n). Two pointers would
  require sorting first, making it O(n log n), which is suboptimal here."
```

### Mistake 2: Forgetting Duplicate Handling in 3Sum

```
WRONG output for [-1,-1,-1,0,0,1,1,2]:
  [[-1,-1,2],[-1,0,1],[-1,0,1],[-1,-1,2]]  ← DUPLICATES!

The THREE places you must skip duplicates:
  1. Outer loop: if (i > 0 && nums[i] == nums[i-1]) continue;
  2. Left pointer: while (lo < hi && nums[lo] == nums[lo+1]) lo++;
  3. Right pointer: while (lo < hi && nums[hi] == nums[hi-1]) hi--;

Interviewers specifically test this. If your 3Sum produces duplicates, it's a FAIL.
```

### Mistake 3: Integer Overflow in 4Sum

```
WRONG: int remaining = target - nums[i] - nums[j];
  If target = -2^31 and nums[i] = 1, nums[j] = 1: -2^31 - 1 - 1 = OVERFLOW!

CORRECT: long remaining = (long) target - nums[i] - nums[j];
  Cast to long BEFORE subtraction

Interviewers LOVE this edge case. Test with extreme values.
```

### Mistake 4: Not Advancing Mid After Hi Swap (Sort Colors)

```
WRONG:
  if (arr[mid] == 2) { swap(arr, mid, hi--); mid++; }  // BUG!
  
  After swapping with hi, the NEW value at mid might be 0 or 2
  You need to check it again → DON'T advance mid

CORRECT:
  if (arr[mid] == 2) { swap(arr, mid, hi--); }  // mid stays
```

### What Interviewers Actually Look For

```
JUNIOR:    Can write the basic two-pointer loop
SENIOR:    Handles duplicates, edge cases, overflow without prompting
STAFF:     Immediately identifies the sub-pattern (converging vs same-direction vs k-sum),
           discusses time/space trade-offs, mentions when hashing is better
```

---

## 7. Interview Strategy

### Target Solving Times

```
Easy (Two Sum II, Palindrome):     5-8 minutes (including explanation)
Medium (3Sum, Container):          10-15 minutes
Hard (Trapping Rain Water, 4Sum):  15-20 minutes

If you're taking longer than these, you haven't internalized the templates.
```

### How to Explain Your Approach (Script)

```
STEP 1 (30 seconds): State the brute force
  "The brute force is O(n²) — check all pairs with nested loops."

STEP 2 (30 seconds): Identify why we can do better
  "Since the array is sorted, I can use two pointers.
   If the sum is too small, moving the left pointer right increases it.
   If too large, moving the right pointer left decreases it.
   This gives us O(n) time and O(1) space."

STEP 3 (15 seconds): Confirm edge cases
  "I'll handle empty arrays, single elements, and duplicate values."

STEP 4: Code (5-10 minutes)

STEP 5 (30 seconds): Walk through an example
  "For [1,3,5,7] with target 8: lo=1,hi=7→sum=8→found. For target 6: lo=1,hi=7→8>6→hi--,
   lo=1,hi=5→6=6→found."
```

### Follow-Up Questions Interviewers Ask

```
Q: "Can you do it without sorting?"
A: "Yes, using a HashMap for O(n) time, but it uses O(n) space.
    Two pointers gives O(1) space but needs O(n log n) for sorting."

Q: "What if there are duplicates?"
A: "I skip duplicates by checking if the current value equals the previous one
    before processing. This prevents duplicate triplets in the result."

Q: "What if the array has millions of elements?"
A: "Two pointers is ideal — O(n) time and O(1) space. No extra memory allocation.
    For 3Sum on very large arrays, the O(n²) is unavoidable but the constant is small."

Q: "Can you solve Trapping Rain Water in O(1) space?"
A: "Yes — instead of precomputing leftMax/rightMax arrays, I use converging pointers.
    The side with the smaller max is the bottleneck, so I process that side and advance."
```

---

## 8. Revision Strategy

### Weekly Revision Plan

```
WEEK 1: Solve all 11 problems from scratch. Time yourself.
WEEK 2: Re-solve only the ones you couldn't do in target time.
WEEK 3: Solve 3Sum and Trapping Rain Water from memory (no notes).
WEEK 4: Mix with other patterns (sliding window, binary search) to practice pattern selection.
```

### What to Memorize vs Understand

```
MEMORIZE:
  ✓ The 4 templates (converging, same-direction, kSum, Dutch flag)
  ✓ The duplicate-skipping pattern for kSum
  ✓ "Merge from END" for Merge Sorted Array
  ✓ "DON'T advance mid after hi swap" for Sort Colors

UNDERSTAND (don't memorize — derive each time):
  ✓ WHY two pointers works (monotonic property of sorted data)
  ✓ WHY we move the shorter side in Container With Most Water
  ✓ WHY we process the smaller-max side in Trapping Rain Water
  ✓ HOW to reduce 3Sum to Two Sum II (fix one, search remaining)
```

### Signals That Indicate Mastery

```
□ You see "sorted array + pair" and IMMEDIATELY think "two pointers" (< 5 seconds)
□ You can write 3Sum with duplicate handling in under 8 minutes without looking at anything
□ You can solve Trapping Rain Water (O(1) space) and explain WHY it works
□ You can articulate when hashing is better than two pointers (and vice versa)
□ You can extend 3Sum to 4Sum to kSum without rethinking the approach
□ You never get integer overflow bugs in kSum problems
```

---

## Quick Reference Card (Print This)

```
PATTERN              TEMPLATE                         TIME    SPACE
─────────────────────────────────────────────────────────────────────
Pair in sorted       lo=0, hi=n-1, converge           O(n)    O(1)
In-place filter      w=0, for r: if keep → arr[w++]   O(n)    O(1)
3Sum                 sort + fix i + two-pointer        O(n²)   O(1)
4Sum                 sort + fix i,j + two-pointer      O(n³)   O(1)
Partition (3-way)    lo, mid, hi (Dutch flag)          O(n)    O(1)
Palindrome           lo=0, hi=n-1, compare inward     O(n)    O(1)
Merge sorted         i=m-1, j=n-1, k=m+n-1 (from end) O(m+n) O(1)
Trap water           lo,hi + leftMax,rightMax          O(n)    O(1)

DECISION: sorted + pairs → CONVERGING | in-place → SAME-DIR | unsorted → HASH
```
