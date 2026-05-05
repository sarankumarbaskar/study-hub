# Bit Manipulation — Interview Execution Playbook

> **Pattern Mastery Level:** Bit manipulation is the ultimate "wow factor" pattern. Interviewers use it to test if you can think beyond data structures—solving problems in O(1) space with pure math. It appears in ~8% of FAANG rounds, often as a follow-up ("Can you do it without extra space?").

---

## 1. Pattern Recognition Signals

### When to Use Bit Manipulation

```
INSTANT TRIGGERS (say "bit manipulation" within 5 seconds):
  ✓ "Single number" + "all others appear twice/thrice"
  ✓ "Power of 2" check
  ✓ "Count number of 1 bits" / "Hamming weight"
  ✓ "Without extra space" + finding unique/missing element
  ✓ "XOR" mentioned anywhere in the problem
  ✓ "Subsets" / "all combinations" + small n (≤ 20)
  ✓ "Missing number" in range [0, n]
```

### Keywords in Problem Statements

```
DIRECT SIGNALS:             INDIRECT SIGNALS:
  "single number"             "without extra space"
  "appears once/twice"        "O(1) space"
  "XOR"                       "missing number in [0..n]"
  "number of 1 bits"          "power of two"
  "reverse bits"              "all subsets/combinations"
  "bitwise AND/OR"            "toggle/flip"
  "Hamming distance"          "add without +"
```

### When NOT to Use

```
✗ Numbers exceed 64 bits → bit tricks on int/long won't work
✗ Problem needs floating-point precision → bits don't help
✗ Simpler math exists (e.g., sum formula for missing number is fine too)
✗ You can't explain WHY it works → interviewer will probe, and hand-waving = fail
```

---

## 2. Thinking Framework (Step-by-Step Intuition)

### The 60-Second Decision Process

```
Step 1: "Does the problem involve finding a unique/missing element?"
  YES → XOR everything. Pairs cancel: a ^ a = 0, a ^ 0 = a.
  
Step 2: "Does it involve counting, checking, or manipulating individual bits?"
  YES → Use n & (n-1), n & (-n), shifts, and masks.

Step 3: "Does it ask for subsets or combinations with small n?"
  YES → Bitmask enumeration: iterate 0 to 2^n - 1.

Step 4: "Is arithmetic restricted (no +, -, *, /)?"
  YES → XOR = sum without carry, AND + shift = carry.
```

### XOR Properties (Memorize Cold)

```
PROPERTY              WHAT IT MEANS                    USE CASE
────────────────────────────────────────────────────────────────────
a ^ a = 0             XOR with itself cancels           Cancel pairs
a ^ 0 = a             XOR with zero is identity         Neutral element
Commutative           a ^ b = b ^ a                     Order doesn't matter
Associative           (a ^ b) ^ c = a ^ (b ^ c)        XOR entire array
Self-inverse          if a ^ b = c, then c ^ b = a     Recover original
```

### Essential Bit Tricks (Memorize Cold)

```
TRICK                       FORMULA           WHY IT WORKS
──────────────────────────────────────────────────────────────────────────
Remove lowest set bit       n & (n - 1)       n-1 flips all bits from rightmost 1 down
Isolate lowest set bit      n & (-n)          -n = ~n + 1, only the lowest 1 survives
Check if power of 2         n > 0 &&          Powers of 2 have exactly one set bit
                            n & (n-1) == 0
Get k-th bit                (n >> k) & 1      Shift bit k to position 0, mask it
Set k-th bit                n | (1 << k)      OR with a mask that has only bit k set
Clear k-th bit              n & ~(1 << k)     AND with a mask that has only bit k cleared
Toggle k-th bit             n ^ (1 << k)      XOR flips only bit k
Count set bits              Brian Kernighan    n &= (n-1) loop — one iteration per set bit
```

### The Core Insight (Memorize This)

