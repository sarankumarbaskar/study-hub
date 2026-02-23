# Union-Find (Disjoint Set)

> Group elements into disjoint sets. Union merges two sets; Find returns the representative. Nearly O(1) amortized with path compression and union by rank—the Swiss army knife for connectivity problems.

## What Is This Pattern?

**Union-Find** (also called Disjoint Set Union, DSU) maintains a partition of elements into disjoint sets. Each set has a **representative** (root). Two operations: **Find(x)** returns the representative of x's set; **Union(x, y)** merges the sets containing x and y. The key insight: we don't care about the internal structure—only whether two elements belong to the same set.

With **path compression** (Find flattens the tree by pointing nodes directly to the root) and **union by rank** (attach the smaller tree under the larger), both operations approach O(α(n)) amortized, where α is the inverse Ackermann function—effectively constant for any practical n.

Use Union-Find when you need to answer "are x and y connected?" or "how many connected components?" and you're **adding** edges over time (or process edges in a specific order). It excels at dynamic connectivity—unlike BFS/DFS, you don't need to rebuild from scratch when the graph changes.

## When to Use This Pattern

- Problem asks **"are these two nodes connected?"** or **"same group?"**
- You need **connected components** count or membership.
- Graph is built **incrementally** (add edges one by one).
- Problem involves **grouping** or **merging** (accounts, equivalence relations).
- You're processing edges by **increasing weight** (e.g., Kruskal's MST, Swim in Rising Water).
- Phrases like "redundant connection", "provinces", "accounts merge", "satisfiability", "smallest string with swaps".

## How to Identify This Pattern

```
Do we have elements that can be grouped/connected?
    NO → Consider other patterns
    YES ↓

Do we add connections over time and query connectivity?
    NO → BFS/DFS might suffice for static graph
    YES ↓

Do we care only about "same set" / "connected" (not path)?
    YES → UNION-FIND

Is the graph undirected with incremental edge addition?
    YES → UNION-FIND

Are we processing edges by weight (e.g., increasing order)?
    YES → UNION-FIND (e.g., Kruskal, Swim in Rising Water)
```

## Core Template (Pseudocode)

### Initialize

```
FUNCTION init(n):
    parent[i] = i for each i in 0..n-1
    rank[i] = 0 for each i
```

### Find (with Path Compression)

```
FUNCTION find(x):
    IF parent[x] != x:
        parent[x] = find(parent[x])
    RETURN parent[x]
```

### Union (by Rank)

```
FUNCTION union(x, y):
    rootX = find(x)
    rootY = find(y)
    IF rootX == rootY: RETURN
    IF rank[rootX] < rank[rootY]:
        parent[rootX] = rootY
    ELSE IF rank[rootX] > rank[rootY]:
        parent[rootY] = rootX
    ELSE:
        parent[rootY] = rootX
        rank[rootX]++
```

## Core Template (Java)

```java
class UnionFind {
    private final int[] parent;
    private final int[] rank;

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    public int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    public void union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return;
        if (rank[px] < rank[py]) parent[px] = py;
        else if (rank[px] > rank[py]) parent[py] = px;
        else {
            parent[py] = px;
            rank[px]++;
        }
    }

    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }
}
```

## Complexity Cheat Sheet

| Operation       | Amortized Time | Space   | Notes                          |
|-----------------|----------------|---------|--------------------------------|
| Find            | O(α(n))        | O(n)    | Path compression               |
| Union           | O(α(n))        | O(n)    | Union by rank                  |
| Full algorithm  | O(m·α(n))      | O(n)    | m = number of operations       |
| Kruskal's MST   | O(E log E)     | O(V)    | Dominated by sorting edges     |

## Problems (Progressive Difficulty)

### Easy (2 problems)

#### Problem: [Find if Path Exists in Graph](https://leetcode.com/problems/find-if-path-exists-in-graph/) (LeetCode #1971)

- **Brute Force:** BFS or DFS from source to destination to check reachability. Time O(n + E), Space O(n).
- **Intuition:** Undirected graph with n vertices and edges. Check if there's any path from source to destination. Union-Find: union all edges, then check if source and destination are in the same component.
- **Approach:** 1) Create UnionFind(n). 2) For each edge [u,v], union(u,v). 3) Return find(source) == find(destination).
- **Java Solution:**

