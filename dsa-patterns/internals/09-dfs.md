# DFS (Depth-First Search)

> Explore as deep as possible before backtracking—traverse trees, graphs, and grids by going down one path to completion, then unwinding. Essential for path finding, connectivity, and structural exploration.

## What Is This Pattern?

**Depth-First Search (DFS)** explores a structure by going as far as possible along each branch before backtracking. Unlike BFS (breadth-first), which levels out layer by layer, DFS plunges vertically first, then retreats to try alternate branches. This "go deep, then backtrack" behavior makes it ideal for exploring paths, detecting cycles, and solving problems where the solution lies in the structure of a traversal—not its breadth.

**Visual intuition:** Imagine exploring a maze. DFS is like putting your hand on the right wall and walking—you go as far as you can down one corridor until you hit a dead end, then backtrack to the last fork and try the next unvisited path. You eventually visit every reachable cell, but the order depends on your exploration strategy (pre-order, in-order, post-order for trees).

The pattern has three main forms: **recursive tree DFS** (elegant, uses the call stack), **iterative DFS** (explicit stack, avoids recursion limits), and **graph DFS** (visited set to handle cycles, adjacency list or matrix). For trees, no visited set is needed (acyclic). For graphs, you must track visited nodes to avoid infinite loops.

## When to Use This Pattern

- **Tree traversal** (binary trees, N-ary trees)—path problems, subtree checks, structural manipulation
- **Grid/graph connectivity**—islands, flood fill, reachability, connected components
- **Path problems**—find all paths, path sum, path validation
- **Cycle detection** in directed/undirected graphs—topological sort, dependency resolution
- **Backtracking**—constraint satisfaction where you explore, prune, and backtrack
- **Serialize/deserialize** structures—encode tree structure via DFS traversal
- **Ordering/lexicographic** problems—alien dictionary, dependency ordering (DFS + topological sort)

## How to Identify This Pattern

- "Traverse the tree" / "visit every node" / "explore all paths"
- "Number of islands" / "connected components" / "flood fill"
- "Path sum" / "find all paths" / "validate path"
- "Lowest common ancestor" / "ancestor in tree"
- "Validate BST" / "check tree property" / "in-order"
- "Serialize" / "deserialize" tree or graph
- "Course schedule" / "prerequisites" / "dependency order" / "can finish"
- "Alien dictionary" / "lexicographic order" from rules
- Graph or grid with adjacency, connectivity, reachability questions
- Need to explore one branch completely before trying alternatives

## Core Template (Pseudocode)

### Recursive Tree DFS

```
FUNCTION dfs(node):
    IF node == null:
        RETURN base_value
    // Pre-order: process node here
    left_result = dfs(node.left)
    // In-order: process node here (for BST)
    right_result = dfs(node.right)
    // Post-order: process node here
    RETURN combine(left_result, right_result, node)
```

### Iterative DFS (Stack)

```
FUNCTION iterativeDfs(root):
    stack = [root]
    WHILE stack not empty:
        node = stack.pop()
        IF node == null: CONTINUE
        process(node)
        stack.push(node.right)   // push in reverse order for L→R
        stack.push(node.left)
```

### Graph DFS (with visited)

```
FUNCTION graphDfs(node, visited):
    IF node in visited: RETURN
    visited.add(node)
    process(node)
    FOR each neighbor in graph[node]:
        graphDfs(neighbor, visited)
```

### Iterative Graph DFS

```
FUNCTION iterativeGraphDfs(start):
    stack = [start]
    visited = set()
    WHILE stack not empty:
        node = stack.pop()
        IF node in visited: CONTINUE
        visited.add(node)
        process(node)
        FOR each neighbor in graph[node]:
            IF neighbor not in visited:
                stack.push(neighbor)
```

## Core Template (Java)

### Recursive Tree DFS

```java
private int dfs(TreeNode node) {
    if (node == null) return 0;
    int left = dfs(node.left);
    int right = dfs(node.right);
    return 1 + Math.max(left, right);
}
```

### Iterative DFS (Stack)

