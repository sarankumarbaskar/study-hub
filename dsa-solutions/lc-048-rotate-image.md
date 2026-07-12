# LC #48 — Rotate Image

> Date: 2026-07-12 | Pattern: Arrays & Hashing / Matrix Manipulation | Difficulty: Medium | LC#: 48

---

## Problem

Given an `n x n` matrix, rotate the image by **90 degrees clockwise**.

You must rotate the matrix **in-place**, meaning you should modify the given matrix directly and not return a new matrix.

Example:

```java
Input:
[
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]

Output:
[
  [7, 4, 1],
  [8, 5, 2],
  [9, 6, 3]
]
```

Visual meaning:

```text
Top row becomes right column.
Middle row becomes middle column.
Bottom row becomes left column.
```

---

## Pattern

**Matrix manipulation**

Why?

This is not a HashMap problem, even though it appears under Arrays & Hashing. It tests whether you can reason about row/column indices and perform an in-place transformation safely.

The clean trick is:

```text
90° clockwise rotation = transpose + reverse each row
```

---

## Key Insight

Instead of trying to rotate every cell directly, break the rotation into two simple operations:

```text
1. Transpose the matrix
2. Reverse each row
```

For:

```text
1 2 3
4 5 6
7 8 9
```

### Step 1: Transpose

Transpose means swap:

```text
matrix[i][j] with matrix[j][i]
```

After transpose:

```text
1 4 7
2 5 8
3 6 9
```

### Step 2: Reverse each row

Reverse every row:

```text
1 4 7  ->  7 4 1
2 5 8  ->  8 5 2
3 6 9  ->  9 6 3
```

Final:

```text
7 4 1
8 5 2
9 6 3
```

That is 90 degrees clockwise.

---

## Approach 1: Brute Force — New Matrix

Create a new matrix and place each value into its rotated position.

For a clockwise rotation:

```text
matrix[row][col] goes to rotated[col][n - 1 - row]
```

Example:

```text
matrix[0][0] = 1

rotated[0][2] = 1
```

Because top-left becomes top-right.

### Pseudocode

```text
n = matrix length
create new n x n matrix called rotated

for row = 0 to n-1:
    for col = 0 to n-1:
        newRow = col
        newCol = n - 1 - row
        rotated[newRow][newCol] = matrix[row][col]

copy rotated back into matrix
```

### Java

```java
class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;
        int[][] rotated = new int[n][n];

        for (int row = 0; row < n; row++) {
            for (int col = 0; col < n; col++) {
                rotated[col][n - 1 - row] = matrix[row][col];
            }
        }

        for (int row = 0; row < n; row++) {
            for (int col = 0; col < n; col++) {
                matrix[row][col] = rotated[row][col];
            }
        }
    }
}
```

### Complexity

```text
Time:  O(n²)
Space: O(n²)
```

Why not enough?

The problem asks for in-place rotation. This approach uses an extra `n x n` matrix.

---

## Approach 2: Better — Four-Way Layer Rotation

Rotate cells layer by layer.

For a 3x3 matrix:

```text
1 2 3
4 5 6
7 8 9
```

The outer layer rotates:

```text
1 -> 3 -> 9 -> 7 -> 1
2 -> 6 -> 8 -> 4 -> 2
```

For each layer, we rotate four cells at a time.

### Pseudocode

```text
n = matrix length

for layer = 0 to n/2 - 1:
    first = layer
    last = n - 1 - layer

    for i = first to last - 1:
        offset = i - first

        top = matrix[first][i]

        matrix[first][i] = matrix[last - offset][first]
        matrix[last - offset][first] = matrix[last][last - offset]
        matrix[last][last - offset] = matrix[i][last]
        matrix[i][last] = top
```

### Java

```java
class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;

        for (int layer = 0; layer < n / 2; layer++) {
            int first = layer;
            int last = n - 1 - layer;

            for (int i = first; i < last; i++) {
                int offset = i - first;

                int top = matrix[first][i];

                matrix[first][i] = matrix[last - offset][first];
                matrix[last - offset][first] = matrix[last][last - offset];
                matrix[last][last - offset] = matrix[i][last];
                matrix[i][last] = top;
            }
        }
    }
}
```

### Complexity

```text
Time:  O(n²)
Space: O(1)
```

This is in-place and valid, but index-heavy. In interviews, it is easy to make mistakes here.

---

## Approach 3: Optimal and Clean — Transpose + Reverse Rows

This is the preferred approach because it is both in-place and easy to reason about.

### Step 1: Transpose

Swap cells across the main diagonal.

Before:

```text
1 2 3
4 5 6
7 8 9
```

Swap:

```text
matrix[0][1] with matrix[1][0]  ->  2 with 4
matrix[0][2] with matrix[2][0]  ->  3 with 7
matrix[1][2] with matrix[2][1]  ->  6 with 8
```

After transpose:

```text
1 4 7
2 5 8
3 6 9
```

Important:

```text
Only swap j > i.
```

If you swap all pairs, you swap twice and undo the work.

