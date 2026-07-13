# LC #15 — 3Sum

> Date: 2026-07-13 | Pattern: Two Pointers | Difficulty: Medium | LC#: 15

---

## Problem

Given an integer array `nums`, return all unique triplets:

```text
[nums[i], nums[j], nums[k]]
```

such that:

```text
i != j != k
nums[i] + nums[j] + nums[k] == 0
```

Example:

```java
Input: nums = [-1, 0, 1, 2, -1, -4]
Output: [[-1, -1, 2], [-1, 0, 1]]
```

Why?

```text
-1 + -1 + 2 = 0
-1 +  0 + 1 = 0
```

Important:

```text
Output must not contain duplicate triplets.
```

So this is not enough:

```text
[-1, 0, 1]
[-1, 1, 0]
[0, -1, 1]
```

These are the same triplet logically. Return it once.

---

## Pattern

**Sort + Fixed Pointer + Two Pointers**

Why?

3Sum can be reduced to 2Sum.

For each number `nums[i]`, fix it as the first number.

Then we need:

```text
nums[left] + nums[right] = -nums[i]
```

That is a 2Sum problem on a sorted subarray.

So the pattern is:

```text
sort array
for each i:
    solve 2Sum using left/right pointers
```

---

## Key Insight

After sorting, we can move pointers based on the sum:

```text
sum = nums[i] + nums[left] + nums[right]
```

If:

```text
sum < 0
```

we need a larger value, so:

```text
left++
```

If:

```text
sum > 0
```

we need a smaller value, so:

```text
right--
```

If:

```text
sum == 0
```

we found a triplet, then move both pointers and skip duplicates.

Sorting makes this possible.

---

## Approach 1: Brute Force

Try every possible triplet.

For every `i`, try every `j`, and for every `j`, try every `k`.

If the sum is zero, add the triplet.

But to avoid duplicates, sort each found triplet and store it in a `Set`.

### Pseudocode

```text
create empty set of triplets

for i = 0 to n-1:
    for j = i+1 to n-1:
        for k = j+1 to n-1:
            if nums[i] + nums[j] + nums[k] == 0:
                triplet = [nums[i], nums[j], nums[k]]
                sort triplet
                add triplet to set

return all triplets from set
```

### Java

```java
import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Set<List<Integer>> set = new HashSet<>();

        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                for (int k = j + 1; k < nums.length; k++) {
                    if (nums[i] + nums[j] + nums[k] == 0) {
                        List<Integer> triplet = Arrays.asList(nums[i], nums[j], nums[k]);
                        Collections.sort(triplet);
                        set.add(triplet);
                    }
                }
            }
        }

        return new ArrayList<>(set);
    }
}
```

### Complexity

```text
Time:  O(n³)
Space: O(number of unique triplets)
```

Why not enough?

Three nested loops are too slow.

Also, using a `Set` hides duplicate handling instead of teaching us the real pattern.

---

## Approach 2: Better — HashSet 2Sum for Each Fixed Element

Fix one number `nums[i]`.

Then use a HashSet to find two numbers after `i` that sum to `-nums[i]`.

This is like doing Two Sum repeatedly.

### Pseudocode

```text
create result set

for i = 0 to n-1:
    create empty seen set

    for j = i+1 to n-1:
        complement = -nums[i] - nums[j]

        if complement exists in seen:
            triplet = [nums[i], nums[j], complement]
            sort triplet
            add triplet to result set

        add nums[j] to seen

return result set as list
```

### Java

```java
import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Set<List<Integer>> result = new HashSet<>();

        for (int i = 0; i < nums.length; i++) {
            Set<Integer> seen = new HashSet<>();

            for (int j = i + 1; j < nums.length; j++) {
                int complement = -nums[i] - nums[j];

                if (seen.contains(complement)) {
                    List<Integer> triplet = Arrays.asList(nums[i], nums[j], complement);
                    Collections.sort(triplet);
                    result.add(triplet);
                }

                seen.add(nums[j]);
            }
        }

        return new ArrayList<>(result);
    }
}
```

### Complexity

```text
Time:  O(n²)
Space: O(n) for seen set + result
```

Why not ideal?

