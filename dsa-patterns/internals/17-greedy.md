# Greedy Algorithms — Interview Execution Playbook

> **Pattern Mastery Level:** Greedy is the most deceptive pattern. It looks simple, but proving correctness separates strong candidates from everyone else. Appears in ~10% of FAANG coding rounds — scheduling, interval, and "minimum number of X" problems are greedy staples.

---

## 1. Pattern Recognition Signals

### When to Use Greedy

```
INSTANT TRIGGERS (say "greedy" within 5 seconds):
  ✓ "Minimum number of X to cover/reach/complete"
  ✓ "Maximum number of non-overlapping intervals"
  ✓ "Schedule tasks/events with constraints"
  ✓ "Can you reach the end" / "minimum jumps"
  ✓ "Partition into fewest groups"
  ✓ "Assign resources optimally"
```

### Keywords in Problem Statements

```
DIRECT SIGNALS:               INDIRECT SIGNALS:
  "minimum number of"           "intervals" + "sort"
  "maximum events"              "each step pick the best"
  "schedule"                    "cooldown" / "delay"
  "non-overlapping"             "partition into parts"
  "cover all points"            "circular route"
  "burst / remove / merge"      "rating" + "neighbors"
```

### When NOT to Use

```
✗ Locally optimal ≠ globally optimal → use DP (e.g., 0/1 Knapsack, Coin Change with arbitrary denominations)
✗ Need to enumerate ALL valid configurations → use BACKTRACKING
✗ Overlapping subproblems with choices that affect future state → use DP
✗ Problem has "how many ways" or "count all paths" → DP or combinatorics, not greedy
✗ Counterexample exists for the greedy choice → stop, switch to DP
```

---

## 2. Thinking Framework (Step-by-Step Intuition)

### The 60-Second Decision Process

```
Step 1: "Does a local best choice lead to a global best?"
  YES → Greedy is a candidate
  NO  → Use DP or backtracking

Step 2: "Can I prove correctness?"
  Exchange argument: "If the optimal solution didn't make my greedy choice,
    I can swap it in without making the answer worse."
  Stays-ahead argument: "At every step, greedy is at least as good as any
    other strategy."
  If you can sketch either argument → GREEDY WORKS

Step 3: "What's the greedy order?"
  Sort by end time → interval scheduling / arrows / non-overlapping
  Sort by start time → merging intervals
  Sort by ratio (value/weight) → fractional knapsack
  Sort by frequency → task scheduling
  No sort needed → reachability (jump game), circular (gas station)

Step 4: "What's the greedy rule at each step?"
  Pick the next compatible item (intervals)
  Extend the farthest reachable point (jump game)
  Reset when constraint violated (gas station)
  Fill idle slots with most frequent first (task scheduler)
```

### Greedy vs DP: The Critical Decision

```
GREEDY works when:                     DP is needed when:
  ✓ Greedy choice property holds         ✗ Choice depends on future state
  ✓ No need to revisit past decisions    ✗ Overlapping subproblems
  ✓ One pass (maybe after sorting)       ✗ Need to try all combinations
  ✓ "Take or skip" with clear rule       ✗ "Take or skip" where skip now
                                            might be better long-term

CLASSIC TRAPS (looks greedy, needs DP):
  Coin Change → greedy fails for denominations like [1, 3, 4] target 6
                greedy picks 4+1+1=3 coins, optimal is 3+3=2 coins
  0/1 Knapsack → can't take fractions, greedy by value/weight fails
  Longest Increasing Subsequence → greedy by "take smallest" doesn't work
```

### Proving Greedy Works (For the Interviewer)

```
EXCHANGE ARGUMENT (most common proof):
  1. Assume optimal solution O* that differs from greedy at some step
  2. Show you can swap O*'s choice for greedy's choice
  3. Prove the result is no worse → greedy is also optimal

  Example (Interval Scheduling):
    "Suppose optimal picks interval X instead of the one ending earliest.
     Since our interval ends no later than X, everything compatible with X
     is also compatible with ours. So swapping X for ours gives at least
     as many intervals."

STAYS-AHEAD ARGUMENT:
  1. Show that after each step, greedy's partial solution ≥ any alternative
  2. By induction, greedy's final solution is optimal

  Example (Jump Game II):
    "After k jumps, greedy reaches at least as far as any strategy using
     k jumps. So it needs the fewest jumps overall."
```

