# LC #75 — Sort Colors

> Date: 2026-07-15 | Pattern: Two Pointers / Dutch National Flag | Difficulty: Medium | LC#: 75

---

## Problem

Given an array `nums` with `n` objects colored red, white, or blue, sort them **in-place** so that objects of the same color are adjacent, in the order red, white, and blue.

We use the integers `0`, `1`, and `2` to represent red, white, and blue.

Example:

```java
Input:  nums = [2, 0, 2, 1, 1, 0]
Output: [0, 0, 1, 1, 2, 2]
```

Constraint:

```text
Do it in one pass without using a sorting algorithm.
```

---

## Pattern

**Dutch National Flag / Three Pointers**

Why?

We have exactly 3 categories:

```text
0 → left section
1 → middle section
2 → right section
```

We can use 3 pointers to partition the array in a single pass.

This is called the **Dutch National Flag Problem**, invented by Edsger Dijkstra.

---

## Key Insight

Maintain 3 pointers:

```text
low  → boundary for 0s (everything before low is 0)
mid  → current element being examined
high → boundary for 2s (everything after high is 2)
```

Visual:

```text
[0, 0, 0, ..., 1, 1, 1, ..., ?, ?, ..., 2, 2, 2]
 ←── 0s ──→  ←── 1s ──→  ←─ unseen ─→  ←── 2s ──→
           low          mid            high
```

Rules:

```text
If nums[mid] == 0:
    swap nums[low] and nums[mid]
    low++
    mid++

If nums[mid] == 1:
    mid++

If nums[mid] == 2:
    swap nums[mid] and nums[high]
    high--
    (do NOT advance mid — the swapped element needs to be checked)
```

Why not advance `mid` when swapping with `high`?

Because the element that comes from `high` is unseen. It could be `0`, `1`, or `2`. We need to check it.

But when swapping with `low`, the element that comes from `low` is already processed (it must be `1`, because `low` is behind `mid`). So `mid` can safely advance.

---

## Approach 1: Brute Force — Counting Sort

Count occurrences of 0, 1, and 2. Then overwrite the array.

### Pseudocode

```text
count0 = 0
count1 = 0
count2 = 0

for each num in nums:
    if num == 0: count0++
    if num == 1: count1++
    if num == 2: count2++

index = 0

repeat count0 times:
    nums[index++] = 0

repeat count1 times:
    nums[index++] = 1

repeat count2 times:
    nums[index++] = 2
```

### Java

```java
class Solution {
    public void sortColors(int[] nums) {
        int count0 = 0;
        int count1 = 0;
        int count2 = 0;

        for (int num : nums) {
            if (num == 0) count0++;
            else if (num == 1) count1++;
            else count2++;
        }

        int index = 0;

        for (int i = 0; i < count0; i++) nums[index++] = 0;
        for (int i = 0; i < count1; i++) nums[index++] = 1;
        for (int i = 0; i < count2; i++) nums[index++] = 2;
    }
}
```

### Complexity

```text
Time:  O(n) — two passes
Space: O(1)
```

Why not ideal?

It uses **two passes**: one to count, one to write.

The problem asks for **one pass**.

Also, this approach does not generalize well to more complex partitioning problems.

---

## Approach 2: Optimal — Dutch National Flag (One Pass)

Use three pointers: `low`, `mid`, `high`.

One pass through the array, partitioning into three sections.

### Pseudocode

```text
low = 0
mid = 0
high = n - 1

while mid <= high:
    if nums[mid] == 0:
        swap nums[low] and nums[mid]
        low++
        mid++

    else if nums[mid] == 1:
        mid++

    else:
        swap nums[mid] and nums[high]
        high--
```

### Trace

Input:

```java
nums = [2, 0, 2, 1, 1, 0]
```

Initial:

```text
low = 0
mid = 0
high = 5
```

### Step 1

```text
nums[mid] = nums[0] = 2

2 → swap with nums[high]
swap nums[0] and nums[5]

nums = [0, 0, 2, 1, 1, 2]

high--
high = 4

mid stays at 0
```

Why does `mid` stay?

Because the swapped element `0` from position `5` is now at `mid`. We haven't checked it yet.

### Step 2

```text
nums[mid] = nums[0] = 0

0 → swap with nums[low]
swap nums[0] and nums[0]    (same position, no change)

nums = [0, 0, 2, 1, 1, 2]

low = 1
mid = 1
```

### Step 3

```text
nums[mid] = nums[1] = 0

0 → swap with nums[low]
swap nums[1] and nums[1]    (same position)

nums = [0, 0, 2, 1, 1, 2]

low = 2
mid = 2
```

### Step 4

```text
nums[mid] = nums[2] = 2

2 → swap with nums[high]
swap nums[2] and nums[4]

nums = [0, 0, 1, 1, 2, 2]

high = 3
mid stays at 2
```

### Step 5

```text
nums[mid] = nums[2] = 1

1 → mid++
mid = 3
```

### Step 6

```text
nums[mid] = nums[3] = 1

1 → mid++
mid = 4
```

Now:

```text
mid = 4
high = 3
mid > high → stop
```

Final:

```text
[0, 0, 1, 1, 2, 2]
```

### Java

