# Sliding Window

> Maintain a "window" over a sequence and efficiently update it as you slide—avoiding redundant recomputation by leveraging what changed at the boundaries.

## What Is This Pattern?

The sliding window pattern operates on arrays or strings by maintaining a **window** (a contiguous subrange) with two pointers—usually `left` and `right`. As you advance `right` to expand the window, you may shrink it from `left` to satisfy constraints or optimize the result. The key insight: instead of recomputing the window's properties from scratch each time, you **incrementally update** based on what entered (right boundary) and what left (left boundary).

Think of it as a physical pane sliding along a track. You don't rebuild the entire pane when it moves—you only account for the new element that came in and the old one that left. This incremental update is what gives sliding window its O(n) efficiency where brute-force would be O(n²) or worse.

There are two main flavors: **fixed-size** windows (e.g., "max sum of every k consecutive elements") where the window width is constant, and **variable-size** windows (e.g., "longest subarray with sum ≤ x") where you grow and shrink the window to meet a condition. Both share the same philosophy: avoid redundant work by tracking only what changes.

## When to Use This Pattern

- The problem asks for a **contiguous subarray** or **substring** (not subsequence).
- You need to compute something over **every** or **optimal** window of elements.
- There's a **constraint** on the window (size, sum, distinct count, character frequencies).
- A brute-force approach would iterate over all O(n²) subarrays—sliding window can often reduce to O(n).
- The problem involves **"at most k"**, **"exactly k"**, or **"minimum/maximum length satisfying X"**.
- You see phrases like "substring with", "subarray sum", "longest/shortest contiguous", "without repeating characters".

## How to Identify This Pattern

```
Is the input a 1D array or string?
    NO → Consider other patterns (graph, tree, 2D DP)
    YES ↓

Are we looking for a contiguous subarray/substring?
    NO → (subsequence → different pattern)
    YES ↓

Do we need to consider many/all windows of a certain type?
    NO → Maybe simple scan or greedy
    YES ↓

Can we update the answer incrementally when the window shifts?
    (add right element, remove left element, update aggregate)
    YES → SLIDING WINDOW
```

## Core Template (Pseudocode)

### Fixed-Size Window

```
FUNCTION solve(arr, k):
    windowSum = sum of first k elements
    result = windowSum  // or appropriate initial value

    FOR right FROM k TO n-1:
        windowSum += arr[right] - arr[right - k]  // add new, drop old
        result = UPDATE(result, windowSum)

    RETURN result
```

### Variable-Size Window

```
FUNCTION solve(arr):
    left = 0
    result = INITIAL_VALUE  // 0, INF, or -INF depending on problem

    FOR right FROM 0 TO n-1:
        ADD arr[right] to window (update frequency/map/sum)
        WHILE window violates constraint:
            REMOVE arr[left] from window
            left++
        result = UPDATE(result, window)  // candidate is now valid

    RETURN result
```

## Core Template (Java)

### Fixed-Size Window

```java
public int fixedWindow(int[] nums, int k) {
    int windowSum = 0;
    for (int i = 0; i < k; i++) {
        windowSum += nums[i];
    }
    int result = windowSum;

    for (int right = k; right < nums.length; right++) {
        windowSum += nums[right] - nums[right - k];
        result = Math.max(result, windowSum); // or min, depending
    }
    return result;
}
```

### Variable-Size Window

```java
public int variableWindow(int[] nums, int target) {
    int left = 0;
    int sum = 0;
    int result = Integer.MAX_VALUE; // or 0, -1, etc.

    for (int right = 0; right < nums.length; right++) {
        sum += nums[right];

        while (sum >= target) {  // constraint: e.g., sum >= target
            result = Math.min(result, right - left + 1);
            sum -= nums[left];
            left++;
        }
    }
    return result == Integer.MAX_VALUE ? 0 : result;
}
```

## Complexity Cheat Sheet

| Type         | Time     | Space  | Notes                                             |
|--------------|----------|--------|---------------------------------------------------|
| Fixed        | O(n)     | O(1)   | Single pass, constant extra space                  |
| Variable     | O(n)     | O(1)   | When using primitive variables only               |
| Variable     | O(n)     | O(k)   | When using map for k distinct elements/freq       |
| Deque-based  | O(n)     | O(k)   | Sliding window max/min with monotonic deque       |

