# Topological Sort

> Order nodes in a directed graph so every edge points forward. Valid only for DAGs (no cycles). Use Kahn's BFS or DFS post-order—essential for dependency ordering, course scheduling, and task sequencing.

## What Is This Pattern?

**Topological sort** produces a linear ordering of vertices in a directed acyclic graph (DAG) such that for every edge (u→v), u comes before v. The graph must have no cycles—a cycle means no valid ordering exists. Two standard approaches: **Kahn's algorithm** (BFS, in-degree based) and **DFS post-order** (finish times).

Kahn's algorithm: repeatedly remove nodes with in-degree 0, add them to the order, and decrement in-degrees of neighbors. When the queue is empty, if we've processed all nodes, we have a valid order; otherwise there's a cycle. DFS: visit nodes, and when backtracking add to a stack; the reverse of the stack is a topological order.

Use topological sort when you have **dependencies** (prerequisites, build order, event ordering) and need to determine a valid sequence or detect impossible constraints (cycles). The pattern extends to **multi-level** sorting (e.g., groups then items within groups) and **longest path** in a DAG (dynamic programming on topologically sorted nodes).

## When to Use This Pattern

- Problem involves **dependencies**, **prerequisites**, or **ordering constraints**.
- You need a **valid sequence** respecting "A before B" rules.
- Need to **detect cycles** in a directed graph.
- Problem asks for **course schedule**, **build order**, **event ordering**, or **alien dictionary**.
- You're computing **longest path** in a DAG (topo sort + DP).
- Phrases like "before/after", "prerequisite", "dependency", "order of execution".

## How to Identify This Pattern

```
Do we have directed edges representing "must come before"?
    NO → Consider BFS/DFS on undirected graph
    YES ↓

Do we need a linear order respecting all edges?
    NO → Maybe simple reachability
    YES ↓

Is the graph acyclic (or do we need to detect cycles)?
    YES → TOPOLOGICAL SORT

Are dependencies hierarchical (e.g., courses, recipes)?
    YES → KAHN'S ALGORITHM or DFS POST-ORDER
```

## Core Template (Pseudocode)

### Kahn's Algorithm (BFS)

```
FUNCTION topoSort(graph, n):
    inDegree[0..n-1] = 0
    FOR each edge (u, v) in graph:
        inDegree[v]++

    queue = [all nodes with inDegree 0]
    order = []

    WHILE queue not empty:
        u = queue.dequeue()
        order.append(u)
        FOR each neighbor v of u:
            inDegree[v]--
            IF inDegree[v] == 0:
                queue.enqueue(v)

    IF len(order) != n:
        RETURN "CYCLE DETECTED"
    RETURN order
```

### DFS Post-Order

```
FUNCTION topoSortDFS(graph, n):
    visited = [false] * n
    stack = []

    FUNCTION dfs(u):
        visited[u] = true
        FOR each neighbor v of u:
            IF not visited[v]:
                dfs(v)
        stack.push(u)

    FOR i FROM 0 TO n-1:
        IF not visited[i]:
            dfs(i)

    RETURN reverse(stack)
```

## Core Template (Java)

### Kahn's Algorithm

```java
public java.util.List<Integer> topoSort(java.util.List<java.util.List<Integer>> graph, int n) {
    int[] inDegree = new int[n];
    for (int u = 0; u < n; u++)
        for (int v : graph.get(u)) inDegree[v]++;

    var q = new java.util.ArrayDeque<Integer>();
    for (int i = 0; i < n; i++)
        if (inDegree[i] == 0) q.offer(i);

    var order = new java.util.ArrayList<Integer>();
    while (!q.isEmpty()) {
        int u = q.poll();
        order.add(u);
        for (int v : graph.get(u)) {
            if (--inDegree[v] == 0) q.offer(v);
        }
    }
    return order.size() == n ? order : java.util.Collections.emptyList(); // empty = cycle
}
```

### DFS Post-Order (Cycle Detection with Colors)

```java
public java.util.List<Integer> topoSortDFS(java.util.List<java.util.List<Integer>> graph, int n) {
    int[] color = new int[n]; // 0=white, 1=gray, 2=black
    var order = new java.util.ArrayList<Integer>();

    for (int i = 0; i < n; i++)
        if (color[i] == 0 && !dfs(graph, i, color, order)) return List.of(); // cycle

    java.util.Collections.reverse(order);
    return order;
}

private boolean dfs(java.util.List<java.util.List<Integer>> graph, int u, int[] color, java.util.List<Integer> order) {
    color[u] = 1; // gray
    for (int v : graph.get(u)) {
        if (color[v] == 1) return false; // back edge = cycle
        if (color[v] == 0 && !dfs(graph, v, color, order)) return false;
    }
    color[u] = 2; // black
    order.add(u);
    return true;
}
```

