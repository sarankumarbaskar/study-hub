# BFS (Breadth-First Search) — Interview Execution Playbook

> **Pattern Mastery Level:** BFS is the go-to pattern for shortest path in unweighted graphs. It appears in ~12% of FAANG coding rounds, often disguised as grid traversal, level-order traversal, or state-space search. If you can't recognize "BFS = shortest path when all edges cost 1" within 5 seconds, you're leaving points on the table.

---

## 1. Pattern Recognition Signals

### When to Use BFS

```
INSTANT TRIGGERS (say "BFS" within 5 seconds):
  ✓ "Shortest path" + unweighted graph or grid (all moves cost 1)
  ✓ "Minimum number of steps/moves/transformations"
  ✓ "Level-order traversal" of a tree
  ✓ "Nearest" / "closest" from a set of sources
  ✓ "Spread" / "propagate" from multiple starting points simultaneously
  ✓ Grid + "reach destination in fewest moves"
```

### Keywords in Problem Statements

```
DIRECT SIGNALS:              INDIRECT SIGNALS:
  "shortest path"              "minimum steps"
  "level order"                "nearest zero / gate / building"
  "number of moves"            "rotting / spreading / infecting"
  "fewest transformations"     "all nodes at distance K"
  "breadth-first"              "turn the lock / change one letter"
  "layer by layer"             "multi-source" / "simultaneous start"
```

### When NOT to Use

```
✗ Weighted edges (different costs) → use DIJKSTRA or Bellman-Ford
✗ "Find ALL paths" or "count ALL paths" → use DFS / BACKTRACKING
✗ Need to explore deep before wide → use DFS
✗ Topological ordering of a DAG → use TOPOLOGICAL SORT (Kahn's uses BFS but different intent)
✗ Finding connected components only (no distance needed) → DFS is simpler and avoids queue overhead
```

---

## 2. Thinking Framework (Step-by-Step Intuition)

### The 60-Second Decision Process

```
Step 1: "Is this a shortest-path / minimum-steps problem where every move costs the same?"
  YES → BFS is almost certainly the approach
  NO  → Check if it's level-order tree traversal

Step 2: "What is a 'node'? What are the 'edges'?"
  - Grid cell → neighbors are 4-directional (or 8-directional)
  - Tree node → children are neighbors
  - String state → neighbors are all valid 1-character transformations
  - Lock combo → neighbors are all 8 single-digit turns

Step 3: "How many sources?"
  ONE source (e.g., start cell, root) → standard single-source BFS
  MULTIPLE sources (e.g., all rotten oranges, all 0s, all buildings) → multi-source BFS

Step 4: "Do I need to track levels / distance?"
  YES → use the queue.size() trick: process one full level per outer iteration
  NO  → simple BFS without level tracking is fine
```

### The Core Insight (Memorize This)

```
BFS GUARANTEES SHORTEST PATH IN UNWEIGHTED GRAPHS BECAUSE:
  The queue is FIFO. Nodes at distance d are ALL processed before
  any node at distance d+1. So the FIRST time you reach a node,
  you reached it via the shortest possible path.

  Think of it as ripples in a pond:
    - Drop a stone (source) → ripple 1 = distance 1
    - Ripple 2 = distance 2, and so on
    - The first ripple to touch a target IS the shortest distance

  For multi-source BFS: drop MANY stones at once.
    - All sources start at distance 0
    - Ripples expand simultaneously from all sources
    - First touch from ANY source = shortest distance to nearest source
```

### BFS vs DFS Decision

```
USE BFS WHEN:                           USE DFS WHEN:
  Shortest path / minimum steps           Existence of any path
  Level-by-level processing               Exploring all possibilities
  Nearest / closest queries               Backtracking / permutations
  Spread from multiple sources             Finding cycles in directed graphs
  State-space with uniform cost            Memory-constrained (BFS queue can be huge)
```

---

## 3. Java Templates (Production-Quality)

### Template 1: Tree Level-Order BFS

```java
// USE FOR: LC 102 Level Order, 107 Bottom-Up, 199 Right Side View, 637 Average of Levels
// TIME: O(n) | SPACE: O(w) where w = max width of tree
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int size = queue.size(); // CRITICAL: capture size BEFORE polling
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}
```

### Template 2: Graph BFS — Shortest Path

