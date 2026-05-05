# DFS (Depth-First Search) — Interview Execution Playbook

> **Pattern Mastery Level:** DFS is the backbone of tree and graph interviews. ~25% of FAANG coding rounds involve a tree/graph DFS problem. If you can't write recursive DFS on a tree in under 3 minutes, you're not interview-ready.

---

## 1. Pattern Recognition Signals

### When to Use DFS

```
INSTANT TRIGGERS (say "DFS" within 5 seconds):
  ✓ "Binary tree" + "depth / height / path / subtree property"
  ✓ "Validate BST" or "check tree structure"
  ✓ "Lowest common ancestor"
  ✓ "Number of islands" / "flood fill" / "connected components"
  ✓ "All paths from root to leaf" / "path sum"
  ✓ "Diameter" / "maximum path sum" in a tree
  ✓ "Longest increasing path" in a grid
```

### Keywords in Problem Statements

```
DIRECT SIGNALS:              INDIRECT SIGNALS:
  "traverse the tree"          "return height/depth"
  "root-to-leaf path"          "subtree property"
  "number of islands"          "connected components"
  "validate BST"               "in-order traversal"
  "lowest common ancestor"     "find if path exists"
  "flood fill"                 "explore all cells"
  "diameter of tree"           "maximum path sum"
```

### When NOT to Use

```
✗ "Shortest path" in unweighted graph → use BFS (gives shortest path natively)
✗ "Level-order traversal" / "minimum depth" → BFS is simpler and natural
✗ "All permutations / combinations with constraints" → use BACKTRACKING (a DFS variant, but think differently)
✗ Grid with extremely deep recursion (1000×1000) → iterative DFS or BFS to avoid stack overflow
✗ "Shortest transformation sequence" → BFS gives it in one pass
```

---

## 2. Thinking Framework (Step-by-Step Intuition)

### The 60-Second Decision Process

```
Step 1: "Is this a tree or graph/grid problem?"
  TREE  → Recursive DFS is almost always the cleanest approach
  GRAPH → Need a visited set/array (graphs have cycles, trees don't)
  GRID  → Treat as implicit graph; mark visited by modifying grid or using a set

Step 2: "Am I computing something BOTTOM-UP or TOP-DOWN?"
  BOTTOM-UP → Post-order: recurse children first, combine results coming back up
    Examples: max depth, diameter, max path sum, LCA
  TOP-DOWN  → Pre-order: pass state DOWN through parameters
    Examples: validate BST (pass min/max range), path sum (pass remaining sum)

Step 3: "Do I need a GLOBAL variable or can I return everything?"
  Return value is enough → max depth, validate BST, LCA
  Need global/instance var → diameter (update global while returning single-arm depth),
                             max path sum (update global while returning single-arm gain)
  RULE: If the answer involves BOTH subtrees but the return value can only carry ONE arm,
        you need a global variable.

Step 4: "Do I need to backtrack?"
  YES → Path tracking (add before recurse, remove after): path sum, distinct islands
  NO  → Pure computation: max depth, validate BST
```

### The Core Insight (Memorize This)

```
DFS WORKS BECAUSE:
  Recursion naturally models tree/graph structure.
  Each recursive call handles ONE subproblem (one subtree, one neighbor).
  The call stack tracks where you've been — backtracking is free.

  BOTTOM-UP PATTERN: Solve children first, combine at parent.
    "What's the depth?" → children tell me their depths, I add 1.
    "What's the LCA?" → children tell me if they found p or q, I decide.

  TOP-DOWN PATTERN: Pass constraints downward, validate at each node.
    "Is this a valid BST?" → parent tells me my allowed range, I check and narrow.

  GLOBAL VARIABLE PATTERN: The answer spans BOTH subtrees but return value carries ONE arm.
    "Diameter = leftDepth + rightDepth" (spans both), but return max(left, right) + 1 upward.
```

### Recursive vs Iterative DFS

