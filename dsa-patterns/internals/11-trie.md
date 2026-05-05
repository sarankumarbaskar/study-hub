# Trie (Prefix Tree) — Interview Execution Playbook

> **Pattern Mastery Level:** Trie is the go-to data structure when "prefix" appears in ANY form. It appears in ~8% of FAANG coding rounds and is a near-guaranteed topic in system design rounds (autocomplete, spell-check, IP routing). If you can't build a Trie from scratch in 3 minutes, you'll lose the problem before you start solving it.

---

## 1. Pattern Recognition Signals

### When to Use a Trie

```
INSTANT TRIGGERS (say "Trie" within 5 seconds):
  ✓ "Prefix search" / "starts with" / "autocomplete"
  ✓ "Dictionary of words" + "search/match/validate"
  ✓ "Word search on a board" with multiple words
  ✓ "Replace words with shortest root/prefix"
  ✓ "Wildcard search" with '.' matching any character
  ✓ "Suggestions as you type" / "search suggestions"
  ✓ "Longest common prefix" across a set of strings
  ✓ "Sum of values for all keys with given prefix"
```

### Keywords in Problem Statements

```
DIRECT SIGNALS:              INDIRECT SIGNALS:
  "prefix"                     "dictionary" + "board"
  "autocomplete"               "word by word matching"
  "starts with"                "replace with shortest"
  "search suggestions"         "all words beginning with"
  "add and search words"       "common prefix"
  "word dictionary"            "type-ahead"
  "wildcard pattern"           "spell checker"
```

### When NOT to Use

```
✗ Exact string lookup only, no prefix queries → use HASHSET (O(1) average)
✗ Single string pattern matching → use KMP or RABIN-KARP
✗ Substring search (not prefix) → use SUFFIX ARRAY or SUFFIX TREE
✗ Small fixed dictionary + exact match → HASHMAP is simpler and faster
✗ Need sorted iteration of all keys → use TREEMAP
```

### Trie vs HashMap — The Critical Distinction

```
HASHMAP:                              TRIE:
  O(1) exact lookup                     O(L) exact lookup (L = key length)
  O(n) prefix search (scan all keys)    O(L) prefix search (traverse path)
  O(n) space (stores full keys)         O(Σ chars) space (shared prefixes)
  No prefix support natively            BUILT for prefix operations

RULE: If the problem involves ANY prefix operation, Trie wins.
      If it's pure exact match, HashMap wins.
```

---

## 2. Thinking Framework (Step-by-Step Intuition)

### The 60-Second Decision Process

```
Step 1: "Does this problem involve prefix-based operations on strings?"
  YES → Trie is almost certainly the right structure
  NO  → HashMap or HashSet is probably sufficient

Step 2: "What's the brute force?"
  Usually O(n·L) — scan all n strings per query, check prefix match
  Or O(words × m × n × 4^L) for word search on grid (per word DFS)

Step 3: "Why does Trie help?"
  Strings with common prefixes SHARE nodes → no redundant work
  Traversing "pre" in a Trie visits 3 nodes regardless of dictionary size
  All words starting with "pre" live in the same subtree → instant narrowing

Step 4: "Which variant do I need?"
  Basic insert/search/startsWith → STANDARD TRIE
  '.' wildcard matching → TRIE + RECURSIVE DFS (branch at wildcard)
  Multiple words on a grid → TRIE + BACKTRACKING (simultaneous traversal)
  Prefix replacement → TRIE + EARLY TERMINATION (stop at first isEnd)
  Prefix sum aggregation → TRIE + DELTA TRICK (store cumulative sums)
  Autocomplete/suggestions → TRIE + SORT + TOP-K AT EACH NODE
```

### The Core Insight (Memorize This)

```
TRIE WORKS BECAUSE:
  Shared prefixes share storage and traversal cost.
  
  Inserting "apple", "app", "application" creates ONE path for "app"
  with branches at the 4th character. Searching for "app*" traverses
  exactly 3 nodes, then the entire subtree contains ALL matches.
  
  Compare to HashMap: you'd scan ALL keys and check startsWith() on each.
  
  Trie converts O(n) prefix search into O(L) where L = prefix length.
  The number of stored strings is IRRELEVANT to query time.
```

