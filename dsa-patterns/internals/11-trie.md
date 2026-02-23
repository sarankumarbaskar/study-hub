# Trie (Prefix Tree)

> Store strings as paths in a tree—share common prefixes, then branch. Enables O(L) insert/search and efficient prefix lookups for autocomplete, spell-check, and word games.

## What Is This Pattern?

A **Trie** (pronounced "try") is a tree-shaped data structure for storing strings. Each node represents a character; paths from root to leaf spell out words. The key insight: **strings with common prefixes share the same path** until they diverge. This compression makes prefix queries extremely efficient—you traverse only the relevant path instead of scanning all stored strings.

Unlike a hash map, a Trie supports **prefix-based operations**: "find all words starting with 'pre'", "longest common prefix", or "autocomplete suggestions". Each node typically has 26 children (for lowercase letters) or 2 children (for binary bits). A flag marks whether a node represents the end of a complete word.

Variations include: **binary Trie** for XOR problems (each node has 0/1 children), **compressed Trie** (merge single-child chains), and **suffix Trie** (store suffixes for pattern matching). The core pattern remains: build the tree by inserting, then traverse to search or collect results.

## When to Use This Pattern

- Problem involves **prefix matching**, **autocomplete**, or **"starts with"** queries.
- Need to efficiently **store and search** many strings with shared prefixes.
- Problem asks for **suggestions** based on partial input, **replace prefixes**, or **word validation**.
- Working with **binary representations** and need maximum XOR (binary Trie with 0/1 children).
- Problem has **dictionary of words** and board/grid search (Trie + DFS).
- Phrases like "search suggestions", "prefix", "word search", "maximum XOR", "replace words".

## How to Identify This Pattern

```
Do we have a set of strings (words, keys)?
    NO → Consider hash map or other structure
    YES ↓

Do we need prefix-based queries or shared-prefix optimization?
    NO → Hash set/map might suffice
    YES ↓

Are we doing autocomplete, "starts with", or suggestions?
    YES → TRIE

Do we need maximum XOR of two numbers?
    YES → BINARY TRIE (0/1 children)

Do we search a grid/board for dictionary words?
    YES → TRIE + DFS/BACKTRACKING
```

## Core Template (Pseudocode)

### Standard Trie Node

```
NODE:
    children: Map or Array[26]  // next character → child node
    isWord: boolean             // marks end of complete word
```

### Insert

```
FUNCTION insert(word):
    node = root
    FOR each char c IN word:
        IF node.children[c] is null:
            node.children[c] = new Node()
        node = node.children[c]
    node.isWord = true
```

### Search (Exact)

```
FUNCTION search(word):
    node = traverse(word)
    RETURN node != null AND node.isWord
```

### Search (Prefix)

```
FUNCTION startsWith(prefix):
    node = traverse(prefix)
    RETURN node != null
```

### Traverse Helper

```
FUNCTION traverse(s):
    node = root
    FOR each char c IN s:
        IF node.children[c] is null:
            RETURN null
        node = node.children[c]
    RETURN node
```

## Core Template (Java)

### TrieNode Class

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isWord = false;
}
```

### Trie Class (Insert, Search, startsWith)

```java
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
        node.isWord = true;
    }

    public boolean search(String word) {
        TrieNode node = traverse(word);
        return node != null && node.isWord;
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

## Complexity Cheat Sheet

| Operation        | Time      | Space  | Notes                                  |
|------------------|-----------|--------|----------------------------------------|
| Insert           | O(L)      | O(L)   | L = word length                         |
| Search / Prefix  | O(L)      | O(1)   | Traverse one path                       |
| Build from n words | O(N)    | O(N)   | N = sum of all word lengths             |
| Autocomplete     | O(L + k)  | O(k)   | L to reach prefix, k results            |
| Binary Trie (XOR)| O(32n)    | O(32n) | 32 bits per number, n numbers           |

## Problems (Progressive Difficulty)

### Easy (2 problems)

#### Problem: [Implement Trie](https://leetcode.com/problems/implement-trie-prefix-tree/) (LeetCode #208)

- **Brute Force:** Store strings in a list or set; search/prefix by scanning all strings. Time O(n·L) per operation, Space O(n).
- **Intuition:** Standard Trie: insert builds the path char by char; search returns true only if we reach a node with `isWord`; startsWith returns true if we can traverse the full prefix.
- **Approach:** 1) TrieNode with children[26] and isWord. 2) insert: traverse, create nodes as needed, set isWord at end. 3) search: traverse and check isWord. 4) startsWith: traverse and check non-null.
- **Java Solution:**

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isWord = false;
}

