# Sliding Window — Pattern Guide

## When to Use
- Finding optimal subarray/substring of variable or fixed length
- Problems with contiguous elements satisfying a constraint
- "Longest/shortest substring/subarray with condition X"
- Need to track a window of elements efficiently

## Recognition Signals
- "Longest substring without repeating..."
- "Minimum window containing..."
- "Maximum sum/product of subarray of size k"
- "At most K distinct characters"
- "Permutation/anagram in string"
- Contiguous subarray/substring with a constraint

## Common Tricks
- Expand right pointer to include elements, shrink left pointer when constraint violated
- Use HashMap to track character frequencies in current window
- For "permutation in string" / "find anagrams": fixed-size window + frequency match
- For "longest with at most K": expand right, shrink left when count exceeds K
- Monotonic deque for sliding window maximum (maintain decreasing order)
- Sorting + sliding window for "frequency of most frequent element"

## Time Complexity Expectations
| Approach | Time | Space |
|----------|------|-------|
| Brute force (all subarrays) | O(n²) or O(n³) | O(1) |
| Sliding window | O(n) | O(k) where k = alphabet/constraint size |
| Sliding window + deque | O(n) | O(k) window size |

## Interview Tips
- The window always moves forward — left pointer never moves backward
- For "minimum window substring": expand until valid, then shrink to find minimum
- Know the difference: fixed-size window (anagrams) vs variable-size window (longest substring)
- Sliding Window Maximum is a Hard — practice the monotonic deque approach until it's automatic
- Always clarify: ASCII or Unicode? Uppercase only? This affects your frequency array size

## Common Mistakes
- Shrinking the window too early (before the constraint is met)
- Not resetting state properly when the window slides
- Using HashMap when a fixed-size array (int[26] or int[128]) is sufficient and faster
- Forgetting that window size = right - left + 1 (off-by-one)
- In "frequency of most frequent" — forgetting to sort first

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | Longest Substring Without Repeating Characters | 3 | Medium | Very High |
| 2 | Longest Repeating Character Replacement | 424 | Medium | High |
| 3 | Permutation in String | 567 | Medium | High |
| 4 | Find All Anagrams in a String | 438 | Medium | High |
| 5 | Minimum Window Substring | 76 | Hard | Very High |
| 6 | Fruit Into Baskets | 904 | Medium | Medium |
| 7 | Max Consecutive Ones III | 1004 | Medium | Medium |
| 8 | Subarray Product Less Than K | 713 | Medium | Medium |
| 9 | Frequency of the Most Frequent Element | 1838 | Medium | Medium |
| 10 | Sliding Window Maximum | 239 | Hard | Very High |
| 11 | Best Time to Buy and Sell Stock | 121 | Easy | Very High |