```
BIT MANIPULATION WORKS BECAUSE:
  XOR is the "odd one out" detector. When you XOR a collection of numbers:
    - Every number that appears an EVEN number of times cancels to 0.
    - Only numbers appearing an ODD number of times survive.
  
  This gives you O(n) time and O(1) space for problems that would
  otherwise need a HashMap (O(n) space) or sorting (O(n log n) time).
  
  For bit-level operations, n & (n-1) and n & (-n) let you surgically
  target the lowest set bit, enabling O(k) algorithms where k = number
  of set bits (often << 32).
```

---

## 3. Java Templates (Production-Quality)

### Template 1: Find Single Number (XOR All)

```java
// USE FOR: LC 136 Single Number, LC 268 Missing Number (XOR 0..n with array)
// TIME: O(n) | SPACE: O(1)
public int singleNumber(int[] nums) {
    int xor = 0;
    for (int x : nums) xor ^= x;
    return xor;
}
```

### Template 2: Check / Set / Clear / Toggle Bit

```java
// USE FOR: Any problem requiring individual bit inspection or mutation
boolean getBit(int n, int k)    { return ((n >> k) & 1) == 1; }
int     setBit(int n, int k)    { return n | (1 << k); }
int     clearBit(int n, int k)  { return n & ~(1 << k); }
int     toggleBit(int n, int k) { return n ^ (1 << k); }
```

### Template 3: Count Set Bits (Brian Kernighan)

```java
// USE FOR: LC 191 Number of 1 Bits, LC 338 Counting Bits (inner loop)
// TIME: O(k) where k = number of set bits | SPACE: O(1)
public int countSetBits(int n) {
    int count = 0;
    while (n != 0) {
        n &= (n - 1); // removes lowest set bit each iteration
        count++;
    }
    return count;
}
```

### Template 4: Power of 2 Check

```java
// USE FOR: LC 231 Power of Two
// TIME: O(1) | SPACE: O(1)
public boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
```

### Template 5: Find Two Unique Numbers (XOR + Partition)

```java
// USE FOR: LC 260 Single Number III — two numbers appear once, rest appear twice
// TIME: O(n) | SPACE: O(1)
public int[] singleNumberIII(int[] nums) {
    int xor = 0;
    for (int x : nums) xor ^= x; // xor = a ^ b (the two unique numbers)

    int lowestBit = xor & (-xor); // a and b differ at this bit

    int a = 0, b = 0;
    for (int x : nums) {
        if ((x & lowestBit) == 0) a ^= x; // group where this bit is 0
        else                       b ^= x; // group where this bit is 1
    }
    return new int[]{a, b};
}
```

### Template 6: Bitmask for Subset Enumeration

```java
// USE FOR: LC 78 Subsets, any "generate all subsets" with n ≤ 20
// TIME: O(2^n * n) | SPACE: O(2^n * n) for output
public List<List<Integer>> subsets(int[] nums) {
    int n = nums.length;
    List<List<Integer>> result = new ArrayList<>();
    for (int mask = 0; mask < (1 << n); mask++) {
        List<Integer> subset = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if ((mask & (1 << i)) != 0) subset.add(nums[i]);
        }
        result.add(subset);
    }
    return result;
}
```

### Template 7: Single Number II (Every Element 3 Times Except One)

```java
// USE FOR: LC 137 — generalizable to "appears k times" with state machine
// TIME: O(n) | SPACE: O(1)
public int singleNumberII(int[] nums) {
    int ones = 0, twos = 0;
    for (int x : nums) {
        ones = (ones ^ x) & ~twos;
        twos = (twos ^ x) & ~ones;
    }
    return ones;
}
```

### Template 8: XOR Prefix (Range XOR Queries)

```java
// USE FOR: LC 1310 XOR Queries of a Subarray
// TIME: O(n + q) | SPACE: O(n)
public int[] xorQueries(int[] arr, int[][] queries) {
    int n = arr.length;
    int[] prefix = new int[n + 1]; // prefix[0] = 0
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] ^ arr[i];
    }
    int[] ans = new int[queries.length];
    for (int i = 0; i < queries.length; i++) {
        ans[i] = prefix[queries[i][1] + 1] ^ prefix[queries[i][0]];
    }
    return ans;
}
```