```java
// USE FOR: LC 127 Word Ladder, 752 Open the Lock, 1091 Shortest Path in Binary Matrix
// TIME: O(V + E) | SPACE: O(V)
public int bfsShortestPath(int start, int target, Map<Integer, List<Integer>> graph) {
    if (start == target) return 0;

    Set<Integer> visited = new HashSet<>();
    Queue<Integer> queue = new LinkedList<>();
    visited.add(start);
    queue.offer(start);
    int steps = 0;

    while (!queue.isEmpty()) {
        int size = queue.size();
        steps++;
        for (int i = 0; i < size; i++) {
            int node = queue.poll();
            for (int neighbor : graph.getOrDefault(node, Collections.emptyList())) {
                if (neighbor == target) return steps;
                if (visited.add(neighbor)) { // add returns false if already present
                    queue.offer(neighbor);
                }
            }
        }
    }
    return -1; // unreachable
}
```

### Template 3: Multi-Source BFS

```java
// USE FOR: LC 994 Rotting Oranges, 542 01 Matrix, 317 Shortest Distance from All Buildings
// KEY IDEA: enqueue ALL sources at distance 0, then BFS expands simultaneously
// TIME: O(m*n) | SPACE: O(m*n)
public void multiSourceBFS(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
    Queue<int[]> queue = new LinkedList<>();
    boolean[][] visited = new boolean[m][n];

    // Step 1: enqueue ALL sources
    for (int r = 0; r < m; r++) {
        for (int c = 0; c < n; c++) {
            if (isSource(grid[r][c])) {
                queue.offer(new int[]{r, c});
                visited[r][c] = true;
            }
        }
    }

    // Step 2: BFS level by level
    int dist = 0;
    while (!queue.isEmpty()) {
        int size = queue.size();
        dist++;
        for (int i = 0; i < size; i++) {
            int[] cur = queue.poll();
            for (int[] d : dirs) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && !visited[nr][nc]) {
                    visited[nr][nc] = true;
                    // process: grid[nr][nc] = dist, or count--, etc.
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
    }
}
```

### Template 4: BFS on Grid / Matrix

```java
// USE FOR: LC 200 Number of Islands, 1091 Shortest Path in Binary Matrix, grid flood-fill
// TIME: O(m*n) | SPACE: O(m*n)
private static final int[][] DIRS = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
// for 8-directional: add {-1,-1},{-1,1},{1,-1},{1,1}

public int bfsGrid(int[][] grid, int sr, int sc, int tr, int tc) {
    int m = grid.length, n = grid[0].length;
    if (grid[sr][sc] == BLOCKED || grid[tr][tc] == BLOCKED) return -1;

    boolean[][] visited = new boolean[m][n];
    Queue<int[]> queue = new LinkedList<>();
    queue.offer(new int[]{sr, sc});
    visited[sr][sc] = true;
    int steps = 0;

    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            int[] cur = queue.poll();
            if (cur[0] == tr && cur[1] == tc) return steps;
            for (int[] d : DIRS) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n
                        && !visited[nr][nc] && grid[nr][nc] != BLOCKED) {
                    visited[nr][nc] = true;
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
        steps++;
    }
    return -1;
}
```

---

## 4. Edge Case Checklist

```
INPUT EDGE CASES:
  □ Empty grid / null root → return 0 or empty list
  □ Single cell grid → already at destination? return 0
  □ Start == target → return 0 immediately (don't even BFS)
  □ Target unreachable → return -1 after BFS exhausts all states
  □ All cells blocked / all deadends → return -1

VISITED SET EDGE CASES:
  □ Mark visited WHEN ENQUEUING, not when dequeuing
    (dequeue-time marking causes duplicate enqueues and TLE)
  □ Grid: can mutate grid itself as visited marker (flip '1'→'0')
    or use separate boolean[][] — choose based on whether input can be modified
  □ State-space: visited key must include ALL state dimensions
    e.g., (row, col, keys_collected) not just (row, col)

LEVEL / DISTANCE TRACKING:
  □ Capture size = queue.size() BEFORE the inner for-loop
  □ Off-by-one: does the answer count nodes or edges?
    - Word Ladder returns number of WORDS (edges + 1)
    - Rotting Oranges returns number of MINUTES (edges)
  □ Multi-source: if no work done in a level, don't increment distance
    (Rotting Oranges: only increment minutes if at least one orange rotted)

MULTI-SOURCE:
  □ All sources enqueued at distance 0 BEFORE BFS starts
  □ No fresh oranges but grid has only empties → return 0 (not -1)
  □ 317 Shortest Distance from All Buildings: a cell must be reachable
    from ALL buildings, not just any one

IMPLICIT GRAPH / STATE-SPACE:
  □ 752 Open the Lock: "0000" might be a deadend → return -1 immediately
  □ 127 Word Ladder: endWord not in wordList → return 0
  □ Wrap-around arithmetic: (digit + delta + 10) % 10
```