```java
class Solution {
    public boolean validPath(int n, int[][] edges, int source, int destination) {
        UnionFind uf = new UnionFind(n);
        for (int[] e : edges) uf.union(e[0], e[1]);
        return uf.find(source) == uf.find(destination);
    }

    static class UnionFind {
        int[] parent;
        UnionFind(int n) {
            parent = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }
        int find(int x) {
            if (parent[x] != x) parent[x] = find(parent[x]);
            return parent[x];
        }
        void union(int x, int y) {
            int px = find(x), py = find(y);
            if (px != py) parent[px] = py;
        }
    }
}
```

- **Complexity:** Time O(n + E·α(n)), Space O(n)

---

#### Problem: [Number of Provinces](https://leetcode.com/problems/number-of-provinces/) (LeetCode #547)

- **Brute Force:** BFS/DFS from each unvisited node to count connected components. Time O(n²), Space O(n).
- **Intuition:** n cities; isConnected[i][j]=1 means i and j are directly connected. Find number of provinces (connected components).
- **Approach:** 1) UnionFind(n). 2) For each pair (i,j) with isConnected[i][j]==1, union(i,j). 3) Count distinct roots.
- **Java Solution:**

```java
class Solution {
    public int findCircleNum(int[][] isConnected) {
        int n = isConnected.length;
        UnionFind uf = new UnionFind(n);
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (isConnected[i][j] == 1) uf.union(i, j);
            }
        }
        int count = 0;
        for (int i = 0; i < n; i++) if (uf.find(i) == i) count++;
        return count;
    }

    static class UnionFind {
        int[] parent;
        UnionFind(int n) {
            parent = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }
        int find(int x) {
            if (parent[x] != x) parent[x] = find(parent[x]);
            return parent[x];
        }
        void union(int x, int y) {
            int px = find(x), py = find(y);
            if (px != py) parent[px] = py;
        }
    }
}
```

- **Complexity:** Time O(n²·α(n)), Space O(n)

---

### Medium (4 problems)

#### Problem: [Redundant Connection](https://leetcode.com/problems/redundant-connection/) (LeetCode #684)

- **Brute Force:** For each edge in reverse order, remove it and run BFS/DFS to check connectivity; return the first edge whose removal keeps the graph connected (it's redundant). Time O(E·(V+E)), Space O(V+E).
- **Intuition:** Tree + one extra edge creates exactly one cycle. Find the edge that can be removed to restore a tree. Add edges one by one; the first edge that connects two already-connected nodes is the answer.
- **Approach:** 1) UnionFind(n+1) for 1-indexed nodes. 2) For each edge (u,v), if find(u)==find(v) return that edge. Else union(u,v). 3) Return last edge (guaranteed to exist).
- **Java Solution:**

```java
class Solution {
    public int[] findRedundantConnection(int[][] edges) {
        int n = edges.length;
        UnionFind uf = new UnionFind(n + 1);
        for (int[] e : edges) {
            if (uf.find(e[0]) == uf.find(e[1])) return e;
            uf.union(e[0], e[1]);
        }
        return edges[edges.length - 1];
    }

    static class UnionFind {
        int[] parent;
        UnionFind(int n) {
            parent = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }
        int find(int x) {
            if (parent[x] != x) parent[x] = find(parent[x]);
            return parent[x];
        }
        void union(int x, int y) {
            parent[find(x)] = find(y);
        }
    }
}
```

- **Complexity:** Time O(n·α(n)), Space O(n)

---

#### Problem: [Accounts Merge](https://leetcode.com/problems/accounts-merge/) (LeetCode #721)

- **Brute Force:** Build graph of email connectivity (emails as nodes, same-account edges); DFS to find connected components, merge emails per component. Time O(N·α(n)), Space O(N).
- **Intuition:** Each account has a name and emails. Two accounts sharing an email are the same person. Merge accounts. Use Union-Find on account indices; union accounts that share any email.
- **Approach:** 1) Map email → first account index that has it. 2) For each account, union with the account index of each email (if seen before). 3) Group emails by root account index. 4) Sort emails, prepend name.
- **Java Solution:**