## Problems (Progressive Difficulty)

### Easy (2 problems)

#### Problem: [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) (LeetCode #121)

- **Intuition:** Track the minimum price seen so far; at each day, the best profit is selling today minus that minimum. This is a "one-way" sliding window where we only expand right and conceptually compare with a left-bound min.
- **Brute Force:** Try every pair (i, j) where i < j; compute prices[j] - prices[i] and track the maximum. Time O(n²), Space O(1)
- **Optimized Approach:** 1) Initialize minPrice = prices[0], maxProfit = 0. 2) For each price from index 1: update maxProfit = max(maxProfit, price - minPrice), then minPrice = min(minPrice, price). 3) Return maxProfit.
- **Java Solution:**

```java
class Solution {
    public int maxProfit(int[] prices) {
        if (prices == null || prices.length < 2) return 0;
        int minPrice = prices[0];
        int maxProfit = 0;
        for (int i = 1; i < prices.length; i++) {
            maxProfit = Math.max(maxProfit, prices[i] - minPrice);
            minPrice = Math.min(minPrice, prices[i]);
        }
        return maxProfit;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/) (LeetCode #643)

- **Intuition:** Fixed-size window of k elements. Compute sum of first k, then slide by adding the next and subtracting the first; track max sum (or max average = maxSum/k).
- **Brute Force:** For each starting index i, compute the sum of the k elements nums[i..i+k-1] from scratch; track the maximum sum. Time O(n·k), Space O(1)
- **Optimized Approach:** 1) Sum first k elements. 2) Slide right from k to n-1: windowSum += nums[right] - nums[right-k]. 3) Track max window sum. 4) Return maxSum / k.
- **Java Solution:**

```java
class Solution {
    public double findMaxAverage(int[] nums, int k) {
        int windowSum = 0;
        for (int i = 0; i < k; i++) {
            windowSum += nums[i];
        }
        int maxSum = windowSum;
        for (int right = k; right < nums.length; right++) {
            windowSum += nums[right] - nums[right - k];
            maxSum = Math.max(maxSum, windowSum);
        }
        return (double) maxSum / k;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

### Medium (6 problems)

#### Problem: [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) (LeetCode #3)

- **Intuition:** Variable window. Expand right, add chars to a set/map; when a repeat appears, shrink left until the duplicate is removed.
- **Brute Force:** Check every substring for uniqueness; for each starting index, expand and add chars until a duplicate is found. Time O(n²), Space O(min(n, charset))
- **Optimized Approach:** 1) Use a Set (or freq map) to track chars in window. 2) For each right: while s[right] is in set, remove s[left] and advance left. 3) Add s[right], update maxLen = max(maxLen, right - left + 1). 4) Return maxLen.
- **Java Solution:**

```java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        if (s == null || s.isEmpty()) return 0;
        var seen = new java.util.HashSet<Character>();
        int left = 0;
        int maxLen = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            while (seen.contains(c)) {
                seen.remove(s.charAt(left++));
            }
            seen.add(c);
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}
```

- **Complexity:** Time O(n), Space O(min(n, charset))

---

#### Problem: [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/) (LeetCode #424)

- **Intuition:** Variable window. We can replace at most k chars; the window is valid if (windowSize - maxFreq) ≤ k. Track freq of each char; window size minus the dominant char's count gives replacements needed.
- **Brute Force:** Try every substring; for each, count char frequencies, compute replacements needed (windowSize - maxFreq), and keep it if ≤ k. Time O(n²·26), Space O(26)
- **Optimized Approach:** 1) Freq map for chars in window. 2) Expand right, update freq. 3) While (right-left+1 - maxFreq) > k, shrink left and decrement freq. 4) maxLen = max(maxLen, right-left+1). Note: we don't shrink when valid—we only need the longest valid window.
- **Java Solution:**

