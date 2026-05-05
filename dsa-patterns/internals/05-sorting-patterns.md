# Sorting Patterns — Interview Execution Playbook

> Sort as preprocessing to unlock O(n log n) structure. Use quickselect for O(n) kth element. Use custom comparators when order depends on relationships, not raw value. Use bucket/counting sort when the value range is bounded.

---

## 1. Pattern Recognition Signals

**You need sorting when you see these in a problem:**

| Signal | Example Problem | Why Sorting Helps |
|--------|----------------|-------------------|
| "Merge overlapping intervals" | LC 56 Merge Intervals | Sort by start → single-pass merge |
| "kth largest / smallest" | LC 215 Kth Largest Element | Quickselect gives O(n) average |
| "Arrange to form largest/smallest number" | LC 179 Largest Number | Custom comparator on string concatenation |
| "Minimum rooms / resources needed" | LC 253 Meeting Rooms II | Sort events → sweep line |
| "Sort a linked list" | LC 148 Sort List | Merge sort — no random access needed |
| "Top K frequent elements" | LC 347 Top K Frequent | Bucket sort by frequency → O(n) |
| "Count inversions / smaller after self" | LC 315 Count Smaller After Self | Merge sort + count during merge |
| "Maximum gap in sorted order" | LC 164 Maximum Gap | Bucket sort + pigeonhole |

**Keyword triggers:** "sort", "order", "arrange", "kth", "median", "merge intervals", "meeting rooms", "top k", "frequency", "rearrange".

**Meta-signal — sort as preprocessing:** Many two-pointer, binary search, and greedy problems become solvable only after sorting. If brute force is O(n²) and the problem doesn't require preserving original order, sorting to O(n log n) then scanning O(n) is the classic optimization.

---

## 2. Thinking Framework

**Step-by-step decision tree when you suspect sorting:**

```
1. Does the problem require preserving original indices?
   ├─ YES → Can you sort a copy or sort (value, index) pairs?
   │        If counting inversions → merge sort with index tracking
   └─ NO  → Sorting is safe as preprocessing

2. What kind of "order" does the problem need?
   ├─ Natural order (ascending/descending) → Arrays.sort()
   ├─ Custom order (largest number, meeting by end time) → Custom comparator
   └─ Partial order (only kth element) → Quickselect

3. Can you exploit bounded value range?
   ├─ YES (values in [0, k] or frequency-based) → Counting sort / Bucket sort → O(n)
   └─ NO  → Comparison sort → O(n log n)

4. Is the data structure a linked list?
   ├─ YES → Merge sort (no random access, so quicksort is impractical)
   └─ NO  → Any comparison sort works

5. Do you need stability (equal elements keep original order)?
   ├─ YES → Merge sort or Tim sort (Java's Arrays.sort for objects)
   └─ NO  → Quicksort / quickselect fine
```

**Complexity targets to keep in mind:**

| Technique | Time (avg) | Time (worst) | Space | Stable? |
|-----------|-----------|-------------|-------|---------|
| Merge Sort | O(n log n) | O(n log n) | O(n) | Yes |
| Quick Sort | O(n log n) | O(n²) | O(log n) | No |
| Quick Select | O(n) | O(n²) | O(1) | — |
| Counting Sort | O(n + k) | O(n + k) | O(k) | Yes |
| Bucket Sort | O(n + k) | O(n + k) | O(n + k) | Yes |
| Java Arrays.sort (primitives) | O(n log n) | O(n log n) | O(log n) | No |
| Java Arrays.sort (objects) | O(n log n) | O(n log n) | O(n) | Yes |

**Key insight for interviews:** Java's `Arrays.sort` on primitives uses dual-pivot quicksort (unstable). On objects, it uses TimSort (stable). When the interviewer asks you to implement sorting, they want merge sort or quickselect — not `Arrays.sort`.

---

## 3. Java Templates

### Template A — Merge Sort