### TrieNode Design Decision: Array vs HashMap

```
children[26] ARRAY:                  HashMap<Character, TrieNode>:
  ✓ O(1) child access                 ✓ O(1) child access (amortized)
  ✓ Cache-friendly, fast              ✗ Higher constant factor
  ✓ Simple index math (c - 'a')       ✓ Supports ANY character set
  ✗ Wastes space if sparse             ✓ Memory-efficient if sparse
  ✗ Only lowercase a-z                 ✓ Unicode, mixed case, digits

INTERVIEW DEFAULT: Use children[26]. Mention HashMap as alternative
if interviewer asks about character set flexibility.
```

---

## 3. Java Templates (Production-Quality)

### Template 1: TrieNode Class

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEnd = false;
}
```

### Template 2: Standard Trie (Insert, Search, StartsWith)

```java
// USE FOR: LeetCode 208, foundation for all Trie problems
// TIME: O(L) per operation | SPACE: O(N) total, N = sum of all chars inserted
class Trie {
    private final TrieNode root = new TrieNode();

    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null)
                node.children[i] = new TrieNode();
            node = node.children[i];
        }
        node.isEnd = true;
    }

    public boolean search(String word) {
        TrieNode node = traverse(word);
        return node != null && node.isEnd;
    }

    public boolean startsWith(String prefix) {
        return traverse(prefix) != null;
    }

    private TrieNode traverse(String s) {
        TrieNode node = root;
        for (char c : s.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) return null;
            node = node.children[i];
        }
        return node;
    }
}
```

### Template 3: Wildcard Search with '.' (Recursive DFS)

```java
// USE FOR: LeetCode 211 — '.' matches any single character
// TIME: O(L) without wildcards, O(26^W) worst case where W = number of '.' chars
public boolean searchWithWildcard(TrieNode node, String word, int idx) {
    if (idx == word.length()) return node.isEnd;
    char c = word.charAt(idx);
    if (c == '.') {
        for (TrieNode child : node.children) {
            if (child != null && searchWithWildcard(child, word, idx + 1))
                return true;
        }
        return false;
    }
    int i = c - 'a';
    if (node.children[i] == null) return false;
    return searchWithWildcard(node.children[i], word, idx + 1);
}
```

### Template 4: Trie + Backtracking (Word Search II)

```java
// USE FOR: LeetCode 212 — find all dictionary words on a board
// KEY TRICK: store word at end node to avoid StringBuilder; null it after adding to prevent duplicates
// TIME: O(m×n×4^L) worst case, but Trie prunes massively
private static final int[][] DIRS = {{0,1},{1,0},{0,-1},{-1,0}};

public void dfs(char[][] board, int r, int c, TrieNode node, List<String> result) {
    char ch = board[r][c];
    int i = ch - 'a';
    if (node.children[i] == null) return;
    node = node.children[i];
    if (node.word != null) {
        result.add(node.word);
        node.word = null; // deduplicate
    }
    board[r][c] = '#'; // mark visited
    for (int[] d : DIRS) {
        int nr = r + d[0], nc = c + d[1];
        if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length
                && board[nr][nc] != '#')
            dfs(board, nr, nc, node, result);
    }
    board[r][c] = ch; // backtrack
}
```

### Template 5: Shortest Prefix Lookup (Replace Words)

```java
// USE FOR: LeetCode 648 — find shortest root in Trie matching a word's prefix
// KEY TRICK: return as soon as isEnd is true (shortest prefix)
private String getShortestRoot(TrieNode root, String word) {
    TrieNode node = root;
    for (int i = 0; i < word.length(); i++) {
        int c = word.charAt(i) - 'a';
        if (node.children[c] == null) return word;
        node = node.children[c];
        if (node.isEnd) return word.substring(0, i + 1);
    }
    return word;
}
```

### Complexity Cheat Sheet

| Operation          | Time     | Space  | Notes                                  |
|--------------------|----------|--------|----------------------------------------|
| Insert             | O(L)     | O(L)   | L = word length, creates at most L nodes |
| Search / Prefix    | O(L)     | O(1)   | Traverse one path                      |
| Build from n words | O(N)     | O(N)   | N = total characters across all words  |
| Wildcard '.' search| O(26^W)  | O(L)   | W = number of wildcards, L = recursion |
| Autocomplete       | O(L + k) | O(k)   | L to reach prefix, k results collected |
| Word Search II     | O(m·n·4^L)| O(N)  | Trie prunes invalid branches early     |

---

## 4. Edge Case Checklist

```
INPUT EDGE CASES:
  □ Empty string → insert creates no nodes beyond root; search("") checks root.isEnd
  □ Single character words → Trie of depth 1, easy to miss in traversal
  □ All words share same prefix → deep single-path Trie (e.g., "a", "ab", "abc")
  □ No common prefix at all → Trie degenerates to 26-way first-level branch
  □ Duplicate inserts → inserting same word twice must be idempotent (isEnd already true)
  □ Case sensitivity → "Apple" vs "apple" — clarify with interviewer, default lowercase

