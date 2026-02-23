# Sorting Patterns

> Divide-and-conquer for O(n log n) guarantees, partition for kth element in O(n), and custom comparators when ordering depends on relationships, not just value.

## What Is This Pattern?

**Sorting patterns** cover three main techniques: (1) **Merge sort**—divide the array, recursively sort halves, merge in order; (2) **Quick select**—partition around a pivot to find the kth smallest/largest in O(n) average; (3) **Custom sort**—define a comparator so elements are ordered by a derived rule (e.g., "9" before "30" for Largest Number). Merge sort guarantees O(n log n) and is stable; quick select gives O(n) average for selection without full sorting; custom comparators let you encode complex ordering logic in a single sort call.

**Visual intuition:** Merge sort is like sorting two stacks of cards: split into two piles, sort each pile (recursively), then merge by repeatedly taking the smaller top card. Quick select is like repeatedly partitioning: pick a pivot, put smaller elements left and larger right; if the pivot lands at position k, you're done. Custom sort is "sort by this rule" instead of "sort by natural order."

## When to Use This Pattern

- Need **O(n log n) guaranteed** time (merge sort) or **in-place** sorting
- Need **kth smallest/largest** without full sort → quick select
- Need to **sort by a custom rule** (e.g., "largest number" from digits, meeting rooms by end time)
- Problem involves **count of inversions**, **smaller elements to the right**, or **pairs satisfying condition** → merge sort during merge
- Need **stable sort** (relative order of equal elements preserved)
- Problem says "sort", "order", "arrange", "kth", "median", "partition"
- Constraints suggest sorting will help (e.g., O(n²) brute force → O(n log n) with sort)

## How to Identify This Pattern

- "Sort the array" / "in sorted order" / "kth largest/smallest"
- "Count inversions" / "smaller numbers after self" / "reverse pairs"
- "Merge two sorted arrays" / "merge intervals"
- "Arrange to form largest number" / "custom order"
- "Meeting rooms" / "minimum rooms" (sort by start/end, then sweep)
- "Maximum gap" / "bucket sort" for linear-time under constraints

## Core Template (Pseudocode) — merge sort, quick select (kth element), custom comparator

### Merge Sort

```
FUNCTION mergeSort(arr, lo, hi):
    IF lo >= hi: RETURN
    mid = lo + (hi - lo) / 2
    mergeSort(arr, lo, mid)
    mergeSort(arr, mid + 1, hi)
    merge(arr, lo, mid, hi)

FUNCTION merge(arr, lo, mid, hi):
    tmp = copy of arr[lo..hi]
    i = lo, j = mid + 1, k = lo
    WHILE i <= mid AND j <= hi:
        IF tmp[i - lo] <= tmp[j - lo]:
            arr[k++] = tmp[i - lo]; i++
        ELSE:
            arr[k++] = tmp[j - lo]; j++
    WHILE i <= mid: arr[k++] = tmp[i - lo]; i++
    WHILE j <= hi: arr[k++] = tmp[j - lo]; j++
```

### Quick Select (kth element)

```
FUNCTION quickSelect(arr, lo, hi, k):
    pivotIdx = partition(arr, lo, hi)
    IF pivotIdx == k: RETURN arr[k]
    IF pivotIdx < k: RETURN quickSelect(arr, pivotIdx + 1, hi, k)
    ELSE: RETURN quickSelect(arr, lo, pivotIdx - 1, k)

FUNCTION partition(arr, lo, hi):
    pivot = arr[hi]   // or random pivot
    i = lo
    FOR j FROM lo TO hi - 1:
        IF arr[j] <= pivot:
            swap arr[i], arr[j]; i++
    swap arr[i], arr[hi]
    RETURN i
```

### Custom Comparator