---

## 3. Java Templates (Production-Quality)

### Template 1: Interval Scheduling (Sort by End)

```java
// USE FOR: Non-overlapping Intervals, Min Arrows, Activity Selection
// TIME: O(n log n) | SPACE: O(log n) for sort
public int intervalSchedule(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
    int count = 1;
    int prevEnd = intervals[0][1];
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] >= prevEnd) {   // use > for "touching = overlapping"
            count++;
            prevEnd = intervals[i][1];
        }
    }
    return count; // max non-overlapping intervals
}
```

### Template 2: Jump Game / Reachability

```java
// USE FOR: Jump Game, Jump Game II, Farthest reach problems
// TIME: O(n) | SPACE: O(1)

// Can we reach the end?
public boolean canReach(int[] nums) {
    int farthest = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > farthest) return false;
        farthest = Math.max(farthest, i + nums[i]);
    }
    return true;
}

// Minimum jumps to reach end (BFS-level greedy)
public int minJumps(int[] nums) {
    int jumps = 0, curEnd = 0, farthest = 0;
    for (int i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);
        if (i == curEnd) {
            jumps++;
            curEnd = farthest;
        }
    }
    return jumps;
}
```

### Template 3: Task Scheduler (Frequency-Based Greedy)

```java
// USE FOR: Task Scheduler, Reorganize String, frequency-constrained scheduling
// TIME: O(n) | SPACE: O(1) — fixed 26-char array
public int taskScheduler(char[] tasks, int n) {
    int[] freq = new int[26];
    for (char c : tasks) freq[c - 'A']++;

    int maxFreq = 0;
    for (int f : freq) maxFreq = Math.max(maxFreq, f);

    int countMax = 0;
    for (int f : freq) if (f == maxFreq) countMax++;

    // (maxFreq-1) full rounds of (n+1) slots + final round with countMax tasks
    int slots = (maxFreq - 1) * (n + 1) + countMax;
    return Math.max(slots, tasks.length);
}
```

### Template 4: Two-Pass Greedy (Neighbor Constraints)

```java
// USE FOR: Candy, problems with left AND right neighbor constraints
// TIME: O(n) | SPACE: O(n)
public int twoPassGreedy(int[] ratings) {
    int n = ratings.length;
    int[] vals = new int[n];
    Arrays.fill(vals, 1);

    // left-to-right: enforce "greater than left neighbor" rule
    for (int i = 1; i < n; i++)
        if (ratings[i] > ratings[i - 1])
            vals[i] = vals[i - 1] + 1;

    // right-to-left: enforce "greater than right neighbor" rule
    for (int i = n - 2; i >= 0; i--)
        if (ratings[i] > ratings[i + 1])
            vals[i] = Math.max(vals[i], vals[i + 1] + 1);

    int sum = 0;
    for (int v : vals) sum += v;
    return sum;
}
```

---

## 4. Edge Case Checklist

```
INPUT EDGE CASES:
  □ Empty array / no intervals → return 0 (arrows, scheduling) or true (jump game with length 0)
  □ Single element → already at the end (jump game), 1 arrow, 1 candy
  □ All intervals identical → they all overlap, count as 1 group
  □ Integer overflow in interval endpoints → use Integer.compare(), never a[1] - b[1]
  □ Intervals with negative coordinates → sorting still works, but watch comparator

INTERVAL-SPECIFIC:
  □ Touching intervals [1,2] and [2,3] → overlapping or not? Read problem carefully
     Min Arrows (#452): touching = one arrow bursts both (use > not >=)
     Non-overlapping (#435): touching = non-overlapping (use >= not >)
  □ Intervals already sorted → don't re-sort (save O(n log n))
  □ Single interval → always 1 arrow, 0 removals

JUMP GAME-SPECIFIC:
  □ nums = [0] → already at end, return true / 0 jumps
  □ nums = [0, ...] → stuck at index 0 if length > 1, return false
  □ All zeros except first → can only reach if length == 1
  □ Very large values → farthest can exceed array bounds, that's fine (means we reach end)

SCHEDULING-SPECIFIC:
  □ All tasks identical with cooldown → (count-1) * (n+1) + 1 idle slots
  □ n = 0 (no cooldown) → answer is just tasks.length
  □ Enough distinct tasks to fill all idle slots → answer is tasks.length (no idle time)

CIRCULAR PROBLEMS:
  □ Gas Station: total gas < total cost → impossible, return -1
  □ Only one station → check if gas[0] >= cost[0]
```

