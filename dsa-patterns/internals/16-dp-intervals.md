# Interval DP — Interview Execution Playbook

> **Core Idea**: `dp[i][j]` = optimal answer for the subproblem on range `[i, j]`. Try every split point `k` to divide the range into two smaller subproblems. Fill the table by **increasing interval length** so all dependencies are ready.

---

## 1. Pattern Recognition Signals

You're looking at Interval DP when:

| Signal | Example Phrasing |
|--------|-----------------|
| **Merge/split operations on a range** | "merge stones", "cut a stick", "burst balloons" |
| **Optimal partition of a sequence** | "minimum cost to split array", "matrix chain multiplication" |
| **"Minimum/maximum cost to process range [i, j]"** | "minimum insertions to make palindrome", "minimum score triangulation" |
| **Answer for [i, j] depends on smaller sub-intervals** | "longest palindromic subsequence in s[i..j]" |
| **Order of operations matters within a range** | "burst balloons — which one to pop last?" |
| **Problem involves contiguous subarray/substring** | "strange printer — minimum turns to print s[i..j]" |

**Quick litmus test**: If you can phrase the problem as "What's the best I can do on subarray `[i, j]`?" and the answer combines results from `[i, k]` and `[k+1, j]` (or similar decomposition), it's Interval DP.

---

## 2. Thinking Framework

### Step-by-Step Mental Model

```
1. DEFINE STATE
   dp[i][j] = answer for interval [i, j]
   (cost, length, count — whatever the problem asks)

2. IDENTIFY TRANSITION
   For each split point k in [i, j-1] (or [i+1, j-1] for "last element" style):
     dp[i][j] = optimize over k of:
       dp[i][k] + dp[k+1][j] + cost(i, k, j)

3. SET BASE CASES
   - Single element: dp[i][i] = 0 or 1 (problem-dependent)
   - Adjacent pair: dp[i][i+1] (sometimes needed)

4. DETERMINE ITERATION ORDER
   ⚠️ ALWAYS iterate by LENGTH (len = 1, 2, ..., n)
   For each length, sweep all valid starting positions i.
   j = i + len - 1

5. EXTRACT ANSWER
   Usually dp[0][n-1] (entire range)
```

### Why Iterate by Length?

When computing `dp[i][j]`, you need `dp[i][k]` and `dp[k+1][j]` — both are **shorter intervals**. If you iterate by start index `i` or end index `j` alone, dependencies may not be satisfied. Iterating by increasing length guarantees all shorter intervals are computed first.

### Complexity Profile

| Aspect | Typical |
|--------|---------|
| Time | O(n³) — three nested loops: length × start × split |
| Space | O(n²) — the dp table |
| Optimization | Knuth's optimization → O(n²) for specific cost functions |

---

## 3. Java Templates

### Template A: Standard Interval DP with Split Point Enumeration

```java
public int intervalDP(int[] arr) {
    int n = arr.length;
    int[][] dp = new int[n][n];
    // Base cases: dp[i][i] = 0 (or problem-specific value)

    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            dp[i][j] = Integer.MAX_VALUE; // or MIN_VALUE for maximization
            for (int k = i; k < j; k++) {
                int cost = dp[i][k] + dp[k + 1][j] + mergeCost(arr, i, k, j);
                dp[i][j] = Math.min(dp[i][j], cost);
            }
        }
    }
    return dp[0][n - 1];
}
```

### Template B: Matrix Chain Multiplication Pattern

Used when combining two sub-results has a cost that depends on the boundaries.

```java
public int matrixChainOrder(int[] dims) {
    // dims has n+1 elements for n matrices: matrix i is dims[i] x dims[i+1]
    int n = dims.length - 1;
    int[][] dp = new int[n][n];

    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            dp[i][j] = Integer.MAX_VALUE;
            for (int k = i; k < j; k++) {
                int cost = dp[i][k] + dp[k + 1][j]
                         + dims[i] * dims[k + 1] * dims[j + 1];
                dp[i][j] = Math.min(dp[i][j], cost);
            }
        }
    }
    return dp[0][n - 1];
}
```

