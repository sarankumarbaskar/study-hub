# Binary Search

> Halve the search space at each step—turning O(n) linear scans into O(log n) lookups when the space has structure.

## What Is This Pattern?

Binary search is a divide-and-conquer technique that repeatedly narrows a **search space** by comparing a probe value to the target and discarding half of the remaining candidates. The critical requirement: the search space must have a **monotonic structure**—elements that let you deterministically decide whether the answer lies in the left or right half based on a simple comparison.

**Visual intuition:** Imagine searching for a word in a dictionary. You don't scan page by page. You open to the middle: if your word comes before that page, you discard the right half; otherwise, you discard the left. Each step halves the remaining pages. The same logic applies to sorted arrays: comparing `arr[mid]` to `target` tells you which half to explore next.

The pattern extends beyond "find X in sorted array." You can binary search on **indices** (classic lookup), on **boundaries** (find leftmost/rightmost occurrence), or on the **answer itself** when the problem asks "what is the minimum X such that condition holds?"—and checking the condition is feasible in O(n) or O(1). In all cases, the key is identifying what to binary search on and what invariant to maintain.

## When to Use This Pattern

- Input is **sorted** (or can be logically treated as sorted—e.g., rotated array, mountain).
- Problem asks for **"find target"**, **"first/last occurrence"**, **"insert position"**, **"minimum X such that..."**.
- A **monotonic predicate** exists: for some value `x`, if `f(x)` is true then `f(x+1)` is true (or vice versa).
- Linear scan would be O(n) but you need O(log n)—binary search on answer can achieve that.
- Problem mentions **"sorted"**, **"ascending/descending"**, **"rotated"**, **"peak"**, **"minimum rate"**, **"split into k parts"**.

## How to Identify This Pattern

```
Is the input sorted (or has monotonic structure)?
    NO → Can we binary search on the ANSWER?
         YES → Do we have a check function f(x) that is monotonic?
               YES → BINARY SEARCH ON ANSWER
         NO  → Consider other patterns
    YES ↓

Are we finding the exact target or a boundary?
    Exact target → CLASSIC BINARY SEARCH
    First occurrence / left boundary → LEFT-BOUNDARY BINARY SEARCH
    Last occurrence / right boundary → RIGHT-BOUNDARY BINARY SEARCH
    Peak / rotated structure → ADAPT CLASSIC (different comparison logic)
```

## Core Template (Pseudocode)

### Classic (Exact Match)

```
FUNCTION classicBinarySearch(arr, target):
    left = 0, right = length(arr) - 1
    WHILE left <= right:
        mid = left + (right - left) / 2
        IF arr[mid] == target:
            RETURN mid
        IF arr[mid] < target:
            left = mid + 1
        ELSE:
            right = mid - 1
    RETURN -1
```

### Left Boundary (First Occurrence / Insert Position)

```
FUNCTION leftBoundary(arr, target):
    left = 0, right = length(arr)   // right is EXCLUSIVE
    WHILE left < right:
        mid = left + (right - left) / 2
        IF arr[mid] < target:
            left = mid + 1
        ELSE:
            right = mid
    RETURN left
```

### Right Boundary (Last Occurrence)

```
FUNCTION rightBoundary(arr, target):
    left = 0, right = length(arr)   // right is EXCLUSIVE
    WHILE left < right:
        mid = left + (right - left) / 2
        IF arr[mid] <= target:
            left = mid + 1
        ELSE:
            right = mid
    RETURN left - 1   // last index where arr[i] == target
```

### Binary Search on Answer

```
FUNCTION binarySearchOnAnswer():
    low = MIN_POSSIBLE_ANSWER
    high = MAX_POSSIBLE_ANSWER
    WHILE low < high:
        mid = low + (high - low) / 2
        IF feasible(mid):
            high = mid   // or low = mid, depending on minimize vs maximize
        ELSE:
            low = mid + 1
    RETURN low
```

## Core Template (Java)

### Classic (Exact Match)

```java
public int classicBinarySearch(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
```

### Left Boundary (First Occurrence / Insert Position)

```java
public int leftBoundary(int[] nums, int target) {
    int left = 0;
    int right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) left = mid + 1;
        else right = mid;
    }
    return left;
}
```

