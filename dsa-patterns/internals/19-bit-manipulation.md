# Bit Manipulation

> Use bitwise operations (AND, OR, XOR, shift) to solve problems in constant space and sublinear time. Essential for low-level optimization, counting bits, and clever XOR tricks.

## What Is This Pattern?

**Bit manipulation** leverages the binary representation of integers. Key operations: **XOR** (a^a=0, a^0=a)—finds the unique element; **AND** (n & n-1 clears lowest set bit)—counts 1s; **shift** (<<, >>)—multiply/divide by 2, access bits; **OR/AND**—set/clear bits. Common tricks: XOR of all elements cancels pairs; `n & (n-1)` removes rightmost 1; `n & -n` isolates rightmost 1; `1 << k` is the k-th bit mask.

Use when the problem involves **parity**, **single number** among pairs, **bit counts**, or **no-arithmetic** constraints (e.g., add without +).

## When to Use This Pattern

- Problem involves **single number** where others appear twice (XOR).
- You need to **count set bits** or manipulate individual bits.
- Problem asks for **xor**, **and**, **or** of elements.
- Arithmetic is restricted (e.g., sum without +).
- Phrases like "single", "appears once", "number of 1 bits", "reverse bits", "without using +".

## How to Identify This Pattern

```
Does the problem involve canceling pairs / finding unique?
    YES → XOR (a^a=0)
    
Does it ask to count or manipulate bits?
    YES → AND with n-1, shift, masks
    
Is arithmetic restricted?
    YES → Bit ops for add, etc.
    
Are we maximizing XOR between pairs?
    YES → Trie or bit-by-bit greedy
```

## Core Template (Pseudocode)

### XOR for Single Number

```
FUNCTION singleNumber(nums):
    result = 0
    FOR each x in nums:
        result ^= x
    RETURN result
```

### Count Set Bits (Brian Kernighan)

```
FUNCTION countBits(n):
    count = 0
    WHILE n > 0:
        n &= (n - 1)
        count++
    RETURN count
```

### Get/Set/Clear Bit

```
GET bit k:    (n >> k) & 1
SET bit k:    n | (1 << k)
CLEAR bit k:  n & ~(1 << k)
TOGGLE bit k: n ^ (1 << k)
```

## Core Template (Java)

### XOR Single Number

```java
public int singleNumber(int[] nums) {
    int xor = 0;
    for (int x : nums) xor ^= x;
    return xor;
}
```

### Count 1 Bits

```java
public int hammingWeight(int n) {
    int count = 0;
    while (n != 0) {
        n &= (n - 1);
        count++;
    }
    return count;
}
```

### Reverse Bits

```java
public int reverseBits(int n) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        result = (result << 1) | (n & 1);
        n >>= 1;
    }
    return result;
}
```

## Complexity Cheat Sheet

| Operation        | Time    | Space | Notes                     |
|------------------|---------|-------|---------------------------|
| XOR single       | O(n)    | O(1)  | One pass                   |
| Count bits       | O(k)    | O(1)  | k = number of 1 bits       |
| Reverse bits     | O(32)   | O(1)  | Fixed 32 bits              |
| Counting bits 0..n| O(n)    | O(n)  | DP: res[i]=res[i>>1]+(i&1) |
| Max XOR pair     | O(n·32) | O(n)  | Trie or bit greedy         |

## Problems (Progressive Difficulty)

### Easy (2 problems)

#### Problem: [Single Number](https://leetcode.com/problems/single-number/) (LeetCode #136)

- **Intuition:** Every element appears twice except one. XOR: a^a=0, a^0=a. XOR all cancels pairs, leaves the single.
- **Brute Force:** Use a hash map to count occurrences; return the key with count 1. Time O(n), Space O(n).
- **Approach:** result = 0; for each x: result ^= x; return result.
- **Java Solution:**

