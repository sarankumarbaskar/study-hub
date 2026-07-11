# LC #49 — Group Anagrams

> Date: 2026-07-10 | Pattern: Arrays & Hashing | Difficulty: Medium | LC#: 49

---

## Problem

Given an array of strings, group words that are anagrams.

```java
Input:  ["eat","tea","tan","ate","nat","bat"]
Output: [["eat","tea","ate"], ["tan","nat"], ["bat"]]
```

Anagrams have the same characters with the same frequencies.

## Pattern

**HashMap with custom key design** — compute a key such that anagrams produce the same key, then group by that key.

---

## Approach 1: Brute Force

Compare every string with every other string to check if they're anagrams.

```
Time:  O(n² × k)    where k = average string length
Space: O(k)
```

Why not enough: pairwise comparison is redundant. We keep rediscovering the same grouping.

---

## Approach 2: Better — Sorted String Key

If two strings are anagrams, their sorted form is identical.

```
eat → aet
tea → aet
ate → aet
tan → ant
nat → ant
bat → abt
```

Use sorted string as HashMap key.

```java
class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> map = new HashMap<>();

        for (String word : strs) {
            char[] chars = word.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);

            map.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
        }

        return new ArrayList<>(map.values());
    }
}
```

```
Time:  O(n × k log k)
Space: O(n × k)
```

---

## Approach 3: Optimal — Frequency Count Key

Instead of sorting, count character frequencies and build a key.

```
eat → a:1, e:1, t:1 → "#1#0#0#0#1#0...#1..."
tea → a:1, e:1, t:1 → "#1#0#0#0#1#0...#1..."   ← same key!
```

```java
class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> map = new HashMap<>();

        for (String word : strs) {
            int[] count = new int[26];

            for (char c : word.toCharArray()) {
                count[c - 'a']++;
            }

            StringBuilder keyBuilder = new StringBuilder();
            for (int freq : count) {
                keyBuilder.append('#').append(freq);
            }

            String key = keyBuilder.toString();
            map.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
        }

        return new ArrayList<>(map.values());
    }
}
```

```
Time:  O(n × k)
Space: O(n × k)
```

---

## Java Internals

### Why NOT `int[]` as key

```java
int[] a = {1, 0, 1};
int[] b = {1, 0, 1};

a.equals(b)    // false — arrays use Object.equals() (reference equality)
a.hashCode()   // identity-based, different from b.hashCode()
```

Two arrays with identical contents are **different keys** in HashMap because arrays don't override `equals()` and `hashCode()`.

**Fix:** convert to `String` which overrides both by content.

### Why delimiter is required

Without delimiter:
```
[1, 11] → "111"
[11, 1] → "111"     ← collision!
```

With delimiter:
```
[1, 11] → "#1#11"
[11, 1] → "#11#1"   ← different!
```

### `computeIfAbsent`

```java
map.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
```

Atomically: if key absent, create new list; then add word. Cleaner than `containsKey` + `put` + `get`.

## Edge Cases

- `[""]` → `[[""]]`
- `["a"]` → `[["a"]]`
- All same anagram: `["eat","tea","ate"]` → one group
- All different: `["abc","def"]` → separate groups
- Unicode: if not limited to lowercase English, `int[26]` won't work — use sorting approach or `Map<Character, Integer>`

## Complexity Summary

| Approach | Time | Space |
|----------|------|-------|
| Brute Force | O(n² × k) | O(k) |
| Sorting Key | O(n × k log k) | O(n × k) |
| Frequency Key | O(n × k) | O(n × k) |

## 60-Second Interview Explanation

> The brute force compares every pair of strings, which is O(n²k). A better approach: anagrams have the same sorted form, so I sort each string and use that as a HashMap key — O(nk log k). The optimal approach avoids sorting by counting character frequencies into an int[26] array and converting that to a delimited String key like "#1#0#0...". In Java, I cannot use int[] directly as a HashMap key because arrays use reference equality, not content equality. The delimited String ensures equal frequencies produce equal keys. This gives O(nk) time.
