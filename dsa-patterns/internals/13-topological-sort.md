# Topological Sort — Interview Execution Playbook

> **Pattern Mastery Level:** Topological sort is the go-to pattern for dependency resolution problems. It appears directly in FAANG interviews as course scheduling, build ordering, and alien dictionary variants. If you can't code Kahn's algorithm from memory in under 5 minutes, drill it until you can.

---

## 1. Pattern Recognition Signals

### When to Use Topological Sort

```
INSTANT TRIGGERS (say "topological sort" within 5 seconds):
  ✓ "Prerequisites" + "can you finish all courses?"
  ✓ "Build order" / "compile order" / "task scheduling"
  ✓ "Alien dictionary" / "derive ordering from sorted words"
  ✓ "Dependency graph" + "valid execution sequence"
  ✓ "Detect cycle in directed graph"
  ✓ "Parallel courses" / "minimum semesters" / "minimum rounds"
  ✓ "Before/after" constraints + "find valid ordering"
```

### Keywords in Problem Statements

```
DIRECT SIGNALS:              INDIRECT SIGNALS:
  "prerequisites"              "before/after"
  "dependency"                 "ordering constraints"
  "course schedule"            "can all tasks be completed?"
  "build order"                "valid sequence"
  "topological"                "cycle detection"
  "DAG"                        "longest path in DAG"
  "alien dictionary"           "derive order from examples"
```

### When NOT to Use

```
✗ Undirected graph → use BFS/DFS, Union-Find
✗ Shortest path with weights → use Dijkstra/Bellman-Ford
✗ Graph with cycles where you still need traversal → use DFS with visited states
✗ Simple reachability (no ordering needed) → use BFS/DFS
✗ Tree problems (no cycles possible by definition) → use tree-specific traversal
```

---

## 2. Thinking Framework (Step-by-Step Intuition)

### The 60-Second Decision Process

```
Step 1: "Is this a directed graph with ordering constraints?"
  YES → Topological sort is likely the answer
  NO  → Consider BFS/DFS or other graph patterns

Step 2: "What are the nodes and edges?"
  Nodes = tasks/courses/characters/modules
  Edges = "A must come before B" (directed: A → B)
  BUILD THE GRAPH MENTALLY before coding

Step 3: "Do I need to detect cycles?"
  YES → Kahn's: sorted count < total nodes means cycle
        DFS: gray node revisited means back edge = cycle
  NO  → Either approach works, pick based on what's needed

Step 4: "Do I need the actual ordering or just feasibility?"
  Just feasibility → count processed nodes vs total (LC 207)
  Need ordering → collect nodes as you process them (LC 210)
  Need level info → process Kahn's BFS level-by-level (LC 1136)
  Need char ordering → build graph from adjacent word comparisons (LC 269)

Step 5: "Kahn's BFS or DFS?"
  Need level-by-level processing → Kahn's BFS (parallel courses)
  Need to detect cycles cleanly → either works (Kahn's is simpler)
  Prefer iterative / no stack overflow risk → Kahn's BFS
  Natural recursive structure / post-order needed → DFS
```

### The Core Insight (Memorize This)

```
TOPOLOGICAL SORT WORKS BECAUSE:
  In a DAG, there is always at least one node with NO incoming edges (indegree 0).
  Process that node first → remove it and all its outgoing edges →
  This creates NEW nodes with indegree 0 → repeat until graph is empty.

  If graph is NOT empty but no indegree-0 node exists → CYCLE detected.

  This is Kahn's algorithm. It's just BFS where the "level" is
  "all nodes whose dependencies have been fully satisfied."

WHY INDEGREE MATTERS:
  indegree[v] = number of prerequisites v still hasn't satisfied
  When indegree[v] hits 0 → all of v's dependencies are met → v is ready

CYCLE DETECTION (the critical check):
  If processedCount < totalNodes → some nodes were never reachable
  → those nodes are in a cycle (their indegree never reached 0)
```