```java
class Solution {
    public int singleNumber(int[] nums) {
        int xor = 0;
        for (int x : nums) xor ^= x;
        return xor;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Number of 1 Bits](https://leetcode.com/problems/number-of-1-bits/) (LeetCode #191)

- **Intuition:** Count set bits. n & (n-1) clears the rightmost 1. Repeat until 0.
- **Brute Force:** Iterate through each bit with (n >> i) & 1 and count. Time O(32), Space O(1).
- **Approach:** count = 0; while (n != 0) { n &= (n-1); count++; } return count.
- **Java Solution:**

```java
public class Solution {
    public int hammingWeight(int n) {
        int count = 0;
        while (n != 0) {
            n &= (n - 1);
            count++;
        }
        return count;
    }
}
```

- **Complexity:** Time O(k) where k = number of 1 bits, Space O(1)

---

### Medium (4 problems)

#### Problem: [Single Number II](https://leetcode.com/problems/single-number-ii/) (LeetCode #137)

- **Intuition:** Every element appears 3 times except one. For each bit, count occurrences mod 3; remainder gives the single number's bits. Use two masks (ones, twos) to track mod 3.
- **Brute Force:** Use a hash map to count occurrences; return the key with count 1. Time O(n), Space O(n).
- **Approach:** ones = bits appearing 1 mod 3, twos = 2 mod 3. For each x: ones = (ones ^ x) & ~twos; twos = (twos ^ x) & ~ones. Return ones.
- **Java Solution:**

```java
class Solution {
    public int singleNumber(int[] nums) {
        int ones = 0, twos = 0;
        for (int x : nums) {
            ones = (ones ^ x) & ~twos;
            twos = (twos ^ x) & ~ones;
        }
        return ones;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Counting Bits](https://leetcode.com/problems/counting-bits/) (LeetCode #338)

- **Intuition:** For each i, count of 1 bits. DP: res[i] = res[i >> 1] + (i & 1). Dropping last bit halves the number; LSB adds 0 or 1.
- **Brute Force:** For each i from 0 to n, count 1 bits using a loop (n &= n-1 or bit check). Time O(n·k) where k = avg bits per number, Space O(1) excluding output.
- **Approach:** res[0]=0. For i from 1 to n: res[i] = res[i>>1] + (i&1).
- **Java Solution:**

```java
class Solution {
    public int[] countBits(int n) {
        int[] res = new int[n + 1];
        for (int i = 1; i <= n; i++)
            res[i] = res[i >> 1] + (i & 1);
        return res;
    }
}
```

- **Complexity:** Time O(n), Space O(1) excluding output

---

#### Problem: [Reverse Bits](https://leetcode.com/problems/reverse-bits/) (LeetCode #190)

- **Intuition:** Reverse the 32-bit representation. Shift result left, add LSB of n, shift n right.
- **Brute Force:** Extract each bit (n >> i) & 1, place at position (31-i) in result. Time O(32), Space O(1).
- **Approach:** result=0; for i 0..31: result = (result<<1)|(n&1); n>>=1; return result.
- **Java Solution:**

```java
public class Solution {
    public int reverseBits(int n) {
        int result = 0;
        for (int i = 0; i < 32; i++) {
            result = (result << 1) | (n & 1);
            n >>>= 1;
        }
        return result;
    }
}
```

- **Complexity:** Time O(32), Space O(1)

---

#### Problem: [Sum of Two Integers](https://leetcode.com/problems/sum-of-two-integers/) (LeetCode #371)

- **Intuition:** Add without + or -. Use XOR for sum without carry, AND for carry. Sum = a^b, carry = (a&b)<<1. Repeat until carry is 0.
- **Brute Force:** Simulate addition bit-by-bit with explicit carry propagation using only bit ops. Time O(32), Space O(1).
- **Approach:** while (b != 0) { carry = (a & b) << 1; a = a ^ b; b = carry; } return a.
- **Java Solution:**

```java
class Solution {
    public int getSum(int a, int b) {
        while (b != 0) {
            int carry = (a & b) << 1;
            a = a ^ b;
            b = carry;
        }
        return a;
    }
}
```

- **Complexity:** Time O(1) (max 32 iterations), Space O(1)

---

### Hard (2 problems)

#### Problem: [Maximum XOR of Two Numbers in an Array](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/) (LeetCode #421)

- **Intuition:** Find max xor of any pair. For each number, greedily choose the opposite bit at each position to maximize xor. Use a binary trie: insert all numbers, then for each number traverse trie preferring opposite bit.
- **Brute Force:** Try all pairs of numbers, compute XOR for each, track maximum. Time O(n²), Space O(1).
- **Approach:** 1) Build trie with all numbers (bit by bit). 2) For each number, traverse trie: at each bit, go to child with opposite bit if exists, else same. 3) Track max xor.
- **Java Solution:**