```java
class Solution {
    public int characterReplacement(String s, int k) {
        int[] freq = new int[26];
        int left = 0;
        int maxFreq = 0;
        int maxLen = 0;
        for (int right = 0; right < s.length(); right++) {
            int idx = s.charAt(right) - 'A';
            freq[idx]++;
            maxFreq = Math.max(maxFreq, freq[idx]);
            int windowLen = right - left + 1;
            if (windowLen - maxFreq > k) {
                freq[s.charAt(left) - 'A']--;
                left++;
            }
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Permutation in String](https://leetcode.com/problems/permutation-in-string/) (LeetCode #567)

- **Intuition:** Fixed window of len(s1). Check if any window in s2 has the same character frequencies as s1—i.e., is a permutation.
- **Brute Force:** Slide a window of size len(s1) over s2; for each window, build a freq map and compare with s1's freq map. Time O(n·m·26), Space O(26)
- **Optimized Approach:** 1) Build freq map of s1. 2) Slide a window of size len(s1) over s2. 3) For each window, maintain freq of chars in window; when window size equals len(s1), compare with s1's map (or use a "matches" count). 4) Return true if any window matches.
- **Java Solution:**

```java
class Solution {
    public boolean checkInclusion(String s1, String s2) {
        if (s1.length() > s2.length()) return false;
        int[] s1Freq = new int[26];
        int[] winFreq = new int[26];
        for (int i = 0; i < s1.length(); i++) {
            s1Freq[s1.charAt(i) - 'a']++;
            winFreq[s2.charAt(i) - 'a']++;
        }
        int matches = 0;
        for (int i = 0; i < 26; i++) {
            if (s1Freq[i] == winFreq[i]) matches++;
        }
        if (matches == 26) return true;
        for (int right = s1.length(); right < s2.length(); right++) {
            if (matches == 26) return true;
            int add = s2.charAt(right) - 'a';
            winFreq[add]++;
            if (winFreq[add] == s1Freq[add]) matches++;
            else if (winFreq[add] == s1Freq[add] + 1) matches--;
            int remove = s2.charAt(right - s1.length()) - 'a';
            winFreq[remove]--;
            if (winFreq[remove] == s1Freq[remove]) matches++;
            else if (winFreq[remove] == s1Freq[remove] - 1) matches--;
        }
        return matches == 26;
    }
}
```

- **Complexity:** Time O(n + m), Space O(1)

---

#### Problem: [Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/) (LeetCode #209)

- **Intuition:** Variable window. Expand right, add to sum; when sum ≥ target, shrink left while sum ≥ target, track min window length.
- **Brute Force:** Try every subarray; for each starting index, extend right until sum ≥ target and record the length. Time O(n²), Space O(1)
- **Optimized Approach:** 1) left=0, sum=0, minLen=∞. 2) For each right: sum += nums[right]. 3) While sum ≥ target: minLen = min(minLen, right-left+1); sum -= nums[left]; left++. 4) Return minLen or 0.
- **Java Solution:**

```java
class Solution {
    public int minSubArrayLen(int target, int[] nums) {
        int left = 0;
        int sum = 0;
        int minLen = Integer.MAX_VALUE;
        for (int right = 0; right < nums.length; right++) {
            sum += nums[right];
            while (sum >= target) {
                minLen = Math.min(minLen, right - left + 1);
                sum -= nums[left++];
            }
        }
        return minLen == Integer.MAX_VALUE ? 0 : minLen;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Fruit Into Baskets](https://leetcode.com/problems/fruit-into-baskets/) (LeetCode #904)

- **Intuition:** Variable window with at most 2 distinct types. Expand right; when a third type appears, shrink left until we're back to 2 types.
- **Brute Force:** Try every subarray; for each, count distinct fruit types and keep the longest with ≤ 2 types. Time O(n²), Space O(1)
- **Optimized Approach:** 1) Map from fruit type to count (or last index). 2) Expand right, add fruit. 3) While distinct count > 2: remove left fruit, advance left. 4) Track max window size.
- **Java Solution:**

```java
class Solution {
    public int totalFruit(int[] fruits) {
        var count = new java.util.HashMap<Integer, Integer>();
        int left = 0;
        int maxLen = 0;
        for (int right = 0; right < fruits.length; right++) {
            count.merge(fruits[right], 1, Integer::sum);
            while (count.size() > 2) {
                int f = fruits[left];
                count.put(f, count.get(f) - 1);
                if (count.get(f) == 0) count.remove(f);
                left++;
            }
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}
```

