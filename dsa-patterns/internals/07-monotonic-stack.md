# Monotonic Stack

> Maintain a stack where elements are kept in strictly increasing or strictly decreasing order—enabling O(1) "next greater/lesser" lookups and O(n) scans over arrays.

## What Is This Pattern?

A **monotonic stack** is a stack that maintains elements in strictly monotonic order (either strictly increasing or strictly decreasing) as you process a sequence. When you push a new element, you pop from the stack until the monotonic property is restored. The key insight: elements that get "popped" have found their **answer**—the element that caused them to pop is their next greater (or lesser) element.

Think of it visually: imagine processing an array left-to-right. For a *decreasing* stack, you're building a "skyline" where each new building either fits under the previous ones (push) or "blocks the view" of shorter buildings to its left—those shorter ones pop and record *this* new element as their "next greater." The stack always reads top-to-bottom as: newest → oldest, with strictly decreasing values. For an *increasing* stack, the logic flips: you find "next smaller" elements.

The power comes from **amortized O(1)** per element: each element is pushed once and popped at most once, so total operations are O(n). This transforms "find next greater for every element" from O(n²) brute-force to O(n).

## When to Use This Pattern

- The problem asks for **next greater element**, **next smaller element**, **previous greater**, or **previous smaller** for each position.
- You need to find the **nearest** element satisfying a comparison (>, <, ≥, ≤) in one direction.
- The problem involves **histograms**, **rectangles**, **trapping water**, or **subarray min/max** contributions.
- You see phrases like "next greater", "daily temperature", "stock span", "subarray minimums", "remove k digits", "asteroid collision".
- Brute-force would scan right (or left) for each element—monotonic stack achieves O(n) in one pass.

## How to Identify This Pattern

```
Is the input a 1D array or sequence?
    NO → Consider other patterns (graph, tree, 2D DP)
    YES ↓

Does the problem ask for "next/previous greater/smaller" per element?
    YES → MONOTONIC STACK
    NO ↓

Are we computing something over ranges where min/max matters?
    (e.g., subarray min, rectangle area, trapped water)
    YES → Often MONOTONIC STACK (with left/right boundaries)
    NO → Consider sliding window, two pointers
```

## Core Template (Pseudocode) — Monotonic Decreasing and Monotonic Increasing Stack

### Monotonic Decreasing Stack (find next greater on right)

```
FUNCTION nextGreaterRight(arr):
    n = length(arr)
    result = array of size n, filled with -1  // default: no next greater
    stack = empty stack of indices

    FOR i FROM 0 TO n-1:
        WHILE stack not empty AND arr[stack.top()] < arr[i]:
            idx = stack.pop()
            result[idx] = arr[i]  // arr[i] is next greater for arr[idx]
        stack.push(i)

    RETURN result
```

### Monotonic Increasing Stack (find next smaller on right)

```
FUNCTION nextSmallerRight(arr):
    n = length(arr)
    result = array of size n, filled with n  // default: no next smaller (use n as sentinel)
    stack = empty stack of indices

    FOR i FROM 0 TO n-1:
        WHILE stack not empty AND arr[stack.top()] > arr[i]:
            idx = stack.pop()
            result[idx] = i  // i is index of next smaller for arr[idx]
        stack.push(i)

    RETURN result
```

## Core Template (Java)

### Monotonic Decreasing Stack (next greater)

```java
public int[] nextGreaterRight(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i]) {
            int idx = stack.pop();
            result[idx] = arr[i];
        }
        stack.push(i);
    }
    return result;
}
```

### Monotonic Increasing Stack (next smaller)

```java
public int[] nextSmallerRight(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, n);  // sentinel: no next smaller
    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] > arr[i]) {
            int idx = stack.pop();
            result[idx] = i;
        }
        stack.push(i);
    }
    return result;
}
```

## Complexity Cheat Sheet

