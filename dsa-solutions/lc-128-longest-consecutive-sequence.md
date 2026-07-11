# LC #128 — Longest Consecutive Sequence

> Date: 2026-07-11 | Pattern: Arrays & Hashing / HashSet | Difficulty: Medium | LC#: 128

---

## Problem

Given an unsorted integer array `nums`, return the length of the longest consecutive elements sequence.

Example:

```java
Input:  nums = [100, 4, 200, 1, 3, 2]
Output: 4
```

Why?

```text
The longest consecutive sequence is:

1, 2, 3, 4

Length = 4
```

Important constraint:

```text
You must write an O(n) algorithm.
```

That constraint is the main clue: sorting gives `O(n log n)`, so sorting is not optimal.

---

## Pattern

**HashSet lookup**

Why?

We need to repeatedly ask:

```text
Does num + 1 exist?
Does num - 1 exist?
```

If we use an array scan, each check is `O(n)`.

If we use a `HashSet`, each check is `O(1)` average.

So the core pattern is:

```text
Put all numbers into a HashSet.
Then use O(1) lookup to grow sequences.
```

---

## Key Insight

Do not start counting from every number.

Only start counting from the **beginning of a sequence**.

A number is the beginning of a sequence if:

```text
num - 1 does NOT exist in the set
```

Example:

```text
nums = [100, 4, 200, 1, 3, 2]
set  = {100, 4, 200, 1, 3, 2}
```

Check each number:

```text
100:
  99 does not exist
  start sequence: 100
  length = 1

4:
  3 exists
  not a start
  skip

200:
  199 does not exist
  start sequence: 200
  length = 1

1:
  0 does not exist
  start sequence: 1, 2, 3, 4
  length = 4

3:
  2 exists
  not a start
  skip

2:
  1 exists
  not a start
  skip
```

That is the whole trick.

If you count from `1`, you get `1, 2, 3, 4`.

If you later see `2`, you skip it because it is not the start. This prevents repeated work.

---

## Approach 1: Brute Force

For every number, try to build a sequence by repeatedly checking if `current + 1` exists in the original array.

The problem: checking existence by scanning the array is expensive.

### Pseudocode

```text
best = 0

for each num in nums:
    current = num
    length = 1

    while array contains current + 1:
        current = current + 1
        length = length + 1

    best = max(best, length)

return best
```

### Java

```java
class Solution {
    public int longestConsecutive(int[] nums) {
        int best = 0;

        for (int num : nums) {
            int current = num;
            int length = 1;

            while (contains(nums, current + 1)) {
                current++;
                length++;
            }

            best = Math.max(best, length);
        }

        return best;
    }

    private boolean contains(int[] nums, int target) {
        for (int num : nums) {
            if (num == target) {
                return true;
            }
        }
        return false;
    }
}
```

### Complexity

```text
Time:  O(n^3) worst case
Space: O(1)
```

Why `O(n^3)` worst case?

For each number, the `while` loop can grow up to `n` steps.

Each `contains()` call scans `n` elements.

So:

```text
n starting points × n sequence steps × n scan = O(n^3)
```

This is too slow.

---

## Approach 2: Better — Sorting

Sort the array first. Then consecutive numbers will be adjacent.

Example:

```text
nums   = [100, 4, 200, 1, 3, 2]
sorted = [1, 2, 3, 4, 100, 200]
```

Now scan once:

```text
1 -> 2 -> 3 -> 4   length 4
100                length 1
200                length 1
```

Need to handle duplicates carefully.

Example:

```text
[1, 2, 2, 3]
```

The duplicate `2` should not reset the sequence.

### Pseudocode

```text
if nums is empty:
    return 0

sort nums

best = 1
currentLength = 1

for i = 1 to n-1:
    if nums[i] == nums[i-1]:
        continue

    if nums[i] == nums[i-1] + 1:
        currentLength = currentLength + 1
    else:
        currentLength = 1

    best = max(best, currentLength)

return best
```

### Java

```java
import java.util.Arrays;

class Solution {
    public int longestConsecutive(int[] nums) {
        if (nums.length == 0) {
            return 0;
        }

        Arrays.sort(nums);

        int best = 1;
        int currentLength = 1;

        for (int i = 1; i < nums.length; i++) {
            if (nums[i] == nums[i - 1]) {
                continue;
            }

            if (nums[i] == nums[i - 1] + 1) {
                currentLength++;
            } else {
                currentLength = 1;
            }

            best = Math.max(best, currentLength);
        }

        return best;
    }
}
```

### Complexity

```text
Time:  O(n log n)
Space: O(1) or O(log n), depending on sorting implementation
```

Why not optimal?

The problem explicitly asks for `O(n)`. Sorting costs `O(n log n)`, so this is acceptable for understanding but not the final interview answer.

---

## Approach 3: Optimal — HashSet and Sequence Starts

Put all numbers into a `HashSet`.

Then only start counting from numbers that are sequence starts:

```text
num is a start if num - 1 is NOT in the set
```

Then grow forward:

```text
num, num + 1, num + 2, ...
```

### Pseudocode

```text
create empty set

for each num in nums:
    add num to set

best = 0

for each num in set:
    if set does not contain num - 1:
        current = num
        length = 1

        while set contains current + 1:
            current = current + 1
            length = length + 1

        best = max(best, length)

return best
```

### Trace

```text
nums = [100, 4, 200, 1, 3, 2]

set = {100, 4, 200, 1, 3, 2}
best = 0
```

Now iterate:

```text
num = 100
99 not in set -> start
sequence: 100
length = 1
best = 1

num = 4
3 exists -> not a start -> skip

num = 200
199 not in set -> start
sequence: 200
length = 1
best = 1

num = 1
0 not in set -> start
sequence:
  1 exists
  2 exists
  3 exists
  4 exists
  5 not exists
length = 4
best = 4

num = 3
2 exists -> not a start -> skip

num = 2
1 exists -> not a start -> skip
```