```
// Sort so that a comes before b when customCompare(a, b) < 0
FUNCTION customSort(arr):
    sort(arr, comparator: (a, b) -> customCompare(a, b))

// Example: largest number — "9" before "30" because "930" > "309"
customCompare(a, b): RETURN sign(concat(b, a) - concat(a, b))
```

## Core Template (Java)

### Merge Sort

```java
void mergeSort(int[] nums, int lo, int hi) {
    if (lo >= hi) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(nums, lo, mid);
    mergeSort(nums, mid + 1, hi);
    merge(nums, lo, mid, hi);
}

void merge(int[] nums, int lo, int mid, int hi) {
    int[] tmp = new int[hi - lo + 1];
    System.arraycopy(nums, lo, tmp, 0, tmp.length);
    int i = 0, j = mid - lo + 1, k = lo;
    while (i <= mid - lo && j < tmp.length) {
        if (tmp[i] <= tmp[j]) nums[k++] = tmp[i++];
        else nums[k++] = tmp[j++];
    }
    while (i <= mid - lo) nums[k++] = tmp[i++];
    while (j < tmp.length) nums[k++] = tmp[j++];
}
```

### Quick Select (kth element)

```java
int quickSelect(int[] nums, int lo, int hi, int k) {
    int p = partition(nums, lo, hi);
    if (p == k) return nums[k];
    if (p < k) return quickSelect(nums, p + 1, hi, k);
    return quickSelect(nums, lo, p - 1, k);
}

int partition(int[] nums, int lo, int hi) {
    int pivot = nums[hi];
    int i = lo;
    for (int j = lo; j < hi; j++) {
        if (nums[j] <= pivot) {
            swap(nums, i++, j);
        }
    }
    swap(nums, i, hi);
    return i;
}

void swap(int[] a, int i, int j) {
    int t = a[i]; a[i] = a[j]; a[j] = t;
}
```

### Custom Comparator

```java
// Largest Number: compare as concatenations
Arrays.sort(strs, (a, b) -> (b + a).compareTo(a + b));

// Meeting Rooms II: sort intervals by start
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));

// Generic comparator
Arrays.sort(arr, (a, b) -> {
    // return negative if a before b, positive if b before a, 0 if equal
    return customCompare(a, b);
});
```

## Complexity Cheat Sheet

| Technique        | Time (avg) | Time (worst) | Space   | Stable |
|------------------|------------|--------------|---------|--------|
| Merge Sort       | O(n log n) | O(n log n)   | O(n)    | Yes    |
| Quick Sort       | O(n log n) | O(n²)        | O(log n)| No     |
| Quick Select     | O(n)       | O(n²)        | O(1)    | -      |
| Custom Sort      | O(n log n) | O(n log n)   | O(log n)| Depends|
| Bucket Sort      | O(n + k)   | O(n + k)     | O(n + k)| Yes    |

**Notes:** Merge sort is preferred when stability or guaranteed O(n log n) matters. Quick select for kth element only; k=0 gives min, k=n-1 gives max.

---

## Problems (Progressive Difficulty)

### Easy (2 problems)

#### Problem: Squares of a Sorted Array (LeetCode #977)

- **Intuition:** The array is sorted but has negatives; squares of negatives can be larger than squares of small positives. Use two pointers from both ends: compare absolute values, place the larger square at the end of the result.
- **Approach:**
  1. Two pointers: `left = 0`, `right = n - 1`
  2. Fill result from the end: `result[k] = max(|nums[left]|, |nums[right]|)²`
  3. Move the pointer whose element contributed to the larger square
- **Java Solution:**

```java
class Solution {
    public int[] sortedSquares(int[] nums) {
        int n = nums.length;
        int[] result = new int[n];
        int left = 0, right = n - 1;
        for (int k = n - 1; k >= 0; k--) {
            int leftSq = nums[left] * nums[left];
            int rightSq = nums[right] * nums[right];
            if (leftSq >= rightSq) {
                result[k] = leftSq;
                left++;
            } else {
                result[k] = rightSq;
                right--;
            }
        }
        return result;
    }
}
```

