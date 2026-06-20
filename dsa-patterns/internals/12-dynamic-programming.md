# Dynamic Programming — Pattern Guide

## When to Use
- Optimization problems (min cost, max profit, number of ways)
- Problems with overlapping subproblems and optimal substructure
- Counting distinct paths, subsequences, or combinations
- String matching (edit distance, LCS, palindromes)
- Knapsack variants (subset sum, coin change, partition)

## Recognition Signals
- "Minimum/maximum number of..." (coin change, path sum)
- "Number of ways to..." (unique paths, decode ways, coin change II)
- "Can you partition/split into..." (partition equal subset sum)
- "Longest/shortest subsequence/substring"
- "Best time to buy/sell stock" (state machine DP)
- "Word break" / "can the string be segmented"
- Keywords: "optimal", "count", "minimum cost", "maximum profit"

## Common Tricks
- 1D DP: dp[i] depends on previous 1–2 states (House Robber: dp[i] = max(dp[i-1], dp[i-2] + nums[i]))
- Knapsack: dp[amount] with coin iteration — unbounded (iterate coins outer) vs 0/1 (iterate amount outer)
- 2D DP: dp[i][j] on two strings or grid (LCS, Edit Distance, Unique Paths)
- Interval DP: dp[i][j] represents optimal for subarray i..j (Burst Balloons, LPS)
- State machine DP: multiple states per position (stock problems with hold/not-hold/cooldown)
- Space optimization: if dp[i] only depends on dp[i-1], use two variables or 1D array instead of 2D
- Memoization (top-down) vs tabulation (bottom-up) — know when each is cleaner

## Time Complexity Expectations
| Type | Time | Space |
|------|------|-------|
| 1D DP | O(n) or O(n × k) | O(n) or O(1) |
| 2D DP (grid) | O(m × n) | O(m × n) or O(n) |
| 2D DP (strings) | O(m × n) | O(m × n) or O(n) |
| Knapsack | O(n × target) | O(target) |
| Interval DP | O(n³) | O(n²) |
| LIS (binary search) | O(n log n) | O(n) |

## Interview Tips
- Always start by defining the STATE clearly: "dp[i] represents..." — this is 70% of the battle
- Draw the recurrence relation before coding — interviewers want to see your thought process
- Coin Change (min coins) vs Coin Change II (count combinations) — understand why loop order matters
- LIS with binary search (patience sorting) is O(n log n) — know this optimization
- Edit Distance: classic 2D DP — practice until the insert/delete/replace transitions are automatic
- Burst Balloons: think of it as "which balloon to pop LAST" (not first) — this is the key insight
- State machine DP for stock problems: draw the state diagram (hold, sold, cooldown) before coding

## Common Mistakes
- Wrong base case (dp[0] is often the trickiest part)
- Incorrect loop order in knapsack (0/1 vs unbounded)
- Not considering the "don't take" option in each state
- Forgetting to handle empty strings/arrays (edge case)
- Space optimization breaking correctness (iterating in wrong direction for 0/1 knapsack)
- In interval DP: wrong loop structure (length → start → end, not start → end)
- Confusing subsequence (not contiguous) with subarray (contiguous)

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | House Robber | 198 | Medium | Very High |
| 2 | House Robber II | 213 | Medium | High |
| 3 | Decode Ways | 91 | Medium | Very High |
| 4 | Coin Change | 322 | Medium | Very High |
| 5 | Coin Change II | 518 | Medium | High |
| 6 | Partition Equal Subset Sum | 416 | Medium | High |
| 7 | Target Sum | 494 | Medium | High |
| 8 | Word Break | 139 | Medium | Very High |
| 9 | Longest Common Subsequence | 1143 | Medium | Very High |
| 10 | Edit Distance | 72 | Medium | Very High |
| 11 | Longest Palindromic Subsequence | 516 | Medium | Medium |
| 12 | Unique Paths | 62 | Medium | Very High |
| 13 | Minimum Path Sum | 64 | Medium | High |
| 14 | Maximal Square | 221 | Medium | High |
| 15 | Longest Increasing Subsequence | 300 | Medium | Very High |
| 16 | Russian Doll Envelopes | 354 | Hard | Medium |
| 17 | Best Time to Buy and Sell Stock III | 123 | Hard | High |
| 18 | Best Time to Buy and Sell Stock with Cooldown | 309 | Medium | High |
| 19 | Burst Balloons | 312 | Hard | High |
| 20 | Different Ways to Add Parentheses | 241 | Medium | Medium |
| 21 | Maximum Product Subarray | 152 | Medium | Very High |
| 22 | Longest Increasing Path in a Matrix | 329 | Hard | Very High |