## Complexity Cheat Sheet

| Algorithm         | Time       | Space  | Notes                               |
|-------------------|------------|--------|-------------------------------------|
| Kahn's (BFS)      | O(V + E)   | O(V)   | In-degree calculation, queue         |
| DFS post-order    | O(V + E)   | O(V)   | Recursion stack, reverse result      |
| Cycle detection   | O(V + E)   | O(V)   | Three colors or Kahn's order length  |
| Longest path DAG  | O(V + E)   | O(V)   | Topo sort + DP                        |

## Problems (Progressive Difficulty)

### Easy (2 problems)

#### Problem: [Course Schedule](https://leetcode.com/problems/course-schedule/) (LeetCode #207)

- **Intuition:** numCourses and prerequisites [a,b] meaning b must be taken before a. Can you finish all? Equivalent to: is the graph a DAG?
- **Brute Force:** Try all permutations of courses and check if each satisfies prerequisites—exponentially many orderings. Time O(n! · E), Space O(n).
- **Approach:** 1) Build adjacency list: pre[i] -> courses that depend on i. 2) Kahn's: compute in-degrees, BFS from in-degree-0 nodes. 3) If we process all nodes, no cycle.
- **Java Solution:**

```java
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        var graph = new java.util.ArrayList<java.util.List<Integer>>();
        for (int i = 0; i < numCourses; i++) graph.add(new java.util.ArrayList<>());
        int[] inDegree = new int[numCourses];
        for (int[] p : prerequisites) {
            graph.get(p[1]).add(p[0]);
            inDegree[p[0]]++;
        }
        var q = new java.util.ArrayDeque<Integer>();
        for (int i = 0; i < numCourses; i++)
            if (inDegree[i] == 0) q.offer(i);
        int count = 0;
        while (!q.isEmpty()) {
            int u = q.poll();
            count++;
            for (int v : graph.get(u))
                if (--inDegree[v] == 0) q.offer(v);
        }
        return count == numCourses;
    }
}
```

- **Complexity:** Time O(V + E), Space O(V + E)

---

#### Problem: [Find All Possible Recipes from Given Supplies](https://leetcode.com/problems/find-all-possible-recipes-from-given-supplies/) (LeetCode #2115)

- **Intuition:** Recipes have ingredients; some ingredients may be other recipes. Start with supplies. Which recipes can be made? Graph: ingredient -> recipe. In-degree of recipe = count of non-supply ingredients. Start with recipes having in-degree 0; when made, a recipe becomes available (reduces in-degree of recipes that need it).
- **Brute Force:** Repeatedly scan all recipes in a loop and try making any whose ingredients are satisfied; stop when no progress—may loop many times. Time O(R² · I), Space O(R + I).
- **Approach:** 1) Build graph: for each recipe's ingredient not in supplies, add edge ingredient->recipe, inDegree[recipe]++. 2) Queue = recipes with inDegree 0. 3) BFS: when we make a recipe, add to result; for recipes needing it, decrement inDegree; if 0, add to queue.
- **Java Solution:**

```java
class Solution {
    public java.util.List<String> findAllRecipes(String[] recipes, java.util.List<java.util.List<String>> ingredients, String[] supplies) {
        var suppliesSet = new java.util.HashSet<>(java.util.Arrays.asList(supplies));
        var graph = new java.util.HashMap<String, java.util.List<String>>();
        var inDegree = new java.util.HashMap<String, Integer>();

        for (int i = 0; i < recipes.length; i++) {
            for (String ing : ingredients.get(i)) {
                if (!suppliesSet.contains(ing)) {
                    graph.computeIfAbsent(ing, k -> new java.util.ArrayList<>()).add(recipes[i]);
                    inDegree.merge(recipes[i], 1, Integer::sum);
                }
            }
        }

        var q = new java.util.ArrayDeque<String>();
        for (String r : recipes)
            if (inDegree.getOrDefault(r, 0) == 0) q.offer(r);

        var result = new java.util.ArrayList<String>();
        while (!q.isEmpty()) {
            String u = q.poll();
            result.add(u);
            if (graph.containsKey(u)) {
                for (String v : graph.get(u)) {
                    inDegree.merge(v, -1, Integer::sum);
                    if (inDegree.get(v) == 0) q.offer(v);
                }
            }
        }
        return result;
    }
}
```

