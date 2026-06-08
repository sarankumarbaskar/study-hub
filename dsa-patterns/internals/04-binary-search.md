# Binary Search — Pattern Guide

## When to Use
- Sorted array: finding target, boundary, or insertion point
- "Minimize the maximum" or "maximize the minimum" (binary search on answer)
- Search space can be halved at each step
- Finding first/last occurrence, peak, or rotation point

## Recognition Signals
- "Sorted array" + "find element/position"
- "Minimum speed/capacity/days to achieve X" (binary search on answer)
- "Rotated sorted array"
- "Find peak" or "find minimum in rotated"
- "Split array" + "minimize largest sum"
- "Kth smallest" in a structured matrix

## Common Tricks
- Binary search on answer space: define lo/hi as range of possible answers, check feasibility with a helper function
- For rotated arrays: identify which half is sorted, then decide direction
- For "find first/last position": use two separate binary searches with left-bias and right-bias
- Peak element: compare mid with mid+1 to decide direction (works because any peak is acceptable)
- Median of two sorted arrays: binary search on the shorter array, partition both arrays

## Time Complexity Expectations

| Approach | Time | Space |
|----------|------|-------|
| Linear scan | O(n) | O(1) |
| Standard binary search | O(log n) | O(1) |
| Binary search on answer | O(n log R) where R = answer range | O(1) |
| Matrix binary search | O(n log n) or O(n + m) | O(1) |

## Interview Tips
- Binary search on answer space is a FAANG favorite — Koko Eating Bananas (#875) and Split Array Largest Sum (#410) are must-knows
- For rotated array problems, draw the "mountain" diagram to visualize which half is sorted
- Median of Two Sorted Arrays is Google's all-time favorite Hard — practice until you can explain the partitioning logic clearly
- Always handle edge cases: empty array, single element, all elements same
- Know when to use `lo < hi` vs `lo <= hi` vs `lo + 1 < hi` — each has different semantics

## Common Mistakes
- Using wrong loop condition (`<` vs `<=`) causing infinite loops or missed elements
- Off-by-one in mid calculation: use `lo + (hi - lo) / 2` to avoid overflow
- In rotated array: not handling the case where `nums[lo] == nums[mid]`
- In binary search on answer: getting the feasibility check wrong (check condition direction)
- Forgetting to handle even/odd length arrays differently in median problems

## Problems in This Pattern

| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | Search in Rotated Sorted Array | 33 | Medium | Very High |
| 2 | Find Minimum in Rotated Sorted Array | 153 | Medium | High |
| 3 | Find Peak Element | 162 | Medium | High |
| 4 | Koko Eating Bananas | 875 | Medium | Very High |
| 5 | Capacity To Ship Packages Within D Days | 1011 | Medium | High |
| 6 | Minimum Number of Days to Make m Bouquets | 1482 | Medium | Medium |
| 7 | Split Array Largest Sum | 410 | Hard | High |
| 8 | Find First and Last Position of Element in Sorted Array | 34 | Medium | Very High |
| 9 | Median of Two Sorted Arrays | 4 | Hard | Very High |
| 10 | Kth Smallest Element in a Sorted Matrix | 378 | Medium | High |