### Kahn's BFS vs DFS — When to Pick Which

```
┌─────────────────────┬────────────────────────┬────────────────────────┐
│                     │ KAHN'S (BFS)           │ DFS POST-ORDER         │
├─────────────────────┼────────────────────────┼────────────────────────┤
│ Core idea           │ Remove indegree-0      │ Finish time ordering   │
│                     │ nodes layer by layer   │ (reverse post-order)   │
├─────────────────────┼────────────────────────┼────────────────────────┤
│ Cycle detection     │ count < n              │ Gray node revisited    │
├─────────────────────┼────────────────────────┼────────────────────────┤
│ Level info          │ YES (natural layers)   │ NO (extra work needed) │
├─────────────────────┼────────────────────────┼────────────────────────┤
│ Stack overflow risk │ NO (iterative)         │ YES (deep recursion)   │
├─────────────────────┼────────────────────────┼────────────────────────┤
│ Best for            │ Course schedule,        │ DFS-heavy problems,    │
│                     │ parallel courses,       │ finding safe states,   │
│                     │ build ordering          │ SCC pre-processing     │
├─────────────────────┼────────────────────────┼────────────────────────┤
│ Interview default   │ ★ USE THIS ONE ★       │ Know it, use when      │
│                     │ Simpler, no recursion  │ problem demands DFS    │
└─────────────────────┴────────────────────────┴────────────────────────┘
```

---

## 3. Java Templates

### Template 1: Kahn's Algorithm (BFS with Indegree) — THE DEFAULT

```java
// Use for: course schedule, build order, any "valid ordering" problem
// Time: O(V + E) | Space: O(V + E)
public int[] kahnTopoSort(int n, int[][] edges) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
    int[] indegree = new int[n];

    for (int[] e : edges) {
        graph.get(e[0]).add(e[1]); // e[0] → e[1]
        indegree[e[1]]++;
    }

    Queue<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < n; i++)
        if (indegree[i] == 0) queue.offer(i);

    int[] order = new int[n];
    int idx = 0;
    while (!queue.isEmpty()) {
        int u = queue.poll();
        order[idx++] = u;
        for (int v : graph.get(u)) {
            if (--indegree[v] == 0) queue.offer(v);
        }
    }

    // CRITICAL: cycle detection
    return idx == n ? order : new int[0];
}
```

### Template 2: DFS-Based Topological Sort (Three-Color Cycle Detection)

```java
// Use for: problems requiring DFS traversal, safe states, post-order reasoning
// Time: O(V + E) | Space: O(V + E)
// Colors: 0 = unvisited (white), 1 = in-progress (gray), 2 = done (black)
public int[] dfsTopoSort(int n, List<List<Integer>> graph) {
    int[] color = new int[n];
    List<Integer> order = new ArrayList<>();

    for (int i = 0; i < n; i++) {
        if (color[i] == 0 && !dfs(graph, i, color, order))
            return new int[0]; // cycle detected
    }

    Collections.reverse(order); // post-order → topo order
    return order.stream().mapToInt(Integer::intValue).toArray();
}

private boolean dfs(List<List<Integer>> graph, int u, int[] color, List<Integer> order) {
    color[u] = 1; // mark in-progress (gray)
    for (int v : graph.get(u)) {
        if (color[v] == 1) return false;        // back edge → cycle
        if (color[v] == 0 && !dfs(graph, v, color, order))
            return false;
    }
    color[u] = 2; // mark done (black)
    order.add(u); // add in post-order
    return true;
}
```

### Template 3: Kahn's with Level Counting (Parallel Processing / Min Semesters)

