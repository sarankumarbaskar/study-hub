# Linked List — Pattern Guide

## When to Use
- In-place reversal of nodes
- Cycle detection in sequences
- Merging or reordering node sequences
- Two-pointer techniques on sequential structures
- Deep copy of complex structures

## Recognition Signals
- "Reverse linked list" or "reverse in groups of K"
- "Detect cycle" or "find start of cycle"
- "Remove Nth node from end"
- "Reorder list" (interleave first and second halves)
- "Copy list with random pointer" (deep clone)
- "Add two numbers" (digit-by-digit arithmetic)

## Common Tricks
- Iterative reversal: prev/curr/next pointer dance — know this cold
- Two-pointer (fast/slow) for middle finding, cycle detection (Floyd's)
- Dummy head node to simplify edge cases (insertion/deletion at head)
- For reorder list: find middle → reverse second half → merge alternating
- For copy with random pointer: interleave clone nodes in original list, then extract
- For reverse K-group: count K nodes, reverse segment, connect, repeat

## Time Complexity Expectations
| Approach | Time | Space |
|----------|------|-------|
| Single traversal | O(n) | O(1) |
| Reversal (iterative) | O(n) | O(1) |
| Reversal (recursive) | O(n) | O(n) stack |
| Copy with random pointer | O(n) | O(1) with interleave trick, O(n) with HashMap |

## Interview Tips
- ALWAYS use a dummy head node — it eliminates 90% of null-pointer edge cases
- Reverse Linked List: know both iterative and recursive — interviewers often ask for both
- For "remove Nth from end": two-pointer with N-gap — explain the gap concept clearly
- Reverse Nodes in K-Group is Hard but extremely common at Google/Amazon — practice iterative version
- Add Two Numbers: handle carry propagation and unequal lengths carefully

## Common Mistakes
- Losing reference to the head after reversal (save it before starting)
- Not handling null pointers (empty list, single node)
- Forgetting to handle carry overflow in Add Two Numbers (e.g., 999 + 1)
- In K-group reversal: not correctly connecting the tail of one reversed group to the head of the next
- Modifying the original list when you shouldn't (deep copy problems)

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | Reverse Linked List | 206 | Easy | Very High |
| 2 | Linked List Cycle | 141 | Easy | Very High |
| 3 | Reorder List | 143 | Medium | High |
| 4 | Remove Nth Node From End of List | 19 | Medium | Very High |
| 5 | Copy List with Random Pointer | 138 | Medium | High |
| 6 | Add Two Numbers | 2 | Medium | Very High |
| 7 | Reverse Nodes in k-Group | 25 | Hard | High |