SEARCH EDGE CASES:
  □ search("") → true only if empty string was inserted
  □ startsWith("") → always true (empty prefix matches everything)
  □ Search for word longer than any inserted word → returns false (hits null mid-traverse)
  □ Search for prefix of an inserted word → search returns false (isEnd not set), startsWith returns true

WILDCARD EDGE CASES:
  □ All wildcards "..." → DFS explores entire Trie, worst case O(26^L)
  □ "." at the end → must check isEnd on ALL children at that level
  □ Mixed "a.c" → concrete chars prune, '.' branches at its position only

WORD SEARCH II EDGE CASES:
  □ Same word findable via multiple paths → deduplicate (set node.word = null)
  □ Board has single cell → can only match single-char words
  □ Word longer than board cells → impossible, but Trie handles gracefully (no path)
  □ Backtracking: MUST restore board[r][c] after DFS returns

MAP SUM EDGE CASES:
  □ Overwriting existing key → must use delta (new - old), not just add
  □ Prefix not in Trie → return 0
```

---

## 5. Problem Progression (LeetCode)

### Level 1: Foundation — Build the Data Structure

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 208 | [Implement Trie](https://leetcode.com/problems/implement-trie-prefix-tree/) | Build the core: insert, search, startsWith. This IS your template. | O(L) |
| 14 | [Longest Common Prefix](https://leetcode.com/problems/longest-common-prefix/) | Insert all words, traverse while node has exactly 1 child and !isEnd | O(N) |

#### Problem: [Implement Trie](https://leetcode.com/problems/implement-trie-prefix-tree/) (LeetCode #208)

- **Brute Force:** Store strings in a list; search by scanning all strings; prefix check by iterating and calling startsWith(). Time O(n·L) per query; Space O(n·L).
- **Intuition:** This is THE foundational Trie problem. Build a tree where each edge represents a character. Shared prefixes share paths. Mark complete words with isEnd.
- **Approach:** 1) TrieNode with children[26] and isEnd. 2) insert: walk down creating nodes. 3) search: walk down, check isEnd. 4) startsWith: walk down, check non-null.
- **Java Solution:**

```java
class Trie {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isEnd = false;
    }

    private final TrieNode root = new TrieNode();

    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null)
                node.children[i] = new TrieNode();
            node = node.children[i];
        }
        node.isEnd = true;
    }

    public boolean search(String word) {
        TrieNode node = traverse(word);
        return node != null && node.isEnd;
    }

    public boolean startsWith(String prefix) {
        return traverse(prefix) != null;
    }

    private TrieNode traverse(String s) {
        TrieNode node = root;
        for (char c : s.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) return null;
            node = node.children[i];
        }
        return node;
    }
}
```

- **Complexity:** Time O(L) per operation; Space O(N) total where N = sum of all inserted characters

---

#### Problem: [Longest Common Prefix](https://leetcode.com/problems/longest-common-prefix/) (LeetCode #14)

- **Brute Force:** Compare characters column by column across all strings. Time O(N) where N = total chars; Space O(1).
- **Intuition:** Insert all words into a Trie. The longest common prefix is the path from root where every node has exactly one child AND is not the end of a shorter word. Alternatively, solve without Trie by vertical scanning, but Trie approach generalizes to dynamic insert/query.
- **Approach:** 1) Insert all words. 2) From root, walk down while current node has exactly 1 non-null child and isEnd is false. 3) The path traversed is the LCP.
- **Java Solution:**

```java
class Solution {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isEnd = false;
        int childCount = 0;
    }

    public String longestCommonPrefix(String[] strs) {
        if (strs.length == 0) return "";
        TrieNode root = new TrieNode();
        for (String s : strs) {
            if (s.isEmpty()) return "";
            TrieNode node = root;
            for (char c : s.toCharArray()) {
                int i = c - 'a';
                if (node.children[i] == null) {
                    node.children[i] = new TrieNode();
                    node.childCount++;
                }
                node = node.children[i];
            }
            node.isEnd = true;
        }
        StringBuilder sb = new StringBuilder();
        TrieNode node = root;
        while (node.childCount == 1 && !node.isEnd) {
            for (int i = 0; i < 26; i++) {
                if (node.children[i] != null) {
                    sb.append((char) ('a' + i));
                    node = node.children[i];
                    break;
                }
            }
        }
        return sb.toString();
    }
}
```

- **Complexity:** Time O(N) where N = total chars across all strings; Space O(N) for Trie
- **Note:** The simpler vertical scan approach (O(N) time, O(1) space) is preferred in interviews for this specific problem. The Trie approach is useful when you need repeated LCP queries on a dynamic set.

---

### Level 2: Wildcard & Prefix Operations

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 211 | [Add and Search Words](https://leetcode.com/problems/design-add-and-search-words-data-structure/) | '.' wildcard → recursive DFS branching into all 26 children | O(26^W) |
| 648 | [Replace Words](https://leetcode.com/problems/replace-words/) | Stop at FIRST isEnd during traversal → shortest root prefix | O(D + S) |
| 677 | [Map Sum Pairs](https://leetcode.com/problems/map-sum-pairs/) | Store cumulative sum at each node; use delta for overwrites | O(L) |

#### Problem: [Design Add and Search Words](https://leetcode.com/problems/design-add-and-search-words-data-structure/) (LeetCode #211)

- **Brute Force:** Store words in a list; for search with '.', check all words character by character. Time O(n·L); Space O(n·L).
- **Intuition:** Standard Trie insert. The twist: search supports '.' as wildcard matching ANY character. When traversal hits '.', recursively try ALL 26 children. Non-wildcard characters follow the normal single path.
- **Approach:** 1) Standard insert. 2) Recursive search: if char is '.', loop all non-null children and recurse; if any returns true, return true. Otherwise follow the single child.
- **Java Solution:**

```java
class WordDictionary {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isEnd = false;
    }

    private final TrieNode root = new TrieNode();

    public void addWord(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) node.children[i] = new TrieNode();
            node = node.children[i];
        }
        node.isEnd = true;
    }

    public boolean search(String word) {
        return dfs(root, word, 0);
    }

    private boolean dfs(TrieNode node, String word, int idx) {
        if (idx == word.length()) return node.isEnd;
        char c = word.charAt(idx);
        if (c == '.') {
            for (TrieNode child : node.children) {
                if (child != null && dfs(child, word, idx + 1)) return true;
            }
            return false;
        }
        int i = c - 'a';
        if (node.children[i] == null) return false;
        return dfs(node.children[i], word, idx + 1);
    }
}
```

- **Complexity:** Time O(L) insert; O(26^W) search worst case where W = number of '.' wildcards; Space O(N) for Trie

---

#### Problem: [Replace Words](https://leetcode.com/problems/replace-words/) (LeetCode #648)

- **Brute Force:** For each word in sentence, check every dictionary root as prefix, pick shortest. Time O(D·S·k); Space O(1).
- **Intuition:** Build Trie from dictionary roots. For each word in the sentence, traverse the Trie. The moment we hit a node with isEnd = true, we've found the shortest root — return that prefix immediately. If we exhaust the word without hitting isEnd, no root matches.
- **Approach:** 1) Insert all roots into Trie. 2) For each word, walk the Trie; return prefix at first isEnd. 3) If no match, keep original word.
- **Java Solution:**

```java
class Solution {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isEnd = false;
    }

    public String replaceWords(List<String> dictionary, String sentence) {
        TrieNode root = new TrieNode();
        for (String r : dictionary) {
            TrieNode node = root;
            for (char c : r.toCharArray()) {
                int i = c - 'a';
                if (node.children[i] == null) node.children[i] = new TrieNode();
                node = node.children[i];
            }
            node.isEnd = true;
        }
        StringBuilder sb = new StringBuilder();
        for (String word : sentence.split(" ")) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(findRoot(root, word));
        }
        return sb.toString();
    }

    private String findRoot(TrieNode root, String word) {
        TrieNode node = root;
        for (int i = 0; i < word.length(); i++) {
            int c = word.charAt(i) - 'a';
            if (node.children[c] == null) return word;
            node = node.children[c];
            if (node.isEnd) return word.substring(0, i + 1);
        }
        return word;
    }
}
```

- **Complexity:** Time O(D + S) where D = sum of dictionary char lengths, S = sentence length; Space O(D) for Trie

---

#### Problem: [Map Sum Pairs](https://leetcode.com/problems/map-sum-pairs/) (LeetCode #677)

- **Brute Force:** Store key-value in a HashMap; for sum(prefix), iterate all keys and sum values where key.startsWith(prefix). Time O(n·L) per sum; Space O(n·L).
- **Intuition:** We need O(L) prefix sum queries. Store cumulative sums along the Trie path — each node holds the sum of all values passing through it. When a key is overwritten, compute delta = newVal - oldVal and propagate the delta along the path.
- **Approach:** 1) HashMap tracks inserted key→value for delta computation. 2) On insert, compute delta and add it to every node along the path. 3) sum(prefix): just traverse to the prefix node and return its stored value.
- **Java Solution:**

```java
class MapSum {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        int val = 0;
    }

    private final TrieNode root = new TrieNode();
    private final Map<String, Integer> seen = new HashMap<>();

    public void insert(String key, int val) {
        int delta = val - seen.getOrDefault(key, 0);
        seen.put(key, val);
        TrieNode node = root;
        for (char c : key.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) node.children[i] = new TrieNode();
            node = node.children[i];
            node.val += delta;
        }
    }

    public int sum(String prefix) {
        TrieNode node = root;
        for (char c : prefix.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) return 0;
            node = node.children[i];
        }
        return node.val;
    }
}
```

- **Complexity:** Time O(L) insert and sum; Space O(N) for Trie + O(K) for HashMap where K = distinct keys

---

### Level 3: Trie + DFS/Backtracking — FAANG Favorite

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 212 | [Word Search II](https://leetcode.com/problems/word-search-ii/) | Trie + backtracking; search ALL words simultaneously via shared Trie traversal | O(m·n·4^L) |

#### Problem: [Word Search II](https://leetcode.com/problems/word-search-ii/) (LeetCode #212)

- **Brute Force:** For each word, run Word Search I (DFS from every cell). Time O(words × m × n × 4^L). Repeats work for words sharing prefixes.
- **Intuition:** Build a Trie from ALL dictionary words. DFS from every board cell, but instead of checking one word at a time, walk the Trie simultaneously. The Trie prunes dead ends — if no word starts with the current path, stop. When a node has word != null, we found a match. This searches ALL words in a single board traversal.
- **Approach:** 1) Build Trie; store full word string at end node (avoids StringBuilder). 2) For each cell (i,j), start DFS if root has matching child. 3) DFS: mark cell visited with '#', check all 4 directions, restore on backtrack. 4) Set node.word = null after finding to deduplicate.
- **Why Trie + Backtracking?** Without Trie: O(W × m × n × 4^L). With Trie: O(m × n × 4^L) because all W words share one traversal. Words sharing prefixes like "oath" and "oat" reuse the same DFS path up to divergence.
- **Java Solution:**

```java
class Solution {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        String word = null; // store full word to avoid StringBuilder
    }

    private static final int[][] DIRS = {{0,1},{1,0},{0,-1},{-1,0}};

    public List<String> findWords(char[][] board, String[] words) {
        TrieNode root = new TrieNode();
        for (String w : words) {
            TrieNode node = root;
            for (char c : w.toCharArray()) {
                int i = c - 'a';
                if (node.children[i] == null) node.children[i] = new TrieNode();
                node = node.children[i];
            }
            node.word = w;
        }
        List<String> result = new ArrayList<>();
        for (int i = 0; i < board.length; i++) {
            for (int j = 0; j < board[0].length; j++) {
                dfs(board, i, j, root, result);
            }
        }
        return result;
    }

    private void dfs(char[][] board, int r, int c, TrieNode node, List<String> result) {
        char ch = board[r][c];
        int i = ch - 'a';
        if (node.children[i] == null) return;
        node = node.children[i];
        if (node.word != null) {
            result.add(node.word);
            node.word = null;
        }
        board[r][c] = '#';
        for (int[] d : DIRS) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length
                    && board[nr][nc] != '#')
                dfs(board, nr, nc, node, result);
        }
        board[r][c] = ch;
    }
}
```

- **Complexity:** Time O(m × n × 4^L) — Trie prunes massively in practice; Space O(W·L) for Trie where W = number of words, L = max word length

---

### Level 4: Autocomplete & Suggestions

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 1268 | [Search Suggestions System](https://leetcode.com/problems/search-suggestions-system/) | Sort products first; store top 3 at each Trie node during insert | O(m + n·L) |

#### Problem: [Search Suggestions System](https://leetcode.com/problems/search-suggestions-system/) (LeetCode #1268)

- **Brute Force:** For each prefix of searchWord, filter all products, sort, take first 3. Time O(n·L·log(n)) per prefix; Space O(n).
- **Intuition:** For each character typed, return the 3 lexicographically smallest products matching the current prefix. If we sort products first and build a Trie, we can store at most 3 suggestions at each node during insertion (since sorted order guarantees the first 3 arrivals at any node ARE the lex-smallest).
- **Approach:** 1) Sort products. 2) Build Trie; at each node, store up to 3 product strings. 3) For each prefix character of searchWord, traverse one step and return the node's suggestions list.
- **Java Solution:**

```java
class Solution {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        List<String> suggestions = new ArrayList<>();
    }

    public List<List<String>> suggestedProducts(String[] products, String searchWord) {
        Arrays.sort(products);
        TrieNode root = new TrieNode();
        for (String p : products) {
            TrieNode node = root;
            for (char c : p.toCharArray()) {
                int i = c - 'a';
                if (node.children[i] == null) node.children[i] = new TrieNode();
                node = node.children[i];
                if (node.suggestions.size() < 3) node.suggestions.add(p);
            }
        }
        List<List<String>> result = new ArrayList<>();
        TrieNode node = root;
        for (char c : searchWord.toCharArray()) {
            int i = c - 'a';
            if (node != null) node = node.children[i];
            result.add(node == null ? List.of() : node.suggestions);
        }
        return result;
    }
}
```

- **Complexity:** Time O(n·log(n) + M + L) where M = total product chars for Trie build, L = searchWord length for query; Space O(M) for Trie
- **Alternative:** Binary search approach (O(n·log(n) + L·log(n))) is also valid and uses less space.

---

### Solving Order for Maximum Learning

```
Day 1: 208 (build the Trie from scratch — this is your foundation)
Day 2: 211 (add wildcard DFS — understand the recursion branching)
Day 3: 648 → 677 (prefix operations — shortest root, prefix sums)
Day 4: 212 (Trie + backtracking — the FAANG hard problem)
Day 5: 1268 → 14 (autocomplete and LCP — Trie applications)
Day 6: Re-solve 208, 211, 212 WITHOUT any notes (test recall)
```

---

## 6. Common Mistakes & Interview Traps

### Mistake 1: Confusing search() and startsWith()

```
WRONG: search("app") returns true when only "apple" was inserted
  search() checks node.isEnd — "app" path exists but isEnd is false
  startsWith("app") returns true — the PREFIX exists

