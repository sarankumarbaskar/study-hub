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

For each string, compare it with every other string to check if they're anagrams. Group matches together.

### Pseudocode

```
create visited array of size n

for i = 0 to n-1:
    if visited[i]: skip

    create new group with strs[i]

    for j = i+1 to n-1:
        if not visited[j] and isAnagram(strs[i], strs[j]):
            add strs[j] to group
            mark visited[j]

    add group to result
```

```
Time:  O(n² × k)    where k = average string length
Space: O(k)
```

Why not enough: pairwise comparison is redundant. We keep rediscovering the same grouping.

---

## Approach 2: Better — Sorted String Key

If two strings are anagrams, their sorted form is identical. Use that sorted form as a HashMap key.

### Pseudocode

```
create empty map: key=string, value=list of strings

for each word in strs:
    sorted_word = sort characters of word
    add word to map[sorted_word]

return all values from map
```

### Trace

```
eat → sort → "aet"    → map["aet"] = ["eat"]
tea → sort → "aet"    → map["aet"] = ["eat", "tea"]
tan → sort → "ant"    → map["ant"] = ["tan"]
ate → sort → "aet"    → map["aet"] = ["eat", "tea", "ate"]
nat → sort → "ant"    → map["ant"] = ["tan", "nat"]
bat → sort → "abt"    → map["abt"] = ["bat"]
```

### Java

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

Instead of sorting, count character frequencies and convert to a delimited string key. Anagrams produce the same frequency signature.

### Pseudocode

```
create empty map: key=string, value=list of strings

for each word in strs:
    create count array of size 26 (all zeros)

    for each character c in word:
        count[c - 'a']++

    build key from count: "#1#0#0#0#1#0...#1..."

    add word to map[key]

return all values from map
```

### Trace

```
eat → count = [1,0,0,0,1,0,...,1,...] → key = "#1#0#0#0#1#0...#1..."
tea → count = [1,0,0,0,1,0,...,1,...] → key = "#1#0#0#0#1#0...#1..."  ← SAME!
tan → count = [1,0,0,0,0,...,1,...,1] → key = "#1#0#0#0#0...#1...#1"  ← different
```

### Java

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