### Right Boundary (Last Occurrence)

```java
public int rightBoundary(int[] nums, int target) {
    int left = 0;
    int right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] <= target) left = mid + 1;
        else right = mid;
    }
    return left - 1;
}
```

### Binary Search on Answer (Minimize)

```java
public int binarySearchOnAnswer(int[] nums, int threshold) {
    int low = 1;
    int high = Integer.MAX_VALUE;
    while (low < high) {
        int mid = low + (high - low) / 2;
        if (feasible(nums, mid, threshold)) high = mid;
        else low = mid + 1;
    }
    return low;
}
```

## Complexity Cheat Sheet

| Variant                | Time       | Space  | Notes                                          |
|------------------------|------------|--------|------------------------------------------------|
| Classic exact          | O(log n)   | O(1)   | `while (left <= right)`                         |
| Left/right boundary    | O(log n)   | O(1)   | `while (left < right)`, right exclusive         |
| Binary search on answer| O(log R)   | O(1)   | R = answer range; each step calls O(n) checker  |
| 2D matrix              | O(log(mn)) | O(1)   | Flatten to 1D index or binary search row+col    |
| Rotated array          | O(log n)   | O(1)   | Compare mid with left/right to find sorted half |
| Mountain array         | O(log n)   | O(1)   | Find peak first, then two searches              |

## Problems (Progressive Difficulty)

### Easy (2 problems)

#### Problem: [Binary Search](https://leetcode.com/problems/binary-search/) (LeetCode #704)

- **Intuition:** Sorted array, find exact target. Classic template: compare `nums[mid]` to `target` and narrow the search space.
- **Brute Force:** Linear scan through the array, comparing each element to the target until a match is found or the end is reached. Time O(n), Space O(1)
- **Optimized Approach:** 1) `left=0`, `right=length-1`. 2) While `left <= right`: compute mid, return mid if match. 3) If `nums[mid] < target`, search right; else search left. 4) Return -1 if not found.
- **Java Solution:**

```java
class Solution {
    public int search(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}
```

- **Complexity:** Time O(log n), Space O(1)

---

#### Problem: [Search Insert Position](https://leetcode.com/problems/search-insert-position/) (LeetCode #35)

- **Brute Force:** Linear scan from left to right, returning the first index where `nums[i] >= target`, or `nums.length` if all elements are smaller. Time O(n), Space O(1)
- **Optimized Approach:** Use left-boundary template: find first index where element is >= target. If all elements are smaller, left ends at `nums.length`.
- **Intuition:** Find the position where we would insert target to keep sorted order—i.e., the leftmost index where `nums[i] >= target`.
- **Java Solution:**

```java
class Solution {
    public int searchInsert(int[] nums, int target) {
        int left = 0;
        int right = nums.length;
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] < target) left = mid + 1;
            else right = mid;
        }
        return left;
    }
}
```

- **Complexity:** Time O(log n), Space O(1)

---

### Medium (6 problems)

#### Problem: [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/) (LeetCode #33)

- **Intuition:** Array is sorted but rotated. At least one half (left or right of mid) is always sorted. Compare target with the sorted half to decide where to search.
- **Brute Force:** Linear scan through the rotated array until the target is found or the end is reached. Time O(n), Space O(1)
- **Optimized Approach:** 1) If `nums[mid] == target`, return mid. 2) If `nums[left] <= nums[mid]`, left half is sorted: search there if target in range, else right. 3) Else right half is sorted: search there if target in range, else left.
- **Java Solution:**

```java
class Solution {
    public int search(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            if (nums[left] <= nums[mid]) {
                if (nums[left] <= target && target < nums[mid])
                    right = mid - 1;
                else
                    left = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[right])
                    left = mid + 1;
                else
                    right = mid - 1;
            }
        }
        return -1;
    }
}
```

- **Complexity:** Time O(log n), Space O(1)

---

#### Problem: [Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/) (LeetCode #153)

