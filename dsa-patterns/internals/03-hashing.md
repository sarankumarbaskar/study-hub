# Hashing — Interview Execution Playbook

> **Pattern Mastery Level:** Hashing is the single most versatile pattern. It appears in ~20-25% of FAANG coding rounds — either as the primary technique or as a building block inside sliding window, graph, and design problems. If you can't reach for a HashMap/HashSet instinctively, you'll waste minutes on problems that should be solved in seconds.

---

## 1. Pattern Recognition Signals

### When to Use Hashing

```
INSTANT TRIGGERS (say "hash map" within 5 seconds):
  ✓ "Find two numbers that sum to target" (unsorted array)
  ✓ "Count occurrences / frequency / how many times"
  ✓ "Group by" / "categorize" / "bucket" elements
  ✓ "Check if duplicate exists" / "unique" / "distinct"
  ✓ "Find if X exists in O(1)" — membership check
  ✓ "Longest consecutive sequence" — need neighbor lookup without sort
  ✓ "Anagram" / "permutation" / "same characters"
```

### Keywords in Problem Statements

```
DIRECT SIGNALS:              INDIRECT SIGNALS:
  "frequency"                  "subarray sum equals k"
  "count occurrences"          "anagram" / "permutation"
  "group anagrams"             "pattern matching" (word pattern)
  "two sum"                    "encode/decode"
  "unique" / "distinct"        "random access in O(1)"
  "contains duplicate"         "LRU / LFU cache"
  "consecutive sequence"       "valid sudoku"
```

### When NOT to Use

```
✗ Data is SORTED and you need pairs → use TWO POINTERS (O(1) space vs O(n))
✗ Need elements in sorted order → use SORTING or TREE MAP
✗ Need range queries (how many elements between X and Y) → use SORTED STRUCTURE or SEGMENT TREE
✗ Need min/max efficiently → use HEAP or MONOTONIC STACK
✗ Problem has tight memory constraints → hash tables have high constant-factor overhead
✗ Key space is tiny and fixed (e.g., 26 lowercase letters) → int[26] is faster than HashMap
```

---

## 2. Thinking Framework (Step-by-Step Intuition)

### The 60-Second Decision Process

```
Step 1: "What's the brute force?"
  Usually O(n²) — for each element, scan all others for a match/complement/duplicate

Step 2: "Am I repeatedly searching for something?"
  YES → A HashMap/HashSet can turn each search from O(n) to O(1)
  
Step 3: "What am I storing?"
  value → index            → HashMap<Integer, Integer>   (Two Sum)
  value → count            → HashMap<Integer, Integer>   (frequency)
  value → existence        → HashSet<Integer>            (dedup, consecutive)
  derived key → group      → HashMap<String, List>       (anagrams)

Step 4: "One pass or two?"
  ONE PASS: check-then-insert (Two Sum) — avoids using same element twice
  TWO PASS: build full map, then query (Top K Frequent)
  SLIDING: maintain a window frequency map (Min Window Substring)
```

### The Core Insight (Memorize This)

```
HASHING WORKS BECAUSE:
  A hash table trades O(n) SPACE for O(1) TIME per lookup.
  
  Instead of scanning the entire array every time you ask
  "have I seen X?" or "what's the complement of X?",
  you build an index ONCE and answer every query in O(1).
  
  This turns O(n²) brute force into O(n) single-pass solutions.
  
  The key design decision is: WHAT is the key, and WHAT is the value?
  Get this right, and the problem solves itself.
```

### HashMap vs HashSet Decision

```
Need to associate data with each key?     → HashMap (value→index, value→count)
Only need "have I seen this?"             → HashSet (duplicates, membership)
Need ordered iteration / access order?    → LinkedHashMap (LRU Cache)
Key space is small and fixed?             → int[] array (26 letters, 10 digits)
```

---

## 3. Java Templates (Production-Quality)

### Template 1: HashMap for Counting / Grouping

