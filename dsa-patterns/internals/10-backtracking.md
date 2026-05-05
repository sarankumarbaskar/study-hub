# Backtracking — Interview Execution Playbook

> Backtracking = DFS + undo. Build candidates incrementally, prune branches that violate constraints, and undo choices to explore every viable path through the decision tree.

---

## 1. Pattern Recognition Signals

**Trigger phrases in problem statements:**

| Signal | Example Problem |
|--------|----------------|
| "generate all" / "find all" / "list every" | Permutations, Subsets |
| "all valid configurations" | N-Queens, Sudoku |
| "partition into parts where each part satisfies X" | Palindrome Partitioning |
| "can you form / does a path exist" | Word Search |
| "combination that sums to target" | Combination Sum |
| "place N items subject to constraints" | N-Queens |
| "fill a grid satisfying rules" | Sudoku Solver |
| "generate well-formed structures" | Generate Parentheses |

**Structural signals — you need backtracking when:**

1. The problem has a **decision at every step** with multiple candidates.
2. Choices made now **constrain** choices available later.
3. You need **all solutions**, not just one or an optimal one (though single-solution variants like Sudoku also apply).
4. The search space is exponential but **prunable** — many branches can be cut early.
5. Each partial solution can be **extended or abandoned** — you never need to revisit a completed branch.

**When it is NOT backtracking:**

- Asking for **count only** with no enumeration → often DP.
- Optimal value (min/max cost) without listing solutions → DP or Greedy.
- Exploring a graph for reachability without undo → plain BFS/DFS.

---

## 2. Thinking Framework

### The Backtracking Mental Model

Every backtracking problem is a **decision tree** where:
- Each **node** is a partial candidate (the current `path` or `state`).
- Each **edge** is a choice you make (add an element, place a queen, pick a digit).
- **Leaves** are either valid solutions (add to result) or dead ends (prune and return).

```
                        []
                  /      |      \
               [1]      [2]      [3]
              /   \      |
           [1,2] [1,3] [2,3]
            |
          [1,2,3]
```

### The Choose → Explore → Unchoose Loop

Every backtracking solution follows this three-step rhythm:

```
1. CHOOSE    — pick a candidate, modify state
2. EXPLORE   — recurse deeper with the updated state
3. UNCHOOSE  — undo the modification, restore state exactly
```

This is the contract. If you mutate state in step 1, you **must** reverse it in step 3. No exceptions.

### Decision Tree: Which Variant Am I Solving?

```
Does order matter among chosen elements?
│
├── YES → PERMUTATION
│         • Loop over ALL indices, skip used ones
│         • Track used[] boolean array
│         • Result size == input size
│
└── NO → Does the problem want all sizes or a fixed size?
         │
         ├── All sizes → SUBSETS
         │               • Loop from start index forward
         │               • Add path to result at EVERY node
         │               • No target length required
         │
         └── Fixed size or target constraint → COMBINATION
                         • Loop from start index forward
                         • Add to result only when constraint met
                         • start = i for reuse, i+1 for no reuse
```

### Pruning: The Key to Passing Time Limits

Pruning is what separates backtracking from brute force. At each node, ask:

1. **Constraint violation** — does the current partial solution already break a rule? (queen attacks another, digit already in row/col/box)
2. **Impossibility** — can the remaining choices ever lead to a valid solution? (remaining sum < 0, not enough elements left)
3. **Duplicate avoidance** — will this branch produce a result identical to one already explored? (sort + skip `nums[i] == nums[i-1]`)

### Avoiding Duplicates: The Sorting Trick

When the input has duplicate elements and you need unique results:

```java
Arrays.sort(nums);
for (int i = start; i < nums.length; i++) {
    if (i > start && nums[i] == nums[i - 1]) continue; // skip duplicate branches
    // ... choose, explore, unchoose
}
```

**Why `i > start` and not `i > 0`?** Because the first occurrence at each recursion level is allowed — we only skip when a sibling node already used the same value.

---

## 3. Java Templates

### Template 1: Permutations (order matters, use every element)

