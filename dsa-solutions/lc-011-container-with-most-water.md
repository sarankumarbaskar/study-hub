# LC #11 — Container With Most Water

> Date: 2026-07-13 | Pattern: Two Pointers | Difficulty: Medium | LC#: 11

---

## Problem

You are given an integer array `height`.

Each index represents a vertical line:

```text
index = x-position
height[index] = line height
```

Choose two lines that, together with the x-axis, form a container that holds the most water.

Return the maximum amount of water.

Example:

```java
Input:  height = [1,8,6,2,5,4,8,3,7]
Output: 49
```

Why?

Choose:

```text
left index  = 1, height = 8
right index = 8, height = 7
```

Width:

```text
8 - 1 = 7
```

Height is limited by the shorter line:

```text
min(8, 7) = 7
```

Area:

```text
7 × 7 = 49
```

---

## Pattern

**Two Pointers**

Why?

We need to choose two positions:

```text
left line
right line
```

The area depends on:

```text
width × min(leftHeight, rightHeight)
```

If we start with the widest possible container and move pointers inward intelligently, we can avoid checking every pair.

---

## Formula

For two indices `left` and `right`:

```text
width  = right - left
height = min(height[left], height[right])
area   = width × height
```

Important:

```text
The shorter line limits the water.
```

If one side is height `3` and the other side is height `10`, the water cannot rise above `3`.

Visual:

```text
left height = 3
right height = 10

Water height = 3, not 10
```

---

## Key Insight

Start with:

```text
left = 0
right = n - 1
```

This gives the maximum possible width.

At each step:

```text
area = (right - left) × min(height[left], height[right])
```

Then move the pointer with the **shorter height**.

Why?

Because the shorter line is the bottleneck.

If:

```text
height[left] < height[right]
```

then the current area is limited by `height[left]`.

Moving `right` inward cannot help because:

```text
width becomes smaller
height is still limited by height[left]
```

So the only chance to get a larger area is to move `left` and hope for a taller line.

That is the whole logic.

---

## Approach 1: Brute Force

Try every possible pair of lines and calculate the area.

This is straightforward but slow.

### Pseudocode

```text
best = 0

for left = 0 to n-1:
    for right = left + 1 to n-1:
        width = right - left
        containerHeight = min(height[left], height[right])
        area = width × containerHeight
        best = max(best, area)

return best
```

### Java

```java
class Solution {
    public int maxArea(int[] height) {
        int best = 0;

        for (int left = 0; left < height.length; left++) {
            for (int right = left + 1; right < height.length; right++) {
                int width = right - left;
                int containerHeight = Math.min(height[left], height[right]);
                int area = width * containerHeight;

                best = Math.max(best, area);
            }
        }

        return best;
    }
}
```

### Complexity

```text
Time:  O(n²)
Space: O(1)
```

Why not enough?

For each index, we compare with every later index.

That means:

```text
n × n pairs
```

Too slow for large input.

---

## Approach 2: Optimal — Two Pointers

Start with the widest container:

```text
left = 0
right = n - 1
```

Calculate area.

Then move the shorter side inward.

### Pseudocode

```text
left = 0
right = n - 1
best = 0

while left < right:
    width = right - left
    containerHeight = min(height[left], height[right])
    area = width × containerHeight
    best = max(best, area)

    if height[left] < height[right]:
        left++
    else:
        right--

return best
```

### Java

```java
class Solution {
    public int maxArea(int[] height) {
        int left = 0;
        int right = height.length - 1;
        int best = 0;

        while (left < right) {
            int width = right - left;
            int containerHeight = Math.min(height[left], height[right]);
            int area = width * containerHeight;

            best = Math.max(best, area);

            if (height[left] < height[right]) {
                left++;
            } else {
                right--;
            }
        }

        return best;
    }
}
```

### Complexity

```text
Time:  O(n)
Space: O(1)
```

Why `O(n)`?

Each step moves one pointer:

```text
left moves right
or
right moves left
```

No pointer ever moves backward.

So at most:

```text
n - 1 moves
```

---

## Trace

Input:

```java
height = [1,8,6,2,5,4,8,3,7]
```

Initial:

```text
left = 0  height[left] = 1
right = 8 height[right] = 7
best = 0
```

### Step 1

```text
width = 8 - 0 = 8
containerHeight = min(1, 7) = 1
area = 8 × 1 = 8
best = 8
```

Move shorter side:

```text
height[left] = 1
height[right] = 7

left is shorter, so left++
```

Now:

```text
left = 1
right = 8
```

### Step 2

```text
height[left] = 8
height[right] = 7

width = 8 - 1 = 7
containerHeight = min(8, 7) = 7
area = 7 × 7 = 49
best = 49
```