- **Complexity:** Time O(n), Space O(1) excluding output

---

#### Problem: Merge Sorted Array (LeetCode #88)

- **Intuition:** Merge two sorted arrays in-place into `nums1`, which has extra space at the end. Fill from the right (largest first) to avoid overwriting.
- **Approach:**
  1. Three pointers: `i = m - 1`, `j = n - 1`, `k = m + n - 1`
  2. While both arrays have elements, place the larger of `nums1[i]` and `nums2[j]` at `nums1[k]`, decrement pointers
  3. Copy any remaining elements from `nums2` (nums1 leftovers are already in place)
- **Java Solution:**

```java
class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {
        int i = m - 1, j = n - 1, k = m + n - 1;
        while (i >= 0 && j >= 0) {
            if (nums1[i] >= nums2[j]) {
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

### Medium (5 problems)

#### Problem: Sort an Array (LeetCode #912)

- **Intuition:** Implement merge sort (or quick sort) from scratch. Merge sort gives guaranteed O(n log n) and is stable.
- **Approach:**
  1. Recursively split into halves until size 1
  2. Merge sorted halves: compare elements and copy smaller to result
  3. Use auxiliary array for merge to avoid O(n²) from in-place merge
- **Java Solution:**

```java
class Solution {
    public int[] sortArray(int[] nums) {
        mergeSort(nums, 0, nums.length - 1);
        return nums;
    }

    private void mergeSort(int[] nums, int lo, int hi) {
        if (lo >= hi) return;
        int mid = lo + (hi - lo) / 2;
        mergeSort(nums, lo, mid);
        mergeSort(nums, mid + 1, hi);
        merge(nums, lo, mid, hi);
    }

    private void merge(int[] nums, int lo, int mid, int hi) {
        int[] tmp = new int[hi - lo + 1];
        System.arraycopy(nums, lo, tmp, 0, tmp.length);
        int i = 0, j = mid - lo + 1, k = lo;
        while (i <= mid - lo && j < tmp.length) {
            if (tmp[i] <= tmp[j]) nums[k++] = tmp[i++];
            else nums[k++] = tmp[j++];
        }
        while (i <= mid - lo) nums[k++] = tmp[i++];
        while (j < tmp.length) nums[k++] = tmp[j++];
    }
}
```

- **Complexity:** Time O(n log n), Space O(n)

---

#### Problem: Kth Largest Element (LeetCode #215)

- **Intuition:** kth largest = (n - k)th smallest in 0-indexed. Use quick select: partition around pivot; if pivot lands at (n-k), we're done.
- **Approach:**
  1. Quick select with random pivot for average O(n)
  2. Partition: elements ≤ pivot go left, > pivot go right
  3. Recurse on the side containing the kth largest index
- **Java Solution:**

```java
class Solution {
    public int findKthLargest(int[] nums, int k) {
        int n = nums.length;
        int target = n - k;  // kth largest = (n-k)th smallest (0-indexed)
        return quickSelect(nums, 0, n - 1, target);
    }

    private int quickSelect(int[] nums, int lo, int hi, int k) {
        int p = partition(nums, lo, hi);
        if (p == k) return nums[k];
        if (p < k) return quickSelect(nums, p + 1, hi, k);
        return quickSelect(nums, lo, p - 1, k);
    }

    private int partition(int[] nums, int lo, int hi) {
        int pivot = nums[hi];
        int i = lo;
        for (int j = lo; j < hi; j++) {
            if (nums[j] <= pivot) {
                swap(nums, i++, j);
            }
        }
        swap(nums, i, hi);
        return i;
    }