```java
void backtrack(int[] nums, List<Integer> path, boolean[] used, List<List<Integer>> result) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));
        return;
    }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true;
        path.add(nums[i]);
        backtrack(nums, path, used, result);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

**Key details:** Loop starts at 0 every time. `used[]` prevents reusing the same index. Result collected only when `path.size() == n`.

### Template 2: Combinations (order irrelevant, fixed constraint)

```java
void backtrack(int[] nums, int start, int remain, List<Integer> path, List<List<Integer>> result) {
    if (remain == 0) {
        result.add(new ArrayList<>(path));
        return;
    }
    if (remain < 0) return;
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        backtrack(nums, i + 1, remain - nums[i], path, result); // i+1: no reuse; i: reuse allowed
        path.remove(path.size() - 1);
    }
}
```

**Key details:** `start` parameter prevents going backward. Pass `i` to allow reuse (Combination Sum), `i + 1` to disallow.

### Template 3: Subsets (all possible sub-selections)

```java
void backtrack(int[] nums, int start, List<Integer> path, List<List<Integer>> result) {
    result.add(new ArrayList<>(path)); // every node is a valid subset
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        backtrack(nums, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

**Key details:** No base-case guard needed — result is recorded at every recursion level. Identical structure to combinations but adds unconditionally.

### Template 4: Constraint Placement (N-Queens style)

```java
void backtrack(char[][] board, int row, boolean[] cols, boolean[] diag1, boolean[] diag2, List<List<String>> result) {
    int n = board.length;
    if (row == n) {
        List<String> snapshot = new ArrayList<>();
        for (char[] r : board) snapshot.add(new String(r));
        result.add(snapshot);
        return;
    }
    for (int c = 0; c < n; c++) {
        int d1 = row - c + n - 1, d2 = row + c;
        if (cols[c] || diag1[d1] || diag2[d2]) continue; // prune
        cols[c] = diag1[d1] = diag2[d2] = true;
        board[row][c] = 'Q';
        backtrack(board, row + 1, cols, diag1, diag2, result);
        board[row][c] = '.';
        cols[c] = diag1[d1] = diag2[d2] = false;
    }
}
```

**Key details:** Process one row at a time (reduces problem to column selection). Three boolean arrays give O(1) conflict detection. Diagonal indices: `row - col + (n-1)` for `\` diagonals, `row + col` for `/` diagonals.

### Template 5: Grid Search (Word Search style)

```java
private static final int[] DR = {-1, 1, 0, 0};
private static final int[] DC = {0, 0, -1, 1};

boolean dfs(char[][] board, String word, int r, int c, int idx) {
    if (idx == word.length()) return true;
    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return false;
    if (board[r][c] != word.charAt(idx)) return false;

    char saved = board[r][c];
    board[r][c] = '#'; // mark visited in-place
    for (int d = 0; d < 4; d++) {
        if (dfs(board, word, r + DR[d], c + DC[d], idx + 1)) {
            board[r][c] = saved;
            return true;
        }
    }
    board[r][c] = saved; // unchoose
    return false;
}
```

**Key details:** In-place marking (overwrite with `'#'`) avoids a separate `visited[][]`. Restore the cell whether you succeed or fail. Early return on first success for "does exist?" variants.

---

## 4. Edge Cases

| Category | Edge Case | How to Handle |
|----------|-----------|---------------|
| **Empty input** | `nums = []`, `s = ""`, empty grid | Return `[[]]` for subsets, `[]` for permutations/combinations, `false` for search |
| **Single element** | `nums = [5]`, 1×1 grid | Usually one trivial solution — make sure base case handles it |
| **All duplicates** | `nums = [1,1,1,1]` | Sort + skip: `if (i > start && nums[i] == nums[i-1]) continue` |
| **Target = 0** | Combination Sum with target 0 | Empty set `[]` is a valid combination — add it immediately |
| **Large search space** | n = 15+ for subsets, long words on big grids | Pruning is critical; without it you'll TLE. Sort candidates, break early |
| **No solution exists** | Sudoku with conflicting constraints, unsearchable word | Return empty result or false — ensure your function handles graceful failure |
| **Reuse allowed vs not** | Combination Sum (reuse) vs Combination Sum II (no reuse) | `start = i` for reuse, `start = i + 1` for no reuse |
| **Mutable result** | Adding `path` directly to `result` | Always `new ArrayList<>(path)` — the path mutates as recursion continues |
| **Grid boundary** | Word Search on edge/corner cells | Bounds check before accessing `board[r][c]` |
| **Palindrome check** | Single character strings | Always palindromes — base case should handle naturally |

---

## 5. Problem Progression

### Complexity Cheat Sheet

| Problem Type | Time | Space (call stack) | Notes |
|---|---|---|---|
| Subsets | O(n · 2^n) | O(n) | 2^n subsets, each O(n) copy |
| Permutations | O(n! · n) | O(n) | n! orderings |
| Combinations C(n,k) | O(C(n,k) · k) | O(k) | Bounded by binomial coefficient |
| N-Queens | O(n!) | O(n) | Pruning cuts most branches |
| Sudoku | O(9^m) | O(m) | m = empty cells |
| Word Search | O(mn · 4^L) | O(L) | L = word length |
| Palindrome Partition | O(n · 2^n) | O(n) | 2^(n-1) cut combinations |
| Generate Parentheses | O(4^n / √n) | O(n) | Catalan number |

---

### Problem 1: Permutations — LeetCode #46

**Link:** https://leetcode.com/problems/permutations/

**Problem:** Given an array `nums` of distinct integers, return all possible permutations.

**Pattern:** Permutation template — loop from 0, skip used indices.

**Why this approach:** Order matters and every element must be used exactly once. The `used[]` array tracks which indices are consumed in the current branch.

**Brute Force:** Generate all n! orderings by trying each unused element at each position. Time O(n! · n); Space O(n).

**Approach:**
1. If `path.size() == nums.length`, snapshot path into result.
2. For each index `i` from 0 to n-1: if `used[i]`, skip. Otherwise mark used, add to path, recurse, remove from path, unmark.

```java
class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(nums, new ArrayList<>(), new boolean[nums.length], result);
        return result;
    }

    private void backtrack(int[] nums, List<Integer> path, boolean[] used, List<List<Integer>> result) {
        if (path.size() == nums.length) {
            result.add(new ArrayList<>(path));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path.add(nums[i]);
            backtrack(nums, path, used, result);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }
}
```

**Complexity:** Time O(n! · n) — n! permutations, O(n) to copy each. Space O(n) — recursion depth + path.

**Interview tip:** If asked about duplicates (Permutations II, #47), sort the array and add: `if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue;`

---

### Problem 2: Subsets — LeetCode #78

**Link:** https://leetcode.com/problems/subsets/

**Problem:** Given an integer array `nums` of unique elements, return all possible subsets (the power set).

**Pattern:** Subset template — add path at every node, advance start index.

**Why this approach:** Every prefix of the recursion tree is a valid subset. The start index ensures we only move forward, preventing duplicate subsets like `[1,2]` and `[2,1]`.

**Brute Force:** For each element, include or exclude → 2^n subsets. Time O(n · 2^n); Space O(n).

**Approach:**
1. Add current path to result immediately (every node is a valid subset).
2. For `i` from `start` to n-1: add `nums[i]`, recurse with `start = i+1`, remove last.

```java
class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(nums, 0, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(int[] nums, int start, List<Integer> path, List<List<Integer>> result) {
        result.add(new ArrayList<>(path));
        for (int i = start; i < nums.length; i++) {
            path.add(nums[i]);
            backtrack(nums, i + 1, path, result);
            path.remove(path.size() - 1);
        }
    }
}
```

**Complexity:** Time O(n · 2^n) — 2^n subsets, O(n) copy each. Space O(n) — recursion depth.

**Interview tip:** For Subsets II (#90, with duplicates): sort first, then `if (i > start && nums[i] == nums[i-1]) continue;`

---

### Problem 3: Combination Sum — LeetCode #39

**Link:** https://leetcode.com/problems/combination-sum/

**Problem:** Given an array of distinct integers `candidates` and a target, return all unique combinations where the chosen numbers sum to target. The same number may be used unlimited times.

**Pattern:** Combination template with reuse — pass `start = i` (not `i+1`).

**Why this approach:** Candidates can be reused, so we recurse with the same `start = i`. The start index still prevents generating duplicate orderings like `[2,3,2]` and `[3,2,2]`.

**Brute Force:** Try all combinations with repetition until target is reached or exceeded. Time O(n^(target/min)); Space O(target/min).

**Approach:**
1. Base: if `remain == 0`, add path copy. If `remain < 0`, return.
2. For `i` from `start` to n-1: add `candidates[i]`, recurse with `remain - candidates[i]` and `start = i`, remove last.
3. Optimization: sort candidates and break when `candidates[i] > remain`.

```java
class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> result = new ArrayList<>();
        Arrays.sort(candidates);
        backtrack(candidates, target, 0, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(int[] candidates, int remain, int start, List<Integer> path, List<List<Integer>> result) {
        if (remain == 0) {
            result.add(new ArrayList<>(path));
            return;
        }
        for (int i = start; i < candidates.length; i++) {
            if (candidates[i] > remain) break; // pruning after sort
            path.add(candidates[i]);
            backtrack(candidates, remain - candidates[i], i, path, result);
            path.remove(path.size() - 1);
        }
    }
}
```

**Complexity:** Time O(n^(T/M)) where T = target, M = min candidate — branching factor n, depth T/M. Space O(T/M) — recursion depth.

**Interview tip:** For Combination Sum II (#40, each number used once, with duplicates): change `i` to `i+1` in recursive call and add duplicate skip: `if (i > start && candidates[i] == candidates[i-1]) continue;`

---

### Problem 4: N-Queens — LeetCode #51

**Link:** https://leetcode.com/problems/n-queens/

**Problem:** Place n queens on an n×n chessboard such that no two queens attack each other. Return all distinct solutions.

**Pattern:** Constraint placement — one decision per row, O(1) conflict arrays.

**Why this approach:** Processing one row at a time guarantees no two queens share a row. Boolean arrays for columns and both diagonal directions give O(1) safety checks, turning a brute-force O(n^n) into O(n!).

**Brute Force:** Try every column for every row (n^n configurations), validate each complete board. Time O(n^n); Space O(n^2).

**Approach:**
1. Use `cols[n]`, `diag1[2n-1]` (row-col+n-1 for `\` diags), `diag2[2n-1]` (row+col for `/` diags).
2. For each row, try each column. If column and both diags are free, place queen, mark, recurse to next row, unmark.
3. When `row == n`, snapshot the board as list of strings.

```java
class Solution {
    public List<List<String>> solveNQueens(int n) {
        List<List<String>> result = new ArrayList<>();
        char[][] board = new char[n][n];
        for (char[] row : board) Arrays.fill(row, '.');
        backtrack(board, 0, new boolean[n], new boolean[2 * n - 1], new boolean[2 * n - 1], result);
        return result;
    }

    private void backtrack(char[][] board, int row, boolean[] cols, boolean[] diag1, boolean[] diag2, List<List<String>> result) {
        int n = board.length;
        if (row == n) {
            List<String> solution = new ArrayList<>();
            for (char[] r : board) solution.add(new String(r));
            result.add(solution);
            return;
        }
        for (int c = 0; c < n; c++) {
            int d1 = row - c + n - 1, d2 = row + c;
            if (cols[c] || diag1[d1] || diag2[d2]) continue;
            cols[c] = diag1[d1] = diag2[d2] = true;
            board[row][c] = 'Q';
            backtrack(board, row + 1, cols, diag1, diag2, result);
            board[row][c] = '.';
            cols[c] = diag1[d1] = diag2[d2] = false;
        }
    }
}
```

**Complexity:** Time O(n!) — at most n choices for row 0, n-1 for row 1, etc., with pruning. Space O(n) — board + boolean arrays + recursion depth.

**Interview tip:** Explain the diagonal indexing clearly. Draw a 4×4 grid and show that cells on the same `\` diagonal share `row - col`, and cells on the same `/` diagonal share `row + col`.

---

### Problem 5: Word Search — LeetCode #79

**Link:** https://leetcode.com/problems/word-search/

**Problem:** Given an m×n grid of characters and a string word, return true if the word exists in the grid. The word can be constructed from sequentially adjacent cells (horizontal/vertical), each cell used at most once.

**Pattern:** Grid DFS — in-place marking, 4-directional exploration, restore on backtrack.

**Why this approach:** From each cell matching `word[0]`, DFS explores all 4-directional paths. Marking cells in-place with a sentinel avoids a separate visited array.

**Brute Force:** Same as optimized — backtracking DFS is the standard approach for this problem. Time O(mn · 4^L); Space O(L).

**Approach:**
1. For each cell `(r,c)` where `board[r][c] == word[0]`, run DFS.
2. DFS: if `idx == word.length()`, return true. Bounds check, character match check.
3. Save cell, overwrite with `'#'`, recurse 4 neighbors with `idx+1`, restore cell.

```java
class Solution {
    private static final int[] DR = {-1, 1, 0, 0};
    private static final int[] DC = {0, 0, -1, 1};

    public boolean exist(char[][] board, String word) {
        int m = board.length, n = board[0].length;
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (dfs(board, word, r, c, 0)) return true;
            }
        }
        return false;
    }

    private boolean dfs(char[][] board, String word, int r, int c, int idx) {
        if (idx == word.length()) return true;
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return false;
        if (board[r][c] != word.charAt(idx)) return false;

        char saved = board[r][c];
        board[r][c] = '#';
        for (int d = 0; d < 4; d++) {
            if (dfs(board, word, r + DR[d], c + DC[d], idx + 1)) {
                board[r][c] = saved;
                return true;
            }
        }
        board[r][c] = saved;
        return false;
    }
}
```

**Complexity:** Time O(mn · 4^L) — mn starting cells, up to 4^L paths per start. Space O(L) — recursion depth equals word length.

**Interview tip:** Mention that in practice each recursive call only branches into 3 directions (not 4) since we came from one direction, so the effective complexity is closer to O(mn · 3^L).

---

### Problem 6: Palindrome Partitioning — LeetCode #131

**Link:** https://leetcode.com/problems/palindrome-partitioning/

**Problem:** Given a string `s`, partition it such that every substring of the partition is a palindrome. Return all possible palindrome partitions.

**Pattern:** String partitioning — try every cut position, validate substring, recurse on remainder.

**Why this approach:** At each position, try every possible prefix. If that prefix is a palindrome, it becomes one part of the partition, and we recurse on the remaining suffix.

**Brute Force:** Try all 2^(n-1) cut combinations, verify palindrome property for each partition. Time O(n · 2^n); Space O(n).

**Approach:**
1. Base: if `start == s.length()`, add path copy (we've partitioned the entire string).
2. For `end` from `start+1` to `s.length()`: extract `s.substring(start, end)`, check if palindrome.
3. If palindrome: add to path, recurse with `start = end`, remove last.
4. Optimization: precompute palindrome table with DP for O(1) checks.

```java
class Solution {
    public List<List<String>> partition(String s) {
        List<List<String>> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(String s, int start, List<String> path, List<List<String>> result) {
        if (start == s.length()) {
            result.add(new ArrayList<>(path));
            return;
        }
        for (int end = start + 1; end <= s.length(); end++) {
            if (isPalindrome(s, start, end - 1)) {
                path.add(s.substring(start, end));
                backtrack(s, end, path, result);
                path.remove(path.size() - 1);
            }
        }
    }

    private boolean isPalindrome(String s, int lo, int hi) {
        while (lo < hi) {
            if (s.charAt(lo++) != s.charAt(hi--)) return false;
        }
        return true;
    }
}
```

**Complexity:** Time O(n · 2^n) — up to 2^(n-1) partitions, O(n) per palindrome check. Space O(n) — recursion depth.

**Interview tip:** If the interviewer asks for optimization, mention precomputing a `boolean[][] dp` where `dp[i][j] = true` if `s[i..j]` is a palindrome. Fill it bottom-up and replace `isPalindrome` calls with O(1) lookups.

---

### Problem 7: Sudoku Solver — LeetCode #37

**Link:** https://leetcode.com/problems/sudoku-solver/

**Problem:** Fill a 9×9 Sudoku board so every row, column, and 3×3 box contains digits 1-9 with no repeats.

**Pattern:** Fill-in puzzle — find next empty cell, try digits 1-9, validate, backtrack on failure.

**Why this approach:** Each empty cell has at most 9 candidates. We try each, validate against row/column/box constraints, and backtrack when no digit works. Returns on first valid completion.

**Brute Force:** Same as optimized — constraint-based backtracking is the standard approach. Time O(9^m); Space O(m).

**Approach:**
1. Scan for next empty cell (`.`). If none, return true (solved).
2. For digits `'1'` to `'9'`: if `isValid(row, col, digit)`, place digit, recurse.
3. If recursion returns true, propagate true. Otherwise restore to `.` and try next digit.
4. If all digits fail, return false (triggers backtracking in the caller).

```java
class Solution {
    public void solveSudoku(char[][] board) {
        solve(board);
    }