```
USE RECURSIVE when:
  ✓ Tree problems (depth rarely exceeds a few thousand)
  ✓ Need post-order processing (combining children results)
  ✓ Code clarity matters (interviews)

USE ITERATIVE (explicit stack) when:
  ✓ Very deep recursion risk (grid 1000×1000, linked-list-shaped tree)
  ✓ Interviewer explicitly asks "can you do it without recursion?"
  ✓ Pre-order traversal (iterative is simple and clean)

NOTE: Post-order and in-order are significantly harder to do iteratively.
      In interviews, recursive is almost always preferred unless asked otherwise.
```

---

## 3. Java Templates (Production-Quality)

### Template 1: Tree DFS — Recursive (Bottom-Up)

```java
// USE FOR: Max Depth, Balanced Tree, Subtree of Another Tree
// TIME: O(n) | SPACE: O(h) where h = height
private int dfs(TreeNode node) {
    if (node == null) return 0;                      // base case
    int left = dfs(node.left);                       // solve left
    int right = dfs(node.right);                     // solve right
    // POST-ORDER: combine children results here
    return 1 + Math.max(left, right);                // combine
}
```

### Template 2: Tree DFS — Recursive (Top-Down with Range)

```java
// USE FOR: Validate BST, path constraints, range checks
// TIME: O(n) | SPACE: O(h)
private boolean dfs(TreeNode node, long min, long max) {
    if (node == null) return true;                   // base case
    if (node.val <= min || node.val >= max) return false;  // validate
    return dfs(node.left, min, node.val)             // narrow range left
        && dfs(node.right, node.val, max);           // narrow range right
}
```

### Template 3: Tree DFS — Iterative with Stack (Pre-Order)

```java
// USE FOR: Pre-order traversal, iterative tree DFS when recursion depth is a concern
// TIME: O(n) | SPACE: O(h)
public void iterativeDfs(TreeNode root) {
    if (root == null) return;
    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        process(node);
        if (node.right != null) stack.push(node.right);  // right first
        if (node.left != null) stack.push(node.left);     // so left pops first
    }
}
```

### Template 4: Graph DFS with Visited

```java
// USE FOR: Connected components, cycle detection, reachability
// TIME: O(V + E) | SPACE: O(V)
private void dfs(int node, List<List<Integer>> graph, boolean[] visited) {
    visited[node] = true;
    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            dfs(neighbor, graph, visited);
        }
    }
}
```

### Template 5: Grid DFS (Island / Flood Fill)

```java
// USE FOR: Number of Islands, Flood Fill, Max Area of Island
// TIME: O(m×n) | SPACE: O(m×n) worst-case recursion stack
private void dfs(char[][] grid, int r, int c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length
        || grid[r][c] == '0') return;                // bounds + visited check
    grid[r][c] = '0';                                // mark visited (modify grid)
    dfs(grid, r + 1, c);                             // down
    dfs(grid, r - 1, c);                             // up
    dfs(grid, r, c + 1);                             // right
    dfs(grid, r, c - 1);                             // left
}
```

### Template 6: DFS with Path Tracking (Backtracking)

```java
// USE FOR: Path Sum II, all root-to-leaf paths, distinct islands
// TIME: O(n) | SPACE: O(h) for path list
private void dfs(TreeNode node, int remaining, List<Integer> path,
                 List<List<Integer>> result) {
    if (node == null) return;
    path.add(node.val);                              // choose
    remaining -= node.val;
    if (node.left == null && node.right == null && remaining == 0) {
        result.add(new ArrayList<>(path));            // record valid path (copy!)
    }
    dfs(node.left, remaining, path, result);
    dfs(node.right, remaining, path, result);
    path.remove(path.size() - 1);                    // un-choose (backtrack)
}
```

### Template 7: DFS with Global Variable (Diameter / Max Path Sum)

```java
// USE FOR: Problems where answer spans both subtrees but return carries one arm
// TIME: O(n) | SPACE: O(h)
private int globalMax;

private int dfs(TreeNode node) {
    if (node == null) return 0;
    int left = Math.max(0, dfs(node.left));          // ignore negative gains
    int right = Math.max(0, dfs(node.right));
    globalMax = Math.max(globalMax, left + right + node.val);  // update answer (both arms)
    return node.val + Math.max(left, right);         // return single arm to parent
}
```