This is the #1 beginner mistake. Interviewers test this explicitly.
  "What's the difference between search and startsWith?"
  → search requires isEnd = true; startsWith only requires the path to exist.
```

### Mistake 2: Word Search II Duplicates

```
WRONG: "oath" appears twice in result because two board paths spell it

FIX: Set node.word = null AFTER adding to result
  if (node.word != null) {
      result.add(node.word);
      node.word = null;  // THIS LINE prevents duplicates
  }

Alternative: use a HashSet for results, but nullifying is cleaner and O(1).
```

### Mistake 3: Forgetting Backtracking in Word Search II

```
WRONG: board[r][c] = '#' but never restored
  → subsequent DFS calls from other starting cells see corrupted board

CORRECT:
  board[r][c] = '#';     // mark visited BEFORE recursion
  // ... recurse 4 directions ...
  board[r][c] = ch;      // restore AFTER recursion (backtrack)

This is standard backtracking. Forgetting it = instant fail.
```

### Mistake 4: Map Sum Overwrite Bug

```
WRONG: insert("apple", 3) then insert("apple", 5) → sum("app") returns 8
  You added 3, then added 5 on top of it, but should have REPLACED.

CORRECT: Track previously inserted value, compute delta
  int delta = val - seen.getOrDefault(key, 0);  // 5 - 3 = 2
  Then add delta (not val) to each node along the path.
  sum("app") correctly returns 5.