    private boolean solve(char[][] board) {
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                if (board[r][c] != '.') continue;
                for (char d = '1'; d <= '9'; d++) {
                    if (isValid(board, r, c, d)) {
                        board[r][c] = d;
                        if (solve(board)) return true;
                        board[r][c] = '.';
                    }
                }
                return false;
            }
        }
        return true;
    }

    private boolean isValid(char[][] board, int row, int col, char d) {
        int boxR = (row / 3) * 3, boxC = (col / 3) * 3;
        for (int i = 0; i < 9; i++) {
            if (board[row][i] == d) return false;
            if (board[i][col] == d) return false;
            if (board[boxR + i / 3][boxC + i % 3] == d) return false;
        }
        return true;
    }
}
```

**Complexity:** Time O(9^m) — up to 9 choices per empty cell, m empty cells. Space O(m) — recursion depth = number of empty cells.

**Interview tip:** Mention you can speed this up with precomputed `boolean[][] rowUsed`, `colUsed`, `boxUsed` arrays for O(1) validity checks instead of scanning row/col/box each time. Also, choosing the cell with the fewest candidates first (MRV heuristic) dramatically reduces branching.

---

### Problem 8: Generate Parentheses — LeetCode #22

**Link:** https://leetcode.com/problems/generate-parentheses/

**Problem:** Given n pairs of parentheses, generate all combinations of well-formed parentheses.

**Pattern:** Constrained string building — two counters (`open`, `close`) act as pruning conditions.

**Why this approach:** At each position, we can add `(` if `open < n`, or `)` if `close < open`. These two rules guarantee every generated string is valid — no need for post-hoc validation.

**Brute Force:** Generate all 2^(2n) binary strings of `(` and `)`, filter valid ones. Time O(2^(2n) · n); Space O(n).

**Approach:**
1. Track `open` and `close` counts.
2. If `open + close == 2n`, add string to result.
3. If `open < n`, append `(` and recurse.
4. If `close < open`, append `)` and recurse.

```java
class Solution {
    public List<String> generateParenthesis(int n) {
        List<String> result = new ArrayList<>();
        backtrack(n, 0, 0, new StringBuilder(), result);
        return result;
    }