```java
class Solution {
    public java.util.List<java.util.List<String>> accountsMerge(java.util.List<java.util.List<String>> accounts) {
        UnionFind uf = new UnionFind(accounts.size());
        var emailToId = new java.util.HashMap<String, Integer>();
        for (int i = 0; i < accounts.size(); i++) {
            var acc = accounts.get(i);
            for (int j = 1; j < acc.size(); j++) {
                String email = acc.get(j);
                if (emailToId.containsKey(email)) uf.union(emailToId.get(email), i);
                else emailToId.put(email, i);
            }
        }
        var idToEmails = new java.util.HashMap<Integer, java.util.TreeSet<String>>();
        for (int i = 0; i < accounts.size(); i++) {
            int root = uf.find(i);
            idToEmails.computeIfAbsent(root, k -> new java.util.TreeSet<>());
            for (int j = 1; j < accounts.get(i).size(); j++) {
                idToEmails.get(root).add(accounts.get(i).get(j));
            }
        }
        var result = new java.util.ArrayList<java.util.List<String>>();
        for (var e : idToEmails.entrySet()) {
            var list = new java.util.ArrayList<String>();
            list.add(accounts.get(e.getKey()).get(0));
            list.addAll(e.getValue());
            result.add(list);
        }
        return result;
    }

    static class UnionFind {
        int[] parent;
        UnionFind(int n) {
            parent = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }
        int find(int x) {
            if (parent[x] != x) parent[x] = find(parent[x]);
            return parent[x];
        }
        void union(int x, int y) {
            parent[find(x)] = find(y);
        }
    }
}
```

- **Complexity:** Time O(N·α(n)) where N = total emails; Space O(N)

---

#### Problem: [Number of Connected Components](https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/) (LeetCode #323)

- **Brute Force:** BFS or DFS to traverse graph and count components. Time O(V + E), Space O(V).
- **Intuition:** n nodes, edges added one by one (or given). Count connected components. Union all edges, then count distinct roots.
- **Approach:** 1) UnionFind(n). 2) For each edge, union. 3) Count roots (parent[i]==i or find(i)==i).
- **Java Solution:**

```java
class Solution {
    public int countComponents(int n, int[][] edges) {
        UnionFind uf = new UnionFind(n);
        for (int[] e : edges) uf.union(e[0], e[1]);
        int count = 0;
        for (int i = 0; i < n; i++) if (uf.find(i) == i) count++;
        return count;
    }

    static class UnionFind {
        int[] parent;
        UnionFind(int n) {
            parent = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }
        int find(int x) {
            if (parent[x] != x) parent[x] = find(parent[x]);
            return parent[x];
        }
        void union(int x, int y) {
            parent[find(x)] = find(y);
        }
    }
}
```

- **Complexity:** Time O(n + E·α(n)), Space O(n)

---

#### Problem: [Satisfiability of Equality Equations](https://leetcode.com/problems/satisfiability-of-equality-equations/) (LeetCode #990)

- **Brute Force:** Build graph from == equations; for each != pair, BFS/DFS to check if connected—if so, contradiction. Time O(n·α(26)), Space O(1).
- **Intuition:** Equations like "a==b" or "a!=b". Determine if all can be satisfied. Union all == pairs. For each != pair, if find(a)==find(b), return false.
- **Approach:** 1) UnionFind(26) for 'a'..'z'. 2) For "a==b", union(a-'a', b-'a'). 3) For "a!=b", if find(a-'a')==find(b-'a') return false. 4) Return true.
- **Java Solution:**

```java
class Solution {
    public boolean equationsPossible(String[] equations) {
        UnionFind uf = new UnionFind(26);
        for (String eq : equations) {
            if (eq.charAt(1) == '=') {
                uf.union(eq.charAt(0) - 'a', eq.charAt(3) - 'a');
            }
        }
        for (String eq : equations) {
            if (eq.charAt(1) == '!') {
                if (uf.find(eq.charAt(0) - 'a') == uf.find(eq.charAt(3) - 'a'))
                    return false;
            }
        }
        return true;
    }

    static class UnionFind {
        int[] parent;
        UnionFind(int n) {
            parent = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }
        int find(int x) {
            if (parent[x] != x) parent[x] = find(parent[x]);
            return parent[x];
        }
        void union(int x, int y) {
            parent[find(x)] = find(y);
        }
    }
}
```

- **Complexity:** Time O(n·α(26)), Space O(1)

---

### Hard (2 problems)

#### Problem: [Swim in Rising Water](https://leetcode.com/problems/swim-in-rising-water/) (LeetCode #778)

- **Brute Force:** Binary search on time t; for each t, BFS/DFS to check if (0,0) reaches (n-1,n-1) using only cells with elevation ≤ t. Time O(n² log n²), Space O(n²).
- **Intuition:** n×n grid, each cell has elevation. At time t, you can swim to adjacent cells if both elevations ≤ t. Find minimum t to reach (0,0) to (n-1,n-1). Process cells by increasing elevation: at time t, "activate" all cells with elevation t, union with adjacent activated cells. When (0,0) and (n²-1) connect, return t.
- **Approach:** 1) Build array index[elev] = cell index. 2) For t from 0 to n²-1: activate cell with elevation t, union with neighbors that have elevation ≤ t. 3) If find(0)==find(n²-1), return t.
- **Java Solution:**