---

## 5. Problem Progression (LeetCode)

### Level 1: Foundation — Single-Pass Greedy

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 55 | [Jump Game](https://leetcode.com/problems/jump-game/) | Track farthest reachable; if i > farthest → stuck | O(n) |
| 134 | [Gas Station](https://leetcode.com/problems/gas-station/) | If total gas >= total cost, solution exists; reset start when tank < 0 | O(n) |
| 763 | [Partition Labels](https://leetcode.com/problems/partition-labels/) | Track last occurrence of each char; cut when i == end of current partition | O(n) |

### Level 2: Sort-Then-Greedy (Interval Problems)

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 435 | [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/) | Sort by end; count max non-overlapping; answer = n - count | O(n log n) |
| 452 | [Min Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/) | Sort by end; shoot at end of first balloon; skip all overlapping | O(n log n) |

### Level 3: Frequency / Formula Greedy

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 621 | [Task Scheduler](https://leetcode.com/problems/task-scheduler/) | Frame formula: (maxFreq-1)*(n+1) + countMax; cap with tasks.length | O(n) |
| 1353 | [Max Number of Events](https://leetcode.com/problems/maximum-number-of-events-that-can-be-attended/) | Sort by start; each day, attend event with earliest end (min-heap) | O(n log n) |

### Level 4: Hard — Multi-Constraint Greedy

| # | Problem | Key Insight | Time |
|---|---------|------------|------|
| 45 | [Jump Game II](https://leetcode.com/problems/jump-game-ii/) | BFS-level greedy: jump when i reaches curEnd, expand to farthest | O(n) |
| 135 | [Candy](https://leetcode.com/problems/candy/) | Two-pass: left-to-right for left neighbor, right-to-left for right neighbor | O(n) |

### Solving Order for Maximum Learning

```
Day 1: 55 → 134 → 763 (single-pass greedy intuition — no sorting needed)
Day 2: 435 → 452 (sort-by-end interval pattern — nearly identical template)
Day 3: 621 → 1353 (frequency reasoning and heap-assisted greedy)
Day 4: 45 → 135 (harder greedy — BFS-level tracking and two-pass)
Day 5: Re-solve 55, 435, 621, 45 from memory (test recall under time pressure)
```

### Detailed Solutions

---

#### Problem: [Jump Game](https://leetcode.com/problems/jump-game/) (LeetCode #55)

- **Brute Force:** Recursively try jumping 1 to nums[i] steps from each index; succeed if any path reaches end. Time O(2^n), Space O(n).
- **Intuition:** Track the farthest index reachable so far. If we're scanning at position i and i > farthest, we're stuck at a zero island. Otherwise keep extending farthest = max(farthest, i + nums[i]).
- **Why greedy works (stays-ahead):** At each step, farthest is the maximum reachable index using any combination of jumps. No strategy can reach farther — so if greedy can't reach the end, nothing can.
- **Approach:** 1) farthest = 0. 2) For i from 0 to n-1: if i > farthest return false; farthest = max(farthest, i + nums[i]); if farthest >= n-1 return true. 3) Return true.
- **Java Solution:**

```java
class Solution {
    public boolean canJump(int[] nums) {
        int farthest = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > farthest) return false;
            farthest = Math.max(farthest, i + nums[i]);
            if (farthest >= nums.length - 1) return true;
        }
        return true;
    }
}
```

- **Complexity:** Time O(n) — single pass tracking farthest reach; Space O(1) — one variable.

---

#### Problem: [Jump Game II](https://leetcode.com/problems/jump-game-ii/) (LeetCode #45)

- **Brute Force:** Recursively try all jump choices at each step; take minimum jumps to reach end. Time O(2^n), Space O(n).
- **Intuition:** Think of it as BFS on an implicit graph. From the current "level" (range of reachable indices), compute the next level's farthest reach. Each level expansion = one jump. When curEnd is reached, we must jump — increment jumps and set curEnd = farthest.
- **Why greedy works (stays-ahead):** After k jumps, greedy reaches at least as far as any strategy using k jumps. By induction, greedy uses the minimum number of jumps.
- **Approach:** 1) jumps=0, curEnd=0, farthest=0. 2) For i from 0 to n-2: farthest = max(farthest, i+nums[i]). If i == curEnd: jumps++, curEnd = farthest. 3) Return jumps.
- **Java Solution:**

```java
class Solution {
    public int jump(int[] nums) {
        if (nums.length <= 1) return 0;
        int jumps = 0, curEnd = 0, farthest = 0;
        for (int i = 0; i < nums.length - 1; i++) {
            farthest = Math.max(farthest, i + nums[i]);
            if (i == curEnd) {
                jumps++;
                curEnd = farthest;
                if (curEnd >= nums.length - 1) break;
            }
        }
        return jumps;
    }
}
```

- **Complexity:** Time O(n) — single greedy pass with BFS-level tracking; Space O(1).

---

#### Problem: [Gas Station](https://leetcode.com/problems/gas-station/) (LeetCode #134)

- **Brute Force:** Try each station as start; simulate full circuit. Time O(n^2), Space O(1).
- **Intuition:** If total gas < total cost, it's impossible. Otherwise a valid start exists. Scan linearly: accumulate tank = gas[i] - cost[i]. When tank drops below 0, everything from the old start to i is a bad start — reset start to i+1 and tank to 0.
- **Why greedy works (exchange argument):** If starting at s causes tank < 0 at station j, then starting at any station between s and j is even worse (they'd have less accumulated gas at j). So we safely skip to j+1.
- **Approach:** 1) If sum(gas) < sum(cost) return -1. 2) start=0, tank=0. 3) For i: tank += gas[i]-cost[i]. If tank < 0, start = i+1, tank=0. 4) Return start.
- **Java Solution:**