```

### Mistake 5: children[26] Index Out of Bounds

```
WRONG: int i = c - 'a'; with uppercase or non-letter input
  'A' - 'a' = -32 → ArrayIndexOutOfBoundsException

ALWAYS clarify character set with interviewer.
Default assumption: lowercase a-z only → children[26] is safe.
If mixed: use HashMap<Character, TrieNode> instead.
```

### Mistake 6: Not Pruning in Word Search II

```
SUBOPTIMAL: DFS continues even when no word in Trie starts with current path
  The whole point of using Trie is to PRUNE:
    if (node.children[i] == null) return;  // THIS LINE is the pruning
  
  Without this check, Trie gives no benefit over brute force.

ADVANCED OPTIMIZATION: After finding all words under a subtree,
  remove the subtree to prevent future useless traversal.
```

### What Interviewers Actually Look For

```
JUNIOR:    Can implement basic Trie (insert, search, startsWith)
SENIOR:    Handles wildcard search, explains Trie vs HashMap trade-off,
           implements Word Search II with correct backtracking + dedup
STAFF:     Discusses space optimization (compressed Trie), when NOT to use
           Trie, alternative approaches (binary search for suggestions),
           and can extend to system design (autocomplete at scale)
```

---

## 7. Interview Strategy

### Target Solving Times

```
Easy (Implement Trie, LCP):                5-8 minutes
Medium (Add/Search Words, Replace Words):   10-15 minutes
Hard (Word Search II):                      15-20 minutes