---

## 5. Problem Progression (LeetCode)

### Level 1: Foundations — Build the Muscle Memory

| # | Problem | Variant | Key Insight | Time |
|---|---------|---------|------------|------|
| 102 | [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) | Tree level-order | `queue.size()` to process one level at a time | O(n) |
| 200 | [Number of Islands](https://leetcode.com/problems/number-of-islands/) | Grid BFS / connected components | BFS from each unvisited '1', mark as visited, count components | O(m·n) |

### Level 2: Multi-Source and Grid BFS

| # | Problem | Variant | Key Insight | Time |
|---|---------|---------|------------|------|
| 994 | [Rotting Oranges](https://leetcode.com/problems/rotting-oranges/) | Multi-source BFS | Enqueue ALL rotten oranges at time 0; each level = 1 minute | O(m·n) |
| 542 | [01 Matrix](https://leetcode.com/problems/01-matrix/) | Multi-source BFS | Enqueue ALL 0-cells; BFS outward fills shortest distance to nearest 0 | O(m·n) |
| 1091 | [Shortest Path in Binary Matrix](https://leetcode.com/problems/shortest-path-in-binary-matrix/) | Grid BFS (8-dir) | 8-directional BFS from (0,0) to (n-1,n-1); first arrival = shortest | O(n²) |

### Level 3: Implicit Graph / State-Space BFS

| # | Problem | Variant | Key Insight | Time |
|---|---------|---------|------------|------|
| 127 | [Word Ladder](https://leetcode.com/problems/word-ladder/) | Implicit graph | Nodes = words; edge = differ by 1 char; try all 26 replacements per position | O(M²·N) |
| 752 | [Open the Lock](https://leetcode.com/problems/open-the-lock/) | State-space BFS | State = 4-digit string; 8 neighbors per state (each digit ±1); skip deadends | O(10⁴) |
| 863 | [All Nodes Distance K in Binary Tree](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/) | Tree → undirected graph BFS | Build parent map, then BFS from target node exactly K levels | O(n) |

### Level 4: Hard — FAANG Interview Level

| # | Problem | Variant | Key Insight | Time |
|---|---------|---------|------------|------|
| 317 | [Shortest Distance from All Buildings](https://leetcode.com/problems/shortest-distance-from-all-buildings/) | Repeated multi-source BFS | BFS from EACH building; accumulate distances; cell must be reachable from ALL buildings | O(B·m·n) |

### Solving Order for Maximum Learning

```
Day 1: 102 → 200 (tree BFS + grid BFS fundamentals)
Day 2: 994 → 542 (multi-source BFS — learn to enqueue all sources at once)
Day 3: 1091 → 127 → 752 (grid shortest path + implicit graph / state-space)
Day 4: 863 → 317 (tree-to-graph conversion + advanced multi-source)
Day 5: Re-solve 994, 127, 752 WITHOUT notes (test recall under time pressure)
```

---

## 6. Common Mistakes & Interview Traps

### Mistake 1: Marking Visited at Dequeue Time Instead of Enqueue Time

```
WRONG:
  while (!queue.isEmpty()) {
      int[] cur = queue.poll();
      if (visited[cur[0]][cur[1]]) continue;  // TOO LATE — duplicates already in queue
      visited[cur[0]][cur[1]] = true;
      ...
  }

CORRECT:
  // Mark visited IMMEDIATELY when adding to queue
  visited[nr][nc] = true;       // ← RIGHT HERE
  queue.offer(new int[]{nr, nc});

WHY: Multiple nodes at the same level can all enqueue the same neighbor.
By the time you dequeue and check, you've wasted O(n) extra space and time.
This is the #1 cause of TLE on BFS problems.
```

### Mistake 2: Forgetting to Capture Level Size Before Polling

```
WRONG:
  while (!queue.isEmpty()) {
      for (int i = 0; i < queue.size(); i++) {  // BUG: queue.size() changes as you poll!
          TreeNode node = queue.poll();
          ...
      }
  }

CORRECT:
  int size = queue.size();  // capture ONCE before the inner loop
  for (int i = 0; i < size; i++) {
      ...
  }
```

### Mistake 3: Off-by-One in Step/Distance Counting

```
Word Ladder asks for "number of words in transformation sequence" (nodes, not edges)
  "hit" → "hot" → "dot" → "dog" → "cog" = 5 words → return 5
  Steps (edges) = 4, but answer = steps + 1 = 5

Rotting Oranges asks for "minutes" (edges, not nodes)
  Only increment minutes if at least one orange rotted this level

Open the Lock asks for "minimum turns" (edges)
  Return step count when you first discover target

ALWAYS re-read the problem to confirm: counting nodes or edges?
```

### Mistake 4: Multi-Source BFS — Forgetting to Add ALL Sources Before Starting

```
WRONG: Add one source, BFS, then add next source, BFS...
  This gives distance from the LAST source, not the nearest source!

CORRECT: Add ALL sources to queue at distance 0 BEFORE any BFS processing.
  The BFS then naturally computes minimum distance to the nearest source.
```

### Mistake 5: Implicit Graph — Not Thinking About What "Neighbors" Are

```
Common failure in Word Ladder:
  SLOW: compare every pair of words to find 1-edit neighbors → O(N² × M)
  FAST: for each position, try all 26 letters, check if result is in wordSet → O(26 × M)

Common failure in Open the Lock:
  Forgetting wrap-around: '0' - 1 = '9' and '9' + 1 = '0'
  Formula: (digit + delta + 10) % 10
```

### Mistake 6: Rotting Oranges — Wrong Answer When No Fresh Oranges Exist

```
Edge case: grid has no fresh oranges at all → return 0 (not -1)
  Check fresh == 0 BEFORE starting BFS

Edge case: fresh oranges exist but no rotten oranges → return -1
  BFS queue starts empty, never processes anything, fresh > 0 → return -1
```

### What Interviewers Actually Look For

```
JUNIOR:    Can write basic BFS with queue, visited set, level tracking
SENIOR:    Immediately identifies single-source vs multi-source, handles all edge
           cases, uses visited.add() return value, explains time/space confidently
STAFF:     Discusses BFS vs Dijkstra trade-offs, considers bidirectional BFS for
           Word Ladder, identifies when A* would help, talks about state compression
```

---

## 7. Interview Strategy

### Target Solving Times

```
Easy (Level Order Traversal):                    5-8 minutes
Medium (Rotting Oranges, Number of Islands):      10-15 minutes
Medium-Hard (Word Ladder, Open the Lock):         12-18 minutes
Hard (Shortest Distance from All Buildings):      18-25 minutes

If you're taking longer, you haven't internalized the templates.
```

### How to Explain Your Approach (Script)

```
STEP 1 (30 seconds): Identify the pattern
  "This is a shortest-path problem where every move costs the same,
   so BFS gives the optimal answer."

STEP 2 (30 seconds): Define graph structure
  "The nodes are [cells / states / words]. Two nodes are connected if
   [adjacent on grid / differ by one character / one dial turn apart]."

STEP 3 (20 seconds): Single vs multi-source
  "I'll use [single-source / multi-source] BFS. I start by enqueuing
   [the source / all sources at distance 0]."

STEP 4 (15 seconds): Confirm edge cases
  "Edge cases: start == target returns 0, unreachable returns -1,
   [problem-specific case]."

STEP 5: Code (8-15 minutes)

STEP 6 (30 seconds): Dry run
  "For this example: enqueue (0,0), level 1 expands to..., level 2
   reaches target → return 2."

STEP 7 (15 seconds): Complexity
  "Time O(V + E) [or O(m·n) for grids]. Space O(V) for the queue and
   visited set."
```

### Follow-Up Questions Interviewers Ask

```
Q: "What if edges have different weights?"
A: "Then BFS doesn't guarantee shortest path. I'd switch to Dijkstra's
    algorithm with a priority queue — O((V+E) log V)."

Q: "Can you optimize Word Ladder?"
A: "Bidirectional BFS — search from both beginWord and endWord simultaneously.
    The two frontiers meet in the middle, reducing time from O(b^d) to O(b^(d/2))
    where b = branching factor and d = depth."

Q: "What if the grid is very large but mostly empty?"
A: "BFS still visits only reachable cells. If the grid is sparse,
    I'd use a HashSet for visited instead of a 2D boolean array to save space."

Q: "How would you handle obstacles you can destroy (like LC 1293)?"
A: "Expand the state to (row, col, obstacles_used). The visited check
    becomes per-state: only revisit a cell if we reach it with fewer
    obstacles eliminated."

Q: "BFS uses a lot of memory. Can you reduce it?"
A: "For tree level-order, the queue holds at most one level — O(w) where
    w is max width. For grid BFS, O(m·n) is unavoidable in worst case.
    If memory is critical and we only need existence (not shortest path),
    DFS uses O(depth) stack space instead."
```

---

## 8. Revision Strategy

### Weekly Revision Plan

```
WEEK 1: Solve all 9 problems from scratch. Time yourself strictly.
WEEK 2: Re-solve only the ones you couldn't do in target time.
WEEK 3: Solve 994, 127, and 752 from memory — no notes, no IDE help.
WEEK 4: Mix with DFS, Dijkstra, and Union-Find problems to practice
         pattern SELECTION (the hardest skill).
```

### What to Memorize vs Understand

```
MEMORIZE:
  ✓ The 4 templates (level-order, graph shortest path, multi-source, grid BFS)
  ✓ The directions array: {{-1,0},{1,0},{0,-1},{0,1}} (and 8-dir variant)
  ✓ Mark visited at ENQUEUE time, not dequeue time
  ✓ Capture size = queue.size() BEFORE inner loop
  ✓ (digit + delta + 10) % 10 for lock/digit wrap-around

UNDERSTAND (derive each time, don't memorize):
  ✓ WHY BFS guarantees shortest path (FIFO processes all of distance d before d+1)
  ✓ WHY multi-source BFS works (all sources at distance 0 = virtual super-source)
  ✓ WHY visited at enqueue time matters (prevents duplicate processing)
  ✓ HOW to model implicit graphs (define what a "node" is and what "neighbors" are)
  ✓ WHEN to use BFS vs DFS vs Dijkstra (cost uniformity is the deciding factor)
```

### Signals That Indicate Mastery

```
□ You see "shortest path, all moves cost 1" and IMMEDIATELY say "BFS" (< 5 seconds)
□ You can write Rotting Oranges (multi-source BFS) in under 10 minutes cold
□ You can solve Word Ladder and explain why you try 26 chars instead of comparing all pairs
□ You instinctively mark visited at enqueue time without even thinking about it
□ You can convert a tree to an undirected graph (parent map) for LC 863 without hesitation
□ You can articulate BFS vs Dijkstra: "BFS for uniform cost, Dijkstra for weighted"
□ You can handle "no fresh oranges" and "start in deadend" edge cases without debugging
```

---

## Quick Reference Card

```
VARIANT              TEMPLATE                              TIME         SPACE
───────────────────────────────────────────────────────────────────────────────
Tree level-order     queue + size per level                 O(n)         O(w)
Grid BFS             queue + visited[][] + dirs[]           O(m·n)       O(m·n)
Multi-source BFS     enqueue ALL sources → standard BFS     O(m·n)       O(m·n)
Implicit graph       state=node, define neighbors, visited  O(V+E)       O(V)
State-space BFS      state=(pos,extra), visited per state   O(states)    O(states)

KEY RULES:
  1. BFS = shortest path when ALL edges cost 1
  2. Mark visited at ENQUEUE time (not dequeue)
  3. Capture level size BEFORE inner loop
  4. Multi-source: add ALL sources before starting BFS
  5. Check start == target before BFS

DECISION: uniform cost → BFS | weighted → DIJKSTRA | all paths → DFS/BACKTRACK
```

---

## Full Solutions — Key Problems

### TreeNode Definition (for tree problems)

```java
public class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
```

---

### Problem: [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) (LeetCode #102)

- **Pattern:** Tree level-order BFS
- **Intuition:** Process tree level by level. Use a queue; for each level, poll exactly `size` nodes and collect their values, then enqueue their children. The `queue.size()` trick separates levels.
- **Approach:** 1) BFS from root. 2) Each iteration: capture `size = queue.size()`, poll `size` nodes into a level list, add children to queue. 3) Append level to result.
- **Java Solution:**

```java
class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;

        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);

        while (!queue.isEmpty()) {
            int size = queue.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            result.add(level);
        }
        return result;
    }
}
```

- **Complexity:** Time O(n) — each node enqueued and processed once. Space O(w) — queue holds at most one full level (w = max width).

---

### Problem: [Number of Islands](https://leetcode.com/problems/number-of-islands/) (LeetCode #200)

- **Pattern:** Grid BFS — connected components
- **Intuition:** Count connected components of '1's. For each unvisited '1', BFS marks all connected '1's as visited. Each BFS call = one island.
- **Approach:** 1) Scan grid for '1'. 2) When found, BFS from that cell, mark all connected '1's as '0' (visited). 3) Increment island count. 4) Return count after full scan.
- **Java Solution:**