- **Complexity:** Time O(R + total ingredients), Space O(R + ingredients)

---

### Medium (4 problems)

#### Problem: [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/) (LeetCode #210)

- **Intuition:** Same as #207 but return one valid ordering (or empty if impossible).
- **Brute Force:** Try all orderings and validate prerequisites; exponential. Time O(n! · E), Space O(n).
- **Approach:** Kahn's algorithm; append to result instead of just counting.
- **Java Solution:**

```java
class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        var graph = new java.util.ArrayList<java.util.List<Integer>>();
        for (int i = 0; i < numCourses; i++) graph.add(new java.util.ArrayList<>());
        int[] inDegree = new int[numCourses];
        for (int[] p : prerequisites) {
            graph.get(p[1]).add(p[0]);
            inDegree[p[0]]++;
        }
        var q = new java.util.ArrayDeque<Integer>();
        for (int i = 0; i < numCourses; i++)
            if (inDegree[i] == 0) q.offer(i);
        var order = new int[numCourses];
        int idx = 0;
        while (!q.isEmpty()) {
            int u = q.poll();
            order[idx++] = u;
            for (int v : graph.get(u))
                if (--inDegree[v] == 0) q.offer(v);
        }
        return idx == numCourses ? order : new int[0];
    }
}
```

- **Complexity:** Time O(V + E), Space O(V + E)

---

#### Problem: [Alien Dictionary](https://leetcode.com/problems/alien-dictionary/) (LeetCode #269)

- **Intuition:** Words are lexicographically sorted in an alien language. Compare adjacent words; first differing char gives an edge (before -> after). Invalid: longer word that's a prefix of a shorter one. Topo sort the character graph.
- **Brute Force:** Try all permutations of unique characters and check if any order satisfies all pairwise constraints from words. Time O(C! · N), Space O(C).
- **Approach:** 1) Collect all chars, init inDegree. 2) Compare adjacent words, add edge at first diff. 3) Check prefix case (word1.length > word2.length and word1.startsWith(word2)) -> return "". 4) Kahn's on chars.
- **Java Solution:**

```java
class Solution {
    public String alienOrder(String[] words) {
        var graph = new java.util.HashMap<Character, java.util.List<Character>>();
        int[] inDegree = new int[26];
        java.util.Arrays.fill(inDegree, -1);
        for (String w : words)
            for (char c : w.toCharArray())
                if (inDegree[c - 'a'] < 0) {
                    inDegree[c - 'a'] = 0;
                    graph.put(c, new java.util.ArrayList<>());
                }

        for (int i = 1; i < words.length; i++) {
            String a = words[i - 1], b = words[i];
            if (a.length() > b.length() && a.startsWith(b)) return "";
            int len = Math.min(a.length(), b.length());
            for (int j = 0; j < len; j++) {
                if (a.charAt(j) != b.charAt(j)) {
                    graph.get(a.charAt(j)).add(b.charAt(j));
                    inDegree[b.charAt(j) - 'a']++;
                    break;
                }
            }
        }

        var q = new java.util.ArrayDeque<Character>();
        for (char c : graph.keySet())
            if (inDegree[c - 'a'] == 0) q.offer(c);

        var sb = new StringBuilder();
        while (!q.isEmpty()) {
            char c = q.poll();
            sb.append(c);
            for (char next : graph.get(c)) {
                if (--inDegree[next - 'a'] == 0) q.offer(next);
            }
        }
        return sb.length() == graph.size() ? sb.toString() : "";
    }
}
```

- **Complexity:** Time O(N + C) where N = total chars, C ≤ 26; Space O(1)

---

#### Problem: [Minimum Height Trees](https://leetcode.com/problems/minimum-height-trees/) (LeetCode #310)

- **Intuition:** Tree with n nodes. Find all roots that minimize tree height. Optimal roots are the center(s)—at most 2. Repeatedly remove leaves until 1 or 2 nodes remain.
- **Brute Force:** BFS from each node as root to compute height; pick roots with min height. Time O(n²), Space O(n).
- **Approach:** 1) Build adjacency list, track degrees. 2) Add all leaves (degree 1) to queue. 3) Process layer by layer: remove leaves, update degrees of neighbors, add new leaves. 4) Last 1-2 nodes are the centers.
- **Java Solution:**