If you're taking longer, you haven't memorized the TrieNode template.
The Trie structure should flow from muscle memory — your thinking time
should be on the PROBLEM LOGIC, not the data structure mechanics.
```

### How to Explain Your Approach (Script)

```
STEP 1 (30 seconds): State the brute force
  "Brute force: for each query, scan all N strings and check prefix match.
   That's O(N·L) per query."

STEP 2 (30 seconds): Identify why Trie helps
  "A Trie lets strings with shared prefixes share storage and traversal.
   Searching for any prefix is O(L) regardless of how many strings exist.
   This is optimal — we can't do better than reading the prefix itself."

STEP 3 (15 seconds): Confirm design decisions
  "I'll use children[26] for lowercase letters and a boolean isEnd flag.
   For this problem I also need [wildcard DFS / word storage / sum tracking]."

STEP 4: Code (5-10 minutes)
  Write TrieNode first, then the main logic.

STEP 5 (30 seconds): Walk through example
  "Inserting 'apple': root→a→p→p→l→e(isEnd=true).
   search('app'): traverse root→a→p→p, isEnd=false → return false.
   startsWith('app'): node is not null → return true."
```

### Follow-Up Questions Interviewers Ask

```
Q: "Why not use a HashMap instead of a Trie?"
A: "HashMap gives O(1) exact lookup but O(n) for prefix queries — you'd scan
    all keys. Trie gives O(L) for prefix queries. If the problem requires
    any prefix operation, Trie is strictly better."

