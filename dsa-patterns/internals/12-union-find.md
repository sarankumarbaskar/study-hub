# Union-Find (Disjoint Set Union) — Interview Execution Playbook

> Union-Find answers one question blazingly fast: **are these two things connected?** With path compression + union by rank, every operation is O(α(n)) ≈ O(1). Your weapon for connected components, dynamic connectivity, grouping/merging, and Kruskal's MST.

---

## Section 1 · Pattern Recognition Signals

**Hear these phrases → think Union-Find:**

| Signal | Example Phrasing |
|--------|-----------------|
| **Connected components** | "How many groups/provinces/islands?" |
| **Dynamic connectivity** | "Edges added over time… are X and Y connected now?" |
| **Grouping / Merging** | "Merge accounts that share an email", "group equivalent items" |
| **Redundant edge** | "Which edge creates a cycle?", "remove one edge to form a tree" |
| **MST (Kruskal's)** | "Minimum cost to connect all points/nodes" |
| **Equivalence relation** | "If a==b and b==c then a==c" — transitive closure |
| **Same set query** | "Are these in the same group/component?" |

**When UF beats BFS/DFS:**

| Scenario | UF | BFS/DFS |
|----------|----|----|
| Edges added incrementally, connectivity queried between adds | **Winner** — O(α(n)) per query, no rebuild | Must re-traverse from scratch each time |
| Single static graph, one connectivity check | Either works | Simpler to code |
| Need shortest path or actual path between nodes | Cannot do this | **Winner** — BFS gives shortest path |
| Need component count as graph grows | **Winner** — maintain count in O(1) | Must re-count via full traversal |
| Kruskal's MST (sort edges, add if no cycle) | **Winner** — cycle detection in O(α(n)) | Cycle detection requires full traversal |

**Bottom line:** If you only care about *whether* things are connected (not the path) and the graph evolves, reach for Union-Find.

---

## Section 2 · Thinking Framework

```
STEP 1: What are the "elements" being grouped?
         → Nodes? Grid cells (r*cols+c)? Account indices? Characters?

STEP 2: What defines a "connection"?
         → An edge? Shared email? Adjacency in grid? Equality equation?

STEP 3: What is being queried?
         → Component count? Same-component check? Cycle detection? MST weight?

STEP 4: Is this dynamic (edges added over time)?
         → YES: UF is strongly preferred over BFS/DFS
         → NO:  UF still works, BFS/DFS also fine

STEP 5: Do I need extra state in the UF?
         → Component count → decrement on successful union
         → Weighted UF → store edge weights for ratio queries (LC 399)
         → Component size → union by size, track sizes[]
```

**Index mapping patterns:**

| Domain | Mapping |
|--------|---------|
| 2D grid (r, c) | `r * cols + c` |
| 1-indexed nodes | Allocate size `n + 1` |
| Character set a–z | `ch - 'a'` → size 26 |
| String keys (emails) | `HashMap<String, Integer>` → assign sequential IDs |

---

## Section 3 · Java Templates

### Template A — Full UnionFind Class (Path Compression + Union by Rank)

This is your go-to. Copy this into every UF problem.

```java
class UnionFind {
    private int[] parent;
    private int[] rank;
    private int count; // number of connected components

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    public int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]); // path compression
        return parent[x];
    }

    public boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false; // already connected
        if (rank[px] < rank[py]) { parent[px] = py; }
        else if (rank[px] > rank[py]) { parent[py] = px; }
        else { parent[py] = px; rank[px]++; }
        count--;
        return true; // merged two components
    }

    public boolean isConnected(int x, int y) {
        return find(x) == find(y);
    }

    public int getCount() {
        return count;
    }
}
```

**Why path compression works:** `find(x)` recursively walks to the root, then on the way back sets every node's parent directly to the root. Next call for any node on that path is O(1).

**Why union by rank works:** Always attach the shorter tree under the taller tree. This keeps tree height at most O(log n) even without path compression. Combined with path compression → O(α(n)) amortized, where α is the inverse Ackermann function (≤ 4 for any practical input size).

**Return value of `union`:** Returning `boolean` lets you detect cycles (if `union` returns `false`, the edge was redundant) and maintain count accurately.

### Template B — Weighted Union-Find (for ratio/division queries)

Used when edges carry weights representing ratios (e.g., LC 399 Evaluate Division).

```java
class WeightedUnionFind {
    private int[] parent;
    private double[] weight; // weight[i] = value of (i / parent[i])

    public WeightedUnionFind(int n) {
        parent = new int[n];
        weight = new double[n];
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            weight[i] = 1.0;
        }
    }

    public int find(int x) {
        if (parent[x] != x) {
            int root = find(parent[x]);
            weight[x] *= weight[parent[x]]; // accumulate ratio to root
            parent[x] = root;
        }
        return parent[x];
    }

    // a / b = val → union a and b with this ratio
    public void union(int a, int b, double val) {
        int pa = find(a), pb = find(b);
        if (pa == pb) return;
        parent[pa] = pb;
        // weight[a] * ? = val * weight[b] → solve for weight[pa]
        weight[pa] = val * weight[b] / weight[a];
    }

    // returns a / b, or -1.0 if not connected
    public double query(int a, int b) {
        if (find(a) != find(b)) return -1.0;
        return weight[a] / weight[b];
    }
}
```

### Complexity Reference

| Operation | Time (amortized) | Space |
|-----------|-----------------|-------|
| find | O(α(n)) ≈ O(1) | O(n) |
| union | O(α(n)) ≈ O(1) | O(n) |
| m operations total | O(m · α(n)) | O(n) |
| Kruskal's MST (E edges) | O(E log E) for sort + O(E · α(V)) for UF | O(V) |

---

## Section 4 · Edge Cases

| Edge Case | How to Handle |
|-----------|--------------|
| **Self-loop edge (u, u)** | `find(u) == find(u)` is always true; `union(u, u)` is a no-op. Watch for this in cycle detection — a self-loop IS a cycle |
| **1-indexed nodes** | Allocate `new UnionFind(n + 1)` to avoid off-by-one |
| **2D grid → 1D mapping** | `index = row * cols + col`; watch for integer overflow on huge grids |
| **Duplicate edges** | Second union of same pair returns `false` — harmless but don't double-count |
| **Single node / empty edges** | Component count = n, no unions needed |
| **Disconnected components** | `getCount()` gives total; for "can we connect all?", check `count == 1` |
| **String keys (emails, variables)** | Map strings → integer IDs with `HashMap`, then use standard UF |
| **Weighted UF precision** | Use `double`; be cautious of floating point drift on long chains |
| **Stack overflow on deep find** | Rare with path compression, but for n > 10^5 consider iterative find |

### Iterative Find (Stack-Safe Alternative)

```java
public int find(int x) {
    int root = x;
    while (parent[root] != root) root = parent[root];
    while (parent[x] != root) {
        int next = parent[x];
        parent[x] = root;
        x = next;
    }
    return root;
}
```

---

## Section 5 · Problem Progression

### Problem 1: Number of Provinces — LC 547 [Medium]

**Problem:** `isConnected[i][j] = 1` means cities i and j are directly connected. Find the number of provinces (connected components).

**Why UF:** Classic "count connected components" with an adjacency matrix.

**Approach:** Union every pair `(i, j)` where `isConnected[i][j] == 1`. Answer = `uf.getCount()`.

```java
class Solution {
    public int findCircleNum(int[][] isConnected) {
        int n = isConnected.length;
        UnionFind uf = new UnionFind(n);
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++)
                if (isConnected[i][j] == 1) uf.union(i, j);
        return uf.getCount();
    }
}
// Time: O(n² · α(n))   Space: O(n)
```

**Interview notes:** Only iterate `j = i+1` since matrix is symmetric. `getCount()` avoids a separate counting loop.

---

### Problem 2: Number of Islands (UF approach) — LC 200 [Medium]

**Problem:** Given a 2D grid of `'1'` (land) and `'0'` (water), count the number of islands.

**Why UF here:** While BFS/DFS is the classic approach, UF demonstrates an alternative that extends naturally to "Number of Islands II" (LC 305) where land is added dynamically.

**Approach:** Initialize UF for land cells only. For each `'1'`, union with adjacent `'1'` cells. Track component count.

```java
class Solution {
    public int numIslands(char[][] grid) {
        int m = grid.length, n = grid[0].length;
        UnionFind uf = new UnionFind(m * n);
        int waterCount = 0;

        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == '0') {
                    waterCount++;
                    continue;
                }
                if (i > 0 && grid[i - 1][j] == '1') uf.union(i * n + j, (i - 1) * n + j);
                if (j > 0 && grid[i][j - 1] == '1') uf.union(i * n + j, i * n + j - 1);
            }
        }
        return uf.getCount() - waterCount;
    }
}
// Time: O(m·n · α(m·n))   Space: O(m·n)
```

**Interview notes:** The trick is subtracting `waterCount` since UF initializes all cells as separate components. Only union rightward/downward to avoid double-processing. Mention that for dynamic island addition (LC 305), UF is strictly better than BFS/DFS.

---

### Problem 3: Accounts Merge — LC 721 [Medium]

**Problem:** Given accounts where each has a name and list of emails, merge accounts that share any email. Same name doesn't mean same person — shared email does.

**Why UF:** Emails create an equivalence relation across accounts. Transitive merging = union-find.

**Approach:** Map each email to the first account index that owns it. When an email is seen again, union the two account indices. Group all emails by root, sort, prepend name.

```java
class Solution {
    public List<List<String>> accountsMerge(List<List<String>> accounts) {
        int n = accounts.size();
        UnionFind uf = new UnionFind(n);
        Map<String, Integer> emailToId = new HashMap<>();

        for (int i = 0; i < n; i++) {
            for (int j = 1; j < accounts.get(i).size(); j++) {
                String email = accounts.get(i).get(j);
                if (emailToId.containsKey(email)) uf.union(emailToId.get(email), i);
                else emailToId.put(email, i);
            }
        }

        Map<Integer, TreeSet<String>> rootToEmails = new HashMap<>();
        for (Map.Entry<String, Integer> entry : emailToId.entrySet()) {
            int root = uf.find(entry.getValue());
            rootToEmails.computeIfAbsent(root, k -> new TreeSet<>()).add(entry.getKey());
        }

        List<List<String>> result = new ArrayList<>();
        for (Map.Entry<Integer, TreeSet<String>> entry : rootToEmails.entrySet()) {
            List<String> merged = new ArrayList<>();
            merged.add(accounts.get(entry.getKey()).get(0)); // name from root account
            merged.addAll(entry.getValue());
            result.add(merged);
        }
        return result;
    }
}
// Time: O(N · α(n) + N log N) where N = total emails   Space: O(N)
```

**Interview notes:** Union on *account indices*, not email strings — this avoids needing a string-keyed UF. `TreeSet` handles dedup + sorting in one shot. Iterate `emailToId` (not accounts) when grouping to avoid revisiting emails.

---

### Problem 4: Redundant Connection — LC 684 [Medium]

**Problem:** A tree of n nodes (1-indexed) has one extra edge creating exactly one cycle. Return the edge that can be removed.

**Why UF:** Add edges one by one. The first edge where both endpoints are already connected creates the cycle — that's the answer.

**Approach:** For each edge, check `isConnected(u, v)`. If true, return this edge. Otherwise, `union(u, v)`.

```java
class Solution {
    public int[] findRedundantConnection(int[][] edges) {
        int n = edges.length;
        UnionFind uf = new UnionFind(n + 1); // 1-indexed

        for (int[] e : edges) {
            if (!uf.union(e[0], e[1])) return e; // union returns false = cycle
        }
        return new int[0]; // unreachable per problem guarantee
    }
}
// Time: O(n · α(n))   Space: O(n)
```

**Interview notes:** The `union` returning `boolean` makes this a one-liner inside the loop. Size `n+1` because nodes are 1-indexed. If the problem says "return the last such edge in the input", this naturally does that since we process in order and the cycle-closing edge is unique.

---

### Problem 5: Min Cost to Connect All Points — LC 1584 [Medium]

**Problem:** Given n points in 2D, connect all points with minimum total Manhattan distance. Each pair can be connected at cost `|xi - xj| + |yi - yj|`.

**Why UF:** This is Kruskal's MST. Sort all edges by weight, greedily add if it doesn't create a cycle (UF check).

**Approach:** Generate all `n*(n-1)/2` edges with Manhattan distance. Sort by cost. Use UF — add edge if `union` succeeds. Stop when `n-1` edges are added.

```java
class Solution {
    public int minCostConnectPoints(int[][] points) {
        int n = points.length;
        List<int[]> edges = new ArrayList<>(); // {cost, i, j}
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++) {
                int cost = Math.abs(points[i][0] - points[j][0])
                         + Math.abs(points[i][1] - points[j][1]);
                edges.add(new int[]{cost, i, j});
            }
        edges.sort((a, b) -> a[0] - b[0]);

        UnionFind uf = new UnionFind(n);
        int totalCost = 0, edgesUsed = 0;
        for (int[] e : edges) {
            if (uf.union(e[1], e[2])) {
                totalCost += e[0];
                if (++edgesUsed == n - 1) break; // MST complete
            }
        }
        return totalCost;
    }
}
// Time: O(n² log n)  [n² edges, sort dominates]   Space: O(n²)
```

**Interview notes:** The early exit at `n-1` edges is an important optimization — mention it. For very large n, Prim's with a min-heap is O(n² log n) with better constants since it avoids materializing all edges, but Kruskal's + UF is cleaner to code and explain.

---

### Problem 6: Evaluate Division — LC 399 [Medium]

**Problem:** Given equations like `a/b = 2.0` and `b/c = 3.0`, answer queries like `a/c = ?`. Return `-1.0` if undetermined.

**Why UF:** Each equation `a/b = val` defines a weighted edge. If a and b are in the same component, we can compute any ratio by chaining weights to root. This is the **weighted Union-Find** problem.

**Approach:** Map variable strings to integer IDs. Use weighted UF: `weight[x]` = ratio of x to its root. For query `a/b`, if same component return `weight[a] / weight[b]`, else `-1.0`.

```java
class Solution {
    public double[] calcEquation(List<List<String>> equations, double[] values,
                                  List<List<String>> queries) {
        Map<String, Integer> varId = new HashMap<>();
        int id = 0;
        for (List<String> eq : equations) {
            for (String var : eq)
                if (!varId.containsKey(var)) varId.put(var, id++);
        }

        WeightedUnionFind uf = new WeightedUnionFind(id);
        for (int i = 0; i < equations.size(); i++) {
            int a = varId.get(equations.get(i).get(0));
            int b = varId.get(equations.get(i).get(1));
            uf.union(a, b, values[i]);
        }

        double[] result = new double[queries.size()];
        for (int i = 0; i < queries.size(); i++) {
            Integer a = varId.get(queries.get(i).get(0));
            Integer b = varId.get(queries.get(i).get(1));
            if (a == null || b == null) result[i] = -1.0;
            else result[i] = uf.query(a, b);
        }
        return result;
    }
}
// Time: O((E + Q) · α(V))   Space: O(V)
// E = equations, Q = queries, V = unique variables
```

**Interview notes:** This is the hardest UF variant to get right under pressure. The key insight: `weight[x]` stores the ratio `x / root(x)`. During path compression, multiply weights along the chain. For the union step, derive the new weight algebraically. BFS/DFS on a graph is an acceptable alternative — mention both approaches.

---

### Problem 7: Longest Consecutive Sequence (UF approach) — LC 128 [Medium]

**Problem:** Given an unsorted array of integers, find the length of the longest consecutive elements sequence in O(n) time.

**Why UF:** Each number is a node. If `num` and `num+1` both exist, union them. The largest component size is the answer. (HashSet approach is simpler, but UF demonstrates the pattern.)

**Approach:** Put all numbers in a set. For each number, if `num+1` exists in the set, union them. Track component sizes via union by size. Answer = max component size.

```java
class Solution {
    public int longestConsecutive(int[] nums) {
        if (nums.length == 0) return 0;
        Map<Integer, Integer> numToId = new HashMap<>();
        int id = 0;
        for (int num : nums) {
            if (!numToId.containsKey(num)) numToId.put(num, id++);
        }

        int[] parent = new int[id];
        int[] size = new int[id];
        for (int i = 0; i < id; i++) { parent[i] = i; size[i] = 1; }

        for (int num : numToId.keySet()) {
            if (numToId.containsKey(num + 1)) {
                int idA = numToId.get(num), idB = numToId.get(num + 1);
                int pA = find(parent, idA), pB = find(parent, idB);
                if (pA != pB) {
                    if (size[pA] < size[pB]) { int tmp = pA; pA = pB; pB = tmp; }
                    parent[pB] = pA;
                    size[pA] += size[pB];
                }
            }
        }

        int max = 1;
        for (int s : size) max = Math.max(max, s);
        return max;
    }

    private int find(int[] parent, int x) {
        if (parent[x] != x) parent[x] = find(parent, parent[x]);
        return parent[x];
    }
}
// Time: O(n · α(n)) ≈ O(n)   Space: O(n)
```

**Interview notes:** The HashSet approach (`while set.contains(num-1)` skip, then count forward) is O(n) and simpler — use that as your primary. Mention UF as an alternative to show breadth. The UF approach uses **union by size** (not rank) because we need actual component sizes.

---

## Section 6 · Common Mistakes

| Mistake | What Goes Wrong | Fix |
|---------|----------------|-----|
| **Forgetting path compression** | Writing `return find(parent[x])` without `parent[x] = find(parent[x])` | Without the assignment, every find walks the full chain — O(n) worst case instead of O(α(n)) |
| **Not returning boolean from union** | Can't detect cycles; must separately call `isConnected` before union | Return `false` when roots match — one operation instead of two |
| **Off-by-one on 1-indexed** | ArrayIndexOutOfBounds when nodes are 1..n | Allocate `n + 1` |
| **Union by rank without rank array** | Defaulting to `parent[px] = py` creates degenerate chains | Always use rank or size; copying the template correctly matters |
| **Decrementing count on failed union** | Component count goes negative | Only decrement inside the `if (px != py)` block |
| **Using UF when you need the actual path** | UF only answers connectivity, not "what is the path from A to B" | Switch to BFS/DFS if path reconstruction is needed |
| **Weighted UF: forgetting to accumulate weights during path compression** | Ratios become wrong after first compression | `weight[x] *= weight[parent[x]]` BEFORE updating `parent[x]` |
| **Accounts Merge: unioning emails instead of account indices** | Need string-keyed UF, more complex | Map email → account index, union account indices |
| **Grid problems: forgetting coordinate → index mapping** | Unions on wrong elements | Always use `r * cols + c`, double-check cols vs rows |
| **Processing != before == (equality equations)** | False negatives — things aren't unioned yet | Two-pass: union all `==` first, then validate all `!=` |

---

## Section 7 · Interview Strategy

### Before Coding (2 minutes)

1. **State the pattern:** "This is a connectivity/grouping problem — I'll use Union-Find with path compression and union by rank."
2. **Clarify the domain:**
   - What are the elements? (nodes, cells, accounts, variables)
   - What defines a connection? (edge, shared attribute, adjacency)
   - What's the query? (count components, detect cycle, compute ratio)
3. **Confirm UF is appropriate:** "We only need connectivity, not paths. Edges are added incrementally. UF gives us O(α(n)) per operation."
4. **State complexity upfront:** "This will be O(m · α(n)) time and O(n) space."

### During Coding (10 minutes)

1. **Write the UF class first** — it's self-contained and easy to verify.
2. **Map the problem domain to integers** — if elements aren't already integers (emails, strings, 2D coords), create the mapping.
3. **Write the main logic** — typically a loop that unions elements, then extracts the answer.
4. **Use `union` return value** — for cycle detection, return false when roots match.

### After Coding (3 minutes)

1. **Trace through an example** — pick the smallest meaningful test case.
2. **Verify edge cases:** empty input, single element, all elements in one component, all isolated.
3. **Discuss alternatives:** "BFS/DFS would also work for a static graph, but UF is better here because [edges added dynamically / cleaner for MST / simpler counting]."

### If Asked "Why Not BFS/DFS?"

| Argument | Details |
|----------|---------|
| **Dynamic edges** | "New edges are added over time. With BFS/DFS, I'd need to rebuild or re-traverse. With UF, each new edge is one O(α(n)) union." |
| **MST (Kruskal's)** | "I need to process edges in sorted order and check for cycles. UF gives me cycle detection in O(α(n))." |
| **Component count tracking** | "UF maintains a running count. With BFS/DFS, I'd need a full traversal to recount after each edge." |
| **Cleaner code** | "The UF class is 20 lines and reusable. The main logic becomes a simple loop." |

### If Asked "Why Not UF?" (Know When to Switch)

- Need the actual shortest path → BFS
- Need to traverse in a specific order (level-order) → BFS
- Need to detect back edges / classify edges → DFS
- Graph is static, one-shot query → BFS/DFS is simpler
- Need topological ordering → DFS/Kahn's

---

## Section 8 · Revision + Quick Reference

### 30-Second Recall

```
Union-Find = parent[] + rank[] + count
find(x):  path compression — parent[x] = find(parent[x])
union(x,y): by rank — attach shorter under taller, count--
O(α(n)) per op ≈ O(1) in practice
```

### Decision Flowchart

```
Problem involves connectivity / grouping?
├─ NO → other pattern
└─ YES → Need the actual path?
         ├─ YES → BFS/DFS
         └─ NO → Edges added dynamically?
                  ├─ YES → UNION-FIND (strong signal)
                  └─ NO → Either works
                          ├─ MST needed? → UF (Kruskal's)
                          ├─ Cycle detection in undirected graph? → UF
                          └─ Component count over time? → UF
```

### Template Quick-Copy Checklist

```
□ parent[] initialized to self: parent[i] = i
□ rank[] initialized to 0
□ count initialized to n
□ find() has path compression (parent[x] = find(parent[x]))
□ union() uses rank comparison
□ union() returns boolean (false = already connected = cycle)
□ union() decrements count on successful merge
□ 1-indexed? → size n+1
□ 2D grid? → index = r * cols + c
□ String keys? → HashMap<String, Integer> for ID mapping
```

### Problem Pattern Map

| Problem | LC # | Core Technique | Key Insight |
|---------|------|---------------|-------------|
| Number of Provinces | 547 | Count components | `getCount()` after unioning adjacency matrix |
| Number of Islands (UF) | 200 | Grid UF + component count | `r*cols+c` mapping; subtract water cells from count |
| Accounts Merge | 721 | Equivalence grouping | email → account index map; union account indices |
| Redundant Connection | 684 | Cycle detection | `union` returns `false` = this edge closes a cycle |
| Min Cost Connect Points | 1584 | Kruskal's MST | Sort edges by cost; UF prevents cycles; stop at n-1 edges |
| Evaluate Division | 399 | Weighted UF | `weight[x]` = ratio to root; accumulate during compression |
| Longest Consecutive Seq | 128 | Union by size | Union `num` with `num+1` if both exist; max component size |

### Complexity Cheat Sheet

| Scenario | Time | Space |
|----------|------|-------|
| m union/find operations on n elements | O(m · α(n)) | O(n) |
| Kruskal's MST (E edges, V vertices) | O(E log E + E · α(V)) | O(V + E) |
| Grid connectivity (m × n grid) | O(m·n · α(m·n)) | O(m·n) |
| α(n) for any practical n (< 2^65536) | ≤ 4 | — |

### Kruskal's MST Recipe

```
1. Generate all edges with weights
2. Sort edges by weight ascending
3. Initialize UnionFind(V)
4. For each edge (u, v, w) in sorted order:
     if uf.union(u, v):  // no cycle
         totalWeight += w
         edgesUsed++
         if edgesUsed == V - 1: break  // MST complete
5. Return totalWeight
```