Move shorter side:

```text
right is shorter, so right--
```

Now:

```text
left = 1
right = 7
```

### Step 3

```text
height[left] = 8
height[right] = 3

width = 7 - 1 = 6
containerHeight = min(8, 3) = 3
area = 18
best = 49
```

Move shorter side:

```text
right is shorter, so right--
```

Continue until pointers meet.

Final:

```text
best = 49
```

---

## Why Move the Shorter Pointer?

This is the interview-critical part.

Suppose:

```text
left height  = 3
right height = 10
```

Current area is limited by:

```text
min(3, 10) = 3
```

Now imagine moving the taller pointer (`right`) inward.

What happens?

```text
width decreases
left height is still 3
container height can still be at most 3 unless left changes
```

So moving the taller pointer cannot improve the bottleneck.

The only useful move is:

```text
move the shorter pointer
```

because maybe we find a taller line that increases the limiting height.

Short version:

```text
Width always decreases.
So to get bigger area, height must increase.
Only the shorter side can improve the limiting height.
```

---

## Visual

```text
height[left]  = 3
height[right] = 10

     right
       |
       |
       |
       |
       |
left   |
 |     |
 |~~~~~|
 |~~~~~|
 |~~~~~|
```

Water height is only `3`.

The right line is tall, but extra height above `3` is useless.

So we move `left`.

---

## Java Internals

### 1. `int[]` stores primitive values

```java
int[] height
```

stores primitive `int` values directly.

No boxing.

No `Integer` objects.

Access:

```java
height[left]
height[right]
```

is direct array indexing.

### 2. Array indexing is O(1)

This is why two pointers is efficient.

Each access:

```java
height[i]
```

is constant time.

### 3. `Math.min` and `Math.max`

These are simple static methods:

```java
Math.min(a, b)
Math.max(a, b)
```

They do not change complexity.

### 4. Integer overflow?

In this LeetCode problem, constraints make `int` safe.

But conceptually:

```java
int area = width * containerHeight;
```

can overflow if both values are huge.

In production-style code, use:

```java
long area = (long) width * containerHeight;
```

For LeetCode, `int` is accepted.

---

## Edge Cases

### Minimum length

```java
height = [1, 1]
```

Only one possible container:

```text
width = 1
height = 1
area = 1
```

Return:

```text
1
```

### Increasing heights

```java
height = [1, 2, 3, 4, 5]
```

Still works.

The best is not necessarily using the tallest line alone, because width matters.

### Decreasing heights

```java
height = [5, 4, 3, 2, 1]
```

Still works.

### Equal heights

```java
height[left] == height[right]
```

You can move either pointer.

This code moves `right`:

```java
if (height[left] < height[right]) {
    left++;
} else {
    right--;
}
```

That is fine.

Why?

Both sides are equally limiting. Moving either one is safe.

---

## Common Mistakes

### Mistake 1: Moving the taller pointer

Bad intuition:

```text
Move taller because maybe even taller exists.
```

Wrong.

The current area is limited by the shorter pointer.

Move the shorter pointer.

### Mistake 2: Thinking tallest two lines always win

Not true.

Area depends on:

```text
height × width
```

Two very tall lines close together may hold less water than medium lines far apart.

### Mistake 3: Forgetting width

Wrong:

```java
area = Math.min(height[left], height[right]);
```

Correct:

```java
area = (right - left) * Math.min(height[left], height[right]);
```

### Mistake 4: Using nested loops in final solution

Brute force is fine to explain, but final solution should be two pointers.

---

## Complexity Summary

| Approach | Idea | Time | Space |
|---|---|---:|---:|
| Brute Force | Try every pair | O(n²) | O(1) |
| Two Pointers | Start widest, move shorter side | O(n) | O(1) |

---

## 60-Second Interview Explanation

> The brute force approach checks every pair of lines and calculates area, which is O(n²). The optimal approach uses two pointers. I start with the widest possible container, with left at the beginning and right at the end. At each step, I calculate area as `(right - left) * min(height[left], height[right])`. The shorter line limits the water, so I move the pointer at the shorter line inward. Moving the taller line cannot help because width decreases and the same shorter line would still limit the height. Each pointer moves at most n times, so the time complexity is O(n), and the space complexity is O(1).

---

## Practice Exercise

Trace this:

```java
height = [1, 3, 2, 5, 25, 24, 5]
```

Answer:

1. What are `left`, `right`, `width`, and `area` at each step?
2. Which pointer moves and why?
3. What is the maximum area?
4. Why are the two tallest lines not always automatically the answer?
