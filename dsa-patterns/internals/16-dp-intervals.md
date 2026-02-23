# Interval DP & State Machine DP

> **Interval DP**: Solve problems on contiguous subarrays by splitting or merging intervals—typical for palindromes, matrix chain multiplication, and burst balloons. **State Machine DP**: Model discrete states (e.g., bought/sold, cooldown) and transitions between them—classic for stock buy/sell with constraints.

## What Is This Pattern?

### Interval DP

**Interval DP** solves problems where the optimal solution depends on optimal solutions to overlapping contiguous subintervals. You define `dp[i][j]` as the answer for the subarray/substring from index `i` to `j` (inclusive). The recurrence typically either:

- **Split**: `dp[i][j] = min/max over k (dp[i][k] + dp[k+1][j] + cost)` — partition at every k.
- **Merge**: When an operation "uses" endpoints (e.g., burst last balloon), `dp[i][j]` = cost of that operation + subproblems.

Order of filling: iterate by interval length (len = 1, 2, … n), or use memoization. Base case: `dp[i][i]` for single-element intervals.

### State Machine DP

**State Machine DP** models a process as a finite state machine. Each state represents a "situation" (e.g., holding stock, just sold). Transitions have costs/rewards. You compute `dp[i][state]` = best outcome at day `i` in that state. Classic example: **stock buy/sell** — states like "hold", "sold" (or "cooldown"), transitions depend on buy/sell/rest rules.

## When to Use

**Interval DP:**
- Problem involves **contiguous subarrays** or **substrings**.
- Optimal structure: combining solutions to **smaller contiguous pieces**.
- Examples: palindromic subsequence, matrix chain multiplication, burst balloons, optimal binary search tree, minimum cost tree from leaf values.

**State Machine DP:**
- Problem has **discrete states** and **allowed transitions**.
- Each step: **buy**, **sell**, **rest**, **cooldown**, etc.
- Classic: **stock buy/sell** with transaction limits, fees, or cooldowns.

## How to Identify

```
Is the input a contiguous sequence (array/string)?
    NO → Consider other DP (knapsack, LCS, etc.)
    YES ↓

Does the problem ask for optimal on a RANGE [i..j]?
    YES → INTERVAL DP (split/merge on subintervals)
    NO ↓

Does the problem involve BUY/SELL with constraints?
    YES → STATE MACHINE DP
    NO ↓

Are there discrete states (hold, sold, cooldown)?
    YES → STATE MACHINE DP
```

## Core Template (Pseudocode)

### Interval DP — Merge/Split

```
// dp[i][j] = answer for subarray arr[i..j]
FUNCTION intervalDP(arr):
    n = length(arr)
    dp[i][j] = 2D array, init with base values

    FOR len FROM 2 TO n:
        FOR i FROM 0 TO n - len:
            j = i + len - 1
            dp[i][j] = INF or -INF
            FOR k FROM i TO j - 1:
                // Split: combine [i..k] and [k+1..j]
                candidate = dp[i][k] + dp[k+1][j] + cost(i, k, j)
                dp[i][j] = min/max(dp[i][j], candidate)

    RETURN dp[0][n-1]
```

### Interval DP — Burst Balloons Style (last item "used")

```
// dp[i][j] = max coins from bursting balloons i..j, with boundaries i-1 and j+1
FUNCTION burstStyleDP(nums):
    n = length(nums)
    // Pad with 1s at boundaries
    FOR len FROM 1 TO n:
        FOR i FROM 1 TO n:
            j = i + len - 1
            IF j > n: BREAK
            FOR k FROM i TO j:
                coins = nums[i-1] * nums[k] * nums[j+1]
                dp[i][j] = max(dp[i][j], dp[i][k-1] + coins + dp[k+1][j])

    RETURN dp[1][n]
```

### State Machine DP — Buy/Sell Stocks

```
// States: 0 = can buy (no holding), 1 = holding stock
FUNCTION stockStateMachine(prices):
    n = length(prices)
    dp[0][0] = 0, dp[0][1] = -prices[0]

    FOR i FROM 1 TO n-1:
        dp[i][0] = max(dp[i-1][0], dp[i-1][1] + prices[i])   // rest or sell
        dp[i][1] = max(dp[i-1][1], dp[i-1][0] - prices[i])   // rest or buy

    RETURN dp[n-1][0]

// With cooldown: add state "just sold" and transition to cooldown.
// With k transactions: dp[i][k][0/1] = day i, k transactions left, holding or not.
```

## Core Template (Java)

### Interval DP — Merge/Split

```java
public int intervalDP(int[] arr) {
    int n = arr.length;
    int[][] dp = new int[n][n];

    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len <= n; i++) {
            int j = i + len - 1;
            dp[i][j] = Integer.MAX_VALUE;  // or MIN_VALUE for max
            for (int k = i; k < j; k++) {
                int cost = /* compute from arr, i, k, j */;
                dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[k + 1][j] + cost);
            }
        }
    }
    return dp[0][n - 1];
}
```

