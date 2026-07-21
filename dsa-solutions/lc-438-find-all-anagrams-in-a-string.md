# LC #438 — Find All Anagrams in a String

> Date: 2026-07-21 | Pattern: Sliding Window | Difficulty: Medium | LC#: 438
> NeetCode: [neetcode.io/solutions/find-all-anagrams-in-a-string](https://neetcode.io/solutions/find-all-anagrams-in-a-string)

---

## Problem

Given two strings `s` and `p`, return a list of all the start indices of `p`'s anagrams in `s`.

An anagram is a rearrangement of characters — same characters, same frequencies, different order.

Example:

```java
Input:  s = "cbaebabacd", p = "abc"
Output: [0, 6]
```

Why?

```text
Index 0: "cba" → has a:1, b:1, c:1 → same as "abc" → anagram ✅
Index 6: "bac" → has a:1, b:1, c:1 → same as "abc" → anagram ✅
```

Another example:

```java
Input:  s = "abab", p = "ab"
Output: [0, 1, 2]
```

```text
Index 0: "ab" → anagram ✅
Index 1: "ba" → anagram ✅
Index 2: "ab" → anagram ✅
```

---

## Pattern

**Fixed-Size Sliding Window + Frequency Matching**

Why?

We need to check every substring of `s` with length equal to `p.length()`.

That is a fixed-size window sliding across `s`.

For each window position, check if the character frequencies match `p`'s frequencies.

This is almost identical to LC #567 (Permutation in String), except here we collect **all** matching start indices instead of returning true/false.

---

## Approach 1: Brute Force — Sort Each Window

For each window of size `p.length()`, sort the window and compare with sorted `p`.

### Pseudocode

```text
sort p

for i = 0 to len(s) - len(p):
    window = s[i .. i + len(p)]
    sort window

    if window == sorted p:
        add i to result

return result
```

### Java

```java
class Solution {
    public List<Integer> findAnagrams(String s, String p) {
        int n = s.length(), m = p.length();
        List<Integer> result = new ArrayList<>();

        char[] pSorted = p.toCharArray();
        Arrays.sort(pSorted);
        String pKey = new String(pSorted);

        for (int i = 0; i <= n - m; i++) {
            char[] window = s.substring(i, i + m).toCharArray();
            Arrays.sort(window);

            if (new String(window).equals(pKey)) {
                result.add(i);
            }
        }

        return result;
    }
}
```

### Complexity

```text
Time:  O(n × m log m)
Space: O(m)
```

Why not enough?

Sorting each window is expensive. We're doing redundant work because adjacent windows share `m - 1` characters.

---

## Approach 2: Better — Sliding Window with Arrays.equals()

Count character frequencies for `p` and for the first window of size `m`.

Then slide the window: add the new character entering, remove the character leaving.

After each slide, compare the two frequency arrays.

### Pseudocode

```text
if len(p) > len(s):
    return empty

create pCount[26] from p
create sCount[26] from first m characters of s

if pCount == sCount:
    add 0 to result

left = 0
for right = m to n-1:
    sCount[s[right]]++
    sCount[s[left]]--
    left++

    if pCount == sCount:
        add left to result

return result
```

### Trace

```java
s = "cbaebabacd", p = "abc"
m = 3
```

```text
pCount = [1,1,1,0,...] (a:1, b:1, c:1)

Initial window "cba":
sCount = [1,1,1,0,...] (a:1, b:1, c:1)
pCount == sCount? YES → add 0

Slide to "bae":
  add 'e', remove 'c'
  sCount = [1,1,0,0,1,...] (a:1, b:1, e:1)
  pCount == sCount? NO

Slide to "aeb":
  add 'b', remove 'b'
  sCount = [1,1,0,0,1,...] → add b → [1,2,0,0,1,...] → remove b → wait...

Let me trace more carefully:

left=0, right starts at 3:

right=3 ('e'):
  sCount[e]++
  sCount[s[0]='c']--
  left=1
  sCount = a:1, b:1, c:0, e:1
  Match? NO

right=4 ('b'):
  sCount[b]++  → b:2
  sCount[s[1]='b']--  → b:1
  left=2
  sCount = a:1, b:1, c:0, e:1
  Match? NO

right=5 ('a'):
  sCount[a]++ → a:2
  sCount[s[2]='a']-- → a:1
  left=3
  sCount = a:1, b:1, c:0, e:1
  Match? NO

right=6 ('b'):
  sCount[b]++ → b:2
  sCount[s[3]='e']-- → e:0
  left=4
  sCount = a:1, b:2, c:0, e:0
  Match? NO

right=7 ('a'):
  sCount[a]++ → a:2
  sCount[s[4]='b']-- → b:1
  left=5
  sCount = a:2, b:1, c:0
  Match? NO

right=8 ('c'):
  sCount[c]++ → c:1
  sCount[s[5]='a']-- → a:1
  left=6
  sCount = a:1, b:1, c:1
  Match? YES → add 6

right=9 ('d'):
  sCount[d]++ → d:1
  sCount[s[6]='b']-- → b:0
  left=7
  sCount = a:1, b:0, c:1, d:1
  Match? NO

Result: [0, 6] ✅
```

### Java

```java
import java.util.*;

class Solution {
    public List<Integer> findAnagrams(String s, String p) {
        int n = s.length(), m = p.length();
        if (m > n) return new ArrayList<>();

        int[] pCount = new int[26];
        int[] sCount = new int[26];

        for (char c : p.toCharArray()) {
            pCount[c - 'a']++;
        }

        for (int i = 0; i < m; i++) {
            sCount[s.charAt(i) - 'a']++;
        }

        List<Integer> result = new ArrayList<>();
        if (Arrays.equals(pCount, sCount)) result.add(0);

        int left = 0;
        for (int right = m; right < n; right++) {
            sCount[s.charAt(right) - 'a']++;
            sCount[s.charAt(left) - 'a']--;
            left++;

            if (Arrays.equals(pCount, sCount)) {
                result.add(left);
            }
        }

        return result;
    }
}
```

### Complexity

```text
Time:  O((n - m) × 26) = O(n)
Space: O(26) = O(1)
```

`Arrays.equals()` compares 26 elements each time — constant work.

---

## Approach 3: Optimal — Sliding Window with Match Count

Instead of comparing two arrays after every slide, track how many of the 26 characters currently have matching counts.

When `match == 26`, all characters match → anagram found.

When adding or removing a character, only update the match count for that specific character.

### Pseudocode

```text
create pCount[26] from p
create sCount[26] from first m characters of s

match = 0
for i = 0 to 25:
    if pCount[i] == sCount[i]:
        match++

if match == 26:
    add 0 to result

left = 0
for right = m to n-1:
    // remove left character
    c = s[left]
    if sCount[c] == pCount[c]: match--
    sCount[c]--
    if sCount[c] == pCount[c]: match++
    left++

    // add right character
    c = s[right]
    if sCount[c] == pCount[c]: match--
    sCount[c]++
    if sCount[c] == pCount[c]: match++

    if match == 26:
        add left to result

return result
```

### Why Check Before AND After Updating?

For the character being removed:

```text
Before decrement: if counts were equal, they won't be after → match--
After decrement: if counts are now equal → match++
```

Same logic for the character being added.

This way `match` is always accurate.

### Java

```java
import java.util.*;

class Solution {
    public List<Integer> findAnagrams(String s, String p) {
        int n = s.length(), m = p.length();
        if (m > n) return new ArrayList<>();

        int[] pCount = new int[26];
        int[] sCount = new int[26];

        for (int i = 0; i < m; i++) {
            pCount[p.charAt(i) - 'a']++;
            sCount[s.charAt(i) - 'a']++;
        }

        int match = 0;
        for (int i = 0; i < 26; i++) {
            if (pCount[i] == sCount[i]) match++;
        }

        List<Integer> result = new ArrayList<>();
        if (match == 26) result.add(0);

        int left = 0;
        for (int right = m; right < n; right++) {
            int c = s.charAt(left) - 'a';
            if (sCount[c] == pCount[c]) match--;
            sCount[c]--;
            if (sCount[c] == pCount[c]) match++;
            left++;

            c = s.charAt(right) - 'a';
            if (sCount[c] == pCount[c]) match--;
            sCount[c]++;
            if (sCount[c] == pCount[c]) match++;

            if (match == 26) result.add(left);
        }

        return result;
    }
}
```

### Complexity

```text
Time:  O(n + m)
Space: O(1)
```

Why faster than Approach 2?

```text
Approach 2: compares 26 elements after every slide → O(26) per slide
Approach 3: updates 2 characters per slide → O(1) per slide
```

Both are technically O(n), but Approach 3 has a smaller constant factor.

---

## Java Internals

### 1. `Arrays.equals(int[], int[])`

```java
Arrays.equals(pCount, sCount)
```

Compares element by element:

```text
for i = 0 to 25:
    if pCount[i] != sCount[i]: return false
return true
```

This is O(26) = O(1) since array size is fixed.

In Java, `==` on arrays compares references:

```java
pCount == sCount  // false, different objects
```

Always use `Arrays.equals()` for content comparison.

### 2. `int[26]` vs HashMap

For lowercase English letters, `int[26]` is better:

```text
No boxing (int stays primitive)
No hashing overhead
Direct array indexing
Cache-friendly
```

HashMap would work but adds unnecessary overhead for a fixed 26-character alphabet.

### 3. `s.charAt(i) - 'a'`

Converts character to array index:

```text
'a' - 'a' = 0
'b' - 'a' = 1
'z' - 'a' = 25
```

This is a single integer subtraction, O(1).

### 4. Fixed window size

Unlike LC #3 (variable window) or LC #424 (variable window), this problem uses a **fixed** window size equal to `p.length()`.

The window always has exactly `m` characters. We add one and remove one at each step.

---

## Comparison: LC #567 vs LC #438

| | LC #567 Permutation in String | LC #438 Find All Anagrams |
|---|---|---|
| Question | Does ANY permutation of p exist in s? | Find ALL starting indices of p's anagrams in s |
| Return type | `boolean` | `List<Integer>` |
| Core logic | Identical | Identical |
| Difference | Return `true` on first match | Collect all matches |

If you solve one, the other is free.

---

## Edge Cases

### p longer than s

```java
s = "ab", p = "abc"
```

Return empty list. No window of size 3 fits in string of length 2.

### Exact match

```java
s = "abc", p = "abc"
```

Return `[0]`.

### All same characters

```java
s = "aaaa", p = "aa"
```

Return `[0, 1, 2]`. Every window of size 2 is "aa".

### No match

```java
s = "abcdef", p = "xyz"
```

Return `[]`.

---

## Common Mistakes

### Mistake 1: Using `==` to compare arrays

```java
if (pCount == sCount)  // WRONG: compares references
```

Correct:

```java
if (Arrays.equals(pCount, sCount))
```

Or use the match-count approach (Approach 3).

### Mistake 2: Wrong order of add/remove in slide

Must remove the leaving character and add the entering character. The order matters for correctness of the match count in Approach 3.

### Mistake 3: Off-by-one on left index

After removing `s.charAt(left)` and incrementing `left`, the new `left` is the start of the current window.

```java
sCount[s.charAt(left) - 'a']--;
left++;
// now left is the start index of the new window
if (match == 26) result.add(left);
```

### Mistake 4: Forgetting to check initial window

The first window (indices 0 to m-1) must be checked before the sliding loop begins.

---

## Complexity Summary

| Approach | Idea | Time | Space |
|---|---|---:|---:|
| Brute Force | Sort each window | O(n × m log m) | O(m) |
| Sliding Window + Arrays.equals | Compare frequency arrays | O(n) | O(1) |
| Sliding Window + Match Count | Track matching character count | O(n + m) | O(1) |

---

## 60-Second Interview Explanation

> The brute force sorts each window of size m and compares with sorted p, which is O(n × m log m). A better approach uses a sliding window: count character frequencies for p and the initial window, then slide by adding the new character and removing the old one. After each slide, compare the two frequency arrays using Arrays.equals(), which is O(26) per step. The optimal approach avoids even the 26-element comparison by tracking a match count — how many of the 26 characters currently have equal frequencies between the window and p. When a character enters or leaves, I update match for only that character. When match equals 26, all frequencies agree and I add the current left index to the result. Time is O(n + m), space is O(1).

---

## Practice Exercise

Trace this manually using Approach 3 (match count):

```java
s = "abab", p = "ab"
```

Answer:

1. What are `pCount` and `sCount` for the initial window?
2. What is `match` initially?
3. What happens to `match` when you slide to each new position?
4. What are all the indices in the result?