---

## 4. Edge Case Checklist

```
JAVA-SPECIFIC EDGE CASES (CRITICAL — interviewers test these):
  □ Java int is SIGNED 32-bit (two's complement): range [-2^31, 2^31 - 1]
  □ Integer.MIN_VALUE = -2147483648 → Math.abs(Integer.MIN_VALUE) OVERFLOWS (still negative!)
  □ -1 in binary = 11111111 11111111 11111111 11111111 (all 1s)
  □ >> is ARITHMETIC shift (sign-extends): -1 >> 1 = -1 (fills with 1s)
  □ >>> is LOGICAL shift (zero-fills): -1 >>> 1 = 2147483647 (0x7FFFFFFF)
  □ ALWAYS use >>> when shifting right in loops over unsigned bit patterns
  □ 1 << 31 = Integer.MIN_VALUE (negative!), use 1L << 31 if you need positive

INPUT EDGE CASES:
  □ n = 0 → no set bits, power-of-2 check must return false
  □ n = 1 → IS a power of 2
  □ n = Integer.MIN_VALUE → n & (n-1) = 0, but it's NOT a power of 2 (it's negative)
  □ Negative numbers → two's complement means set bits behave differently
  □ Empty array → return 0 or handle explicitly
  □ Single element → XOR returns it directly

XOR-SPECIFIC:
  □ XOR only cancels exact pairs — if elements appear 3 times, plain XOR doesn't work
  □ Missing number: XOR [0..n] with all array elements → missing one survives
  □ Two unique numbers: XOR gives a^b, NOT a or b individually → need partition step
```

---

## 5. Problem Progression (LeetCode)