    private void backtrack(int n, int open, int close, StringBuilder sb, List<String> result) {
        if (sb.length() == 2 * n) {
            result.add(sb.toString());
            return;
        }
        if (open < n) {
            sb.append('(');
            backtrack(n, open + 1, close, sb, result);
            sb.setLength(sb.length() - 1);
        }
        if (close < open) {
            sb.append(')');
            backtrack(n, open, close + 1, sb, result);
            sb.setLength(sb.length() - 1);
        }
    }
}
```

**Complexity:** Time O(4^n / √n) — the nth Catalan number. Space O(n) — recursion depth = 2n.

**Interview tip:** This problem is a great example of how pruning constraints (`open < n`, `close < open`) replace explicit undo/validation. There's no invalid state to backtrack from — every path leads to a valid result.

---

## 6. Common Mistakes

### Mistake 1: Forgetting to Copy the Path

```java
// WRONG — every entry in result points to the same mutating list
result.add(path);

// CORRECT — snapshot the current state
result.add(new ArrayList<>(path));
```

This is the #1 backtracking bug. The path continues to mutate after you add it. You'll end up with a result full of empty lists.

### Mistake 2: Not Undoing State Changes

```java
// WRONG — state leak corrupts sibling branches
path.add(nums[i]);
backtrack(nums, path, result);
// missing: path.remove(path.size() - 1);
```

Every `add` needs a matching `remove`. Every `used[i] = true` needs `used[i] = false`. Every `board[r][c] = 'Q'` needs `board[r][c] = '.'`.

### Mistake 3: Confusing Permutation and Combination Loops

```java
// PERMUTATION — loop from 0, use used[] array
for (int i = 0; i < nums.length; i++) {
    if (used[i]) continue;
    ...
}