Use when: guaranteed O(n log n), stability required, counting inversions during merge, sorting linked lists.

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
        else                  nums[k++] = tmp[j++];
    }
    while (i <= mid - lo) nums[k++] = tmp[i++];
    while (j < tmp.length) nums[k++] = tmp[j++];
}
```

**Merge sort on linked list** (no extra array — split with slow/fast pointers):

```java
ListNode sortList(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode mid = getMid(head);
    ListNode right = mid.next;
    mid.next = null;
    ListNode left = sortList(head);
    right = sortList(right);
    return merge(left, right);
}

ListNode getMid(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast.next != null && fast.next.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}

ListNode merge(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), cur = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { cur.next = a; a = a.next; }
        else                { cur.next = b; b = b.next; }
        cur = cur.next;
    }
    cur.next = (a != null) ? a : b;
    return dummy.next;
}
```

### Template B — Quick Select (Kth Element)

Use when: finding kth largest/smallest, median finding. O(n) average without full sort.

**Critical conversion:** kth largest in an array of size n = element at index `n - k` in sorted order (0-indexed).

```java
int quickSelect(int[] nums, int lo, int hi, int k) {
    if (lo == hi) return nums[lo];
    int pivotIdx = partition(nums, lo, hi);
    if (pivotIdx == k) return nums[k];
    if (pivotIdx < k) return quickSelect(nums, pivotIdx + 1, hi, k);
    return quickSelect(nums, lo, pivotIdx - 1, k);
}

int partition(int[] nums, int lo, int hi) {
    // random pivot to avoid O(n²) on sorted input
    int randIdx = lo + new Random().nextInt(hi - lo + 1);
    swap(nums, randIdx, hi);
    int pivot = nums[hi], i = lo;
    for (int j = lo; j < hi; j++) {
        if (nums[j] <= pivot) swap(nums, i++, j);
    }
    swap(nums, i, hi);
    return i;
}

void swap(int[] a, int i, int j) {
    int t = a[i]; a[i] = a[j]; a[j] = t;
}
```

**Always use random pivot in interviews.** Interviewers specifically check for this — deterministic pivot on `nums[hi]` degrades to O(n²) on sorted arrays.

### Template C — Custom Comparator Sorting

Use when: ordering depends on a relationship between elements, not their raw values.

```java
// Largest Number: "9" before "30" because "930" > "309"
Arrays.sort(strs, (a, b) -> (b + a).compareTo(a + b));

// Sort intervals by start time
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));

// Sort intervals by end time (greedy interval scheduling)
Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));

// Sort by one field, break ties by another
Arrays.sort(arr, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0])
                                         : Integer.compare(a[1], b[1]));

