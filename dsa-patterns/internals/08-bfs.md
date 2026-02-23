# BFS (Breadth-First Search)

> Explore nodes level by level—guaranteeing shortest paths in unweighted graphs and structured traversal in trees.

## What Is This Pattern?

**Breadth-First Search (BFS)** explores a graph or tree by visiting all nodes at depth `d` before any node at depth `d+1`. It uses a **queue** (FIFO): you process the front of the queue, then enqueue its unvisited neighbors. Unlike DFS, which goes deep before broad, BFS guarantees that the first time you reach a node, you've taken a **shortest path**—making it ideal for "minimum steps" or "shortest path" in unweighted graphs.

**Visual intuition:** Imagine dropping a stone in a pond. Ripples spread outward in concentric circles. BFS is that first ripple (distance 1), then the second (distance 2), and so on. Every node touched by the k-th ripple is exactly k steps from the source. On a grid, BFS from (0,0) visits cells in increasing Manhattan-distance order; on a tree, it visits levels top-to-bottom; on a word graph (e.g., Word Ladder), it finds transformations in order of edit distance.

The pattern extends to **multi-source BFS** (start from multiple nodes—e.g., all rotten oranges or all 0s in a matrix) and **state-space BFS** (state = position + extra info like obstacles used). In all cases: queue + visited set + level tracking = shortest path in unweighted settings.

## When to Use This Pattern

- **Shortest path** in an unweighted graph or grid (minimum steps, minimum moves)
- **Level-order traversal** of a tree (process all nodes at depth d before d+1)
- **Flood fill** from a starting cell (BFS or DFS both work; BFS avoids stack overflow on huge inputs)
- **Multi-source propagation** (e.g., rot spreading from multiple cells, distances from nearest 0)
- **State-space search** when transitions are uniform cost (e.g., Open the Lock, Word Ladder)
- Problems with phrases like "minimum number of steps," "shortest path," "level order," "nearest," "spread"

## How to Identify This Pattern

```
Is the problem about shortest path / minimum steps in an unweighted setting?
    YES → BFS (or Dijkstra if weighted)
    NO ↓

Does it ask for level-by-level traversal (e.g., tree level order)?
    YES → BFS with level-size tracking
    NO ↓

Does it involve propagation from one or more sources (flood, rot, distance from 0)?
    YES → BFS (single- or multi-source)
    NO ↓

Is it a state transition problem (locks, word ladder, grid with extra constraints)?
    YES → BFS over state space (state = node + extra info)
```

## Core Template (Pseudocode)

### Level-Order Tree BFS

```
FUNCTION levelOrder(root):
    IF root == null: RETURN []
    result = []
    queue = [root]

    WHILE queue not empty:
        level = []
        levelSize = queue.size()
        FOR i = 0 TO levelSize - 1:
            node = queue.dequeue()
            level.add(node.val)
            IF node.left != null: queue.enqueue(node.left)
            IF node.right != null: queue.enqueue(node.right)
        result.add(level)

    RETURN result
```

### Graph BFS (Shortest Path)

```
FUNCTION bfsShortestPath(start, target, graph):
    IF start == target: RETURN 0

    visited = {start}
    queue = [start]
    steps = 0

    WHILE queue not empty:
        size = queue.size()
        steps++
        FOR i = 0 TO size - 1:
            node = queue.dequeue()
            FOR each neighbor IN getNeighbors(node):
                IF neighbor == target: RETURN steps
                IF neighbor NOT IN visited:
                    visited.add(neighbor)
                    queue.enqueue(neighbor)

    RETURN -1  // unreachable
```

### Multi-Source BFS

```
FUNCTION multiSourceBFS(sources, grid):
    queue = new queue
    visited = set
    FOR each (r, c) IN sources:
        queue.enqueue((r, c, 0))  // 0 = distance from source
        visited.add((r, c))

    WHILE queue not empty:
        (r, c, dist) = queue.dequeue()
        process(r, c, dist)
        FOR each (nr, nc) IN neighbors(r, c):
            IF (nr, nc) NOT IN visited AND valid(nr, nc):
                visited.add((nr, nc))
                queue.enqueue((nr, nc, dist + 1))
```

## Core Template (Java)

### Level-Order Tree BFS

```java
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
```

### Graph BFS (Shortest Path)

