# Hashing Patterns

> O(1) lookups when you need to remember what you've seen—count frequencies, group by key, or instant membership checks.

## What Is This Pattern?

Hashing patterns leverage `HashMap` and `HashSet` to achieve **constant-time lookups** by trading space for speed. Instead of scanning an array or string repeatedly, you build an index once and query it in O(1).

**Visual intuition:** Think of a hash structure as a labeled filing cabinet. Each "drawer" (bucket) is keyed by a hash of your input—whether that's a character, a computed value, or a canonical form of data. When you need to know "have I seen X before?" or "how many times does Y appear?", you don't search; you go directly to the drawer.

The power comes from **three core operations**: (1) **frequency counting**—track how often each element appears; (2) **grouping**—bucket elements by a derived key (e.g., sorted string for anagrams); and (3) **lookup tables**—precompute or store what you need for O(1) access during a single pass.

## When to Use This Pattern

- Need to check **"have I seen this before?"** (duplicates, membership)
- Need **counts** or **frequencies** of elements
- Need to **group** elements by some derived key
- Need **O(1) lookup** by value (complement for Two Sum, etc.)
- Need to **precompute** something for fast access in another pass

## How to Identify This Pattern

- "Count occurrences" / "frequency" / "how many times"
- "Group by" / "bucket" / "categorize"
- "Find two numbers that sum to X"
- "Check if anagram" / "rearrange letters"
- "Unique" / "duplicate" / "distinct"
- Sliding window problems needing character frequency maps

## Core Template (Pseudocode)

### Frequency Counting
```
map = {}
for each element e:
    map[e] = map.get(e, 0) + 1
```

### Grouping
```
groups = {}
for each element e:
    key = derive_key(e)   // e.g., sorted(e), hash(e)
    groups[key].add(e)
return groups.values()
```

### Two-Pass (Lookup Table)
```
// Pass 1: build index
map = {}
for i, e in enumerate(arr):
    map[e] = i   // or map[complement] = i

// Pass 2: use index
for each element e:
    if (target - e) in map:
        return [map[target-e], current_index]
```

## Core Template (Java)

### Frequency Map
```java
Map<Integer, Integer> freq = new HashMap<>();
for (int x : nums) {
    freq.merge(x, 1, Integer::sum);
}
```

### Grouping
```java
Map<String, List<String>> groups = new HashMap<>();
for (String s : strs) {
    String key = stream(s.split("")).sorted().collect(Collectors.joining());
    groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
}
return new ArrayList<>(groups.values());
```

### Lookup Table (Two Sum style)
```java
Map<Integer, Integer> seen = new HashMap<>();  // value -> index
for (int i = 0; i < nums.length; i++) {
    int complement = target - nums[i];
    if (seen.containsKey(complement)) {
        return new int[]{seen.get(complement), i};
    }
    seen.put(nums[i], i);
}
```

## Complexity Cheat Sheet

| Operation           | HashMap/HashSet |
|--------------------|-----------------|
| put(k, v) / add(e) | O(1) average    |
| get(k) / contains(e) | O(1) average |
| remove(k)          | O(1) average    |
| iteration          | O(n)            |

**Note:** Average case assumes good hash distribution. Worst case can degrade to O(n) per operation with many collisions.

---

## Problems (Progressive Difficulty)

### Easy (3 problems)

#### Problem: [Two Sum](https://leetcode.com/problems/two-sum/) (LeetCode #1)

- **Intuition:** Store each number and its index; for each new number, check if `target - num` exists in the map.
- **Brute Force:** For each pair (i, j), check if nums[i] + nums[j] == target. Time O(n²), Space O(1).
- **Optimized Approach:**
  1. One pass: for each `nums[i]`, compute `complement = target - nums[i]`
  2. If `complement` is in the map, return `[map.get(complement), i]`
  3. Else put `(nums[i], i)` in the map
- **Java Solution:**

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

#### Problem: [Valid Anagram](https://leetcode.com/problems/valid-anagram/) (LeetCode #242)

- **Intuition:** Two strings are anagrams iff they have the same character frequency.
- **Brute Force:** Sort both strings and compare. Time O(n log n), Space O(n).
- **Optimized Approach:**
  1. If lengths differ, return false
  2. Build frequency map for `s`: count each char
  3. For each char in `t`, decrement count; if count < 0, return false
  4. Return true
- **Java Solution:**

```java
class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] freq = new int[26];
        for (char c : s.toCharArray()) {
            freq[c - 'a']++;
        }
        for (char c : t.toCharArray()) {
            freq[c - 'a']--;
            if (freq[c - 'a'] < 0) return false;
        }
        return true;
    }
}
```

- **Complexity:** Time O(n), Space O(1) (fixed 26 chars)

---

#### Problem: [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) (LeetCode #217)

