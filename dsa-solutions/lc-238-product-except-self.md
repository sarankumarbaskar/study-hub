# LC #238 — Product of Array Except Self

> Date: 2026-07-10 | Pattern: Arrays & Hashing (Prefix/Suffix) | Difficulty: Medium | LC#: 238

---

## Problem

Given an integer array `nums`, return an array where `answer[i]` = product of all elements except `nums[i]`. Do NOT use division.

```java
Input:  [1, 2, 3, 4]
Output: [24, 12, 8, 6]
```

## Pattern

**Prefix/Suffix Product** — for every index `i`, the answer is:

```
product of everything LEFT of i  ×  product of everything RIGHT of i
```

---

## Approach 1: Brute Force

For every index, loop through the whole array and multiply everything except itself.

### Pseudocode

```
for i = 0 to n-1:
    product = 1
    for j = 0 to n-1:
        if j != i:
            product = product × nums[j]
    answer[i] = product
```

### Java

```java
for (int i = 0; i < n; i++) {
    int product = 1;
    for (int j = 0; j < n; j++) {
        if (i != j) product *= nums[j];
    }
    answer[i] = product;
}
```

```
Time:  O(n²)
Space: O(1)
```

Why not enough: recomputes products redundantly for each index.

---

## Approach 2: Better — Prefix + Suffix Arrays

Precompute product of everything to the left (prefix) and everything to the right (suffix) for each index. Answer is prefix × suffix.

### Pseudocode

```
prefix[0] = 1
for i = 1 to n-1:
    prefix[i] = prefix[i-1] × nums[i-1]

suffix[n-1] = 1
for i = n-2 down to 0:
    suffix[i] = suffix[i+1] × nums[i+1]

for i = 0 to n-1:
    result[i] = prefix[i] × suffix[i]
```

### Trace

```
nums   = [1,  2,  3,  4]

prefix:
  prefix[0] = 1                    (nothing before index 0)
  prefix[1] = 1                    (nums[0])
  prefix[2] = 1 × 2 = 2
  prefix[3] = 1 × 2 × 3 = 6

prefix = [1, 1, 2, 6]

suffix:
  suffix[3] = 1                    (nothing after index 3)
  suffix[2] = 4
  suffix[1] = 3 × 4 = 12
  suffix[0] = 2 × 3 × 4 = 24

suffix = [24, 12, 4, 1]

answer[i] = prefix[i] × suffix[i]
answer = [24, 12, 8, 6]
```

```java
int[] prefix = new int[n];
int[] suffix = new int[n];

prefix[0] = 1;
for (int i = 1; i < n; i++) {
    prefix[i] = prefix[i - 1] * nums[i - 1];
}

suffix[n - 1] = 1;
for (int i = n - 2; i >= 0; i--) {
    suffix[i] = suffix[i + 1] * nums[i + 1];
}

int[] result = new int[n];
for (int i = 0; i < n; i++) {
    result[i] = prefix[i] * suffix[i];
}
```

```
Time:  O(n)
Space: O(n)
```

---

## Approach 3: Optimal — Output Array + Running Suffix

Use the output array itself to store prefix products. Then sweep right-to-left with a single running variable and multiply into the output. No extra arrays needed.

### Pseudocode

```
left = 1
for i = 0 to n-1:
    result[i] = left          ← store product of everything BEFORE i
    left = left × nums[i]     ← include current for future indices

right = 1
for i = n-1 down to 0:
    result[i] = result[i] × right   ← multiply by product of everything AFTER i
    right = right × nums[i]          ← include current for future leftward indices
```

### Trace

```
nums = [1, 2, 3, 4]

Left pass (store prefix in result):
  i=0: result[0] = 1,     left = 1 × 1 = 1
  i=1: result[1] = 1,     left = 1 × 2 = 2
  i=2: result[2] = 2,     left = 2 × 3 = 6
  i=3: result[3] = 6,     left = 6 × 4 = 24

result = [1, 1, 2, 6]

Right pass (multiply suffix into result):
  right = 1
  i=3: result[3] = 6 × 1 = 6,    right = 1 × 4 = 4
  i=2: result[2] = 2 × 4 = 8,    right = 4 × 3 = 12
  i=1: result[1] = 1 × 12 = 12,  right = 12 × 2 = 24
  i=0: result[0] = 1 × 24 = 24,  right = 24 × 1 = 24

result = [24, 12, 8, 6]  ✓
```

### Code

```java
class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] result = new int[n];

        int left = 1;
        for (int i = 0; i < n; i++) {
            result[i] = left;
            left *= nums[i];
        }

        int right = 1;
        for (int i = n - 1; i >= 0; i--) {
            result[i] *= right;
            right *= nums[i];
        }

        return result;
    }
}
```

```
Time:  O(n)
Space: O(1) extra (output array doesn't count)
```

### Mental Rule

```
result[i] = left      ← product BEFORE i (do not include nums[i])
result[i] *= right    ← multiply by product AFTER i (do not include nums[i])
left *= nums[i]       ← THEN include current for future indices
right *= nums[i]      ← THEN include current for future leftward indices
```

**Never include `nums[i]` in either product — it's "except self."**

---

## Common Mistakes

1. **Using division** — the constraint explicitly forbids it
2. **Including `nums[i]`** — writing `result[i] = left * nums[i]` instead of `result[i] = left`
3. **Overwriting in right pass** — writing `result[i] = right * nums[i]` instead of `result[i] *= right`
4. **Off-by-one in prefix/suffix** — `prefix[i] = prefix[i-1] * nums[i-1]` not `prefix[i-1] * nums[i]`

## Java Internals

- `int[]` stores primitives directly on heap — no boxing, cache-friendly
- Java initializes `int[]` with zeroes, but we overwrite every index in the left pass
- Integer overflow: LeetCode guarantees 32-bit fit, but in production use `long` or `Math.multiplyExact()`

## Edge Cases

- One zero: `[1, 2, 0, 4]` → `[0, 0, 8, 0]` — handled naturally
- Multiple zeros: `[1, 0, 3, 0]` → `[0, 0, 0, 0]` — handled naturally
- Negative numbers: `[-1, 1, 0, -3, 3]` → `[0, 0, 9, 0, 0]` — handled naturally
- Length 2: `[3, 4]` → `[4, 3]` — handled naturally

## Complexity Summary

| Approach | Time | Space |
|----------|------|-------|
| Brute Force | O(n²) | O(1) |
| Prefix + Suffix Arrays | O(n) | O(n) |
| Optimal (output + running var) | O(n) | O(1) extra |

## 60-Second Interview Explanation

> The brute force computes the product for each index by looping through the whole array — O(n²). The key observation is that the answer for each index is the product of everything on its left times everything on its right. So I can build prefix and suffix arrays in O(n). To optimize space, I use the output array itself to store prefix products in the left pass, then sweep right-to-left with a running suffix variable and multiply into the output. This gives O(n) time and O(1) extra space. The critical rule: never include nums[i] in either product — store `left` into result, then update `left` with the current element. Same for the right pass: multiply `right` into result, then update `right`.