```java
public void iterativeDfs(TreeNode root) {
    if (root == null) return;
    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        // process(node);
        if (node.right != null) stack.push(node.right);
        if (node.left != null) stack.push(node.left);
    }
}
```

### Graph DFS (Adjacency List)

```java
private void graphDfs(int node, List<List<Integer>> graph, boolean[] visited) {
    visited[node] = true;
    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) graphDfs(neighbor, graph, visited);
    }
}
```

## Complexity Cheat Sheet

| Scenario                    | Time       | Space                | Notes                                |
|----------------------------|------------|-----------------------|--------------------------------------|
| Tree DFS (recursive)       | O(n)       | O(h) recursion stack  | h = height, O(n) worst for skew       |
| Tree DFS (iterative)       | O(n)       | O(h) explicit stack   | Same, avoids stack overflow           |
| Grid DFS (m×n)             | O(m×n)     | O(m×n) visited/stack  | Each cell visited once               |
| Graph DFS (V vertices, E edges) | O(V + E) | O(V) visited          | Each vertex + edge processed once    |
| Path enumeration           | O(paths × path_len) | O(h)              | Backtrack, prune invalid paths       |
| Topological sort (DFS)     | O(V + E)   | O(V)                  | Post-order + reverse = topo order    |

---

## TreeNode Definition (LeetCode Standard)

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

## Problems (Progressive Difficulty)

### Easy (3 problems)

---

#### Problem: [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/) (LeetCode #104)

- **Brute Force:** Use BFS level-order traversal, counting levels until the queue is empty. Time O(n), Space O(n)
- **Intuition:** The depth of a tree is 1 plus the maximum of the depths of its left and right subtrees. Base case: null has depth 0.
- **Approach:** Recursive DFS (post-order): if node is null return 0; else return 1 + max(left depth, right depth).
- **Java Solution:**

```java
class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}

// Runnable with main:
class Lc104 {
    static class TreeNode {
        int val; TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
    public static void main(String[] args) {
        TreeNode root = new TreeNode(3);
        root.left = new TreeNode(9);
        root.right = new TreeNode(20);
        root.right.left = new TreeNode(15);
        root.right.right = new TreeNode(7);
        System.out.println(new Lc104().maxDepth(root)); // 3
    }
}
```

- **Complexity:** Time O(n), Space O(h)

---

#### Problem: [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/) (LeetCode #226)

- **Brute Force:** Create a new tree by traversing the original and building a mirrored copy. Time O(n), Space O(n)
- **Intuition:** Swap left and right subtrees at every node. Do it recursively: invert left, invert right, then swap the pointers.
- **Approach:** Post-order DFS: recurse on left and right, then swap node.left and node.right.
- **Java Solution:**

```java
class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        TreeNode left = invertTree(root.left);
        TreeNode right = invertTree(root.right);
        root.left = right;
        root.right = left;
        return root;
    }
}

// Runnable:
class Lc226 {
    static class TreeNode {
        int val; TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        TreeNode left = invertTree(root.left);
        TreeNode right = invertTree(root.right);
        root.left = right;
        root.right = left;
        return root;
    }
    public static void main(String[] args) {
        TreeNode root = new TreeNode(4);
        root.left = new TreeNode(2);
        root.right = new TreeNode(7);
        root.left.left = new TreeNode(1);
        root.left.right = new TreeNode(3);
        root.right.left = new TreeNode(6);
        root.right.right = new TreeNode(9);
        new Lc226().invertTree(root);
        System.out.println(root.left.val); // 7
        System.out.println(root.right.val); // 2
    }
}
```

- **Complexity:** Time O(n), Space O(h)

---

#### Problem: [Same Tree](https://leetcode.com/problems/same-tree/) (LeetCode #100)

- **Brute Force:** Serialize both trees to strings (e.g., pre-order with null markers) and compare the outputs. Time O(n), Space O(n)
- **Intuition:** Two trees are the same iff their roots have the same value and their left and right subtrees are the same.
- **Approach:** If both null → true. If one null → false. Else compare val and recurse on left and right.
- **Java Solution:**

