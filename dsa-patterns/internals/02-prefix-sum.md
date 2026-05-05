# Prefix Sum — Interview Execution Playbook

> **Pattern Mastery Level:** Prefix sum is the backbone of subarray problems. If you can't see "prefix[right+1] - prefix[left]" within 10 seconds of reading a range-sum problem, you're leaving easy points on the table. It appears in ~12% of FAANG coding rounds, often disguised as "subarray count" or "range query" problems.

---

## 1. Pattern Recognition Signals

### When to Use Prefix Sum

```
INSTANT TRIGGERS (say "prefix sum" within 5 seconds):
  ✓ "Range sum query" or "sum of subarray from i to j"
  ✓ "Count subarrays with sum equal to K"
  ✓ "Subarray sum divisible by K"
  ✓ "Product of array except self" (prefix × suffix product)
  ✓ "Equal number of 0s and 1s" (transform 0→-1, then sum=0)
  ✓ "2D rectangle sum query" on a matrix
```

### Keywords in Problem Statements

```
DIRECT SIGNALS:          INDIRECT SIGNALS:
  "range sum"              "subarray"
  "cumulative sum"         "contiguous"
  "sum between i and j"    "divisible by K"
  "prefix"                 "equal number of X and Y"
  "running sum"            "product except self"
  "immutable" + "query"    "balance point / pivot"
```

### When NOT to Use

```
✗ Array is being MODIFIED between queries → use Fenwick Tree or Segment Tree
✗ Need minimum/maximum of subarray (not sum) → use Monotonic Stack / Sparse Table
✗ Sliding window of FIXED size with simple aggregate → plain sliding window is simpler
✗ Need actual subarray elements (not just sum) → prefix sum only gives aggregate
✗ Single query on a single subarray → just iterate, no need to precompute
```

---

## 2. Thinking Framework (Step-by-Step Intuition)

### The 60-Second Decision Process

```
Step 1: "Does the problem ask about SUMS of SUBARRAYS or ranges?"
  YES → Prefix sum is almost certainly involved
  NO  → Check if you can TRANSFORM the problem into one about sums
        (e.g., equal 0s and 1s → replace 0 with -1 → subarray sum = 0)

Step 2: "What's the brute force?"
  Usually O(n²): for each pair (i,j), compute sum of arr[i..j]
  
Step 3: "Where's the bottleneck?"
  Recomputing sums from scratch for every (i,j) pair
  Prefix sum precomputes ALL cumulative sums in O(n), then any range in O(1)

Step 4: "Do I need to COUNT subarrays or just QUERY ranges?"
  QUERY ranges → Basic prefix array, answer in O(1)
  COUNT subarrays with sum=K → Prefix sum + HashMap
  COUNT subarrays with sum divisible by K → Prefix sum mod K + HashMap/array
  2D matrix sums → 2D prefix sum with inclusion-exclusion
```

### The Core Insight (Memorize This)

```
PREFIX SUM WORKS BECAUSE:
  prefix[i] = arr[0] + arr[1] + ... + arr[i-1]
  
  Sum of arr[left..right] = prefix[right+1] - prefix[left]
  
  One subtraction replaces an entire loop. Build once in O(n), query forever in O(1).

  For "count subarrays with sum = K":
    prefix[j] - prefix[i] = K  →  prefix[i] = prefix[j] - K
    So at each j, ask: "how many earlier prefix sums equal prefix[j] - K?"
    A HashMap answers that in O(1).

KEY IDENTITY:
  "exactly K" = atMost(K) - atMost(K-1)
  Use this trick when "exactly K" is hard but "at most K" is easy.
```

---

## 3. Java Templates (Production-Quality)

### Template 1: Basic Prefix Sum Array

```java
// USE FOR: Range Sum Query, Pivot Index, any repeated range-sum queries
// TIME: O(n) build, O(1) per query | SPACE: O(n)
public int[] buildPrefixSum(int[] nums) {
    int n = nums.length;
    int[] prefix = new int[n + 1]; // prefix[0] = 0 (empty prefix)
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + nums[i];
    }
    return prefix;
    // Sum of nums[left..right] = prefix[right + 1] - prefix[left]
}
```

### Template 2: Range Sum Queries (LC 303)

