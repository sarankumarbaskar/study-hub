# Two Pointers

> Two indices moving through a sequence—often toward each other or in tandem—to solve problems in O(n) without extra space.

## What Is This Pattern?

The Two Pointers pattern uses two indices (pointers) that traverse a data structure—usually an array or string—to efficiently solve problems that might otherwise require nested loops. The pointers can move in the same direction (slow/fast), in opposite directions (converging), or from different starting positions.

Imagine two fingers sliding along a sorted array. When their sum is too small, you move the left finger right to increase it. When it's too large, you move the right finger left to decrease it. By never backing up, you explore all meaningful pairs in a single pass—O(n) instead of O(n²).

The power comes from *structural invariance*: for sorted arrays, moving one pointer in one direction has a predictable effect. For palindromes, comparing characters from both ends catches mismatches in one pass. This "monotonic" relationship between pointer movement and the quantity you care about is what makes the technique work.

## When to Use This Pattern

- **Sorted array or string** — Binary search–like elimination; moving a pointer always pushes the quantity in one direction
- **Pair/triplet finding** — "Find two/three elements that sum to X" on sorted (or sortable) data
- **In-place rearrangement** — Partitioning, removing duplicates, merging without extra space
- **Palindrome / symmetry checks** — Comparing from both ends converges to the center
- **Range queries on sorted data** — "Subarray with sum X" or "pairs in range [a, b]"

## How to Identify This Pattern

```
Is the input an array or string?
    ├─ YES → Is it sorted (or can you sort it)?
    │         ├─ YES → Do you need pairs/triplets or in-place ops?
    │         │         └─ YES → Consider TWO POINTERS
    │         └─ NO → Are you comparing/partitioning from both ends?
    │                   └─ YES (palindrome, partition) → TWO POINTERS
    └─ Consider Sliding Window or Hashing instead
```

**Quick check:** If moving one index in one direction *always* changes your metric in a predictable way (e.g., sum increases or decreases), two pointers can replace nested loops.

## Core Template (Pseudocode)

```
// Converging pointers (opposite ends)
left = 0
right = length - 1
while left < right:
    if condition_met:
        record/process result
        advance one or both pointers based on goal
    else if need_larger:
        left++
    else:
        right--

// Same-direction pointers (slow/fast)
slow = 0
for fast in 0..length:
    if keep(fast):
        swap/assign slow, fast
        slow++
    // else: skip (fast advances)

// Three pointers (e.g., 3Sum)
for i in 0..length-2:
    left = i + 1
    right = length - 1
    while left < right:
        sum = arr[i] + arr[left] + arr[right]
        if sum == target: record; skip duplicates; advance
        else if sum < target: left++
        else: right--
```

## Core Template (Java)

```java
// Converging pointers
public void convergingTwoPointers(int[] arr) {
    int left = 0;
    int right = arr.length - 1;
    while (left < right) {
        if (conditionMet(arr[left], arr[right])) {
            // process
            left++;
            right--;
        } else if (shouldMoveLeft(arr[left], arr[right])) {
            left++;
        } else {
            right--;
        }
    }
}

// Same-direction (in-place overwrite)
public int sameDirectionPointers(int[] arr) {
    int write = 0;
    for (int read = 0; read < arr.length; read++) {
        if (shouldKeep(arr[read])) {
            arr[write++] = arr[read];
        }
    }
    return write;
}

// Three pointers (3Sum-style)
public List<List<Integer>> threePointers(int[] arr, int target) {
    Arrays.sort(arr);
    List<List<Integer>> result = new ArrayList<>();
    for (int i = 0; i < arr.length - 2; i++) {
        if (i > 0 && arr[i] == arr[i - 1]) continue;
        int left = i + 1;
        int right = arr.length - 1;
        while (left < right) {
            int sum = arr[i] + arr[left] + arr[right];
            if (sum == target) {
                result.add(List.of(arr[i], arr[left], arr[right]));
                while (left < right && arr[left] == arr[left + 1]) left++;
                while (left < right && arr[right] == arr[right - 1]) right--;
                left++;
                right--;
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
    }
    return result;
}
```