- **Intuition:** Use a `HashSet` to track seen elements; if we see an element again, it's a duplicate.
- **Brute Force:** For each element, check all previous elements for a match. Time O(n²), Space O(1).
- **Optimized Approach:**
  1. Create a `HashSet<Integer>`
  2. For each element, if it's already in the set, return true
  3. Otherwise add it and continue
  4. Return false at end
- **Java Solution:**

```java
class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int x : nums) {
            if (!seen.add(x)) return true;
        }
        return false;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

### Medium (5 problems)

#### Problem: [Group Anagrams](https://leetcode.com/problems/group-anagrams/) (LeetCode #49)

- **Intuition:** Anagrams share the same sorted character sequence; use that as the grouping key.
- **Brute Force:** For each string, compare with all others to find anagram groups. Time O(n² * k), Space O(n * k).
- **Optimized Approach:**
  1. For each string, compute canonical key (e.g., sorted chars)
  2. Group strings in a `Map<String, List<String>>`
  3. Return grouped lists
- **Java Solution:**

```java
class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String s : strs) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }
}
```

- **Complexity:** Time O(n * k log k) where k = max string length, Space O(n * k)

---

#### Problem: [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) (LeetCode #347)

- **Intuition:** Count frequencies, then either bucket-sort by frequency or use a min-heap of size k.
- **Brute Force:** Count frequencies, sort entries by frequency, take top k. Time O(n log n), Space O(n).
- **Optimized Approach:**
  1. Build frequency map
  2. Create buckets: `List<Integer>[]` where index = frequency
  3. Traverse buckets from high frequency to low; collect k elements
- **Java Solution:**

```java
class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int x : nums) {
            freq.merge(x, 1, Integer::sum);
        }
        @SuppressWarnings("unchecked")
        List<Integer>[] buckets = new List[nums.length + 1];
        for (int i = 0; i < buckets.length; i++) {
            buckets[i] = new ArrayList<>();
        }
        for (Map.Entry<Integer, Integer> e : freq.entrySet()) {
            buckets[e.getValue()].add(e.getKey());
        }
        int[] result = new int[k];
        int idx = 0;
        for (int f = buckets.length - 1; f >= 0 && idx < k; f--) {
            for (int x : buckets[f]) {
                result[idx++] = x;
                if (idx == k) break;
            }
        }
        return result;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

#### Problem: [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/) (LeetCode #128)

- **Intuition:** Put all numbers in a set. A number starts a streak only if `num - 1` is not in the set; then expand forward.
- **Brute Force:** Sort array, then scan for longest consecutive run. Time O(n log n), Space O(1) or O(n) depending on sort.
- **Optimized Approach:**
  1. Add all numbers to `HashSet`
  2. For each `num`, if `num - 1` is not in set, it's a streak start
  3. Count consecutive numbers from `num` (num, num+1, num+2, ...)
  4. Track max length
- **Java Solution:**

```java
class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int x : nums) set.add(x);
        int maxLen = 0;
        for (int x : set) {
            if (!set.contains(x - 1)) {
                int len = 0;
                while (set.contains(x + len)) len++;
                maxLen = Math.max(maxLen, len);
            }
        }
        return maxLen;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

#### Problem: Encode and Decode Strings (LeetCode #271)

- **Intuition:** Prepend each string with its length and a delimiter so we know where each string ends during decode.
- **Approach:**
  - Encode: `length + "#" + str` for each string
  - Decode: Parse length, read that many chars, advance position
- **Java Solution:**

```java
public class Codec {
    public String encode(List<String> strs) {
        StringBuilder sb = new StringBuilder();
        for (String s : strs) {
            sb.append(s.length()).append('#').append(s);
        }
        return sb.toString();
    }