```java
// USE FOR: NumArray / Range Sum Query — Immutable
// TIME: O(n) constructor, O(1) per query | SPACE: O(n)
class NumArray {
    private int[] prefix;

    public NumArray(int[] nums) {
        prefix = new int[nums.length + 1];
        for (int i = 0; i < nums.length; i++) {
            prefix[i + 1] = prefix[i] + nums[i];
        }
    }

    public int sumRange(int left, int right) {
        return prefix[right + 1] - prefix[left];
    }
}
```

### Template 3: Subarray Sum Equals K (Prefix Sum + HashMap)

```java
// USE FOR: Subarray Sum Equals K, Contiguous Array, Subarrays Divisible by K
// TIME: O(n) | SPACE: O(n)
public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1); // empty prefix has sum 0
    int count = 0, prefixSum = 0;
    for (int num : nums) {
        prefixSum += num;
        // How many earlier prefixes satisfy: prefixSum - earlier = k?
        count += prefixCount.getOrDefault(prefixSum - k, 0);
        prefixCount.merge(prefixSum, 1, Integer::sum);
    }
    return count;
}
```

### Template 4: 2D Prefix Sum (Matrix Region Sum)

```java
// USE FOR: 304 Range Sum Query 2D, 1074 Submatrices That Sum to Target
// TIME: O(m*n) build, O(1) per query | SPACE: O(m*n)
class NumMatrix {
    private int[][] prefix;

    public NumMatrix(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        prefix = new int[m + 1][n + 1];
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                prefix[i + 1][j + 1] = matrix[i][j]
                    + prefix[i][j + 1]
                    + prefix[i + 1][j]
                    - prefix[i][j]; // inclusion-exclusion
            }
        }
    }

    // Sum of rectangle (r1,c1) to (r2,c2) inclusive
    public int sumRegion(int r1, int c1, int r2, int c2) {
        return prefix[r2 + 1][c2 + 1]
             - prefix[r1][c2 + 1]
             - prefix[r2 + 1][c1]
             + prefix[r1][c1]; // inclusion-exclusion
    }
}
```

---

## 4. Edge Case Checklist

```
INPUT EDGE CASES:
  □ Empty array (length 0) → return 0 / empty
  □ Single element → subarray is just that element; prefix = [0, nums[0]]
  □ All zeros → every subarray sums to 0; count subarrays = n*(n+1)/2 when k=0
  □ All negative numbers → prefix sum decreases; HashMap approach still works
  □ k = 0 → "subarray sum = 0" has valid answers; don't skip this case

OVERFLOW RISKS:
  □ Large n with large values → prefix sums can overflow int
     Use long[] for prefix when nums[i] up to 10^5 and n up to 10^5 (sum up to 10^10)
  □ Product prefix → even faster overflow; consider log-transform or BigInteger

PREFIX SUM SPECIFIC:
  □ prefix[0] = 0 → must initialize; represents empty subarray before index 0
  □ Off-by-one: sum of nums[left..right] = prefix[right+1] - prefix[left], NOT prefix[right] - prefix[left]
  □ HashMap must start with put(0, 1) → the empty prefix appears once
  □ Negative mod in Java: (-5 % 3) = -2, NOT 1 → use ((x % k) + k) % k

2D SPECIFIC:
  □ Matrix with single row or single column → degenerates to 1D prefix sum
  □ Include-exclude formula: add, subtract, subtract, add — easy to get signs wrong
```

---

## 5. Problem Progression (LeetCode)

