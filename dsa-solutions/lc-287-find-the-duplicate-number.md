# LC #287 — Find the Duplicate Number

> Date: 2026-07-20 | Pattern: Two Pointers / Floyd's Cycle Detection | Difficulty: Medium | LC#: 287

---

## Problem

Given an array `nums` containing `n + 1` integers where each integer is in the range `[1, n]`, there is **exactly one duplicate number**.

Find and return the duplicate number.

Constraints:

```text
Must not modify the array.
Must use only O(1) extra space.
```

Example:

```java
Input:  nums = [1, 3, 4, 2, 2]
Output: 2
```

Another example:

```java
Input:  nums = [3, 1, 3, 4, 2]
Output: 3
```

---

## Pattern

**Floyd's Tortoise and Hare (Cycle Detection)**

Why?

This problem looks like an array problem, but it is secretly a **linked list cycle problem**.

The key insight:

```text
Treat each value as a pointer to the next index.
```

Example:

```java
nums = [1, 3, 4, 2, 2]
```

If we follow the chain:

```text
index 0 → value 1 → go to index 1
index 1 → value 3 → go to index 3
index 3 → value 2 → go to index 2
index 2 → value 4 → go to index 4
index 4 → value 2 → go to index 2  ← CYCLE!
```

Visual:

```text
0 → 1 → 3 → 2 → 4
              ↑     |
              └─────┘
```

Because there is a duplicate, two different indices point to the same index. That creates a cycle.

The duplicate number is the **entry point of the cycle**.

This is exactly Floyd's algorithm — the same one used to detect cycles in linked lists.

---

## Why This Works

There are `n + 1` numbers in the range `[1, n]`.

By Pigeonhole Principle, at least one number must repeat.

When we treat `nums[i]` as a pointer to the next index:

```text
nums[a] == nums[b] means both a and b point to the same next index
```

That creates a cycle.

The start of the cycle is the duplicate value.

---

## Approach 1: Brute Force

For each number, check if it appears again later in the array.

### Pseudocode

```text
for i = 0 to n:
    for j = i + 1 to n:
        if nums[i] == nums[j]:
            return nums[i]
```

### Java

```java
class Solution {
    public int findDuplicate(int[] nums) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] == nums[j]) {
                    return nums[i];
                }
            }
        }

        return -1;
    }
}
```

### Complexity

```text
Time:  O(n²)
Space: O(1)
```

Why not enough?

Too slow for large arrays.

---

## Approach 2: Better — HashSet

Scan the array. For each number, check if it was seen before.

### Pseudocode

```text
create empty set

for each num in nums:
    if num exists in set:
        return num
    add num to set
```

### Java

```java
import java.util.HashSet;
import java.util.Set;

class Solution {
    public int findDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();

        for (int num : nums) {
            if (seen.contains(num)) {
                return num;
            }

            seen.add(num);
        }

        return -1;
    }
}
```

### Complexity

```text
Time:  O(n)
Space: O(n)
```

Why not ideal?

The problem says O(1) extra space. HashSet uses O(n) space.

---

## Approach 3: Better — Sorting

Sort the array. Duplicates become adjacent.

### Pseudocode

```text
sort nums

for i = 1 to n:
    if nums[i] == nums[i - 1]:
        return nums[i]
```

### Java

```java
import java.util.Arrays;

class Solution {
    public int findDuplicate(int[] nums) {
        Arrays.sort(nums);

        for (int i = 1; i < nums.length; i++) {
            if (nums[i] == nums[i - 1]) {
                return nums[i];
            }
        }

        return -1;
    }
}
```

### Complexity

```text
Time:  O(n log n)
Space: O(1) or O(log n) depending on sort
```

Why not ideal?

The problem says "must not modify the array." Sorting modifies it.

---

## Approach 4: Optimal — Floyd's Cycle Detection

Treat the array as a linked list where:

```text
node = index
next pointer = nums[index]
```

Use Floyd's algorithm:

```text
Phase 1: Find the meeting point (detect cycle)
Phase 2: Find the cycle entry point (find duplicate)
```

### Phase 1: Detect the Cycle

Use two pointers:

