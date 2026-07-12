# LC #54 — Spiral Matrix

> Date: 2026-07-12 | Pattern: Matrix Traversal / Boundary Shrinking | Difficulty: Medium | LC#: 54

---

## Problem

Given an `m x n` matrix, return all elements of the matrix in spiral order.

Example:

```java
Input:
[
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]

Output:
[1, 2, 3, 6, 9, 8, 7, 4, 5]
```

Visual:

```text
1 → 2 → 3
        ↓
4 → 5   6
↑       ↓
7 ← 8 ← 9
```

The traversal direction is:

```text
right → down → left → up
```

Then repeat inward.

---

## Pattern

**Boundary shrinking simulation**

Why?

We need to traverse the outer border first, then move inward.

So we maintain four boundaries:

```text
top
bottom
left
right
```

After traversing one side, shrink that boundary.

---

## Key Insight

Think of the matrix as layers.

For:

```text
1  2  3  4
5  6  7  8
9 10 11 12
```

Initial boundaries:

```text
top = 0
bottom = 2
left = 0
right = 3
```

Traverse:

```text
1. top row left → right
2. right column top → bottom
3. bottom row right → left
4. left column bottom → top
```

Then shrink:

```text
top++
right--
bottom--
left++
```

Now you are inside the next layer.

The main difficulty is not the idea. The main difficulty is avoiding duplicate traversal when only one row or one column remains.

That is why we check boundaries before going left and up.

---

## Approach 1: Brute Force — Direction Simulation With Visited Matrix

Use a `visited` matrix to track which cells are already added.

Start at `(0, 0)`, move in the current direction, and turn right when:

```text
next cell is out of bounds
or
next cell is already visited
```

Directions:

```text
right: (0, +1)
down:  (+1, 0)
left:  (0, -1)
up:    (-1, 0)
```

### Pseudocode

```text
rows = matrix row count
cols = matrix column count

create visited[rows][cols]
directions = right, down, left, up

row = 0
col = 0
direction = 0

repeat rows * cols times:
    add matrix[row][col] to result
    mark visited[row][col]

    nextRow = row + directions[direction].rowDelta
    nextCol = col + directions[direction].colDelta

    if next cell is out of bounds OR visited:
        direction = (direction + 1) % 4
        recompute nextRow and nextCol

    row = nextRow
    col = nextCol

return result
```

### Java

```java
import java.util.*;

class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        int rows = matrix.length;
        int cols = matrix[0].length;

        boolean[][] visited = new boolean[rows][cols];
        List<Integer> result = new ArrayList<>();

        int[][] directions = {
            {0, 1},   // right
            {1, 0},   // down
            {0, -1},  // left
            {-1, 0}   // up
        };

        int row = 0;
        int col = 0;
        int direction = 0;

        for (int count = 0; count < rows * cols; count++) {
            result.add(matrix[row][col]);
            visited[row][col] = true;

            int nextRow = row + directions[direction][0];
            int nextCol = col + directions[direction][1];

            if (nextRow < 0 || nextRow >= rows ||
                nextCol < 0 || nextCol >= cols ||
                visited[nextRow][nextCol]) {

                direction = (direction + 1) % 4;
                nextRow = row + directions[direction][0];
                nextCol = col + directions[direction][1];
            }

            row = nextRow;
            col = nextCol;
        }

        return result;
    }
}
```

### Complexity

```text
Time:  O(m × n)
Space: O(m × n)
```

Why not ideal?

It works, but `visited` uses extra space. The boundary approach is cleaner and uses only constant extra space besides the output.

---

## Approach 2: Optimal — Boundary Shrinking

Maintain four boundaries:

```text
top
bottom
left
right
```

Initial:

```java
top = 0
bottom = matrix.length - 1
left = 0
right = matrix[0].length - 1
```

Then loop while:

```text
top <= bottom AND left <= right
```

Each round:

```text
1. Traverse top row from left to right
   then top++

2. Traverse right column from top to bottom
   then right--

3. If top <= bottom:
      traverse bottom row from right to left
      then bottom--

4. If left <= right:
      traverse left column from bottom to top
      then left++
```

Why the checks before step 3 and 4?

Because after shrinking, there may be no remaining row or column.

Without those checks, you may add duplicates.

---

## Trace

Matrix:

```text
1 2 3
4 5 6
7 8 9
```

Initial:

```text
top = 0
bottom = 2
left = 0
right = 2
result = []
```

### Round 1: go right across top row

```text
add 1, 2, 3
result = [1, 2, 3]
top = 1
```

### Go down right column

```text
add 6, 9
result = [1, 2, 3, 6, 9]
right = 1
```

### Go left across bottom row

Check:

```text
top <= bottom
1 <= 2 true
```

Traverse:

```text
add 8, 7
result = [1, 2, 3, 6, 9, 8, 7]
bottom = 1
```

### Go up left column

Check:

```text
left <= right
0 <= 1 true
```

Traverse:

```text
add 4
result = [1, 2, 3, 6, 9, 8, 7, 4]
left = 1
```

Now boundaries:

```text
top = 1
bottom = 1
left = 1
right = 1
```

### Round 2

Only one cell remains:

```text
matrix[1][1] = 5
```

Go right across top row:

```text
add 5
result = [1, 2, 3, 6, 9, 8, 7, 4, 5]
top = 2
```

Now:

```text
top = 2
bottom = 1
```

Loop ends.

Final:

```text
[1, 2, 3, 6, 9, 8, 7, 4, 5]
```

---

## Pseudocode