| Operation | Time | Space | Notes |
|-----------|------|-------|-------|
| Single pass (next greater/smaller) | O(n) | O(n) | Each element pushed/popped at most once |
| Circular array (double pass) | O(n) | O(n) | Same logic, iterate 2n or use modulo |
| Left + right boundaries | O(n) | O(n) | Two passes: left boundaries, right boundaries |
| With index storage | O(n) | O(n) | Store indices for range width calculations |

## Problems (Progressive Difficulty)

### Easy (2 problems)

#### Problem: [Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/) (LeetCode #496)

- **Intuition:** `nums1` is a subset of `nums2`. For each element in `nums1`, find its next greater in `nums2`. Use a monotonic decreasing stack on `nums2` to compute next greater for every element, then map results to `nums1`.
- **Brute Force:** For each element in nums1, linearly scan nums2 to find it, then scan rightward until finding a greater element. Time O(n×m), Space O(1).
- **Approach:** 1) Build a map from value → next greater using a decreasing stack on `nums2`. 2) For each value in `nums1`, look up its next greater in the map. 3) Return the result array.
- **Java Solution:**

```java
class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {
        Map<Integer, Integer> nextGreater = new HashMap<>();
        Deque<Integer> stack = new ArrayDeque<>();

        for (int num : nums2) {
            while (!stack.isEmpty() && stack.peek() < num) {
                nextGreater.put(stack.pop(), num);
            }
            stack.push(num);
        }

        int[] result = new int[nums1.length];
        for (int i = 0; i < nums1.length; i++) {
            result[i] = nextGreater.getOrDefault(nums1[i], -1);
        }
        return result;
    }
}
```

- **Complexity:** Time O(n + m), Space O(n) where n = nums2.length, m = nums1.length

#### Problem: [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) (LeetCode #739)

- **Intuition:** For each day, find the number of days until a warmer temperature. A "next greater element" problem where we need the *index* of the next greater, not the value.
- **Brute Force:** For each day i, scan days i+1 to n-1 until finding a warmer day. Time O(n²), Space O(1).
- **Approach:** 1) Use a monotonically decreasing stack of indices. 2) When we find a warmer day (current > stack top), pop and set result[idx] = i - idx. 3) Push current index. 4) Any remaining in stack have no warmer day (default 0).
- **Java Solution:**

```java
class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] result = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();

        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
                int idx = stack.pop();
                result[idx] = i - idx;
            }
            stack.push(i);
        }
        return result;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

### Medium (5 problems)

#### Problem: [Next Greater Element II](https://leetcode.com/problems/next-greater-element-ii/) (LeetCode #503)

- **Intuition:** Same as next greater, but the array is circular. For the last elements, we may need to wrap around to the start. Simulate by iterating twice (or use modulo) so every element gets a chance to find its next greater.
- **Brute Force:** For each element, scan rightward (wrapping around if needed) until finding a greater element. Time O(n²), Space O(1).
- **Approach:** 1) Use a monotonically decreasing stack of indices. 2) Iterate i from 0 to 2*n - 1, using num = arr[i % n]. 3) When current > stack top, pop and set result[idx] = num. 4) Only push when i < n to avoid duplicate pushes.
- **Java Solution:**

```java
class Solution {
    public int[] nextGreaterElements(int[] nums) {
        int n = nums.length;
        int[] result = new int[n];
        Arrays.fill(result, -1);
        Deque<Integer> stack = new ArrayDeque<>();

        for (int i = 0; i < 2 * n; i++) {
            int num = nums[i % n];
            while (!stack.isEmpty() && nums[stack.peek()] < num) {
                result[stack.pop()] = num;
            }
            if (i < n) {
                stack.push(i);
            }
        }
        return result;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

#### Problem: [Online Stock Span](https://leetcode.com/problems/online-stock-span/) (LeetCode #901)

- **Intuition:** For each price, span = 1 + count of consecutive previous days with price ≤ today. This is "previous greater or equal" in reverse—we want the count of elements we "dominate" to the left.
- **Brute Force:** For each new price, scan backwards through previous prices counting consecutive days with price ≤ current. Time O(n²) amortized, Space O(1).
- **Approach:** 1) Use a monotonically decreasing stack storing (price, span). 2) When a larger price comes in, pop smaller prices and accumulate their spans. 3) Push (price, totalSpan). 4) Return totalSpan for each next(price).
- **Java Solution:**