// COMBINATION/SUBSET — loop from start, no used[] needed
for (int i = start; i < nums.length; i++) {
    ...
}
```

Using a `start` parameter for permutations will miss valid orderings. Using `used[]` for combinations will generate duplicates.

### Mistake 4: Wrong Reuse Parameter

```java
// Combination Sum (reuse allowed) — recurse with i
backtrack(candidates, remain - candidates[i], i, path, result);

// Combination Sum II (no reuse) — recurse with i + 1
backtrack(candidates, remain - candidates[i], i + 1, path, result);
```

Off-by-one on the `start` parameter completely changes whether elements can be reused.

### Mistake 5: Incorrect Duplicate Skipping

```java
// WRONG — skips the first occurrence too
if (nums[i] == nums[i - 1]) continue;

// CORRECT — only skip when a sibling already used this value
if (i > start && nums[i] == nums[i - 1]) continue;  // for combinations
if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1]) continue;  // for permutations
```

For combinations, `i > start` ensures the first occurrence at each level is processed. For permutations, `!used[i-1]` ensures we only skip when the previous duplicate hasn't been used in the current branch.

### Mistake 6: Forgetting to Restore Grid Cells

```java
// WRONG — Word Search fails because visited cells stay marked
board[r][c] = '#';
for (int d = 0; d < 4; d++) {
    dfs(board, word, r + DR[d], c + DC[d], idx + 1);
}
// missing: board[r][c] = saved;
```

Grid-based backtracking requires restoring every cell, even on the failure path. Otherwise other starting points can't reach those cells.

### Mistake 7: N-Queens Diagonal Index Overflow

```java
// WRONG — row - col can be negative
int d1 = row - col; // index -3 for row=0, col=3

