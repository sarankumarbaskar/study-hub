# LC #347 — Top K Frequent Elements

> Date: 2026-07-11 | Pattern: Arrays & Hashing / Heap / Bucket Sort | Difficulty: Medium | LC#: 347

---

## Problem

Given an integer array `nums` and an integer `k`, return the `k` most frequent elements.

Example:

```java
Input:  nums = [1, 1, 1, 2, 2, 3], k = 2
Output: [1, 2]
```

Why?

```text
1 appears 3 times
2 appears 2 times
3 appears 1 time

Top 2 frequent elements = 1 and 2
```

Output can be in any order.

---

## Pattern

This problem combines three patterns:

```text
1. HashMap       → count frequencies
2. Heap          → keep top K elements efficiently
3. Bucket Sort   → use frequency as an index
```

The first step is always the same:

```text
Build frequency map:

number → count
```

For:

```java
nums = [1, 1, 1, 2, 2, 3]
```

Frequency map:

```text
1 → 3
2 → 2
3 → 1
```

Then the question becomes:

```text
How do I extract the K entries with highest frequency?
```

---

## Approach 1: Brute Force

First count frequencies using a `HashMap`.

Then repeatedly scan the map to find the current most frequent element, remove it, and repeat `k` times.

This is brute force because we do a full scan of all unique numbers for every answer element.

### Pseudocode

```text
build frequency map

result = empty list

repeat k times:
    bestNum = none
    bestFreq = -infinity

    for each num in frequency map:
        if frequency[num] > bestFreq:
            bestNum = num
            bestFreq = frequency[num]

    add bestNum to result
    remove bestNum from frequency map

return result
```

### Java

```java
import java.util.*;

class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();

        for (int num : nums) {
            freq.put(num, freq.getOrDefault(num, 0) + 1);
        }

        int[] result = new int[k];

        for (int i = 0; i < k; i++) {
            int bestNum = 0;
            int bestFreq = -1;

            for (Map.Entry<Integer, Integer> entry : freq.entrySet()) {
                if (entry.getValue() > bestFreq) {
                    bestNum = entry.getKey();
                    bestFreq = entry.getValue();
                }
            }

            result[i] = bestNum;
            freq.remove(bestNum);
        }

        return result;
    }
}
```

### Complexity

Let:

```text
n = nums.length
m = number of unique elements
```

```text
Build frequency map: O(n)
Scan map k times:    O(k × m)

Time:  O(n + k × m)
Space: O(m)
```

Worst case:

```text
m = n
k = n

Time = O(n²)
```

This is too slow.

---

## Approach 2: Better — HashMap + Sorting

Count frequencies.

Then sort all unique numbers by frequency descending.

Example:

```text
freq:
1 → 3
2 → 2
3 → 1

Sort by frequency descending:
[1, 2, 3]

Take first k = 2:
[1, 2]
```

### Pseudocode

```text
build frequency map

create list of all unique numbers

sort list by frequency descending

take first k numbers

return result
```

### Java

```java
import java.util.*;

class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();

        for (int num : nums) {
            freq.put(num, freq.getOrDefault(num, 0) + 1);
        }

        List<Integer> unique = new ArrayList<>(freq.keySet());

        unique.sort((a, b) -> freq.get(b) - freq.get(a));

        int[] result = new int[k];

        for (int i = 0; i < k; i++) {
            result[i] = unique.get(i);
        }

        return result;
    }
}
```

### Comparator Safety Note

This line works for typical LeetCode constraints:

```java
unique.sort((a, b) -> freq.get(b) - freq.get(a));
```

But in production Java, prefer:

```java
unique.sort((a, b) -> Integer.compare(freq.get(b), freq.get(a)));
```

Why?

Subtraction in a comparator can overflow.

For frequencies, overflow is unlikely because counts are bounded by `nums.length`, but the senior Java habit is:

```java
Use Integer.compare(), not subtraction.
```

### Complexity

```text
Build frequency map: O(n)
Sort m unique keys:  O(m log m)
Take k elements:     O(k)

Time:  O(n + m log m)
Space: O(m)
```

Since `m <= n`, worst case:

```text
Time: O(n log n)
```

Good, but not the best.

---

## Approach 3: Better for Small K — HashMap + Min Heap

Use a min heap of size `k`.

Why min heap?

We only care about the top `k` frequent elements.

