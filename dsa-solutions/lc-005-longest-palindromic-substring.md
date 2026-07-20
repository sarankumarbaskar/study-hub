# LC #5 — Longest Palindromic Substring

> Date: 2026-07-20 | Pattern: Two Pointers / Expand Around Center | Difficulty: Medium | LC#: 5

---

## Problem

Given a string `s`, return the **longest palindromic substring** in `s`.

A palindrome reads the same forward and backward.

Example:

```java
Input:  s = "babad"
Output: "bab"    (or "aba" — both are valid)
```

```java
Input:  s = "cbbd"
Output: "bb"
```

---

## Pattern

**Two Pointers — Expand Around Center**

Why?

A palindrome mirrors around its center.

For every possible center, expand outward as long as characters match.

There are two types of centers:

```text
Odd-length palindrome:   center is one character
   "aba" → center is 'b'

Even-length palindrome:  center is between two characters
   "abba" → center is between 'b' and 'b'
```

So for a string of length `n`, there are:

```text
n odd centers  (each character)
n-1 even centers  (each gap between characters)
Total: 2n - 1 centers
```

For each center, expand outward. Track the longest.

---

## Key Insight

Instead of checking every substring (O(n³)), we check every **center** (O(n)) and expand outward (O(n) worst case per center).

Total: O(n²).

This is simpler and faster than brute force.

Visual for `s = "babad"`:

```text
Try center at index 0 ('b'):
  expand: 'b' → just 'b'
  length 1

Try center at index 1 ('a'):
  expand: check s[0] and s[2] → 'b' == 'b'? NO wait...
  s[0]='b', s[2]='b' → YES
  "bab" → length 3
  expand more: s[-1] out of bounds → stop

Try center at index 2 ('b'):
  expand: s[1] and s[3] → 'a' == 'a'? YES
  "aba" → length 3
  expand more: s[0] and s[4] → 'b' == 'd'? NO → stop

Try center between index 1 and 2 ('a','b'):
  s[1] == s[2]? 'a' == 'b'? NO → length 0

...and so on for all centers.

Best = "bab" or "aba", length 3
```

---

## Approach 1: Brute Force

Check every possible substring. For each, verify if it is a palindrome.

### Pseudocode

```text
best = ""

for i = 0 to n-1:
    for j = i to n-1:
        substring = s[i..j]

        if substring is palindrome:
            if substring.length > best.length:
                best = substring

return best
```

To check palindrome:

```text
isPalindrome(str):
    left = 0
    right = str.length - 1

    while left < right:
        if str[left] != str[right]:
            return false
        left++
        right--

    return true
```

### Java

```java
class Solution {
    public String longestPalindrome(String s) {
        String best = "";

        for (int i = 0; i < s.length(); i++) {
            for (int j = i; j < s.length(); j++) {
                String sub = s.substring(i, j + 1);

                if (isPalindrome(sub) && sub.length() > best.length()) {
                    best = sub;
                }
            }
        }

        return best;
    }

    private boolean isPalindrome(String str) {
        int left = 0;
        int right = str.length() - 1;

        while (left < right) {
            if (str.charAt(left) != str.charAt(right)) {
                return false;
            }
            left++;
            right--;
        }

        return true;
    }
}
```

### Complexity

```text
Time:  O(n³) — n² substrings × O(n) palindrome check each
Space: O(n) for substring creation
```

Why not enough?

Three nested levels of work. Far too slow for large strings.

---

## Approach 2: Optimal — Expand Around Center

For each possible center, expand outward while characters match.

Handle two cases:

```text
1. Odd-length:  expand(s, i, i)
2. Even-length: expand(s, i, i + 1)
```

### Pseudocode

```text
start = 0
maxLen = 0

for i = 0 to n-1:
    // odd-length palindrome centered at i
    left = i
    right = i
    while left >= 0 AND right < n AND s[left] == s[right]:
        if right - left + 1 > maxLen:
            start = left
            maxLen = right - left + 1
        left--
        right++

    // even-length palindrome centered between i and i+1
    left = i
    right = i + 1
    while left >= 0 AND right < n AND s[left] == s[right]:
        if right - left + 1 > maxLen:
            start = left
            maxLen = right - left + 1
        left--
        right++

return s[start .. start + maxLen]
```

### Trace

```java
s = "cbbd"
```

```text
i=0, center='c':
  odd:  expand(0,0) → 'c' matches itself → length 1
        expand(-1,1) → out of bounds → stop
  even: expand(0,1) → 'c' == 'b'? NO → stop

i=1, center='b':
  odd:  expand(1,1) → 'b' → length 1
        expand(0,2) → 'c' == 'b'? NO → stop
  even: expand(1,2) → 'b' == 'b'? YES → "bb" length 2
        expand(0,3) → 'c' == 'd'? NO → stop

i=2, center='b':
  odd:  expand(2,2) → 'b' → length 1
        expand(1,3) → 'b' == 'd'? NO → stop
  even: expand(2,3) → 'b' == 'd'? NO → stop

i=3, center='d':
  odd:  expand(3,3) → 'd' → length 1
  even: expand(3,4) → out of bounds → stop

Best: start=1, maxLen=2 → "bb"
```

### Java