---

## 4. Edge Case Checklist

```
TREE EDGE CASES:
  □ Empty tree (root == null) → return 0, null, empty list, or true depending on problem
  □ Single node → depth is 1, it's a valid BST, it's its own LCA
  □ Skewed tree (all left or all right) → recursion depth = n, O(n) stack space
  □ All negative values → max path sum is the least negative single node
  □ Integer.MIN_VALUE / Integer.MAX_VALUE in BST → use long for bounds

GRID EDGE CASES:
  □ Single cell grid → could be one island or zero
  □ All water / all land → count is 0 or 1
  □ Grid dimensions: 1×n or m×1 (single row / single column)
  □ Very large grid (300×300) → recursion depth up to 90000, may need iterative DFS

PATH PROBLEMS:
  □ Leaf check: node.left == null && node.right == null (not just one child null)
  □ Path sum with negative values → can't prune early (remaining can go negative then positive)
  □ Must copy the path list when recording result: new ArrayList<>(path)

GRAPH EDGE CASES:
  □ Disconnected graph → must start DFS from every unvisited node
  □ Self-loops → visited check handles it
  □ Single node, no edges
```

---

## 5. Problem Progression (LeetCode)

### Level 1: Easy — Build DFS Muscle Memory

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 104 | [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | Bottom-up: `1 + max(left, right)` | O(n) |
| 112 | [Path Sum](https://leetcode.com/problems/path-sum/) | Top-down: subtract node val, check `remaining == 0` at leaf | O(n) |

### Level 2: Standard Medium — Core FAANG Problems

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 200 | [Number of Islands](https://leetcode.com/problems/number-of-islands/) | Grid DFS: sink island by flipping `'1'` → `'0'` | O(m×n) |
| 98 | [Validate BST](https://leetcode.com/problems/validate-binary-search-tree/) | Top-down range `(min, max)` with `long` bounds | O(n) |
| 236 | [LCA of Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) | Bottom-up: if both subtrees return non-null → current is LCA | O(n) |
| 543 | [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/) | Global var: `diameter = max(diameter, leftDepth + rightDepth)` | O(n) |

### Level 3: Hard — FAANG Interview Level

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 124 | [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/) | Global var + clip negative gains with `max(0, gain)` | O(n) |
| 694 | [Number of Distinct Islands](https://leetcode.com/problems/number-of-distinct-islands/) | Serialize DFS path relative to start cell, store in set | O(m×n) |
| 329 | [Longest Increasing Path in Matrix](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/) | DFS + memoization (no visited needed — strictly increasing = no cycles) | O(m×n) |

### Solving Order for Maximum Learning

```
Day 1: 104 → 112 (basic tree DFS, bottom-up vs top-down)
Day 2: 200 → 98 (grid DFS, BST validation with range)
Day 3: 236 → 543 (LCA pattern, global variable pattern)
Day 4: 124 → 694 (max path sum, island serialization)
Day 5: 329 (DFS + memo on grid)
Day 6: Re-solve 236, 124, 329 from memory (test recall on the hardest ones)
```

---

## 6. Common Mistakes & Interview Traps

### Mistake 1: Forgetting Visited in Graph/Grid DFS

```
WRONG: DFS on a grid without marking cells as visited
  → Infinite loop: cell A visits cell B, cell B visits cell A, forever

TWO WAYS TO MARK VISITED ON A GRID:
  1. Modify grid in-place: grid[r][c] = '0' (or '#', or any sentinel)
     Pro: O(1) space, no extra data structure
     Con: Destroys input (ask interviewer if that's okay)
  2. Separate visited set: visited.add(r * cols + c)
     Pro: Preserves input
     Con: O(m×n) extra space

INTERVIEWER TEST: "Can you do it without modifying the grid?"
  CORRECT: "Yes, I'll use a boolean[][] visited array. Same time complexity,
  O(m×n) extra space."
```

### Mistake 2: Stack Overflow on Deep Recursion

```
DANGER ZONE: Skewed tree with 10,000+ nodes, or grid DFS on 300×300
  Java default stack size: ~512KB → ~5,000-10,000 stack frames

SOLUTIONS:
  1. Convert to iterative DFS with explicit stack (always safe)
  2. Increase JVM stack size: -Xss4m (not applicable in interviews)

INTERVIEW SCRIPT: "For very deep trees, I'd convert to iterative DFS
  with an explicit stack to avoid stack overflow."

NOTE: LeetCode's recursion limit is generous (~40,000 frames).
      In production code, always consider iterative for unbounded depth.
```

### Mistake 3: Not Backtracking (Path Tracking Problems)

```
WRONG:
  path.add(node.val);
  dfs(node.left, ...);
  dfs(node.right, ...);
  // forgot to remove! path grows forever

CORRECT:
  path.add(node.val);
  dfs(node.left, ...);
  dfs(node.right, ...);
  path.remove(path.size() - 1);  // MUST undo the choice

ALSO WRONG: Forgetting to COPY path when recording result
  result.add(path);                    // BUG: adds reference, mutated later
  result.add(new ArrayList<>(path));   // CORRECT: snapshot copy
```

### Mistake 4: Global Variable vs Return Value Confusion

```
WHEN TO USE GLOBAL VARIABLE:
  The ANSWER involves both subtrees, but the RETURN VALUE can only carry one arm.

  Diameter: answer = leftDepth + rightDepth (both arms)
            return = 1 + max(leftDepth, rightDepth) (one arm to parent)

  Max Path Sum: answer = leftGain + rightGain + node.val (both arms)
                return = node.val + max(leftGain, rightGain) (one arm to parent)

COMMON BUG: Trying to return the answer directly without a global variable.
  This fails because the maximum path doesn't have to go through the root.
```

### Mistake 5: Wrong BST Validation

```
WRONG: Only checking node.left.val < node.val < node.right.val
  This misses: node's left subtree could have a value GREATER than node's grandparent

      5
     / \
    1   6
       / \
      3   7    ← 3 < 5 but is in RIGHT subtree of 5. INVALID BST!

CORRECT: Pass (min, max) range down. Every node must satisfy min < val < max.
  Use long to avoid issues when node.val == Integer.MIN_VALUE or Integer.MAX_VALUE.
```

### Mistake 6: Confusing Preorder / Inorder / Postorder

```
         1
        / \
       2   3

PRE-ORDER  (root, left, right): 1, 2, 3  → "process BEFORE children"
IN-ORDER   (left, root, right): 2, 1, 3  → "process BETWEEN children" (BST gives sorted)
POST-ORDER (left, right, root): 2, 3, 1  → "process AFTER children" (combine results)

RULE OF THUMB:
  Need to pass info DOWN (constraints, ranges) → pre-order / top-down
  Need to pass info UP (depths, sums, results) → post-order / bottom-up
  Need sorted order from BST → in-order
```

### What Interviewers Actually Look For

```
JUNIOR:    Can write basic recursive tree DFS, handles null base case
SENIOR:    Picks correct DFS variant (top-down vs bottom-up vs global var),
           handles edge cases, discusses recursive vs iterative trade-offs
STAFF:     Immediately sees "this is a diameter-style problem" or "this is an
           LCA-style problem", discusses time/space, mentions when BFS is better
```

---

## 7. Interview Strategy

### Target Solving Times

```
Easy (Max Depth, Path Sum):              5-8 minutes (including explanation)
Medium (Islands, BST, LCA, Diameter):   10-15 minutes
Hard (Max Path Sum, Distinct Islands):  15-20 minutes
Hard (Longest Increasing Path):         20-25 minutes (DFS + memo reasoning)

If you're taking longer than these, you haven't internalized the templates.
```

### How to Explain Your Approach (Script)

```
STEP 1 (15 seconds): Identify the DFS variant
  "This is a tree problem where I need to compute depth bottom-up,
   so I'll use post-order DFS."

STEP 2 (30 seconds): State the recurrence
  "At each node, I recurse left and right to get their depths.
   The depth of this node is 1 plus the max of those.
   Base case: null returns 0."

STEP 3 (15 seconds): Mention the global variable if needed
  "The diameter passes through a node as leftDepth + rightDepth,
   but I can only return one arm upward. So I'll maintain a global max
   and update it at each node."

STEP 4 (15 seconds): Confirm edge cases
  "I'll handle empty tree (return 0), single node (depth 1),
   and skewed tree (recursion depth = n)."

STEP 5: Code (5-10 minutes)

STEP 6 (30 seconds): Walk through an example
  Trace through a small tree showing recursive calls and return values.
```

### Follow-Up Questions Interviewers Ask

```
Q: "Can you do it iteratively?"
A: "Yes, I'd use an explicit stack. For pre-order it's straightforward —
    push right child first, then left. For post-order, I'd use two stacks
    or a flag to track if children have been processed."

Q: "What's the space complexity?"
A: "O(h) where h is the tree height. For a balanced tree that's O(log n),
    for a skewed tree it's O(n). The recursion stack is the dominant space cost."

Q: "What if the tree is very deep?"
A: "I'd convert to iterative DFS with an explicit stack to avoid stack overflow.
    Same time complexity, but we control the stack on the heap."

Q: "Why not BFS for this problem?"
A: "BFS works level by level and is ideal for shortest path or level-order problems.
    For depth/path/subtree problems, DFS is more natural because the recursive
    structure mirrors the tree structure."

Q: "For islands, can you preserve the original grid?"
A: "Yes, I'd use a separate boolean[][] visited array instead of modifying the grid.
    Same O(m×n) time, but O(m×n) extra space."
```

---

## 8. Revision Strategy + Quick Reference

### Weekly Revision Plan

```
WEEK 1: Solve all 9 problems from scratch. Time yourself.
WEEK 2: Re-solve only the ones you couldn't do in target time.
WEEK 3: Solve 236 (LCA), 124 (Max Path Sum), 329 (Longest Increasing Path) from memory.
WEEK 4: Mix with BFS and backtracking problems to practice pattern selection.
```

### What to Memorize vs Understand

```
MEMORIZE:
  ✓ The 7 templates (bottom-up, top-down, iterative, graph, grid, path-tracking, global var)
  ✓ "use long for BST bounds" (avoids Integer.MIN_VALUE edge case)
  ✓ "copy the path list when recording" — new ArrayList<>(path)
  ✓ "clip negative gains" — Math.max(0, gain) for max path sum

UNDERSTAND (don't memorize — derive each time):
  ✓ WHY LCA works (both subtrees non-null means current node is the split point)
  ✓ WHY diameter needs a global variable (answer spans both arms, return carries one)
  ✓ WHY grid DFS doesn't need a visited set when you can modify the grid
  ✓ WHY longest increasing path doesn't need explicit visited (strictly increasing = no cycles)
  ✓ HOW to choose between top-down and bottom-up (passing info down vs combining up)
```

### Signals That Indicate Mastery

```
□ You see "tree + depth/height" and IMMEDIATELY write the 3-line recursive DFS (< 30 seconds)
□ You can write LCA from memory and explain WHY it works in one sentence
□ You know when to use a global variable vs pure return value (diameter vs max depth)
□ You can solve Max Path Sum (#124) in under 15 minutes and explain the "clip negative" trick
□ You can convert any recursive tree DFS to iterative with a stack
□ You never forget to backtrack in path-tracking problems
□ You can articulate when BFS is better than DFS (and vice versa)
```

---

## Quick Reference Card

```
VARIANT              TEMPLATE                              TIME     SPACE
───────────────────────────────────────────────────────────────────────────
Tree bottom-up       recurse children, combine at node     O(n)     O(h)
Tree top-down        pass range/state down, validate       O(n)     O(h)
Tree iterative       explicit stack, push R then L         O(n)     O(h)
Graph DFS            visited[] + recurse neighbors         O(V+E)   O(V)
Grid DFS             bounds check + mark cell + 4-dir      O(m×n)   O(m×n)
Path tracking        add → recurse → remove (backtrack)    O(n)     O(h)
Global variable      update global with both arms          O(n)     O(h)

DECISION TREE:
  Tree problem?
    Need info from children → BOTTOM-UP (post-order)
    Need to pass constraints down → TOP-DOWN (pre-order)
    Answer spans both subtrees → GLOBAL VARIABLE + return one arm
  Graph/Grid?
    Connectivity/count components → GRID DFS with visited
    Need all paths → PATH TRACKING with backtrack
  Shortest path? → DON'T USE DFS → use BFS
```

---

## Problem Solutions

### LC 104 — Maximum Depth of Binary Tree (Easy)

- **Pattern:** Bottom-up DFS (post-order).
- **Brute Force:** BFS level-order traversal, count levels. O(n) time, O(n) space for queue.
- **Intuition:** Depth of a tree = 1 + max(depth of left subtree, depth of right subtree). Null node has depth 0.
- **Approach:** Recurse left, recurse right, return `1 + max(left, right)`. Base case: null returns 0.
- **Java Solution:**

```java
class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}
```

- **Complexity:** Time O(n) — visit every node once. Space O(h) — recursion stack.

---

### LC 112 — Path Sum (Easy)

- **Pattern:** Top-down DFS (pre-order), subtract and check at leaf.
- **Brute Force:** Enumerate all root-to-leaf paths, compute sums, check if any equals target. Same complexity but more code.
- **Intuition:** Subtract current node's value from remaining target as you go down. At a leaf, if remaining is 0, path is valid.
- **Approach:** If null return false. Subtract node.val. If leaf and remaining == 0, return true. Recurse left OR right.
- **Java Solution:**

```java
class Solution {
    public boolean hasPathSum(TreeNode root, int targetSum) {
        if (root == null) return false;
        targetSum -= root.val;
        if (root.left == null && root.right == null) return targetSum == 0;
        return hasPathSum(root.left, targetSum) || hasPathSum(root.right, targetSum);
    }
}
```

- **Complexity:** Time O(n) — visit every node once. Space O(h) — recursion stack.

---

### LC 200 — Number of Islands (Medium)

- **Pattern:** Grid DFS, mark visited by modifying grid.
- **Brute Force:** Use a separate `boolean[][] visited` matrix instead of mutating. Same time, O(m×n) extra space.
- **Intuition:** Scan grid. When you find `'1'`, DFS to sink the entire island (flip connected `'1'`s to `'0'`). Increment count.
- **Approach:** Iterate every cell. If `'1'`, call DFS (marks all connected land as `'0'`), increment count.
- **Java Solution:**

```java
class Solution {
    public int numIslands(char[][] grid) {
        int count = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == '1') {
                    dfs(grid, r, c);
                    count++;
                }
            }
        }
        return count;
    }

    private void dfs(char[][] grid, int r, int c) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length
            || grid[r][c] == '0') return;
        grid[r][c] = '0';
        dfs(grid, r + 1, c);
        dfs(grid, r - 1, c);
        dfs(grid, r, c + 1);
        dfs(grid, r, c - 1);
    }
}
```

- **Complexity:** Time O(m×n) — each cell visited at most once. Space O(m×n) — recursion stack worst case (all land).

---

### LC 98 — Validate Binary Search Tree (Medium)

- **Pattern:** Top-down DFS with range `(min, max)`.
- **Brute Force:** In-order traversal into list, check if strictly increasing. O(n) time, O(n) space.
- **Intuition:** Every node must lie within a valid range. Root is `(-∞, +∞)`. Left child narrows upper bound to parent's value. Right child narrows lower bound to parent's value. Use `long` to handle `Integer.MIN_VALUE` edge case.
- **Approach:** DFS passing `(min, max)`. If null → valid. If `val <= min || val >= max` → invalid. Recurse left with `(min, node.val)`, right with `(node.val, max)`.
- **Java Solution:**

```java
class Solution {
    public boolean isValidBST(TreeNode root) {
        return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }

    private boolean validate(TreeNode node, long min, long max) {
        if (node == null) return true;
        if (node.val <= min || node.val >= max) return false;
        return validate(node.left, min, node.val)
            && validate(node.right, node.val, max);
    }
}
```

- **Complexity:** Time O(n) — visit every node once. Space O(h) — recursion stack.

---

### LC 236 — Lowest Common Ancestor of a Binary Tree (Medium)

- **Pattern:** Bottom-up DFS (post-order). Return found node upward.
- **Brute Force:** Find root-to-p path and root-to-q path separately, compare to find last common node. O(n) time, O(h) space for paths.
- **Intuition:** If current node is `p` or `q`, return it. Recurse left and right. If BOTH return non-null, current node is the LCA (p and q are in different subtrees). If only one returns non-null, propagate it up.
- **Approach:** Base: null or node == p or node == q → return node. Recurse left, right. Both non-null → current is LCA. One non-null → return that one.
- **Why it works:** The first node where left and right both found something is necessarily the split point — the lowest ancestor that has p in one subtree and q in the other.
- **Java Solution:**

```java
class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) return root;
        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);
        if (left != null && right != null) return root;
        return left != null ? left : right;
    }
}
```

- **Complexity:** Time O(n) — visit every node at most once. Space O(h) — recursion stack.

---

### LC 543 — Diameter of Binary Tree (Medium)

- **Pattern:** Global variable + bottom-up DFS.
- **Brute Force:** For every node, compute depth of left subtree and right subtree, sum them. Track max. O(n²) — depth computation repeated per node.
- **Intuition:** The diameter passing through a node = `leftDepth + rightDepth`. But when returning to the parent, we can only extend ONE arm: `1 + max(leftDepth, rightDepth)`. So we track the best diameter in a global variable while returning single-arm depths.
- **Approach:** DFS returns depth. At each node, update global `diameter = max(diameter, left + right)`. Return `1 + max(left, right)`.
- **Java Solution:**

```java
class Solution {
    private int diameter = 0;

    public int diameterOfBinaryTree(TreeNode root) {
        depth(root);
        return diameter;
    }

    private int depth(TreeNode node) {
        if (node == null) return 0;
        int left = depth(node.left);
        int right = depth(node.right);
        diameter = Math.max(diameter, left + right);
        return 1 + Math.max(left, right);
    }
}
```

- **Complexity:** Time O(n) — visit every node once. Space O(h) — recursion stack.

---

### LC 124 — Binary Tree Maximum Path Sum (Hard)

- **Pattern:** Global variable + bottom-up DFS + clip negative gains.
- **Brute Force:** For every node, try all paths through it by computing max gains from left and right subtrees independently. O(n²).
- **Intuition:** At each node, the best path through it = `node.val + leftGain + rightGain`. But leftGain or rightGain could be negative — we clip them to 0 (don't extend into a subtree that hurts us). When returning upward, we can only take ONE arm: `node.val + max(leftGain, rightGain)`. Track the global best path.
- **Approach:** DFS returns max gain from one arm. At each node: `left = max(0, dfs(left))`, `right = max(0, dfs(right))`. Update global: `max(global, node.val + left + right)`. Return `node.val + max(left, right)`.
- **Java Solution:**

```java
class Solution {
    private int maxSum = Integer.MIN_VALUE;

    public int maxPathSum(TreeNode root) {
        gain(root);
        return maxSum;
    }

    private int gain(TreeNode node) {
        if (node == null) return 0;
        int left = Math.max(0, gain(node.left));
        int right = Math.max(0, gain(node.right));
        maxSum = Math.max(maxSum, node.val + left + right);
        return node.val + Math.max(left, right);
    }
}
```

- **Complexity:** Time O(n) — visit every node once. Space O(h) — recursion stack.

---

### LC 694 — Number of Distinct Islands (Medium — Premium)

- **Pattern:** Grid DFS + path serialization.
- **Brute Force:** For each island, record all coordinates, normalize by translating to origin, compare sets. Same complexity but more complex normalization.
- **Intuition:** Two islands are the same shape if the DFS traversal from their starting cells follows the same relative path. Encode the DFS directions as a string (e.g., `"DRUL"` for down-right-up-left) and use a set to count unique shapes. Include backtrack markers to distinguish different shapes that visit the same cells in different structures.
- **Approach:** For each unvisited `'1'`, DFS and record direction at each step (D/U/L/R) plus a backtrack marker (B). Add the path string to a `HashSet`. Return set size.
- **Java Solution:**

```java
class Solution {
    public int numDistinctIslands(int[][] grid) {
        Set<String> shapes = new HashSet<>();
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == 1) {
                    StringBuilder sb = new StringBuilder();
                    dfs(grid, r, c, sb, 'S');
                    shapes.add(sb.toString());
                }
            }
        }
        return shapes.size();
    }

    private void dfs(int[][] grid, int r, int c, StringBuilder sb, char dir) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length
            || grid[r][c] == 0) return;
        grid[r][c] = 0;
        sb.append(dir);
        dfs(grid, r + 1, c, sb, 'D');
        dfs(grid, r - 1, c, sb, 'U');
        dfs(grid, r, c + 1, sb, 'R');
        dfs(grid, r, c - 1, sb, 'L');
        sb.append('B');
    }
}
```

- **Complexity:** Time O(m×n) — each cell visited once. Space O(m×n) — recursion stack + shape strings.

---

### LC 329 — Longest Increasing Path in a Matrix (Hard)

- **Pattern:** DFS + memoization. No visited set needed because strictly increasing means no cycles.
- **Brute Force:** DFS from every cell without memoization. O(4^(m×n)) exponential — recomputes overlapping subproblems.
- **Intuition:** From each cell, the longest increasing path is `1 + max(paths from valid neighbors)`. Since the path is strictly increasing, we can never revisit a cell (going backward would decrease the value), so no cycle is possible. Cache results in a `memo[][]` to avoid recomputation.
- **Approach:** For each cell, DFS to all 4 neighbors that have a strictly greater value. Cache result in `memo[r][c]`. Return the max across all cells.
- **Java Solution:**

```java
class Solution {
    private static final int[][] DIRS = {{0,1},{0,-1},{1,0},{-1,0}};

    public int longestIncreasingPath(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        int[][] memo = new int[m][n];
        int max = 0;
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                max = Math.max(max, dfs(matrix, r, c, memo));
            }
        }
        return max;
    }

    private int dfs(int[][] matrix, int r, int c, int[][] memo) {
        if (memo[r][c] != 0) return memo[r][c];
        int best = 1;
        for (int[] d : DIRS) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < matrix.length && nc >= 0 && nc < matrix[0].length
                && matrix[nr][nc] > matrix[r][c]) {
                best = Math.max(best, 1 + dfs(matrix, nr, nc, memo));
            }
        }
        memo[r][c] = best;
        return best;
    }
}
```

- **Complexity:** Time O(m×n) — each cell computed once and cached. Space O(m×n) — memo array + recursion stack.

---

## Complexity Cheat Sheet

| Scenario | Time | Space | Notes |
|----------|------|-------|-------|
| Tree DFS (recursive) | O(n) | O(h) recursion stack | h = height; O(log n) balanced, O(n) skewed |
| Tree DFS (iterative) | O(n) | O(h) explicit stack | Same complexity, avoids stack overflow |
| Grid DFS (m×n) | O(m×n) | O(m×n) stack worst case | Each cell visited once |
| Graph DFS (V, E) | O(V + E) | O(V) visited | Each vertex + edge processed once |
| DFS + memoization | O(cells) | O(cells) memo array | Each cell computed once |
| Path enumeration | O(paths × len) | O(h) | Backtrack after each path |

## Pattern Variations at a Glance

| Variation | Example | Key Technique |
|-----------|---------|---------------|
| **Bottom-up (post-order)** | Max Depth (#104), Diameter (#543) | Combine children results at parent |
| **Top-down (pre-order)** | Validate BST (#98), Path Sum (#112) | Pass constraints/state downward |
| **Global variable** | Diameter (#543), Max Path Sum (#124) | Update global with both arms, return one |
| **Grid DFS** | Islands (#200), Distinct Islands (#694) | 4-directional, mark visited |
| **DFS + memoization** | Longest Increasing Path (#329) | Cache results, no visited needed if acyclic |
| **Path + backtrack** | Path Sum II (#113) | Add → recurse → remove |
| **LCA** | #236 | Both subtrees non-null → current is LCA |