- **Intuition:** Minimum is the pivot point. Compare `nums[mid]` with `nums[right]`: if `nums[mid] > nums[right]`, minimum is in right half; else in left half (including mid).
- **Brute Force:** Linear scan to find the first element smaller than its predecessor (the pivot), or return the first element if array is not rotated. Time O(n), Space O(1)
- **Optimized Approach:** 1) While `left < right`: compare mid with right. 2) If mid > right, min is right of mid → `left = mid + 1`. 3) Else min is at mid or left → `right = mid`. 4) Return `nums[left]`.
- **Java Solution:**

```java
class Solution {
    public int findMin(int[] nums) {
        int left = 0;
        int right = nums.length - 1;
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] > nums[right]) left = mid + 1;
            else right = mid;
        }
        return nums[left];
    }
}
```

- **Complexity:** Time O(log n), Space O(1)

---

#### Problem: [Find Peak Element](https://leetcode.com/problems/find-peak-element/) (LeetCode #162)

- **Intuition:** Peak: element greater than both neighbors. Binary search: if `nums[mid] < nums[mid+1]`, there's a peak in the right half (climb right); else in the left half (including mid).
- **Brute Force:** Linear scan checking each index to see if it is greater than both neighbors; return the first peak found. Time O(n), Space O(1)
- **Optimized Approach:** 1) While `left < right`: compute mid. 2) If `nums[mid] < nums[mid+1]`, peak is right → `left = mid + 1`. 3) Else peak is at mid or left → `right = mid`. 4) Return left.
- **Java Solution:**

```java
class Solution {
    public int findPeakElement(int[] nums) {
        int left = 0;
        int right = nums.length - 1;
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] < nums[mid + 1]) left = mid + 1;
            else right = mid;
        }
        return left;
    }
}
```

- **Complexity:** Time O(log n), Space O(1)

---

#### Problem: [Search a 2D Matrix](https://leetcode.com/problems/search-a-2d-matrix/) (LeetCode #74)

- **Intuition:** Rows and columns are sorted; treat as 1D sorted array via `index → row = index/cols, col = index%cols`.
- **Brute Force:** Scan every cell in the matrix row by row until the target is found or the end is reached. Time O(mn), Space O(1)
- **Optimized Approach:** 1) Flatten to `[0, m*n-1]`. 2) Classic binary search. 3) Map mid to (row, col) and compare with target.
- **Java Solution:**

```java
class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        int m = matrix.length;
        int n = matrix[0].length;
        int left = 0;
        int right = m * n - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            int row = mid / n;
            int col = mid % n;
            int val = matrix[row][col];
            if (val == target) return true;
            if (val < target) left = mid + 1;
            else right = mid - 1;
        }
        return false;
    }
}
```

- **Complexity:** Time O(log(mn)), Space O(1)

---

#### Problem: [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/) (LeetCode #875)

- **Intuition:** Binary search on answer: try speed k. For each k, compute hours needed. If feasible (hours ≤ h), try lower k; else try higher.
- **Brute Force:** Try k from 1 to max(piles) in order, compute hours for each k, and return the first k for which hours ≤ h. Time O(max(piles) * n), Space O(1)
- **Optimized Approach:** 1) low=1, high=max(piles). 2) While low < high: mid=k. 3) Sum ceiling(p/mid) for each pile. 4) If hours ≤ h, high=mid; else low=mid+1. 5) Return low.
- **Java Solution:**

```java
class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int low = 1;
        int high = 0;
        for (int p : piles) high = Math.max(high, p);

        while (low < high) {
            int mid = low + (high - low) / 2;
            if (feasible(piles, mid, h)) high = mid;
            else low = mid + 1;
        }
        return low;
    }

    private boolean feasible(int[] piles, int k, int h) {
        long hours = 0;
        for (int p : piles) {
            hours += (p + k - 1) / k;
            if (hours > h) return false;
        }
        return true;
    }
}
```

- **Complexity:** Time O(n log(max(piles))), Space O(1)

---

#### Problem: [Time Based Key-Value Store](https://leetcode.com/problems/time-based-key-value-store/) (LeetCode #981)

- **Intuition:** Store `(timestamp, value)` pairs per key. `get` needs the largest timestamp ≤ given timestamp—binary search on the sorted list of timestamps for that key.
- **Brute Force:** For `get`, linear scan the list of (timestamp, value) pairs from the end backward until finding the largest timestamp ≤ target. Time O(k) per get where k = number of values for key; Space O(n)
- **Optimized Approach:** 1) Map<String, List<Pair>> where Pair = (timestamp, value). 2) set: append to list (timestamps are strictly increasing). 3) get: binary search right-boundary style for largest timestamp ≤ target.
- **Java Solution:**

