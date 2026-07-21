# LC #424 — Longest Repeating Character Replacement

> Date: 2026-07-21 | Pattern: Sliding Window | Difficulty: Medium | LC#: 424

---

## Problem

You are given a string `s` and an integer `k`. You can choose any character and change it to any other uppercase English letter. You can perform this operation at most `k` times.

Return the length of the longest substring containing the same letter you can get after performing the above operations.

Example:

```java
Input:  s = "ABAB", k = 2
Output: 4
```

Why?

```text
Replace the two 'A's with 'B's (or two 'B's with 'A's).
The entire string becomes "BBBB" or "AAAA".
Length = 4.
```

Another example:

```java
Input:  s = "AABABBA", k = 1
Output: 4
```

Why?

```text
Window "AABA" (indices 0–3):
  Most frequent = 'A' appears 3 times
  Window size = 4
  Characters to replace = 4 - 3 = 1
  1 <= k(1) → valid
  Length = 4

Or window "ABBB" → replace 'A' → "BBBB" → length 4
```

---

## Pattern

**Sliding Window + Frequency Count**

Why?

We need the longest contiguous substring where, after at most `k` replacements, all characters are the same.

The key question for any window is:

```text
How many characters do we need to replace?
```

Answer:

```text
replacements needed = window_size - count_of_most_frequent_character
```

If that number is `<= k`, the window is valid.

---

## Key Insight

For a window `[left, right]`:

```text
window_size = right - left + 1
max_freq = frequency of the most common character in the window
replacements = window_size - max_freq
```

If:

```text
replacements <= k → window is valid → try to expand
replacements > k  → window is invalid → shrink from left
```

Visual:

```text
s = "AABABBA", k = 1

Window: [A A B A]
         L     R

max_freq = 3 (three 'A's)
window_size = 4
replacements = 4 - 3 = 1
1 <= k(1) → valid!

Expand right...

Window: [A A B A B]
         L       R

max_freq = 3
window_size = 5
replacements = 5 - 3 = 2
2 > k(1) → invalid!

Shrink left...
```

---

## Approach 1: Brute Force

Try every possible substring. For each, count the most frequent character and check if the rest can be replaced within `k`.

### Pseudocode

```text
best = 0

for left = 0 to n-1:
    count = int[26]

    for right = left to n-1:
        count[s[right] - 'A']++

        maxFreq = max value in count
        windowSize = right - left + 1
        replacements = windowSize - maxFreq

        if replacements <= k:
            best = max(best, windowSize)

return best
```

### Java

```java
class Solution {
    public int characterReplacement(String s, int k) {
        int best = 0;

        for (int left = 0; left < s.length(); left++) {
            int[] count = new int[26];

            for (int right = left; right < s.length(); right++) {
                count[s.charAt(right) - 'A']++;

                int maxFreq = 0;
                for (int freq : count) {
                    maxFreq = Math.max(maxFreq, freq);
                }

                int windowSize = right - left + 1;

                if (windowSize - maxFreq <= k) {
                    best = Math.max(best, windowSize);
                }
            }
        }

        return best;
    }
}
```

### Complexity

```text
Time:  O(n² × 26) = O(n²)
Space: O(26) = O(1)
```

Why not enough?

Nested loops. Too slow for large strings.

---

## Approach 2: Optimal — Sliding Window

Maintain window `[left, right]`.

Track character frequencies in the window using `int[26]`.

Track `maxFreq` — the count of the most frequent character in the window.

Expand `right` every step. Shrink `left` when window is invalid.

### Important Detail About maxFreq

When we shrink the window (move `left` forward), we decrement the count of `s.charAt(left)`.

Technically, `maxFreq` might now be stale (too high). But we do **not** need to recompute it by scanning all 26 counts.

Why?

Because we are looking for the **longest** valid window. A stale (too high) `maxFreq` only makes the window appear more valid than it is — it never makes a valid window appear invalid. And since we already recorded the best length when the window was truly valid, we won't miss the answer.

