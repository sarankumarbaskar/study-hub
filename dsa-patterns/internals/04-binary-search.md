# Binary Search — Interview Execution Playbook

## 1. Pattern Recognition Signals

### When to Use Binary Search

| Signal | Example |
|--------|---------|
| Input is **sorted** or has monotonic structure | Sorted array, rotated sorted array, mountain array |
| Problem asks for **first/last occurrence** | "Find first position of element" |
| Problem asks for **minimum/maximum value satisfying a condition** | "Minimum speed to finish in h hours" |
| A **yes/no predicate** flips exactly once across the search space | `canFinish(speed)` goes from false→true |
| **O(log n)** is required or hinted | Constraints say n ≤ 10^9 but time limit is tight |

### Keywords That Scream Binary Search

`sorted`, `ascending`, `descending`, `rotated`, `minimum rate`, `maximum minimum`, `capacity`, `split into k`, `search`, `insert position`, `peak`, `feasible`

### When NOT to Use

- Input is **unsorted** and there's no monotonic predicate on the answer space
- Problem requires visiting **all elements** (e.g., sum of array)
- The search space doesn't have a clear **partition property** (left side all false, right side all true, or vice versa)
- You need to find **all occurrences**, not just one boundary

---

## 2. Thinking Framework

### 60-Second Decision Process

```
1. Is input sorted / does a monotonic property exist?
   → YES: Binary search directly on indices
   → NO: Can I binary search on the ANSWER itself?
         → Define predicate: "Can we achieve X?"
         → If predicate is monotonic → Binary search on answer space

2. What am I searching for?
   → Exact value         → Classic (lo <= hi)
   → First true / lower bound → Left boundary (lo < hi, hi = mid)
   → Last true / upper bound  → Right boundary (lo < hi, lo = mid + 1)
   → Min answer that works    → Search on answer (lo < hi, hi = mid)
   → Max answer that works    → Search on answer (lo < hi, lo = mid)

3. Define the invariant:
   → What is ALWAYS true about lo? About hi?
   → Example: "lo is always too small" and "hi is always feasible"
```

### Brute → Optimal Progression

| Stage | Approach | Complexity |
|-------|----------|------------|
| Brute | Linear scan / try all values | O(n) or O(n × range) |
| Optimal | Binary search | O(log n) or O(n × log range) |

### Core Insight

> **Eliminate half the search space with each comparison.** This works whenever a **monotonic property** exists: some condition that is `false` for all values below a threshold and `true` for all values above it (or vice versa). Your job is to find that boundary.

### Invariant-Based Thinking

Instead of memorizing templates, think in terms of **loop invariants**:
- `lo` is always in the "not yet good enough" region (or last known good)
- `hi` is always in the "still a candidate" region (or first known bad)
- The answer lives at the boundary where the invariant flips

This mental model prevents off-by-one errors and tells you exactly how to update `lo` and `hi`.

---

## 3. Java Templates

### Template 1: Standard Binary Search (Exact Match)

```java
// Find exact target in sorted array. Returns index or -1.
// TIME: O(log n) | SPACE: O(1)
public int binarySearch(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;  // avoids integer overflow
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
```

**Key points:**
- `lo <= hi` because when `lo == hi` there's still one unchecked element
- Both `lo` and `hi` move past `mid` → no infinite loop risk
- Terminates with `lo = hi + 1` (search space empty)

---

### Template 2: Lower Bound / First Occurrence

```java
// Find first index where nums[i] >= target (insert position).
// If target exists, returns index of first occurrence.
// TIME: O(log n) | SPACE: O(1)
public int lowerBound(int[] nums, int target) {
    int lo = 0, hi = nums.length;  // hi is EXCLUSIVE (can be the insert-at-end position)
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;  // left-biased mid
        if (nums[mid] < target) lo = mid + 1;
        else hi = mid;  // mid is a candidate, don't skip it
    }
    return lo;  // lo == hi == first index where nums[i] >= target
}
```