### Level 1: Easy — Build XOR Muscle Memory

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 136 | [Single Number](https://leetcode.com/problems/single-number/) | XOR all elements — pairs cancel, unique survives | O(n) |
| 191 | [Number of 1 Bits](https://leetcode.com/problems/number-of-1-bits/) | Brian Kernighan: n &= (n-1) removes one set bit per loop | O(k) |
| 231 | [Power of Two](https://leetcode.com/problems/power-of-two/) | n > 0 && (n & (n-1)) == 0 — exactly one set bit | O(1) |
| 268 | [Missing Number](https://leetcode.com/problems/missing-number/) | XOR [0..n] with array — missing number survives | O(n) |

### Level 2: Standard Medium — Multi-Step Bit Logic

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 137 | [Single Number II](https://leetcode.com/problems/single-number-ii/) | State machine: ones/twos track bit counts mod 3 | O(n) |
| 338 | [Counting Bits](https://leetcode.com/problems/counting-bits/) | DP: ans[i] = ans[i >> 1] + (i & 1) — relate to half | O(n) |
| 1310 | [XOR Queries of Subarray](https://leetcode.com/problems/xor-queries-of-a-subarray/) | XOR prefix array — range XOR = prefix[R+1] ^ prefix[L] | O(n+q) |

### Level 3: Hard — FAANG Interview Level

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 260 | [Single Number III](https://leetcode.com/problems/single-number-iii/) | XOR all → get a^b → use lowest differing bit to partition into two groups | O(n) |

### Solving Order for Maximum Learning

```
Day 1: 136 → 191 → 231 (build XOR and bit-clearing instincts)
Day 2: 268 → 338 (XOR for missing number, DP with bit relation)
Day 3: 137 → 260 (state machine for mod-3, partition trick for two uniques)
Day 4: 1310 (XOR prefix — bridges to prefix sum pattern)
Day 5: Re-solve 136, 137, 260 WITHOUT notes (test recall under time pressure)
```

---

## 6. Common Mistakes & Interview Traps

### Mistake 1: Using >> Instead of >>> in Java

```
WRONG:
  while (n != 0) {           // for n = -1 (0xFFFFFFFF), >> keeps sign bit
      count += (n & 1);      // n >> 1 = -1 forever → INFINITE LOOP
      n >>= 1;
  }

CORRECT:
  while (n != 0) {
      count += (n & 1);
      n >>>= 1;              // logical shift — fills with 0, loop terminates
  }

WHY: >> is arithmetic (preserves sign), >>> is logical (fills with 0).
     For bit counting / bit reversal, you almost ALWAYS want >>>.
```

### Mistake 2: Forgetting Two's Complement for Negative Numbers

```
WRONG: Assuming n & (n-1) works identically for negative numbers

  Integer.MIN_VALUE = 10000000 00000000 00000000 00000000
  Integer.MIN_VALUE & (Integer.MIN_VALUE - 1) = 0  ← looks like power of 2!
  
  BUT Integer.MIN_VALUE is -2^31, NOT a power of 2.
  
CORRECT: Power-of-2 check MUST include n > 0:
  return n > 0 && (n & (n - 1)) == 0;
```

### Mistake 3: Single Number XOR Only Works for Pairs

```
WRONG: Using plain XOR when elements appear 3 times
  [2, 2, 3, 2] → XOR = 2 ^ 2 ^ 3 ^ 2 = 3 ^ 2 = 1  ← WRONG (answer is 3)

  XOR cancels elements appearing an EVEN number of times.
  For "appears 3 times except one", you need the ones/twos state machine (LC 137).
```

### Mistake 4: 1 << 31 Is Negative in Java

```
WRONG:
  int mask = 1 << 31;     // = Integer.MIN_VALUE = -2147483648
  if (mask > 0) ...       // FALSE — this is negative!

CORRECT:
  long mask = 1L << 31;   // = 2147483648L — positive
  // or simply be aware that 1 << 31 is the sign bit
```

### Mistake 5: Not Using Parentheses Around Bit Operations

```
WRONG:
  if (n & 1 == 0)         // Java precedence: == binds tighter than &
                           // parsed as: n & (1 == 0) → n & 0 → always 0!

CORRECT:
  if ((n & 1) == 0)       // ALWAYS parenthesize bit ops in conditions
```

### What Interviewers Actually Look For

```
JUNIOR:    Can XOR an array to find the single number
SENIOR:    Handles negative numbers, uses >>> correctly, explains two's complement
STAFF:     Instantly picks the right bit trick, explains WHY XOR works (group theory),
           knows when bit manipulation is overkill vs. simpler math
```

---

## 7. Interview Strategy

### Target Solving Times

```
Easy (Single Number, Power of 2):       3-5 minutes (these are one-liners)
Medium (Single Number II, Counting Bits): 8-12 minutes
Hard (Single Number III):                12-18 minutes (partition trick is non-obvious)

If you're taking longer than these, you haven't internalized the tricks.
```

### How to Explain Your Approach (Script)

```
STEP 1 (15 seconds): State the brute force
  "The brute force is to use a HashMap to count occurrences — O(n) time, O(n) space."

STEP 2 (30 seconds): Introduce the bit trick
  "Since every number except one appears twice, I can use XOR.
   XOR has the property that a ^ a = 0 and a ^ 0 = a.
   So XOR-ing all elements cancels the pairs, leaving only the unique number.
   This gives O(n) time and O(1) space."

STEP 3 (15 seconds): Address edge cases
  "This works for negative numbers too since XOR operates on bits regardless of sign.
   For an empty array, I'd return 0."

STEP 4: Code (2-5 minutes)

STEP 5 (15 seconds): Walk through an example
  "For [4, 1, 2, 1, 2]: 0^4=4, 4^1=5, 5^2=7, 7^1=6, 6^2=4. Returns 4. Correct."
```

### Follow-Up Questions Interviewers Ask

```
Q: "What if two numbers appear once instead of one?"
A: "XOR all elements gives a ^ b. I find the lowest set bit where a and b differ,
    partition the array into two groups by that bit, and XOR each group separately.
    That's LC 260 — still O(n) time, O(1) space."

Q: "What if every element appears 3 times except one?"
A: "Plain XOR won't work since 3 is odd. I use a state machine with two variables
    (ones, twos) tracking bit counts mod 3. The formula is:
    ones = (ones ^ x) & ~twos; twos = (twos ^ x) & ~ones. That's LC 137."

Q: "Can you find the missing number without XOR?"
A: "Yes — use the sum formula n*(n+1)/2 minus the array sum. But XOR avoids
    potential integer overflow on large n, since it never exceeds the value range."

Q: "Why not just use a HashSet?"
A: "HashSet works but uses O(n) space. The bit manipulation approach achieves
    O(1) space, which matters for large datasets or memory-constrained environments.
    In an interview, showing the bit approach demonstrates deeper algorithmic thinking."
```

---

## 8. Revision Strategy

### Weekly Revision Plan

```
WEEK 1: Solve all 8 problems from scratch. Time yourself.
WEEK 2: Re-solve only the ones over target time. Focus on 137 and 260.
WEEK 3: Solve 136, 137, 260 from memory (no notes). These are the core trio.
WEEK 4: Mix with other patterns to practice pattern SELECTION
         (e.g., "Missing Number" — can you pick XOR vs. sum formula vs. sort?).
```

### What to Memorize vs Understand

```
MEMORIZE:
  ✓ a ^ a = 0, a ^ 0 = a, XOR is commutative and associative
  ✓ n & (n-1) removes lowest set bit
  ✓ n & (-n) isolates lowest set bit
  ✓ Power of 2: n > 0 && (n & (n-1)) == 0
  ✓ >>> vs >> in Java (logical vs arithmetic shift)
  ✓ ALWAYS parenthesize bit ops in conditions

UNDERSTAND (derive each time):
  ✓ WHY XOR cancels pairs (self-inverse property)
  ✓ WHY n & (n-1) clears the lowest bit (n-1 flips trailing bits)
  ✓ HOW the ones/twos state machine works for Single Number II
  ✓ HOW partition-by-bit solves Single Number III
  ✓ WHY prefix XOR works like prefix sum (XOR is its own inverse)
```

### Signals That Indicate Mastery

```
□ You see "single number" and IMMEDIATELY think XOR (< 3 seconds)
□ You can write Single Number III (partition trick) in under 10 minutes cold
□ You know when >>> vs >> matters and never cause infinite loops
□ You can explain two's complement and why Integer.MIN_VALUE is special
□ You can enumerate subsets with bitmasks without thinking
□ You can articulate when XOR beats HashMap (space) and when HashMap beats XOR (clarity)
```

---

## Quick Reference Card (Print This)

```
TRICK                  CODE                              TIME    SPACE
──────────────────────────────────────────────────────────────────────────
XOR single number      for x: xor ^= x                  O(n)    O(1)
Count set bits         while n: n &= (n-1), count++      O(k)    O(1)
Power of 2             n > 0 && (n & (n-1)) == 0         O(1)    O(1)
Get bit k              (n >> k) & 1                       O(1)    O(1)
Set bit k              n | (1 << k)                       O(1)    O(1)
Clear bit k            n & ~(1 << k)                      O(1)    O(1)
Remove lowest set bit  n & (n - 1)                        O(1)    O(1)
Isolate lowest set bit n & (-n)                           O(1)    O(1)
Two unique numbers     XOR all → lowest diff bit → split  O(n)    O(1)
Subset enumeration     for mask 0..2^n: check (mask>>i)&1 O(2^n·n) O(1)
Counting bits DP       ans[i] = ans[i>>1] + (i&1)        O(n)    O(n)
XOR prefix queries     prefix[i+1] = prefix[i] ^ arr[i]  O(n+q)  O(n)

JAVA GOTCHAS:
  >> = arithmetic (sign-extends) | >>> = logical (zero-fills) → USE >>> FOR BIT LOOPS
  1 << 31 = Integer.MIN_VALUE (negative!) → use 1L << 31 for positive
  ALWAYS parenthesize: (n & 1) == 0, NOT n & 1 == 0
```