class Trie {
    private final TrieNode root = new TrieNode();

    public Trie() {}

    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null)
                node.children[i] = new TrieNode();
            node = node.children[i];
        }
        node.isWord = true;
    }

    public boolean search(String word) {
        TrieNode node = traverse(word);
        return node != null && node.isWord;
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

- **Complexity:** Time O(L) per operation, Space O(N) where N = total chars inserted

---

#### Problem: [Search Suggestions System](https://leetcode.com/problems/search-suggestions-system/) (LeetCode #1268)

- **Brute Force:** For each prefix of searchWord, filter products that start with it, sort, take first 3. Time O(m·L + n·L²), Space O(m).
- **Intuition:** For each character typed, we need the 3 lexicographically smallest products that have the current string as prefix. Build a Trie, store sorted suggestions at each node (or DFS to collect when needed).
- **Approach:** 1) Build Trie from products (sorted). 2) For each prefix of searchWord, traverse Trie and collect up to 3 words via DFS (lexicographical order).
- **Java Solution:**

```java
class Solution {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        java.util.List<String> suggestions = new java.util.ArrayList<>();
    }

    public java.util.List<java.util.List<String>> suggestedProducts(String[] products, String searchWord) {
        TrieNode root = new TrieNode();
        java.util.Arrays.sort(products);
        for (String p : products) {
            TrieNode node = root;
            for (char c : p.toCharArray()) {
                int i = c - 'a';
                if (node.children[i] == null) node.children[i] = new TrieNode();
                node = node.children[i];
                if (node.suggestions.size() < 3) node.suggestions.add(p);
            }
        }
        var result = new java.util.ArrayList<java.util.List<String>>();
        TrieNode node = root;
        for (char c : searchWord.toCharArray()) {
            int i = c - 'a';
            if (node != null) node = node.children[i];
            result.add(node == null ? java.util.List.of() : node.suggestions);
        }
        return result;
    }
}
```

- **Complexity:** Time O(m + n·L) where m = products total chars, n = products count, L = searchWord length; Space O(m)

---

### Medium (4 problems)

#### Problem: [Design Add and Search Words](https://leetcode.com/problems/design-add-and-search-words-data-structure/) (LeetCode #211)

- **Brute Force:** Store words in a list; for search with '.', try all 26 chars at wildcard positions via DFS. Time O(n·26^L) worst case for many wildcards, Space O(N).
- **Intuition:** Same as Trie but search supports '.' as wildcard. When we hit '.', try all 26 children via recursive/iterative DFS.
- **Approach:** 1) Standard insert. 2) search: if char is '.', recursively search all non-null children; else follow the single child.
- **Java Solution:**

```java
class WordDictionary {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isWord = false;
    }

    private final TrieNode root = new TrieNode();

    public WordDictionary() {}

    public void addWord(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) node.children[i] = new TrieNode();
            node = node.children[i];
        }
        node.isWord = true;
    }

    public boolean search(String word) {
        return search(root, word, 0);
    }

    private boolean search(TrieNode node, String word, int idx) {
        if (idx == word.length()) return node.isWord;
        char c = word.charAt(idx);
        if (c == '.') {
            for (TrieNode child : node.children) {
                if (child != null && search(child, word, idx + 1)) return true;
            }
            return false;
        }
        int i = c - 'a';
        if (node.children[i] == null) return false;
        return search(node.children[i], word, idx + 1);
    }
}
```

- **Complexity:** Time O(N) insert, O(26^L) worst-case search with '.'; Space O(N)

---

#### Problem: [Replace Words](https://leetcode.com/problems/replace-words/) (LeetCode #648)

- **Brute Force:** For each word, check each dictionary root as prefix and use shortest match. Time O(D·S·k) where k = max root length, Space O(1).
- **Intuition:** Given a dictionary of roots and a sentence, replace each word with its shortest root if one exists. Build Trie from roots, then for each word find the shortest prefix that is a root.
- **Approach:** 1) Insert all roots into Trie. 2) For each word, traverse Trie; as soon as we hit isWord, return that prefix. 3) If no root found, use original word.
- **Java Solution:**

```java
class Solution {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isWord = false;
    }

    public String replaceWords(java.util.List<String> dictionary, String sentence) {
        TrieNode root = new TrieNode();
        for (String r : dictionary) {
            TrieNode node = root;
            for (char c : r.toCharArray()) {
                int i = c - 'a';
                if (node.children[i] == null) node.children[i] = new TrieNode();
                node = node.children[i];
            }
            node.isWord = true;
        }
        var sb = new StringBuilder();
        for (String word : sentence.split(" ")) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(getShortestRoot(root, word));
        }
        return sb.toString();
    }

    private String getShortestRoot(TrieNode root, String word) {
        TrieNode node = root;
        for (int i = 0; i < word.length(); i++) {
            int c = word.charAt(i) - 'a';
            if (node.children[c] == null) return word;
            node = node.children[c];
            if (node.isWord) return word.substring(0, i + 1);
        }
        return word;
    }
}
```