Time is good, but duplicate handling is still delegated to a `Set<List<Integer>>`.

Interviewers usually expect the sorted two-pointer solution because it handles duplicates intentionally.

---

## Approach 3: Optimal — Sort + Two Pointers

Sort the array.

Then for each index `i`, treat `nums[i]` as the first number.

Use two pointers:

```text
left = i + 1
right = n - 1
```

Find pairs where:

```text
nums[i] + nums[left] + nums[right] == 0
```

### Pseudocode

```text
sort nums
create result list

for i = 0 to n-1:
    if i > 0 and nums[i] == nums[i-1]:
        continue

    left = i + 1
    right = n - 1

    while left < right:
        sum = nums[i] + nums[left] + nums[right]

        if sum == 0:
            add [nums[i], nums[left], nums[right]] to result
            left++
            right--

            while left < right and nums[left] == nums[left-1]:
                left++

            while left < right and nums[right] == nums[right+1]:
                right--

        else if sum < 0:
            left++

        else:
            right--

return result
```

### Java

```java
import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);

        List<List<Integer>> result = new ArrayList<>();

        for (int i = 0; i < nums.length; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) {
                continue;
            }

            int left = i + 1;
            int right = nums.length - 1;

            while (left < right) {
                int sum = nums[i] + nums[left] + nums[right];

                if (sum == 0) {
                    result.add(Arrays.asList(nums[i], nums[left], nums[right]));

                    left++;
                    right--;

                    while (left < right && nums[left] == nums[left - 1]) {
                        left++;
                    }

                    while (left < right && nums[right] == nums[right + 1]) {
                        right--;
                    }
                } else if (sum < 0) {
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

### Complexity

```text
Time:  O(n²)
Space: O(1) extra, excluding output
```

Why `O(n²)`?

Sorting:

```text
O(n log n)
```

Outer loop:

```text
O(n)
```

For each `i`, `left` and `right` together scan the remaining array once:

```text
O(n)
```

So:

```text
O(n × n) = O(n²)
```

`O(n²)` dominates `O(n log n)`.

---

## Trace

Input:

```java
nums = [-1, 0, 1, 2, -1, -4]
```

Sort:

```text
[-4, -1, -1, 0, 1, 2]
```

### i = 0

```text
nums[i] = -4
left = 1  -> -1
right = 5 -> 2
```

Sum:

```text
-4 + -1 + 2 = -3
```

Too small. Need larger sum:

```text
left++
```

Try:

```text
-4 + -1 + 2 = -3
-4 +  0 + 2 = -2
-4 +  1 + 2 = -1
```

No triplet.

### i = 1

```text
nums[i] = -1
left = 2  -> -1
right = 5 -> 2
```

Sum:

```text
-1 + -1 + 2 = 0
```

Add:

```text
[-1, -1, 2]
```

Move both:

```text
left++
right--
```

Now:

```text
left = 3  -> 0
right = 4 -> 1
```

Sum:

```text
-1 + 0 + 1 = 0
```

Add:

```text
[-1, 0, 1]
```

### i = 2

```text
nums[i] = -1
nums[i] == nums[i - 1]
```

Skip.

Why?

If we use this second `-1` as the fixed value, we will generate duplicate triplets.

Final result:

```text
[[-1, -1, 2], [-1, 0, 1]]
```

---

## Duplicate Handling

There are three duplicate-handling points.

### 1. Skip duplicate fixed value

```java
if (i > 0 && nums[i] == nums[i - 1]) {
    continue;
}
```

Why?

If you already processed `-1` as the fixed number, processing another `-1` as fixed creates duplicate triplets.

### 2. Skip duplicate left values after finding a triplet

```java
while (left < right && nums[left] == nums[left - 1]) {
    left++;
}
```

Why after `left++`?

Because after finding a valid triplet, we move `left` once, then skip any repeated value that would create the same triplet.

### 3. Skip duplicate right values after finding a triplet

```java
while (left < right && nums[right] == nums[right + 1]) {
    right--;
}
```

Why `right + 1`?

Because we already did:

```java
right--;
```

So the previous right value is now at:

```text
right + 1
```

---

## Why Sorting Helps

Sorting gives two powers:

### 1. Move pointers intelligently

If sum is too small:

```text
left++
```

because moving left right gives a larger value.

If sum is too large:

```text
right--
```

because moving right left gives a smaller value.

### 2. Skip duplicates easily

Duplicates become adjacent:

```text
[-4, -1, -1, 0, 1, 2]
```

So duplicate checks become simple:

```java
nums[i] == nums[i - 1]
nums[left] == nums[left - 1]
nums[right] == nums[right + 1]
```

---

## Java Internals

### 1. `Arrays.sort(int[])`

For primitive `int[]`, Java sorts in-place.

```java
Arrays.sort(nums);
```

This changes the original array.

For LeetCode, that is fine unless the problem says input must remain unchanged.

### 2. `Arrays.asList(nums[i], nums[left], nums[right])`

This creates a fixed-size `List<Integer>`.

The `int` values are autoboxed:

```text
int -> Integer
```

Example:

```java
Arrays.asList(-1, 0, 1)
```

creates:

```text
List<Integer>
```

This is fine for result output.

### 3. Output space

The result list can contain many triplets.

When we say:

```text
Space: O(1) extra
```

we mean excluding the output list.

The output itself can be:

```text
O(number of triplets)
```

---

## Edge Cases

### Empty array

```java
nums = []
```

Return:

```text
[]
```

### Less than 3 elements

```java
nums = [1, 2]
```

No triplet possible.

Return:

```text
[]
```

### All zeros

```java
nums = [0, 0, 0, 0]
```

Only one unique triplet:

```text
[[0, 0, 0]]
```

Duplicate skipping prevents multiple copies.

### No solution

```java
nums = [1, 2, 3]
```

Return:

```text
[]
```

### Mixed duplicates

```java
nums = [-2, 0, 0, 2, 2]
```

Valid:

```text
[[-2, 0, 2]]
```

Only once.

---

## Common Mistakes

### Mistake 1: Not sorting first

Two pointers only works because the array is sorted.

Without sorting, `left++` does not guarantee a larger value and `right--` does not guarantee a smaller value.

### Mistake 2: Forgetting duplicate skip for `i`

If you do not skip duplicate fixed values, result contains duplicate triplets.

### Mistake 3: Skipping duplicates before adding the triplet

Handle duplicates after finding a valid triplet and moving pointers.

Correct order:

```text
add triplet
left++
right--
skip duplicate left
skip duplicate right
```

### Mistake 4: Returning indices

3Sum asks for values, not indices.

Return:

```text
[-1, 0, 1]
```

not:

```text
[0, 1, 2]
```

### Mistake 5: Thinking HashMap Two Sum is always better

For 3Sum, sorting + two pointers is preferred because duplicate handling becomes cleaner.

---

## Complexity Summary

| Approach | Idea | Time | Space |
|---|---|---:|---:|
| Brute Force | Try all triplets | O(n³) | O(result) |
| HashSet per fixed value | Reduce to 2Sum with set | O(n²) | O(n) |
| Sort + Two Pointers | Fixed value + two pointers | O(n²) | O(1) extra |

---

## 60-Second Interview Explanation

> The brute force approach is to check every triplet, which is O(n³). A better approach is to fix one number and use a HashSet to solve a Two Sum variant for the remaining numbers, giving O(n²), but duplicate handling is messy. The clean optimal approach is to sort the array first. Then I iterate through each index as the fixed first number, skipping duplicate fixed values. For each fixed number, I use two pointers, left and right, to find pairs that make the sum zero. If the sum is too small, I move left forward; if too large, I move right backward. When I find a valid triplet, I add it and skip duplicate left and right values. Sorting enables both pointer movement and duplicate skipping. Time is O(n²), and extra space is O(1) excluding output.

---

## Practice Exercise

Trace this manually:

```java
nums = [-2, 0, 1, 1, 2]
```

Expected output:

```text
[[-2, 0, 2], [-2, 1, 1]]
```

Answer:

1. What does the sorted array look like?
2. For `i = 0`, what are `left` and `right`?
3. When do you move `left`?
4. When do you move `right`?
5. Where do duplicates get skipped?
