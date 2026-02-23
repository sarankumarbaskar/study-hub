# Prefix Sum

> Precompute cumulative sums so any subarray sum becomes O(1) lookup—transform repeated range queries into constant-time operations.

## What Is This Pattern?

**Prefix sum** (also called cumulative sum or running sum) is a preprocessing technique that stores the sum of elements from the start of the array up to each index. Given `arr[0..n-1]`, we build `prefix[i] = arr[0] + arr[1] + ... + arr[i]` (often with `prefix[-1] = 0` for convenience).

Once built, the sum of any subarray `arr[i..j]` is `prefix[j] - prefix[i-1]`—a single subtraction. Instead of iterating over the subarray every time, we answer in O(1). This is especially powerful when you need many range sum queries or when searching for subarrays with a target sum (by rearranging to `prefix[j] - prefix[i-1] = k` → `prefix[j] - k = prefix[i-1]`, then using a hash map to count valid pairs).

**Visual intuition:** Imagine a bar chart where each bar's height is the cumulative total. The "height difference" between two bars equals the sum of the segment between them. Prefix sum captures those cumulative heights up-front; any "segment sum" is just the difference between two stored values.

## When to Use This Pattern

- **Repeated range sum queries** on an immutable array (e.g., "sum from left to right")
- **Subarray sum equals K** (or divisible by K) — convert to "count pairs where prefix[j] - prefix[i] = k"
- **Find pivot / equilibrium index** — left sum vs right sum; prefix sum gives both in O(1)
- **Product of array except self** — prefix product (or prefix × suffix) avoids recomputation
- **Subarray problems** where you need to check "does any subarray have property X?" and property X involves a cumulative metric
- **Merge sort + prefix sum** for problems like "count pairs where lower ≤ sum ≤ upper" (e.g., Count of Range Sum)

## How to Identify This Pattern

1. Problem asks for **sum/product of a contiguous subarray** or **range query**
2. Keywords: "subarray sum", "range sum", "cumulative", "prefix", "running sum"
3. Need to answer **many queries** on the same array without modification
4. Looking for **count of subarrays** with a given sum, or **pivot/equilibrium** index
5. Often pairs with **hash map** when counting "prefix[j] - k = prefix[i]" occurrences

## Core Template (Pseudocode)

```
// Build prefix sum array (1-indexed for convenience)
prefix[0] = 0
for i from 0 to n-1:
    prefix[i+1] = prefix[i] + arr[i]

// Query: sum of arr[left..right]
sum = prefix[right+1] - prefix[left]

// Count subarrays with sum K (hash map variant)
count = 0
map = {0: 1}  // prefix 0 seen once (empty subarray)
for each prefix_sum in prefixes:
    count += map.get(prefix_sum - K, 0)
    map[prefix_sum] = map.get(prefix_sum, 0) + 1
return count
```

## Core Template (Java)

```java
// Build prefix sum array
int[] prefix = new int[n + 1];
for (int i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
}

// Query: sum of nums[left..right]
int rangeSum = prefix[right + 1] - prefix[left];

// Count subarrays with sum K (using HashMap)
Map<Integer, Integer> countByPrefix = new HashMap<>();
countByPrefix.put(0, 1);
int count = 0, prefixSum = 0;
for (int num : nums) {
    prefixSum += num;
    count += countByPrefix.getOrDefault(prefixSum - k, 0);
    countByPrefix.merge(prefixSum, 1, Integer::sum);
}
```

## Complexity Cheat Sheet

| Operation | Time | Space |
|-----------|------|-------|
| Build prefix array | O(n) | O(n) |
| Single range query | O(1) | - |
| m range queries | O(n + m) | O(n) |
| Subarray sum = K (hash) | O(n) | O(n) |
| Count of range sum (merge) | O(n log n) | O(n) |

---

## Problems (Progressive Difficulty)

### Easy (2 problems)

#### Problem: [Running Sum of 1d Array](https://leetcode.com/problems/running-sum-of-1d-array/) (LeetCode #1480)

- **Intuition:** Each element of the result is the sum of all elements from index 0 to the current index—exactly the definition of prefix sum.
- **Brute Force:** For each index i, iterate from 0 to i and sum all elements. Time O(n²), Space O(1) for in-place output.
- **Optimized Approach:** Initialize `runningSum[0] = nums[0]`. For each `i > 0`, set `runningSum[i] = runningSum[i-1] + nums[i]`. Can be done in-place.
- **Java Solution:**