```java
class TimeMap {
    private final Map<String, List<Pair>> store = new HashMap<>();

    record Pair(int timestamp, String value) {}

    public TimeMap() {}

    public void set(String key, String value, int timestamp) {
        store.computeIfAbsent(key, k -> new ArrayList<>()).add(new Pair(timestamp, value));
    }

    public String get(String key, int timestamp) {
        List<Pair> pairs = store.get(key);
        if (pairs == null || pairs.isEmpty()) return "";
        int left = 0;
        int right = pairs.size();
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (pairs.get(mid).timestamp() <= timestamp)
                left = mid + 1;
            else
                right = mid;
        }
        if (left == 0) return "";
        return pairs.get(left - 1).value();
    }
}
```

- **Complexity:** Time O(1) set, O(log k) get per key with k values; Space O(n)

---

### Hard (3 problems)

#### Problem: [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/) (LeetCode #4)

- **Intuition:** Binary search on the smaller array's partition. Partition both arrays so all left elements ≤ all right elements; median is derived from the partition boundaries.
- **Brute Force:** Merge both arrays into one sorted array (linear merge), then return the median of the merged array. Time O(m+n), Space O(m+n)
- **Optimized Approach:** 1) Ensure nums1 is smaller. 2) Binary search partition in nums1; derive nums2 partition so total left size = (m+n+1)/2. 3) Check maxLeft1 ≤ minRight2 and maxLeft2 ≤ minRight1. 4) If odd: maxLeft; if even: avg of maxLeft and minRight.
- **Java Solution:**

```java
class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) {
            int[] t = nums1; nums1 = nums2; nums2 = t;
        }
        int m = nums1.length, n = nums2.length;
        int half = (m + n + 1) / 2;
        int left = 0, right = m;
        while (left <= right) {
            int i = left + (right - left) / 2;
            int j = half - i;
            int maxLeft1 = i == 0 ? Integer.MIN_VALUE : nums1[i - 1];
            int minRight1 = i == m ? Integer.MAX_VALUE : nums1[i];
            int maxLeft2 = j == 0 ? Integer.MIN_VALUE : nums2[j - 1];
            int minRight2 = j == n ? Integer.MAX_VALUE : nums2[j];
            if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
                int maxLeft = Math.max(maxLeft1, maxLeft2);
                if ((m + n) % 2 == 1) return maxLeft;
                int minRight = Math.min(minRight1, minRight2);
                return (maxLeft + minRight) / 2.0;
            }
            if (maxLeft1 > minRight2) right = i - 1;
            else left = i + 1;
        }
        return 0;
    }
}
```

- **Complexity:** Time O(log(min(m,n))), Space O(1)

---

#### Problem: [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/) (LeetCode #410)

- **Intuition:** Binary search on the answer (max subarray sum). For a given max sum, greedy: pack elements until adding the next would exceed max, then start new subarray. Count splits. If splits ≤ k-1, feasible.
- **Brute Force:** Try all possible partition points (dynamic programming or recursive enumeration) to find the minimum possible largest sum. Time O(n²) or exponential; Space O(n)
- **Optimized Approach:** 1) low = max(nums), high = sum(nums). 2) While low < high: mid = max sum. 3) Greedy count subarrays. 4) If count ≤ k, high = mid; else low = mid + 1. 5) Return low.
- **Java Solution:**

```java
class Solution {
    public int splitArray(int[] nums, int k) {
        int low = 0, high = 0;
        for (int x : nums) {
            low = Math.max(low, x);
            high += x;
        }
        while (low < high) {
            int mid = low + (high - low) / 2;
            if (feasible(nums, mid, k)) high = mid;
            else low = mid + 1;
        }
        return low;
    }

    private boolean feasible(int[] nums, int maxSum, int k) {
        int count = 1;
        int sum = 0;
        for (int x : nums) {
            if (sum + x > maxSum) {
                count++;
                sum = x;
            } else {
                sum += x;
            }
        }
        return count <= k;
    }
}
```