## Complexity Cheat Sheet

| Scenario                  | Time   | Space  | Notes                                      |
|--------------------------|--------|--------|--------------------------------------------|
| Converging (pair find)   | O(n)   | O(1)   | Single pass, no extra structures           |
| Same-direction (filter)  | O(n)   | O(1)   | Read-write indices, in-place               |
| 3Sum / 3Sum Closest      | O(n²)  | O(1)*  | *Excluding sort; sort is O(log n) or given |
| 4Sum                     | O(n³)  | O(1)*  | Outer loop + inner two pointers            |
| With sorting             | +O(n log n) | O(log n) | Sort dominates if n is small              |

---

## Problems (Progressive Difficulty)

### Easy (3 problems)

#### Problem: [Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) (LeetCode #167)

- **Intuition:** Because the array is sorted, a larger left value increases the sum and a smaller right value decreases it. Move pointers based on whether the current sum is above or below target.
- **Brute Force:** Try all pairs with two nested loops, checking if each pair sums to target. Time O(n²), Space O(1)
- **Optimized Approach:**
  1. Start with `left = 0`, `right = length - 1`
  2. Compute `sum = numbers[left] + numbers[right]`
  3. If `sum == target`, return 1-based indices `[left+1, right+1]`
  4. If `sum < target`, increment `left` (need larger)
  5. If `sum > target`, decrement `right` (need smaller)
- **Java Solution:**