### Step 2: Reverse each row

```text
1 4 7  ->  7 4 1
2 5 8  ->  8 5 2
3 6 9  ->  9 6 3
```

Final:

```text
7 4 1
8 5 2
9 6 3
```

### Pseudocode

```text
n = matrix length

for row = 0 to n-1:
    for col = row + 1 to n-1:
        swap matrix[row][col] and matrix[col][row]

for each row in matrix:
    left = 0
    right = n - 1

    while left < right:
        swap row[left] and row[right]
        left++
        right--
```

### Java

```java
class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;

        // Step 1: transpose
        for (int row = 0; row < n; row++) {
            for (int col = row + 1; col < n; col++) {
                int temp = matrix[row][col];
                matrix[row][col] = matrix[col][row];
                matrix[col][row] = temp;
            }
        }

        // Step 2: reverse each row
        for (int row = 0; row < n; row++) {
            int left = 0;
            int right = n - 1;

            while (left < right) {
                int temp = matrix[row][left];
                matrix[row][left] = matrix[row][right];
                matrix[row][right] = temp;

                left++;
                right--;
            }
        }
    }
}
```

### Complexity

```text
Time:  O(n²)
Space: O(1)
```

Why `O(n²)`?

The matrix has `n²` cells, and we touch each cell a constant number of times.

Why `O(1)` space?

We only use a few variables: `temp`, `left`, `right`, `row`, `col`.

---

## Java Internals

### 1. `int[][]` is an array of arrays

In Java:

```java
int[][] matrix
```

is not one flat 2D block.

It is:

```text
array of row references
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

So:

```java
matrix[row]
```

is one `int[]` row.

And:

```java
matrix[row][col]
```

means:

```text
go to row array, then access column index
```

### 2. Swapping values changes array contents

When we write:

```java
int temp = matrix[row][col];
matrix[row][col] = matrix[col][row];
matrix[col][row] = temp;
```

we are changing primitive `int` values inside row arrays.

No new matrix is created.

### 3. In-place means do not allocate another matrix

Allowed:

```java
int temp
int left
int right
```

Not allowed for optimal:

```java
int[][] rotated = new int[n][n]
```

because that is `O(n²)` extra space.

---

## Edge Cases

### 1x1 matrix

```java
[[1]]
```

Rotated:

```java
[[1]]
```

Your loops should naturally do nothing.

### 2x2 matrix

```text
1 2
3 4
```

Transpose:

```text
1 3
2 4
```

Reverse rows:

```text
3 1
4 2
```

### Odd-size matrix

For 3x3, center element stays in place.

```text
5 remains center
```

### Negative numbers

Values do not matter. Only positions matter.

---

## Common Mistakes

### Mistake 1: Transposing the full matrix

Bad:

```java
for (int row = 0; row < n; row++) {
    for (int col = 0; col < n; col++) {
        swap(matrix[row][col], matrix[col][row]);
    }
}
```

This swaps each pair twice.

Correct:

```java
for (int col = row + 1; col < n; col++)
```

Only swap above the diagonal.

### Mistake 2: Reverse columns instead of rows

For clockwise rotation:

```text
transpose + reverse rows
```

For anticlockwise rotation:

```text
transpose + reverse columns
```

Do not mix them.

### Mistake 3: Creating a new matrix

The problem says in-place. New matrix may be accepted in some environments but violates the requirement.

### Mistake 4: Confusing row and column

Use names:

```java
row
col
```

instead of:

```java
i
j
```

while learning. It reduces mistakes.

---

## Complexity Summary

| Approach | Idea | Time | Space |
|---|---|---:|---:|
| Brute Force | Create rotated matrix | O(n²) | O(n²) |
| Layer Rotation | Rotate four cells at a time | O(n²) | O(1) |
| Transpose + Reverse Rows | Clean in-place transformation | O(n²) | O(1) |

---

## 60-Second Interview Explanation

> The brute force approach is to create a new matrix and place each element at its rotated position: `rotated[col][n - 1 - row] = matrix[row][col]`, but that uses O(n²) extra space. Since the problem asks for in-place rotation, I use the matrix transformation trick: a 90-degree clockwise rotation is equivalent to transposing the matrix and then reversing each row. During transpose, I swap `matrix[row][col]` with `matrix[col][row]` only for `col > row` to avoid swapping twice. Then I reverse each row using two pointers. This touches each cell a constant number of times, so time is O(n²), and because I only use temporary variables, space is O(1).

---

## Practice Exercise

Trace this manually:

```java
matrix = [
  [ 5,  1,  9, 11],
  [ 2,  4,  8, 10],
  [13,  3,  6,  7],
  [15, 14, 12, 16]
]
```

Expected output:

```java
[
  [15, 13,  2,  5],
  [14,  3,  4,  1],
  [12,  6,  8,  9],
  [16,  7, 10, 11]
]
```

Before coding, answer:

1. What does the matrix look like after transpose?
2. What does reversing each row produce?
3. Why do we start `col = row + 1` in transpose?
