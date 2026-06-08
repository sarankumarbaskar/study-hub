# Bit Manipulation — Pattern Guide

## When to Use
- Finding single/unique elements in arrays where others appear twice
- Counting bits, parity checks
- Arithmetic without +/- operators
- Power of 2 checks, toggling, masking

## Recognition Signals
- "Every element appears twice except one"
- "Count number of 1 bits"
- "Add without using + operator"
- "Power of 2" checks
- "XOR" mentioned or implied
- Space constraint of O(1) with no extra data structures

## Common Tricks
- XOR to cancel duplicates: a ^ a = 0, a ^ 0 = a (Single Number)
- Brian Kernighan's algorithm: n & (n-1) removes lowest set bit (Number of 1 Bits)
- DP on bits: dp[i] = dp[i >> 1] + (i & 1) — builds on previous results (Counting Bits)
- Carry-free addition: XOR for sum, AND + left shift for carry (Sum of Two Integers)
- n & (n-1) == 0 checks power of 2

## Time Complexity Expectations
| Approach | Time | Space |
|----------|------|-------|
| Brute force (HashSet) | O(n) | O(n) |
| XOR approach | O(n) | O(1) |
| Bit counting (Kernighan) | O(number of set bits) | O(1) |
| DP on bits | O(n) | O(n) |

## Interview Tips
- XOR is the go-to for "find the unique element" — explain why pairs cancel out
- Sum of Two Integers tests your understanding of how addition works at the bit level — practice with examples
- Bit manipulation is rarely the main topic in SDE-2 interviews, but it appears as sub-problems
- Know the basic operations: AND, OR, XOR, NOT, left/right shift, and when each is useful
- These problems are great warmups — don't spend disproportionate prep time here

## Common Mistakes
- Forgetting that Java's >> is arithmetic (sign-extending) vs >>> is logical (zero-filling)
- Integer overflow in bit shift operations
- Not handling negative numbers correctly in Sum of Two Integers
- Confusing & (bitwise AND) with && (logical AND)

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | Single Number | 136 | Easy | Very High |
| 2 | Number of 1 Bits | 191 | Easy | High |
| 3 | Counting Bits | 338 | Easy | Medium |
| 4 | Sum of Two Integers | 371 | Medium | Medium |