    private void swap(int[] a, int i, int j) {
        int t = a[i]; a[i] = a[j]; a[j] = t;
    }
}
```

- **Complexity:** Time O(n) average, O(n²) worst; Space O(1)

---

#### Problem: Sort List (LeetCode #148)

- **Intuition:** Sort a linked list in O(n log n) time and O(1) space. Use merge sort on linked list: find middle with slow/fast pointers, split, recursively sort, merge.
- **Approach:**
  1. Find middle: slow and fast pointer; when fast reaches end, slow is mid
  2. Split into two halves, recurse on each
  3. Merge two sorted linked lists
- **Java Solution:**

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode sortList(ListNode head) {
        if (head == null || head.next == null) return head;
        ListNode mid = getMid(head);
        ListNode left = head;
        ListNode right = mid.next;
        mid.next = null;
        left = sortList(left);
        right = sortList(right);
        return merge(left, right);
    }

    private ListNode getMid(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }

    private ListNode merge(ListNode a, ListNode b) {
        ListNode dummy = new ListNode(0);
        ListNode cur = dummy;
        while (a != null && b != null) {
            if (a.val <= b.val) {
                cur.next = a;
                a = a.next;
            } else {
                cur.next = b;
                b = b.next;
            }
            cur = cur.next;
        }
        cur.next = (a != null) ? a : b;
        return dummy.next;
    }
}
```

- **Complexity:** Time O(n log n), Space O(log n) recursion stack

---

#### Problem: Largest Number (LeetCode #179)

- **Intuition:** Sort numbers as strings so that "a" comes before "b" when "ab" > "ba". Then concatenate. Custom comparator: compare (b+a) vs (a+b).
- **Approach:**
  1. Convert each number to string
  2. Sort with comparator: (a, b) -> (b+a).compareTo(a+b)
  3. Join and handle leading zeros (e.g., [0,0] -> "0")
- **Java Solution:**

```java
class Solution {
    public String largestNumber(int[] nums) {
        String[] strs = new String[nums.length];
        for (int i = 0; i < nums.length; i++) {
            strs[i] = String.valueOf(nums[i]);
        }
        Arrays.sort(strs, (a, b) -> (b + a).compareTo(a + b));
        if (strs[0].equals("0")) return "0";
        return String.join("", strs);
    }
}
```

- **Complexity:** Time O(n log n * k) where k = avg digit count, Space O(n)

---

#### Problem: Meeting Rooms II (LeetCode #253)

- **Intuition:** Track maximum concurrent meetings. Sort start times and end times separately; sweep: when we see a start, room++; when we see an end, room--. The max room count is the answer. Alternatively: sort intervals by start, use a min-heap for end times.
- **Approach:**
  1. Extract start times and end times into arrays, sort both
  2. Two pointers: for each start, if start < current end, we need a new room; else we can reuse (advance end pointer)
  3. Track max rooms needed
- **Java Solution:**

```java
class Solution {
    public int minMeetingRooms(int[][] intervals) {
        int n = intervals.length;
        int[] starts = new int[n];
        int[] ends = new int[n];
        for (int i = 0; i < n; i++) {
            starts[i] = intervals[i][0];
            ends[i] = intervals[i][1];
        }
        Arrays.sort(starts);
        Arrays.sort(ends);
        int rooms = 0, maxRooms = 0;
        int si = 0, ei = 0;
        while (si < n) {
            if (starts[si] < ends[ei]) {
                rooms++;
                si++;
                maxRooms = Math.max(maxRooms, rooms);
            } else {
                rooms--;
                ei++;
            }
        }
        return maxRooms;
    }
}
```

- **Complexity:** Time O(n log n), Space O(n)

---

### Hard (3 problems)

#### Problem: Count of Smaller Numbers After Self (LeetCode #315)

- **Intuition:** For each element, count how many elements to its right are smaller. Use merge sort with an index array to track original positions. During merge: when we take from the *right* half (right element is smaller), we increment `rightCount`. When we take from the *left* half, we add `rightCount` to that element—those right elements have higher original indices and are smaller, so they are "smaller numbers after self" for this left element.