### Template C: "Last Element" Style (Burst Balloons)

Instead of splitting into left/right, pick which element to process **last** in the range.

```java
public int burstBalloons(int[] nums) {
    int n = nums.length;
    int[] vals = new int[n + 2];
    vals[0] = vals[n + 1] = 1;
    for (int i = 0; i < n; i++) vals[i + 1] = nums[i];

    int[][] dp = new int[n + 2][n + 2];
    // dp[i][j] = max coins from bursting all balloons in open interval (i, j)

    for (int len = 1; len <= n; len++) {
        for (int i = 1; i + len - 1 <= n; i++) {
            int j = i + len - 1;
            for (int k = i; k <= j; k++) {
                // k is the LAST balloon burst in range [i, j]
                int coins = vals[i - 1] * vals[k] * vals[j + 1];
                dp[i][j] = Math.max(dp[i][j], dp[i][k - 1] + coins + dp[k + 1][j]);
            }
        }
    }
    return dp[1][n];
}
```

### Template D: Palindrome Interval DP

Endpoints match → extend from inside. Otherwise shrink from one side.

```java
public int longestPalindromicSubseq(String s) {
    int n = s.length();
    int[][] dp = new int[n][n];
    for (int i = 0; i < n; i++) dp[i][i] = 1;

    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            if (s.charAt(i) == s.charAt(j)) {
                dp[i][j] = 2 + dp[i + 1][j - 1];
            } else {
                dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[0][n - 1];
}
```

### Template E: Top-Down Memoization (Alternative)

When iteration order is confusing, recursion + memo is safer (same complexity).

```java
int[][] memo;

public int solve(int[] arr) {
    int n = arr.length;
    memo = new int[n][n];
    for (int[] row : memo) Arrays.fill(row, -1);
    return dp(arr, 0, n - 1);
}

private int dp(int[] arr, int i, int j) {
    if (i >= j) return 0; // base case
    if (memo[i][j] != -1) return memo[i][j];

    int res = Integer.MAX_VALUE;
    for (int k = i; k < j; k++) {
        res = Math.min(res, dp(arr, i, k) + dp(arr, k + 1, j) + cost(arr, i, k, j));
    }
    return memo[i][j] = res;
}
```

---

## 4. Edge Cases

| Edge Case | How to Handle |
|-----------|--------------|
| **Single element (n = 1)** | `dp[i][i]` is your base case — often 0 (no cost) or 1 (length) |
| **Two elements (n = 2)** | Only one split point; verify your loop handles `len = 2` correctly |
| **All elements identical** | Palindrome problems collapse; ensure no off-by-one |
| **Empty range after split** | `dp[i][k-1]` where `k = i` → accessing `dp[i][i-1]`; initialize as 0 |
| **Boundary padding** | Burst Balloons needs `vals[0] = vals[n+1] = 1`; forgetting breaks the logic |
| **Large n (n > 500)** | O(n³) means ~125M ops at n=500; may TLE — check constraints |
| **Integer overflow** | Multiplication in cost (e.g., triangulation) can overflow int; use long if products exceed 2³¹ |
| **Memoization vs iteration** | Both O(n³); iteration avoids stack overflow for large n |

---

## 5. Problem Progression

### Warm-Up: LC 516 — Longest Palindromic Subsequence

- **Why first**: Pure interval DP without complex cost functions. Builds intuition for `dp[i][j]` on ranges.
- **Key insight**: If `s[i] == s[j]`, extend the palindrome from inside: `dp[i][j] = 2 + dp[i+1][j-1]`. Otherwise take the better of shrinking from either end.
- **Complexity**: O(n²) time, O(n²) space.