Return:

```text
4
```

### Java

```java
import java.util.HashSet;
import java.util.Set;

class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();

        for (int num : nums) {
            set.add(num);
        }

        int best = 0;

        for (int num : set) {
            if (!set.contains(num - 1)) {
                int current = num;
                int length = 1;

                while (set.contains(current + 1)) {
                    current++;
                    length++;
                }

                best = Math.max(best, length);
            }
        }

        return best;
    }
}
```

### Complexity

```text
Time:  O(n) average
Space: O(n)
```

Important: Why is it `O(n)` if there is a nested `while`?

Because the `while` loop only runs for sequence starts.

Every number is visited at most once as part of a growing sequence.

Example:

```text
1 -> 2 -> 3 -> 4
```

Only `1` starts the chain.

When the loop later sees `2`, `3`, or `4`, it skips them because `num - 1` exists.

So the total work across all while loops is `O(n)`, not `O(n^2)`.

---

## Java Internals

### 1. `HashSet` is backed by `HashMap`

This line:

```java
Set<Integer> set = new HashSet<>();
```

internally uses a `HashMap`.

Conceptually:

```java
HashSet<Integer> set
```

is roughly:

```java
HashMap<Integer, Object> map
```

When you do:

```java
set.add(100);
```

internally it behaves like:

```java
map.put(100, PRESENT);
```

where `PRESENT` is a dummy object.

So:

```java
set.contains(100)
```

internally behaves like:

```java
map.containsKey(100)
```

That means all the HashMap internals you studied apply here:

```text
hashCode()
hash spreading
bucket index
collision handling
equals()
resize
treeification
```

### 2. `Integer` autoboxing

`nums` is an `int[]`.

But `HashSet<Integer>` stores `Integer` objects.

So this:

```java
set.add(num);
```

autoboxes:

```text
int -> Integer
```

For DSA, this is fine.

For production performance-sensitive code, this creates object overhead. But LeetCode expects this Java solution.

### 3. HashSet removes duplicates

If input is:

```java
[1, 2, 2, 3]
```

The set becomes:

```text
{1, 2, 3}
```

That is good. Duplicates should not extend the sequence.

### 4. HashSet is unordered

Iteration order is not guaranteed.

This is fine because the algorithm does not depend on order.

We only depend on membership checks:

```java
set.contains(num - 1)
set.contains(current + 1)
```

---

## Edge Cases

### Empty array

```java
nums = []
```

Set is empty, loop never runs, `best = 0`.

Return:

```text
0
```

### One element

```java
nums = [7]
```

Sequence is:

```text
7
```

Return:

```text
1
```

### Duplicates

```java
nums = [1, 2, 2, 3]
```

Set:

```text
{1, 2, 3}
```

Longest sequence:

```text
1, 2, 3
```

Return:

```text
3
```

### Negative numbers

```java
nums = [-2, -1, 0, 1]
```

Longest sequence:

```text
-2, -1, 0, 1
```

Return:

```text
4
```

### Unordered input

```java
nums = [9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6]
```

Longest sequence:

```text
3, 4, 5, 6, 7, 8, 9
```

Return:

```text
7
```

---

## Common Mistakes

### Mistake 1: Sorting and saying it is optimal

Sorting is:

```text
O(n log n)
```

But the problem asks for:

```text
O(n)
```

Sorting is the better approach, not the optimal approach.

### Mistake 2: Starting sequence from every number

Bad:

```text
Start from 1, count 1-2-3-4
Start from 2, count 2-3-4
Start from 3, count 3-4
Start from 4, count 4
```

This repeats work.

Correct:

```text
Only start at 1, because 0 does not exist.
Skip 2, 3, 4 because each has a previous number.
```

### Mistake 3: Using `List.contains()`

This is bad:

```java
List<Integer> list = new ArrayList<>();
list.contains(x); // O(n)
```

Use `HashSet`:

```java
set.contains(x); // O(1) average
```

### Mistake 4: Forgetting duplicates

In sorting approach, duplicates must be skipped:

```java
if (nums[i] == nums[i - 1]) {
    continue;
}
```

In HashSet approach, duplicates are naturally removed.

---

## Complexity Summary

| Approach | Idea | Time | Space |
|---|---|---:|---:|
| Brute Force | For each number, scan array for next number repeatedly | O(n^3) | O(1) |
| Sorting | Sort, then scan consecutive runs | O(n log n) | O(1) / O(log n) |
| HashSet | Only start from sequence beginnings | O(n) average | O(n) |

---

## 60-Second Interview Explanation

> The brute force approach is to start from every number and repeatedly search the array for the next consecutive value, but each search is linear, so it becomes too slow. A better approach is to sort the array and scan consecutive runs, handling duplicates carefully, which gives O(n log n). The optimal approach uses a HashSet for O(1) average membership checks. I add all numbers to the set, then only start counting from numbers that are true starts of a sequence — meaning `num - 1` is not in the set. From each start, I keep checking `current + 1` and count the length. This avoids repeated work because middle elements like 2, 3, and 4 are skipped if 1 started the sequence. So every number participates in at most one sequence walk, giving O(n) average time and O(n) space.

---

## Practice Exercise

Solve this without looking:

```java
nums = [0, 3, 7, 2, 5, 8, 4, 6, 0, 1]
```

Expected output:

```text
9
```

Why?

```text
0, 1, 2, 3, 4, 5, 6, 7, 8
```

Then answer:

1. Which numbers are sequence starts?
2. Why do we skip `1`, `2`, `3`, etc.?
3. Why is the `while` loop not O(n^2) overall?