// CORRECT — offset to make all indices non-negative
int d1 = row - col + n - 1;
```

---

## 7. Interview Strategy

### Phase 1: Clarify (1-2 minutes)

Ask these questions before coding:

1. **"Should I return all solutions or just one?"** — determines whether to return on first find or collect all.
2. **"Can elements be reused?"** — determines `start = i` vs `start = i+1`.
3. **"Are there duplicates in the input?"** — determines if you need sort + skip.
4. **"What are the constraints on n?"** — exponential algorithms need small n (typically ≤ 15-20 for subsets, ≤ 10 for permutations).
5. **"Does order matter?"** — permutation vs combination vs subset.

### Phase 2: Framework (2-3 minutes)

Communicate your approach using the backtracking vocabulary:

> "This is a [permutation/combination/subset/constraint placement] problem. I'll use backtracking with a decision tree where each node represents [what]. At each node, I choose from [candidates], prune when [condition], and unchoose by [undo action]. The time complexity will be O([bound])."

Draw the decision tree for a small example. This demonstrates understanding far better than jumping to code.

### Phase 3: Code (10-15 minutes)

1. Write the **public method** first — initialize result, call backtrack, return.
2. Write the **backtrack method** — base case, loop, choose/explore/unchoose.
3. Write any **helper methods** (isPalindrome, isValid) last.
4. Name variables clearly: `path`, `start`, `used`, `remain`.

### Phase 4: Verify (3-5 minutes)

1. **Dry run** with the smallest non-trivial example.
2. **Check edge cases**: empty input, single element, all duplicates.
3. **Confirm complexity**: state time and space, explain why.

### FAANG-Specific Patterns

| Company Tendency | Emphasis |
|---|---|
| Google | Clean code, optimal pruning, follow-up variations (add constraints, handle duplicates) |
| Meta | Practical problems (word search, phone keypad), discuss trade-offs |
| Amazon | Clear communication of approach, handle edge cases explicitly |
| Apple | Elegant solutions, in-place modifications, memory efficiency |
| Microsoft | Step-by-step explanation, code readability, testing approach |

### Follow-Up Questions You Should Expect

1. **"How would you handle duplicates?"** → Sort + skip pattern.
2. **"Can you optimize the palindrome checks?"** → Precompute DP table.
3. **"What if you only need the count, not the actual solutions?"** → Switch to DP (often much faster).
4. **"What's the space complexity of the output?"** → Distinguish between auxiliary space (O(n) stack) and output space (varies).
5. **"How would you parallelize this?"** → Split top-level branches across threads.

---

## 8. Revision + Quick Reference

### The 30-Second Recap

**Backtracking = DFS + undo.** Build solutions incrementally. At each step: **choose** a candidate, **explore** by recursing, **unchoose** by undoing the modification. **Prune** branches that can't lead to valid solutions.

### Decision Flowchart

```
Problem says "generate all" / "find all valid" / "partition"
                    |
                    v
        Is it exponential search? ──── NO ──→ Not backtracking
                    |
                   YES
                    |
                    v
         Does order matter?
          /                \
        YES                 NO
         |                   |
    PERMUTATION         Pick size?
    • used[] array       /        \
    • loop from 0     All sizes   Fixed/target
         |               |            |
    LC #46, #47     SUBSETS      COMBINATIONS
                    • add at      • add when
                      every node    constraint met
                    • LC #78      • LC #39, #40

    Special variants:
    ├── Grid search → Word Search (#79) — in-place mark/restore
    ├── Constraint placement → N-Queens (#51) — boolean arrays for cols/diags
    ├── Fill puzzle → Sudoku (#37) — try digits, validate row/col/box
    ├── String partition → Palindrome (#131) — try cuts, check palindrome
    └── Constrained generation → Parentheses (#22) — open/close counters
```

### Template Quick Reference Card

| Problem Type | Loop Start | Next `start` | Track | Result Condition |
|---|---|---|---|---|
| Permutation | `i = 0` | N/A (use `used[]`) | `boolean[] used` | `path.size() == n` |
| Subset | `i = start` | `i + 1` | nothing | every node |
| Combination (no reuse) | `i = start` | `i + 1` | nothing | constraint met |
| Combination (reuse) | `i = start` | `i` | nothing | constraint met |
| Grid search | 4 directions | N/A | in-place `'#'` | full match |
| Constraint placement | `c = 0..n-1` | next row | `cols[], diags[]` | all rows filled |

### Duplicate Handling Quick Reference

| Scenario | Technique |
|---|---|
| Subsets with duplicates (#90) | Sort + `if (i > start && nums[i] == nums[i-1]) continue` |
| Permutations with duplicates (#47) | Sort + `if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue` |
| Combination Sum II — no reuse, dupes (#40) | Sort + `if (i > start && candidates[i] == candidates[i-1]) continue` + use `i+1` |

### Complexity Quick Glance

| Pattern | Time | Space |
|---|---|---|
| Permutations | O(n! · n) | O(n) |
| Subsets | O(n · 2^n) | O(n) |
| Combinations C(n,k) | O(C(n,k) · k) | O(k) |
| Parentheses (n pairs) | O(4^n / √n) | O(n) |
| N-Queens | O(n!) | O(n) |
| Sudoku | O(9^m) | O(m) |
| Word Search | O(mn · 4^L) | O(L) |
| Palindrome Partition | O(n · 2^n) | O(n) |

### Backtracking Invariant Checklist

Before submitting your solution, verify:

- [ ] Every `path.add()` has a matching `path.remove(path.size() - 1)`
- [ ] Every `used[i] = true` has a matching `used[i] = false`
- [ ] Every `board[r][c] = X` has a matching `board[r][c] = original`
- [ ] Results use `new ArrayList<>(path)`, not `path` directly
- [ ] Permutations loop from 0 with `used[]`; combinations loop from `start`
- [ ] Duplicate skip uses `i > start` (combinations) or `!used[i-1]` (permutations)
- [ ] Pruning conditions are checked **before** recursing, not after
- [ ] Base case correctly identifies a complete solution