```java
class Solution {
    public int canCompleteCircuit(int[] gas, int[] cost) {
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < gas.length; i++) {
            total += gas[i] - cost[i];
            tank += gas[i] - cost[i];
            if (tank < 0) {
                start = i + 1;
                tank = 0;
            }
        }
        return total >= 0 ? start : -1;
    }
}
```

- **Complexity:** Time O(n) — single pass; Space O(1).

---

#### Problem: [Partition Labels](https://leetcode.com/problems/partition-labels/) (LeetCode #763)

- **Brute Force:** Try all 2^(n-1) partition points; check each part has no letter appearing elsewhere. Time O(2^n * n), Space O(n).
- **Intuition:** For each character, compute its last occurrence. Scan left to right: extend the current partition's end to include the last occurrence of every character seen so far. When i equals end, we've found a valid cut — every character in this partition has its last occurrence within it.
- **Why greedy works (exchange argument):** Any valid partition must extend at least to the last occurrence of its characters. Cutting as early as possible produces the most partitions.
- **Approach:** 1) last[c] = last index of c. 2) start=0, end=0. 3) For i: end = max(end, last[s[i]]). If i == end, record partition size (end-start+1), start = i+1.
- **Java Solution:**

```java
class Solution {
    public List<Integer> partitionLabels(String s) {
        int[] last = new int[26];
        for (int i = 0; i < s.length(); i++)
            last[s.charAt(i) - 'a'] = i;
        List<Integer> result = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']);
            if (i == end) {
                result.add(end - start + 1);
                start = i + 1;
            }
        }
        return result;
    }
}
```

- **Complexity:** Time O(n) — build last[] then single scan; Space O(1) — 26-element array.

---

#### Problem: [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/) (LeetCode #435)