// Sort map entries by value descending
List<Map.Entry<K,V>> entries = new ArrayList<>(map.entrySet());
entries.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));
```

**Comparator contract:** return negative if a should come first, positive if b should come first, 0 if equal. Never subtract integers directly (`a - b`) — it overflows. Always use `Integer.compare`.

### Template D — Bucket Sort

Use when: values fall in a bounded range, or you're grouping by frequency. Achieves O(n).

```java
// Top K Frequent Elements — bucket by frequency
int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int x : nums) freq.merge(x, 1, Integer::sum);

    // bucket[i] = list of elements with frequency i
    List<Integer>[] bucket = new List[nums.length + 1];
    for (int i = 0; i < bucket.length; i++) bucket[i] = new ArrayList<>();
    for (var e : freq.entrySet()) bucket[e.getValue()].add(e.getKey());

    int[] res = new int[k];
    int idx = 0;
    for (int i = bucket.length - 1; i >= 0 && idx < k; i--) {
        for (int val : bucket[i]) {
            res[idx++] = val;
            if (idx == k) break;
        }
    }
    return res;
}
```

### Template E — Counting Sort

Use when: elements are integers in a small, known range [0, maxVal]. O(n + maxVal).

```java
void countingSort(int[] nums, int maxVal) {
    int[] count = new int[maxVal + 1];
    for (int x : nums) count[x]++;
    int idx = 0;
    for (int val = 0; val <= maxVal; val++) {
        while (count[val]-- > 0) nums[idx++] = val;
    }
}
```

---

## 4. Edge Cases

| Category | Edge Case | What Goes Wrong |
|----------|-----------|-----------------|
| **Empty / single element** | `[]` or `[5]` | Quick select crashes if you don't check `lo >= hi` |
| **All elements identical** | `[3, 3, 3, 3]` | Quickselect degrades to O(n²) without 3-way partition; bucket sort creates one giant bucket |
| **Already sorted / reverse sorted** | `[1, 2, 3, 4, 5]` | Deterministic pivot quicksort hits O(n²) — use random pivot |
| **k = 1 or k = n** | Finding min or max via quickselect | Works but wasteful — just do a linear scan |
| **Integer overflow** | `nums[i] > 2 * nums[j]` in Reverse Pairs | Use `2L * nums[j]` to force long arithmetic |
| **Leading zeros** | `[0, 0]` → Largest Number | After sorting, if first element is "0", result is "0" not "00" |
| **Boundary overlap** | Meeting ends at 10, another starts at 10 | Use strict `<` not `<=` — the room is freed exactly when meeting ends |
| **Negative numbers** | Squares of sorted array | Squaring negatives can produce large positives — two-pointer from ends |
| **Linked list with 0/1 node** | Sort List with empty or single-node input | Base case: return head directly |
| **Large n with bounded values** | n = 10⁶, values in [0, 100] | Counting sort O(n) instead of comparison sort O(n log n) |

---

## 5. Problem Progression (LeetCode)

### Warm-Up: Sorting as Preprocessing

#### LC 56 — Merge Intervals

**Pattern:** Sort by start → merge overlapping intervals.

```java
class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] iv : intervals) {
            if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < iv[0]) {
                merged.add(iv);
            } else {
                merged.get(merged.size() - 1)[1] = Math.max(
                    merged.get(merged.size() - 1)[1], iv[1]);
            }
        }
        return merged.toArray(new int[0][]);
    }
}
```

- **Time:** O(n log n) — sort dominates.
- **Space:** O(n) — output list in worst case (no merges).
- **Key insight:** After sorting by start, two intervals overlap iff `prev.end >= curr.start`. Extend by taking max of ends.

---

#### LC 179 — Largest Number

**Pattern:** Custom comparator — compare concatenation orders.

```java
class Solution {
    public String largestNumber(int[] nums) {
        String[] strs = new String[nums.length];
        for (int i = 0; i < nums.length; i++) strs[i] = String.valueOf(nums[i]);
        Arrays.sort(strs, (a, b) -> (b + a).compareTo(a + b));
        if (strs[0].equals("0")) return "0";
        return String.join("", strs);
    }
}
```

- **Time:** O(n log n · k) — n log n comparisons, each comparing strings of average length k.
- **Space:** O(n) — string array.
- **Key insight:** The comparator `(b+a).compareTo(a+b)` defines a total order that maximizes the concatenated result. This is provably transitive.

---

#### LC 274 — H-Index

**Pattern:** Sort descending, find breakpoint where `citations[i] >= i + 1`.

```java
class Solution {
    public int hIndex(int[] citations) {
        Arrays.sort(citations);
        int n = citations.length;
        for (int i = 0; i < n; i++) {
            if (citations[n - 1 - i] < i + 1) return i;
        }
        return n;
    }
}
```

- **Time:** O(n log n).
- **Space:** O(1) (in-place sort).
- **Key insight:** After sorting, scan from the highest citation count. The h-index is the largest h such that h papers have >= h citations. Alternatively solvable in O(n) with counting sort since citations are bounded by n.

**O(n) counting sort variant:**

```java
class Solution {
    public int hIndex(int[] citations) {
        int n = citations.length;
        int[] count = new int[n + 1];
        for (int c : citations) count[Math.min(c, n)]++;
        int total = 0;
        for (int i = n; i >= 0; i--) {
            total += count[i];
            if (total >= i) return i;
        }
        return 0;
    }
}
```

---

### Core: Quickselect and Sweep Line

#### LC 215 — Kth Largest Element in an Array

**Pattern:** Quickselect with random pivot — O(n) average without full sort.

```java
class Solution {
    private Random rand = new Random();

    public int findKthLargest(int[] nums, int k) {
        int target = nums.length - k;
        return quickSelect(nums, 0, nums.length - 1, target);
    }

