# Backtracking — Pattern Guide

## When to Use
- Generating all possible combinations, permutations, or subsets
- Constraint satisfaction problems (N-Queens, Sudoku)
- Path finding with constraints (word search)
- Problems where you need to "try all possibilities" with pruning

## Recognition Signals
- "Generate all combinations/permutations"
- "Find all valid arrangements" (N-Queens)
- "Generate all valid parentheses"
- "Word search in grid" (path with constraint)
- "All subsets that sum to target"
- Keywords: "all possible", "generate all", "find all valid"

## Common Tricks
- Template: choose → explore → unchoose (backtrack)
- For combinations: start from current index to avoid duplicates; for permutations: use visited array
- Pruning: skip invalid states early (e.g., remaining sum < 0 in combination sum)
- Generate Parentheses: track open and close counts — only add ')' if close < open
- Word Search: mark cell as visited during DFS, unmark on backtrack
- N-Queens: use arrays for column, diagonal, and anti-diagonal occupancy for O(1) conflict checks

## Time Complexity Expectations
| Problem Type | Time | Space |
|-------------|------|-------|
| Combinations | O(2^n) | O(n) |
| Permutations | O(n!) | O(n) |
| N-Queens | O(n!) | O(n) |
| Word Search | O(m × n × 4^L) where L = word length | O(L) |
| Generate Parentheses | O(4^n / √n) Catalan number | O(n) |

## Interview Tips
- The backtracking template is universal — learn it once, apply everywhere: choose, explore, unchoose
- Combination Sum allows reuse (start from same index), Combination Sum II doesn't (start from next + skip duplicates)
- For N-Queens: explain your conflict detection strategy — column + two diagonals (row+col, row-col)
- Word Search: mark visited in-place by modifying the char (e.g., '#') — saves space, but remember to restore
- Generate Parentheses: this is also a great recursion warm-up question — solve it in under 5 minutes

## Common Mistakes
- Not restoring state after backtracking (forgetting to "unchoose")
- Generating duplicate results (not handling sorted input or index tracking correctly)
- In word search: not marking cells as visited (leads to revisiting same cell)
- Pruning too late (check constraints before recursing, not after)
- Off-by-one in index tracking for combinations vs permutations

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | Combination Sum | 39 | Medium | Very High |
| 2 | Permutations | 46 | Medium | Very High |
| 3 | Generate Parentheses | 22 | Medium | Very High |
| 4 | Word Search | 79 | Medium | Very High |
| 5 | N-Queens | 51 | Hard | High |
