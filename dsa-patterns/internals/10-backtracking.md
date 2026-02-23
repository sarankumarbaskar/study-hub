# Backtracking

> Explore all possibilities by making choices, recursing, then undoing each choice—systematically building and pruning the search space until you find all valid solutions (or one).

## What Is This Pattern?

Backtracking is a **systematic search** technique built on top of recursion. You build a solution incrementally by making a sequence of **choices**. At each step, you try an option; if it leads to a valid path, you recurse deeper; when you hit a dead end or finish exploring that branch, you **undo** (backtrack) the last choice and try another. The key insight: you don't copy state—you **mutate**, recurse, then **restore**.

Think of a maze: you walk forward, mark your path; when you hit a wall, you backtrack to the last junction and try the other way. Backtracking does this programmatically—the "undo" step is what distinguishes it from naive recursion. Common applications: generate all permutations, all subsets, find valid configurations (N-Queens, Sudoku), or search for paths in grids.

The pattern is especially powerful when the problem asks for **all solutions** or **existence** where brute-force enumeration would be exponential. Pruning (early termination when a branch can't succeed) is what makes backtracking practical.

## When to Use

- Problem asks for **all** permutations, combinations, subsets, or partitions.
- Problem asks to **find one** or **count** valid configurations (N-Queens, Sudoku).
- Problem asks "does a path/config exist?" where you must **explore choices** and may need to backtrack.
- You're building a solution by making a sequence of **choices** from a finite set of options.
- Brute-force would enumerate exponentially many possibilities—backtracking prunes invalid branches.
- Phrases like "all possible", "generate", "find all", "partition into", "place N objects".

## How to Identify

```
Do we need to explore multiple choices at each step?
    NO → Maybe greedy or DP
    YES ↓

Can we prune branches that cannot lead to valid solutions?
    YES → BACKTRACKING (or DFS with pruning)
    NO ↓

Do we need to undo choices after exploring a branch?
    YES → BACKTRACKING (modify → recurse → restore)
```

## Core Template (Pseudocode)

### Generic Backtracking

```
FUNCTION backtrack(state, ...):
    IF base_case(state):
        record result
        RETURN

    FOR each choice in choices:
        IF not valid(choice): CONTINUE   // prune

        APPLY choice to state
        backtrack(state, ...)
        UNDO choice                      // restore state
```

### Permutation (order matters, use all elements)

```
FUNCTION permute(arr, path, used, results):
    IF path.length == arr.length:
        results.add(path.copy())
        RETURN

    FOR i FROM 0 TO arr.length - 1:
        IF used[i]: CONTINUE

        used[i] = true
        path.add(arr[i])
        permute(arr, path, used, results)
        path.removeLast()
        used[i] = false
```

### Combination / Subset (order doesn't matter, start index avoids reuse)

```
FUNCTION combine(arr, start, path, results):
    results.add(path.copy())   // record every subset

    FOR i FROM start TO arr.length - 1:
        path.add(arr[i])
        combine(arr, i + 1, path, results)
        path.removeLast()
```

## Core Template (Java)

### Generic Backtracking

```java
void backtrack(List<T> path, int[] state, List<List<T>> results) {
    if (isComplete(path, state)) {
        results.add(new ArrayList<>(path));
        return;
    }
    for (T choice : getChoices(state)) {
        if (!isValid(choice)) continue;
        apply(choice, path, state);
        backtrack(path, state, results);
        undo(choice, path, state);
    }
}
```

### Permutation Template

```java
void permute(int[] nums, List<Integer> path, boolean[] used, List<List<Integer>> results) {
    if (path.size() == nums.length) {
        results.add(new ArrayList<>(path));
        return;
    }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true;
        path.add(nums[i]);
        permute(nums, path, used, results);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

### Combination / Subset Template

```java
void subsets(int[] nums, int start, List<Integer> path, List<List<Integer>> results) {
    results.add(new ArrayList<>(path));
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        subsets(nums, i + 1, path, results);
        path.remove(path.size() - 1);
    }
}
```

## Complexity Cheat Sheet

| Problem Type           | Time              | Space (call stack) | Notes                        |
|------------------------|-------------------|--------------------|------------------------------|
| Subsets                | O(n · 2^n)        | O(n)               | 2^n subsets, each O(n) copy  |
| Permutations           | O(n! · n)         | O(n)               | n! permutations              |
| Combinations (C(n,k))  | O(C(n,k) · k)     | O(k)               | Typically k ≤ n               |
| N-Queens               | O(n!)             | O(n)               | Pruning reduces branches     |
| Sudoku                 | O(9^m)            | O(1)               | m = empty cells              |
| Word Search (grid)     | O(mn · 4^L)       | O(L)               | L = word length              |

## Problems with Full Solutions

### Easy (2)

#### [Letter Combinations of a Phone Number](https://leetcode.com/problems/letter-combinations-of-a-phone-number/) (LeetCode #17)

- **Brute Force:** Nested loops for each digit's letters, generating all combinations exhaustively. Time O(4^n), Space O(n).
- **Intuition:** Each digit maps to 3–4 letters. At each position, try every letter for that digit, recurse to the next digit, then backtrack. Base case: when you've processed all digits, add the built string to results.
- **Approach:** 1) Map digits to letters. 2) Backtrack: for digit at index i, iterate over its letters, append to sb, recurse to i+1, remove last char. 3) Handle empty input (return empty list).
- **Java Solution:**

```java
class Solution {
    private static final String[] KEYS = {
        "", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"
    };