- **Brute Force:** Try all subsets; find the largest subset of non-overlapping intervals; answer = n - subset size. Time O(2^n), Space O(n).
- **Intuition:** This is the classic interval scheduling maximization problem. Sort by end time. Greedily pick intervals that don't conflict with the last picked one (earliest end first leaves the most room). The answer = total intervals - max non-overlapping count.
- **Why greedy works (exchange argument):** Suppose optimal picks interval X instead of the one ending earliest. Since our choice ends no later, everything compatible with X is also compatible with ours. Swapping X for ours keeps the count at least as good.
- **Approach:** 1) Sort by end. 2) count=1, prevEnd=intervals[0][1]. 3) For each: if start >= prevEnd, count++, update prevEnd. 4) Return n - count.
- **Java Solution:**

```java
class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        if (intervals.length == 0) return 0;
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
        int count = 1;
        int prevEnd = intervals[0][1];
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] >= prevEnd) {
                count++;
                prevEnd = intervals[i][1];
            }
        }
        return intervals.length - count;
    }
}
```

- **Complexity:** Time O(n log n) — sort by end; Space O(log n) — sort stack.

---

#### Problem: [Task Scheduler](https://leetcode.com/problems/task-scheduler/) (LeetCode #621)

- **Brute Force:** Try all permutations of tasks respecting cooldown; take minimum time. Time O(n!), Space O(n).
- **Intuition:** The most frequent task dictates the schedule's skeleton. If task A has max frequency f, we need (f-1) rounds of (n+1) slots each, plus a final round for all tasks sharing max frequency. If we have enough distinct tasks to fill all idle slots, the answer is just tasks.length (no idle time needed).
- **Why greedy works:** The bottleneck is the most frequent task. Idle slots only exist when we don't have enough distinct tasks to fill between repeated occurrences of the max-frequency task.
- **Approach:** 1) Count freq of each task. 2) Find maxFreq and countMax (number of tasks with maxFreq). 3) slots = (maxFreq-1)*(n+1) + countMax. 4) Return max(slots, tasks.length).
- **Java Solution:**

```java
class Solution {
    public int leastInterval(char[] tasks, int n) {
        int[] freq = new int[26];
        for (char c : tasks) freq[c - 'A']++;
        int maxFreq = 0;
        for (int f : freq) maxFreq = Math.max(maxFreq, f);
        int countMax = 0;
        for (int f : freq) if (f == maxFreq) countMax++;
        int slots = (maxFreq - 1) * (n + 1) + countMax;
        return Math.max(slots, tasks.length);
    }
}
```

- **Complexity:** Time O(n) — count frequencies, then O(1) formula; Space O(1) — fixed 26-element array.

---

#### Problem: [Minimum Number of Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/) (LeetCode #452)

- **Brute Force:** Try placing arrows at every possible position; find minimum covering set. Time O(n^2), Space O(1).
- **Intuition:** Same structure as interval scheduling. Sort by end. Shoot an arrow at the end of the first balloon. Every subsequent balloon that starts before or at the arrow position is burst by the same arrow. When a balloon starts after the arrow, we need a new arrow.
- **Why greedy works (exchange argument):** Shooting at the end of the first balloon covers the maximum number of overlapping balloons. Any arrow shot earlier would miss balloons that extend further right.
- **Approach:** 1) Sort by end. 2) arrows=1, pos=points[0][1]. 3) For each point: if start > pos, arrows++, pos = end. 4) Return arrows.
- **Java Solution:**

```java
class Solution {
    public int findMinArrowShots(int[][] points) {
        if (points.length == 0) return 0;
        Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
        int arrows = 1;
        int pos = points[0][1];
        for (int i = 1; i < points.length; i++) {
            if (points[i][0] > pos) {
                arrows++;
                pos = points[i][1];
            }
        }
        return arrows;
    }
}
```

- **Complexity:** Time O(n log n) — sort by end; Space O(log n) — sort stack.

---

#### Problem: [Candy](https://leetcode.com/problems/candy/) (LeetCode #135)