```java
// USE FOR: frequency counting, Top K Frequent, majority element
// TIME: O(n) | SPACE: O(n)
public Map<Integer, Integer> buildFrequencyMap(int[] nums) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int x : nums) {
        freq.merge(x, 1, Integer::sum);  // cleaner than getOrDefault + put
    }
    return freq;
}

// USE FOR: Group Anagrams, group shifted strings, categorize by key
// TIME: O(n * k) where k = key computation cost | SPACE: O(n)
public Map<String, List<String>> groupByKey(String[] strs) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String s : strs) {
        char[] chars = s.toCharArray();
        Arrays.sort(chars);                           // O(k log k) per string
        String key = new String(chars);
        groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return groups;
}
```

### Template 2: HashSet for Existence / Dedup

```java
// USE FOR: Contains Duplicate, Longest Consecutive Sequence, cycle detection
// TIME: O(n) | SPACE: O(n)
public boolean hasDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int x : nums) {
        if (!seen.add(x)) return true;  // add() returns false if already present
    }
    return false;
}

// USE FOR: Longest Consecutive Sequence — only start counting from streak heads
// TIME: O(n) — each element visited at most twice | SPACE: O(n)
public int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int x : nums) set.add(x);

    int maxLen = 0;
    for (int x : set) {
        if (set.contains(x - 1)) continue;    // skip non-heads
        int len = 0;
        while (set.contains(x + len)) len++;
        maxLen = Math.max(maxLen, len);
    }
    return maxLen;
}
```

### Template 3: Two-Sum Pattern with HashMap

```java
// USE FOR: Two Sum, pair finding on unsorted data, complement lookup
// TIME: O(n) | SPACE: O(n)
// KEY INSIGHT: check BEFORE inserting to avoid using the same element twice
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();  // value → index
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement)) {
            return new int[]{seen.get(complement), i};
        }
        seen.put(nums[i], i);  // insert AFTER check
    }
    return new int[]{};
}
```

### Template 4: Frequency Map with Sliding Window

```java
// USE FOR: Minimum Window Substring, longest substring with K distinct, anagram in string
// TIME: O(n) | SPACE: O(k) where k = alphabet/distinct chars
public String minWindowSubstring(String s, String t) {
    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);

    Map<Character, Integer> window = new HashMap<>();
    int left = 0, satisfied = 0, minLen = Integer.MAX_VALUE, minStart = 0;

    for (int right = 0; right < s.length(); right++) {
        char rc = s.charAt(right);
        window.merge(rc, 1, Integer::sum);
        if (need.containsKey(rc) && window.get(rc).equals(need.get(rc))) {
            satisfied++;
        }

        while (satisfied == need.size()) {                  // all chars satisfied
            if (right - left + 1 < minLen) {
                minLen = right - left + 1;
                minStart = left;
            }
            char lc = s.charAt(left);
            window.merge(lc, -1, Integer::sum);
            if (need.containsKey(lc) && window.get(lc) < need.get(lc)) {
                satisfied--;
            }
            left++;
        }
    }
    return minLen == Integer.MAX_VALUE ? "" : s.substring(minStart, minStart + minLen);
}
```

---

## 4. Edge Case Checklist

```
INPUT EDGE CASES:
  □ Empty array / empty string → return 0, empty list, or ""
  □ Single element → often a valid answer by itself
  □ All elements identical → frequency = n, only 1 group, streak length = 1
  □ Negative numbers → hash keys work fine with negatives (unlike array indices)
  □ Very large values → HashMap handles any int; no array-index trick possible

HASHMAP-SPECIFIC:
  □ Key not present → get() returns null (NPE if you unbox to int)
  □ Integer comparison → use .equals() not == for Integer objects > 127
  □ Null keys → HashMap allows ONE null key; HashSet allows ONE null element
  □ Concurrent modification → don't add/remove keys while iterating entrySet()

PATTERN-SPECIFIC:
  □ Two Sum: same element used twice — insert AFTER checking complement
  □ Two Sum: multiple valid pairs — problem usually guarantees exactly one
  □ Frequency map: getOrDefault(key, 0) vs merge() — both work, merge is cleaner
  □ Anagram grouping: Unicode chars → use HashMap instead of int[26]
  □ Consecutive sequence: duplicates in input — HashSet handles naturally
  □ Sliding window freq: decrement to 0 vs remove — remove to keep map.size() accurate
  □ Sudoku: encode (row, col, box) as separate keys to avoid conflicts
```

