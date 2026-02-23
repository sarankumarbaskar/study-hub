# Greedy Algorithms

> Make locally optimal choices at each step—often yielding a globally optimal solution. When a problem has optimal substructure and the greedy choice property, a greedy strategy avoids exhaustive search.

## What Is This Pattern?

**Greedy algorithms** build a solution piece by piece by always choosing the **locally best** option at each step. Unlike dynamic programming, greedy does not reconsider past choices—once made, they stand. The pattern works when: (1) **Greedy choice property**: a locally optimal choice leads to a globally optimal solution; (2) **Optimal substructure**: an optimal solution contains optimal solutions to subproblems.

Classic applications: activity selection, Huffman coding, Dijkstra's shortest path, interval scheduling. The key is identifying the right **ordering** (sort by end time, by value/weight, etc.) and the right **local criterion** (take the next compatible item, use the best current option).

## When to Use This Pattern

- Problem asks for **maximum** or **minimum** of something (count, length, value).
- You can define a **local choice** that seems best at each step.
- The problem has **intervals**, **scheduling**, **allocation**, or **selection**.
- A **sorting** step followed by a single pass often suffices.
- Phrases like "minimum number of", "maximize", "assign", "schedule", "cover", "non-overlapping".

## How to Identify This Pattern

```
Can we make a local choice that doesn't invalidate the global optimum?
    NO → Consider DP or backtracking
    YES ↓

Do we need to reconsider past choices?
    YES → DP or backtracking
    NO ↓

Is there a natural ordering (sort by end, by value, etc.)?
    YES → GREEDY (sort + iterate)
```

## Core Template (Pseudocode)

### Generic Greedy

```
FUNCTION solve(input):
    SORT input by some criterion (end time, value/weight, etc.)
    result = 0
    prev = sentinel

    FOR each item in sorted_input:
        IF item is compatible with prev:
            result++
            prev = item

    RETURN result
```

### Greedy with Heap (when "best" changes dynamically)

```
FUNCTION solve(input):
    SORT or process input
    heap = min-heap or max-heap

    FOR each step:
        ADD available choices to heap
        PICK best from heap
        UPDATE result

    RETURN result
```

## Core Template (Java)

### Sort + Single Pass

```java
public int greedyInterval(int[][] intervals) {
    java.util.Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
    int count = 0;
    int prevEnd = Integer.MIN_VALUE;
    for (int[] iv : intervals) {
        if (iv[0] >= prevEnd) {
            count++;
            prevEnd = iv[1];
        }
    }
    return count;
}
```

### Greedy with Heap

```java
public int greedyWithHeap(int[] arr, int k) {
    var heap = new java.util.PriorityQueue<Integer>();
    for (int x : arr) {
        heap.offer(x);
        if (heap.size() > k) heap.poll();
    }
    return heap.peek();
}
```

## Complexity Cheat Sheet

| Technique              | Time       | Space  | Notes                          |
|------------------------|------------|--------|--------------------------------|
| Sort + single pass     | O(n log n) | O(1)   | Most interval/selection        |
| Greedy + heap         | O(n log k) | O(k)   | Top-K, scheduling              |
| Two pointers / scan    | O(n)       | O(1)   | When already sorted or linear  |
| Bucket/count sort      | O(n)       | O(k)   | Task Scheduler, limited range  |

## Problems (Progressive Difficulty)

### Easy (2 problems)

#### Problem: [Assign Cookies](https://leetcode.com/problems/assign-cookies/) (LeetCode #455)

- **Brute Force:** Try all permutations of cookie-to-child assignments; take max content children. Time O(n! · m), Space O(n).
- **Intuition:** Each child has greed factor g[i], each cookie has size s[j]. Child i is content if s[j] >= g[i]. One cookie per child. Maximize content children. Greedy: sort both, assign smallest sufficient cookie to each child.
- **Approach:** 1) Sort g and s ascending. 2) Two pointers: child i, cookie j. 3) If s[j] >= g[i], assign and increment both. 4) Else increment j. 5) Return count of assignments.
- **Java Solution:**

```java
class Solution {
    public int findContentChildren(int[] g, int[] s) {
        java.util.Arrays.sort(g);
        java.util.Arrays.sort(s);
        int i = 0, j = 0;
        while (i < g.length && j < s.length) {
            if (s[j] >= g[i]) i++;
            j++;
        }
        return i;
    }
}
```

- **Complexity:** Time O(n log n + m log m), Space O(log n + log m) for sort

---

#### Problem: [Lemonade Change](https://leetcode.com/problems/lemonade-change/) (LeetCode #860)

