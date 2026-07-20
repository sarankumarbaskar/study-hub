# LC #3 — Longest Substring Without Repeating Characters

> Date: 2026-07-20 | Pattern: Sliding Window | Difficulty: Medium | LC#: 3

---

## Problem

Given a string `s`, find the length of the **longest substring** without repeating characters.

Example:

```java
Input:  s = "abcabcbb"
Output: 3
```

Why?

```text
The longest substring without repeating characters is "abc".
Length = 3.
```

More examples:

```java
Input:  s = "bbbbb"
Output: 1
// Every character is 'b'. Longest unique substring is "b".

Input:  s = "pwwkew"
Output: 3
// "wke" is the longest. Note: "pwke" is a subsequence, not a substring.
```

Important:

```text
Substring = contiguous characters.
Subsequence = characters in order but not necessarily contiguous.

This problem asks for substring.
```

---

## Pattern

**Sliding Window with HashMap**

Why?

We need to find the longest contiguous range of characters where no character repeats.

A sliding window expands to the right and shrinks from the left when a duplicate is found.

A HashMap tracks the **last seen index** of each character so we know where to shrink the window.

---

## Key Insight

Maintain a window `[left, right]`.

Expand `right` one character at a time.

If `s.charAt(right)` was seen before **and** its last position is within the current window:

```text
move left to lastSeen + 1
```

This skips over the duplicate and everything before it.

Visual:

```text
s = "abcabcbb"

Window: [a b c]
         L   R

Now R moves to 'a' at index 3.
'a' was last seen at index 0, which is inside the window.

Move L to 0 + 1 = 1.

Window: [b c a]
          L   R
```

---

## Approach 1: Brute Force

Check every possible substring. For each, verify if all characters are unique.

### Pseudocode

```text
best = 0

for i = 0 to n-1:
    for j = i to n-1:
        if substring s[i..j] has all unique characters:
            best = max(best, j - i + 1)

return best
```

To check uniqueness, use a Set:

```text
for each character in substring:
    if character already in set:
        not unique
    else:
        add to set
```

### Java

```java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        int best = 0;

        for (int i = 0; i < s.length(); i++) {
            Set<Character> seen = new HashSet<>();
            for (int j = i; j < s.length(); j++) {
                if (seen.contains(s.charAt(j))) {
                    break;
                }
                seen.add(s.charAt(j));
                best = Math.max(best, j - i + 1);
            }
        }

        return best;
    }
}
```

### Complexity

```text
Time:  O(n²)
Space: O(min(n, alphabet size))
```

Why not enough?

For each starting position, we scan forward. Nested loops give O(n²).

---

## Approach 2: Optimal — Sliding Window with HashMap

Maintain a window `[left, right]`.

Use a HashMap to store:

```text
character → last seen index
```

When we see a character that's already in the map **and** its last index is within the current window (`>= left`):

```text
shrink window: left = lastSeenIndex + 1
```

Update the map with the new index for the current character.

Track the maximum window size.

### Pseudocode

```text
create empty map: character -> last index
left = 0
best = 0

for right = 0 to n-1:
    char = s[right]

    if char exists in map AND map[char] >= left:
        left = map[char] + 1

    map[char] = right

    best = max(best, right - left + 1)

return best
```

### Trace

```java
s = "abcabcbb"
```

```text
map = {}
left = 0
best = 0

right=0, char='a':
  'a' not in map
  map = {a:0}
  window = [0,0] = "a", length 1
  best = 1

right=1, char='b':
  'b' not in map
  map = {a:0, b:1}
  window = [0,1] = "ab", length 2
  best = 2

right=2, char='c':
  'c' not in map
  map = {a:0, b:1, c:2}
  window = [0,2] = "abc", length 3
  best = 3

right=3, char='a':
  'a' IS in map, map['a'] = 0, 0 >= left(0)? YES
  left = 0 + 1 = 1
  map = {a:3, b:1, c:2}
  window = [1,3] = "bca", length 3
  best = 3

right=4, char='b':
  'b' IS in map, map['b'] = 1, 1 >= left(1)? YES
  left = 1 + 1 = 2
  map = {a:3, b:4, c:2}
  window = [2,4] = "cab", length 3
  best = 3

right=5, char='c':
  'c' IS in map, map['c'] = 2, 2 >= left(2)? YES
  left = 2 + 1 = 3
  map = {a:3, b:4, c:5}
  window = [3,5] = "abc", length 3
  best = 3

right=6, char='b':
  'b' IS in map, map['b'] = 4, 4 >= left(3)? YES
  left = 4 + 1 = 5
  map = {a:3, b:6, c:5}
  window = [5,6] = "cb", length 2
  best = 3

right=7, char='b':
  'b' IS in map, map['b'] = 6, 6 >= left(5)? YES
  left = 6 + 1 = 7
  map = {a:3, b:7, c:5}
  window = [7,7] = "b", length 1
  best = 3

Return: 3
```

### Java

```java
import java.util.HashMap;
import java.util.Map;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> map = new HashMap<>();

        int left = 0;
        int best = 0;

        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);

            if (map.containsKey(c) && map.get(c) >= left) {
                left = map.get(c) + 1;
            }

            map.put(c, right);

            best = Math.max(best, right - left + 1);
        }

        return best;
    }
}
```

### Complexity

```text
Time:  O(n)
Space: O(min(n, alphabet size))
```

Why O(n)?

`right` moves from 0 to n-1: one pass.

`left` only moves forward, never backward.