```java
class Solution {
    public int numIslands(char[][] grid) {
        int m = grid.length, n = grid[0].length;
        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
        int count = 0;

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == '1') {
                    count++;
                    grid[r][c] = '0';
                    Queue<int[]> queue = new LinkedList<>();
                    queue.offer(new int[]{r, c});

                    while (!queue.isEmpty()) {
                        int[] cur = queue.poll();
                        for (int[] d : dirs) {
                            int nr = cur[0] + d[0], nc = cur[1] + d[1];
                            if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == '1') {
                                grid[nr][nc] = '0';
                                queue.offer(new int[]{nr, nc});
                            }
                        }
                    }
                }
            }
        }
        return count;
    }
}
```

- **Complexity:** Time O(m·n) — each cell processed at most once. Space O(m·n) — queue in worst case (all land).

---

### Problem: [Rotting Oranges](https://leetcode.com/problems/rotting-oranges/) (LeetCode #994)

- **Pattern:** Multi-source BFS
- **Intuition:** All rotten oranges spread simultaneously. This is multi-source BFS: enqueue all rotten oranges at time 0, then each BFS level = 1 minute of spreading. Track fresh count; if any remain after BFS, return -1.
- **Approach:** 1) Scan grid: enqueue all rotten (2), count fresh (1). 2) If fresh == 0, return 0. 3) BFS: each level = 1 minute; rot adjacent fresh neighbors, decrement fresh count. 4) Return minutes if fresh == 0, else -1.
- **Java Solution:**