In practice, `maxFreq` only ever increases or stays the same during expansion. When the window shrinks, we just don't bother decreasing `maxFreq`. This is safe.

### Pseudocode

```text
count = int[26]
left = 0
maxFreq = 0
best = 0

for right = 0 to n-1:
    count[s[right] - 'A']++
    maxFreq = max(maxFreq, count[s[right] - 'A'])

    windowSize = right - left + 1

    if windowSize - maxFreq > k:
        count[s[left] - 'A']--
        left++

    best = max(best, right - left + 1)

return best
```

### Trace

```java
s = "AABABBA", k = 1
```

```text
count = [0]*26
left = 0, maxFreq = 0, best = 0

right=0, char='A':
  count[A]=1
  maxFreq = max(0, 1) = 1
  windowSize = 1
  1 - 1 = 0 <= 1 → valid
  best = 1

right=1, char='A':
  count[A]=2
  maxFreq = max(1, 2) = 2
  windowSize = 2
  2 - 2 = 0 <= 1 → valid
  best = 2

right=2, char='B':
  count[B]=1
  maxFreq = max(2, 1) = 2
  windowSize = 3
  3 - 2 = 1 <= 1 → valid
  best = 3

right=3, char='A':
  count[A]=3
  maxFreq = max(2, 3) = 3
  windowSize = 4
  4 - 3 = 1 <= 1 → valid
  best = 4

right=4, char='B':
  count[B]=2
  maxFreq = max(3, 2) = 3
  windowSize = 5
  5 - 3 = 2 > 1 → INVALID
  shrink: count[A]-- → count[A]=2, left=1

  best = max(4, 5-1) = max(4, 4) = 4

right=5, char='B':
  count[B]=3
  maxFreq = max(3, 3) = 3
  windowSize = 5
  5 - 3 = 2 > 1 → INVALID
  shrink: count[A]-- → count[A]=1, left=2

  best = max(4, 4) = 4

right=6, char='A':
  count[A]=2
  maxFreq = max(3, 2) = 3
  windowSize = 5
  5 - 3 = 2 > 1 → INVALID
  shrink: count[B]-- → count[B]=2, left=3

  best = max(4, 4) = 4

Return: 4
```

### Java

```java
class Solution {
    public int characterReplacement(String s, int k) {
        int[] count = new int[26];

        int left = 0;
        int maxFreq = 0;
        int best = 0;

        for (int right = 0; right < s.length(); right++) {
            count[s.charAt(right) - 'A']++;
            maxFreq = Math.max(maxFreq, count[s.charAt(right) - 'A']);

            int windowSize = right - left + 1;

            if (windowSize - maxFreq > k) {
                count[s.charAt(left) - 'A']--;
                left++;
            }

            best = Math.max(best, right - left + 1);
        }

        return best;
    }
}
```

### Complexity

```text
Time:  O(n)
Space: O(26) = O(1)
```

Why O(n)?

`right` moves from 0 to n-1: one pass.

`left` moves forward at most n times total.

No inner loop to find `maxFreq` — we just track it as we go.

---

## Why `windowSize - maxFreq > k` Means Invalid

Think of it this way:

```text
Window has some characters.
The most frequent character appears maxFreq times.
All other characters need to be replaced to match it.
Number of replacements = windowSize - maxFreq.
If that exceeds k, we can't make the window uniform.
```

Example:

```text
Window: "AABA"
A appears 3 times (maxFreq = 3)
Window size = 4
Replacements = 4 - 3 = 1
If k >= 1, this window is valid.
```

```text
Window: "AABAB"
A appears 3 times (maxFreq = 3)
Window size = 5
Replacements = 5 - 3 = 2
If k = 1, this window is INVALID.
```

---

## Why We Don't Decrease maxFreq

When we shrink the window:

```java
count[s.charAt(left) - 'A']--;
left++;
```