```java
// Use for: "minimum semesters", "minimum rounds", "parallel task execution"
// Time: O(V + E) | Space: O(V + E)
public int kahnsWithLevels(int n, int[][] edges) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
    int[] indegree = new int[n];

    for (int[] e : edges) {
        graph.get(e[0]).add(e[1]);
        indegree[e[1]]++;
    }

    Queue<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < n; i++)
        if (indegree[i] == 0) queue.offer(i);

    int levels = 0, processed = 0;
    while (!queue.isEmpty()) {
        int layerSize = queue.size(); // all nodes in this "round"
        levels++;
        for (int i = 0; i < layerSize; i++) {
            int u = queue.poll();
            processed++;
            for (int v : graph.get(u))
                if (--indegree[v] == 0) queue.offer(v);
        }
    }

    return processed == n ? levels : -1; // -1 = cycle
}
```

### Complexity Cheat Sheet

| Algorithm | Time | Space | Notes |
|-----------|------|-------|-------|
| Kahn's (BFS) | O(V + E) | O(V + E) | Indegree array + queue + adjacency list |
| DFS post-order | O(V + E) | O(V + E) | Recursion stack + color array + adjacency list |
| Cycle detection | O(V + E) | O(V) | Kahn's: count < n; DFS: gray revisit |
| Level counting | O(V + E) | O(V + E) | Kahn's with layer-by-layer BFS |
| Longest path in DAG | O(V + E) | O(V) | Topo sort + DP relaxation |

---

## 4. Edge Cases

### Critical Edge Cases (Will Cost You the Interview)

```
1. EMPTY GRAPH (no edges)
   → Every node has indegree 0 → all go in queue immediately
   → Valid topo order = any permutation
   → Return all nodes (don't return empty!)

2. SINGLE NODE
   → Trivially sorted → return [0]

3. DISCONNECTED COMPONENTS
   → Kahn's handles this naturally (all indegree-0 nodes start in queue)
   → DFS: must loop through ALL nodes, not just node 0

4. CYCLE DETECTION (THE #1 MISS)
   → ALWAYS check: processedCount == totalNodes
   → If not equal → cycle exists → return empty/false/-1

5. SELF-LOOPS
   → Node with edge to itself → indegree never reaches 0 → caught by cycle check
   → But mention it explicitly if interviewer asks

6. DUPLICATE EDGES
   → [a,b] appears twice → indegree[b] incremented twice
   → Kahn's still works correctly (indegree decremented twice too)
   → But may cause issues in DFS if not using adjacency set

7. 1-INDEXED vs 0-INDEXED NODES
   → LC 1136 (Parallel Courses) uses 1-indexed nodes
   → Allocate arrays of size n+1, loop from 1 to n
   → Common off-by-one source in interviews

8. PREFIX INVALIDATION (Alien Dictionary specific)
   → ["abc", "ab"] → longer word before its prefix → INVALID input → return ""
   → Must check BEFORE building edges

9. ALL NODES IN A SINGLE CHAIN
   → A → B → C → D → only one valid ordering
   → Kahn's processes one node per iteration
```

---

## 5. Problem Progression

### Problem 1: [Course Schedule](https://leetcode.com/problems/course-schedule/) (LC 207) — Easy

- **The Question:** n courses, prerequisites[i] = [a, b] means "take b before a." Can you finish all courses?
- **Why It's a Topo Sort:** Each prerequisite is a directed edge b → a. "Can you finish all?" = "Is this a DAG?" = "Does a valid topo ordering exist?"
- **The Trap:** Edge direction — [a, b] means b → a, NOT a → b. Read carefully.
- **Approach:** Kahn's algorithm. Build graph, compute indegrees, BFS from indegree-0 nodes. If processed count == numCourses, no cycle.

```java
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        int[] indegree = new int[numCourses];

        for (int[] p : prerequisites) {
            graph.get(p[1]).add(p[0]); // p[1] → p[0]
            indegree[p[0]]++;
        }

        Queue<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++)
            if (indegree[i] == 0) queue.offer(i);

        int count = 0;
        while (!queue.isEmpty()) {
            int u = queue.poll();
            count++;
            for (int v : graph.get(u))
                if (--indegree[v] == 0) queue.offer(v);
        }

        return count == numCourses;
    }
}
```