- **Complexity:** Time O(n log(sum)), Space O(1)

---

#### Problem: [Find in Mountain Array](https://leetcode.com/problems/find-in-mountain-array/) (LeetCode #1095)

- **Intuition:** Mountain: strictly increasing then strictly decreasing. Find peak with binary search; then binary search left half (ascending), then right half (descending) if not found. Return minimum index.
- **Brute Force:** Linear scan through the mountain array, calling `get(i)` for each index until the target is found. Time O(n), Space O(1)
- **Optimized Approach:** 1) Binary search for peak: nums[i] < nums[i+1] → search right. 2) Binary search left [0, peak] ascending. 3) If found, return. 4) Binary search right [peak, n) descending. 5) Return -1 if not found.
- **Java Solution:**

```java
/**
 * // This is MountainArray's API interface.
 * // You should not implement it, or speculate about its implementation
 * interface MountainArray {
 *     public int get(int index) {}
 *     public int length() {}
 * }
 */
class Solution {
    public int findInMountainArray(int target, MountainArray mountainArr) {
        int n = mountainArr.length();
        int peak = findPeak(mountainArr, n);
        int left = binarySearchLeft(mountainArr, target, 0, peak);
        if (left != -1) return left;
        return binarySearchRight(mountainArr, target, peak, n - 1);
    }

    private int findPeak(MountainArray arr, int n) {
        int left = 0, right = n - 1;
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (arr.get(mid) < arr.get(mid + 1)) left = mid + 1;
            else right = mid;
        }
        return left;
    }

    private int binarySearchLeft(MountainArray arr, int target, int left, int right) {
        while (left <= right) {
            int mid = left + (right - left) / 2;
            int val = arr.get(mid);
            if (val == target) return mid;
            if (val < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    private int binarySearchRight(MountainArray arr, int target, int left, int right) {
        while (left <= right) {
            int mid = left + (right - left) / 2;
            int val = arr.get(mid);
            if (val == target) return mid;
            if (val > target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}
```

- **Complexity:** Time O(log n), Space O(1). Note: Limit 100 `get()` calls—three binary searches use ~3*log(n) ≈ 27 for n=10^4.

---

## Common Mistakes & Edge Cases

- **`left + (right - left) / 2` vs `(left + right) / 2`:** Use the former to avoid integer overflow when left+right is large.
- **Classic: `left <= right` vs `left < right`:** For exact match, use `<=` so the last element is checked. For boundary search, use `left < right` with right exclusive.
- **Left boundary: `right = mid` vs `right = mid - 1`:** Use `right = mid` when you want to keep mid as a candidate (insert position / first occurrence).
- **Right boundary: return `left - 1`** after searching for first index where element > target.
- **Rotated array:** Check which half is sorted by comparing `nums[left]` with `nums[mid]` (or `nums[mid]` with `nums[right]`).
- **Empty input:** Handle `nums.length == 0`, `matrix.length == 0`.
- **Single element:** Peak problem: single element is a valid peak.
- **Binary search on answer:** Ensure `feasible()` handles edge values; use `low < high` with `high = mid` for minimize.
- **Median of Two Arrays:** Ensure nums1 is the smaller array; handle partition at 0 and at length.
- **Mountain Array:** Minimize `get()` calls—cache `arr.get(mid)` instead of calling twice.

## Pattern Variations

| Variation               | Example                           | Key Technique                                   |
|-------------------------|-----------------------------------|-------------------------------------------------|
| Classic exact           | Binary Search #704                | `while (left <= right)`, return mid or -1       |
| Left boundary           | Search Insert #35                 | First index where `>= target`                   |
| Right boundary          | Last occurrence, TimeMap #981     | Last index where `<= target`                    |
| Rotated sorted          | #33, #153                         | Compare mid with endpoints, find sorted half    |
| Peak finding            | #162, #1095                       | Compare mid with neighbor, climb toward peak   |
| 2D matrix               | #74                               | Flatten index or search row then col            |
| Binary search on answer | #875, #410                        | Feasible check, minimize/maximize threshold     |
| Two arrays              | #4                                | Partition both, binary search on smaller        |
| Interactive (API)       | #1095                             | Minimize API calls, cache get() results         |