```java
class Solution {
    public int longestPalindromeSubseq(String s) {
        int n = s.length();
        int[][] dp = new int[n][n];
        for (int i = 0; i < n; i++) dp[i][i] = 1;

        for (int len = 2; len <= n; len++) {
            for (int i = 0; i + len - 1 < n; i++) {
                int j = i + len - 1;
                if (s.charAt(i) == s.charAt(j))
                    dp[i][j] = 2 + dp[i + 1][j - 1];
                else
                    dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
            }
        }
        return dp[0][n - 1];
    }
}
```

---

### Core: LC 1039 — Minimum Score Triangulation of Polygon

- **Problem**: Given a convex polygon with `n` vertices (values[]), triangulate it to minimize the sum of triangle scores (product of three vertex values).
- **Key insight**: `dp[i][j]` = minimum cost to triangulate the sub-polygon from vertex `i` to vertex `j`. For each `k` between `i` and `j`, triangle `(i, k, j)` is formed with cost `values[i] * values[k] * values[j]`.
- **Complexity**: O(n³) time, O(n²) space.

```java
class Solution {
    public int minScoreTriangulation(int[] values) {
        int n = values.length;
        int[][] dp = new int[n][n];

        for (int len = 3; len <= n; len++) {
            for (int i = 0; i + len - 1 < n; i++) {
                int j = i + len - 1;
                dp[i][j] = Integer.MAX_VALUE;
                for (int k = i + 1; k < j; k++) {
                    int cost = dp[i][k] + dp[k][j] + values[i] * values[k] * values[j];
                    dp[i][j] = Math.min(dp[i][j], cost);
                }
            }
        }
        return dp[0][n - 1];
    }
}
```

---

### Core: LC 312 — Burst Balloons

- **Problem**: Burst all balloons to maximize total coins. Bursting balloon `k` earns `nums[left] * nums[k] * nums[right]`.
- **Key insight**: Think in reverse — which balloon do you burst **last** in range `[i, j]`? If `k` is last, its neighbors are the boundaries `i-1` and `j+1` (everything else is already gone). Pad array with 1s.
- **Complexity**: O(n³) time, O(n²) space.

```java
class Solution {
    public int maxCoins(int[] nums) {
        int n = nums.length;
        int[] vals = new int[n + 2];
        vals[0] = vals[n + 1] = 1;
        for (int i = 0; i < n; i++) vals[i + 1] = nums[i];

        int[][] dp = new int[n + 2][n + 2];
        for (int len = 1; len <= n; len++) {
            for (int i = 1; i + len - 1 <= n; i++) {
                int j = i + len - 1;
                for (int k = i; k <= j; k++) {
                    int coins = vals[i - 1] * vals[k] * vals[j + 1];
                    dp[i][j] = Math.max(dp[i][j], dp[i][k - 1] + coins + dp[k + 1][j]);
                }
            }
        }
        return dp[1][n];
    }
}
```

---

### Core: LC 1312 — Minimum Insertion Steps to Make a Palindrome

- **Problem**: Minimum characters to insert into `s` so it becomes a palindrome.
- **Key insight**: `min insertions = n - LPS(s)`. Or directly: `dp[i][j]` = min insertions for `s[i..j]`. If `s[i] == s[j]`, no extra insertions needed for the ends: `dp[i][j] = dp[i+1][j-1]`. Otherwise insert one char to match: `dp[i][j] = 1 + min(dp[i+1][j], dp[i][j-1])`.
- **Complexity**: O(n²) time, O(n²) space.

```java
class Solution {
    public int minInsertions(String s) {
        int n = s.length();
        int[][] dp = new int[n][n];

        for (int len = 2; len <= n; len++) {
            for (int i = 0; i + len - 1 < n; i++) {
                int j = i + len - 1;
                if (s.charAt(i) == s.charAt(j)) {
                    dp[i][j] = dp[i + 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i + 1][j], dp[i][j - 1]);
                }
            }
        }
        return dp[0][n - 1];
    }
}
```

---

### Advanced: LC 87 — Scramble String

- **Problem**: Determine if `s2` is a scrambled version of `s1` (recursively swap halves at any split point).
- **Key insight**: 3D interval DP. `dp[i][j][len]` = true if `s1[i..i+len-1]` can be scrambled into `s2[j..j+len-1]`. For each split length `k`: either the halves align directly or they swap positions.
- **Complexity**: O(n⁴) time, O(n³) space.