```java
class StockSpanner {
    private Deque<int[]> stack;  // [price, span]

    public StockSpanner() {
        stack = new ArrayDeque<>();
    }

    public int next(int price) {
        int span = 1;
        while (!stack.isEmpty() && stack.peek()[0] <= price) {
            span += stack.pop()[1];
        }
        stack.push(new int[]{price, span});
        return span;
    }
}
```

- **Complexity:** Amortized O(1) per next(), Space O(n) worst case

#### Problem: [Sum of Subarray Minimums](https://leetcode.com/problems/sum-of-subarray-minimums/) (LeetCode #907)

- **Intuition:** For each element arr[i], count subarrays where it is the minimum. Assign each subarray to the leftmost minimum to avoid double-counting duplicates. Left extent = elements until previous ≤ arr[i]; right extent = elements until next < arr[i].
- **Brute Force:** Enumerate all O(n²) subarrays, compute the minimum of each in O(n). Time O(n³), Space O(1).
- **Approach:** 1) One left-to-right pass: pop when stack top > current (next smaller for popped); prevSmallerOrEqual[i] = stack.peek(). 2) For each i: left = i - prevSmallerOrEqual[i], right = nextSmaller[i] - i. 3) Sum += arr[i] * left * right, mod 10^9+7.
- **Java Solution:**