```text
slow: moves 1 step at a time
fast: moves 2 steps at a time
```

Both start at index 0.

They will meet inside the cycle.

### Phase 2: Find the Entry Point

Reset one pointer to start (index 0).

Move both pointers 1 step at a time.

Where they meet is the cycle entry point = the duplicate number.

### Why Phase 2 Works

This is the mathematical property of Floyd's algorithm:

```text
Let:
  L = distance from start to cycle entry
  C = cycle length
  K = distance from cycle entry to meeting point

At meeting point:
  slow traveled: L + K
  fast traveled: L + K + nC (some full cycles)

Since fast = 2 × slow:
  L + K + nC = 2(L + K)
  nC = L + K
  L = nC - K

So if we move L steps from the start,
and L steps from the meeting point,
both arrive at the cycle entry.
```

### Pseudocode

```text
slow = nums[0]
fast = nums[0]

Phase 1: find meeting point
repeat:
    slow = nums[slow]
    fast = nums[nums[fast]]
until slow == fast

Phase 2: find cycle entry
slow = nums[0]
while slow != fast:
    slow = nums[slow]
    fast = nums[fast]

return slow
```

### Trace

```java
nums = [1, 3, 4, 2, 2]
```

Phase 1:

```text
Start:
  slow = nums[0] = 1
  fast = nums[nums[0]] = nums[1] = 3

Step 1:
  slow = nums[1] = 3
  fast = nums[nums[3]] = nums[2] = 4

Step 2:
  slow = nums[3] = 2
  fast = nums[nums[4]] = nums[2] = 4

Step 3:
  slow = nums[2] = 4
  fast = nums[nums[4]] = nums[2] = 4

slow == fast == 4 → meeting point found
```

Phase 2:

```text
Reset slow to start:
  slow = nums[0] = 1
  fast = 4 (stays at meeting point)

Step 1:
  slow = nums[1] = 3
  fast = nums[4] = 2

Step 2:
  slow = nums[3] = 2
  fast = nums[2] = 4

Wait, let me re-trace more carefully.

Actually Phase 2 resets slow to INDEX 0, not nums[0].
```

Let me re-trace correctly:

Phase 2:

```text
slow = 0  (reset to start INDEX)
fast = 4  (stays at meeting point)

Step 1:
  slow = nums[0] = 1
  fast = nums[4] = 2

Step 2:
  slow = nums[1] = 3
  fast = nums[2] = 4

Step 3:
  slow = nums[3] = 2
  fast = nums[4] = 2

slow == fast == 2 → duplicate is 2 ✅
```

### Java

```java
class Solution {
    public int findDuplicate(int[] nums) {
        int slow = nums[0];
        int fast = nums[0];

        // Phase 1: find meeting point
        do {
            slow = nums[slow];
            fast = nums[nums[fast]];
        } while (slow != fast);

        // Phase 2: find cycle entry
        slow = nums[0];
        while (slow != fast) {
            slow = nums[slow];
            fast = nums[fast];
        }

        return slow;
    }
}
```

Wait — the standard implementation actually starts both at `nums[0]` and uses `do-while` for Phase 1 so they don't match at the very start. Let me verify the correct version:

```java
class Solution {
    public int findDuplicate(int[] nums) {
        int slow = nums[0];
        int fast = nums[0];

        // Phase 1: detect cycle
        do {
            slow = nums[slow];
            fast = nums[nums[fast]];
        } while (slow != fast);

        // Phase 2: find entry point
        slow = nums[0];
        while (slow != fast) {
            slow = nums[slow];
            fast = nums[fast];
        }

        return slow;
    }
}
```

This is correct. The `do-while` ensures at least one step before comparing.

### Complexity

```text
Time:  O(n)
Space: O(1)
```

Why O(n)?

Phase 1: slow and fast will meet within at most 2n steps.

Phase 2: both pointers travel at most n steps.

Why O(1) space?

Only two integer variables: `slow` and `fast`.

No extra array, no HashSet, no sorting.

---

## Java Internals

### 1. Array as implicit linked list

This is the core trick:

```java
slow = nums[slow];
```

means:

```text
Follow the pointer: go to index nums[slow]
```

