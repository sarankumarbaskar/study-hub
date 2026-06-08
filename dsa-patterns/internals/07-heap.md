# Heap (Priority Queue) — Pattern Guide

## When to Use
- Finding Kth largest/smallest element
- Maintaining a running median
- Merging K sorted structures
- Scheduling / meeting rooms (event-driven simulation)
- Top K elements by some criteria

## Recognition Signals
- "Kth largest" or "Kth smallest"
- "Top K" or "K most frequent"
- "Merge K sorted" lists/arrays
- "Find median from data stream" (online median)
- "Meeting rooms" / "minimum rooms needed"
- "Closest K points"

## Common Tricks
- Min-heap of size K for "Kth largest" — top of heap is the answer
- Two heaps (max-heap + min-heap) for running median
- Min-heap for merging K sorted lists: always extract the smallest, push its next node
- For meeting rooms: min-heap of end times, reuse room if earliest ending <= current start
- QuickSelect (Hoare's partition) for average O(n) Kth element — know as alternative to heap

## Time Complexity Expectations
| Approach | Time | Space |
|----------|------|-------|
| Sort + pick Kth | O(n log n) | O(1) |
| Min-heap of size K | O(n log k) | O(k) |
| QuickSelect | O(n) average, O(n²) worst | O(1) |
| Two heaps (median) | O(log n) per insert, O(1) query | O(n) |
| Merge K sorted | O(N log k) where N = total elements | O(k) |

## Interview Tips
- In Java, PriorityQueue is a min-heap by default — for max-heap use `Collections.reverseOrder()` or `(a, b) -> b - a`
- For "Find Median from Data Stream": explain the two-heap invariant clearly — max-heap for lower half, min-heap for upper half
- Meeting Rooms II is Amazon's #1 most-asked question — practice until automatic
- Merge K Sorted Lists: heap approach is O(N log k), divide-and-conquer merge is also O(N log k) — know both
- Smallest Range Covering K Lists is a beautiful heap problem — show you can handle multi-pointer coordination

## Common Mistakes
- Integer overflow in comparator: use `Integer.compare(a, b)` instead of `a - b`
- Forgetting to rebalance two heaps after insertion (sizes must differ by at most 1)
- In merge K sorted: not checking for null before adding to heap
- Using max-heap when min-heap is needed (or vice versa)
- Not considering QuickSelect as a follow-up optimization for Kth element problems

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | Kth Largest Element in an Array | 215 | Medium | Very High |
| 2 | Top K Frequent Elements | 347 | Medium | Very High |
| 3 | K Closest Points to Origin | 973 | Medium | High |
| 4 | Find Median from Data Stream | 295 | Hard | Very High |
| 5 | Meeting Rooms II | 253 | Medium | Very High |
| 6 | Merge K Sorted Lists | 23 | Hard | Very High |
| 7 | Smallest Range Covering Elements from K Lists | 632 | Hard | Medium |