    private int quickSelect(int[] nums, int lo, int hi, int k) {
        if (lo == hi) return nums[lo];
        int p = partition(nums, lo, hi);
        if (p == k) return nums[p];
        if (p < k) return quickSelect(nums, p + 1, hi, k);
        return quickSelect(nums, lo, p - 1, k);
    }

    private int partition(int[] nums, int lo, int hi) {
        int randIdx = lo + rand.nextInt(hi - lo + 1);
        swap(nums, randIdx, hi);
        int pivot = nums[hi], i = lo;
        for (int j = lo; j < hi; j++) {
            if (nums[j] <= pivot) swap(nums, i++, j);
        }
        swap(nums, i, hi);
        return i;
    }

    private void swap(int[] a, int i, int j) {
        int t = a[i]; a[i] = a[j]; a[j] = t;
    }
}
```

- **Time:** O(n) average, O(n²) worst case. Random pivot makes worst case astronomically unlikely.
- **Space:** O(1) — in-place partition.
- **Interview note:** Mention the O(n²) worst case and that random pivot mitigates it. If pressed on guaranteed O(n), mention median-of-medians (but don't implement it — too complex for interviews).

---

#### LC 253 — Meeting Rooms II

**Pattern:** Sort start/end times separately, sweep to track concurrent meetings.

```java
class Solution {
    public int minMeetingRooms(int[][] intervals) {
        int n = intervals.length;
        int[] starts = new int[n], ends = new int[n];
        for (int i = 0; i < n; i++) {
            starts[i] = intervals[i][0];
            ends[i] = intervals[i][1];
        }
        Arrays.sort(starts);
        Arrays.sort(ends);
        int rooms = 0, maxRooms = 0, si = 0, ei = 0;
        while (si < n) {
            if (starts[si] < ends[ei]) {
                rooms++;
                maxRooms = Math.max(maxRooms, rooms);
                si++;
            } else {
                rooms--;
                ei++;
            }
        }
        return maxRooms;
    }
}
```

- **Time:** O(n log n) — two sorts.
- **Space:** O(n) — separate start/end arrays.
- **Why two-pointer beats min-heap:** Both are O(n log n), but the two-pointer approach has lower constant factors and is simpler to code. Mention the heap approach as an alternative: sort by start, push end times into a min-heap, pop when `heap.peek() <= current.start`.

**Alternative — min-heap approach:**

```java
class Solution {
    public int minMeetingRooms(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int[] iv : intervals) {
            if (!heap.isEmpty() && heap.peek() <= iv[0]) heap.poll();
            heap.offer(iv[1]);
        }
        return heap.size();
    }
}
```

---

#### LC 347 — Top K Frequent Elements

**Pattern:** Bucket sort by frequency — O(n) when k could be anything.

```java
class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int x : nums) freq.merge(x, 1, Integer::sum);

        List<Integer>[] bucket = new List[nums.length + 1];
        for (int i = 0; i < bucket.length; i++) bucket[i] = new ArrayList<>();
        for (var e : freq.entrySet()) bucket[e.getValue()].add(e.getKey());

        int[] res = new int[k];
        int idx = 0;
        for (int i = bucket.length - 1; i >= 0 && idx < k; i--) {
            for (int val : bucket[i]) {
                res[idx++] = val;
                if (idx == k) break;
            }
        }
        return res;
    }
}
```

- **Time:** O(n) — frequency map O(n), bucket distribution O(n), collection O(n).
- **Space:** O(n) — hash map + buckets.
- **Why bucket sort over heap:** Heap gives O(n log k). Bucket sort gives O(n) regardless of k. Mention both in interview — start with bucket sort, acknowledge heap as a valid alternative.

**Alternative — quickselect on frequency:**

```java
class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int x : nums) freq.merge(x, 1, Integer::sum);
        int[] unique = new int[freq.size()];
        int i = 0;
        for (int key : freq.keySet()) unique[i++] = key;
        // Quickselect: partition by frequency, find top k
        quickSelect(unique, freq, 0, unique.length - 1, unique.length - k);
        return Arrays.copyOfRange(unique, unique.length - k, unique.length);
    }

    private void quickSelect(int[] arr, Map<Integer, Integer> freq, int lo, int hi, int k) {
        if (lo >= hi) return;
        int pivot = freq.get(arr[hi]), i = lo;
        for (int j = lo; j < hi; j++) {
            if (freq.get(arr[j]) <= pivot) { int t = arr[i]; arr[i] = arr[j]; arr[j] = t; i++; }
        }
        int t = arr[i]; arr[i] = arr[hi]; arr[hi] = t;
        if (i == k) return;
        if (i < k) quickSelect(arr, freq, i + 1, hi, k);
        else quickSelect(arr, freq, lo, i - 1, k);
    }
}
```

---

### Advanced: Merge Sort Applications and Specialized Sorting

#### LC 148 — Sort List

**Pattern:** Merge sort on linked list — no random access so quicksort is impractical.

```java
class Solution {
    public ListNode sortList(ListNode head) {
        if (head == null || head.next == null) return head;
        ListNode mid = getMid(head);
        ListNode right = mid.next;
        mid.next = null;
        ListNode left = sortList(head);
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
        ListNode dummy = new ListNode(0), cur = dummy;
        while (a != null && b != null) {
            if (a.val <= b.val) { cur.next = a; a = a.next; }
            else                { cur.next = b; b = b.next; }
            cur = cur.next;
        }
        cur.next = (a != null) ? a : b;
        return dummy.next;
    }
}
```

- **Time:** O(n log n) — standard merge sort recurrence.
- **Space:** O(log n) — recursion stack. The merge itself is O(1) extra space since we relink nodes.
- **Key insight:** Merge sort is the natural choice for linked lists because splitting (slow/fast pointer) and merging (pointer reassignment) are both efficient. No auxiliary array needed — just relink nodes.
- **Follow-up:** Bottom-up merge sort achieves true O(1) space by iteratively merging sublists of size 1, 2, 4, 8... without recursion.

---

#### LC 324 — Wiggle Sort II

**Pattern:** Find median via quickselect, then 3-way partition with virtual index mapping.

```java
class Solution {
    public void wiggleSort(int[] nums) {
        int n = nums.length;
        int median = findMedian(nums, n);

        // 3-way partition with virtual indexing
        // Map: virtual index i → actual index (1 + 2*i) % (n | 1)
        // Places larger elements at odd indices, smaller at even indices
        int left = 0, right = n - 1, cur = 0;
        while (cur <= right) {
            int mapped = map(cur, n);
            if (nums[mapped] > median) {
                swap(nums, map(left++, n), mapped);
                cur++;
            } else if (nums[mapped] < median) {
                swap(nums, mapped, map(right--, n));
            } else {
                cur++;
            }
        }
    }