- **Brute Force:** Repeatedly scan and increment candies at violations until stable; sum. Time O(n^2), Space O(n).
- **Intuition:** Each child gets at least 1 candy. A child with a higher rating than a neighbor must get more. Two independent constraints (left neighbor and right neighbor) require two passes. Left-to-right enforces "higher rating than left → more candy than left." Right-to-left enforces "higher rating than right → more candy than right." Take the max at each position to satisfy both.
- **Why greedy works:** Each pass independently handles one direction's constraint. The max of both passes is the minimum assignment satisfying both constraints simultaneously.
- **Approach:** 1) candies[i]=1 for all. 2) Left pass: if ratings[i]>ratings[i-1], candies[i]=candies[i-1]+1. 3) Right pass: if ratings[i]>ratings[i+1], candies[i]=max(candies[i], candies[i+1]+1). 4) Sum.
- **Java Solution:**

```java
class Solution {
    public int candy(int[] ratings) {
        int n = ratings.length;
        int[] candies = new int[n];
        Arrays.fill(candies, 1);
        for (int i = 1; i < n; i++)
            if (ratings[i] > ratings[i - 1])
                candies[i] = candies[i - 1] + 1;
        for (int i = n - 2; i >= 0; i--)
            if (ratings[i] > ratings[i + 1])
                candies[i] = Math.max(candies[i], candies[i + 1] + 1);
        int sum = 0;
        for (int c : candies) sum += c;
        return sum;
    }
}
```

- **Complexity:** Time O(n) — two passes; Space O(n) — candies array.

---

#### Problem: [Maximum Number of Events That Can Be Attended](https://leetcode.com/problems/maximum-number-of-events-that-can-be-attended/) (LeetCode #1353)

- **Brute Force:** Try all subsets of events, check each valid assignment of events to days. Time O(2^n * d), Space O(n).
- **Intuition:** We can attend at most one event per day. To maximize attendance, for each day process all events that start on or before this day, and among the available events attend the one that ends soonest (it's the most urgent — miss it now and we lose it). Use a min-heap keyed on end day.
- **Why greedy works (exchange argument):** If we attend event X instead of the event ending soonest Y, and later can't attend Y because it expired, swapping X for Y would have been strictly better.
- **Approach:** 1) Sort events by start day. 2) For each day from 1 to maxDay: add all events starting today to a min-heap (by end day); remove expired events (end < today); poll the soonest-ending event, count++. 3) Return count.
- **Java Solution:**

```java
class Solution {
    public int maxEvents(int[][] events) {
        Arrays.sort(events, (a, b) -> Integer.compare(a[0], b[0]));
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        int count = 0, i = 0, day = 1;
        while (i < events.length || !heap.isEmpty()) {
            if (heap.isEmpty() && i < events.length)
                day = events[i][0]; // skip empty days
            while (i < events.length && events[i][0] <= day)
                heap.offer(events[i++][1]);
            while (!heap.isEmpty() && heap.peek() < day)
                heap.poll();
            if (!heap.isEmpty()) {
                heap.poll();
                count++;
            }
            day++;
        }
        return count;
    }
}
```

- **Complexity:** Time O(n log n) — sort + each event enters/exits heap once; Space O(n) — heap.

---

## 6. Common Mistakes & Interview Traps

### Mistake 1: Applying Greedy When DP Is Needed

```
WRONG: "Coin Change with coins [1, 3, 4], target 6 — pick largest coin first"
  Greedy picks: 4 + 1 + 1 = 3 coins
  Optimal:      3 + 3     = 2 coins

THE FIX: Before coding greedy, test with a small counterexample.
  If you find one → switch to DP.
  Greedy works for canonical coin systems ({1, 5, 10, 25}) but NOT arbitrary denominations.

INTERVIEWER TEST: They give you a problem that LOOKS greedy but isn't.
  CORRECT RESPONSE: "Let me check if greedy works... [constructs counterexample]
  Actually, greedy fails here because [specific example]. I'll use DP instead."
  This demonstrates maturity — it's BETTER than naively coding greedy.
```

### Mistake 2: Not Proving Correctness