- **Complexity:** Time O(V + E) — each node and edge visited once; Space O(V + E) — adjacency list and queue.
- **Interview Tip:** This is the purest topo sort problem. If you get this, solve it fast and mention "I can also do this with DFS using three-color cycle detection" to show depth.

---

### Problem 2: [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/) (LC 210) — Medium

- **The Question:** Same setup as 207, but return one valid ordering (or empty array if impossible).
- **Delta from 207:** Instead of just counting, collect nodes into an order array.
- **Approach:** Identical Kahn's, but write each polled node into the result array.

```java
class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        int[] indegree = new int[numCourses];

        for (int[] p : prerequisites) {
            graph.get(p[1]).add(p[0]);
            indegree[p[0]]++;
        }

        Queue<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++)
            if (indegree[i] == 0) queue.offer(i);

        int[] order = new int[numCourses];
        int idx = 0;
        while (!queue.isEmpty()) {
            int u = queue.poll();
            order[idx++] = u;
            for (int v : graph.get(u))
                if (--indegree[v] == 0) queue.offer(v);
        }

        return idx == numCourses ? order : new int[0];
    }
}
```

- **Complexity:** Time O(V + E); Space O(V + E).
- **Interview Tip:** Mention that multiple valid orderings exist (topo sort is not unique unless the graph is a single chain). If they ask for lexicographically smallest, swap `ArrayDeque` for `PriorityQueue`.

---

### Problem 3: [Alien Dictionary](https://leetcode.com/problems/alien-dictionary/) (LC 269) — Hard

- **The Question:** Given words sorted in alien language order, derive the character ordering.
- **Why It's Hard:** You must (1) extract edges from adjacent word comparisons, (2) handle the prefix edge case, (3) handle characters with no ordering constraints, (4) topo sort characters.
- **Key Insight:** Compare adjacent words. At the first differing character position, you get one edge: word1[j] → word2[j]. Only ONE edge per adjacent word pair.
- **The Trap:** If word1 is a prefix of word2 but longer (e.g., ["abc", "ab"]), the input is INVALID — return "".

```java
class Solution {
    public String alienOrder(String[] words) {
        Map<Character, List<Character>> graph = new HashMap<>();
        int[] indegree = new int[26];
        Arrays.fill(indegree, -1); // -1 = char doesn't exist

        for (String w : words)
            for (char c : w.toCharArray())
                if (indegree[c - 'a'] < 0) {
                    indegree[c - 'a'] = 0;
                    graph.put(c, new ArrayList<>());
                }

        for (int i = 1; i < words.length; i++) {
            String a = words[i - 1], b = words[i];
            if (a.length() > b.length() && a.startsWith(b)) return "";

            int len = Math.min(a.length(), b.length());
            for (int j = 0; j < len; j++) {
                if (a.charAt(j) != b.charAt(j)) {
                    graph.get(a.charAt(j)).add(b.charAt(j));
                    indegree[b.charAt(j) - 'a']++;
                    break; // only first diff matters
                }
            }
        }

        Queue<Character> queue = new ArrayDeque<>();
        for (char c : graph.keySet())
            if (indegree[c - 'a'] == 0) queue.offer(c);

        StringBuilder sb = new StringBuilder();
        while (!queue.isEmpty()) {
            char c = queue.poll();
            sb.append(c);
            for (char next : graph.get(c))
                if (--indegree[next - 'a'] == 0) queue.offer(next);
        }

        return sb.length() == graph.size() ? sb.toString() : "";
    }
}
```

- **Complexity:** Time O(total characters across all words); Space O(1) — alphabet bounded by 26.
- **Interview Tip:** Walk through an example like ["wrt", "wrf", "er", "ett", "rftt"] on the whiteboard. Show how each adjacent pair gives one edge: t→f, w→e, r→t, e→r. Then run Kahn's on it.