Q: "What about space? Trie uses more memory."
A: "Each TrieNode has 26 pointers (26 × 8 bytes = 208 bytes on 64-bit JVM).
    For sparse data, a HashMap<Character, TrieNode> per node saves space.
    For dense data (many shared prefixes), Trie actually uses LESS space
    than storing full strings in a HashMap."

Q: "How would you scale autocomplete to millions of queries?"
A: "Trie stored in a distributed system. Each node can store a top-K list
    (precomputed). For real-time ranking, combine Trie prefix lookup with
    a priority queue weighted by frequency/recency. At Google scale,
    you'd shard by first 2-3 characters and use caching aggressively."

Q: "Can you optimize Word Search II further?"
A: "Yes — after all words in a subtree are found, prune that subtree from
    the Trie. Also, I can count children per node and remove leaf nodes
    as words are found, reducing future DFS work progressively."

Q: "What if characters aren't just lowercase a-z?"
A: "Switch children[26] to HashMap<Character, TrieNode>. Same time
    complexity, handles any character set. Trade-off: slightly higher
    constant factor due to hashing overhead."
```

---

## 8. Revision Strategy + Quick Reference

### Weekly Revision Plan

```
WEEK 1: Solve all 7 problems from scratch. Time yourself.
WEEK 2: Re-solve 208, 211, 212 only (the three core patterns).
WEEK 3: Solve 212 (Word Search II) from memory with no notes — this is the hardest.
WEEK 4: Mix Trie with other patterns (Trie + BFS for suggestions, Trie + DP for word break).
```

### What to Memorize vs Understand

```
MEMORIZE:
  ✓ TrieNode class (children[26], isEnd) — 3 lines, must be instant
  ✓ insert() / traverse() templates — identical across ALL Trie problems
  ✓ Wildcard DFS: if c == '.', loop all children and recurse
  ✓ Word Search II: store word at node, null after adding, backtrack board