The heap stores the current best `k` elements. The least frequent among those `k` stays at the top.

When heap size becomes bigger than `k`, remove the least frequent element.

Example:

```text
freq:
1 → 3
2 → 2
3 → 1
k = 2
```

Heap logic:

```text
add 1(freq 3): heap = [1]
add 2(freq 2): heap = [2, 1]       top has smaller freq
add 3(freq 1): heap = [3, 1, 2]    size 3 > k
remove top 3                       heap = [2, 1]

answer = [2, 1]
```

### Pseudocode

```text
build frequency map

create min heap ordered by frequency

for each num in frequency map:
    add num to heap

    if heap size > k:
        remove heap top

result = empty array of size k

while heap not empty:
    remove from heap and add to result

return result
```

### Java

```java
import java.util.*;

class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();

        for (int num : nums) {
            freq.put(num, freq.getOrDefault(num, 0) + 1);
        }

        PriorityQueue<Integer> minHeap = new PriorityQueue<>(
            (a, b) -> Integer.compare(freq.get(a), freq.get(b))
        );

        for (int num : freq.keySet()) {
            minHeap.offer(num);

            if (minHeap.size() > k) {
                minHeap.poll();
            }
        }

        int[] result = new int[k];

        for (int i = 0; i < k; i++) {
            result[i] = minHeap.poll();
        }

        return result;
    }
}
```

### Complexity

```text
Build frequency map: O(n)
For each unique num: heap offer/poll costs O(log k)

Time:  O(n + m log k)
Space: O(m + k)
```

Since `m <= n`:

```text
Time: O(n log k)
```

This is very good when `k` is small compared to `n`.

---

## Approach 4: Optimal — Bucket Sort

This is the most interview-optimal approach for this problem.

Key idea:

```text
Frequency can never be greater than nums.length.
```

So we can create buckets where:

```text
bucket[f] = list of numbers that appear f times
```

Example:

```java
nums = [1, 1, 1, 2, 2, 3]
```

Frequency map:

```text
1 → 3
2 → 2
3 → 1
```

Buckets:

```text
bucket[0] = null
bucket[1] = [3]
bucket[2] = [2]
bucket[3] = [1]
bucket[4] = null
bucket[5] = null
bucket[6] = null
```

Now scan from highest frequency to lowest:

```text
i = 6 → empty
i = 5 → empty
i = 4 → empty
i = 3 → [1]  add 1
i = 2 → [2]  add 2

k = 2 reached
return [1, 2]
```

### Pseudocode

```text
build frequency map

create buckets array of size nums.length + 1
each bucket holds a list of numbers

for each num in frequency map:
    f = frequency[num]
    add num to buckets[f]

result = empty list

for freq = nums.length down to 1:
    if buckets[freq] is not empty:
        for each num in buckets[freq]:
            add num to result

            if result size == k:
                return result
```

### Java

```java
import java.util.*;

class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();

        for (int num : nums) {
            freq.put(num, freq.getOrDefault(num, 0) + 1);
        }

        List<Integer>[] buckets = new List[nums.length + 1];

        for (Map.Entry<Integer, Integer> entry : freq.entrySet()) {
            int num = entry.getKey();
            int count = entry.getValue();

            if (buckets[count] == null) {
                buckets[count] = new ArrayList<>();
            }

            buckets[count].add(num);
        }

        int[] result = new int[k];
        int index = 0;

        for (int count = buckets.length - 1; count >= 0; count--) {
            if (buckets[count] == null) {
                continue;
            }

            for (int num : buckets[count]) {
                result[index++] = num;

                if (index == k) {
                    return result;
                }
            }
        }

        return result;
    }
}
```

### Complexity

```text
Build frequency map: O(n)
Build buckets:       O(m)
Scan buckets:        O(n)

Time:  O(n)
Space: O(n)
```

This is optimal for LeetCode.

---

## Java Internals

### 1. `HashMap<Integer, Integer>` autoboxing

`nums` is:

```java
int[] nums
```

But the frequency map is:

```java
Map<Integer, Integer>
```

So both keys and values are boxed:

```text
int -> Integer
```

This is normal in Java DSA.

But internally, it means:

```text
HashMap stores references to Integer objects, not raw int primitives.
```

### 2. `getOrDefault`

This:

```java
freq.put(num, freq.getOrDefault(num, 0) + 1);
```