**Key points:**
- `lo < hi` (not `<=`) because `lo == hi` means we've converged
- `hi = mid` (not `mid - 1`) because `mid` might be the answer
- Left-biased mid: `lo + (hi - lo) / 2` rounds down → guarantees `mid < hi` → no infinite loop

---

### Template 3: Upper Bound / Last Occurrence

```java
// Find last index where nums[i] <= target.
// Returns -1 if all elements > target.
// TIME: O(log n) | SPACE: O(1)
public int upperBound(int[] nums, int target) {
    int lo = 0, hi = nums.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] <= target) lo = mid + 1;
        else hi = mid;
    }
    return lo - 1;  // lo is first index where nums[i] > target; lo-1 is last <=
}
```

**Key points:**
- This finds the first index where `nums[i] > target`, then subtracts 1
- Equivalent to C++ `upper_bound() - 1`
- Check `lo - 1 >= 0` and `nums[lo-1] == target` if you need exact match confirmation

---

### Template 4: Binary Search on Answer Space

```java
// Find minimum value in [lo, hi] such that feasible(value) is true.
// Predicate must be monotonic: false,false,...,false,true,true,...,true
// TIME: O(n × log(range)) | SPACE: O(1)
public int binarySearchOnAnswer(int[] data, int constraint) {
    int lo = MIN_POSSIBLE;   // smallest candidate answer
    int hi = MAX_POSSIBLE;   // largest candidate answer
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (feasible(data, mid, constraint)) {
            hi = mid;        // mid works, but maybe something smaller works too
        } else {
            lo = mid + 1;    // mid doesn't work, need bigger
        }
    }
    return lo;  // smallest feasible answer
}

private boolean feasible(int[] data, int candidateAnswer, int constraint) {
    // Problem-specific: can we satisfy constraint with this candidate?
    // e.g., "can Koko finish with speed=candidateAnswer in h hours?"
    return true; // placeholder
}
```

**Key points:**
- Answer space must have **monotonic feasibility** (once feasible, always feasible for larger values)
- For "maximize answer": flip the predicate or use `lo = mid` with right-biased mid
- `lo` and `hi` are answer bounds, NOT array indices

---

### Template 5: Search in Rotated Sorted Array

```java
// Find target in rotated sorted array (no duplicates). Returns index or -1.
// TIME: O(log n) | SPACE: O(1)
public int searchRotated(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;

        if (nums[lo] <= nums[mid]) {
            // Left half [lo..mid] is sorted
            if (nums[lo] <= target && target < nums[mid]) {
                hi = mid - 1;  // target is in sorted left half
            } else {
                lo = mid + 1;  // target is in right half
            }
        } else {
            // Right half [mid..hi] is sorted
            if (nums[mid] < target && target <= nums[hi]) {
                lo = mid + 1;  // target is in sorted right half
            } else {
                hi = mid - 1;  // target is in left half
            }
        }
    }
    return -1;
}
```