- **Approach:**
  1. Create pairs (nums[i], i) for merge sort
  2. During merge: when taking from right half, increment count for each remaining left-half element by 1 (they have a smaller element to their right)
  3. Track count per original index
- **Java Solution:**

```java
class Solution {
    private int[] count;

    public List<Integer> countSmaller(int[] nums) {
        int n = nums.length;
        count = new int[n];
        int[] indices = new int[n];
        for (int i = 0; i < n; i++) indices[i] = i;
        int[] aux = new int[n];
        mergeSort(nums, indices, aux, 0, n - 1);
        List<Integer> result = new ArrayList<>();
        for (int c : count) result.add(c);
        return result;
    }

    private void mergeSort(int[] nums, int[] indices, int[] aux, int lo, int hi) {
        if (lo >= hi) return;
        int mid = lo + (hi - lo) / 2;
        mergeSort(nums, indices, aux, lo, mid);
        mergeSort(nums, indices, aux, mid + 1, hi);
        merge(nums, indices, aux, lo, mid, hi);
    }

    private void merge(int[] nums, int[] indices, int[] aux, int lo, int mid, int hi) {
        for (int i = lo; i <= hi; i++) aux[i] = indices[i];
        int i = lo, j = mid + 1, k = lo;
        int rightCount = 0;
        while (i <= mid && j <= hi) {
            if (nums[aux[i]] <= nums[aux[j]]) {
                count[aux[i]] += rightCount;
                indices[k++] = aux[i++];
            } else {
                rightCount++;
                indices[k++] = aux[j++];
            }
        }
        while (i <= mid) {
            count[aux[i]] += rightCount;
            indices[k++] = aux[i++];
        }
        while (j <= hi) indices[k++] = aux[j++];
    }
}
```

- **Complexity:** Time O(n log n), Space O(n)

---

#### Problem: Reverse Pairs (LeetCode #493)

- **Intuition:** Count pairs (i, j) where i < j and nums[i] > 2 * nums[j]. Use merge sort: when merging, for each element in the right half, count how many in the left half satisfy left > 2*right. Since both halves are sorted, use two pointers.
- **Approach:**
  1. Merge sort the array
  2. Before merging, count pairs: for each right element, find count of left elements where left > 2*right (left is sorted, so binary search or two pointers)
  3. Then perform normal merge
- **Java Solution:**

```java
class Solution {
    public int reversePairs(int[] nums) {
        return mergeSortAndCount(nums, 0, nums.length - 1);
    }

    private int mergeSortAndCount(int[] nums, int lo, int hi) {
        if (lo >= hi) return 0;
        int mid = lo + (hi - lo) / 2;
        int count = mergeSortAndCount(nums, lo, mid) + mergeSortAndCount(nums, mid + 1, hi);

        // Count reverse pairs: for each j in right, count i in left with nums[i] > 2 * nums[j]
        int j = mid + 1;
        for (int i = lo; i <= mid; i++) {
            while (j <= hi && (long) nums[i] > 2L * nums[j]) j++;
            count += j - (mid + 1);
        }

        merge(nums, lo, mid, hi);
        return count;
    }

    private void merge(int[] nums, int lo, int mid, int hi) {
        int[] tmp = new int[hi - lo + 1];
        System.arraycopy(nums, lo, tmp, 0, tmp.length);
        int i = 0, j = mid - lo + 1, k = lo;
        while (i <= mid - lo && j < tmp.length) {
            if (tmp[i] <= tmp[j]) nums[k++] = tmp[i++];
            else nums[k++] = tmp[j++];
        }
        while (i <= mid - lo) nums[k++] = tmp[i++];
        while (j < tmp.length) nums[k++] = tmp[j++];
    }
}
```

- **Complexity:** Time O(n log n), Space O(n)

---

#### Problem: Maximum Gap (LeetCode #164)