```java
class Solution {
    public boolean isSameTree(TreeNode p, TreeNode q) {
        if (p == null && q == null) return true;
        if (p == null || q == null) return false;
        if (p.val != q.val) return false;
        return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
    }
}

// Runnable:
class Lc100 {
    static class TreeNode {
        int val; TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }
    public boolean isSameTree(TreeNode p, TreeNode q) {
        if (p == null && q == null) return true;
        if (p == null || q == null) return false;
        if (p.val != q.val) return false;
        return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
    }
    public static void main(String[] args) {
        TreeNode p = new TreeNode(1);
        p.left = new TreeNode(2);
        p.right = new TreeNode(3);
        TreeNode q = new TreeNode(1);
        q.left = new TreeNode(2);
        q.right = new TreeNode(3);
        System.out.println(new Lc100().isSameTree(p, q)); // true
    }
}
```

- **Complexity:** Time O(n), Space O(h)

---

### Medium (5 problems)

---

#### Problem: [Number of Islands](https://leetcode.com/problems/number-of-islands/) (LeetCode #200 — DFS Approach)

- **Brute Force:** Use a separate visited matrix instead of mutating the grid; for each unvisited '1', run DFS and mark all connected cells. Time O(m×n), Space O(m×n)
- **Intuition:** Scan the grid; when you find '1', sink the whole island (DFS) and increment count. Sinking = mark visited by changing '1' to '0'.
- **Approach:** For each cell, if '1' then DFS from that cell (up/down/left/right), flip to '0', and count++.
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
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] == '0')
            return;
        grid[r][c] = '0';
        dfs(grid, r - 1, c);
        dfs(grid, r + 1, c);
        dfs(grid, r, c - 1);
        dfs(grid, r, c + 1);
    }
}

// Runnable:
class Lc200 {
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
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] == '0') return;
        grid[r][c] = '0';
        dfs(grid, r - 1, c);
        dfs(grid, r + 1, c);
        dfs(grid, r, c - 1);
        dfs(grid, r, c + 1);
    }
    public static void main(String[] args) {
        char[][] grid = {
            {'1','1','1','1','0'},
            {'1','1','0','1','0'},
            {'1','1','0','0','0'},
            {'0','0','0','0','0'}
        };
        System.out.println(new Lc200().numIslands(grid)); // 1
    }
}
```

- **Complexity:** Time O(m×n), Space O(m×n) recursion

---

#### Problem: [Path Sum II](https://leetcode.com/problems/path-sum-ii/) (LeetCode #113)

- **Brute Force:** Collect all root-to-leaf paths without pruning, then filter for those whose sum equals target. Time O(n), Space O(h) + output
- **Intuition:** DFS from root, maintain current path and remaining target. At leaf, if remaining == 0, add path to result. Backtrack after exploring each subtree.
- **Approach:** Pre-order DFS: add node to path, subtract node.val from target. If leaf and target == 0, copy path to result. Recurse left, recurse right, then remove node from path (backtrack).
- **Java Solution:**

```java
class Solution {
    public List<List<Integer>> pathSum(TreeNode root, int targetSum) {
        List<List<Integer>> result = new ArrayList<>();
        List<Integer> path = new ArrayList<>();
        dfs(root, targetSum, path, result);
        return result;
    }

    private void dfs(TreeNode node, int remaining, List<Integer> path, List<List<Integer>> result) {
        if (node == null) return;
        path.add(node.val);
        remaining -= node.val;
        if (node.left == null && node.right == null && remaining == 0) {
            result.add(new ArrayList<>(path));
        }
        dfs(node.left, remaining, path, result);
        dfs(node.right, remaining, path, result);
        path.remove(path.size() - 1);
    }
}