```java
class Solution {
    private static final int MOD = 1_000_000_007;

    public int sumSubarrayMins(int[] arr) {
        int n = arr.length;
        int[] prevSmallerOrEqual = new int[n];
        int[] nextSmaller = new int[n];
        Arrays.fill(prevSmallerOrEqual, -1);
        Arrays.fill(nextSmaller, n);

        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && arr[stack.peek()] > arr[i]) {
                nextSmaller[stack.pop()] = i;
            }
            prevSmallerOrEqual[i] = stack.isEmpty() ? -1 : stack.peek();
            stack.push(i);
        }

        long sum = 0;
        for (int i = 0; i < n; i++) {
            int left = i - prevSmallerOrEqual[i];
            int right = nextSmaller[i] - i;
            sum = (sum + (long) arr[i] * left * right) % MOD;
        }
        return (int) sum;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

#### Problem: [Remove K Digits](https://leetcode.com/problems/remove-k-digits/) (LeetCode #402)

- **Intuition:** To get the smallest number by removing k digits, we want to remove larger digits that appear before smaller ones (greedy). Use an increasing stack: when we see a digit smaller than the top, pop (remove) the larger one—as long as we have removals left.
- **Brute Force:** Try all C(n,k) combinations of k digits to remove and pick the smallest resulting number. Time O(C(n,k)), Space O(n).
- **Approach:** 1) Use a StringBuilder as stack. 2) For each digit: while we have k > 0 and stack not empty and stack top > current digit, pop and k--. 3) Push current (skip leading zeros by not pushing if stack is empty and digit is '0'). 4) After scan, if k > 0, remove from end. 5) Handle empty result (return "0").
- **Java Solution:**

```java
class Solution {
    public String removeKdigits(String num, int k) {
        if (num.length() <= k) return "0";

        StringBuilder stack = new StringBuilder();
        for (char c : num.toCharArray()) {
            while (k > 0 && stack.length() > 0 && stack.charAt(stack.length() - 1) > c) {
                stack.setLength(stack.length() - 1);
                k--;
            }
            if (stack.length() > 0 || c != '0') {
                stack.append(c);
            }
        }

        while (k-- > 0 && stack.length() > 0) {
            stack.setLength(stack.length() - 1);
        }

        return stack.length() == 0 ? "0" : stack.toString();
    }
}
```

- **Complexity:** Time O(n), Space O(n)

#### Problem: [Asteroid Collision](https://leetcode.com/problems/asteroid-collision/) (LeetCode #735)

- **Intuition:** Asteroids move in direction of sign. Opposing ones (positive right, negative left) collide. Smaller explodes; equal both explode. Use a stack to simulate: push positives; when negative appears, pop positives until one survives or stack empty.
- **Brute Force:** Repeatedly scan for adjacent (+, -) pairs and resolve collisions until no more collisions occur. Time O(n²) worst case, Space O(n).
- **Approach:** 1) For each asteroid: if positive, push. 2) If negative: while stack not empty and top > 0 and top < |current|, pop. 3) If stack empty or top < 0, push current. 4) If top == |current|, pop and skip (both explode). 5) Convert stack to result array.
- **Java Solution:**

```java
class Solution {
    public int[] asteroidCollision(int[] asteroids) {
        Deque<Integer> stack = new ArrayDeque<>();

        for (int a : asteroids) {
            if (a > 0) {
                stack.push(a);
            } else {
                while (!stack.isEmpty() && stack.peek() > 0 && stack.peek() < -a) {
                    stack.pop();
                }
                if (stack.isEmpty() || stack.peek() < 0) {
                    stack.push(a);
                } else if (stack.peek() == -a) {
                    stack.pop();
                }
            }
        }

        int[] result = new int[stack.size()];
        for (int i = result.length - 1; i >= 0; i--) {
            result[i] = stack.pop();
        }
        return result;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

### Hard (3 problems)

#### Problem: [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) (LeetCode #84)

- **Intuition:** For each bar, the largest rectangle with that bar as height extends from "previous smaller" to "next smaller" (exclusive). Width = (nextSmaller - prevSmaller - 1). Use monotonic increasing stack to find both boundaries in one pass.
- **Brute Force:** For each bar, expand left and right to find the first shorter bar on each side; compute area = height × width. Time O(n²), Space O(1).
- **Approach:** 1) Maintain an increasing stack of indices. 2) When we pop (because current bar is shorter), the popped bar's right boundary = current index, left boundary = new stack top (or -1). 3) Width = right - left - 1, area = height * width. 4) After loop, pop remaining with right = n.
- **Java Solution:**

