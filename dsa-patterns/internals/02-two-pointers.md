# Two Pointers — Pattern Guide

## When to Use
- Sorted arrays: finding pairs, triplets, or subarrays meeting a condition
- In-place operations: removing duplicates, partitioning
- Palindrome checking or expansion
- Reducing O(n²) search space to O(n) by eliminating directions

## Recognition Signals
- "Sorted array" + "find pair that sums to target"
- "In-place" + "remove/deduplicate" + "O(1) space"
- "Palindrome"
- "Container/water" + "maximize area"
- "Partition array" (Dutch National Flag)
- "Find duplicate" in constrained space

## Common Tricks
- Opposite-end pointers: start from both ends, move inward based on comparison (Container With Most Water)
- Skip duplicates after sorting to avoid duplicate triplets (3Sum)
- Dutch National Flag: three-way partition with lo/mid/hi pointers (Sort Colors)
- Floyd's cycle detection: slow/fast pointer to find duplicate (Find Duplicate Number)
- Expand-around-center for palindromes (Longest Palindromic Substring)

## Time Complexity Expectations
| Approach | Time | Space |
|----------|------|-------|
| Brute force (all pairs) | O(n²) | O(1) |
| Two pointers on sorted | O(n) | O(1) |
| Sort + two pointers | O(n log n) | O(1) |
| Expand around center | O(n²) worst | O(1) |

## Interview Tips
- If the array is sorted (or can be sorted), two pointers should be your first thought
- For 3Sum: sort first, fix one element, two-pointer the rest — O(n²) is optimal
- Container With Most Water: always move the shorter side — explain why with proof by contradiction
- The "find duplicate in [1,n]" trick using Floyd's is a common follow-up — know it cold

## Common Mistakes
- Forgetting to sort before applying two pointers
- Not skipping duplicates in 3Sum (leads to duplicate triplets)
- Moving both pointers at once instead of one at a time
- Confusing "opposite-end" vs "same-direction" two pointer patterns
- Off-by-one when checking palindrome boundaries

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | Container With Most Water | 11 | Medium | Very High |
| 2 | 3Sum | 15 | Medium | Very High |
| 3 | Sort Colors | 75 | Medium | High |
| 4 | Find the Duplicate Number | 287 | Medium | High |
| 5 | Longest Palindromic Substring | 5 | Medium | Very High |