// Runnable:
class Lc113 {
    static class TreeNode {
        int val; TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }
    public List<List<Integer>> pathSum(TreeNode root, int targetSum) {
        List<List<Integer>> result = new ArrayList<>();
        dfs(root, targetSum, new ArrayList<>(), result);
        return result;
    }
    private void dfs(TreeNode node, int rem, List<Integer> path, List<List<Integer>> result) {
        if (node == null) return;
        path.add(node.val);
        rem -= node.val;
        if (node.left == null && node.right == null && rem == 0)
            result.add(new ArrayList<>(path));
        dfs(node.left, rem, path, result);
        dfs(node.right, rem, path, result);
        path.remove(path.size() - 1);
    }
    public static void main(String[] args) {
        TreeNode root = new TreeNode(5);
        root.left = new TreeNode(4);
        root.right = new TreeNode(8);
        root.left.left = new TreeNode(11);
        root.left.left.left = new TreeNode(7);
        root.left.left.right = new TreeNode(2);
        root.right.left = new TreeNode(13);
        root.right.right = new TreeNode(4);
        root.right.right.left = new TreeNode(5);
        root.right.right.right = new TreeNode(1);
        System.out.println(new Lc113().pathSum(root, 22));
        // [[5,4,11,2],[5,8,4,5]]
    }
}
```

- **Complexity:** Time O(n), Space O(h) + O(paths × path_len) for result

---

#### Problem: [Validate BST](https://leetcode.com/problems/validate-binary-search-tree/) (LeetCode #98)

- **Brute Force:** Perform in-order traversal, store values in a list, then check if the list is strictly increasing. Time O(n), Space O(n)
- **Intuition:** A BST has every node in range (min, max). Root is (-∞, ∞). Left subtree upper bound = node.val; right subtree lower bound = node.val.
- **Approach:** DFS passing (min, max). Null is valid. If node.val <= min or >= max, invalid. Recurse left with (min, node.val), right with (node.val, max).
- **Java Solution:**

```java
class Solution {
    public boolean isValidBST(TreeNode root) {
        return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }

    private boolean validate(TreeNode node, long min, long max) {
        if (node == null) return true;
        if (node.val <= min || node.val >= max) return false;
        return validate(node.left, min, node.val) && validate(node.right, node.val, max);
    }
}

// Runnable:
class Lc98 {
    static class TreeNode {
        int val; TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }
    public boolean isValidBST(TreeNode root) {
        return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }
    private boolean validate(TreeNode node, long min, long max) {
        if (node == null) return true;
        if (node.val <= min || node.val >= max) return false;
        return validate(node.left, min, node.val) && validate(node.right, node.val, max);
    }
    public static void main(String[] args) {
        TreeNode root = new TreeNode(2);
        root.left = new TreeNode(1);
        root.right = new TreeNode(3);
        System.out.println(new Lc98().isValidBST(root)); // true
    }
}
```

- **Complexity:** Time O(n), Space O(h)

---

#### Problem: [Lowest Common Ancestor](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) (LeetCode #236)

- **Brute Force:** Find the path from root to p and root to q, store both paths, then iterate to find the last common node. Time O(n), Space O(h)
- **Intuition:** LCA is the deepest node that has both p and q as descendants. If we find p or q, we return it. If both subtrees return non-null, current node is LCA. If one returns non-null, propagate that up.
- **Approach:** DFS: if node null or node == p or node == q, return node. Recurse left and right. If both non-null → LCA = current. Else return whichever is non-null.
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

// Runnable:
class Lc236 {
    static class TreeNode {
        int val; TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) return root;
        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);
        if (left != null && right != null) return root;
        return left != null ? left : right;
    }
    public static void main(String[] args) {
        TreeNode root = new TreeNode(3);
        root.left = new TreeNode(5);
        root.right = new TreeNode(1);
        root.left.left = new TreeNode(6);
        root.left.right = new TreeNode(2);
        root.right.left = new TreeNode(0);
        root.right.right = new TreeNode(8);
        root.left.right.left = new TreeNode(7);
        root.left.right.right = new TreeNode(4);
        TreeNode p = root.left, q = root.left.right.right;
        System.out.println(new Lc236().lowestCommonAncestor(root, p, q).val); // 5
    }
}
```

- **Complexity:** Time O(n), Space O(h)

---

#### Problem: [Course Schedule](https://leetcode.com/problems/course-schedule/) (LeetCode #207)