```java
class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int left = 0;
        int right = numbers.length - 1;
        while (left < right) {
            int sum = numbers[left] + numbers[right];
            if (sum == target) {
                return new int[]{left + 1, right + 1};
            }
            if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
        return new int[]{-1, -1};
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/) (LeetCode #125)

- **Intuition:** A palindrome reads the same forward and backward. Compare characters from both ends and move inward; skip non-alphanumeric characters.
- **Brute Force:** Create a new string with only alphanumeric chars (lowercased), then check if it equals its reverse. Time O(n), Space O(n)
- **Optimized Approach:**
  1. Use `left = 0`, `right = s.length() - 1`
  2. Skip non-alphanumeric at each pointer
  3. Compare characters (case-insensitive)
  4. If mismatch, return false; else advance both toward center
- **Java Solution:**

```java
class Solution {
    public boolean isPalindrome(String s) {
        int left = 0;
        int right = s.length() - 1;
        while (left < right) {
            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) {
                left++;
            }
            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) {
                right--;
            }
            if (left >= right) break;
            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Merge Sorted Array](https://leetcode.com/problems/merge-sorted-array/) (LeetCode #88)

- **Intuition:** Merge from the end of `nums1` where there is space. Compare largest elements of each array and place the larger one at the back.
- **Brute Force:** Copy nums2 into the end of nums1, then sort the entire nums1 array. Time O((m+n) log(m+n)), Space O(log(m+n)) for sort
- **Optimized Approach:**
  1. Use `i = m - 1`, `j = n - 1`, `k = m + n - 1`
  2. While both arrays have elements, put the larger of `nums1[i]` and `nums2[j]` at `nums1[k]`, decrement indices
  3. If `nums2` has remaining elements, copy them; `nums1`'s prefix stays as is
- **Java Solution:**

```java
class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {
        int i = m - 1;
        int j = n - 1;
        int k = m + n - 1;
        while (i >= 0 && j >= 0) {
            if (nums1[i] > nums2[j]) {
                nums1[k--] = nums1[i--];
            } else {
                nums1[k--] = nums2[j--];
            }
        }
        while (j >= 0) {
            nums1[k--] = nums2[j--];
        }
    }
}
```

- **Complexity:** Time O(m + n), Space O(1)

---

### Medium (6 problems)

#### Problem: [3Sum](https://leetcode.com/problems/3sum/) (LeetCode #15)

- **Intuition:** Fix one element, then reduce to Two Sum II for the remaining two. Sort first to enable two-pointer search and skip duplicates.
- **Approach:**
  1. Sort the array
  2. For each `i` from 0 to n-2, treat `-nums[i]` as target for the rest
  3. Use `left = i+1`, `right = n-1` for two-pointer pair search
  4. Skip duplicate values at `i`, `left`, and `right` to avoid duplicate triplets
- **Java Solution:**

```java
class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        Arrays.sort(nums);
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int target = -nums[i];
            int left = i + 1;
            int right = nums.length - 1;
            while (left < right) {
                int sum = nums[left] + nums[right];
                if (sum == target) {
                    result.add(List.of(nums[i], nums[left], nums[right]));
                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++;
                    right--;
                } else if (sum < target) {
                    left++;
                } else {
                    right--;
                }
            }
        }
        return result;
    }
}
```

- **Complexity:** Time O(n²), Space O(1) (excluding output)

---

#### Problem: Container With Most Water (LeetCode #11)

- **Intuition:** Start with maximum width. The limiting factor is the shorter line; moving the pointer at the shorter line inward might find a taller one and improve area.
- **Approach:**
  1. `left = 0`, `right = length - 1`
  2. Compute `area = min(height[left], height[right]) * (right - left)`
  3. Track maximum area
  4. Move the pointer at the shorter line inward (only the shorter side limits us)
- **Java Solution:**

```java
class Solution {
    public int maxArea(int[] height) {
        int left = 0;
        int right = height.length - 1;
        int maxArea = 0;
        while (left < right) {
            int h = Math.min(height[left], height[right]);
            int width = right - left;
            maxArea = Math.max(maxArea, h * width);
            if (height[left] < height[right]) {
                left++;
            } else {
                right--;
            }
        }
        return maxArea;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: Two Sum (LeetCode #1)

- **Intuition:** Sort the array while preserving original indices. Then use two pointers to find the pair; map back to original indices for the answer.
- **Brute Force:** Try all pairs with two nested loops, return indices when the pair sums to target. Time O(n²), Space O(1)
- **Optimized Approach:**
  1. Create `(value, index)` pairs and sort by value
  2. Use converging two pointers to find the pair summing to target
  3. Return original indices in ascending order
- **Java Solution:**

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        int[][] indexed = new int[nums.length][2];
        for (int i = 0; i < nums.length; i++) {
            indexed[i][0] = nums[i];
            indexed[i][1] = i;
        }
        Arrays.sort(indexed, Comparator.comparingInt(a -> a[0]));
        int left = 0;
        int right = nums.length - 1;
        while (left < right) {
            int sum = indexed[left][0] + indexed[right][0];
            if (sum == target) {
                int i = indexed[left][1];
                int j = indexed[right][1];
                return new int[]{Math.min(i, j), Math.max(i, j)};
            }
            if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
        return new int[]{-1, -1};
    }
}
```

- **Complexity:** Time O(n log n), Space O(n)

---

#### Problem: [Remove Duplicates from Sorted Array II](https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/) (LeetCode #80)

- **Intuition:** Allow at most 2 of each value. Use a write pointer and track how many of the current value we've written; only write when count ≤ 2.
- **Brute Force:** Use an auxiliary array to build the result, copying each element only if we've seen fewer than two of that value so far. Time O(n), Space O(n)
- **Optimized Approach:**
  1. `write = 0`; iterate with `read`
  2. Write `nums[read]` if it's the first occurrence or the second (same as previous and we've only written one so far)
  3. Skip when we've already written two of the current value
- **Java Solution:**