- **Brute Force:** When change can be given multiple ways (e.g. $20 as 3×$5 or $10+$5), backtrack over all choices. Time O(2^n), Space O(n).
- **Intuition:** Each customer pays $5, $10, or $20. Lemonade costs $5. We have no change initially. Can we give correct change? Greedy: prefer giving $10+$5 over 3×$5 when we have $10—saves $5 bills for later.
- **Approach:** 1) Track count of $5 and $10. 2) For $5: just take. 3) For $10: need one $5. 4) For $20: prefer $10+$5, else 3×$5. 5) Return false if change impossible.
- **Java Solution:**

```java
class Solution {
    public boolean lemonadeChange(int[] bills) {
        int five = 0, ten = 0;
        for (int b : bills) {
            if (b == 5) five++;
            else if (b == 10) {
                if (five == 0) return false;
                five--;
                ten++;
            } else {
                if (ten > 0 && five > 0) {
                    ten--;
                    five--;
                } else if (five >= 3) five -= 3;
                else return false;
            }
        }
        return true;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

### Medium (5 problems)

#### Problem: [Jump Game](https://leetcode.com/problems/jump-game/) (LeetCode #55)

- **Brute Force:** Recursively try jumping 1 to nums[i] steps from each index; reach end if any path succeeds. Time O(2^n), Space O(n).
- **Intuition:** nums[i] = max jump from i. Can you reach last index? Greedy: track the farthest we can reach. At each step, if i <= farthest, update farthest = max(farthest, i + nums[i]). Reach if farthest >= n-1.
- **Approach:** 1) farthest = 0. 2) For i from 0 to n-1: if i > farthest return false; farthest = max(farthest, i + nums[i]). 3) Return farthest >= n-1.
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

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Gas Station](https://leetcode.com/problems/gas-station/) (LeetCode #134)

- **Brute Force:** Try each station as start; simulate full circuit. Time O(n²), Space O(1).
- **Intuition:** Circular route. gas[i] = gas at station i, cost[i] = cost to next. Can we complete one lap? If total gas >= total cost, answer exists. Greedy: start from 0; when tank goes negative, restart from next station.
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

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Task Scheduler](https://leetcode.com/problems/task-scheduler/) (LeetCode #621)

- **Brute Force:** Try all permutations of tasks; check if each satisfies cooldown constraint; take min time. Time O(n!), Space O(n).
- **Intuition:** Tasks A–Z, cooldown n between same task. Minimize total time. Greedy: schedule most frequent task first in each "round", fill idle slots with others. Or: use formula—(maxFreq-1)*(n+1) + count(maxFreq), but cap at tasks.length.
- **Approach:** 1) Count freq of each task. 2) Find max freq and how many tasks have it. 3) slots = (maxFreq-1)*(n+1) + numWithMax. 4) Return max(slots, tasks.length).
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

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Partition Labels](https://leetcode.com/problems/partition-labels/) (LeetCode #763)

- **Brute Force:** Try all 2^(n-1) partition points; check each part has no letter appearing elsewhere; minimize count. Time O(2^n · n), Space O(n).
- **Intuition:** Partition string so each letter appears in at most one part. Minimize number of parts. Greedy: for each char, track last index. Scan: extend partition end to max(last[c]) for all c in current part; when i == end, cut.
- **Approach:** 1) last[char] = last index. 2) start=0, end=0. 3) For i: end = max(end, last[s[i]]). If i == end, add (end-start+1), start = i+1. 4) Return partition sizes.
- **Java Solution:**

```java
class Solution {
    public java.util.List<Integer> partitionLabels(String s) {
        int[] last = new int[26];
        for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;
        var result = new java.util.ArrayList<Integer>();
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

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Minimum Number of Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/) (LeetCode #452)

- **Brute Force:** Try each balloon's end as arrow position; count min arrows needed to cover all. Time O(n²), Space O(1).
- **Intuition:** Intervals represent balloons. One arrow can burst all balloons it touches (vertical line). Minimize arrows. Greedy: sort by end; shoot at first end, burst all overlapping; repeat. Same as non-overlapping intervals but we count arrows.
- **Approach:** 1) Sort points by end (points[i][1]). 2) arrows = 1, pos = points[0][1]. 3) For each point: if point[0] > pos, arrows++, pos = point[1]. 4) Return arrows.
- **Java Solution:**