### State Machine DP — Buy/Sell

```java
public int maxProfitStateMachine(int[] prices) {
    int n = prices.length;
    int notHold = 0, hold = -prices[0];

    for (int i = 1; i < n; i++) {
        int newNotHold = Math.max(notHold, hold + prices[i]);
        int newHold = Math.max(hold, notHold - prices[i]);
        notHold = newNotHold;
        hold = newHold;
    }
    return notHold;
}
```

## Complexity Cheat Sheet

| Pattern            | Time        | Space       | Notes                                      |
|--------------------|-------------|-------------|--------------------------------------------|
| Interval DP (split)| O(n³)       | O(n²)       | Triple loop: len × i × k                   |
| Interval DP (memo) | O(n³)       | O(n²)       | Same; recursive with memo                  |
| State machine (2D) | O(n × S)    | O(n × S)    | S = number of states (often 2 or 3)        |
| State machine (1D) | O(n)        | O(1)        | Roll DP; S = 2–3                           |
| Stock with k txns  | O(n × k)    | O(k)        | Optimize to O(k) space                     |

## Problems with Full Solutions

### Easy (2)

#### Problem: [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) (LeetCode #121)

- **Brute Force:** Check every pair (i,j) with i<j; profit = prices[j]-prices[i], take max. Time O(n²), Space O(1).
- **Intuition:** One transaction only. Find max profit = max(price[j] - price[i]) for i < j. Equivalent to: track minimum price seen so far; at each day, profit = price - min, take max.
- **Approach:** Single pass: maintain `minPrice`, at each day `profit = prices[i] - minPrice`, update `maxProfit`. No DP needed, but it's the simplest state-machine case (buy once, sell once).
- **Java Solution:**