```java
class Solution {
    public int orangesRotting(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        Queue<int[]> queue = new LinkedList<>();
        int fresh = 0;

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == 2) queue.offer(new int[]{r, c});
                else if (grid[r][c] == 1) fresh++;
            }
        }

        if (fresh == 0) return 0;

        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
        int minutes = 0;

        while (!queue.isEmpty()) {
            int size = queue.size();
            boolean rotted = false;
            for (int i = 0; i < size; i++) {
                int[] cur = queue.poll();
                for (int[] d : dirs) {
                    int nr = cur[0] + d[0], nc = cur[1] + d[1];
                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 1) {
                        grid[nr][nc] = 2;
                        queue.offer(new int[]{nr, nc});
                        fresh--;
                        rotted = true;
                    }
                }
            }
            if (rotted) minutes++;
        }
        return fresh == 0 ? minutes : -1;
    }
}
```

- **Complexity:** Time O(m·n) — each cell enqueued at most once. Space O(m·n) — queue may hold many cells.

---

### Problem: [01 Matrix](https://leetcode.com/problems/01-matrix/) (LeetCode #542)

- **Pattern:** Multi-source BFS
- **Intuition:** Inverse thinking — instead of "for each 1, find nearest 0" (expensive), do "BFS outward from ALL 0s simultaneously." The first time BFS reaches a 1-cell is the shortest distance to its nearest 0.
- **Approach:** 1) Enqueue all cells with value 0, set their distance to 0. Mark all 1-cells as unvisited (distance = -1). 2) BFS: for each neighbor at distance -1, set distance = current + 1, enqueue. 3) Return distance matrix.
- **Java Solution:**