```java
class Solution {
    public int largestRectangleArea(int[] heights) {
        int n = heights.length;
        Deque<Integer> stack = new ArrayDeque<>();
        int maxArea = 0;

        for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];
            while (!stack.isEmpty() && heights[stack.peek()] > h) {
                int idx = stack.pop();
                int width = stack.isEmpty() ? i : i - stack.peek() - 1;
                maxArea = Math.max(maxArea, heights[idx] * width);
            }
            stack.push(i);
        }
        return maxArea;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

#### Problem: [Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/) (LeetCode #85)

- **Intuition:** Treat each row as the base of a histogram: height[j] = consecutive 1's upward at column j. Then "Largest Rectangle in Histogram" per row. Use the same monotonic stack approach.
- **Brute Force:** Try every possible top-left and bottom-right rectangle, check if all cells are '1', track max area. Time O(rows² × cols² × rows×cols) = O(m³n³), Space O(1).
- **Approach:** 1) Build heights[] for each row (add 1 if matrix[i][j]=='1', else reset to 0). 2) For each row, compute max rectangle via histogram algorithm. 3) Return global max.
- **Java Solution:**

```java
class Solution {
    public int maximalRectangle(char[][] matrix) {
        if (matrix.length == 0 || matrix[0].length == 0) return 0;
        int rows = matrix.length, cols = matrix[0].length;
        int[] heights = new int[cols];
        int maxArea = 0;

        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                heights[j] = matrix[i][j] == '1' ? heights[j] + 1 : 0;
            }
            maxArea = Math.max(maxArea, largestRectangleArea(heights));
        }
        return maxArea;
    }

    private int largestRectangleArea(int[] heights) {
        int n = heights.length;
        Deque<Integer> stack = new ArrayDeque<>();
        int maxArea = 0;

        for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];
            while (!stack.isEmpty() && heights[stack.peek()] > h) {
                int idx = stack.pop();
                int width = stack.isEmpty() ? i : i - stack.peek() - 1;
                maxArea = Math.max(maxArea, heights[idx] * width);
            }
            stack.push(i);
        }
        return maxArea;
    }
}
```

- **Complexity:** Time O(rows × cols), Space O(cols)

#### Problem: [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/) (LeetCode #42)

- **Intuition:** Water at index i is trapped by the minimum of "max height to the left" and "max height to the right" minus height[i]. Monotonic stack approach: when we see a bar higher than stack top, the stack top is a "valley" between two higher bars—compute trapped water in that segment.
- **Brute Force:** For each index i, scan left for max height and right for max height; water += min(leftMax, rightMax) - height[i]. Time O(n²), Space O(1).
- **Approach:** 1) Use a decreasing stack of indices. 2) When current height > stack top, we have a "pit": pop to get the floor, then left boundary = new stack top, right = current. Water += (min(leftH, rightH) - floorH) * width. 3) Repeat until stack empty or top >= current. 4) Push current.
- **Java Solution:**

```java
class Solution {
    public int trap(int[] height) {
        Deque<Integer> stack = new ArrayDeque<>();
        int water = 0;

        for (int i = 0; i < height.length; i++) {
            while (!stack.isEmpty() && height[stack.peek()] < height[i]) {
                int floor = stack.pop();
                if (stack.isEmpty()) break;
                int left = stack.peek();
                int w = i - left - 1;
                int h = Math.min(height[left], height[i]) - height[floor];
                water += w * h;
            }
            stack.push(i);
        }
        return water;
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

## Common Mistakes & Edge Cases

| Mistake | How to Avoid |
|---------|---------------|
| **Strict vs non-strict comparison** | For "next greater": use `<` when popping. For "next smaller": use `>`. Using `<=`/`>=` changes behavior with duplicates—pick one convention (e.g., left boundary `>=`, right `>`) to avoid double-counting in "min in range" problems. |
| **Forgetting to handle remaining stack** | After the main loop, elements still in the stack have no next greater/smaller. Set their result to -1, n, or 0 as appropriate. |
| **Circular arrays** | Iterate 2× or use `i % n`. Only push indices when `i < n` to avoid duplicate entries. |
| **Index vs value** | Store indices when you need width/distance; store values when you only need the next greater value. |
| **Leading zeros** | In Remove K Digits, don't push '0' when the stack is empty (result would be "000"). |
| **Empty input** | Check `n == 0` before accessing `arr[0]`. Return 0 or "0" as required. |
| **Integer overflow** | In Sum of Subarray Minimums, use `long` for the sum and mod by 10^9+7. |
| **Asteroid collision** | Same sign asteroids never collide. Only + then - (left to right) collide. |

## Pattern Variations

| Variation | Description | Example |
|-----------|-------------|---------|
| **Next greater/smaller (one direction)** | Standard single pass | Next Greater Element I, Daily Temperatures |
| **Previous greater/smaller** | Process right-to-left, or use the fact that "next" from right-to-left = "previous" from left-to-right | Stock Span |
| **Circular / 2× pass** | Iterate 2n or modulo | Next Greater Element II |
| **Left + right boundaries** | Two stacks or two passes for prev and next smaller | Sum of Subarray Minimums, Largest Rectangle |
| **Monotonic deque** | When you need both ends (e.g., sliding window max/min) | Often combined with sliding window |
| **Greedy removal** | Increasing stack to keep smallest lexicographically | Remove K Digits |
| **Simulation / collision** | Stack to model "dominance" or collision | Asteroid Collision |
| **2D histogram** | Build heights per row and run histogram algorithm | Maximal Rectangle |