- **Complexity:** Time O(n), Space O(1) (at most 3 keys)

---

#### Problem: [Max Consecutive Ones III](https://leetcode.com/problems/max-consecutive-ones-iii/) (LeetCode #1004)

- **Intuition:** Variable window. We can flip at most k zeros to ones. Track zeros in window; when zeros > k, shrink left until zeros ≤ k.
- **Brute Force:** Try every subarray; for each, count zeros and keep the longest with ≤ k zeros. Time O(n²), Space O(1)
- **Optimized Approach:** 1) left=0, zeros=0. 2) For each right: if nums[right]==0, zeros++. 3) While zeros>k: if nums[left]==0, zeros--; left++. 4) maxLen = max(maxLen, right-left+1).
- **Java Solution:**

```java
class Solution {
    public int longestOnes(int[] nums, int k) {
        int left = 0;
        int zeros = 0;
        int maxLen = 0;
        for (int right = 0; right < nums.length; right++) {
            if (nums[right] == 0) zeros++;
            while (zeros > k) {
                if (nums[left] == 0) zeros--;
                left++;
            }
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

### Hard (3 problems)

#### Problem: [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) (LeetCode #76)

- **Intuition:** Variable window. Expand right until we have all chars of t; then shrink left while still valid; track the minimum valid window.
- **Brute Force:** Try every substring of s; for each, check if it contains all chars of t (with correct frequencies); keep the shortest valid one. Time O(n²·m), Space O(m)
- **Optimized Approach:** 1) Build freq map of t. 2) Expand right: add s[right], decrement required count when we satisfy a char. 3) When all required chars present: shrink left until invalid, then back up by one. 4) Track min window start/length.
- **Java Solution:**

```java
class Solution {
    public String minWindow(String s, String t) {
        if (s.isEmpty() || t.isEmpty()) return "";
        var tFreq = new java.util.HashMap<Character, Integer>();
        for (char c : t.toCharArray()) {
            tFreq.merge(c, 1, Integer::sum);
        }
        int required = tFreq.size();
        int formed = 0;
        var winFreq = new java.util.HashMap<Character, Integer>();
        int left = 0;
        int minLen = Integer.MAX_VALUE;
        int minStart = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            winFreq.merge(c, 1, Integer::sum);
            if (tFreq.containsKey(c) && winFreq.get(c).equals(tFreq.get(c))) {
                formed++;
            }
            while (formed == required) {
                if (right - left + 1 < minLen) {
                    minLen = right - left + 1;
                    minStart = left;
                }
                char d = s.charAt(left);
                winFreq.put(d, winFreq.get(d) - 1);
                if (tFreq.containsKey(d) && winFreq.get(d) < tFreq.get(d)) {
                    formed--;
                }
                left++;
            }
        }
        return minLen == Integer.MAX_VALUE ? "" : s.substring(minStart, minStart + minLen);
    }
}
```

- **Complexity:** Time O(m + n), Space O(m + n)

---

#### Problem: [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) (LeetCode #239)

- **Intuition:** Fixed-size window. Use a monotonically decreasing deque: elements that can never be the max (smaller than newer elements) are discarded. Front of deque is always the max for current window.
- **Brute Force:** For each window position, scan all k elements to find the maximum. Time O(n·k), Space O(1)
- **Optimized Approach:** 1) Deque stores indices (by value, decreasing). 2) For each right: remove from back while nums[back] < nums[right]. Add right. 3) Remove front if it's outside window (index < left). 4) When window has k elements, record nums[deque.front()].
- **Java Solution:**

```java
class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        var deque = new java.util.ArrayDeque<Integer>();
        int[] result = new int[nums.length - k + 1];
        for (int right = 0; right < nums.length; right++) {
            while (!deque.isEmpty() && nums[deque.peekLast()] < nums[right]) {
                deque.pollLast();
            }
            deque.offerLast(right);
            int left = right - k + 1;
            if (left >= 0) {
                while (deque.peekFirst() < left) {
                    deque.pollFirst();
                }
                result[left] = nums[deque.peekFirst()];
            }
        }
        return result;
    }
}
```

- **Complexity:** Time O(n), Space O(k)

---

#### Problem: [Substring with Concatenation of All Words](https://leetcode.com/problems/substring-with-concatenation-of-all-words/) (LeetCode #30)

- **Intuition:** We need to find substrings that are a concatenation of all words in `words` (each exactly once, any order). Word length is fixed (wLen), so we can try starting positions 0, 1, ..., wLen-1 and slide by wLen.
- **Brute Force:** Try every substring of length totalLen; for each, split into words and check if it's a permutation of the words array. Time O(n·totalLen·m), Space O(m)
- **Optimized Approach:** 1) Build freq map of words. 2) For each start in [0, wLen): slide a window that advances by wLen. 3) For each step, add the next word to window map; when we have more than expected of any word, shrink left by wLen until valid. 4) When window has exactly all words, record start index.
- **Java Solution:**

```java
class Solution {
    public java.util.List<Integer> findSubstring(String s, String[] words) {
        var result = new java.util.ArrayList<Integer>();
        if (words.length == 0 || s.length() < words.length * words[0].length()) return result;
        int wLen = words[0].length();
        int totalLen = words.length * wLen;
        var wordCount = new java.util.HashMap<String, Integer>();
        for (String w : words) {
            wordCount.merge(w, 1, Integer::sum);
        }
        for (int start = 0; start < wLen; start++) {
            var seen = new java.util.HashMap<String, Integer>();
            int left = start;
            int count = 0;
            for (int right = start; right + wLen <= s.length(); right += wLen) {
                String word = s.substring(right, right + wLen);
                if (wordCount.containsKey(word)) {
                    seen.merge(word, 1, Integer::sum);
                    count++;
                    while (seen.get(word) > wordCount.get(word)) {
                        String leftWord = s.substring(left, left + wLen);
                        seen.put(leftWord, seen.get(leftWord) - 1);
                        count--;
                        left += wLen;
                    }
                    if (count == words.length) {
                        result.add(left);
                        String leftWord = s.substring(left, left + wLen);
                        seen.put(leftWord, seen.get(leftWord) - 1);
                        count--;
                        left += wLen;
                    }
                } else {
                    seen.clear();
                    count = 0;
                    left = right + wLen;
                }
            }
        }
        return result;
    }
}
```

- **Complexity:** Time O(n * wLen), Space O(m) where m = words.length

---

## Common Mistakes & Edge Cases

- **Forgetting to shrink:** In variable window, you must shrink when the constraint is violated; otherwise the window grows unbounded and the result is wrong.
- **Off-by-one in window size:** `right - left + 1` is the window length when both are inclusive.
- **Equality in "while" condition:** Use `while (invalid)` not `if`—sometimes you need to shrink multiple steps.
- **Empty or single-element inputs:** Handle `nums.length < k`, `s.isEmpty()`, `t.length() > s.length()`.
- **Integer overflow:** For sum-based problems with large numbers, consider long.
- **CharacterReplacement (#424):** You don't need to shrink when valid—`maxFreq` might be stale but the window length only increases when we have a valid window, and we only care about the longest.
- **MinWindow (#76):** Use `equals()` for Integer comparison (map values), not `==`.
- **SlidingWindowMax (#239):** Store indices in the deque, not values, to detect when the front is out of window.

## Pattern Variations

| Variation               | Example                            | Key Technique                         |
|-------------------------|------------------------------------|--------------------------------------|
| Fixed window sum/avg    | Max Average Subarray I             | Slide by one, update sum              |
| Variable window (sum)   | Min Size Subarray Sum              | Shrink when sum ≥ target              |
| At most k distinct      | Fruit Into Baskets, Longest Substr | Map + shrink when size > k            |
| No repeating chars      | Longest Substring No Repeat        | Set + shrink on duplicate             |
| Replacement budget      | Longest Repeating Char Replacement | (windowSize - maxFreq) ≤ k            |
| Window contains all     | Min Window Substring               | Freq maps, "formed" count             |
| Permutation / anagram   | Permutation in String              | Fixed window + freq match             |
| Sliding max/min         | Sliding Window Maximum             | Monotonic deque                       |
| Multi-word concatenation| Substring with Concat All Words    | Multiple start offsets, word-sized steps |