```java
class Solution {
    public int[][] updateMatrix(int[][] mat) {
        int m = mat.length, n = mat[0].length;
        int[][] dist = new int[m][n];
        Queue<int[]> queue = new LinkedList<>();

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (mat[r][c] == 0) {
                    queue.offer(new int[]{r, c});
                } else {
                    dist[r][c] = -1;
                }
            }
        }

        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};

        while (!queue.isEmpty()) {
            int[] cur = queue.poll();
            for (int[] d : dirs) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && dist[nr][nc] == -1) {
                    dist[nr][nc] = dist[cur[0]][cur[1]] + 1;
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
        return dist;
    }
}
```

- **Complexity:** Time O(m·n) — each cell enqueued at most once. Space O(m·n) — distance matrix and queue.

---

### Problem: [Shortest Path in Binary Matrix](https://leetcode.com/problems/shortest-path-in-binary-matrix/) (LeetCode #1091)

- **Pattern:** Grid BFS (8-directional)
- **Intuition:** Standard grid BFS from (0,0) to (n-1,n-1), but with 8 directions instead of 4. The path length counts cells visited, not edges — so start at length 1.
- **Approach:** 1) If grid[0][0] or grid[n-1][n-1] is 1, return -1. 2) BFS from (0,0) with 8-directional movement, only visiting 0-cells. 3) Track path length (number of cells). 4) Return length when reaching (n-1,n-1).
- **Java Solution:**