The character we removed might have been the most frequent. So `maxFreq` could now be too high.

But that's okay.

If `maxFreq` is too high, the condition:

```text
windowSize - maxFreq > k
```

becomes harder to trigger (the left side becomes smaller).

That means the window stays the same size or grows — it never gives us a **wrong** longer answer.

The longest valid window was already captured when `maxFreq` was accurate.

So `maxFreq` acts as a "high water mark" — it only matters when it increases, which is when we might find a longer valid window.

---

## Java Internals

### 1. `int[26]` for uppercase English letters

```java
int[] count = new int[26];
```

Each index maps to a letter:

```text
count[0] = frequency of 'A'
count[1] = frequency of 'B'
...
count[25] = frequency of 'Z'
```

Access:

```java
count[s.charAt(right) - 'A']
```

`s.charAt(right)` returns a `char`.

`'A'` is 65 in ASCII.

So `'B' - 'A' = 1`, `'C' - 'A' = 2`, etc.

### 2. No HashMap needed

Since input is only uppercase English letters (26 characters), a fixed-size array is faster than HashMap:

```text
No hashing
No boxing
No collision handling
Direct array indexing
```

### 3. `s.charAt()` is O(1)

Direct access into the string's internal `byte[]` array.

---

## Edge Cases

### k = 0

No replacements allowed. Answer is the longest run of a single character.

```java
s = "AABBA", k = 0
```

Answer: 2 ("AA" or "BB").

### k >= string length

Can replace everything. Answer is the full string length.

```java
s = "ABCDE", k = 5
```

Answer: 5.

### All same characters

```java
s = "AAAA", k = 2
```

No replacements needed. Answer: 4.

### Single character

```java
s = "A", k = 0
```

Answer: 1.

---

## Common Mistakes

### Mistake 1: Recomputing maxFreq by scanning all 26 counts

Bad (inside the loop):

```java
int maxFreq = 0;
for (int freq : count) {
    maxFreq = Math.max(maxFreq, freq);
}
```

This adds O(26) per step.

Correct: track `maxFreq` incrementally:

```java
maxFreq = Math.max(maxFreq, count[s.charAt(right) - 'A']);
```

### Mistake 2: Decreasing maxFreq when shrinking

Don't bother. As explained above, a stale `maxFreq` is safe because we only care about when it increases.

### Mistake 3: Using `while` to shrink instead of `if`

For this problem, shrinking by exactly 1 (using `if`) is sufficient because `right` also advances by 1. The window size changes by at most 1 per step.

If you use `while`, it also works, but `if` is cleaner here because the window either stays the same size or grows by 1.

### Mistake 4: Thinking we need to track WHICH character to keep

We don't decide which character to replace with. We just need to know:

```text
Can we make this window uniform with at most k replacements?
```

The answer depends only on `maxFreq`.

---

## Complexity Summary

| Approach | Idea | Time | Space |
|---|---|---:|---:|
| Brute Force | Check every substring | O(n²) | O(1) |
| Sliding Window | Expand/shrink based on maxFreq | O(n) | O(1) |

---

## 60-Second Interview Explanation

> The brute force checks every substring and counts the most frequent character, which is O(n²). The optimal approach uses a sliding window. I maintain a frequency array of 26 characters and track the maximum frequency in the window. For each position of right, I check if `windowSize - maxFreq > k`. If so, the window needs more than k replacements, so I shrink from the left. Otherwise, the window is valid and I track its size. The key optimization is that maxFreq only ever increases — I don't decrease it when shrinking because a stale high value is safe; it only matters when it genuinely increases, which is when a longer valid window might exist. Time is O(n), space is O(1).

---

## Practice Exercise

Trace this manually:

```java
s = "ABBB", k = 2
```

Answer:

1. What is `maxFreq` at each step?
2. When does the window become invalid?
3. What is the final answer?
4. If `k = 0`, what would the answer be?