---

### Problem 4: [Minimum Height Trees](https://leetcode.com/problems/minimum-height-trees/) (LC 310) — Medium

- **The Question:** Given a tree of n nodes, find all roots that minimize tree height.
- **Why It's Here:** Uses the same "peel leaves by indegree" idea as Kahn's, but on an undirected tree. The answer is always the 1 or 2 center nodes.
- **Key Insight:** Repeatedly remove all leaf nodes (degree 1). The last 1-2 nodes remaining are the centers — they minimize the tree height.

```java
class Solution {
    public List<Integer> findMinHeightTrees(int n, int[][] edges) {
        if (n == 1) return List.of(0);

        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] degree = new int[n];

        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
            degree[e[0]]++;
            degree[e[1]]++;
        }

        Queue<Integer> leaves = new ArrayDeque<>();
        for (int i = 0; i < n; i++)
            if (degree[i] == 1) leaves.offer(i);

        int remaining = n;
        while (remaining > 2) {
            int layerSize = leaves.size();
            remaining -= layerSize;
            for (int i = 0; i < layerSize; i++) {
                int u = leaves.poll();
                for (int v : adj.get(u))
                    if (--degree[v] == 1) leaves.offer(v);
            }
        }

        List<Integer> result = new ArrayList<>();
        while (!leaves.isEmpty()) result.add(leaves.poll());
        return result;
    }
}
```

- **Complexity:** Time O(n) — each node and edge processed once; Space O(n).
- **Interview Tip:** Explain WHY the center minimizes height: the center is equidistant from the farthest leaves. A tree has at most 2 centers (the midpoint of the diameter).

---

### Problem 5: [Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/) (LC 802) — Medium

- **The Question:** In a directed graph, find all nodes that are "safe" — every path from that node eventually reaches a terminal node (no outgoing edges). Nodes in or leading to cycles are unsafe.
- **Key Insight:** A node is safe if and only if it is NOT part of a cycle and does NOT reach a cycle. Use DFS with three colors: if a node finishes (black), it's safe. If we hit a gray node, everything on that path is unsafe.

```java
class Solution {
    public List<Integer> eventualSafeNodes(int[][] graph) {
        int n = graph.length;
        int[] color = new int[n]; // 0=white, 1=gray, 2=black

        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < n; i++)
            if (isSafe(graph, i, color)) result.add(i);

        return result;
    }

    private boolean isSafe(int[][] graph, int u, int[] color) {
        if (color[u] != 0) return color[u] == 2; // gray=unsafe, black=safe
        color[u] = 1; // mark in-progress
        for (int v : graph[u]) {
            if (!isSafe(graph, v, color)) return false;
        }
        color[u] = 2; // mark safe
        return true;
    }
}
```

- **Complexity:** Time O(V + E); Space O(V) — color array + recursion stack.
- **Alternative:** Reverse the graph and use Kahn's. Terminal nodes have outdegree 0 in the original graph → indegree 0 in the reversed graph. Process them like Kahn's. All nodes that get processed are safe.
- **Interview Tip:** This is a great problem to demonstrate DFS three-color mastery. Explain each color's meaning clearly.

---

### Problem 6: [Parallel Courses](https://leetcode.com/problems/parallel-courses/) (LC 1136) — Medium

- **The Question:** N courses, relations[i] = [a, b] means "a before b." Take as many courses as possible per semester (all prerequisites must be met). Return minimum semesters to finish all courses, or -1 if impossible.
- **Key Insight:** Each "layer" in Kahn's BFS = one semester. All nodes with indegree 0 at the same time can be taken in parallel.