```java
class Solution {
    public int shortestPathBinaryMatrix(int[][] grid) {
        int n = grid.length;
        if (grid[0][0] == 1 || grid[n - 1][n - 1] == 1) return -1;

        int[][] dirs = {{-1,-1},{-1,0},{-1,1},{0,-1},{0,1},{1,-1},{1,0},{1,1}};
        Queue<int[]> queue = new LinkedList<>();
        queue.offer(new int[]{0, 0});
        grid[0][0] = 1; // mark visited
        int pathLen = 1;

        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                int[] cur = queue.poll();
                if (cur[0] == n - 1 && cur[1] == n - 1) return pathLen;

                for (int[] d : dirs) {
                    int nr = cur[0] + d[0], nc = cur[1] + d[1];
                    if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] == 0) {
                        grid[nr][nc] = 1;
                        queue.offer(new int[]{nr, nc});
                    }
                }
            }
            pathLen++;
        }
        return -1;
    }
}
```

- **Complexity:** Time O(n²) — each cell visited at most once. Space O(n²) — queue in worst case.

---

### Problem: [Word Ladder](https://leetcode.com/problems/word-ladder/) (LeetCode #127)

- **Pattern:** Implicit graph BFS
- **Intuition:** Words form an implicit graph — two words are neighbors if they differ by exactly one letter. BFS from beginWord finds the shortest transformation sequence. The answer is the number of words in the path (edges + 1).
- **Why try 26 chars instead of comparing all word pairs:** For each word of length M, trying 26 replacements at each of M positions = O(26·M) neighbors. Comparing against all N words = O(N·M). Since N can be 5000 and 26 is constant, the character-replacement approach is faster.
- **Approach:** 1) Put wordList in a HashSet for O(1) lookup. 2) If endWord not in set, return 0. 3) BFS from beginWord: for each position, try all 26 letters; if resulting word is in set and unvisited, enqueue. 4) Return step count when endWord found.
- **Java Solution:**

```java
class Solution {
    public int ladderLength(String beginWord, String endWord, List<String> wordList) {
        Set<String> words = new HashSet<>(wordList);
        if (!words.contains(endWord)) return 0;

        Queue<String> queue = new LinkedList<>();
        Set<String> visited = new HashSet<>();
        queue.offer(beginWord);
        visited.add(beginWord);
        int steps = 1;

        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                String cur = queue.poll();
                if (cur.equals(endWord)) return steps;

                char[] arr = cur.toCharArray();
                for (int j = 0; j < arr.length; j++) {
                    char orig = arr[j];
                    for (char c = 'a'; c <= 'z'; c++) {
                        if (c == orig) continue;
                        arr[j] = c;
                        String next = new String(arr);
                        if (words.contains(next) && visited.add(next)) {
                            queue.offer(next);
                        }
                    }
                    arr[j] = orig;
                }
            }
            steps++;
        }
        return 0;
    }
}
```

- **Complexity:** Time O(M² × N) — each of N words explored; for each, M positions × 26 chars + O(M) string creation. Space O(M × N) — visited set stores up to N words of length M.

---

### Problem: [Open the Lock](https://leetcode.com/problems/open-the-lock/) (LeetCode #752)

- **Pattern:** State-space BFS (implicit graph)
- **Intuition:** State = 4-digit string. From "0000", each move turns one wheel up or down (8 neighbors). Deadends are blocked states. BFS finds the minimum number of turns to reach target. The state space is at most 10⁴ = 10,000 — very manageable.
- **Approach:** 1) Put deadends in a set. 2) Handle edge cases: "0000" in deadends → -1; target == "0000" → 0. 3) BFS from "0000": for each of 4 digits, try +1 and -1 (wrap with mod 10). Skip deadends and visited. 4) Return steps when target found.
- **Java Solution:**

```java
class Solution {
    public int openLock(String[] deadends, String target) {
        Set<String> dead = new HashSet<>();
        for (String d : deadends) dead.add(d);

        if (dead.contains("0000")) return -1;
        if (target.equals("0000")) return 0;

        Queue<String> queue = new LinkedList<>();
        Set<String> visited = new HashSet<>();
        queue.offer("0000");
        visited.add("0000");
        int steps = 0;

        while (!queue.isEmpty()) {
            int size = queue.size();
            steps++;
            for (int i = 0; i < size; i++) {
                String cur = queue.poll();
                for (int j = 0; j < 4; j++) {
                    for (int delta : new int[]{1, -1}) {
                        char[] arr = cur.toCharArray();
                        arr[j] = (char) ('0' + (arr[j] - '0' + delta + 10) % 10);
                        String next = new String(arr);
                        if (next.equals(target)) return steps;
                        if (!dead.contains(next) && visited.add(next)) {
                            queue.offer(next);
                        }
                    }
                }
            }
        }
        return -1;
    }
}
```