    public List<String> letterCombinations(String digits) {
        List<String> result = new ArrayList<>();
        if (digits == null || digits.isEmpty()) return result;
        backtrack(digits, 0, new StringBuilder(), result);
        return result;
    }

    private void backtrack(String digits, int i, StringBuilder sb, List<String> result) {
        if (i == digits.length()) {
            result.add(sb.toString());
            return;
        }
        String letters = KEYS[digits.charAt(i) - '0'];
        for (char c : letters.toCharArray()) {
            sb.append(c);
            backtrack(digits, i + 1, sb, result);
            sb.setLength(sb.length() - 1);
        }
    }
}
```

- **Complexity:** Time O(4^n), Space O(n) where n = digits.length()

---

#### [Binary Watch](https://leetcode.com/problems/binary-watch/) (LeetCode #401)

- **Brute Force:** Enumerate all 12×60 (h,m) pairs, count set bits in each; keep only those where bitCount(h)+bitCount(m)==turnedOn. Time O(1), Space O(1).
- **Intuition:** `turnedOn` LEDs must be distributed among 10 positions (4 hours + 6 minutes). Enumerate all valid (h, m) where the number of set bits in h + set bits in m equals turnedOn. Use Integer.bitCount for elegance.
- **Approach:** 1) Loop h from 0 to 11, m from 0 to 59. 2) If bitCount(h) + bitCount(m) == turnedOn, format as "h:m" and add to result. 3) Alternative: backtrack to choose which of 10 positions to turn on—but brute-force is O(12·60) = O(1), simpler.
- **Java Solution:**

```java
class Solution {
    public List<String> readBinaryWatch(int turnedOn) {
        List<String> result = new ArrayList<>();
        for (int h = 0; h < 12; h++) {
            for (int m = 0; m < 60; m++) {
                if (Integer.bitCount(h) + Integer.bitCount(m) == turnedOn) {
                    result.add(String.format("%d:%02d", h, m));
                }
            }
        }
        return result;
    }
}
```

- **Complexity:** Time O(12·60) = O(1), Space O(1) excluding output.

---

### Medium (5)

#### [Subsets](https://leetcode.com/problems/subsets/) (LeetCode #78)

- **Brute Force:** Generate all 2^n combinations by iterating through each element (include or exclude). Time O(n·2^n), Space O(n).
- **Intuition:** At each step, either include nums[i] or skip. Use start index to avoid duplicates and ensure we only move forward. Every prefix of the recursion is a valid subset—add it at the start of each call.
- **Approach:** 1) Add current path to result immediately. 2) For i from start to n-1: path.add(nums[i]), recurse(i+1), path.removeLast(). 3) No need to track "used"—start index naturally gives combinations.
- **Java Solution:**

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

- **Complexity:** Time O(n · 2^n), Space O(n)

---

#### [Permutations](https://leetcode.com/problems/permutations/) (LeetCode #46)

- **Brute Force:** Generate all n! permutations by trying each unused element at each position via recursion. Time O(n!·n), Space O(n).
- **Intuition:** At each position, pick any unused element. Use a boolean[] used to avoid reusing the same element. When path size equals n, we have a complete permutation.
- **Approach:** 1) If path.size() == nums.length, add copy to result. 2) For each i: if !used[i], mark used, add nums[i], recurse, unmark used, remove from path.
- **Java Solution:**

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

- **Complexity:** Time O(n! · n), Space O(n)

---

#### [Combination Sum](https://leetcode.com/problems/combination-sum/) (LeetCode #39)

- **Brute Force:** Try all combinations with repetition; recurse including or skipping each candidate until target is reached or exceeded. Time O(2^target), Space O(target).
- **Intuition:** Pick candidates one at a time; you can reuse the same candidate. When remaining target hits 0, record the path. Prune when remaining < 0. Use start index to avoid generating duplicate combinations (e.g., [2,2,3] and [3,2,2]).
- **Approach:** 1) Base: if remain == 0, add path and return; if remain < 0, return. 2) For i from start to n-1: path.add(candidates[i]), recurse with remain - candidates[i] and start=i (reuse allowed), path.removeLast().
- **Java Solution:**

```java
class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(candidates, target, 0, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(int[] candidates, int remain, int start, List<Integer> path, List<List<Integer>> result) {
        if (remain == 0) {
            result.add(new ArrayList<>(path));
            return;
        }
        if (remain < 0) return;
        for (int i = start; i < candidates.length; i++) {
            path.add(candidates[i]);
            backtrack(candidates, remain - candidates[i], i, path, result);
            path.remove(path.size() - 1);
        }
    }
}
```

- **Complexity:** Time O(2^target) in worst case, Space O(target) for recursion.

---

#### [Word Search](https://leetcode.com/problems/word-search/) (LeetCode #79)

- **Brute Force:** From each cell matching word[0], DFS in 4 directions; mark visited, backtrack. Same as optimized—backtracking is the standard approach. Time O(mn·4^L), Space O(L).
- **Intuition:** For each cell that matches word[0], DFS to find the rest. Mark visited cells (e.g., temporarily change to a non-letter) to avoid reusing; unmark when backtracking.
- **Approach:** 1) For each (r,c): if board[r][c] == word[0] and dfs(r,c,0) returns true, return true. 2) dfs(r,c,idx): if idx == word.length return true. 3) If out of bounds or board[r][c] != word[idx], return false. 4) Save cell, mark as visited (e.g., '#'), recurse 4 neighbors, restore cell, return true if any neighbor succeeds.
- **Java Solution:**

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

        char original = board[r][c];
        board[r][c] = '#';
        for (int d = 0; d < 4; d++) {
            if (dfs(board, word, r + DR[d], c + DC[d], idx + 1)) {
                board[r][c] = original;
                return true;
            }
        }
        board[r][c] = original;
        return false;
    }
}
```