```java
class Solution {
    public int minimumSemesters(int n, int[][] relations) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i <= n; i++) graph.add(new ArrayList<>());
        int[] indegree = new int[n + 1]; // 1-indexed

        for (int[] r : relations) {
            graph.get(r[0]).add(r[1]);
            indegree[r[1]]++;
        }

        Queue<Integer> queue = new ArrayDeque<>();
        for (int i = 1; i <= n; i++)
            if (indegree[i] == 0) queue.offer(i);

        int semesters = 0, count = 0;
        while (!queue.isEmpty()) {
            int layerSize = queue.size();
            semesters++;
            for (int i = 0; i < layerSize; i++) {
                int u = queue.poll();
                count++;
                for (int v : graph.get(u))
                    if (--indegree[v] == 0) queue.offer(v);
            }
        }

        return count == n ? semesters : -1;
    }
}
```

- **Complexity:** Time O(V + E); Space O(V + E).
- **Interview Tip:** The number of semesters = the longest path in the DAG + 1. This is because the critical path (longest chain of dependencies) determines the minimum time. Mention this to show you understand the deeper structure.

---

## 6. Common Mistakes

### Mistake 1: Forgetting Cycle Detection

```
WRONG: Run Kahn's, return order, never check if all nodes were processed
RIGHT: ALWAYS check processedCount == totalNodes after Kahn's loop

  // This one line is the difference between AC and WA on half the topo sort problems
  return idx == n ? order : new int[0];

WHY: If there's a cycle, nodes in the cycle never reach indegree 0.
     Kahn's just... stops. It doesn't crash. It silently gives a partial answer.
     You MUST check the count.
```

### Mistake 2: Wrong Indegree Tracking

```
WRONG: Decrementing indegree for the wrong node
WRONG: Building the graph in the wrong direction

  // prerequisites[i] = [a, b] means "b must come before a"
  // Edge is b → a, NOT a → b
  graph.get(p[1]).add(p[0]);  // CORRECT: b → a
  indegree[p[0]]++;           // CORRECT: a's indegree increases

  graph.get(p[0]).add(p[1]);  // WRONG: reverses the dependency
  indegree[p[1]]++;           // WRONG: increments wrong node
```

### Mistake 3: Not Handling the Prefix Case (Alien Dictionary)

```
WRONG: Skip the prefix check
RIGHT: Before extracting edges, check if longer word comes before its prefix

  if (a.length() > b.length() && a.startsWith(b)) return "";

  Example: ["abc", "ab"] → "abc" before "ab" is impossible
  → In any valid ordering, prefixes come first
```

### Mistake 4: Off-by-One on 1-Indexed Problems

```
WRONG: Allocating array of size n for 1-indexed nodes (LC 1136)
RIGHT: Allocate size n+1, loop from 1 to n

  int[] indegree = new int[n + 1];  // nodes are 1 to n
  for (int i = 1; i <= n; i++)      // start from 1, not 0
      if (indegree[i] == 0) queue.offer(i);
```

### Mistake 5: DFS Without Three Colors

```
WRONG: Using boolean visited[] for cycle detection in directed graphs
  → A node can be visited (done) and revisited via a different path — that's NOT a cycle
  → A cycle only exists if we revisit a node that's currently IN PROGRESS (on the stack)

RIGHT: Use three states
  0 (white) = unvisited
  1 (gray)  = in-progress (currently on the DFS stack)
  2 (black) = done (fully processed)

  Back edge detection: if we visit a GRAY node → cycle
  Cross edge to BLACK node → NOT a cycle, just an already-processed node
```

### Mistake 6: Forgetting Disconnected Components

```
WRONG: Only starting DFS from node 0
RIGHT: Loop through ALL nodes

  for (int i = 0; i < n; i++)       // must check every node
      if (color[i] == 0) dfs(i);    // some components may be unreachable from 0
```

---

## 7. Interview Strategy

### Opening (First 2 Minutes)