```
WRONG: "I'll just sort and iterate — it seems right."
  Interviewers at FAANG expect you to justify WHY greedy works.

THE FIX: Sketch a quick exchange argument:
  "If the optimal solution didn't pick the interval ending earliest,
   I can swap it in without reducing the count, because my interval
   ends no later and is compatible with everything the original was."

  You don't need a formal proof — a 2-sentence intuitive argument is enough.
  This separates L5+ candidates from L4 candidates.
```

### Mistake 3: Wrong Sort Order for Intervals

```
WRONG: Sorting by START time for interval scheduling maximization
  Intervals: [1,10], [2,3], [4,6]
  Sort by start: pick [1,10] → blocks everything else → count = 1
  Sort by end:   pick [2,3], [4,6] → count = 2

THE FIX: Know the canonical sort orders:
  Maximize non-overlapping count → sort by END time
  Merge intervals                → sort by START time
  Minimize arrows / groups       → sort by END time
```

### Mistake 4: Integer Overflow in Interval Comparators

```
WRONG: Arrays.sort(intervals, (a, b) -> a[1] - b[1]);
  If a[1] = Integer.MAX_VALUE and b[1] = -1: overflow!
  MAX_VALUE - (-1) = MAX_VALUE + 1 = Integer.MIN_VALUE (negative!)
  Sort thinks a comes BEFORE b — WRONG ORDER

CORRECT: Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
  ALWAYS use Integer.compare() for interval/coordinate sorting.
  This is a guaranteed FAANG edge case in problems like #452 (arrows).
```

### Mistake 5: Confusing Touching Intervals Across Problems

```
Problem #452 (Min Arrows): [1,2] and [2,3] → one arrow at x=2 bursts BOTH
  Use: if (points[i][0] > pos)  ← strict greater than

Problem #435 (Non-overlapping): [1,2] and [2,3] → these are NOT overlapping
  Use: if (intervals[i][0] >= prevEnd)  ← greater than or equal

Getting this wrong is a common interview fail.
Read the problem statement to determine if touching = overlapping.
```

### What Interviewers Actually Look For

```
JUNIOR:    Can sort intervals and iterate. Might not justify why.
SENIOR:    Immediately identifies sort order, handles edge cases,
           gives a 2-sentence correctness argument without prompting.
STAFF:     Discusses greedy vs DP trade-off, identifies when greedy fails,
           can sketch an exchange argument, and handles follow-ups like
           "what if the constraints change?"
```

---

## 7. Interview Strategy

### Target Solving Times

```
Easy (Jump Game, Partition Labels):       5-8 minutes (including explanation)
Medium (Non-overlapping, Task Scheduler): 10-15 minutes
Hard (Jump Game II, Candy, Max Events):   15-20 minutes

If you're taking longer, you haven't internalized the templates.
```

### How to Explain Your Approach (Script)

```
STEP 1 (30 seconds): State the brute force and its cost
  "Brute force would try all subsets / all starting points, giving O(2^n) / O(n²)."

STEP 2 (30 seconds): Identify the greedy insight
  "I notice that picking the interval ending earliest leaves the most room
   for future intervals. This is the classic interval scheduling greedy."

STEP 3 (15 seconds): Justify correctness
  "This works because if the optimal solution picked a later-ending interval,
   I could swap in my earlier-ending one without losing compatibility."

STEP 4 (15 seconds): State complexity
  "O(n log n) time for sorting, O(1) extra space."

STEP 5: Code (5-10 minutes)

STEP 6 (30 seconds): Walk through an example
  "For [[1,3],[2,4],[3,5]]: sort by end → same order. Pick [1,3], skip [2,4]
   (starts at 2 < 3), pick [3,5] (starts at 3 >= 3). Count = 2."
```

### Follow-Up Questions Interviewers Ask