```java
class Solution {
    class TrieNode {
        TrieNode[] children = new TrieNode[2];
    }

    public int findMaximumXOR(int[] nums) {
        TrieNode root = new TrieNode();
        for (int num : nums) {
            TrieNode node = root;
            for (int i = 31; i >= 0; i--) {
                int bit = (num >> i) & 1;
                if (node.children[bit] == null)
                    node.children[bit] = new TrieNode();
                node = node.children[bit];
            }
        }
        int max = 0;
        for (int num : nums) {
            TrieNode node = root;
            int xor = 0;
            for (int i = 31; i >= 0; i--) {
                int bit = (num >> i) & 1;
                int toggled = 1 - bit;
                if (node.children[toggled] != null) {
                    xor |= (1 << i);
                    node = node.children[toggled];
                } else {
                    node = node.children[bit];
                }
            }
            max = Math.max(max, xor);
        }
        return max;
    }
}
```

- **Complexity:** Time O(n · 32), Space O(n · 32)

---

#### Problem: [Minimum Flips to Make a OR b Equal to c](https://leetcode.com/problems/minimum-flips-to-make-a-or-b-equal-to-c/) (LeetCode #1318)

- **Intuition:** Flip bits of a or b so (a|b)==c. For each bit: if c has 0, both a and b must be 0 (flip any 1s). If c has 1, at least one of a,b must be 1 (flip 0 only if both are 0).
- **Brute Force:** Check each of the 32 bits: if (a|b) bit differs from c bit, count needed flips (0→1: 1 flip if both 0; 1→0: 1 or 2 flips). Time O(32), Space O(1).
- **Approach:** For each bit i: if (c>>i)&1==0: flips += ((a>>i)&1) + ((b>>i)&1). Else: if ((a>>i)&1)==0 && ((b>>i)&1)==0: flips++.
- **Java Solution:**

```java
class Solution {
    public int minFlips(int a, int b, int c) {
        int flips = 0;
        for (int i = 0; i < 32; i++) {
            int bitA = (a >> i) & 1;
            int bitB = (b >> i) & 1;
            int bitC = (c >> i) & 1;
            if (bitC == 0) {
                flips += bitA + bitB;
            } else {
                if (bitA == 0 && bitB == 0) flips++;
            }
        }
        return flips;
    }
}
```

- **Complexity:** Time O(32), Space O(1)

---

## Common Mistakes

- **Single Number:** XOR works only when all others appear exactly twice.
- **Single Number II:** Use two state variables for mod 3; update order matters.
- **Number of 1 Bits:** Use n != 0 for unsigned; Java has no unsigned int—use n != 0 and handle as unsigned.
- **Reverse Bits:** Use >>> for right shift to handle sign correctly in Java.
- **Sum of Two Integers:** Need loop for carry propagation; use bit ops only.
- **Max XOR:** Prefer opposite bit when available in trie.
- **Min Flips:** When c bit is 0, both a and b must be 0; when c bit is 1, only one of a,b needs to be 1.

## Pattern Variations

| Variation           | Example   | Key Technique                          |
|---------------------|-----------|----------------------------------------|
| XOR cancel pairs    | #136      | XOR all elements                        |
| Count mod K         | #137      | State machine for mod 3                  |
| Count bits          | #191, #338| n & (n-1) or DP res[i>>1]+(i&1)         |
| Reverse             | #190      | Extract LSB, shift result                |
| Add without +       | #371      | XOR + AND for sum and carry              |
| Max XOR pair        | #421      | Trie, prefer opposite bit                |
| Min flips           | #1318     | Bit-by-bit: match target, count flips    |