- **Complexity:** Time O(10⁴ × 4) = O(1) — at most 10,000 states, each with 8 neighbors. Space O(10⁴) — visited set and queue.

---

### Problem: [All Nodes Distance K in Binary Tree](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/) (LeetCode #863)

- **Pattern:** Tree → undirected graph conversion + BFS
- **Intuition:** In a tree, you can only traverse downward via children. But "distance K" includes going UP through parents. Solution: build a parent map (child → parent) via DFS, then BFS from target node treating the tree as an undirected graph (children + parent are all neighbors).
- **Approach:** 1) DFS to build parent map for every node. 2) BFS from target node: neighbors = left, right, parent. Use visited set to avoid revisiting. 3) Stop at level K and collect all nodes at that level.
- **Java Solution:**

```java
class Solution {
    public List<Integer> distanceK(TreeNode root, TreeNode target, int k) {
        Map<TreeNode, TreeNode> parentMap = new HashMap<>();
        buildParentMap(root, null, parentMap);

        Queue<TreeNode> queue = new LinkedList<>();
        Set<TreeNode> visited = new HashSet<>();
        queue.offer(target);
        visited.add(target);
        int dist = 0;

        while (!queue.isEmpty()) {
            if (dist == k) {
                List<Integer> result = new ArrayList<>();
                for (TreeNode node : queue) result.add(node.val);
                return result;
            }
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                TreeNode[] neighbors = {node.left, node.right, parentMap.get(node)};
                for (TreeNode next : neighbors) {
                    if (next != null && visited.add(next)) {
                        queue.offer(next);
                    }
                }
            }
            dist++;
        }
        return new ArrayList<>();
    }

    private void buildParentMap(TreeNode node, TreeNode parent, Map<TreeNode, TreeNode> map) {
        if (node == null) return;
        map.put(node, parent);
        buildParentMap(node.left, node, map);
        buildParentMap(node.right, node, map);
    }
}
```

- **Complexity:** Time O(n) — DFS to build parent map + BFS visits each node at most once. Space O(n) — parent map + visited set + queue.

---

### Problem: [Shortest Distance from All Buildings](https://leetcode.com/problems/shortest-distance-from-all-buildings/) (LeetCode #317)

- **Pattern:** Repeated multi-source BFS (BFS from each building separately)
- **Intuition:** Run BFS from EACH building independently. For each empty cell, accumulate the total distance from all buildings and track how many buildings can reach it. The answer is the empty cell with the minimum total distance that is reachable from ALL buildings.
- **Approach:** 1) Find all buildings. 2) For each building, run BFS on empty land, accumulating distance and reach count per cell. 3) After all BFS runs, find the cell where reachCount == totalBuildings with minimum totalDistance.
- **Key Optimization:** After each BFS round, only visit cells that were reachable by all previous buildings. Use a decrementing marker to track this.
- **Java Solution:**

```java
class Solution {
    public int shortestDistance(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        int[][] totalDist = new int[m][n];
        int[][] reachCount = new int[m][n];
        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
        int totalBuildings = 0;

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == 1) {
                    totalBuildings++;
                    boolean[][] visited = new boolean[m][n];
                    Queue<int[]> queue = new LinkedList<>();
                    queue.offer(new int[]{r, c});
                    visited[r][c] = true;
                    int dist = 0;

                    while (!queue.isEmpty()) {
                        int size = queue.size();
                        dist++;
                        for (int i = 0; i < size; i++) {
                            int[] cur = queue.poll();
                            for (int[] d : dirs) {
                                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                                if (nr >= 0 && nr < m && nc >= 0 && nc < n
                                        && !visited[nr][nc] && grid[nr][nc] == 0) {
                                    visited[nr][nc] = true;
                                    totalDist[nr][nc] += dist;
                                    reachCount[nr][nc]++;
                                    queue.offer(new int[]{nr, nc});
                                }
                            }
                        }
                    }
                }
            }
        }

        int minDist = Integer.MAX_VALUE;
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == 0 && reachCount[r][c] == totalBuildings) {
                    minDist = Math.min(minDist, totalDist[r][c]);
                }
            }
        }
        return minDist == Integer.MAX_VALUE ? -1 : minDist;
    }
}
```

- **Complexity:** Time O(B × m × n) — BFS from each of B buildings over the grid. Space O(m × n) — distance/reach arrays and BFS queue.