```java
class Solution {
    public java.util.List<Integer> findMinHeightTrees(int n, int[][] edges) {
        if (n == 1) return java.util.List.of(0);
        var adj = new java.util.ArrayList<java.util.List<Integer>>();
        for (int i = 0; i < n; i++) adj.add(new java.util.ArrayList<>());
        int[] degree = new int[n];
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
            degree[e[0]]++;
            degree[e[1]]++;
        }
        var q = new java.util.ArrayDeque<Integer>();
        for (int i = 0; i < n; i++)
            if (degree[i] == 1) q.offer(i);

        int remaining = n;
        while (remaining > 2) {
            int layerSize = q.size();
            remaining -= layerSize;
            for (int i = 0; i < layerSize; i++) {
                int u = q.poll();
                for (int v : adj.get(u)) {
                    degree[v]--;
                    if (degree[v] == 1) q.offer(v);
                }
            }
        }
        var result = new java.util.ArrayList<Integer>();
        while (!q.isEmpty()) result.add(q.poll());
        return result;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

#### Problem: [Parallel Courses](https://leetcode.com/problems/parallel-courses/) (LeetCode #1136)

- **Intuition:** N courses, relations [a,b] meaning a before b. Take multiple courses per semester if prerequisites met. Minimum semesters? Kahn's with level-by-level BFS—each level = one semester.
- **Brute Force:** BFS from each course as "first semester" and simulate; exponential combinations. Time O(n! · E), Space O(n).
- **Approach:** 1) Build graph and in-degrees. 2) BFS in levels: each iteration processes all current in-degree-0 nodes, then adds newly ready nodes. 3) Count levels.
- **Java Solution:**

```java
class Solution {
    public int minimumSemesters(int n, int[][] relations) {
        var graph = new java.util.ArrayList<java.util.List<Integer>>();
        for (int i = 0; i <= n; i++) graph.add(new java.util.ArrayList<>());
        int[] inDegree = new int[n + 1];
        for (int[] r : relations) {
            graph.get(r[0]).add(r[1]);
            inDegree[r[1]]++;
        }
        var q = new java.util.ArrayDeque<Integer>();
        for (int i = 1; i <= n; i++)
            if (inDegree[i] == 0) q.offer(i);

        int semesters = 0;
        int count = 0;
        while (!q.isEmpty()) {
            int layer = q.size();
            semesters++;
            for (int i = 0; i < layer; i++) {
                int u = q.poll();
                count++;
                for (int v : graph.get(u)) {
                    if (--inDegree[v] == 0) q.offer(v);
                }
            }
        }
        return count == n ? semesters : -1;
    }
}
```

- **Complexity:** Time O(n + E), Space O(n + E)

---

### Hard (2 problems)

#### Problem: [Longest Increasing Path in a Matrix](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/) (LeetCode #329)

- **Intuition:** From each cell, move to adjacent cell with strictly greater value. Longest path? DAG: edge from smaller to larger cell. Longest path in DAG = process in topo order (smallest first), DP[i][j] = 1 + max of smaller neighbors.
- **Brute Force:** DFS from every cell without memoization; each path explores all branches. Time O(mn · 4^(mn)), Space O(mn).
- **Approach:** DFS with memoization: from (i,j), try all 4 dirs; if neighbor is larger, 1 + dfs(neighbor). Cache result. Return max over all cells.
- **Java Solution:**

```java
class Solution {
    private static final int[][] DIRS = {{0,1},{1,0},{0,-1},{-1,0}};

    public int longestIncreasingPath(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        int[][] memo = new int[m][n];
        int max = 0;
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                max = Math.max(max, dfs(matrix, i, j, memo));
        return max;
    }