- **Complexity:** Time O(D + S) where D = sum of dictionary lengths, S = sentence length; Space O(D)

---

#### Problem: [Map Sum Pairs](https://leetcode.com/problems/map-sum-pairs/) (LeetCode #677)

- **Brute Force:** Store key-value in a map; for sum(prefix), iterate all keys and sum values whose key starts with prefix. Time O(n·L) per sum call, Space O(N).
- **Intuition:** Insert key-value pairs; sum(prefix) returns sum of values for all keys with that prefix. Store value at the end node; for sum, traverse to prefix node then DFS to sum all values in subtree.
- **Approach:** 1) TrieNode stores value (default 0). 2) insert: if key exists, we need to update—store delta or re-insert. LeetCode allows overwrite. 3) sum: traverse to prefix node, DFS sum all isWord values (or store sum at each node for O(L) sum).
- **Java Solution:**

```java
class MapSum {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        int val = 0;
    }

    private final TrieNode root = new TrieNode();
    private final java.util.Map<String, Integer> seen = new java.util.HashMap<>();

    public MapSum() {}

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

- **Complexity:** Time O(L) per operation; Space O(N)

---

#### Problem: [Maximum XOR of Two Numbers](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/) (LeetCode #421)

- **Brute Force:** Try all pairs of numbers, compute XOR, return maximum. Time O(n²), Space O(1).
- **Intuition:** For each number, we want the other number that maximizes XOR. XOR is maximized when bits differ. Use a **binary Trie**: each node has children for bit 0 and 1. Insert all numbers as 31-bit paths. For each number, traverse greedily taking the opposite bit when available.
- **Approach:** 1) Build binary Trie with numbers (bits from MSB to LSB). 2) For each number, traverse: prefer child for (1 - currentBit) to maximize XOR; else take same bit. 3) Track max XOR.
- **Java Solution:**

```java
class Solution {
    static class TrieNode {
        TrieNode[] children = new TrieNode[2];
    }