means:

```text
if num exists in map:
    oldCount = freq.get(num)
else:
    oldCount = 0

freq.put(num, oldCount + 1)
```

It still does HashMap lookup internally.

For interview coding, this is clean and acceptable.

### 3. `PriorityQueue` is a min heap by default

In Java:

```java
PriorityQueue<Integer> pq = new PriorityQueue<>();
```

is a min heap.

Smallest element comes out first.

For this problem, the heap comparator is:

```java
(a, b) -> Integer.compare(freq.get(a), freq.get(b))
```

That means:

```text
The number with smaller frequency has higher priority and is removed first.
```

This is why we can keep heap size at `k`.

### 4. Generic array warning in bucket sort

This line:

```java
List<Integer>[] buckets = new List[nums.length + 1];
```

creates a generic array.

Java may warn:

```text
unchecked or unsafe operations
```

Why?

Because Java generics use type erasure.

At runtime, Java does not know `List<Integer>[]`; it only knows `List[]`.

For LeetCode, this is accepted.

If you wanted to avoid the warning, you could use:

```java
List<List<Integer>> buckets = new ArrayList<>();
```

and initialize `n + 1` lists manually.

But the array version is common and clean for interviews.

---

## Edge Cases

### One element

```java
nums = [1], k = 1
```

Frequency:

```text
1 → 1
```

Return:

```text
[1]
```

### All same

```java
nums = [5, 5, 5, 5], k = 1
```

Return:

```text
[5]
```

### All unique

```java
nums = [1, 2, 3, 4], k = 2
```

Each frequency is 1.

Any 2 elements are valid.

### Negative numbers

```java
nums = [-1, -1, -2, -2, -2, 3], k = 2
```

Frequency:

```text
-2 → 3
-1 → 2
3  → 1
```

Return:

```text
[-2, -1]
```

---

## Common Mistakes

### Mistake 1: Sorting the original nums array

Sorting `nums` does not directly solve frequency.

You first need counts.

Sorting can help group equal numbers, but HashMap is simpler.

### Mistake 2: Using max heap of all elements and saying it is optimal

Max heap over all unique elements gives:

```text
O(n + m log m)
```

This is similar to sorting.

The min-heap optimization is to keep only `k` elements:

```text
O(n + m log k)
```

### Mistake 3: Wrong comparator direction

For min heap of size `k`, you want least frequent at the top.

Correct:

```java
(a, b) -> Integer.compare(freq.get(a), freq.get(b))
```

Wrong for min-heap approach:

```java
(a, b) -> Integer.compare(freq.get(b), freq.get(a))
```

That creates a max heap. If you then remove when size > k, you remove the most frequent element, which breaks the result.

### Mistake 4: Forgetting result can be in any order

LeetCode accepts any order.

So:

```text
[1, 2]
[2, 1]
```

both pass.

---

## Complexity Summary

| Approach | Idea | Time | Space |
|---|---|---:|---:|
| Brute Force | Repeatedly scan map for max frequency | O(n + k × m) | O(m) |
| Sorting | Sort unique numbers by frequency | O(n + m log m) | O(m) |
| Min Heap | Keep only top k in heap | O(n + m log k) | O(m + k) |
| Bucket Sort | Frequency as array index | O(n) | O(n) |

Where:

```text
n = total number of elements
m = number of unique elements
```

---

## 60-Second Interview Explanation

> First I count frequencies using a HashMap. The brute force would repeatedly scan the map to pick the current max frequency, which can be O(n²). A better approach is to sort the unique elements by frequency, giving O(n log n). Another good approach is a min heap of size k: push each unique number, and if heap size exceeds k, remove the least frequent; this gives O(n log k). The optimal approach for this problem is bucket sort because frequency can only range from 1 to nums.length. I create an array of lists where bucket[f] contains all numbers that appear f times. Then I scan buckets from high frequency to low frequency until I collect k elements. That gives O(n) time and O(n) space.

---

## Practice Exercise

Solve this without looking:

```java
nums = [4, 4, 4, 6, 6, 7, 7, 7, 7, 8]
k = 2
```

Frequency:

```text
4 → 3
6 → 2
7 → 4
8 → 1
```

Expected top 2:

```text
[7, 4]
```

Then answer:

1. What is the frequency map?
2. What does the bucket array look like?
3. Why does scanning from right to left give the answer?