```
1. IDENTIFY: "This involves dependencies/ordering → topological sort on a DAG"
2. CLARIFY:
   - "Can there be cycles?" (determines if you need cycle detection)
   - "Are nodes 0-indexed or 1-indexed?"
   - "Can there be duplicate edges?"
   - "Do I need the actual order or just feasibility?"
3. STATE APPROACH: "I'll use Kahn's algorithm — BFS with indegree tracking"
```

### Building the Solution (3-5 Minutes)

```
1. BUILD GRAPH:
   "First, I'll build an adjacency list and compute indegrees"
   → Clarify edge direction out loud: "prerequisite [a,b] means b → a"

2. INITIALIZE:
   "Seed the queue with all indegree-0 nodes — these have no dependencies"

3. PROCESS:
   "BFS: poll a node, add to result, decrement neighbors' indegrees.
    When a neighbor hits 0, it's ready — add to queue"

4. VALIDATE:
   "If I processed all n nodes, valid ordering exists. Otherwise, cycle."
```

### Communicating Complexity

```
"Time is O(V + E) — we visit every node once when it enters the queue,
 and every edge once when we decrement indegrees.
 Space is O(V + E) for the adjacency list, indegree array, and queue."
```

### Follow-Up Questions You Should Expect

```
Q: "Can you detect WHICH nodes are in the cycle?"
A: "Yes — after Kahn's, any node with indegree > 0 is in a cycle (or reachable
   only through a cycle). Alternatively, DFS gray-node tracking gives the exact
   back edge."

Q: "What if there are multiple valid orderings?"
A: "Kahn's gives one valid ordering based on queue ordering. For lexicographically
   smallest, replace ArrayDeque with PriorityQueue (adds O(V log V) factor)."

Q: "Can you do this with DFS?"
A: "Yes — DFS post-order with reversal. I use three colors for cycle detection:
   white (unvisited), gray (in-progress), black (done). If I hit a gray node,
   there's a cycle."

Q: "What's the minimum number of rounds/semesters?"
A: "Process Kahn's level-by-level. Each level = one round. The number of levels
   equals the longest path in the DAG + 1."
```

---

## 8. Revision + Quick Reference

### 30-Second Kahn's Recall

```
BUILD graph + indegree[]
SEED queue with indegree == 0
LOOP: poll → add to order → for each neighbor: --indegree, if 0 → enqueue
CHECK: processedCount == n? (YES = valid, NO = cycle)
```

### Decision Flowchart

```
                    Dependency / ordering problem?
                              │
                             YES
                              │
                    Directed graph (edges = "before")?
                    ┌─────────┴─────────┐
                   YES                  NO
                    │                    │
            Need level info?      Leaf peeling on tree?
            ┌───┴───┐                   │
           YES      NO            LC 310 (undirected
            │        │             Kahn's variant)
      Kahn's with   Just need
      layers        order/feasibility?
      (LC 1136)     ┌───┴───┐
                   YES      Need safe
                    │       states?
               Kahn's       │
               standard   DFS 3-color
               (LC 207,   (LC 802)
                LC 210)
```

### Pattern Variants at a Glance

| Variant | Problem | Key Technique |
|---------|---------|---------------|
| Cycle detection (feasibility) | LC 207 | Kahn's: count < n → cycle |
| Return valid ordering | LC 210 | Kahn's: collect order array |
| Derive ordering from examples | LC 269 | Compare adjacent words → edges between chars |
| Find graph centers | LC 310 | Leaf peeling (Kahn's on undirected tree) |
| Find safe nodes (no cycles) | LC 802 | DFS three-color: black = safe |
| Minimum parallel rounds | LC 1136 | Kahn's layer-by-layer = semesters |

### The Five Things to Never Forget

```
1. ALWAYS check processedCount == n (cycle detection)
2. Edge direction: [a, b] usually means b → a (read the problem!)
3. Kahn's = BFS from indegree-0 nodes, DFS = post-order + reverse
4. For "minimum rounds" → Kahn's with level-by-level processing
5. Alien Dictionary → prefix check + one edge per adjacent word pair
```