```java
class Solution {
    public boolean isScramble(String s1, String s2) {
        int n = s1.length();
        if (n != s2.length()) return false;

        boolean[][][] dp = new boolean[n][n][n + 1];

        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                dp[i][j][1] = s1.charAt(i) == s2.charAt(j);

        for (int len = 2; len <= n; len++) {
            for (int i = 0; i + len <= n; i++) {
                for (int j = 0; j + len <= n; j++) {
                    for (int k = 1; k < len; k++) {
                        // No swap: left matches left, right matches right
                        if (dp[i][j][k] && dp[i + k][j + k][len - k]) {
                            dp[i][j][len] = true;
                            break;
                        }
                        // Swap: left matches right's tail, right matches left's head
                        if (dp[i][j + len - k][k] && dp[i + k][j][len - k]) {
                            dp[i][j][len] = true;
                            break;
                        }
                    }
                }
            }
        }
        return dp[0][0][n];
    }
}
```

---

### Advanced: LC 664 — Strange Printer

- **Problem**: A printer can print a sequence of the same character in one turn. Minimum turns to print string `s`.
- **Key insight**: `dp[i][j]` = minimum turns to print `s[i..j]`. Base: `dp[i][i] = 1`. If `s[i] == s[j]`, then `dp[i][j] = dp[i][j-1]` (print `s[j]` in the same turn as `s[i]`). Otherwise try every split: `dp[i][j] = min(dp[i][k] + dp[k+1][j])` for `k` in `[i, j-1]`.
- **Complexity**: O(n³) time, O(n²) space.

```java
class Solution {
    public int strangePrinter(String s) {
        int n = s.length();
        int[][] dp = new int[n][n];

        for (int i = 0; i < n; i++) dp[i][i] = 1;

        for (int len = 2; len <= n; len++) {
            for (int i = 0; i + len - 1 < n; i++) {
                int j = i + len - 1;
                dp[i][j] = dp[i][j - 1] + 1; // worst case: print s[j] alone
                for (int k = i; k < j; k++) {
                    if (s.charAt(k) == s.charAt(j)) {
                        dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[k + 1][j - 1]);
                    }
                }
            }
        }
        return dp[0][n - 1];
    }
}
```

---

## 6. Common Mistakes

| Mistake | Why It Happens | Fix |
|---------|---------------|-----|
| **Iterating by start index instead of length** | Seems natural to loop `i` then `j`, but `dp[i][j]` needs shorter intervals that may not be computed yet | **Always outer loop = length**, inner loop = start position |
| **Off-by-one in split point range** | Confusing `k < j` vs `k <= j` vs `k` in `(i, j)` exclusive | Standard split: `k` from `i` to `j-1` (splits into `[i,k]` and `[k+1,j]`). "Last element" style: `k` from `i` to `j` |
| **Forgetting boundary padding** | Burst Balloons and Triangulation need virtual boundaries | Pad array: `vals[0] = vals[n+1] = 1` for balloons |
| **Wrong base case** | Using `dp[i][i] = arr[i]` when it should be 0, or vice versa | Think: "What's the cost/value of a single element range?" Usually 0 for cost, 1 for length |
| **Integer overflow in cost** | `values[i] * values[k] * values[j]` where values can be large | Use `long` for intermediate products, cast back |
| **Not initializing dp to INF/-INF** | Forgetting means `dp[i][j] = 0` beats real answers in min problems | Always set `dp[i][j] = Integer.MAX_VALUE` before the `k` loop for minimization |
| **Memoization without proper "visited" check** | Using `memo[i][j] == 0` as "not computed" when 0 is a valid answer | Initialize memo to `-1` and check against it |
| **Confusing open vs closed intervals** | Burst Balloons uses open intervals `(i, j)` while others use closed `[i, j]` | Be explicit about your interval convention; adjust array indexing accordingly |

---