- **Complexity:** Time O(mn · 4^L), Space O(L)

---

#### [Palindrome Partitioning](https://leetcode.com/problems/palindrome-partitioning/) (LeetCode #131)

- **Brute Force:** Try all 2^(n-1) possible partition points; for each partition, check every substring is a palindrome. Time O(n·2^n), Space O(n).
- **Intuition:** At each step, try cutting the string at position i: if s[0..i] is a palindrome, add it to path, recurse on s[i+1..], then backtrack. When we've processed the whole string, add the partition to results.
- **Approach:** 1) Base: if start == s.length(), add path copy to result. 2) For end from start+1 to s.length(): if s.substring(start,end) is palindrome, path.add it, recurse(start=end), path.removeLast().
- **Java Solution:**

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
            String sub = s.substring(start, end);
            if (isPalindrome(sub)) {
                path.add(sub);
                backtrack(s, end, path, result);
                path.remove(path.size() - 1);
            }
        }
    }

    private boolean isPalindrome(String s) {
        int i = 0, j = s.length() - 1;
        while (i < j) {
            if (s.charAt(i++) != s.charAt(j--)) return false;
        }
        return true;
    }
}
```

- **Complexity:** Time O(n · 2^n) in worst case, Space O(n)

---

### Hard (3)

#### [N-Queens](https://leetcode.com/problems/n-queens/) (LeetCode #51)

- **Brute Force:** Try all n^n placements (or all column permutations per row); check validity after each full placement. Backtracking with pruning is the practical approach. Time O(n!), Space O(n).
- **Intuition:** Place one queen per row. For each row r, try each column c: if (r,c) is safe (no conflict with previous queens), place queen, recurse to row r+1, remove queen. Track cols and diagonals to check safety in O(1). Diagonals: r-c (same) and r+c (same) for anti-diagonal.
- **Approach:** 1) Use col[], diag1[], diag2[] (or sets) for O(1) conflict check. 2) For row 0 to n-1: for col 0 to n-1, if safe, place queen, mark, recurse(row+1), unmark. 3) When row == n, convert board to list of strings.
- **Java Solution:**

```java
class Solution {
    public List<List<String>> solveNQueens(int n) {
        List<List<String>> result = new ArrayList<>();
        char[][] board = new char[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) board[i][j] = '.';
        }
        boolean[] col = new boolean[n];
        boolean[] diag1 = new boolean[2 * n - 1];
        boolean[] diag2 = new boolean[2 * n - 1];
        backtrack(board, 0, col, diag1, diag2, result);
        return result;
    }

    private void backtrack(char[][] board, int row, boolean[] col, boolean[] diag1, boolean[] diag2, List<List<String>> result) {
        int n = board.length;
        if (row == n) {
            List<String> solution = new ArrayList<>();
            for (char[] r : board) solution.add(new String(r));
            result.add(solution);
            return;
        }
        for (int c = 0; c < n; c++) {
            int d1 = row - c + n - 1;
            int d2 = row + c;
            if (col[c] || diag1[d1] || diag2[d2]) continue;
            col[c] = diag1[d1] = diag2[d2] = true;
            board[row][c] = 'Q';
            backtrack(board, row + 1, col, diag1, diag2, result);
            board[row][c] = '.';
            col[c] = diag1[d1] = diag2[d2] = false;
        }
    }
}
```

- **Complexity:** Time O(n!), Space O(n)

---

#### [Sudoku Solver](https://leetcode.com/problems/sudoku-solver/) (LeetCode #37)

- **Brute Force:** Try digits 1–9 in each empty cell, recurse; backtrack when invalid. Same as optimized—no better brute force exists. Time O(9^m), Space O(1).
- **Intuition:** Find the next empty cell. Try digits 1–9: if placing d is valid (no conflict in row, col, box), place it, recurse. If recursion returns true, we're done; else backtrack and try next digit.
- **Approach:** 1) Find next empty (r,c). If none, return true (solved). 2) For d in '1'..'9': if valid(r,c,d), board[r][c]=d, if solve() return true, else board[r][c]='.'. 3) Return false if no digit works.
- **Java Solution:**

```java
class Solution {
    public void solveSudoku(char[][] board) {
        solve(board);
    }