---

## 5. Problem Progression (LeetCode)

### Level 1: Easy — Build HashMap Muscle Memory

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 1 | [Two Sum](https://leetcode.com/problems/two-sum/) | One-pass complement lookup: check THEN insert to avoid reuse | O(n) |
| 217 | [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) | HashSet.add() returns false if element exists — one-liner check | O(n) |
| 242 | [Valid Anagram](https://leetcode.com/problems/valid-anagram/) | int[26] frequency count: increment for s, decrement for t, check all zero | O(n) |

### Level 2: Medium — Core HashMap Patterns

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 49 | [Group Anagrams](https://leetcode.com/problems/group-anagrams/) | Sorted chars as key; computeIfAbsent for clean grouping | O(n·k log k) |
| 347 | [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) | Frequency map → bucket sort by frequency → scan from top; avoids heap | O(n) |
| 290 | [Word Pattern](https://leetcode.com/problems/word-pattern/) | Bidirectional mapping: pattern char ↔ word; both directions must be consistent | O(n) |
| 128 | [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/) | HashSet + only expand from streak HEAD (num-1 not in set) → O(n) | O(n) |

### Level 3: Tricky Medium — Multi-HashMap / Design Thinking

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 36 | [Valid Sudoku](https://leetcode.com/problems/valid-sudoku/) | Three constraint sets (row, col, box); encode each as a unique string key | O(1) |
| 380 | [Insert Delete GetRandom O(1)](https://leetcode.com/problems/insert-delete-getrandom-o1/) | HashMap (val→index) + ArrayList; swap-to-end trick for O(1) remove | O(1) per op |
| 438 | [Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string/) | Fixed-size sliding window + frequency match count; avoid rebuilding map each step | O(n) |

### Level 4: Hard — FAANG Interview Level

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 146 | [LRU Cache](https://leetcode.com/problems/lru-cache/) | HashMap + doubly-linked list (or LinkedHashMap); O(1) get, put, and eviction | O(1) per op |
| 76 | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | Sliding window + two frequency maps + satisfied count; shrink left while valid | O(n) |
| 340 | [Longest Substring with At Most K Distinct](https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters/) | Sliding window + map.size() tracks distinct count; remove key when count hits 0 | O(n) |

### Solving Order for Maximum Learning

```
Day 1: 1 → 217 → 242 (build HashMap/HashSet muscle memory)
Day 2: 49 → 347 → 290 (master frequency + grouping patterns)
Day 3: 128 → 36 (learn "smart iteration" — streak heads, multi-key encoding)
Day 4: 380 → 146 (design problems — HashMap as backbone of data structures)
Day 5: 76 → 438 → 340 (sliding window + frequency map combo)
Day 6: Re-solve Day 1-3 problems WITHOUT notes (test recall)
```

---

## 6. Common Mistakes & Interview Traps

### Mistake 1: Integer Auto-Unboxing NPE

```
WRONG:
  Map<Integer, Integer> map = new HashMap<>();
  int count = map.get(key);   // NPE if key doesn't exist! get() returns null

CORRECT:
  int count = map.getOrDefault(key, 0);
  // OR
  map.merge(key, 1, Integer::sum);  // safe even if key absent
```

### Mistake 2: Comparing Integer Objects with ==

```
WRONG:
  if (window.get(c) == need.get(c))  // works for values -128..127 ONLY
  // Java caches Integer objects in [-128, 127]. Outside that range,
  // == compares references, not values. Passes small tests, fails large ones.

CORRECT:
  if (window.get(c).equals(need.get(c)))  // always compares by value
```

### Mistake 3: Two Sum — Reusing the Same Element

```
WRONG (two-pass approach):
  // Pass 1: build full map
  for (int i = 0; i < nums.length; i++) map.put(nums[i], i);
  // Pass 2: check complement
  for (int i = 0; i < nums.length; i++) {
      if (map.containsKey(target - nums[i]))
          return new int[]{i, map.get(target - nums[i])};  // might return {i, i}!
  }

CORRECT (one-pass):
  // Check complement BEFORE inserting current element
  for (int i = 0; i < nums.length; i++) {
      int comp = target - nums[i];
      if (seen.containsKey(comp)) return new int[]{seen.get(comp), i};
      seen.put(nums[i], i);  // insert AFTER check
  }
```

### Mistake 4: Forgetting to Remove Zero-Count Keys in Sliding Window

```
WRONG:
  window.merge(lc, -1, Integer::sum);
  // window.size() still counts lc even when its count is 0
  // "at most K distinct" check via window.size() > k is now BROKEN

CORRECT:
  window.merge(lc, -1, Integer::sum);
  if (window.get(lc) == 0) window.remove(lc);  // keep size() accurate
```

### Mistake 5: Using sort-based Anagram Key When Frequency Key is Better

```
SLOWER (fine for interviews, but know the alternative):
  String key = new String(Arrays.sort(s.toCharArray()));  // O(k log k)

FASTER (when k is large):
  int[] count = new int[26];
  for (char c : s.toCharArray()) count[c - 'a']++;
  String key = Arrays.toString(count);  // O(k), e.g. "[1,0,0,...,1,0]"
  // Avoids O(k log k) sort — matters when strings are very long
```

### What Interviewers Actually Look For

```
JUNIOR:    Can write Two Sum with HashMap and explain O(n) vs O(n²)
SENIOR:    Instinctively uses merge/computeIfAbsent, handles nulls, avoids ==
STAFF:     Discusses hash collision behavior, amortized O(1) guarantees,
           when TreeMap is better, and designs composite keys for complex groupings
```

---

## 7. Interview Strategy

### Target Solving Times

```
Easy (Two Sum, Contains Duplicate):        5-7 minutes (including explanation)
Medium (Group Anagrams, Top K Frequent):   10-15 minutes
Hard (LRU Cache, Min Window Substring):    18-25 minutes

If you're taking longer than these, you haven't internalized the templates.
```

### How to Explain Your Approach (Script)

```
STEP 1 (30 seconds): State the brute force
  "The brute force is O(n²) — for each element, scan all others to find a match."

STEP 2 (30 seconds): Identify the optimization
  "I can use a HashMap to store what I've seen, giving O(1) lookups.
   For each element, I compute the complement and check the map.
   This reduces the inner scan from O(n) to O(1), giving O(n) total."

STEP 3 (15 seconds): Clarify key-value design
  "The key will be [the value/sorted chars/frequency signature],
   and the value will be [the index/count/list of grouped elements]."

STEP 4: Code (5-12 minutes)
  Write the template, fill in problem-specific logic.

STEP 5 (30 seconds): Trace through an example
  "For nums=[2,7,11,15], target=9: i=0, comp=7, map empty, put (2→0).
   i=1, comp=2, map has 2→0, return [0,1]."
```

### Follow-Up Questions Interviewers Ask

```
Q: "What's the worst-case time complexity of HashMap?"
A: "O(n) per operation if all keys hash to the same bucket. Java 8+ uses
    a balanced tree for long chains (O(log n)), but average case is O(1)
    with a good hash function and load factor."

Q: "Why not sort instead of hash?"
A: "Sorting gives O(n log n) time but O(1) extra space if in-place.
    Hashing gives O(n) time but O(n) space. I'd use hashing when time
    is the bottleneck, sorting when memory is constrained."

Q: "Can you solve this without extra space?"
A: "Not with O(n) time — without a hash table, we'd need O(n²) brute force
    or O(n log n) sort. The O(n) space is a necessary trade-off for O(n) time."

Q: "What if the input has billions of elements?"
A: "If it doesn't fit in memory, I'd use external hashing or partition
    by hash into chunks that fit in memory, process each chunk separately.
    For distributed systems, consistent hashing across nodes."

Q: "How would you handle collisions in a real system?"
A: "Java's HashMap uses chaining (linked list → red-black tree at threshold 8).
    Open addressing (linear/quadratic probing) is another approach used in
    languages like Python. Load factor tuning (default 0.75) controls the trade-off."
```

---

## 8. Revision Strategy

### Weekly Revision Plan

```
WEEK 1: Solve all 13 problems from scratch. Time yourself.
WEEK 2: Re-solve only the ones you couldn't do in target time.
WEEK 3: Solve LRU Cache and Min Window Substring from memory (no notes).
WEEK 4: Mix with other patterns — recognize when hashing is the RIGHT tool
         vs when two pointers or binary search is better.
```

### What to Memorize vs Understand

```
MEMORIZE:
  ✓ The 4 templates (frequency map, HashSet existence, Two Sum one-pass, sliding window freq)
  ✓ merge() and computeIfAbsent() idioms — write them in your sleep
  ✓ "Check BEFORE insert" for Two Sum (avoid same-element reuse)
  ✓ "Remove key when count hits 0" for sliding window distinct tracking
  ✓ "Swap-to-end" trick for O(1) random delete (Insert Delete GetRandom)

UNDERSTAND (don't memorize — derive each time):
  ✓ WHY hashing gives O(1) amortized (hash function → bucket → direct access)
  ✓ WHY streak-head check makes Longest Consecutive O(n) (each element visited ≤ 2x)
  ✓ WHY bidirectional mapping is needed for Word Pattern (a↔dog AND dog↔a)
  ✓ HOW LRU Cache combines HashMap + doubly-linked list for O(1) everything
  ✓ WHEN to pick HashMap vs TreeMap vs int[] (speed vs ordering vs fixed key space)
```

### Signals That Indicate Mastery

```
□ You see "unsorted + find pair" and IMMEDIATELY say "HashMap" (< 5 seconds)
□ You can write Group Anagrams in under 5 minutes without looking at anything
□ You can implement LRU Cache from scratch and explain every design decision
□ You know when int[26] beats HashMap and when it doesn't (fixed vs dynamic key space)
□ You never get NPE from auto-unboxing or == comparison bugs
□ You can explain O(1) amortized vs O(n) worst case to a non-technical interviewer
□ You instinctively use merge/computeIfAbsent over verbose get-check-put patterns
```

---

## Quick Reference Card (Print This)

```
PATTERN              KEY → VALUE                    USE CASE                    TIME    SPACE
──────────────────────────────────────────────────────────────────────────────────────────────
Complement lookup    value → index                  Two Sum                     O(n)    O(n)
Frequency count      element → count                Top K, Majority Element     O(n)    O(n)
Existence check      element → (boolean)            Duplicates, Consecutive     O(n)    O(n)
Grouping             derived key → list of items    Anagrams, Word Pattern      O(n·k)  O(n)
Multi-key encoding   "r0-5","c3-5","b0-5" → seen   Valid Sudoku                O(1)*   O(1)*
Sliding window freq  char → count in window         Min Window, K Distinct      O(n)    O(k)
HashMap + ArrayList  value → index in list          Insert/Delete/Random O(1)   O(1)    O(n)
HashMap + LinkedList key → node in DLL              LRU Cache                   O(1)    O(n)

* fixed 9×9 board

DECISION TREE:
  "Need O(1) lookup?"          → HashMap or HashSet
  "Unsorted + find pair?"      → HashMap (not two pointers)
  "Sorted + find pair?"        → Two pointers (not HashMap — saves space)
  "Count frequencies?"         → HashMap or int[] if key space is small
  "Group elements?"            → HashMap<DerivedKey, List<Element>>
  "Track window contents?"     → HashMap + sliding window pointers
  "O(1) insert + delete + random?" → HashMap + ArrayList (swap-to-end)
  "O(1) get + put + evict LRU?"    → HashMap + doubly-linked list
```