```java
class Solution {
    public String longestPalindrome(String s) {
        if (s == null || s.length() == 0) {
            return "";
        }

        int start = 0;
        int maxLen = 0;

        for (int i = 0; i < s.length(); i++) {
            // odd-length palindrome
            int len1 = expandAroundCenter(s, i, i);

            // even-length palindrome
            int len2 = expandAroundCenter(s, i, i + 1);

            int len = Math.max(len1, len2);

            if (len > maxLen) {
                maxLen = len;
                start = i - (len - 1) / 2;
            }
        }

        return s.substring(start, start + maxLen);
    }

    private int expandAroundCenter(String s, int left, int right) {
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            left--;
            right++;
        }

        return right - left - 1;
    }
}
```

### Why `right - left - 1`?

When the while loop exits:

```text
left and right have moved one step PAST the palindrome boundaries
```

Example:

```text
s = "bab"
expand(1, 1):
  left=1, right=1 → 'a'=='a' → expand
  left=0, right=2 → 'b'=='b' → expand
  left=-1, right=3 → out of bounds → stop

Now left=-1, right=3
Palindrome is from index 0 to 2
Length = right - left - 1 = 3 - (-1) - 1 = 3 ✅
```

### Why `start = i - (len - 1) / 2`?

`i` is the center.

The palindrome extends `(len - 1) / 2` characters to the left of center.

Example:

```text
"bab", i=1, len=3
start = 1 - (3-1)/2 = 1 - 1 = 0 ✅
```

For even-length:

```text
"bb", i=0, len=2
start = 0 - (2-1)/2 = 0 - 0 = 0 ✅
```

### Complexity

```text
Time:  O(n²) — n centers × O(n) expansion each
Space: O(1) — only a few variables
```

Why O(n²)?

Worst case: entire string is one character, like `"aaaa"`.

Each center expands almost to the full string length.

But in practice, most centers expand very little.

---

## Java Internals

### 1. `s.charAt(left)` vs `s.charAt(right)`

Direct character access on the string.

In Java 9+, strings use `byte[]` internally (compact strings).

For Latin-1 characters, `charAt()` is a single byte read.

No object creation per character.

### 2. `s.substring(start, start + maxLen)`

Creates a **new String** object.

In Java 7+, `substring()` creates a new backing array (no shared array).

So this is O(n) for the substring creation.

But it's called only once at the end, so it doesn't affect the O(n²) time.

### 3. No extra data structures

This solution uses only:

```text
int start
int maxLen
int left
int right
```

No HashMap, no array, no Set.

That's why space is O(1).

### 4. Integer division for start calculation

```java
start = i - (len - 1) / 2;
```

Java integer division truncates toward zero:

```text
(3 - 1) / 2 = 1
(2 - 1) / 2 = 0
```

This correctly handles both odd and even lengths.

---

## Edge Cases

### Single character

```java
s = "a"
```

Every single character is a palindrome. Return `"a"`.

### Two same characters

```java
s = "bb"
```

Even-length expansion at center (0, 1):

```text
'b' == 'b' → "bb" → length 2
```

Return `"bb"`.

### Two different characters

```java
s = "ab"
```

No expansion works beyond single characters. Return `"a"` or `"b"`.

### Entire string is palindrome

```java
s = "racecar"
```

Center at index 3 ('e') expands to full string. Return `"racecar"`.

### All same characters

```java
s = "aaaa"
```

Multiple palindromes of length 4. Return `"aaaa"`.

---

## Common Mistakes

### Mistake 1: Only checking odd-length palindromes

Bad:

```java
expand(s, i, i)
```

This misses even-length palindromes like `"bb"`.

Must also check:

```java
expand(s, i, i + 1)
```

### Mistake 2: Wrong start calculation

The formula:

```java
start = i - (len - 1) / 2;
```

is specific to how `i` relates to the center.

If you compute start differently, trace with both odd and even examples to verify.

### Mistake 3: Returning length instead of substring

The problem asks for the **substring itself**, not the length.

```java
return s.substring(start, start + maxLen);
```

### Mistake 4: Forgetting `right - left - 1`

After the while loop, `left` and `right` are **past** the palindrome boundaries.

The length is NOT `right - left + 1`. It is:

```java
right - left - 1
```

---

## Complexity Summary

| Approach | Idea | Time | Space |
|---|---|---:|---:|
| Brute Force | Check every substring | O(n³) | O(n) |
| Expand Around Center | Try each center, expand outward | O(n²) | O(1) |

Note: There is also Manacher's algorithm at O(n), but it is rarely expected in interviews. Expand around center is the standard answer.

---

## 60-Second Interview Explanation

> The brute force checks every substring and verifies if it's a palindrome, which is O(n³). The optimal approach is expand around center. A palindrome mirrors around its center, so I try every possible center — each index for odd-length, and each gap between indices for even-length. That's 2n-1 centers. For each center, I expand outward with two pointers while characters match. I track the longest palindrome found. Time is O(n²) because each expansion can take up to O(n), and space is O(1) because I only store the start index and max length. This is the standard interview solution — Manacher's O(n) algorithm exists but is rarely expected.

---

## Practice Exercise

Trace this manually:

```java
s = "aacabdkacaa"
```

Answer:

1. Which center produces the longest palindrome?
2. Is it odd-length or even-length?
3. What are `left` and `right` when expansion stops?
4. What is `right - left - 1`?
5. What is the final substring?