UNDERSTAND (derive each time):
  ✓ WHY Trie beats HashMap for prefixes (shared path = shared work)
  ✓ WHY sorted insert gives lex-smallest suggestions (1268)
  ✓ WHY delta trick works for Map Sum (cumulative sums stay correct)
  ✓ HOW Trie prunes Word Search II (dead branches = no matching words)
  ✓ WHEN to use array vs HashMap for children (character set dependent)
```

### Signals That Indicate Mastery

```
□ You see "prefix" or "starts with" and IMMEDIATELY think "Trie" (< 5 seconds)
□ You can write TrieNode + insert + search + startsWith in under 3 minutes cold
□ You can implement wildcard search (211) without looking at anything
□ You can solve Word Search II (212) with correct backtracking + dedup in 15 minutes
□ You can explain Trie vs HashMap trade-offs fluently to an interviewer
□ You can extend Trie to handle autocomplete ranking, Map Sum, and prefix replacement
□ You never forget isEnd check in search() or backtrack in Word Search II
```

---

## Quick Reference Card (Print This)

```
PATTERN              TEMPLATE / KEY TRICK                          TIME       SPACE
──────────────────────────────────────────────────────────────────────────────────────
Basic Trie           children[26] + isEnd, traverse helper         O(L)       O(N)
Wildcard search      '.' → DFS all 26 children                    O(26^W)    O(L)
Shortest prefix      Stop at first isEnd during traversal          O(L)       O(D)
Prefix sum           Delta trick: newVal - oldVal at each node     O(L)       O(N)
Word Search II       Trie + backtracking, word at node, null dedup O(mn·4^L)  O(WL)
Autocomplete         Sort first, store top-3 at each node          O(M+L)    O(M)
Longest common pfx   Walk while childCount==1 && !isEnd            O(N)       O(N)

TRIENODE: TrieNode[] children = new TrieNode[26]; boolean isEnd = false;
INSERT:   walk + create nodes + set isEnd
SEARCH:   walk + check isEnd (NOT just non-null)
PREFIX:   walk + check non-null (isEnd doesn't matter)

DECISION: prefix operations → TRIE | exact lookup only → HASHMAP | pattern match → KMP
```