    private int map(int i, int n) {
        return (1 + 2 * i) % (n | 1);
    }

    private int findMedian(int[] nums, int n) {
        int target = n / 2;
        int lo = 0, hi = n - 1;
        while (lo < hi) {
            int p = partition(nums, lo, hi);
            if (p == target) return nums[p];
            if (p < target) lo = p + 1;
            else hi = p - 1;
        }
        return nums[lo];
    }

    private int partition(int[] nums, int lo, int hi) {
        int randIdx = lo + new Random().nextInt(hi - lo + 1);
        swap(nums, randIdx, hi);
        int pivot = nums[hi], i = lo;
        for (int j = lo; j < hi; j++) {
            if (nums[j] <= pivot) swap(nums, i++, j);
        }
        swap(nums, i, hi);
        return i;
    }

    private void swap(int[] a, int i, int j) {
        int t = a[i]; a[i] = a[j]; a[j] = t;
    }
}
```

- **Time:** O(n) average — quickselect for median + single-pass 3-way partition.
- **Space:** O(1) — in-place with virtual index mapping.
- **Key insight:** The virtual index mapping `(1 + 2*i) % (n | 1)` interleaves even and odd positions so that the 3-way Dutch National Flag partition directly produces the wiggle property. This is one of the hardest medium/hard problems — if asked, first explain the O(n log n) approach (sort, then interleave), then optimize.

---

### Problem Summary Table

| # | Problem | Pattern | Time | Space | Difficulty |
|---|---------|---------|------|-------|------------|
| 56 | Merge Intervals | Sort + linear merge | O(n log n) | O(n) | Medium |
| 179 | Largest Number | Custom comparator | O(nk log n) | O(n) | Medium |
| 215 | Kth Largest Element | Quickselect | O(n) avg | O(1) | Medium |
| 148 | Sort List | Merge sort on linked list | O(n log n) | O(log n) | Medium |
| 274 | H-Index | Sort + scan / counting sort | O(n log n) or O(n) | O(1) or O(n) | Medium |
| 253 | Meeting Rooms II | Sort + sweep / min-heap | O(n log n) | O(n) | Medium |
| 347 | Top K Frequent | Bucket sort by frequency | O(n) | O(n) | Medium |
| 324 | Wiggle Sort II | Quickselect + 3-way partition | O(n) avg | O(1) | Medium |

---

## 6. Common Mistakes

| Mistake | Why It Happens | Fix |
|---------|---------------|-----|
| **Wrong kth index** | Confusing 1-indexed k with 0-indexed array | kth largest = index `n - k` in sorted 0-indexed array |
| **Deterministic pivot** | Using `nums[hi]` as pivot always | Random pivot: `randIdx = lo + rand.nextInt(hi - lo + 1)` |
| **Integer overflow in comparator** | Writing `return a - b` instead of `Integer.compare(a, b)` | `a - b` overflows when a and b have different signs. Always use `Integer.compare` |
| **Integer overflow in conditions** | `nums[i] > 2 * nums[j]` with large values | Cast to long: `(long) nums[i] > 2L * nums[j]` |
| **Merge sort: wrong tmp indexing** | Off-by-one when copying to auxiliary array | `j` starts at `mid - lo + 1` in tmp, not `mid + 1` |
| **Custom comparator: wrong order** | Getting ascending vs descending backwards | For descending: `(b + a).compareTo(a + b)`. Test with a small example |
| **Largest Number: all zeros** | `[0, 0]` → returning `"00"` | After sort, if `strs[0].equals("0")`, return `"0"` |
| **Meeting Rooms: boundary handling** | One meeting ends at 10, another starts at 10 | Use strict `<` not `<=`: `starts[si] < ends[ei]` — the room is freed when meeting ends |
| **Sort List: not breaking the list** | Forgetting `mid.next = null` before recursing | After finding mid with slow/fast, you must sever the list |
| **Bucket sort: wrong bucket count** | Off-by-one in bucket index calculation | Max frequency = `nums.length`, so create `nums.length + 1` buckets (indices 0 to n) |

---

## 7. Interview Strategy

### Opening (First 2 Minutes)

1. **Restate the problem.** "So I need to [find the kth largest / merge overlapping intervals / ...]."
2. **Identify the sorting signal.** "Since [we need ordered pairs / kth element / custom ordering], this is a sorting-based problem."
3. **State your approach and complexity upfront.** "I'll sort by [start time / frequency / custom comparator], then [scan / merge / select]. This gives O(n log n) time, O(n) space."

### Approach Selection Guide

| If Asked... | Start With | Then Optimize To |
|-------------|-----------|-----------------|
| "Find kth largest element" | Sort + index → O(n log n) | Quickselect → O(n) avg |
| "Merge intervals" | Sort by start → O(n log n) | — (this is optimal) |
| "Top K frequent" | Sort by frequency → O(n log n) | Bucket sort → O(n) |
| "Sort a linked list" | Merge sort → O(n log n) | Bottom-up merge sort → O(1) space |
| "Arrange largest number" | Custom comparator → O(n log n) | — (this is optimal) |
| "Maximum gap" | Sort + scan → O(n log n) | Bucket sort → O(n) |
| "Count inversions" | Brute force → O(n²) | Merge sort + count → O(n log n) |

### How to Discuss Trade-Offs

**Quickselect vs Heap for kth element:**
- Quickselect: O(n) avg, O(n²) worst, O(1) space, modifies input
- Heap: O(n log k) worst case, O(k) space, doesn't modify input
- "I'd use quickselect for best average performance, but if we can't modify the input or need guaranteed worst-case, a min-heap of size k is safer."

**Bucket sort vs Heap for Top K:**
- Bucket sort: O(n) time, O(n) space
- Min-heap: O(n log k) time, O(k) space
- "Bucket sort is asymptotically better, but if k is very small relative to n, the heap's O(k) space might matter."

**When the interviewer says "Can you do better?":**
- If you used comparison sort O(n log n) → Ask: "Are values bounded?" If yes → counting/bucket sort O(n)
- If you used full sort for kth element → quickselect O(n)
- If you're sorting intervals and they push for space → check if you can sort in-place

### Coding Tips

- **Start with `Arrays.sort` for the preprocessing step**, then implement the core logic. Don't implement merge sort from scratch unless the problem specifically requires it.
- **For quickselect**, always add the random pivot line — interviewers check for this.
- **For custom comparators**, write the lambda on one line if possible. Test it mentally with two concrete values.
- **Name your variables clearly:** `lo`, `hi`, `mid` for merge sort; `pivot`, `i` (partition boundary) for quickselect.

---

## 8. Revision + Quick Reference

### 30-Second Recall Card

```
SORTING PATTERNS:
├── Preprocessing: Sort first, then scan → Merge Intervals, Meeting Rooms
├── Quickselect: kth largest = index (n-k), random pivot, O(n) avg
├── Custom comparator: (b+a).compareTo(a+b) for Largest Number
├── Merge sort: Linked list sorting, inversion counting
├── Bucket sort: Top K Frequent (bucket by freq), Maximum Gap
└── Counting sort: Bounded range → O(n+k)

