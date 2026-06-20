# Greedy — Pattern Guide

## When to Use
- Making locally optimal choices that lead to a globally optimal solution
- Problems where sorting + greedy selection works
- Jump/reach problems on arrays
- Resource allocation with constraints

## Recognition Signals
- "Jump game" / "can you reach the end" / "minimum jumps"
- "Gas station" / "circular route" / "enough fuel"
- "Task scheduler" / "minimum idle time"
- "Activity selection" / "maximum non-overlapping"
- The optimal solution can be built incrementally by local decisions

## Common Tricks
- Jump Game: track farthest reachable index — if current index > farthest, return false
- Jump Game II: BFS-like level expansion — count levels (jumps) until you reach end
- Gas Station: if total gas >= total cost, a solution exists; find the starting point where running sum never goes negative
- Task Scheduler: formula-based — (maxFreq - 1) * (n + 1) + countOfMaxFreq, take max with total tasks
- Prove greedy works by showing: choosing any other option doesn't improve the result (exchange argument)

## Time Complexity Expectations
| Approach | Time | Space |
|----------|------|-------|
| Greedy single pass | O(n) | O(1) |
| Sort + greedy | O(n log n) | O(1) |
| Frequency counting + greedy | O(n) | O(k) |

## Interview Tips
- Greedy is hard to prove correct — practice explaining WHY the greedy choice works (exchange argument)
- Jump Game II: know both the greedy O(n) approach and the BFS interpretation — they're the same
- Gas Station: the key insight is that if total gas >= total cost, a valid start must exist — and you can find it in one pass
- Task Scheduler: derive the formula step by step — interviewers want to see the reasoning, not just the formula
- Greedy questions are often asked as follow-ups to DP questions — "can you do better than DP?"

## Common Mistakes
- Applying greedy when DP is needed (greedy doesn't work for all optimization problems)
- In Jump Game II: updating the jump count at the wrong time
- Gas Station: not considering the circular nature of the route
- Task Scheduler: edge case when n = 0 (answer is just the total number of tasks)

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | Jump Game | 55 | Medium | Very High |
| 2 | Jump Game II | 45 | Medium | Very High |
| 3 | Gas Station | 134 | Medium | High |
| 4 | Task Scheduler | 621 | Medium | Very High |
| 5 | Maximum Subarray | 53 | Medium | Very High |