    private boolean solve(char[][] board) {
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                if (board[r][c] == '.') {
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
        }
        return true;
    }

    private boolean isValid(char[][] board, int row, int col, char d) {
        for (int i = 0; i < 9; i++) {
            if (board[row][i] == d) return false;
            if (board[i][col] == d) return false;
        }
        int boxR = (row / 3) * 3, boxC = (col / 3) * 3;
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                if (board[boxR + i][boxC + j] == d) return false;
            }
        }
        return true;
    }
}
```

- **Complexity:** Time O(9^m), Space O(1) for recursion (m = empty cells)

---

#### [Word Search II](https://leetcode.com/problems/word-search-ii/) (LeetCode #212)

- **Brute Force:** For each word, run Word Search I (DFS from each cell). Time O(words·mn·4^L), Space O(L).
- **Intuition:** Search for each word with DFS would be O(words · mn · 4^L). Use a **Trie** of all words: when traversing the grid, only continue DFS if the current path is a prefix of some word. When we find a complete word in the trie, add it and optionally mark the node to avoid duplicates.
- **Approach:** 1) Build Trie from words. 2) For each cell, DFS: if current path not in trie as prefix, return. 3) If current node has a word, add to result and clear the word (avoid duplicates). 4) Mark cell visited, recurse 4 neighbors, unmark. 5) Use TrieNode with Map<Character, TrieNode> and String word (or isEnd).
- **Java Solution:**

```java
class Solution {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        String word;
    }

    private void insert(TrieNode root, String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) node.children[i] = new TrieNode();
            node = node.children[i];
        }
        node.word = word;
    }

    public List<String> findWords(char[][] board, String[] words) {
        TrieNode root = new TrieNode();
        for (String w : words) insert(root, w);

        List<String> result = new ArrayList<>();
        for (int r = 0; r < board.length; r++) {
            for (int c = 0; c < board[0].length; c++) {
                dfs(board, r, c, root, result);
            }
        }
        return result;
    }

    private void dfs(char[][] board, int r, int c, TrieNode node, List<String> result) {
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return;
        char ch = board[r][c];
        if (ch == '#') return;
        int i = ch - 'a';
        if (node.children[i] == null) return;

        node = node.children[i];
        if (node.word != null) {
            result.add(node.word);
            node.word = null; // avoid duplicate
        }

        board[r][c] = '#';
        dfs(board, r - 1, c, node, result);
        dfs(board, r + 1, c, node, result);
        dfs(board, r, c - 1, node, result);
        dfs(board, r, c + 1, node, result);
        board[r][c] = ch;
    }
}
```

- **Complexity:** Time O(mn · 4 · 3^(L-1)) where L = max word length, Space O(total chars in words) for trie

---

## Common Mistakes

- **Forgetting to undo:** Always restore state after recursion. If you mark a cell visited, unmark it. If you add to path, remove it.
- **Sharing mutable state:** Pass a *copy* when adding to results (e.g., `new ArrayList<>(path)`), not the path reference itself—otherwise all entries point to the same list.
- **Permutation vs combination:** Permutations use a `used[]` array and iterate over all indices. Combinations/subsets use a `start` index and iterate from `start` to avoid [1,2] and [2,1] as distinct.
- **Reuse in Combination Sum:** Use `start = i` (not `i + 1`) when the same element can be used multiple times.
- **Word Search:** Don't forget to restore the cell after DFS—otherwise other paths can't use it.
- **N-Queens diagonals:** Use `row - col + n - 1` for one diagonal and `row + col` for the other to avoid index overflow.
- **Word Search II:** Clear `node.word` after adding to result to prevent adding the same word from different paths.

## Pattern Variations

| Variation            | Example                    | Key Technique                                |
|----------------------|----------------------------|----------------------------------------------|
| Subsets              | Subsets #78                | start index, add at each step                |
| Permutations         | Permutations #46           | used[] array, pick any unused                |
| Combinations         | Combination Sum #39        | start index, reuse with start=i               |
| Phone letters        | Letter Combinations #17    | digit → letters mapping                      |
| Grid DFS             | Word Search #79            | mark/unmark cell, 4-direction neighbors      |
| Trie + backtrack     | Word Search II #212        | Trie prunes invalid prefixes                 |
| Partitioning         | Palindrome Partition #131  | try cuts, check palindrome                   |
| Constraint placement | N-Queens #51               | row-by-row, col/diag conflict check           |
| Fill-in puzzle       | Sudoku Solver #37          | try digits, validate row/col/box              |
| Enumerative          | Binary Watch #401          | bitCount or backtrack on positions           |