```java
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
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.offer(neighbor);
                }
            }
        }
    }
    return -1;
}
```

### Multi-Source BFS

```java
public void multiSourceBFS(int[][] grid, Queue<int[]> queue, boolean[][] visited) {
    int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
    int m = grid.length, n = grid[0].length;

    while (!queue.isEmpty()) {
        int[] cur = queue.poll();
        int r = cur[0], c = cur[1], dist = cur[2];

        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && !visited[nr][nc]) {
                visited[nr][nc] = true;
                queue.offer(new int[]{nr, nc, dist + 1});
            }
        }
    }
}
```

## Complexity Cheat Sheet

| Variant                  | Time                    | Space                 | Notes                               |
|--------------------------|-------------------------|------------------------|-------------------------------------|
| Tree level order         | O(n)                    | O(w)                   | w = max level width                 |
| Graph BFS (V vertices)   | O(V + E)                | O(V)                   | Each vertex/edge processed once     |
| Grid BFS (m×n)           | O(mn)                   | O(mn)                  | Visited set + queue                  |
| Multi-source BFS         | O(mn)                   | O(mn)                  | Same as single-source on grid       |
| State-space BFS          | O(states × transitions) | O(states)              | State = (pos, extra) e.g. (r,c,k)   |
| Word Ladder              | O(M² × N)               | O(M × N)               | M = word length, N = list size      |

## Problems with Full Solutions

### TreeNode Definition (for tree problems)