```java
class Solution {
    public int maxProfit(int[] prices) {
        if (prices == null || prices.length < 2) return 0;
        int minPrice = prices[0];
        int maxProfit = 0;
        for (int i = 1; i < prices.length; i++) {
            maxProfit = Math.max(maxProfit, prices[i] - minPrice);
            minPrice = Math.min(minPrice, prices[i]);
        }
        return maxProfit;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/) (LeetCode #122)

- **Brute Force:** Recursively try all valid buy/sell sequences (buy then sell, repeat). Time O(2^n), Space O(n).
- **Intuition:** Unlimited transactions. Capture every price rise: if prices[i] > prices[i-1], add the difference. Greedy works; state machine: hold/notHold, always prefer selling when price rises.
- **Approach:** Greedy: sum all positive (prices[i] - prices[i-1]). Or state machine: notHold = max(notHold, hold + p), hold = max(hold, notHold - p).
- **Java Solution:**

```java
class Solution {
    public int maxProfit(int[] prices) {
        int profit = 0;
        for (int i = 1; i < prices.length; i++) {
            if (prices[i] > prices[i - 1]) {
                profit += prices[i] - prices[i - 1];
            }
        }
        return profit;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

### Medium (4)

#### Problem: Best Time to Buy and Sell Stock with Cooldown (LeetCode #309)

- **Intuition:** After selling, must wait one day before buying. States: `hold` (own stock), `sold` (just sold, in cooldown), `rest` (can buy). Transitions: hold→hold (rest) or hold→sold (sell); sold→rest; rest→rest or rest→hold (buy).
- **Approach:** Three states: `hold = max(hold, rest - p)`, `sold = hold + p`, `rest = max(rest, sold)`. Process in order: sold depends on old hold; hold and rest depend on previous rest/sold.
- **Java Solution:**

```java
class Solution {
    public int maxProfit(int[] prices) {
        if (prices == null || prices.length == 0) return 0;
        int hold = -prices[0], sold = 0, rest = 0;
        for (int i = 1; i < prices.length; i++) {
            int prevHold = hold, prevSold = sold, prevRest = rest;
            hold = Math.max(prevHold, prevRest - prices[i]);
            sold = prevHold + prices[i];
            rest = Math.max(prevRest, prevSold);
        }
        return Math.max(sold, rest);
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Best Time to Buy and Sell Stock with Transaction Fee](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/) (LeetCode #714)

- **Brute Force:** Recursively try all buy/sell sequences, subtracting fee on each sell. Time O(2^n), Space O(n).
- **Intuition:** Each sell incurs `fee`. States: hold, notHold. `notHold = max(notHold, hold + p - fee)`, `hold = max(hold, notHold - p)`.
- **Approach:** Two-state DP; subtract fee when selling.
- **Java Solution:**

```java
class Solution {
    public int maxProfit(int[] prices, int fee) {
        int notHold = 0, hold = -prices[0];
        for (int i = 1; i < prices.length; i++) {
            int newNotHold = Math.max(notHold, hold + prices[i] - fee);
            int newHold = Math.max(hold, notHold - prices[i]);
            notHold = newNotHold;
            hold = newHold;
        }
        return notHold;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Minimum Cost Tree From Leaf Values](https://leetcode.com/problems/minimum-cost-tree-from-leaf-values/) (LeetCode #1130)

- **Brute Force:** Try all possible binary tree structures with in-order leaves; compute cost for each. Time O(n!), Space O(n).
- **Intuition:** Build a binary tree from leaf array (in-order). Non-leaf value = left.max × right.max. Minimize sum of all non-leaf values. Interval DP: `dp[i][j]` = min cost for leaves i..j; split at k, cost = dp[i][k] + dp[k+1][j] + max(i..k)*max(k+1..j).
- **Approach:** Precompute `max[i][j]`. Fill `dp` by length. `dp[i][j] = min over k of (dp[i][k] + dp[k+1][j] + max[i][k]*max[k+1][j])`.
- **Java Solution:**

```java
class Solution {
    public int mctFromLeafValues(int[] arr) {
        int n = arr.length;
        int[][] max = new int[n][n];
        for (int i = 0; i < n; i++) {
            max[i][i] = arr[i];
            for (int j = i + 1; j < n; j++)
                max[i][j] = Math.max(max[i][j - 1], arr[j]);
        }

        int[][] dp = new int[n][n];
        for (int len = 2; len <= n; len++) {
            for (int i = 0; i + len <= n; i++) {
                int j = i + len - 1;
                dp[i][j] = Integer.MAX_VALUE;
                for (int k = i; k < j; k++) {
                    int cost = dp[i][k] + dp[k + 1][j] + max[i][k] * max[k + 1][j];
                    dp[i][j] = Math.min(dp[i][j], cost);
                }
            }
        }
        return dp[0][n - 1];
    }
}
```

- **Complexity:** Time O(n³), Space O(n²)

---

#### Problem: [Longest Palindromic Subsequence](https://leetcode.com/problems/longest-palindromic-subsequence/) (LeetCode #516)

- **Brute Force:** Generate all 2^n subsequences, check each if palindrome, take max length. Time O(2^n · n), Space O(n).
- **Intuition:** LPS of s = LCS(s, reverse(s)). Or interval DP: `dp[i][j]` = LPS length for s[i..j]. If s[i]==s[j]: 2 + dp[i+1][j-1]; else: max(dp[i+1][j], dp[i][j-1]).
- **Approach:** Fill by length. Base: `dp[i][i]=1`. For len≥2: `dp[i][j] = s[i]==s[j] ? 2+dp[i+1][j-1] : max(dp[i+1][j], dp[i][j-1])`.
- **Java Solution:**

```java
class Solution {
    public int longestPalindromeSubseq(String s) {
        int n = s.length();
        int[][] dp = new int[n][n];
        for (int i = 0; i < n; i++) dp[i][i] = 1;

        for (int len = 2; len <= n; len++) {
            for (int i = 0; i + len <= n; i++) {
                int j = i + len - 1;
                if (s.charAt(i) == s.charAt(j))
                    dp[i][j] = 2 + dp[i + 1][j - 1];
                else
                    dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
            }
        }
        return dp[0][n - 1];
    }
}
```

- **Complexity:** Time O(n²), Space O(n²)

---

### Hard (3)

#### Problem: [Best Time to Buy and Sell Stock III](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/) (LeetCode #123)

- **Brute Force:** Try all pairs of non-overlapping buy-sell intervals (split at each k). Time O(n⁴), Space O(1).
- **Intuition:** At most 2 transactions. Track best profit after 1 buy, 1 sell, 2 buys, 2 sells. `buy1 = max(buy1, -p)`, `sell1 = max(sell1, buy1+p)`, `buy2 = max(buy2, sell1-p)`, `sell2 = max(sell2, buy2+p)`.
- **Approach:** Four variables in one pass; each uses the previous.
- **Java Solution:**

```java
class Solution {
    public int maxProfit(int[] prices) {
        if (prices == null || prices.length < 2) return 0;
        int buy1 = -prices[0], sell1 = 0;
        int buy2 = -prices[0], sell2 = 0;
        for (int i = 1; i < prices.length; i++) {
            int p = prices[i];
            sell2 = Math.max(sell2, buy2 + p);
            buy2 = Math.max(buy2, sell1 - p);
            sell1 = Math.max(sell1, buy1 + p);
            buy1 = Math.max(buy1, -p);
        }
        return sell2;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Best Time to Buy and Sell Stock IV](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/) (LeetCode #188)

- **Brute Force:** Recursively try all sequences of up to k buy-sell pairs. Time O(2^n), Space O(n).
- **Intuition:** At most k transactions. `dp[t][0]` = max profit after t sells (not holding), `dp[t][1]` = after t sells and one buy (holding). For each day: update all transaction levels. When k ≥ n/2, same as unlimited (#122).
- **Approach:** `dp[k][0]` and `dp[k][1]` arrays. `dp[j][0] = max(dp[j][0], dp[j][1] + p)`, `dp[j][1] = max(dp[j][1], dp[j-1][0] - p)` for j from k down to 1.
- **Java Solution:**

```java
class Solution {
    public int maxProfit(int k, int[] prices) {
        if (prices == null || prices.length < 2 || k <= 0) return 0;
        if (k >= prices.length / 2) {
            int profit = 0;
            for (int i = 1; i < prices.length; i++)
                if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
            return profit;
        }
        int[] sell = new int[k + 1];
        int[] buy = new int[k + 1];
        java.util.Arrays.fill(buy, Integer.MIN_VALUE);

        for (int p : prices) {
            for (int j = k; j >= 1; j--) {
                sell[j] = Math.max(sell[j], buy[j] + p);
                buy[j] = Math.max(buy[j], sell[j - 1] - p);
            }
        }
        return sell[k];
    }
}
```

- **Complexity:** Time O(n × k), Space O(k)

---

#### Problem: [Burst Balloons](https://leetcode.com/problems/burst-balloons/) (LeetCode #312)

- **Brute Force:** Try all n! orders of bursting balloons; compute coins for each order. Time O(n!), Space O(n).
- **Intuition:** Burst balloons to maximize coins. When bursting `k` last in range [i,j], coins = nums[i-1]*nums[k]*nums[j+1]. Interval DP: `dp[i][j]` = max coins from bursting balloons in (i,j) with boundaries. Pad array with 1s.
- **Approach:** Build `vals = [1, ... nums, 1]`. `dp[i][j] = max over k in (i,j) of (vals[i]*vals[k]*vals[j] + dp[i][k] + dp[k][j])`. Iterate by length.
- **Java Solution:**

```java
class Solution {
    public int maxCoins(int[] nums) {
        int n = nums.length;
        int[] vals = new int[n + 2];
        vals[0] = 1;
        vals[n + 1] = 1;
        for (int i = 0; i < n; i++) vals[i + 1] = nums[i];

        int[][] dp = new int[n + 2][n + 2];
        for (int len = 1; len <= n; len++) {
            for (int i = 1; i + len <= n + 1; i++) {
                int j = i + len - 1;
                for (int k = i; k <= j; k++) {
                    int coins = vals[i - 1] * vals[k] * vals[j + 1];
                    dp[i][j] = Math.max(dp[i][j], dp[i][k - 1] + coins + dp[k + 1][j]);
                }
            }
        }
        return dp[1][n];
    }
}
```

- **Complexity:** Time O(n³), Space O(n²)

---

## Common Mistakes

| Mistake | How to Avoid |
|---------|--------------|
| **Interval DP loop order** | Fill by increasing interval length so `dp[i][k]` and `dp[k+1][j]` are ready when computing `dp[i][j]`. |
| **Burst Balloons boundaries** | Pad with 1s; `dp[i][j]` uses boundaries `vals[i-1]` and `vals[j+1]`. Iterate `i` from 1, `j` up to n. |
| **State machine transition order** | When states depend on each other, compute all "new" values from "old", then assign (avoid overwriting too early). |
| **Stock IV: k large** | If k ≥ n/2, treat as unlimited transactions to avoid TLE. |
| **Stock III update order** | Update sell2, buy2, sell1, buy1 in that order so each uses previous values from same day. |
| **MCT from leaf values** | Cost = max(left) × max(right) for the root, not sum. Precompute max[i][j] for O(1) lookup. |
| **LPS base case** | `dp[i][i] = 1`. For `i+1 > j-1` (len 2 with same char), `dp[i+1][j-1]` = 0, so 2+0=2 is correct. |

## Pattern Variations

| Variation | Description | Example |
|-----------|-------------|---------|
| **Interval split** | Combine two adjacent intervals at each split point | MCT from Leaf Values (#1130), Matrix Chain |
| **Interval merge (last)** | "Use" a specific element last; subproblems exclude it | Burst Balloons (#312) |
| **Palindrome interval** | Match endpoints or take max of shrink | LPS (#516) |
| **2-state stock** | hold / notHold | #122, #714 |
| **3-state stock** | hold / sold / rest (cooldown) | #309 |
| **k-transaction stock** | DP over transaction count | #123 (k=2), #188 (k general) |
| **Monotonic stack optimization** | MCT can be optimized to O(n) with stack | #1130 (advanced) |