In a real linked list:

```java
slow = slow.next;
```

Here the array IS the linked list. Each value points to the next index.

### 2. `do-while` vs `while`

We use `do-while` for Phase 1 because both pointers start at the same value (`nums[0]`).

If we used `while (slow != fast)`, the loop would never execute because they're equal at the start.

### 3. No array modification

The problem says "must not modify the array."

Floyd's algorithm only reads `nums[i]`. It never writes to the array.

Sorting violates this constraint.

### 4. Values are 1 to n

The values are in range `[1, n]`, and array size is `n + 1`.

Index 0 is never pointed to by any value (values start at 1).

So index 0 is always the "head" of the linked list — it is never part of the cycle.

That is why we start from `nums[0]`.

---

## Visual: Array as Linked List

```java
nums = [1, 3, 4, 2, 2]
index: 0  1  2  3  4
```

Following pointers:

```text
index 0 → value 1 → index 1
index 1 → value 3 → index 3
index 3 → value 2 → index 2
index 2 → value 4 → index 4
index 4 → value 2 → index 2  ← back to index 2!

0 → 1 → 3 → 2 → 4
              ↑     |
              └─────┘

Cycle entry = index 2
Value at cycle entry = 2
Duplicate = 2
```

---

## Edge Cases

### Duplicate at the beginning

```java
nums = [2, 2, 2]
```

```text
0 → 2 → 2 → 2 (cycle at index 2)
Duplicate = 2
```

### Two elements

```java
nums = [1, 1]
```

```text
0 → 1 → 1 → 1 (cycle at index 1)
Duplicate = 1
```

### Large cycle

```java
nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 5]
```

```text
Cycle starts at value 5.
```

---

## Common Mistakes

### Mistake 1: Starting both pointers at index 0 and using `while`

Bad:

```java
int slow = nums[0];
int fast = nums[0];

while (slow != fast) { ... }
```

This never executes because slow == fast at the start.

Use `do-while`.

### Mistake 2: Modifying the array

Sorting or marking visited indices violates the constraint:

```text
Must not modify the array.
```

### Mistake 3: Using extra space

HashSet uses O(n) space. The constraint says O(1).

### Mistake 4: Not understanding why this is a cycle problem

The key mental shift:

```text
Array index = node
Array value = next pointer
Duplicate value = two nodes pointing to same next = cycle
```

Without this mental model, the Floyd approach seems like magic.

### Mistake 5: Phase 2 — forgetting to reset to nums[0]

In Phase 2, reset slow to `nums[0]`, not to `0`.

Actually, both conventions work depending on how you set up Phase 1. The standard approach:

```java
// Phase 1: start both at nums[0], use do-while
// Phase 2: reset slow to nums[0], move both one step
```

---

## Complexity Summary

| Approach | Idea | Time | Space | Modifies Array? |
|---|---|---:|---:|---|
| Brute Force | Compare every pair | O(n²) | O(1) | No |
| HashSet | Track seen numbers | O(n) | O(n) | No |
| Sorting | Sort and scan adjacent | O(n log n) | O(1) | Yes |
| Floyd's Cycle | Tortoise and Hare | O(n) | O(1) | No |

---

## 60-Second Interview Explanation

> The brute force checks every pair, which is O(n²). Using a HashSet gives O(n) time but O(n) space. Sorting gives O(n log n) but modifies the array. The optimal approach treats the array as an implicit linked list: each value points to the next index. Since there's a duplicate, two indices point to the same value, creating a cycle. I use Floyd's Tortoise and Hare algorithm. In Phase 1, slow moves one step and fast moves two steps until they meet inside the cycle. In Phase 2, I reset slow to the start and move both one step at a time. Where they meet is the cycle entry point, which is the duplicate number. This gives O(n) time and O(1) space without modifying the array.

---

## Practice Exercise

Trace this manually:

```java
nums = [3, 1, 3, 4, 2]
```

Answer:

1. Draw the implicit linked list (index → value → next index).
2. Where does the cycle start?
3. What are slow and fast at each step of Phase 1?
4. What are slow and fast at each step of Phase 2?
5. What is the duplicate?