- **Brute Force:** Enumerate all n! course orderings and check if any satisfies the prerequisites; return true if one exists. Time O(n!), Space O(n)
- **Intuition:** Build directed graph: course → prerequisites. Can finish iff no cycle. Use DFS: 0=unvisited, 1=visiting, 2=done. If we revisit a node in state 1, cycle exists.
- **Approach:** Build adjacency list (prereq → list of courses that depend on it, or reverse). DFS from each node; if during DFS we hit a node in "visiting" state, return false.
- **Java Solution:**

```java
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        for (int[] e : prerequisites) graph.get(e[1]).add(e[0]);
        int[] state = new int[numCourses];
        for (int i = 0; i < numCourses; i++) {
            if (hasCycle(i, graph, state)) return false;
        }
        return true;
    }

    private boolean hasCycle(int node, List<List<Integer>> graph, int[] state) {
        if (state[node] == 1) return true;
        if (state[node] == 2) return false;
        state[node] = 1;
        for (int next : graph.get(node)) {
            if (hasCycle(next, graph, state)) return true;
        }
        state[node] = 2;
        return false;
    }
}

// Runnable:
class Lc207 {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        for (int[] e : prerequisites) graph.get(e[1]).add(e[0]);
        int[] state = new int[numCourses];
        for (int i = 0; i < numCourses; i++) {
            if (hasCycle(i, graph, state)) return false;
        }
        return true;
    }
    private boolean hasCycle(int node, List<List<Integer>> graph, int[] state) {
        if (state[node] == 1) return true;
        if (state[node] == 2) return false;
        state[node] = 1;
        for (int next : graph.get(node)) {
            if (hasCycle(next, graph, state)) return true;
        }
        state[node] = 2;
        return false;
    }
    public static void main(String[] args) {
        System.out.println(new Lc207().canFinish(2, new int[][]{{1, 0}})); // true
        System.out.println(new Lc207().canFinish(2, new int[][]{{1, 0}, {0, 1}})); // false
    }
}
```

- **Complexity:** Time O(V + E), Space O(V)

---

### Hard (3 problems)

---

#### Problem: [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/) (LeetCode #124)

- **Brute Force:** For each node, recursively compute max path sums in left and right subtrees and try all combinations through that node; update global max. Time O(n²), Space O(h)
- **Intuition:** At each node, the max path through that node = node.val + max_gain(left) + max_gain(right). But when returning upward, we can only extend one path (left or right). Use a global max to track the best path seen.
- **Approach:** Post-order DFS. Compute max gain from left and right (ignore negative gains). Update global max with path through node. Return node.val + max(leftGain, rightGain) for parent.
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

// Runnable:
class Lc124 {
    static class TreeNode {
        int val; TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }
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
    public static void main(String[] args) {
        TreeNode root = new TreeNode(-10);
        root.left = new TreeNode(9);
        root.right = new TreeNode(20);
        root.right.left = new TreeNode(15);
        root.right.right = new TreeNode(7);
        System.out.println(new Lc124().maxPathSum(root)); // 42
    }
}
```

- **Complexity:** Time O(n), Space O(h)

---

#### Problem: [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) (LeetCode #297)

- **Brute Force:** Use level-order serialization with explicit null placeholders for a complete binary tree index, or store redundant structure. Time O(n), Space O(n)
- **Intuition:** Use pre-order DFS. Serialize: visit node, output value (or "X" for null). Deserialize: read token, if "X" return null; else create node, deserialize left, deserialize right.
- **Approach:** Pre-order with null markers. Split by delimiter (e.g. comma). Use an iterator or global index to consume tokens during deserialize.
- **Java Solution:**

```java
public class Codec {
    private static final String NULL = "X";
    private static final String DELIM = ",";

    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        build(root, sb);
        return sb.toString();
    }

    private void build(TreeNode node, StringBuilder sb) {
        if (node == null) {
            sb.append(NULL).append(DELIM);
            return;
        }
        sb.append(node.val).append(DELIM);
        build(node.left, sb);
        build(node.right, sb);
    }

    public TreeNode deserialize(String data) {
        return parse(new java.util.Iterator<String>() {
            final String[] arr = data.split(DELIM);
            int i = 0;
            public boolean hasNext() { return i < arr.length; }
            public String next() { return arr[i++]; }
        });
    }

    private TreeNode parse(java.util.Iterator<String> it) {
        if (!it.hasNext()) return null;
        String s = it.next();
        if (NULL.equals(s)) return null;
        TreeNode node = new TreeNode(Integer.parseInt(s));
        node.left = parse(it);
        node.right = parse(it);
        return node;
    }
}