```java
class Solution {
    public int removeDuplicates(int[] nums) {
        if (nums.length <= 2) return nums.length;
        int write = 2;
        for (int read = 2; read < nums.length; read++) {
            if (nums[read] != nums[write - 2]) {
                nums[write++] = nums[read];
            }
        }
        return write;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: Sort Colors (LeetCode #75)

- **Intuition:** Dutch National Flag: partition into [0s][1s][2s] with three pointers. `low` = next 0, `mid` = scanner, `high` = next 2.
- **Approach:**
  1. `low = 0`, `mid = 0`, `high = n - 1`
  2. If `nums[mid] == 0`: swap with `low`, increment both `low` and `mid`
  3. If `nums[mid] == 2`: swap with `high`, decrement `high` (don't advance `mid`—new value needs check)
  4. If `nums[mid] == 1`: just increment `mid`
- **Java Solution:**

```java
class Solution {
    public void sortColors(int[] nums) {
        int low = 0;
        int mid = 0;
        int high = nums.length - 1;
        while (mid <= high) {
            if (nums[mid] == 0) {
                swap(nums, low++, mid++);
            } else if (nums[mid] == 2) {
                swap(nums, mid, high--);
            } else {
                mid++;
            }
        }
    }

    private void swap(int[] nums, int i, int j) {
        int t = nums[i];
        nums[i] = nums[j];
        nums[j] = t;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Trapping Rain Water - Simplified Approach](https://leetcode.com/problems/trapping-rain-water/) (LeetCode #42)

- **Intuition:** Water at index `i` is trapped up to `min(maxLeft, maxRight) - height[i]`. Precompute `leftMax[i]` and `rightMax[i]` with two passes, then sum the water.
- **Approach:**
  1. Build `leftMax[i]` = max height from 0 to i (inclusive)
  2. Build `rightMax[i]` = max height from i to n-1 (inclusive)
  3. For each `i`, add `min(leftMax[i], rightMax[i]) - height[i]` to total
- **Java Solution:**

```java
class Solution {
    public int trap(int[] height) {
        if (height.length == 0) return 0;
        int n = height.length;
        int[] leftMax = new int[n];
        int[] rightMax = new int[n];
        leftMax[0] = height[0];
        for (int i = 1; i < n; i++) {
            leftMax[i] = Math.max(leftMax[i - 1], height[i]);
        }
        rightMax[n - 1] = height[n - 1];
        for (int i = n - 2; i >= 0; i--) {
            rightMax[i] = Math.max(rightMax[i + 1], height[i]);
        }
        int water = 0;
        for (int i = 0; i < n; i++) {
            water += Math.min(leftMax[i], rightMax[i]) - height[i];
        }
        return water;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

### Hard (3 problems)

#### Problem: [Trapping Rain Water - Optimal Two Pointers](https://leetcode.com/problems/trapping-rain-water/) (LeetCode #42)

- **Intuition:** Use converging pointers with `leftMax` and `rightMax`. Whichever side has the smaller max is the limiting factor; process that side and advance.
- **Approach:**
  1. `left = 0`, `right = n-1`, `leftMax = 0`, `rightMax = 0`
  2. If `leftMax < rightMax`: water at `left` is bounded by `leftMax`; add `leftMax - height[left]`; update `leftMax`; `left++`
  3. Else: water at `right` is bounded by `rightMax`; add `rightMax - height[right]`; update `rightMax`; `right--`
- **Java Solution:**

```java
class Solution {
    public int trap(int[] height) {
        int left = 0;
        int right = height.length - 1;
        int leftMax = 0;
        int rightMax = 0;
        int water = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) {
                    leftMax = height[left];
                } else {
                    water += leftMax - height[left];
                }
                left++;
            } else {
                if (height[right] >= rightMax) {
                    rightMax = height[right];
                } else {
                    water += rightMax - height[right];
                }
                right--;
            }
        }
        return water;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: 3Sum Closest (LeetCode #16)

- **Intuition:** Same as 3Sum: fix one element, two-pointer search for the other two. Track the triplet with minimum `|sum - target|`.
- **Approach:**
  1. Sort the array
  2. For each `i`, use `left = i+1`, `right = n-1`
  3. Compute `sum`; if `|sum - target|` is better than best, update best and `closestSum`
  4. If `sum < target`: `left++`; else `right--`
- **Java Solution:**

```java
class Solution {
    public int threeSumClosest(int[] nums, int target) {
        Arrays.sort(nums);
        int closestSum = nums[0] + nums[1] + nums[2];
        int bestDiff = Math.abs(closestSum - target);
        for (int i = 0; i < nums.length - 2; i++) {
            int left = i + 1;
            int right = nums.length - 1;
            while (left < right) {
                int sum = nums[i] + nums[left] + nums[right];
                int diff = Math.abs(sum - target);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    closestSum = sum;
                }
                if (sum < target) {
                    left++;
                } else {
                    right--;
                }
            }
        }
        return closestSum;
    }
}
```

- **Complexity:** Time O(n²), Space O(1)

---

#### Problem: 4Sum (LeetCode #18)

- **Intuition:** Add one more outer loop to 3Sum: fix two elements, then two-pointer search for the remaining two.
- **Brute Force:** Enumerate all quadruplets with four nested loops; filter those summing to target and deduplicate. Time O(n⁴), Space O(1)
- **Optimized Approach:**
  1. Sort the array
  2. For each `i` and `j` (with `j > i`), skip duplicates
  3. Use `left = j+1`, `right = n-1` for two-pointer pair search
  4. Target = `target - nums[i] - nums[j]`
  5. Skip duplicates when recording and advancing
- **Java Solution:**

```java
class Solution {
    public List<List<Integer>> fourSum(int[] nums, int target) {
        List<List<Integer>> result = new ArrayList<>();
        if (nums.length < 4) return result;
        Arrays.sort(nums);
        for (int i = 0; i < nums.length - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1; j < nums.length - 2; j++) {
                if (j > i + 1 && nums[j] == nums[j - 1]) continue;
                long remaining = (long) target - nums[i] - nums[j];
                int left = j + 1;
                int right = nums.length - 1;
                while (left < right) {
                    long sum = (long) nums[left] + nums[right];
                    if (sum == remaining) {
                        result.add(List.of(nums[i], nums[j], nums[left], nums[right]));
                        while (left < right && nums[left] == nums[left + 1]) left++;
                        while (left < right && nums[right] == nums[right - 1]) right--;
                        left++;
                        right--;
                    } else if (sum < remaining) {
                        left++;
                    } else {
                        right--;
                    }
                }
            }
        }
        return result;
    }
}
```

- **Complexity:** Time O(n³), Space O(1) (excluding output)

---

## Common Mistakes & Edge Cases

- **Off-by-one in indices:** Using `left <= right` vs `left < right`—use `<` when pointers must not cross; use `<=` when you need to process the single middle element
- **Duplicate triplets/quadruplets:** Always skip duplicate values at `i`, `j`, `left`, and `right` after finding a valid combination
- **Integer overflow:** In 4Sum and similar, `target - a - b` can overflow; use `long` for intermediate sums
- **Empty or single-element arrays:** Handle `length < 2` (or 3, 4) before running loops
- **Merge Sorted Array:** Merge from the end, not the start, to avoid overwriting `nums1` elements before they're used
- **Sort Colors:** When swapping 2 to the end, don't advance `mid`—the new value at `mid` might be 0 or 2 and needs re-checking
- **Trapping Rain Water:** The optimal version compares `height[left]` and `height[right]` to decide which pointer to move—not `leftMax` vs `rightMax`

## Pattern Variations

| Variation          | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| **Converging**     | Left and right pointers moving toward each other (pair find, palindrome)   |
| **Same-direction** | Read/write or slow/fast pointers; used for in-place filtering (duplicates) |
| **Three+ pointers**| Extra outer loops + inner two pointers (3Sum, 4Sum, Dutch flag)             |
| **Parallel arrays**| Two pointers on two different arrays (merge, intersection)                 |
| **Sliding window** | Overlaps conceptually; use when you care about a contiguous subarray range |
