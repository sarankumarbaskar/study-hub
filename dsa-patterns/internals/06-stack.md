# Stack — Pattern Guide

## When to Use
- Processing elements in LIFO order
- "Next greater/smaller element" problems
- Matching brackets, parentheses, or nested structures
- Maintaining a monotonic sequence (increasing or decreasing)
- Histogram/water trapping problems

## Recognition Signals
- "Next greater element" or "next smaller element"
- "Daily temperatures" / "stock span" / "price monitoring"
- "Decode nested string" / "nested brackets"
- "Largest rectangle" / "trapping water"
- "Remove digits to get smallest/largest number"
- "Asteroid collision" (directional simulation)

## Common Tricks
- Monotonic decreasing stack for "next greater element": pop when current > stack top
- For histogram largest rectangle: maintain increasing stack of indices, calculate area on pop
- Trapping Rain Water: monotonic stack OR prefix max arrays OR two pointers (know all three)
- Decode String: use two stacks (one for counts, one for strings) or a single stack with markers
- Remove K Digits: greedy with monotonic increasing stack — remove larger digits from left

## Time Complexity Expectations
| Approach | Time | Space |
|----------|------|-------|
| Brute force (nested loops) | O(n²) | O(1) |
| Monotonic stack | O(n) | O(n) |
| Stack-based parsing | O(n) | O(n) |

## Interview Tips
- Monotonic stack is extremely high-frequency at Amazon and Google — master it
- Trapping Rain Water has 3 solutions (stack, DP, two pointers) — know all and their trade-offs
- Largest Rectangle in Histogram is the foundation for Maximal Rectangle (2D version) — build intuition here
- For "remove K digits": explain the greedy choice — always remove the leftmost digit that breaks monotonicity
- Sum of Subarray Minimums uses a "contribution" technique with monotonic stack — this is a common pattern

## Common Mistakes
- Forgetting to process remaining elements in the stack after the main loop
- Off-by-one with indices in histogram problems (sentinel values at boundaries help)
- Confusing monotonic increasing vs decreasing stacks (draw it out)
- Not handling empty stack edge cases (peek/pop on empty)
- In asteroid collision: not handling the case where both asteroids are equal size

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | Daily Temperatures | 739 | Medium | Very High |
| 2 | Next Greater Element II | 503 | Medium | Medium |
| 3 | Decode String | 394 | Medium | High |
| 4 | Asteroid Collision | 735 | Medium | High |
| 5 | Remove K Digits | 402 | Medium | High |
| 6 | Largest Rectangle in Histogram | 84 | Hard | Very High |
| 7 | Trapping Rain Water | 42 | Hard | Very High |
| 8 | Sum of Subarray Minimums | 907 | Medium | Medium |