// Runnable (using iterator via Deque for simplicity):
class Lc297 {
    static class TreeNode {
        int val; TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }
    static class Codec {
        static final String NULL = "X", DELIM = ",";
        public String serialize(TreeNode root) {
            StringBuilder sb = new StringBuilder();
            build(root, sb);
            return sb.toString();
        }
        void build(TreeNode node, StringBuilder sb) {
            if (node == null) { sb.append(NULL).append(DELIM); return; }
            sb.append(node.val).append(DELIM);
            build(node.left, sb);
            build(node.right, sb);
        }
        public TreeNode deserialize(String data) {
            java.util.Deque<String> q = new java.util.ArrayDeque<>(java.util.Arrays.asList(data.split(DELIM)));
            return parse(q);
        }
        TreeNode parse(java.util.Deque<String> q) {
            if (q.isEmpty()) return null;
            String s = q.poll();
            if (NULL.equals(s)) return null;
            TreeNode node = new TreeNode(Integer.parseInt(s));
            node.left = parse(q);
            node.right = parse(q);
            return node;
        }
    }
    public static void main(String[] args) {
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(2);
        root.right = new TreeNode(3);
        root.right.left = new TreeNode(4);
        root.right.right = new TreeNode(5);
        Codec c = new Codec();
        String s = c.serialize(root);
        System.out.println(s);
        TreeNode decoded = c.deserialize(s);
        System.out.println(decoded.val + "," + decoded.left.val + "," + decoded.right.val);
    }
}
```

- **Complexity:** Time O(n), Space O(n) for serialized string and recursion

---

#### Problem: [Alien Dictionary](https://leetcode.com/problems/alien-dictionary/) (LeetCode #269)

- **Brute Force:** Extract ordering rules from all pairs of words (not just adjacent), build a constraint graph, then try permutations or naive topological sort without cycle handling. Time O(n²×L), Space O(1)
- **Intuition:** From adjacent word pairs, extract character order rules: first differing char gives edge (a→b). Build graph, run DFS topological sort. If cycle exists, invalid order.
- **Approach:** Build graph: for each adjacent pair, find first differing char, add edge. DFS with 0/1/2 states. Post-order gives reverse topo order; reverse to get answer. Handle cycle detection.
- **Java Solution:**

```java
class Solution {
    private static final int UNVISITED = 0, VISITING = 1, DONE = 2;

    public String alienOrder(String[] words) {
        Map<Character, List<Character>> graph = new HashMap<>();
        Map<Character, Integer> state = new HashMap<>();
        for (String w : words)
            for (char c : w.toCharArray())
                graph.putIfAbsent(c, new ArrayList<>());
        for (int i = 0; i < words.length - 1; i++) {
            String a = words[i], b = words[i + 1];
            if (a.length() > b.length() && a.startsWith(b)) return "";
            int len = Math.min(a.length(), b.length());
            for (int j = 0; j < len; j++) {
                if (a.charAt(j) != b.charAt(j)) {
                    graph.get(a.charAt(j)).add(b.charAt(j));
                    break;
                }
            }
        }
        StringBuilder sb = new StringBuilder();
        for (char c : graph.keySet()) {
            if (dfs(c, graph, state, sb)) return "";
        }
        return sb.reverse().toString();
    }

    private boolean dfs(char c, Map<Character, List<Character>> graph,
                       Map<Character, Integer> state, StringBuilder sb) {
        if (state.getOrDefault(c, UNVISITED) == DONE) return false;
        if (state.getOrDefault(c, UNVISITED) == VISITING) return true;
        state.put(c, VISITING);
        for (char next : graph.get(c)) {
            if (dfs(next, graph, state, sb)) return true;
        }
        state.put(c, DONE);
        sb.append(c);
        return false;
    }
}