```java
class Solution {
    public int findMinArrowShots(int[][] points) {
        if (points.length == 0) return 0;
        java.util.Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
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

- **Complexity:** Time O(n log n), Space O(log n)

---

### Hard (3 problems)

#### Problem: [Jump Game II](https://leetcode.com/problems/jump-game-ii/) (LeetCode #45)

- **Brute Force:** Recursively try all jump choices at each step; take minimum jumps to reach end. Time O(2^n), Space O(n).
- **Intuition:** Same as #55 but minimum jumps. Greedy BFS: at each step, we can jump to any index in [i, i+nums[i]]. Minimum jumps = minimum "levels" to reach end. Track current range and next range.
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

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Candy](https://leetcode.com/problems/candy/) (LeetCode #135)

- **Brute Force:** Repeatedly scan and increment candies at conflicts until no violations; sum. Time O(n²), Space O(n).
- **Intuition:** Each child gets at least 1 candy. Child with higher rating than neighbor gets more. Minimize total candies. Two passes: left-to-right (if ratings[i] > ratings[i-1] then candy[i] = candy[i-1]+1), right-to-left (symmetric).
- **Approach:** 1) candies[i]=1 for all. 2) Left pass: if ratings[i]>ratings[i-1], candies[i]=candies[i-1]+1. 3) Right pass: if ratings[i]>ratings[i+1], candies[i]=max(candies[i], candies[i+1]+1). 4) Sum candies.
- **Java Solution:**

```java
class Solution {
    public int candy(int[] ratings) {
        int n = ratings.length;
        int[] candies = new int[n];
        java.util.Arrays.fill(candies, 1);
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

- **Complexity:** Time O(n), Space O(n)

---

#### Problem: [IPO](https://leetcode.com/problems/ipo/) (LeetCode #502)

- **Brute Force:** Try all k-combinations of projects; simulate in order, take max final capital. Time O(C(n,k) · k), Space O(n).
- **Intuition:** Start with capital w. Each project has (profit, capital). Can only do project if capital >= capital[i]. After completing, capital += profit[i]. At most k projects. Maximize final capital. Greedy: sort by capital; use max-heap for all affordable projects, pick best profit.
- **Approach:** 1) Add (capital, profit) to list, sort by capital. 2) For k iterations: add all affordable projects to max-heap by profit. 3) Poll best; add profit to capital. 4) Return final capital.
- **Java Solution:**

```java
class Solution {
    public int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {
        int n = profits.length;
        int[][] projects = new int[n][2];
        for (int i = 0; i < n; i++) {
            projects[i][0] = capital[i];
            projects[i][1] = profits[i];
        }
        java.util.Arrays.sort(projects, (a, b) -> Integer.compare(a[0], b[0]));
        var heap = new java.util.PriorityQueue<Integer>((a, b) -> Integer.compare(b, a));
        int idx = 0;
        for (int i = 0; i < k; i++) {
            while (idx < n && projects[idx][0] <= w)
                heap.offer(projects[idx++][1]);
            if (heap.isEmpty()) break;
            w += heap.poll();
        }
        return w;
    }
}
```

- **Complexity:** Time O(n log n + k log n), Space O(n)

---

## Common Mistakes

- **Assign Cookies:** Assign smallest sufficient cookie (satisfy greediest you can with smallest cookie).
- **Lemonade Change:** Prefer giving $10+$5 for $20 to preserve $5 bills.
- **Jump Game:** Check i > farthest before using nums[i]; don't assume nums[0] > 0.
- **Gas Station:** If total gas < total cost, impossible. Restart from i+1 when tank goes negative.
- **Task Scheduler:** Formula works when we need idle slots; cap with tasks.length when no idle needed.
- **Partition Labels:** Extend end to include last index of all chars in current partition.
- **Min Arrows:** Sort by end, shoot at end of first balloon in each group.
- **Jump Game II:** Increment jump when we exhaust current level (i == curEnd).
- **Candy:** Need both passes—left handles left neighbor, right handles right neighbor.
- **IPO:** Sort by capital; heap by profit. Only add projects when capital increases.

## Pattern Variations

| Variation           | Example   | Key Technique                              |
|---------------------|-----------|--------------------------------------------|
| Two arrays          | #455      | Sort both, two pointers                    |
| Change making      | #860      | Greedy: use largest denomination first     |
| Reachability       | #55, #45  | Track farthest / BFS levels                 |
| Circular           | #134      | Total check + restart on negative tank      |
| Scheduling         | #621      | Most frequent first, idle slots             |
| Intervals           | #452, #763| Sort by end, single pass                    |
| Two-pass greedy    | #135      | Left then right pass                       |
| Heap + sort        | #502      | Sort by constraint, heap for best choice   |