Each character is processed once by `right`.

So total work is O(n).

---

## Why Check `map.get(c) >= left`?

This is the most important detail.

Without this check, you can accidentally shrink the window backward.

Example:

```java
s = "abba"
```

```text
right=0, 'a': map={a:0}, left=0, window="a"
right=1, 'b': map={a:0,b:1}, left=0, window="ab"
right=2, 'b': 'b' in map at 1, 1 >= left(0)? YES
              left = 2, map={a:0,b:2}, window="b"
right=3, 'a': 'a' in map at 0, 0 >= left(2)? NO!
              DO NOT move left backward
              map={a:3,b:2}, window="ba"
              best = 2
```

If we did NOT check `>= left`:

```text
right=3, 'a': 'a' in map at 0
              left = 0 + 1 = 1  ← WRONG! left moves backward from 2 to 1
              window = "bba" ← contains duplicate 'b'!
```

The check ensures:

```text
Only react to duplicates that are INSIDE the current window.
Old duplicates outside the window are irrelevant.
```

---

## Alternative: Using int[128] Instead of HashMap

For ASCII characters, you can use an array instead of HashMap.

```java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        int[] lastSeen = new int[128];
        Arrays.fill(lastSeen, -1);

        int left = 0;
        int best = 0;

        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);

            if (lastSeen[c] >= left) {
                left = lastSeen[c] + 1;
            }

            lastSeen[c] = right;

            best = Math.max(best, right - left + 1);
        }

        return best;
    }
}
```

Why `int[128]`?

ASCII has 128 characters. Each index represents a character.

`lastSeen['a']` = last index where 'a' was seen.

Initialize with -1 (never seen).

This avoids HashMap overhead (boxing, hashing, collision handling).

---

## Java Internals

### 1. `s.charAt(right)`

Accesses one character from the string.

In Java 9+, strings use `byte[]` internally (compact strings). For Latin-1 characters, this is a single byte access.

### 2. `Map<Character, Integer>` autoboxing

`char` is autoboxed to `Character`.

`int` (the index) is autoboxed to `Integer`.

For DSA, this is fine.

For the `int[128]` approach, there is no boxing — it uses primitive `char` as an array index directly:

```java
lastSeen[c] = right;
```

This is faster.

### 3. HashMap vs int[128] performance

```text
HashMap:
  O(1) average per operation
  but has hashing + boxing + object allocation overhead

int[128]:
  O(1) guaranteed per operation
  no boxing, no hashing, cache-friendly array access
```

For interview, either is accepted. The `int[128]` version is cleaner and faster.

### 4. String immutability

```java
s.charAt(right)
```

is a read-only operation. The string is not modified.

Java strings are immutable. No character can be changed in-place.

---

## Edge Cases

### Empty string

```java
s = ""
```

Loop never runs. Return 0.

### Single character

```java
s = "a"
```

Window is just `"a"`. Return 1.

### All same characters

```java
s = "bbbbb"
```

```text
right=0: 'b', map={b:0}, window="b", best=1
right=1: 'b' at 0, left=1, map={b:1}, window="b", best=1
right=2: 'b' at 1, left=2, map={b:2}, window="b", best=1
...
```

Return 1.

### All unique characters

```java
s = "abcdef"
```

Window grows to full string. Return 6.

### Spaces and special characters

```java
s = "a b c"
```

Space is a valid character. Treat it like any other.

### Unicode

If the problem allows Unicode (not just ASCII), use `HashMap<Character, Integer>` instead of `int[128]`.

---

## Common Mistakes

### Mistake 1: Not checking `>= left`

Without the boundary check, `left` can move backward, causing the window to contain duplicates.

### Mistake 2: Using a Set instead of Map

A Set can track what's in the window, but you need to shrink one character at a time:

```java
while (set.contains(c)) {
    set.remove(s.charAt(left));
    left++;
}
```

This works but is slower conceptually. The HashMap approach jumps directly to the correct `left` position.

### Mistake 3: Forgetting to update the map after moving left

Always update:

```java
map.put(c, right);
```

regardless of whether `left` moved or not.

### Mistake 4: Returning the substring instead of the length

The problem asks for length, not the actual substring.

---

## Complexity Summary

| Approach | Idea | Time | Space |
|---|---|---:|---:|
| Brute Force | Check every substring for uniqueness | O(n²) | O(alphabet) |
| Sliding Window + HashMap | Expand right, jump left on duplicate | O(n) | O(alphabet) |
| Sliding Window + int[128] | Same logic, array instead of map | O(n) | O(1) |

---

## 60-Second Interview Explanation

> The brute force checks every substring for uniqueness, which is O(n²). The optimal approach uses a sliding window. I maintain a window [left, right] and a HashMap that stores the last seen index of each character. I expand right one character at a time. If the current character was already seen and its last index is within the current window, I jump left to lastSeenIndex + 1. This skips over the duplicate without shrinking one character at a time. I update the map and track the maximum window size. The key detail is checking whether the last seen index is greater than or equal to left — otherwise, old duplicates outside the window would incorrectly shrink it. Each character is processed once, so time is O(n). Space is O(alphabet size), which is O(1) for ASCII.

---

## Practice Exercise

Trace this manually:

```java
s = "abba"
```

Answer:

1. What is `left`, `right`, `map`, and `best` at each step?
2. At `right=3` ('a'), why does `left` NOT move backward?
3. What would go wrong without the `>= left` check?
4. What is the final answer?