    public int findMaximumXOR(int[] nums) {
        TrieNode root = new TrieNode();
        for (int x : nums) {
            TrieNode node = root;
            for (int i = 30; i >= 0; i--) {
                int b = (x >> i) & 1;
                if (node.children[b] == null) node.children[b] = new TrieNode();
                node = node.children[b];
            }
        }
        int max = 0;
        for (int x : nums) {
            TrieNode node = root;
            int xor = 0;
            for (int i = 30; i >= 0; i--) {
                int b = (x >> i) & 1;
                int toggle = 1 - b;
                if (node.children[toggle] != null) {
                    xor |= (1 << i);
                    node = node.children[toggle];
                } else {
                    node = node.children[b];
                }
            }
            max = Math.max(max, xor);
        }
        return max;
    }
}
```

- **Complexity:** Time O(32n) = O(n), Space O(32n)

---

### Hard (2 problems)

#### Problem: [Word Search II](https://leetcode.com/problems/word-search-ii/) (LeetCode #212)

- **Brute Force:** For each word, run Word Search I (DFS from each cell). Time O(words·mn·4^L), Space O(L).
- **Intuition:** Find all words from dictionary that exist on the board. Bruteforce: for each word, run Word Search I—O(words × m × n × 4^L). Better: build Trie from words, then DFS from each cell, traversing Trie simultaneously. When we hit a word node, add to result.
- **Approach:** 1) Build Trie, store word at end node (to avoid StringBuilder). 2) For each cell (i,j), if root has child for board[i][j], DFS. 3) DFS: mark visited (e.g. board[i][j]='#'), if node.isWord add word and set to null to avoid duplicates. Recurse 4 directions. Backtrack.
- **Java Solution:**

```java
class Solution {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        String word = null;
    }

    private static final int[][] DIRS = {{0,1},{1,0},{0,-1},{-1,0}};

    public java.util.List<String> findWords(char[][] board, String[] words) {
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
        var result = new java.util.ArrayList<String>();
        for (int i = 0; i < board.length; i++) {
            for (int j = 0; j < board[0].length; j++) {
                dfs(board, i, j, root, result);
            }
        }
        return result;
    }

    private void dfs(char[][] board, int r, int c, TrieNode node, java.util.List<String> result) {
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
            if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length && board[nr][nc] != '#')
                dfs(board, nr, nc, node, result);
        }
        board[r][c] = ch;
    }
}
```

- **Complexity:** Time O(m×n×4^L) worst case; Space O(sum of word lengths)

---

#### Problem: [Palindrome Pairs](https://leetcode.com/problems/palindrome-pairs/) (LeetCode #336)

- **Brute Force:** Try all pairs (i,j), concatenate words[i]+words[j] and check if palindrome. Time O(n²·k), Space O(1).
- **Intuition:** Find pairs (i,j) such that words[i]+words[j] is a palindrome. For word A + word B to be palindrome: either A is reverse of B, or one is prefix of the other and the remainder is palindrome. Use Trie with words inserted in **reverse**. For each word, traverse Trie (simulating reversed other word). Cases: 1) Exact match. 2) Our word is longer—remaining suffix must be palindrome. 3) Trie path is longer—store palindromic suffixes at nodes.
- **Approach:** 1) Build Trie from reversed words; at each node store list of word indices whose remaining suffix (from that point) is palindrome. 2) For each word, traverse Trie; when we reach a complete reversed word and i≠j, add pair if our remainder is palindrome. 3) When we finish our word at a node, add pairs with all stored indices (their remainder matched our prefix as reversed).
- **Java Solution:**

```java
class Solution {
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        int wordEnd = -1;
        java.util.List<Integer> palinSuffix = new java.util.ArrayList<>();
    }

    public java.util.List<java.util.List<Integer>> palindromePairs(String[] words) {
        TrieNode root = new TrieNode();
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            TrieNode node = root;
            for (int j = w.length() - 1; j >= 0; j--) {
                if (isPalindrome(w, 0, j)) node.palinSuffix.add(i);
                int c = w.charAt(j) - 'a';
                if (node.children[c] == null) node.children[c] = new TrieNode();
                node = node.children[c];
            }
            node.wordEnd = i;
        }
        var result = new java.util.ArrayList<java.util.List<Integer>>();
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            TrieNode node = root;
            for (int j = 0; j < w.length(); j++) {
                if (node.wordEnd >= 0 && node.wordEnd != i && isPalindrome(w, j, w.length() - 1))
                    result.add(java.util.List.of(i, node.wordEnd));
                int c = w.charAt(j) - 'a';
                if (node.children[c] == null) {
                    node = null;
                    break;
                }
                node = node.children[c];
            }
            if (node != null) {
                if (node.wordEnd >= 0 && node.wordEnd != i)
                    result.add(java.util.List.of(i, node.wordEnd));
                for (int j : node.palinSuffix)
                    if (j != i) result.add(java.util.List.of(i, j));
            }
        }
        return result;
    }

    private boolean isPalindrome(String s, int lo, int hi) {
        while (lo < hi) {
            if (s.charAt(lo++) != s.charAt(hi--)) return false;
        }
        return true;
    }
}
```

- **Complexity:** Time O(n·k²) where k = max word length; Space O(n·k)

---

## Common Mistakes

- **Using `children[26]` with wrong index:** Use `c - 'a'` for lowercase; ensure input is lowercase or normalize.
- **Forgetting `isWord` in search:** search must check that we reached a node with isWord, not just that the path exists.
- **Word Search II duplicates:** Set `node.word = null` after adding to result so the same word isn't found again.
- **Word Search II backtracking:** Restore `board[r][c]` after DFS; use `'#'` or similar to mark visited during recursion.
- **Maximum XOR:** Process bits from MSB to LSB (i from 30 down to 0) for correct greedy choice.
- **Palindrome Pairs edge case:** Handle empty string; word might match itself—check `i != j`.
- **Map Sum overwrite:** When inserting same key with new value, subtract old value and add new (delta) so sum(prefix) stays correct.

## Pattern Variations

| Variation           | Example              | Key Technique                               |
|---------------------|----------------------|---------------------------------------------|
| Standard Trie       | #208, #211           | children[26], isWord                        |
| Suggestions         | #1268                | Store top-k at each node or DFS             |
| Wildcard search     | #211                 | DFS on '.' through all children             |
| Replace prefix      | #648                 | Find shortest prefix that is root           |
| Prefix sum          | #677                 | Store sum/val at node, delta on overwrite   |
| Binary Trie (XOR)   | #421                 | 0/1 children, greedy opposite bit          |
| Trie + DFS          | #212                 | Build Trie, DFS board, traverse Trie        |
| Reversed Trie       | #336                 | Insert reversed, check palindromic remainder|