```java
class Solution {
    public void sortColors(int[] nums) {
        int low = 0;
        int mid = 0;
        int high = nums.length - 1;

        while (mid <= high) {
            if (nums[mid] == 0) {
                int temp = nums[low];
                nums[low] = nums[mid];
                nums[mid] = temp;

                low++;
                mid++;

            } else if (nums[mid] == 1) {
                mid++;

            } else {
                int temp = nums[mid];
                nums[mid] = nums[high];
                nums[high] = temp;

                high--;
            }
        }
    }
}
```

### Complexity

```text
Time:  O(n) — single pass
Space: O(1)
```

Why `O(n)`?

Each step either advances `mid` or decreases `high`.

Both move toward each other.

Total steps:

```text
at most n
```

---

## Why NOT Advance mid When Swapping With high?

This is the most common mistake.

When you swap `nums[mid]` with `nums[high]`:

```text
The element that was at high is now at mid.
You have never seen this element before.
It could be 0, 1, or 2.
```

So you must check it again:

```text
Do NOT advance mid.
```

When you swap `nums[mid]` with `nums[low]`:

```text
The element that was at low is now at mid.
But low is always behind or equal to mid.
Everything between low and mid has already been processed.
So the element from low must be 1.
```

So:

```text
It is safe to advance mid.
```

Visual:

```text
[0, 0, 1, 1, ?, ?, ?, 2, 2]
       low     mid     high

Everything before low: confirmed 0
Everything between low and mid: confirmed 1
Everything after high: confirmed 2
Between mid and high: unseen
```

---

## Java Internals

### 1. In-place swap

Java does not have a built-in swap.

You must use:

```java
int temp = nums[a];
nums[a] = nums[b];
nums[b] = temp;
```

This modifies the array directly.

### 2. `int[]` is a primitive array

No boxing. No objects per element.

```java
nums[mid]
```

is direct array access:

```text
O(1)
```

### 3. Void return

The method returns `void`:

```java
public void sortColors(int[] nums)
```

The array is modified in-place.

In Java, arrays are passed by reference (the reference is copied, but the array object is shared).

So changes inside the method are visible to the caller.

---

## Edge Cases

### Already sorted

```java
nums = [0, 0, 1, 1, 2, 2]
```

Works. `mid` advances through `0`s and `1`s, then stops when it meets `high`.

### All same

```java
nums = [1, 1, 1]
```

`mid` advances through all `1`s. No swaps.

### Single element

```java
nums = [2]
```

```text
low = 0, mid = 0, high = 0
nums[0] = 2
swap with high (same position)
high = -1
mid > high → stop
```

### Two elements

```java
nums = [2, 0]
```

```text
Step 1: swap nums[0] and nums[1] → [0, 2], high = 0
Step 2: nums[0] = 0, swap with low (same), low = 1, mid = 1
mid > high → stop
```

Result:

```text
[0, 2]
```

### Only 0s and 2s

```java
nums = [2, 2, 0, 0]
```

Works. The `1` section will be empty.

---

## Common Mistakes

### Mistake 1: Advancing mid when nums[mid] == 2

Bad:

```java
if (nums[mid] == 2) {
    swap(nums, mid, high);
    high--;
    mid++;    // WRONG
}
```

The swapped element at `mid` is unchecked. You may skip a `0` or `2`.

### Mistake 2: Using `mid < high` instead of `mid <= high`

Bad:

```java
while (mid < high)
```

When `mid == high`, that element is still unseen. It needs to be processed.

Correct:

```java
while (mid <= high)
```

### Mistake 3: Using counting sort and saying it is one pass

Counting sort uses two passes:

```text
Pass 1: count
Pass 2: overwrite
```

The problem asks for one pass.

### Mistake 4: Using Arrays.sort()

```java
Arrays.sort(nums);
```

This works but is:

```text
O(n log n)
```

The problem expects:

```text
O(n)
```

And it explicitly says "without using a sorting algorithm."

---

## Complexity Summary

| Approach | Idea | Time | Space | Passes |
|---|---|---:|---:|---:|
| Counting Sort | Count 0s, 1s, 2s, overwrite | O(n) | O(1) | 2 |
| Dutch National Flag | Three pointers partition | O(n) | O(1) | 1 |

---

## 60-Second Interview Explanation

> The brute force approach is counting sort: count occurrences of 0, 1, and 2, then overwrite the array. This works but uses two passes. The optimal approach is the Dutch National Flag algorithm using three pointers: low, mid, and high. Low marks the boundary for 0s, high marks the boundary for 2s, and mid scans through the array. If mid sees a 0, swap it with low and advance both. If mid sees a 1, just advance mid. If mid sees a 2, swap with high and decrement high but do not advance mid, because the swapped element from high is unseen and needs to be checked. This partitions the array in one pass with O(n) time and O(1) space.

---

## Practice Exercise

Trace this manually:

```java
nums = [1, 2, 0, 1, 0, 2]
```

Expected output:

```text
[0, 0, 1, 1, 2, 2]
```

Answer:

1. What are `low`, `mid`, `high` at each step?
2. When does `mid` NOT advance?
3. What is at `mid` after each swap with `high`?
4. Why can `mid` safely advance after swapping with `low`?