GOTCHAS: Random pivot | Integer.compare not a-b | "0" edge case | mid.next=null for list split
```

### Complexity Quick Reference

| Problem | Brute Force | Optimal | Key Technique |
|---------|------------|---------|---------------|
| Merge Intervals | O(n²) check all pairs | O(n log n) sort + scan | Sort by start |
| Largest Number | O(n!) permutations | O(nk log n) custom sort | Concatenation comparator |
| Kth Largest | O(n log n) full sort | O(n) quickselect | Random pivot partition |
| Sort List | O(n²) insertion sort | O(n log n) merge sort | Slow/fast split + merge |
| H-Index | O(n log n) sort + scan | O(n) counting sort | Values bounded by n |
| Meeting Rooms II | O(n²) check overlaps | O(n log n) sweep line | Sort starts and ends separately |
| Top K Frequent | O(n log n) sort by freq | O(n) bucket sort | Bucket index = frequency |
| Wiggle Sort II | O(n log n) sort + place | O(n) select + partition | Virtual index mapping |

### Pattern Trigger → Template Map

| When You See... | Reach For... |
|-----------------|-------------|
| "Merge overlapping intervals" | Sort by start → Template C |
| "kth largest / smallest / median" | Quickselect → Template B |
| "Form largest / smallest number" | Custom comparator → Template C |
| "Sort linked list" | Merge sort on list → Template A (linked list variant) |
| "Top K frequent / most common" | Bucket sort → Template D |
| "Count inversions / smaller after self" | Merge sort + count → Template A |
| "Maximum gap in O(n)" | Bucket sort → Template D |
| "Values in range [0, k]" | Counting sort → Template E |
| "Minimum rooms / max overlap" | Sort + sweep → Template C + two pointers |

### Key Java API Reminders

```java
Arrays.sort(arr);                          // primitives: dual-pivot quicksort (unstable)
Arrays.sort(arr, (a, b) -> ...);           // objects: TimSort (stable)
Collections.sort(list, comparator);        // stable sort on List
Arrays.sort(arr, fromIdx, toIdx);          // sort subarray [from, to)
Integer.compare(a, b);                     // safe comparison, no overflow
Comparator.comparingInt(a -> a[0]);        // method reference style
Comparator.comparingInt(...).thenComparing(...);  // multi-key sort
```