    private int dfs(int[][] matrix, int r, int c, int[][] memo) {
        if (memo[r][c] > 0) return memo[r][c];
        int len = 1;
        for (int[] d : DIRS) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < matrix.length && nc >= 0 && nc < matrix[0].length && matrix[nr][nc] > matrix[r][c])
                len = Math.max(len, 1 + dfs(matrix, nr, nc, memo));
        }
        memo[r][c] = len;
        return len;
    }
}
```

- **Complexity:** Time O(m·n), Space O(m·n)

---

#### Problem: [Sort Items by Groups Respecting Dependencies](https://leetcode.com/problems/sort-items-by-groups-respecting-dependencies/) (LeetCode #1203)

- **Intuition:** n items, each in a group (or -1). beforeItems[i] = items that must come before i. Order items so same-group items are consecutive and dependencies respected. Use a single graph with "group boundary" nodes: each group g has groupStart (n+2g) and groupEnd (n+2g+1). Items in a group sit between start and end; inter-group deps become groupEnd(A)→groupStart(B).
- **Brute Force:** Try all permutations of items/groups and validate both grouping and dependencies; exponential. Time O(n!), Space O(n).
- **Approach:** 1) Build graph with n+2m nodes. 2) For each item: if in group, add groupStart→item, item→groupEnd; for each before dependency, add edges (before→item if same group, else groupEnd[before]→groupStart[i]). 3) Topo sort; filter to item indices only.
- **Java Solution:**

```java
class Solution {
    public int[] sortItems(int n, int m, int[] group, java.util.List<java.util.List<Integer>> beforeItems) {
        int nodes = n + 2 * m;
        var graph = new java.util.ArrayList<java.util.List<Integer>>();
        for (int i = 0; i < nodes; i++) graph.add(new java.util.ArrayList<>());

        for (int i = 0; i < n; i++) {
            var before = beforeItems.get(i);
            if (group[i] == -1 && before.isEmpty()) {
                // no edges
            } else if (before.isEmpty()) {
                int gs = n + group[i] * 2, ge = n + group[i] * 2 + 1;
                graph.get(gs).add(i);
                graph.get(i).add(ge);
            } else if (group[i] == -1) {
                for (int b : before) {
                    if (group[b] == -1) graph.get(b).add(i);
                    else graph.get(n + group[b] * 2 + 1).add(i);
                }
            } else {
                int gs = n + group[i] * 2, ge = n + group[i] * 2 + 1;
                graph.get(gs).add(i);
                graph.get(i).add(ge);
                for (int b : before) {
                    if (group[b] == -1) graph.get(b).add(gs);
                    else if (group[b] == group[i]) graph.get(b).add(i);
                    else graph.get(n + group[b] * 2 + 1).add(gs);
                }
            }
        }

        int[] order = topoSort(nodes, graph);
        if (order.length == 0) return new int[0];
        int[] ans = new int[n];
        int j = 0;
        for (int k : order) if (k < n) ans[j++] = k;
        return ans;
    }

    private int[] topoSort(int n, java.util.List<java.util.List<Integer>> graph) {
        int[] inDegree = new int[n];
        for (var edges : graph)
            for (int v : edges) inDegree[v]++;
        var q = new java.util.ArrayDeque<Integer>();
        for (int i = 0; i < n; i++)
            if (inDegree[i] == 0) q.offer(i);
        var order = new java.util.ArrayList<Integer>();
        while (!q.isEmpty()) {
            int u = q.poll();
            order.add(u);
            for (int v : graph.get(u))
                if (--inDegree[v] == 0) q.offer(v);
        }
        if (order.size() != n) return new int[0];
        return order.stream().mapToInt(Integer::intValue).toArray();
    }
}
```

- **Complexity:** Time O(n + E), Space O(n + m)

---

## Common Mistakes

- **Alien Dictionary prefix check:** If word A is prefix of word B and A is longer, invalid order—return "".
- **Alien Dictionary inDegree init:** Use -1 for chars not present; only chars in words get inDegree 0 or more.
- **Course Schedule direction:** prerequisites [a,b] means b before a, so edge b→a.
- **Find All Possible Recipes:** Only count non-supply ingredients for in-degree; start queue with recipes that have in-degree 0.
- **Minimum Height Trees:** Process leaves layer by layer; don't mix layers. Last 1-2 nodes are the answer.
- **Parallel Courses:** Count semesters by processing in layers (level-order BFS).
- **Longest Increasing Path:** DFS + memoization—no need for explicit topo sort; memo avoids recomputation.
- **Sort Items by Groups:** Must handle both group-level and item-level dependencies; rebuild in-degrees for item graph within each group to avoid double-counting.

## Pattern Variations

| Variation           | Example         | Key Technique                           |
|---------------------|-----------------|-----------------------------------------|
| Cycle detection     | #207            | Kahn's: order size < n means cycle      |
| Return order        | #210            | Kahn's: append to result                |
| Char/lexicographic  | #269            | Build graph from adjacent word compare  |
| Leaf peeling        | #310            | Repeatedly remove leaves, center remains|
| Level counting      | #1136           | BFS by layers = semesters               |
| DAG longest path    | #329            | DFS + memo on DAG (incr. path)          |
| Two-level topo      | #1203           | Topo groups, then topo items per group  |
| Supply/dependency   | #2115           | Recipe = node, ingredient = dependency   |