```java
// LeetCode standard TreeNode - include when solving tree problems
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

### Easy (2 problems)

#### Problem: [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) (LeetCode #102)

- **Intuition:** Process the tree level by level. Use a queue; for each level, poll exactly `size` nodes and collect their values, enqueue their children.
- **Brute Force:** DFS with depth parameter, collect all nodes, then group by depth. Time O(n), Space O(n).
- **Approach:** 1) BFS from root. 2) For each iteration, record `size = queue.size()`, poll `size` nodes into a level list, add children to queue. 3) Append level to result.
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

- **Complexity:** Time O(n), Space O(w) where w = max level width

---

#### Problem: [Flood Fill](https://leetcode.com/problems/flood-fill/) (LeetCode #733)

- **Intuition:** From (sr, sc), replace all connected pixels of the same color with newColor. BFS (or DFS) from start, only expand to cells matching the original color.
- **Brute Force:** BFS or DFS from start cell, exploring all 4-directional neighbors with same color and repainting them. Time O(mn), Space O(mn).
- **Approach:** 1) If `image[sr][sc] == newColor`, return image unchanged (avoids infinite loop). 2) BFS from (sr, sc), enqueue neighbors with same original color. 3) Paint each dequeued cell with newColor.
- **Java Solution:**

```java
class Solution {
    public int[][] floodFill(int[][] image, int sr, int sc, int newColor) {
        int originalColor = image[sr][sc];
        if (originalColor == newColor) return image;

        int m = image.length, n = image[0].length;
        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
        Queue<int[]> queue = new LinkedList<>();
        queue.offer(new int[]{sr, sc});
        image[sr][sc] = newColor;

        while (!queue.isEmpty()) {
            int[] cur = queue.poll();
            for (int[] d : dirs) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && image[nr][nc] == originalColor) {
                    image[nr][nc] = newColor;
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
        return image;
    }
}
```

- **Complexity:** Time O(mn), Space O(mn)

---

### Medium (5 problems)

#### Problem: [Rotting Oranges](https://leetcode.com/problems/rotting-oranges/) (LeetCode #994)

- **Intuition:** Multi-source BFS from all rotten oranges (value 2). Each minute, rot adjacent fresh oranges (1). Track minutes per level; count fresh at start—if any remain after BFS, return -1.
- **Brute Force:** Simulate minute by minute: each minute scan the grid for fresh oranges adjacent to rotten, mark them rotten. Repeat until no change. Time O(mn × minutes) = O(m²n²) worst case, Space O(mn).
- **Approach:** 1) Scan grid for rotten (2) and count fresh (1). 2) Enqueue all rotten cells. 3) BFS: each "level" = 1 minute; when visiting a fresh neighbor, rot it and decrement fresh count. 4) Return minutes if fresh == 0, else -1.
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

- **Complexity:** Time O(mn), Space O(mn)

---

#### Problem: [01 Matrix](https://leetcode.com/problems/01-matrix/) (LeetCode #542)

- **Intuition:** Multi-source BFS from all 0s. Distance from each 0 to every cell is computed level by level; first time we reach a cell is shortest distance to nearest 0.
- **Brute Force:** For each cell with 1, run BFS to find nearest 0. Time O(mn × mn) = O(m²n²), Space O(mn).
- **Approach:** 1) Enqueue all (r,c) where mat[r][c]==0; set result[r][c]=0. 2) Mark 0s as visited (or use result != -1). 3) BFS: neighbors get result = cur + 1. 4) Return result matrix.
- **Java Solution:**

```java
class Solution {
    public int[][] updateMatrix(int[][] mat) {
        int m = mat.length, n = mat[0].length;
        int[][] result = new int[m][n];
        Queue<int[]> queue = new LinkedList<>();

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (mat[r][c] == 0) {
                    queue.offer(new int[]{r, c});
                    result[r][c] = 0;
                } else {
                    result[r][c] = -1;
                }
            }
        }

        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};

        while (!queue.isEmpty()) {
            int[] cur = queue.poll();
            int r = cur[0], c = cur[1];
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && result[nr][nc] == -1) {
                    result[nr][nc] = result[r][c] + 1;
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
        return result;
    }
}
```

- **Complexity:** Time O(mn), Space O(mn)

---

#### Problem: [Number of Islands](https://leetcode.com/problems/number-of-islands/) (LeetCode #200)

- **Intuition:** Count connected components of '1's. For each unvisited '1', run BFS (or DFS) to mark all connected '1's, then increment count.
- **Brute Force:** Scan grid for each '1'; when found, run BFS to mark entire connected component as visited. Time O(mn), Space O(mn).
- **Approach:** 1) Scan grid for '1'. 2) When found, BFS from that cell, mark all connected '1's as visited (e.g., flip to '0'). 3) Increment island count. 4) Return count.
- **Java Solution:**

```java
class Solution {
    public int numIslands(char[][] grid) {
        int m = grid.length, n = grid[0].length;
        int count = 0;
        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == '1') {
                    count++;
                    Queue<int[]> queue = new LinkedList<>();
                    queue.offer(new int[]{r, c});
                    grid[r][c] = '0';

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

- **Complexity:** Time O(mn), Space O(mn)

---

#### Problem: [Open the Lock](https://leetcode.com/problems/open-the-lock/) (LeetCode #752)

- **Intuition:** State = 4-digit string. From "0000", BFS: each move is turn one wheel up or down. Deadends are blocked. First time we reach target = minimum moves.
- **Brute Force:** BFS from "0000" exploring all 8 possible moves (each digit ±1), skipping deadends and visited states. Time O(10000) = O(1), Space O(10000).
- **Approach:** 1) Put deadends in a set. 2) If "0000" in deadends or is target, handle. 3) BFS from "0000": for each digit, try +1 and -1 (wrap 0-9). 4) Skip deadends and visited. 5) Return steps when target found.
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
                        String next = turn(cur, j, delta);
                        if (next.equals(target)) return steps;
                        if (!dead.contains(next) && !visited.contains(next)) {
                            visited.add(next);
                            queue.offer(next);
                        }
                    }
                }
            }
        }
        return -1;
    }

    private String turn(String s, int i, int delta) {
        char[] arr = s.toCharArray();
        int d = arr[i] - '0';
        d = (d + delta + 10) % 10;
        arr[i] = (char) ('0' + d);
        return new String(arr);
    }
}
```

- **Complexity:** Time O(10000) = O(1) states, Space O(10000)

---

#### Problem: [Minimum Knight Moves](https://leetcode.com/problems/minimum-knight-moves/) (LeetCode #1197)

- **Intuition:** BFS from (0,0) to (x,y) on infinite board. Knight has 8 L-shaped moves. Use BFS; first reach of (x,y) = minimum moves. Symmetry: only need first quadrant (|x|, |y|) since board is symmetric.
- **Brute Force:** BFS from (0,0) exploring all 8 knight moves until reaching (x,y). Time O((|x|+|y|)²) in practice, Space O((|x|+|y|)²).
- **Approach:** 1) BFS from (0,0). 2) 8 moves: (±2,±1), (±1,±2). 3) Use visited set. 4) Can optimize by only exploring positive quadrant and using symmetry for target.
- **Java Solution:**

```java
class Solution {
    private static final int[][] MOVES = {
        {-2, -1}, {-2, 1}, {-1, -2}, {-1, 2},
        {1, -2}, {1, 2}, {2, -1}, {2, 1}
    };