```java
class Solution {
    public int[] runningSum(int[] nums) {
        for (int i = 1; i < nums.length; i++) {
            nums[i] += nums[i - 1];
        }
        return nums;
    }
}
```

- **Complexity:** Time O(n), Space O(1) in-place (O(n) if output must be separate)

---

#### Problem: [Range Sum Query - Immutable](https://leetcode.com/problems/range-sum-query-immutable/) (LeetCode #303)

- **Intuition:** Precompute prefix sums so any range `[left, right]` is `prefix[right+1] - prefix[left]` in O(1).
- **Brute Force:** For each query, iterate from left to right and sum elements. Time O(n) per query, Space O(1).
- **Optimized Approach:** In constructor, build `prefix[i] = sum of nums[0..i-1]`. For `sumRange(left, right)`, return `prefix[right+1] - prefix[left]`.
- **Java Solution:**

```java
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

- **Complexity:** Time O(n) preprocess, O(1) per query; Space O(n)

---

### Medium (5 problems)

#### Problem: [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) (LeetCode #560)

- **Intuition:** Subarray `nums[i..j]` has sum `prefix[j+1] - prefix[i] = k`. Rearranging: `prefix[j+1] - k = prefix[i]`. So for each prefix, count how many previous prefixes equal `prefix - k`.
- **Brute Force:** For each pair (i, j), compute sum of nums[i..j] and count if equals k. Time O(n²), Space O(1).
- **Optimized Approach:** Use a hash map to store prefix sum frequencies. For each position, add `nums[i]` to running prefix, then add `count(prefix - k)` to the answer and increment `count(prefix)`.
- **Java Solution:**

```java
class Solution {
    public int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> countByPrefix = new HashMap<>();
        countByPrefix.put(0, 1);
        int count = 0, prefixSum = 0;
        for (int num : nums) {
            prefixSum += num;
            count += countByPrefix.getOrDefault(prefixSum - k, 0);
            countByPrefix.merge(prefixSum, 1, Integer::sum);
        }
        return count;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

#### Problem: [Contiguous Array](https://leetcode.com/problems/contiguous-array/) (LeetCode #525)

- **Intuition:** Replace 0 with -1 so "equal 0s and 1s" means subarray sum = 0. Use prefix sum + hash map: longest subarray with sum 0 is `max(j - i)` where `prefix[j] = prefix[i]`.
- **Brute Force:** For each pair (i, j), check if subarray has equal 0s and 1s by counting. Time O(n²), Space O(1).
- **Optimized Approach:** Map prefix sum to first index seen. When we see a prefix again, the distance from first occurrence is the length of a valid subarray. Track the maximum.
- **Java Solution:**

```java
class Solution {
    public int findMaxLength(int[] nums) {
        Map<Integer, Integer> firstIdx = new HashMap<>();
        firstIdx.put(0, -1);
        int maxLen = 0, prefix = 0;
        for (int i = 0; i < nums.length; i++) {
            prefix += nums[i] == 1 ? 1 : -1;
            if (firstIdx.containsKey(prefix)) {
                maxLen = Math.max(maxLen, i - firstIdx.get(prefix));
            } else {
                firstIdx.put(prefix, i);
            }
        }
        return maxLen;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

#### Problem: [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) (LeetCode #238)

- **Intuition:** For each index `i`, we need product of all elements except `nums[i]`. That's `(prefix product before i) × (suffix product after i)`. Use prefix and suffix product arrays.
- **Brute Force:** For each index i, compute product of all elements except nums[i] by iterating through the array. Time O(n²), Space O(1) excluding output.
- **Optimized Approach:** Build `left[i] = product of nums[0..i-1]` and `right[i] = product of nums[i+1..n-1]`. Result `ans[i] = left[i] * right[i]`. Can optimize to O(1) extra space by computing result in one pass using running prefix, then a second pass with running suffix.
- **Java Solution:**

```java
class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] ans = new int[n];
        ans[0] = 1;
        for (int i = 1; i < n; i++) {
            ans[i] = ans[i - 1] * nums[i - 1];
        }
        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            ans[i] *= suffix;
            suffix *= nums[i];
        }
        return ans;
    }
}
```

- **Complexity:** Time O(n), Space O(1) excluding output

---

#### Problem: [Find Pivot Index](https://leetcode.com/problems/find-pivot-index/) (LeetCode #724)

- **Intuition:** Pivot index `i` satisfies: sum of elements left of `i` = sum of elements right of `i`. With prefix sum, left sum = `prefix[i]`, total = `prefix[n]`; right sum = `prefix[n] - prefix[i+1]`. So `prefix[i] == prefix[n] - prefix[i+1]` → `2 * prefix[i] = prefix[n] - nums[i]`, or equivalently `prefix[i] + nums[i] = prefix[n] - prefix[i]`.
- **Brute Force:** For each index i, compute left sum and right sum by iterating through both sides. Time O(n²), Space O(1).
- **Optimized Approach:** Build full prefix, then iterate. At index `i`, left sum = `prefix[i]`, right sum = `total - prefix[i] - nums[i]`. If equal, return `i`. Alternatively, iterate with running left sum and compute right from total.
- **Java Solution:**

```java
class Solution {
    public int pivotIndex(int[] nums) {
        int total = 0;
        for (int num : nums) total += num;
        int leftSum = 0;
        for (int i = 0; i < nums.length; i++) {
            if (leftSum == total - leftSum - nums[i]) return i;
            leftSum += nums[i];
        }
        return -1;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Subarray Sums Divisible by K](https://leetcode.com/problems/subarray-sums-divisible-by-k/) (LeetCode #974)

- **Intuition:** Subarray sum divisible by K means `(prefix[j] - prefix[i]) % K == 0` → `prefix[j] % K == prefix[i] % K`. Count pairs of indices with the same prefix mod K.
- **Brute Force:** For each pair (i, j), compute subarray sum and check if divisible by K. Time O(n²), Space O(1).
- **Optimized Approach:** Use prefix sum mod K. Handle negatives: `(prefix % K + K) % K`. Count frequencies of each remainder; for each remainder `r` with count `c`, add `c*(c-1)/2` pairs. Include empty prefix: `count[0] = 1` initially.
- **Java Solution:**

```java
class Solution {
    public int subarraysDivByK(int[] nums, int k) {
        int[] count = new int[k];
        count[0] = 1;
        int prefix = 0, ans = 0;
        for (int num : nums) {
            prefix = ((prefix + num) % k + k) % k;
            ans += count[prefix];
            count[prefix]++;
        }
        return ans;
    }
}
```

- **Complexity:** Time O(n), Space O(k)

---

### Hard (2 problems)

#### Problem: [Count of Range Sum](https://leetcode.com/problems/count-of-range-sum/) (LeetCode #327)

- **Intuition:** For each prefix sum `prefix[j]`, we need count of `prefix[i]` (i < j) such that `lower ≤ prefix[j] - prefix[i] ≤ upper` → `prefix[j] - upper ≤ prefix[i] ≤ prefix[j] - lower`. Use merge sort on prefix array: when merging, for each element in right half, count elements in left half in the range `[prefix[j]-upper, prefix[j]-lower]` using binary search or two pointers.
- **Brute Force:** For each pair (i, j), compute prefix[j]-prefix[i] and count if in [lower, upper]. Time O(n²), Space O(n) for prefix array.
- **Optimized Approach:** Build prefix array. Implement merge sort that counts valid pairs during merge: for each `right[j]`, find count of `left` elements in `[right[j]-upper, right[j]-lower]` (left subarray is sorted). Add to result. Merge and return.
- **Java Solution:**

```java
class Solution {
    private int lower, upper;

    public int countRangeSum(int[] nums, int lower, int upper) {
        this.lower = lower;
        this.upper = upper;
        int n = nums.length;
        long[] prefix = new long[n + 1];
        for (int i = 0; i < n; i++) {
            prefix[i + 1] = prefix[i] + nums[i];
        }
        return mergeSort(prefix, 0, n);
    }

    private int mergeSort(long[] prefix, int lo, int hi) {
        if (lo >= hi) return 0;
        int mid = lo + (hi - lo) / 2;
        int count = mergeSort(prefix, lo, mid) + mergeSort(prefix, mid + 1, hi);

        int i = lo, j1 = mid + 1, j2 = mid + 1;
        for (; i <= mid; i++) {
            while (j1 <= hi && prefix[j1] - prefix[i] < lower) j1++;
            while (j2 <= hi && prefix[j2] - prefix[i] <= upper) j2++;
            count += j2 - j1;
        }

        merge(prefix, lo, mid, hi);
        return count;
    }

    private void merge(long[] prefix, int lo, int mid, int hi) {
        long[] tmp = new long[hi - lo + 1];
        int i = lo, j = mid + 1, k = 0;
        while (i <= mid && j <= hi) {
            if (prefix[i] <= prefix[j]) tmp[k++] = prefix[i++];
            else tmp[k++] = prefix[j++];
        }
        while (i <= mid) tmp[k++] = prefix[i++];
        while (j <= hi) tmp[k++] = prefix[j++];
        System.arraycopy(tmp, 0, prefix, lo, tmp.length);
    }
}
```

- **Complexity:** Time O(n log n), Space O(n)

---

#### Problem: [Maximum Sum of 3 Non-Overlapping Subarrays](https://leetcode.com/problems/maximum-sum-of-3-non-overlapping-subarrays/) (LeetCode #689)

- **Intuition:** We need three non-overlapping subarrays of length `k` with maximum total sum. Fix the middle subarray at some position; then choose best left subarray (before it) and best right subarray (after it). Prefix sum gives each subarray sum in O(1).
- **Brute Force:** Try all combinations of 3 non-overlapping windows of size k; for each triple compute sum and track maximum. Time O(n²), Space O(n).
- **Optimized Approach:** (1) Build `windowSum[i] = sum of nums[i..i+k-1]` using prefix sum. (2) Build `leftBest[i]` = index of best window in `[0..i]`. (3) Build `rightBest[i]` = index of best window in `[i..n-k]`. (4) For each middle start index `i` from `k` to `n-2k`, compute total = windowSum[leftBest[i-1]] + windowSum[i] + windowSum[rightBest[i+k]], track max and indices.
- **Java Solution:**

```java
class Solution {
    public int[] maxSumOfThreeSubarrays(int[] nums, int k) {
        int n = nums.length;
        int[] prefix = new int[n + 1];
        for (int i = 0; i < n; i++) {
            prefix[i + 1] = prefix[i] + nums[i];
        }

        int[] windowSum = new int[n - k + 1];
        for (int i = 0; i < windowSum.length; i++) {
            windowSum[i] = prefix[i + k] - prefix[i];
        }

        int[] leftBest = new int[windowSum.length];
        int bestIdx = 0;
        for (int i = 0; i < leftBest.length; i++) {
            if (windowSum[i] > windowSum[bestIdx]) bestIdx = i;
            leftBest[i] = bestIdx;
        }

        int[] rightBest = new int[windowSum.length];
        bestIdx = windowSum.length - 1;
        for (int i = windowSum.length - 1; i >= 0; i--) {
            if (windowSum[i] >= windowSum[bestIdx]) bestIdx = i;
            rightBest[i] = bestIdx;
        }

        int maxSum = 0;
        int[] ans = new int[3];
        for (int i = k; i <= n - 2 * k; i++) {
            int left = leftBest[i - 1], right = rightBest[i + k];
            int total = windowSum[left] + windowSum[i] + windowSum[right];
            if (total > maxSum) {
                maxSum = total;
                ans[0] = left;
                ans[1] = i;
                ans[2] = right;
            }
        }
        return ans;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

## Common Mistakes & Edge Cases

- **Off-by-one:** Prefix `prefix[i]` typically means sum of `nums[0..i-1]`, so `nums[i..j]` sum = `prefix[j+1] - prefix[i]`. Be consistent with 0- vs 1-indexing.
- **Negative modulo (Java):** `-5 % 3 == -2`. Use `(x % k + k) % k` for non-negative remainder.
- **Empty subarray:** For "count subarrays with sum K", initialize `map.put(0, 1)`—the empty prefix represents the subarray starting at index 0.
- **Integer overflow:** For large arrays or large values, use `long` for prefix sums (e.g., Count of Range Sum).
- **Mutable vs immutable:** If the array can change between queries, prefix sum must be rebuilt; consider a Fenwick tree or segment tree instead for dynamic updates.

## Pattern Variations

- **Prefix product:** Same idea as prefix sum but with multiplication (e.g., Product of Array Except Self).
- **Prefix sum + hash map:** Count subarrays with given sum/remainder—"how many previous prefixes satisfy X?"
- **Prefix sum + binary search:** When the array is sorted or when you need to find bounds (e.g., lower_bound on prefix).
- **2D prefix sum:** For matrix range queries, build `prefix[i][j] = sum of rectangle (0,0) to (i-1,j-1)`; query `[r1,c1] to [r2,c2]` = `prefix[r2+1][c2+1] - prefix[r1][c2+1] - prefix[r2+1][c1] + prefix[r1][c1]`.
- **Merge sort on prefix:** For "count pairs where lower ≤ diff ≤ upper" (Count of Range Sum), merge sort partitions and counts during merge.
