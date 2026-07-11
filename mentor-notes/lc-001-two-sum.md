# LC #1 — Two Sum

> Date: 2026-07-10 | Pattern: Arrays & Hashing | Difficulty: Easy | LC#: 1

---

## Problem

Given an array of integers `nums` and an integer `target`, return the indices of two numbers that add up to `target`.

```java
Input:  nums = [2, 7, 11, 15], target = 9
Output: [0, 1]     // because nums[0] + nums[1] = 2 + 7 = 9
```

## Pattern

**HashMap complement lookup** — for each number, check if `target - num` already exists in the map.

---

## Approach 1: Brute Force

Check every pair.

```java
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
        if (nums[i] + nums[j] == target) return new int[]{i, j};
    }
}
```

```
Time:  O(n²)
Space: O(1)
```

Why not enough: redundant comparisons. For each number, we're scanning the entire array again.

---

## Approach 2: Optimal — Single-Pass HashMap

Key insight: for each `nums[i]`, the complement is `target - nums[i]`. If that complement is already in the map, we found our pair.

### Trace

```
nums = [2, 7, 11, 15], target = 9
map = {}

i=0: num=2, complement=9-2=7, map has 7? No  → map={2:0}
i=1: num=7, complement=9-7=2, map has 2? YES → return [0, 1]
```

### Code

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();

        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];

            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }

            map.put(nums[i], i);
        }

        return new int[]{};
    }
}
```

```
Time:  O(n)
Space: O(n)
```

---

## Java Internals

- `HashMap<Integer, Integer>` — autoboxes `int` to `Integer`. Know that `Integer` values -128 to 127 are cached, so `==` works for small values but `equals()` is always correct.
- `map.containsKey()` calls `hashCode()` then `equals()` on the `Integer` key.
- Check complement **before** inserting `nums[i]` — this prevents matching an element with itself.

## Edge Cases

- Duplicate values: `[3, 3]`, target=6 → works because we check before inserting
- Negative numbers: `[-1, -2, -3, -4, -5]`, target=-8
- Single valid pair guaranteed by problem constraints

## Complexity Summary

| Approach | Time | Space |
|----------|------|-------|
| Brute Force | O(n²) | O(1) |
| HashMap | O(n) | O(n) |

## 60-Second Interview Explanation

> The brute force checks every pair in O(n²). The key insight is that for each number, I know the exact complement I need: target minus current. So I use a HashMap to store numbers I've seen. For each new number, I check if its complement exists in the map. If yes, I return both indices. If not, I add the current number. This gives O(n) time and O(n) space. I check the complement before inserting to avoid matching an element with itself.

## Follow-Up

- What if array is sorted? → Two Pointers, O(n) time, O(1) space
- What if you need all pairs? → Don't return early, collect all results
- What about duplicates? → HashMap handles it because we check before insert