**Key points:**
- At least one half is always sorted — identify which one
- `nums[lo] <= nums[mid]` uses `<=` to handle the case where `lo == mid`
- Once you identify the sorted half, check if target falls in its range
- With duplicates (LC #81): when `nums[lo] == nums[mid]`, do `lo++` (degrades to O(n) worst case)

---

## 4. Edge Case Checklist

| Edge Case | How to Handle |
|-----------|---------------|
| **Empty array** | Return -1 or 0 before entering loop |
| **Single element** | Loop handles it if bounds are correct |
| **Target smaller than all elements** | Lower bound returns 0; classic returns -1 |
| **Target larger than all elements** | Lower bound returns `nums.length`; classic returns -1 |
| **All elements identical** | Lower bound finds leftmost; upper bound finds rightmost |
| **Integer overflow in mid** | ALWAYS use `lo + (hi - lo) / 2`, never `(lo + hi) / 2` |
| **Answer space includes 0** | Ensure `lo` starts at 0, not 1 |
| **Answer space is very large** | Use `long` for `lo`, `hi`, and `mid` |
| **Rotated array not actually rotated** | `nums[lo] <= nums[mid]` still works (entire array is "left sorted half") |
| **Feasibility check with large sums** | Use `long` inside feasible() to avoid overflow |
| **Off-by-one at boundaries** | Test with array of size 1, target at first/last position |

---

## 5. Problem Progression

### Solving Order

> Level 1 → Level 2 → Level 3 → Level 4. Within each level, solve in listed order.

---

### Level 1: Easy (Foundation)

| # | Problem | Key Insight | Target Time |
|---|---------|-------------|-------------|
| 704 | [Binary Search](https://leetcode.com/problems/binary-search/) | Pure classic template; `lo <= hi`, return mid on match | 3 min |
| 35 | [Search Insert Position](https://leetcode.com/problems/search-insert-position/) | Lower bound template; first index where `nums[i] >= target` | 5 min |

**LC 704 — Binary Search:**
```java
class Solution {
    // TIME: O(log n) | SPACE: O(1)
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }
}
```

**LC 35 — Search Insert Position:**
```java
class Solution {
    // TIME: O(log n) | SPACE: O(1)
    public int searchInsert(int[] nums, int target) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
```

---

### Level 2: Medium (Core Patterns)

| # | Problem | Key Insight | Target Time |
|---|---------|-------------|-------------|
| 34 | [Find First and Last Position](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/) | Run lower bound + upper bound separately | 8 min |
| 33 | [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/) | Identify which half is sorted, check if target is in that range | 10 min |
| 153 | [Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/) | Compare `nums[mid]` with `nums[hi]`; min is where sorted order breaks | 8 min |
| 875 | [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/) | Binary search on answer; feasible = total hours ≤ h | 12 min |

**LC 34 — Find First and Last Position:**
```java
class Solution {
    // TIME: O(log n) | SPACE: O(1)
    public int[] searchRange(int[] nums, int target) {
        int first = lowerBound(nums, target);
        if (first == nums.length || nums[first] != target) return new int[]{-1, -1};
        int last = lowerBound(nums, target + 1) - 1;
        return new int[]{first, last};
    }

    private int lowerBound(int[] nums, int target) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
```

**LC 33 — Search in Rotated Sorted Array:**
```java
class Solution {
    // TIME: O(log n) | SPACE: O(1)
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
}
```

**LC 153 — Find Minimum in Rotated Sorted Array:**
```java
class Solution {
    // TIME: O(log n) | SPACE: O(1)
    public int findMin(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1;  // min is in right half
            else hi = mid;                            // mid could be the min
        }
        return nums[lo];
    }
}
```

**LC 875 — Koko Eating Bananas:**
```java
class Solution {
    // TIME: O(n × log(max(piles))) | SPACE: O(1)
    public int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = Math.max(hi, p);

        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (canFinish(piles, mid, h)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    private boolean canFinish(int[] piles, int speed, int h) {
        long hours = 0;
        for (int p : piles) {
            hours += (p + speed - 1) / speed;  // ceiling division
            if (hours > h) return false;
        }
        return true;
    }
}
```

---

### Level 3: Tricky (Pattern Combinations)

| # | Problem | Key Insight | Target Time |
|---|---------|-------------|-------------|
| 1011 | [Capacity to Ship Packages](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/) | Binary search on answer; lo = max(weights), hi = sum(weights); greedy feasibility | 15 min |
| 162 | [Find Peak Element](https://leetcode.com/problems/find-peak-element/) | Gradient ascent via binary search; move toward the higher neighbor | 10 min |
| 410 | [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/) | Same framework as 1011; binary search on max-sum, greedy split check | 15 min |

**LC 1011 — Capacity to Ship Packages:**
```java
class Solution {
    // TIME: O(n × log(sum - max)) | SPACE: O(1)
    public int shipWithinDays(int[] weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) {
            lo = Math.max(lo, w);  // must carry heaviest single package
            hi += w;               // carry everything in one day
        }

        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (canShip(weights, mid, days)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    private boolean canShip(int[] weights, int capacity, int days) {
        int daysNeeded = 1, currentLoad = 0;
        for (int w : weights) {
            if (currentLoad + w > capacity) {
                daysNeeded++;
                currentLoad = w;
                if (daysNeeded > days) return false;
            } else {
                currentLoad += w;
            }
        }
        return true;
    }
}
```

**LC 162 — Find Peak Element:**
```java
class Solution {
    // TIME: O(log n) | SPACE: O(1)
    public int findPeakElement(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < nums[mid + 1]) lo = mid + 1;  // peak is to the right
            else hi = mid;                                  // mid could be peak
        }
        return lo;
    }
}
```

**LC 410 — Split Array Largest Sum:**
```java
class Solution {
    // TIME: O(n × log(sum - max)) | SPACE: O(1)
    public int splitArray(int[] nums, int k) {
        int lo = 0, hi = 0;
        for (int x : nums) {
            lo = Math.max(lo, x);
            hi += x;
        }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (canSplit(nums, mid, k)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    private boolean canSplit(int[] nums, int maxSum, int k) {
        int parts = 1, currentSum = 0;
        for (int x : nums) {
            if (currentSum + x > maxSum) {
                parts++;
                currentSum = x;
                if (parts > k) return false;
            } else {
                currentSum += x;
            }
        }
        return true;
    }
}
```

---

### Level 4: Hard (Interview Differentiators)

| # | Problem | Key Insight | Target Time |
|---|---------|-------------|-------------|
| 4 | [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/) | Binary search on partition of smaller array; balance left/right halves | 20 min |
| 1095 | [Find in Mountain Array](https://leetcode.com/problems/find-in-mountain-array/) | Find peak, then binary search ascending half, then descending half | 18 min |

**LC 4 — Median of Two Sorted Arrays:**
```java
class Solution {
    // TIME: O(log(min(m, n))) | SPACE: O(1)
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) {
            int[] tmp = nums1; nums1 = nums2; nums2 = tmp;
        }
        int m = nums1.length, n = nums2.length;
        int halfLen = (m + n + 1) / 2;

        int lo = 0, hi = m;
        while (lo <= hi) {
            int i = lo + (hi - lo) / 2;  // partition in nums1
            int j = halfLen - i;          // partition in nums2

            int maxLeft1  = (i == 0) ? Integer.MIN_VALUE : nums1[i - 1];
            int minRight1 = (i == m) ? Integer.MAX_VALUE : nums1[i];
            int maxLeft2  = (j == 0) ? Integer.MIN_VALUE : nums2[j - 1];
            int minRight2 = (j == n) ? Integer.MAX_VALUE : nums2[j];

            if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
                int maxLeft = Math.max(maxLeft1, maxLeft2);
                if ((m + n) % 2 == 1) return maxLeft;
                int minRight = Math.min(minRight1, minRight2);
                return (maxLeft + minRight) / 2.0;
            } else if (maxLeft1 > minRight2) {
                hi = i - 1;
            } else {
                lo = i + 1;
            }
        }
        return 0.0;
    }
}
```

**LC 1095 — Find in Mountain Array:**
```java
class Solution {
    // TIME: O(log n) | SPACE: O(1)
    public int findInMountainArray(int target, MountainArray arr) {
        int n = arr.length();
        int peak = findPeak(arr, n);

        int result = searchAscending(arr, target, 0, peak);
        if (result != -1) return result;
        return searchDescending(arr, target, peak + 1, n - 1);
    }

    private int findPeak(MountainArray arr, int n) {
        int lo = 0, hi = n - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr.get(mid) < arr.get(mid + 1)) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    private int searchAscending(MountainArray arr, int target, int lo, int hi) {
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            int val = arr.get(mid);
            if (val == target) return mid;
            else if (val < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }

    private int searchDescending(MountainArray arr, int target, int lo, int hi) {
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            int val = arr.get(mid);
            if (val == target) return mid;
            else if (val > target) lo = mid + 1;  // descending: bigger values on left
            else hi = mid - 1;
        }
        return -1;
    }
}
```

---

## 6. Common Mistakes & Interview Traps

### Off-by-One Errors

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Using `lo <= hi` with `hi = mid` | **Infinite loop** when `lo == hi == mid` | Use `lo < hi` with `hi = mid` |
| Using `lo < hi` with `hi = mid - 1` | **Skips valid candidates** | Use `hi = mid` when mid could be the answer |
| Returning `lo` when you need `lo - 1` | Wrong answer for "last occurrence" | Think about what `lo` represents at termination |

### Infinite Loop Pitfalls

```
DANGER: lo < hi with lo = mid (when mid rounds DOWN to lo)
```

If `lo + 1 == hi` and you set `lo = mid`, then `mid = lo` → no progress → infinite loop.

**Fix:** Use right-biased mid: `mid = lo + (hi - lo + 1) / 2` when updating `lo = mid`.

### `lo <= hi` vs `lo < hi` — When Each Is Correct

| Use `lo <= hi` when... | Use `lo < hi` when... |
|------------------------|----------------------|
| Looking for exact match | Looking for a boundary/condition |
| Both `lo` and `hi` move past mid (`mid+1`, `mid-1`) | One pointer sets to `mid` (candidate preservation) |
| Loop exits when search space is empty (`lo > hi`) | Loop exits when `lo == hi` (converged to answer) |
| Classic binary search | Lower/upper bound, search on answer |

### Mid Calculation Overflow

```java
// WRONG: overflows when lo + hi > Integer.MAX_VALUE
int mid = (lo + hi) / 2;

// CORRECT: safe for all non-negative lo, hi
int mid = lo + (hi - lo) / 2;
```

For `long` answer spaces:
```java
long mid = lo + (hi - lo) / 2;  // use long throughout
```

### Other Frequent Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting to handle "target not found" after lower bound | Check `nums[lo] == target` after convergence |
| Using `int` for sum in feasibility check | Use `long` to avoid overflow |
| Wrong comparison direction in rotated array | Draw it out: `[lo] <= [mid]` means left half is sorted |
| Not caching `arr.get(mid)` in interactive problems | Store in variable; API calls may be limited |
| Setting search bounds too tight | `lo = max(array)` and `hi = sum(array)` for shipping/splitting |

---

## 7. Interview Strategy

### Target Times

| Difficulty | Recognition | Coding | Testing | Total |
|------------|-------------|--------|---------|-------|
| Easy | 30 sec | 2 min | 1 min | 3-4 min |
| Medium | 1 min | 5 min | 2 min | 8-10 min |
| Hard | 2 min | 10 min | 3 min | 15-20 min |

### Explanation Script (What to Say Out Loud)

**Step 1 — Recognize (10 seconds):**
> "The input is sorted / there's a monotonic property on the answer space, so I'll use binary search."

**Step 2 — Clarify the search space (20 seconds):**
> "I'm searching over [indices / answer values from X to Y]. My invariant is: `lo` always stays [below the answer / infeasible] and `hi` always stays [at or above the answer / feasible]."

**Step 3 — State the predicate (20 seconds):**
> "At each step, I check [condition]. If true, I move hi down (answer could be smaller). If false, I move lo up (need bigger)."

**Step 4 — Complexity (10 seconds):**
> "This gives me O(log n) iterations [× O(n) per feasibility check = O(n log n) total]."

**Step 5 — Code and narrate:**
> Write template, fill in the predicate, handle edge cases.

### Common Follow-Up Questions & Answers

| Follow-Up | Your Response |
|-----------|---------------|
| "What if there are duplicates?" | "For rotated array, worst case degrades to O(n). For boundaries, templates still work as-is." |
| "Can you do this without extra space?" | "Binary search is already O(1) space." |
| "What if the array is very large (doesn't fit in memory)?" | "Binary search only needs random access to one element per iteration — works great with external storage." |
| "Prove it terminates." | "Search space strictly shrinks: `hi - lo` decreases by at least 1 each iteration." |
| "What about the edge case where...?" | Test your code mentally with size-1 array, target at boundaries. |

### Interview Pro Tips

1. **State your invariant before coding** — interviewers love this
2. **Draw the number line** — mark lo, mid, hi and show which half you eliminate
3. **Test with a 2-3 element array** — catches most off-by-one bugs
4. **For "search on answer" problems, define feasible() first** — then the binary search wrapper is mechanical

---

## 8. Revision Strategy + Quick Reference Card

### Revision Schedule

| Day | Activity |
|-----|----------|
| Day 1 | Solve LC 704, 35. Master both templates (classic + lower bound) |
| Day 2 | Solve LC 34, 33, 153. Practice rotated array logic on paper |
| Day 3 | Solve LC 875, 1011, 410. Focus on "define feasible()" step |
| Day 4 | Solve LC 4, 1095. These are stretch goals for top-tier interviews |
| Day 5 | Re-solve all medium problems without looking at notes. Target times. |
| Day 7 | Revisit any problem you couldn't solve in target time |
| Day 14 | Full timed drill: pick 3 random problems, solve under interview conditions |

### Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│              BINARY SEARCH — QUICK REFERENCE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  mid = lo + (hi - lo) / 2          ← ALWAYS (avoid overflow)   │
│                                                                  │
│  ┌──────────────────┬───────────────┬────────────────────────┐  │
│  │ Variant          │ Loop          │ Update                 │  │
│  ├──────────────────┼───────────────┼────────────────────────┤  │
│  │ Exact match      │ lo <= hi      │ lo=mid+1 / hi=mid-1   │  │
│  │ Lower bound      │ lo < hi       │ lo=mid+1 / hi=mid     │  │
│  │ Upper bound      │ lo < hi       │ lo=mid+1 / hi=mid     │  │
│  │ Search on answer │ lo < hi       │ lo=mid+1 / hi=mid     │  │
│  └──────────────────┴───────────────┴────────────────────────┘  │
│                                                                  │
│  RETURN VALUE:                                                   │
│    Exact match  → mid (during loop) or -1                       │
│    Lower bound  → lo (first >= target)                          │
│    Upper bound  → lo - 1 (last <= target)                       │
│    Answer space → lo (min feasible answer)                      │
│                                                                  │
│  ROTATED ARRAY:                                                  │
│    nums[lo] <= nums[mid] → left half sorted                     │
│    else → right half sorted                                     │
│    Check if target in sorted half's range, else search other    │
│                                                                  │
│  SEARCH ON ANSWER TEMPLATE:                                      │
│    1. Define search bounds: [min possible, max possible]        │
│    2. Write feasible(candidate): bool                           │
│    3. Binary search: feasible → hi=mid, else → lo=mid+1        │
│                                                                  │
│  INFINITE LOOP CHECK:                                            │
│    ✓ lo=mid+1 with lo<hi and left-biased mid → SAFE            │
│    ✓ hi=mid with lo<hi and left-biased mid → SAFE              │
│    ✗ lo=mid with lo<hi and left-biased mid → INFINITE LOOP     │
│      Fix: use right-biased mid = lo + (hi-lo+1)/2              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Pattern Recognition Cheat Sheet

```
Sorted array + find element        → Template 1 (classic)
Sorted array + insert position     → Template 2 (lower bound)
Sorted array + first/last of X     → Template 2 + Template 3
"Minimum X such that condition"    → Template 4 (search on answer)
"Maximum X such that condition"    → Template 4 (flip predicate)
Rotated sorted array               → Template 5
Rotated + find min                 → lo<hi, compare mid with hi
Peak finding                       → lo<hi, compare mid with mid+1
Two sorted arrays + median         → Partition-based on smaller array
```