```text
create result list

top = 0
bottom = number of rows - 1
left = 0
right = number of columns - 1

while top <= bottom AND left <= right:

    for col = left to right:
        add matrix[top][col]
    top++

    for row = top to bottom:
        add matrix[row][right]
    right--

    if top <= bottom:
        for col = right down to left:
            add matrix[bottom][col]
        bottom--

    if left <= right:
        for row = bottom down to top:
            add matrix[row][left]
        left++

return result
```

---

## Java

```java
import java.util.*;

class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> result = new ArrayList<>();

        int top = 0;
        int bottom = matrix.length - 1;
        int left = 0;
        int right = matrix[0].length - 1;

        while (top <= bottom && left <= right) {
            // 1. left to right across top row
            for (int col = left; col <= right; col++) {
                result.add(matrix[top][col]);
            }
            top++;

            // 2. top to bottom down right column
            for (int row = top; row <= bottom; row++) {
                result.add(matrix[row][right]);
            }
            right--;

            // 3. right to left across bottom row
            if (top <= bottom) {
                for (int col = right; col >= left; col--) {
                    result.add(matrix[bottom][col]);
                }
                bottom--;
            }

            // 4. bottom to top up left column
            if (left <= right) {
                for (int row = bottom; row >= top; row--) {
                    result.add(matrix[row][left]);
                }
                left++;
            }
        }

        return result;
    }
}
```

---

## Why Boundary Checks Are Required

This is the most common bug.

Consider one-row matrix:

```text
1 2 3
```

Initial:

```text
top = 0
bottom = 0
left = 0
right = 2
```

Step 1 adds:

```text
1, 2, 3
```

Then:

```text
top = 1
```

Now:

```text
top = 1
bottom = 0
```

There is no bottom row left.

If you do not check:

```java
if (top <= bottom)
```

you may traverse the same row again.

Similarly, for one-column matrix:

```text
1
2
3
```

you need:

```java
if (left <= right)
```

before going upward on the left column.

---

## Java Internals

### 1. `int[][]` is array of arrays

In Java:

```java
int[][] matrix
```

means:

```text
matrix is an array of row references
each row is an int[]
```

Visual:

```text
matrix
  |
  v
[ row0Ref, row1Ref, row2Ref ]
     |        |        |
     v        v        v
  [1,2,3]  [4,5,6]  [7,8,9]
```

When you access:

```java
matrix[row][col]
```

Java first finds:

```text
matrix[row]
```

then accesses:

```text
thatRow[col]
```

### 2. Output list uses boxing

The method returns:

```java
List<Integer>
```

But matrix values are:

```java
int
```

So:

```java
result.add(matrix[row][col]);
```

autoboxes:

```text
int -> Integer
```

For LeetCode, this is normal.

### 3. Extra space complexity excludes output

We return a list of all elements.

That output list has:

```text
m × n elements
```

But when we say boundary approach has `O(1)` extra space, we mean:

```text
excluding the required output list
```

The algorithm itself only uses:

```text
top, bottom, left, right, row, col
```

---

## Edge Cases

### 1. Single row

```java
matrix = [[1, 2, 3]]
```

Output:

```text
[1, 2, 3]
```

### 2. Single column

```java
matrix = [
  [1],
  [2],
  [3]
]
```

Output:

```text
[1, 2, 3]
```

### 3. Rectangular matrix

```java
matrix = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9,10,11,12]
]
```

Output:

```text
[1,2,3,4,8,12,11,10,9,5,6,7]
```

### 4. One element

```java
matrix = [[1]]
```

Output:

```text
[1]
```

---

## Common Mistakes

### Mistake 1: No boundary check before bottom row

Bad:

```java
for (int col = right; col >= left; col--) {
    result.add(matrix[bottom][col]);
}
```

Correct:

```java
if (top <= bottom) {
    for (int col = right; col >= left; col--) {
        result.add(matrix[bottom][col]);
    }
    bottom--;
}
```

### Mistake 2: No boundary check before left column

Correct:

```java
if (left <= right) {
    for (int row = bottom; row >= top; row--) {
        result.add(matrix[row][left]);
    }
    left++;
}
```

### Mistake 3: Updating boundary before traversal

Order matters.

Correct:

```text
traverse top row
then top++
```

Not:

```text
top++
then traverse top row
```

### Mistake 4: Confusing row and column loops

Right movement changes column:

```java
for (int col = left; col <= right; col++)
```

Down movement changes row:

```java
for (int row = top; row <= bottom; row++)
```

Use names `row` and `col`, not `i` and `j`, while learning.

---

## Complexity Summary

| Approach | Idea | Time | Space |
|---|---|---:|---:|
| Direction + visited | Walk and turn when blocked | O(m × n) | O(m × n) |
| Boundary shrinking | Traverse borders and shrink | O(m × n) | O(1) extra |

---

## 60-Second Interview Explanation

> I use four boundaries: top, bottom, left, and right. While top is within bottom and left is within right, I traverse the current outer layer in four directions: left to right across the top row, top to bottom down the right column, right to left across the bottom row, and bottom to top up the left column. After each direction, I shrink that boundary. The important detail is checking `top <= bottom` before traversing the bottom row and `left <= right` before traversing the left column, because in single-row or single-column cases, those sides may no longer exist. Each element is visited once, so time is O(m × n), and extra space is O(1) excluding the output list.

---

## Practice Exercise

Trace this manually:

```java
matrix = [
  [1,  2,  3,  4],
  [5,  6,  7,  8],
  [9, 10, 11, 12]
]
```

Expected output:

```text
[1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
```

Answer these before coding:

1. What are the initial `top`, `bottom`, `left`, `right` values?
2. What elements are added after the first top-row traversal?
3. Why do we need `if (top <= bottom)` before traversing the bottom row?
4. Why do we need `if (left <= right)` before traversing the left column?