    public int minKnightMoves(int x, int y) {
        x = Math.abs(x);
        y = Math.abs(y);

        Queue<int[]> queue = new LinkedList<>();
        Set<String> visited = new HashSet<>();
        queue.offer(new int[]{0, 0});
        visited.add("0,0");
        int steps = 0;

        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                int[] cur = queue.poll();
                if (cur[0] == x && cur[1] == y) return steps;

                for (int[] m : MOVES) {
                    int nr = cur[0] + m[0], nc = cur[1] + m[1];
                    String key = nr + "," + nc;
                    if (!visited.contains(key) && nr >= -2 && nc >= -2) {
                        visited.add(key);
                        queue.offer(new int[]{nr, nc});
                    }
                }
            }
            steps++;
        }
        return -1;
    }
}
```

- **Complexity:** Time O(|x|×|y|) in practice, Space O(|x|×|y|). Constraint |x|+|y| ≤ 300 keeps it manageable.

---

### Hard (3 problems)

#### Problem: [Word Ladder](https://leetcode.com/problems/word-ladder/) (LeetCode #127)

- **Intuition:** Words form implicit graph: two words are adjacent if they differ by one letter. BFS from beginWord; first reach of endWord = shortest transformation length (word count).
- **Brute Force:** BFS from beginWord; at each step try changing each position to 'a'-'z' and enqueue if in wordList. Time O(M² × N), Space O(M × N).
- **Approach:** 1) Put wordList in a set for O(1) lookup. 2) BFS from beginWord: for each position, try 'a'-'z'. 3) If new word in set and not visited, enqueue. 4) Return level + 1 when endWord found (levels = intermediate steps, +1 for begin).
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
                        if (words.contains(next) && !visited.contains(next)) {
                            visited.add(next);
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

- **Complexity:** Time O(M² × N) where M = word length, N = list size; Space O(M × N)

---

#### Problem: [Shortest Path in a Grid with Obstacles Elimination](https://leetcode.com/problems/shortest-path-in-a-grid-with-obstacles-elimination/) (LeetCode #1293)

- **Intuition:** State = (r, c, obstacles_used). BFS over state space. When stepping on an obstacle (1), increment obstacles_used; only allow if ≤ k. Track visited per (r, c, k) or track min obstacles to reach (r, c).
- **Brute Force:** BFS from (0,0) with state (r, c, obstacles_used); explore all 4 neighbors, only allow stepping on obstacle if obstacles_used < k. Time O(m × n × k), Space O(m × n).
- **Approach:** 1) State = (r, c, obstacles_eliminated). 2) visited[r][c] = min obstacles used to reach (r,c). Re-visit (r,c) only if we reach it with fewer obstacles. 3) BFS; return steps when (m-1,n-1) reached.
- **Java Solution:**

```java
class Solution {
    public int shortestPath(int[][] grid, int k) {
        int m = grid.length, n = grid[0].length;
        if (k >= m + n - 2) return m + n - 2;

        int[][] minObstacles = new int[m][n];
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                minObstacles[i][j] = Integer.MAX_VALUE;
            }
        }
        minObstacles[0][0] = 0;

        Queue<int[]> queue = new LinkedList<>();
        queue.offer(new int[]{0, 0, 0}); // r, c, obstacles_used
        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
        int steps = 0;

        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                int[] cur = queue.poll();
                int r = cur[0], c = cur[1], obs = cur[2];
                if (r == m - 1 && c == n - 1) return steps;

                for (int[] d : dirs) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;

                    int nextObs = obs + grid[nr][nc];
                    if (nextObs <= k && nextObs < minObstacles[nr][nc]) {
                        minObstacles[nr][nc] = nextObs;
                        queue.offer(new int[]{nr, nc, nextObs});
                    }
                }
            }
            steps++;
        }
        return -1;
    }
}
```

- **Complexity:** Time O(m × n × k), Space O(m × n)

---

#### Problem: [Bus Routes](https://leetcode.com/problems/bus-routes/) (LeetCode #815)

- **Intuition:** Graph of bus stops: two stops are "adjacent" if they share a route. BFS from stops reachable by routes containing `source`; target: reach a stop that has `target`. Minimum number of buses = minimum route changes.
- **Brute Force:** BFS over routes: start with routes containing source, at each step try all routes that share a stop with current route. Time O(R × S), Space O(R + S).
- **Approach:** 1) Build: stop -> list of route indices. 2) BFS over *routes*: start with routes containing source. State = (routeId, busCount). For each stop in route, for each other route through that stop, if not visited, enqueue. 3) When a route contains target, return busCount. 4) Need to track visited routes.
- **Java Solution:**

```java
class Solution {
    public int numBusesToDestination(int[][] routes, int source, int target) {
        if (source == target) return 0;

        Map<Integer, List<Integer>> stopToRoutes = new HashMap<>();
        for (int i = 0; i < routes.length; i++) {
            for (int stop : routes[i]) {
                stopToRoutes.computeIfAbsent(stop, k -> new ArrayList<>()).add(i);
            }
        }

        if (!stopToRoutes.containsKey(source) || !stopToRoutes.containsKey(target)) {
            return -1;
        }

        Queue<Integer> queue = new LinkedList<>();
        boolean[] visitedRoutes = new boolean[routes.length];
        for (int routeId : stopToRoutes.get(source)) {
            queue.offer(routeId);
            visitedRoutes[routeId] = true;
        }
        int buses = 1;

        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                int routeId = queue.poll();
                for (int stop : routes[routeId]) {
                    if (stop == target) return buses;
                    for (int nextRoute : stopToRoutes.get(stop)) {
                        if (!visitedRoutes[nextRoute]) {
                            visitedRoutes[nextRoute] = true;
                            queue.offer(nextRoute);
                        }
                    }
                }
            }
            buses++;
        }
        return -1;
    }
}
```

- **Complexity:** Time O(R × S) where R = routes, S = total stops; Space O(R + S)

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting to check `newColor == originalColor` in Flood Fill | Return early to avoid infinite loop when start color equals new color |
| Not tracking level size in level-order BFS | Use `for (i < queue.size())` *before* polling—capture size at loop start |
| Re-visiting nodes in graph BFS | Use a `visited` set; add to visited when enqueueing |
| Wrong step count (off-by-one) | Decide: is "steps" the number of edges or nodes? For Word Ladder, return #words (= steps + 1) |
| State-space BFS: re-expanding with worse state | In #1293, only enqueue (r,c) if we reach it with *fewer* obstacles than before |
| Open the Lock: blocking "0000" | If "0000" is in deadends, return -1 immediately; handle target="0000" → 0 |
| Knight moves: unbounded exploration | Limit search space (e.g., nr >= -2, nc >= -2) to avoid TLE; use symmetry |
| Bus Routes: BFS over stops vs routes | BFS over *routes* (buses); when you take a new route, that's +1 bus |
| Number of Islands: modifying grid | Mark visited by flipping '1' to '0' (or use separate visited array) |

**Edge Cases:**
- Empty grid, single cell, all same color (Flood Fill)
- No rotten oranges but fresh exist → -1 (Rotting Oranges)
- Target unreachable (Word Ladder, Open the Lock, Knight)
- source == target (Bus Routes → 0)
- k >= m+n-2 (#1293) → direct Manhattan path
- Empty word list, endWord not in list (Word Ladder)

## Pattern Variations

| Variation | Example | Key Technique |
|-----------|---------|---------------|
| **Level-order tree** | #102 Binary Tree Level Order | Track level size; process all nodes at level before next |
| **Single-source grid** | #733 Flood Fill, #200 Islands | BFS/DFS from one cell; mark connected |
| **Multi-source BFS** | #994 Rotting Oranges, #542 01 Matrix | Enqueue all sources; level = propagation step |
| **Implicit graph** | #752 Open the Lock, #127 Word Ladder | State = node; neighbors = valid transitions |
| **State-space BFS** | #1293 Obstacles Elimination | State = (position, extra); visited per state |
| **Route/bus graph** | #815 Bus Routes | BFS over routes (not stops); route = bus |
| **Infinite grid** | #1197 Knight Moves | BFS with bounded/symmetric search space |