- **Intuition:** Find maximum gap between successive elements in sorted form. Under O(n) constraint, we can't sort. Use bucket sort: distribute n elements into (n-1) buckets; by pigeonhole, at least one bucket is empty, so max gap is at least (max-min)/(n-1). Put each element in bucket by value; max gap is either within a bucket (max-min of bucket) or between adjacent non-empty buckets.
- **Approach:**
  1. Find min and max; if n < 2, return 0
  2. Create n-1 buckets; bucket size = ceil((max-min)/(n-1))
  3. Put each element in bucket; track min and max per bucket
  4. Max gap = max of (current bucket min - previous bucket max)
- **Java Solution:**

```java
class Solution {
    public int maximumGap(int[] nums) {
        int n = nums.length;
        if (n < 2) return 0;
        int min = nums[0], max = nums[0];
        for (int x : nums) {
            min = Math.min(min, x);
            max = Math.max(max, x);
        }
        if (min == max) return 0;
        int bucketSize = Math.max(1, (max - min) / (n - 1));
        int bucketCount = (max - min) / bucketSize + 1;
        int[] bucketMin = new int[bucketCount];
        int[] bucketMax = new int[bucketCount];
        Arrays.fill(bucketMin, Integer.MAX_VALUE);
        Arrays.fill(bucketMax, Integer.MIN_VALUE);
        for (int x : nums) {
            int idx = (x - min) / bucketSize;
            bucketMin[idx] = Math.min(bucketMin[idx], x);
            bucketMax[idx] = Math.max(bucketMax[idx], x);
        }
        int maxGap = 0;
        int prevMax = min;
        for (int i = 0; i < bucketCount; i++) {
            if (bucketMin[i] == Integer.MAX_VALUE) continue;
            maxGap = Math.max(maxGap, bucketMin[i] - prevMax);
            prevMax = bucketMax[i];
        }
        return maxGap;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

## Common Mistakes & Edge Cases

| Mistake | Fix |
|---------|-----|
| Quick select: kth largest index | kth largest = (n-k)th smallest in 0-indexed; use target = n - k |
| Merge sort: wrong merge bounds | Use `mid - lo + 1` for j start in tmp; careful with tmp indexing |
| Custom comparator: wrong order | For descending, use (b,a).compareTo(a,b); for ascending, (a,b).compareTo(b,a) |
| Count Smaller: mixing indices and values | Store (value, original_index) and only update count for left-half elements when taking from right |
| Reverse Pairs: integer overflow | Use `2L * nums[j]` to avoid overflow when nums[i] and nums[j] are large |
| Maximum Gap: empty buckets | Skip empty buckets when computing gap; prevMax = previous non-empty bucket's max |
| Largest Number: all zeros | Return "0" not "00...0" when sorted result starts with "0" |
| Meeting Rooms II: boundary | When start == end, one meeting ends as another starts; handle with `<` not `<=` in comparison |

**Edge Cases:**
- Empty array or single element
- All elements same (quick select, bucket sort)
- Sorted / reverse sorted (quick sort worst case—use random pivot in production)
- k = 1 or k = n (min/max)
- Negative numbers (Reverse Pairs overflow)
- Leading zeros in Largest Number
- Overlapping meetings with same start/end time

## Pattern Variations

| Variation | Example |
|-----------|---------|
| **Merge sort + inversion count** | Count of Smaller Numbers After Self, Reverse Pairs |
| **Quick select for median** | Find median of unsorted array |
| **Custom comparator** | Largest Number, Merge Intervals (sort by start) |
| **Bucket sort** | Maximum Gap, Top K Frequent (bucket by frequency) |
| **Sort + sweep** | Meeting Rooms II, Merge Intervals |
| **Sort two arrays** | Merge Sorted Array, Intersection of Two Arrays |
| **Merge sort on linked list** | Sort List |
| **Radix sort** | When range is limited (e.g., 0..n-1) |
| **Counting sort** | When range is small (e.g., chars, small integers) |