```java
class Solution {
    private static final int[][] DIRS = {{0,1},{1,0},{0,-1},{-1,0}};

    public int swimInWater(int[][] grid) {
        int n = grid.length;
        int[] parent = new int[n * n];
        for (int i = 0; i < n * n; i++) parent[i] = i;
        int[] elevToIdx = new int[n * n];
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                elevToIdx[grid[i][j]] = i * n + j;

        for (int t = 0; t < n * n; t++) {
            int idx = elevToIdx[t];
            int r = idx / n, c = idx % n;
            for (int[] d : DIRS) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] <= t)
                    union(parent, idx, nr * n + nc);
            }
            if (find(parent, 0) == find(parent, n * n - 1)) return t;
        }
        return -1;
    }

    private int find(int[] p, int x) {
        if (p[x] != x) p[x] = find(p, p[x]);
        return p[x];
    }

    private void union(int[] p, int x, int y) {
        p[find(p, x)] = find(p, y);
    }
}
```

- **Complexity:** Time O(n²·α(n²)), Space O(n²)

---

#### Problem: [Smallest String With Swaps](https://leetcode.com/problems/smallest-string-with-swaps/) (LeetCode #1202)

- **Brute Force:** Build graph from swap pairs; find connected components via BFS/DFS; within each component, sort chars and assign to indices. Time O(n·α(n) + n log n), Space O(n).
- **Intuition:** String s and pairs of indices that can be swapped any number of times. Indices in the same connected component (via swap pairs) can be rearranged freely. To get lexicographically smallest: within each component, sort chars and assign smallest to smallest index.
- **Approach:** 1) UnionFind on indices, union all pairs. 2) Group chars by root: Map<root, PriorityQueue<Character>>. 3) For each index i, poll from the heap of find(i).
- **Java Solution:**

```java
class Solution {
    public String smallestStringWithSwaps(String s, java.util.List<java.util.List<Integer>> pairs) {
        int n = s.length();
        UnionFind uf = new UnionFind(n);
        for (var p : pairs) uf.union(p.get(0), p.get(1));

        var rootToChars = new java.util.HashMap<Integer, java.util.PriorityQueue<Character>>();
        for (int i = 0; i < n; i++) {
            rootToChars.computeIfAbsent(uf.find(i), k -> new java.util.PriorityQueue<>())
                       .offer(s.charAt(i));
        }

        var sb = new StringBuilder();
        for (int i = 0; i < n; i++)
            sb.append(rootToChars.get(uf.find(i)).poll());
        return sb.toString();
    }

    static class UnionFind {
        int[] parent;
        UnionFind(int n) {
            parent = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }
        int find(int x) {
            if (parent[x] != x) parent[x] = find(parent[x]);
            return parent[x];
        }
        void union(int x, int y) {
            parent[find(x)] = find(y);
        }
    }
}
```

- **Complexity:** Time O(n·α(n) + n log n), Space O(n)

---

## Common Mistakes

- **Forgetting path compression:** Use `parent[x] = find(parent[x])` not just `return find(parent[x])`—otherwise Find isn't amortized O(α(n)).
- **Wrong union direction:** For connectivity, either `parent[px]=py` or `parent[py]=px` works. For union by rank, attach smaller under larger.
- **Off-by-one with 1-indexed nodes:** Provinces/Redundant Connection use 1..n; create parent array of size n+1.
- **Swim in Rising Water:** Process by elevation from 0 to n²-1; union with neighbors that are already "active" (elevation ≤ t).
- **Accounts Merge:** Must union by account index, not by email—use email→firstAccount map, then union when same email appears.
- **Satisfiability:** Process all == first, then check !=. Don't mix order.
- **Smallest String With Swaps:** Use min-heap (PriorityQueue) per component to get smallest available char at each position.

## Pattern Variations

| Variation              | Example              | Key Technique                          |
|------------------------|----------------------|----------------------------------------|
| Basic connectivity     | #1971, #547          | Union edges, check find(u)==find(v)    |
| Find redundant edge   | #684                 | Return first edge connecting same set  |
| Group by equivalence  | #721, #990           | Union equivalent elements              |
| Count components      | #323, #547           | Count distinct roots                   |
| Process by value       | #778                 | Union as we "activate" by elevation    |
| Permutation within set | #1202                | Union pairs, then sort within group    |