// Runnable:
class Lc269 {
    public String alienOrder(String[] words) {
        Map<Character, List<Character>> graph = new java.util.HashMap<>();
        Map<Character, Integer> state = new java.util.HashMap<>();
        for (String w : words)
            for (char c : w.toCharArray())
                graph.putIfAbsent(c, new java.util.ArrayList<>());
        for (int i = 0; i < words.length - 1; i++) {
            String a = words[i], b = words[i + 1];
            if (a.length() > b.length() && a.startsWith(b)) return "";
            for (int j = 0; j < Math.min(a.length(), b.length()); j++) {
                if (a.charAt(j) != b.charAt(j)) {
                    graph.get(a.charAt(j)).add(b.charAt(j));
                    break;
                }
            }
        }
        StringBuilder sb = new StringBuilder();
        for (char c : graph.keySet()) {
            if (dfs(c, graph, state, sb)) return "";
        }
        return sb.reverse().toString();
    }
    static final int U = 0, V = 1, D = 2;
    boolean dfs(char c, Map<Character, List<Character>> g, Map<Character, Integer> s, StringBuilder sb) {
        if (s.getOrDefault(c, U) == D) return false;
        if (s.getOrDefault(c, U) == V) return true;
        s.put(c, V);
        for (char n : g.get(c)) if (dfs(n, g, s, sb)) return true;
        s.put(c, D);
        sb.append(c);
        return false;
    }
    public static void main(String[] args) {
        System.out.println(new Lc269().alienOrder(new String[]{"wrt","wrf","er","ett","rftt"})); // wertf
    }
}
```

- **Complexity:** Time O(C) where C = total chars + edges, Space O(1) or O(26) for alphabet

---

## Common Mistakes

| Mistake | Fix |
|--------|-----|
| Forgetting to backtrack in path problems | Remove current element from path before returning (Path Sum II) |
| Using `<` and `>` instead of `<=` and `>=` for BST bounds | Use `node.val <= min || node.val >= max` to reject values outside (min, max) |
| Integer overflow in BST validation | Use `Long.MIN_VALUE` / `Long.MAX_VALUE` for initial bounds |
| Not handling prefix edge case in Alien Dictionary | If `"abc"` precedes `"ab"`, invalid order → return `""` |
| Modifying grid in-place without bounds check | Ensure `r >= 0 && r < rows` and similar for grid DFS |
| Graph DFS without visited/state | Directed graph: use 0/1/2 states; undirected: simple visited set |
| Wrong direction in Course Schedule graph | `prerequisites[i] = [a,b]` means a depends on b → edge b→a |
| Max Path Sum: not clipping negative gains | Use `Math.max(0, gain(child))` so we don't drag negative paths |
| Serialize: no null markers | Need explicit null (e.g. "X") to reconstruct tree structure |
| Stack overflow on deep tree | Use iterative DFS with explicit stack for very deep trees |

**Edge Cases:**
- Empty tree (`root == null`) → return appropriate base (0, null, empty list)
- Single node tree
- Skewed tree (O(n) recursion depth)
- Grid with single cell, all water, all land
- Course schedule: no prerequisites, all independent
- Alien: single word (empty order), identical adjacent words (no new edges)

## Pattern Variations

| Variation | Example | Key Technique |
|-----------|---------|---------------|
| **Pre-order** | Serialize (#297) | Process before children |
| **Post-order** | Max depth (#104), Invert (#226), Max path sum (#124) | Process after children, combine results |
| **In-order** | Validate BST (#98) — range check | Process between children; for BST gives sorted order |
| **Path + backtrack** | Path Sum II (#113) | Add to path, recurse, remove (backtrack) |
| **Grid DFS** | Number of Islands (#200) | 4-directional, mutate grid as visited |
| **Graph + cycle** | Course Schedule (#207) | 0/1/2 state, cycle ⇒ invalid |
| **Topological sort** | Course Schedule (#207), Alien (#269) | DFS post-order, reverse = topo |
| **LCA** | #236 | Return node if p or q found; both subtrees non-null ⇒ current is LCA |
| **Global/extra state** | Max Path Sum (#124) | Side-effect variable for best answer |