    public List<String> decode(String s) {
        List<String> result = new ArrayList<>();
        int i = 0;
        while (i < s.length()) {
            int j = i;
            while (s.charAt(j) != '#') j++;
            int len = Integer.parseInt(s.substring(i, j));
            i = j + 1;
            result.add(s.substring(i, i + len));
            i += len;
        }
        return result;
    }
}
```

- **Complexity:** Time O(n) encode/decode, Space O(1) extra for encode (output is required)

---

#### Problem: [Valid Sudoku](https://leetcode.com/problems/valid-sudoku/) (LeetCode #36)

- **Intuition:** For each cell, check that its value does not repeat in its row, column, or 3×3 box. Use sets keyed by row, col, and box.
- **Brute Force:** For each filled cell, scan its row, column, and 3×3 box for duplicates. Time O(81 * 9) = O(1), Space O(1).
- **Optimized Approach:**
  1. Create sets for rows, cols, boxes (e.g., `Set<String>` with keys like `"r5-3"`, `"c2-7"`, `"b1-5"`)
  2. For each filled cell, compute three keys; if any key already exists, invalid
  3. Else add all three keys
- **Java Solution:**

```java
class Solution {
    public boolean isValidSudoku(char[][] board) {
        Set<String> seen = new HashSet<>();
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                char ch = board[r][c];
                if (ch == '.') continue;
                String rowKey = "r" + r + "-" + ch;
                String colKey = "c" + c + "-" + ch;
                int box = (r / 3) * 3 + (c / 3);
                String boxKey = "b" + box + "-" + ch;
                if (!seen.add(rowKey) || !seen.add(colKey) || !seen.add(boxKey)) {
                    return false;
                }
            }
        }
        return true;
    }
}
```

- **Complexity:** Time O(1) (81 cells), Space O(1)

---

### Hard (2 problems)

#### Problem: Minimum Window Substring (LeetCode #76)

- **Intuition:** Sliding window with two pointers; expand right to include all chars of `t`, then shrink left while valid. Use a frequency map to track `t`'s chars and a running count.
- **Approach:**
  1. Build frequency map for `t`
  2. Two pointers: `left`, `right`; `count` = number of distinct chars from `t` we've satisfied
  3. Expand `right`: add char; if it satisfies one char type in `t`, increment `count`
  4. When `count == t.length()` (or all distinct chars satisfied), shrink `left` while window remains valid
  5. Track minimum window
- **Java Solution:**

```java
class Solution {
    public String minWindow(String s, String t) {
        if (s.length() < t.length()) return "";
        Map<Character, Integer> need = new HashMap<>();
        for (char c : t.toCharArray()) {
            need.merge(c, 1, Integer::sum);
        }
        int needCount = need.size();
        Map<Character, Integer> window = new HashMap<>();
        int left = 0;
        int satisfied = 0;
        int minLen = Integer.MAX_VALUE;
        int minStart = -1;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            window.merge(c, 1, Integer::sum);
            if (need.containsKey(c) && window.get(c).equals(need.get(c))) {
                satisfied++;
            }
            while (satisfied == needCount) {
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
        return minStart == -1 ? "" : s.substring(minStart, minStart + minLen);
    }
}
```

- **Complexity:** Time O(n + m), Space O(m) where n = len(s), m = len(t)

---

#### Problem: Longest Substring with At Most K Distinct Characters (LeetCode #340)

- **Intuition:** Sliding window; maintain a map of char counts in the window. Expand right; when distinct count > k, shrink left until valid.
- **Approach:**
  1. Two pointers: `left`, `right`
  2. Expand `right`, add char to map
  3. When `map.size() > k`, shrink `left`: decrement/remove counts, move `left` until distinct ≤ k
  4. Update max length
- **Java Solution:**

```java
class Solution {
    public int lengthOfLongestSubstringKDistinct(String s, int k) {
        if (k == 0) return 0;
        Map<Character, Integer> window = new HashMap<>();
        int left = 0;
        int maxLen = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            window.merge(c, 1, Integer::sum);
            while (window.size() > k) {
                char lc = s.charAt(left);
                window.merge(lc, -1, Integer::sum);
                if (window.get(lc) == 0) window.remove(lc);
                left++;
            }
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}
```

- **Complexity:** Time O(n), Space O(k)

---

## Common Mistakes & Edge Cases

| Mistake | Fix |
|--------|-----|
| Using `map.get(key) == 0` for presence | Use `containsKey()`; 0 is a valid count |
| Modifying map while iterating | Iterate over `new ArrayList<>(map.keySet())` or use entry set |
| Forgetting to handle empty input | Check `nums.length == 0` or `str.isEmpty()` upfront |
| Integer overflow in Two Sum | Usually fine; LeetCode constraints typically safe |
| Anagrams with Unicode | Use `HashMap<Character, Integer>` instead of `int[26]` |
| Sliding window: `satisfied` vs `count` | For "at least" (Min Window), compare per-char counts to `need`; for "at most k distinct", compare `window.size()` to k |

**Edge Cases:**
- Empty array/string
- Single element
- All elements same
- K = 0 or K > distinct count
- Duplicate indices in Two Sum (same index used twice—avoid by putting after check)

## Pattern Variations

| Variation | Example |
|-----------|---------|
| **Frequency + bucket sort** | Top K Frequent—bucket by count |
| **Frequency + heap** | Top K Frequent—min-heap of size k |
| **Group by canonical form** | Group Anagrams, Group Shifted Strings |
| **Complement lookup** | Two Sum, 3Sum (with hash or two pointers) |
| **Membership + expansion** | Longest Consecutive—set + streak expansion |
| **Sliding window + freq map** | Min Window, Longest Substring K Distinct |
| **Multi-key indexing** | Valid Sudoku—row/col/box sets |
| **Prefix/encoded key** | Encode/Decode Strings |
