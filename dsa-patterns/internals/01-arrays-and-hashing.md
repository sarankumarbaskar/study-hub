# Arrays & Hashing — Pattern Guide

## When to Use
- Finding duplicates, frequencies, or groupings in arrays/strings
- Need O(1) lookup for existence checks or counting
- Problems involving pair/group matching (anagrams, two sum)
- Reducing O(n²) brute force to O(n) using space

## Recognition Signals
- "Find pairs/groups that satisfy condition"
- "Count frequency of elements"
- "Group similar items together"
- "Check if exists / has been seen before"
- "Product/sum excluding current element"
- Input is unsorted and you need fast lookup

## Common Tricks
- Use HashMap for O(1) lookup of complements (Two Sum pattern)
- Sort strings or use character frequency arrays as hash keys (Group Anagrams)
- Prefix/suffix product arrays to avoid division (Product of Array Except Self)
- HashSet for O(1) existence checks in sequences (Longest Consecutive Sequence)
- Bucket sort / frequency counting when values are bounded (Top K Frequent Elements)

## Time Complexity Expectations
| Approach | Time | Space |
|----------|------|-------|
| Brute force (nested loops) | O(n²) | O(1) |
| HashMap lookup | O(n) | O(n) |
| Sorting + scan | O(n log n) | O(1)–O(n) |
| Bucket sort (bounded values) | O(n) | O(n) |

## Interview Tips
- Always clarify: Are there duplicates? Can elements be negative? Is the array sorted?
- HashMap is your default tool — reach for it immediately when you see "find pair/match"
- For frequency problems, consider bucket sort when k is involved (Top K = bucket sort avoids heap overhead)
- "Product except self" is a classic prefix/suffix trick — interviewers love the no-division follow-up

## Common Mistakes
- Forgetting to handle duplicates in HashMap (overwriting vs. incrementing)
- Off-by-one in prefix product arrays
- Using O(n log n) sort when O(n) HashMap solution exists
- Not considering negative numbers in sum/product problems
- Forgetting that HashSet.add() returns false if element already exists (useful for cycle detection)

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | Two Sum | 1 | Easy | Very High |
| 2 | Group Anagrams | 49 | Medium | Very High |
| 3 | Product of Array Except Self | 238 | Medium | Very High |
| 4 | Longest Consecutive Sequence | 128 | Medium | High |
| 5 | Top K Frequent Elements | 347 | Medium | Very High |
| 6 | Rotate Image | 48 | Medium | Very High |
| 7 | Spiral Matrix | 54 | Medium | Very High |