## 7. Interview Strategy

### Before Coding (2-3 minutes)

1. **Identify the pattern**: "This is asking for optimal cost on a range — Interval DP."
2. **Define state clearly**: State aloud: "`dp[i][j]` represents [what] for the subarray from index `i` to `j`."
3. **Explain transition**: "I'll try every split point `k` and combine left/right results."
4. **Clarify base cases**: "Single element ranges return [X]."
5. **State complexity**: "This will be O(n³) time, O(n²) space — acceptable for n ≤ 500."

### During Coding (10-12 minutes)

1. Write the three nested loops first (length → start → split).
2. Fill in the recurrence inside the innermost loop.
3. Handle base cases before the main loops.
4. Extract the answer from `dp[0][n-1]`.

### Communication Tips

- **If stuck on transition**: "Let me think about what happens if I process element `k` last in this range..."
- **If stuck on iteration order**: "I need shorter intervals first, so I'll iterate by length."
- **Justify O(n³)**: "Each of the O(n²) subproblems tries O(n) split points, giving O(n³) total."

### Top-Down vs Bottom-Up Decision

| Use Top-Down When | Use Bottom-Up When |
|---|---|
| Transition logic is complex or has many branches | Standard split-point enumeration |
| Not all subproblems are needed | All subproblems will be visited |
| Easier to reason about recursively | Want to avoid stack overflow (large n) |
| Interview allows either approach | Interviewer asks for iterative |

---

## 8. Revision + Quick Reference

### One-Page Cheat Sheet

```
INTERVAL DP FORMULA:
  dp[i][j] = optimize over k in [i, j-1]:
    dp[i][k] + dp[k+1][j] + cost(i, k, j)

ITERATION ORDER:
  for len = 2 to n:
    for i = 0 to n-len:
      j = i + len - 1
      for k = i to j-1:
        update dp[i][j]

BASE CASES:
  dp[i][i] = 0 (cost) or 1 (length) or arr[i] (value)

ANSWER:
  dp[0][n-1]

COMPLEXITY:
  Time: O(n³)    Space: O(n²)
```

### Pattern Variants at a Glance

| Variant | Split Logic | Example |
|---------|------------|---------|
| **Standard split** | `dp[i][k] + dp[k+1][j] + cost` | Matrix Chain, MCT from Leaf Values |
| **Last element** | Pick `k` last in `[i,j]`, use boundaries | Burst Balloons, Triangulation |
| **Palindrome** | Match endpoints → shrink inward | LPS, Min Insertions |
| **Matching characters** | If `s[k] == s[j]`, merge turns | Strange Printer |
| **3D interval** | `dp[i][j][len]` for two-string problems | Scramble String |

### 30-Second Recall Drill

1. **State**: `dp[i][j]` = answer for range `[i, j]`
2. **Transition**: Try all split points `k`
3. **Order**: Iterate by LENGTH (small → large)
4. **Base**: Single elements (and sometimes pairs)
5. **Answer**: `dp[0][n-1]`
6. **Time**: O(n³)

### Problem Quick-Reference Table

| # | Problem | Difficulty | Key Twist |
|---|---------|-----------|-----------|
| 516 | Longest Palindromic Subsequence | Medium | Endpoints match → +2 and shrink |
| 1039 | Min Score Triangulation | Medium | Triangle (i,k,j), product cost |
| 312 | Burst Balloons | Hard | Think "last burst", pad boundaries |
| 1312 | Min Insertions for Palindrome | Hard | `n - LPS` or direct interval DP |
| 87 | Scramble String | Hard | 3D DP, swap vs no-swap at each split |
| 664 | Strange Printer | Hard | Match `s[k] == s[j]` to save turns |

### Related Patterns

- **1D DP**: When the interval always starts at 0 (prefix-based)
- **2D DP on Grid**: When `i, j` are row/col not interval endpoints
- **Tree DP**: When the "intervals" form a tree structure (sometimes interval DP builds trees)
- **Matrix Chain**: The canonical textbook interval DP problem