### Level 1: Easy — Build the Foundation

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 303 | [Range Sum Query - Immutable](https://leetcode.com/problems/range-sum-query-immutable/) | Build prefix once, query = prefix[r+1] - prefix[l] | O(n) build, O(1) query |
| 1480 | [Running Sum of 1d Array](https://leetcode.com/problems/running-sum-of-1d-array/) | Literally the definition of prefix sum, in-place | O(n) |
| 724 | [Find Pivot Index](https://leetcode.com/problems/find-pivot-index/) | leftSum == totalSum - leftSum - nums[i] | O(n) |

### Level 2: Standard Medium — Core Technique

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 560 | [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) | HashMap of prefix sums; count where prefix - k existed before | O(n) |
| 525 | [Contiguous Array](https://leetcode.com/problems/contiguous-array/) | Replace 0→-1, then longest subarray with sum=0 via first-index HashMap | O(n) |
| 238 | [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) | Prefix product from left, suffix product from right; O(1) extra space trick | O(n) |
| 974 | [Subarray Sums Divisible by K](https://leetcode.com/problems/subarray-sums-divisible-by-k/) | Same-remainder prefix sums form valid subarrays; fix negative mod | O(n) |

### Level 3: Tricky Medium — Pattern Combinations

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 523 | [Continuous Subarray Sum](https://leetcode.com/problems/continuous-subarray-sum/) | Prefix mod k + HashMap of first index; check length ≥ 2 | O(n) |
| 930 | [Binary Subarrays With Sum](https://leetcode.com/problems/binary-subarrays-with-sum/) | exactly(K) = atMost(K) - atMost(K-1) OR prefix sum + HashMap | O(n) |
| 304 | [Range Sum Query 2D - Immutable](https://leetcode.com/problems/range-sum-query-2d-immutable/) | 2D prefix with inclusion-exclusion; four-corner formula | O(mn) build, O(1) query |

### Level 4: Hard — FAANG Interview Level

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 1074 | [Number of Submatrices That Sum to Target](https://leetcode.com/problems/number-of-submatrices-that-sum-to-target/) | Fix two rows, compress to 1D, then Subarray Sum = K | O(m²n) |
| 327 | [Count of Range Sum](https://leetcode.com/problems/count-of-range-sum/) | Merge sort on prefix sums; count valid pairs during merge | O(n log n) |
| 689 | [Maximum Sum of 3 Non-Overlapping Subarrays](https://leetcode.com/problems/maximum-sum-of-3-non-overlapping-subarrays/) | Prefix sum for window sums + leftBest/rightBest arrays | O(n) |

### Solving Order for Maximum Learning

```
Day 1: 303 → 1480 → 724 (build muscle memory for prefix array construction)
Day 2: 560 → 525 (master the prefix sum + HashMap combo — this is the money pattern)
Day 3: 238 → 974 (prefix product variant + modular arithmetic with negatives)
Day 4: 304 → 1074 (2D prefix sum: build → query → combine with HashMap)
Day 5: 327 → 689 (hard combinations: merge sort + prefix, multi-window optimization)
Day 6: Re-solve 560, 525, 974, 1074 WITHOUT notes (test recall under pressure)
```

---

## 6. Common Mistakes & Interview Traps

### Mistake 1: Off-by-One in Prefix Array Indexing

```java
// WRONG: prefix[right] - prefix[left] for sum of nums[left..right]
int sum = prefix[right] - prefix[left]; // MISSES nums[left]!

// CORRECT: prefix[right + 1] - prefix[left]
int sum = prefix[right + 1] - prefix[left]; // includes nums[left..right]

// WHY: prefix[i] = sum of nums[0..i-1], so prefix[right+1] includes nums[right]
```

### Mistake 2: Forgetting to Initialize HashMap with (0, 1)

```java
// WRONG: missing the empty-prefix base case
Map<Integer, Integer> map = new HashMap<>();
int count = 0, prefix = 0;
for (int num : nums) {
    prefix += num;
    count += map.getOrDefault(prefix - k, 0); // misses subarrays starting at index 0!
    map.merge(prefix, 1, Integer::sum);
}

// CORRECT: always seed with the empty prefix
Map<Integer, Integer> map = new HashMap<>();
map.put(0, 1); // empty prefix (sum 0) seen once — represents subarray from index 0
int count = 0, prefix = 0;
for (int num : nums) {
    prefix += num;
    count += map.getOrDefault(prefix - k, 0);
    map.merge(prefix, 1, Integer::sum);
}

// Example: nums = [3], k = 3
// Without init: prefix=3, map has no entry for 3-3=0, count=0 → WRONG (answer is 1)
// With init:    prefix=3, map has (0,1), count=1 → CORRECT
```

### Mistake 3: Negative Modulo in Java (Divisible by K)

```java
// WRONG: Java's % can return negative values
int remainder = prefix % k; // if prefix = -5, k = 3 → remainder = -2 (NOT 1)

// CORRECT: normalize to non-negative
int remainder = ((prefix % k) + k) % k; // -5 % 3 = -2 → (-2 + 3) % 3 = 1

// WHY IT MATTERS: -2 and 1 are the SAME equivalence class mod 3
// Without normalization, you'll miss valid subarray pairs
```

### Mistake 4: Integer Overflow on Large Prefix Sums

```java
// WRONG: using int when values can be large
int[] prefix = new int[n + 1];
// n = 100000, nums[i] up to 10^5 → prefix can reach 10^10 → OVERFLOW

// CORRECT: use long
long[] prefix = new long[n + 1];
for (int i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
}
// Also use Map<Long, Integer> for the HashMap variant
```

### Mistake 5: Counting Before Updating HashMap (Order Matters)

```java
// WRONG: update map BEFORE counting → counts current prefix as a "previous" prefix
for (int num : nums) {
    prefixSum += num;
    prefixCount.merge(prefixSum, 1, Integer::sum);  // updated FIRST
    count += prefixCount.getOrDefault(prefixSum - k, 0); // BUG: includes current!
}

// CORRECT: count FIRST, then update
for (int num : nums) {
    prefixSum += num;
    count += prefixCount.getOrDefault(prefixSum - k, 0); // count with previous prefixes
    prefixCount.merge(prefixSum, 1, Integer::sum);        // THEN record current
}

// WHY: we need strictly EARLIER prefixes; recording current first creates a
// self-referencing match (subarray of length 0) when k = 0
```

### What Interviewers Actually Look For

```
JUNIOR:    Can build a prefix array and answer range queries correctly
SENIOR:    Instinctively reaches for prefix sum + HashMap for "count subarrays" problems,
           handles negative mod, overflow, and off-by-one without prompting
STAFF:     Reduces 2D problems to 1D prefix sum, identifies the "exactly K = atMost(K) -
           atMost(K-1)" trick, discusses trade-offs with Fenwick/Segment Tree for mutable data
```

---

## 7. Interview Strategy

### Target Solving Times

```
Easy (Range Sum Query, Pivot Index):         5-8 minutes (including explanation)
Medium (Subarray Sum = K, Contiguous Array): 10-15 minutes
Hard (Submatrices Sum to Target):            18-25 minutes

If you're taking longer than these, you haven't internalized the templates.
```

### How to Explain Your Approach (Script)

```
STEP 1 (30 seconds): State the brute force
  "The brute force checks all O(n²) subarrays and computes each sum in O(1)
   with a running total, giving O(n²) overall."

STEP 2 (30 seconds): Identify the optimization
  "I'll precompute a prefix sum array where prefix[i] is the sum of the first
   i elements. Then the sum of any subarray nums[left..right] is just
   prefix[right+1] - prefix[left] in O(1)."

  FOR COUNT PROBLEMS, add:
  "To count subarrays summing to K, I rearrange: prefix[j] - K = prefix[i].
   I use a HashMap to track how many times each prefix sum has appeared.
   At each position, I look up prefix - K in the map. This gives O(n) time."

STEP 3 (15 seconds): Confirm edge cases
  "I'll handle empty arrays, initialize the HashMap with (0,1) for the empty
   prefix, and use long if values might overflow."

STEP 4: Code (5-12 minutes)

STEP 5 (30 seconds): Walk through an example
  "For nums=[1,2,3], k=3: prefix sums are 0,1,3,6.
   At prefix=1: 1-3=-2 not in map.
   At prefix=3: 3-3=0 is in map (count 1) → found [1,2].
   At prefix=6: 6-3=3 is in map (count 1) → found [3]. Answer: 2."
```

### Follow-Up Questions Interviewers Ask

```
Q: "What if the array can be updated between queries?"
A: "Prefix sum assumes immutable data. For mutable arrays, I'd use a
    Fenwick Tree (BIT) for O(log n) point update and O(log n) range query,
    or a Segment Tree for more complex range operations."

Q: "Can you solve Subarray Sum = K without extra space?"
A: "Not in O(n) time. The HashMap is essential for O(1) lookups of previous
    prefix sums. Without it, we'd fall back to O(n²) brute force. The O(n)
    space is a necessary trade-off."

Q: "How would you handle this in 2D?"
A: "Build a 2D prefix sum using inclusion-exclusion. To count submatrices
    with a target sum, fix two rows (r1, r2), compress each column into
    a single value using prefix sums, then apply the 1D Subarray Sum = K
    technique. That gives O(m²·n) for an m×n matrix."

Q: "What if we need subarrays with sum in a range [lower, upper]?"
A: "That's LC 327. Prefix sum alone isn't enough. I'd use merge sort on
    the prefix array and count valid pairs during the merge step, which
    gives O(n log n)."

Q: "What's the 'exactly K = atMost(K) - atMost(K-1)' trick?"
A: "Some problems are easier to solve for 'at most K' using sliding window.
    'Exactly K' subarrays = atMost(K) - atMost(K-1). For example,
    Binary Subarrays With Sum (LC 930) uses this when the array is binary."
```

---

## 8. Revision Strategy

### Weekly Revision Plan

```
WEEK 1: Solve all 13 problems from scratch. Time yourself.
WEEK 2: Re-solve only the ones you couldn't do in target time.
WEEK 3: Solve 560, 974, and 1074 from memory (no notes, no IDE help).
WEEK 4: Mix with other patterns (sliding window, two pointers) to practice
         pattern selection — "is this prefix sum or sliding window?"
```

### What to Memorize vs Understand

```
MEMORIZE:
  ✓ prefix[i] = sum of arr[0..i-1]; range sum = prefix[right+1] - prefix[left]
  ✓ The HashMap template: seed with (0,1), count THEN update
  ✓ Negative mod fix: ((x % k) + k) % k
  ✓ 2D inclusion-exclusion formula (add, subtract, subtract, add)
  ✓ "exactly K = atMost(K) - atMost(K-1)" trick

UNDERSTAND (don't memorize — derive each time):
  ✓ WHY prefix[j] - prefix[i] = K leads to a HashMap approach
  ✓ WHY we initialize HashMap with (0, 1) — the empty prefix
  ✓ WHY 2D prefix uses inclusion-exclusion (Venn diagram of overlapping rectangles)
  ✓ HOW to reduce 2D submatrix problems to 1D (fix row range, compress columns)
  ✓ WHY Contiguous Array transforms 0→-1 (equal 0s and 1s ↔ subarray sum = 0)
```

### Signals That Indicate Mastery

```
□ You see "subarray sum" and IMMEDIATELY think "prefix sum + HashMap" (< 5 seconds)
□ You can write Subarray Sum = K with HashMap in under 5 minutes without looking at anything
□ You never forget to initialize the HashMap with (0, 1)
□ You handle negative mod in Java without thinking twice
□ You can reduce 2D submatrix problems to 1D prefix sum and explain the O(m²n) complexity
□ You can articulate when to use prefix sum vs sliding window vs Fenwick tree
□ You can derive the "exactly K" trick on the fly when prompted
```

---

## Quick Reference Card (Print This)

```
PATTERN                   TEMPLATE                                    TIME        SPACE
────────────────────────────────────────────────────────────────────────────────────────
Build prefix array        prefix[i+1] = prefix[i] + nums[i]          O(n)        O(n)
Range sum query           prefix[right+1] - prefix[left]              O(1)        —
Subarray sum = K          HashMap of prefix sums; count prefix-k      O(n)        O(n)
Longest subarray sum=0    HashMap of first-index; max(j - firstIdx)   O(n)        O(n)
Divisible by K            ((prefix % k) + k) % k; count same mod      O(n)        O(k)
Product except self       prefix product left × suffix product right  O(n)        O(1)*
2D range sum              inclusion-exclusion on 2D prefix             O(mn)       O(mn)
2D submatrix count = T    fix 2 rows + compress to 1D + HashMap       O(m²n)      O(n)
Exactly K (binary array)  atMost(K) - atMost(K-1)                     O(n)        O(1)

DECISION FLOW:
  range sum on immutable array?     → BASIC PREFIX ARRAY
  count subarrays with sum = K?     → PREFIX SUM + HASHMAP
  subarray sum divisible by K?      → PREFIX MOD K + HASHMAP
  2D rectangle sum?                 → 2D PREFIX (inclusion-exclusion)
  array changes between queries?    → FENWICK TREE / SEGMENT TREE (not prefix sum)

* O(1) extra space when reusing output array for prefix pass
```