```
Q: "How do you know greedy works here? Could DP be better?"
A: "Greedy works because of the greedy choice property — picking the locally
    optimal choice (earliest end / farthest reach) provably leads to the global
    optimum. DP would work too but is O(n²) — overkill when greedy gives O(n log n)."

Q: "What if intervals can overlap partially — how does your approach change?"
A: "The sort-by-end template still works. The key is defining 'compatible':
    whether touching intervals count as overlapping depends on the problem.
    I adjust the comparator from >= to > accordingly."

Q: "Can you solve Jump Game II in O(n) without BFS?"
A: "The BFS-level greedy IS O(n) — it's not actual BFS with a queue. We just
    track the current level's end and the farthest reachable. One pass, O(1) space."

Q: "What if the Task Scheduler allowed parallel execution?"
A: "With k workers, the bottleneck is still the most frequent task.
    We'd adjust the formula: idle slots per round become n+1-k instead of n+1.
    Same greedy structure, different formula."

Q: "What real-world systems use greedy algorithms?"
A: "CPU scheduling (shortest job first), Huffman encoding for compression,
    Dijkstra's shortest path, and resource allocation in cloud systems."
```

---

## 8. Revision Strategy

### Weekly Revision Plan

```
WEEK 1: Solve all 9 problems from scratch. Time yourself strictly.
WEEK 2: Re-solve only the ones you couldn't do in target time.
WEEK 3: Solve Jump Game II, Non-overlapping Intervals, and Task Scheduler
         from memory — no notes, no looking at templates.
WEEK 4: Mix with other patterns (DP, intervals, binary search) to practice
         the "greedy vs DP" decision under pressure.
```

### What to Memorize vs Understand

```
MEMORIZE:
  ✓ The 4 templates (interval scheduling, jump/reach, task scheduler, two-pass)
  ✓ "Sort by END for maximizing non-overlapping / minimizing arrows"
  ✓ "Sort by START for merging intervals / event scheduling with heap"
  ✓ Integer.compare() instead of subtraction for comparators
  ✓ Task Scheduler formula: (maxFreq-1)*(n+1) + countMax

UNDERSTAND (derive each time, don't memorize):
  ✓ WHY sort-by-end works (exchange argument — earlier end is never worse)
  ✓ WHY Jump Game II is BFS-level greedy (each jump = one level expansion)
  ✓ WHY two passes are needed for Candy (each direction has independent constraint)
  ✓ WHY greedy fails for 0/1 Knapsack and arbitrary Coin Change (counterexamples)
  ✓ HOW to construct a counterexample to disprove a greedy strategy
```

### Signals That Indicate Mastery

```
□ You see "minimum number of intervals to remove" and IMMEDIATELY think
  "interval scheduling — sort by end, count non-overlapping, subtract" (< 5 seconds)
□ You can write the interval scheduling template from memory in under 2 minutes
□ You can explain the exchange argument for interval scheduling in 2 sentences
□ You can identify when greedy FAILS and switch to DP with a concrete counterexample
□ You can solve Jump Game II and explain the BFS-level insight without hesitation
□ You never use subtraction-based comparators for intervals (always Integer.compare)
□ You correctly distinguish > vs >= for touching intervals without checking notes
```

---

## Quick Reference Card

```
PATTERN              TEMPLATE                           TIME       SPACE
───────────────────────────────────────────────────────────────────────────
Interval scheduling  sort by END, pick non-overlapping   O(n log n) O(1)
Non-overlapping      sort by END, n - max compatible     O(n log n) O(1)
Min arrows           sort by END, shoot at end           O(n log n) O(1)
Jump reachability    track farthest, fail if i > far     O(n)       O(1)
Min jumps            BFS-level: curEnd + farthest        O(n)       O(1)
Gas station          total check + reset on negative     O(n)       O(1)
Partition labels     last[] + extend end, cut at i==end  O(n)       O(1)
Task scheduler       (maxF-1)*(n+1)+cntMax, cap w/ len   O(n)       O(1)
Two-pass (Candy)     L→R then R→L, take max              O(n)       O(n)
Events + heap        sort by start, min-heap on end      O(n log n) O(n)

SORT RULES:
  Maximize non-overlapping / min arrows → sort by END
  Merge intervals / event attendance    → sort by START
  Fractional knapsack / weighted        → sort by VALUE/WEIGHT ratio

DECISION:
  Greedy choice property holds + no revisiting → GREEDY
  Counterexample exists → DP
  Need all configurations → BACKTRACKING
```
