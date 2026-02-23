# Interval Problems

> Model time ranges, meetings, or spans as [start, end] pairs. Sorting, merging, scanning, and sweep-line techniques handle overlap, coverage, and scheduling efficiently.

## What Is This Pattern?

**Interval problems** deal with ranges over a 1D line—meetings, bookings, balloons, etc. Represent each as `[start, end]`. Key operations: **merge** overlapping intervals, **count** non-overlapping, **insert** new intervals, **find** intersections or free time. Most solutions: (1) **Sort** by start or end; (2) **Scan** with a single pass, updating state (current end, count, etc.); (3) **Sweep line** for complex cases (start/end events).

Common techniques: sort by end for "max non-overlapping" (activity selection), sort by start for merging, use a min-heap for "minimum meeting rooms" (chronological ordering of start/end events).

## When to Use This Pattern

- Input is **ranges**, **intervals**, **meetings**, or **time slots**.
- You need to **merge**, **insert**, **remove overlaps**, or **count**.
- Problem asks for **free time**, **conflicts**, **rooms needed**, or **coverage**.
- Phrases like "overlapping", "merge intervals", "meeting rooms", "non-overlapping", "insert interval".

## How to Identify This Pattern

```
Is the input a set of [start, end] pairs (or equivalent)?
    NO → Consider other patterns
    YES ↓

Do we need to reason about overlap, coverage, or ordering?
    YES → INTERVAL PATTERN

Typical tasks: merge, insert, count non-overlapping, rooms, free time
```

## Core Template (Pseudocode)

### Merge Overlapping Intervals

```
FUNCTION merge(intervals):
    SORT intervals by start
    result = [intervals[0]]

    FOR i FROM 1 TO n-1:
        last = result.last
        IF intervals[i].start <= last.end:
            last.end = max(last.end, intervals[i].end)
        ELSE:
            result.append(intervals[i])

    RETURN result
```

### Max Non-Overlapping (Activity Selection)

```
FUNCTION maxNonOverlapping(intervals):
    SORT intervals by end
    count = 1
    prevEnd = intervals[0].end

    FOR i FROM 1 TO n-1:
        IF intervals[i].start >= prevEnd:
            count++
            prevEnd = intervals[i].end

    RETURN count
```

### Min Meeting Rooms (Sweep)

```
FUNCTION minRooms(intervals):
    events = [(start, +1), (end, -1) for each interval]
    SORT events by (time, then -1 before +1 so end before start)
    count = 0, maxCount = 0
    FOR (time, delta) in events:
        count += delta
        maxCount = max(maxCount, count)
    RETURN maxCount
```

## Core Template (Java)

### Merge Overlapping

```java
public int[][] merge(int[][] intervals) {
    if (intervals.length == 0) return new int[0][2];
    java.util.Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    var result = new java.util.ArrayList<int[]>();
    result.add(intervals[0]);
    for (int i = 1; i < intervals.length; i++) {
        int[] last = result.get(result.size() - 1);
        if (intervals[i][0] <= last[1])
            last[1] = Math.max(last[1], intervals[i][1]);
        else
            result.add(intervals[i]);
    }
    return result.toArray(new int[0][]);
}
```

### Min Meeting Rooms (Sweep Line)

```java
public int minMeetingRooms(int[][] intervals) {
    int n = intervals.length;
    int[] starts = new int[n], ends = new int[n];
    for (int i = 0; i < n; i++) {
        starts[i] = intervals[i][0];
        ends[i] = intervals[i][1];
    }
    java.util.Arrays.sort(starts);
    java.util.Arrays.sort(ends);
    int rooms = 0, maxRooms = 0, s = 0, e = 0;
    while (s < n) {
        if (starts[s] < ends[e]) {
            rooms++;
            s++;
            maxRooms = Math.max(maxRooms, rooms);
        } else {
            rooms--;
            e++;
        }
    }
    return maxRooms;
}
```

## Complexity Cheat Sheet

| Operation              | Time       | Space  | Notes                       |
|------------------------|------------|--------|-----------------------------|
| Merge intervals        | O(n log n) | O(n)   | Sort by start               |
| Insert interval        | O(n)       | O(n)   | Or O(log n) with TreeMap    |
| Non-overlapping count   | O(n log n) | O(1)   | Sort by end                 |
| Min rooms (sweep)       | O(n log n) | O(n)   | Sort starts and ends        |
| Interval intersections | O(n + m)   | O(1)   | Two pointers if sorted      |

## Problems (Progressive Difficulty)

### Easy (2 problems)

#### Problem: [Meeting Rooms](https://leetcode.com/problems/meeting-rooms/) (LeetCode #252)

- **Intuition:** Can one person attend all meetings? No overlap between any two. Sort by start; check intervals[i].start >= intervals[i-1].end.
- **Brute Force:** Compare every pair of intervals for overlap. Time O(n²), Space O(1).
- **Approach:** 1) Sort by start. 2) For i from 1 to n-1: if intervals[i][0] < intervals[i-1][1] return false. 3) Return true.
- **Java Solution:**

```java
class Solution {
    public boolean canAttendMeetings(int[][] intervals) {
        java.util.Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        for (int i = 1; i < intervals.length; i++)
            if (intervals[i][0] < intervals[i - 1][1])
                return false;
        return true;
    }
}
```

- **Complexity:** Time O(n log n), Space O(log n)

---

#### Problem: [Merge Intervals](https://leetcode.com/problems/merge-intervals/) (LeetCode #56)

- **Intuition:** Merge all overlapping intervals. Sort by start; if current overlaps with last merged, extend last; else add new.
- **Brute Force:** For each interval, check all others for overlap and merge repeatedly until no changes. Time O(n²), Space O(n).
- **Approach:** 1) Sort by start. 2) result = [intervals[0]]. 3) For each: if overlap with last, merge; else add. 4) Return result.
- **Java Solution:**

```java
class Solution {
    public int[][] merge(int[][] intervals) {
        if (intervals.length == 0) return new int[0][2];
        java.util.Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        var result = new java.util.ArrayList<int[]>();
        result.add(intervals[0]);
        for (int i = 1; i < intervals.length; i++) {
            int[] last = result.get(result.size() - 1);
            if (intervals[i][0] <= last[1])
                last[1] = Math.max(last[1], intervals[i][1]);
            else
                result.add(intervals[i]);
        }
        return result.toArray(new int[0][]);
    }
}
```

- **Complexity:** Time O(n log n), Space O(n)

---

### Medium (5 problems)

#### Problem: [Insert Interval](https://leetcode.com/problems/insert-interval/) (LeetCode #57)

- **Intuition:** Non-overlapping intervals sorted by start. Insert newInterval and merge. Add all ending before newInterval, merge overlapping, add rest.
- **Brute Force:** Append newInterval to the list, sort by start, then merge all intervals in one pass. Time O(n log n), Space O(n).
- **Approach:** 1) Add intervals ending before newInterval.start. 2) Merge newInterval with all that overlap (start <= newInterval.end). 3) Add remaining. 4) Return.
- **Java Solution:**

```java
class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        var result = new java.util.ArrayList<int[]>();
        int i = 0, n = intervals.length;
        while (i < n && intervals[i][1] < newInterval[0])
            result.add(intervals[i++]);
        while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
            newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
            i++;
        }
        result.add(newInterval);
        while (i < n) result.add(intervals[i++]);
        return result.toArray(new int[0][]);
    }
}
```

- **Complexity:** Time O(n), Space O(n)

---

#### Problem: [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/) (LeetCode #435)

- **Intuition:** Minimum intervals to remove so rest are non-overlapping. Equivalent to max non-overlapping we can keep. Sort by end; greedily keep non-overlapping.
- **Brute Force:** Try all subsets of intervals, find the largest non-overlapping subset; return n - its size. Time O(2ⁿ), Space O(n).
- **Approach:** 1) Sort by end. 2) keep = 1, prevEnd = intervals[0][1]. 3) For each: if start >= prevEnd, keep++, prevEnd = end. 4) Return n - keep.
- **Java Solution:**

```java
class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        if (intervals.length == 0) return 0;
        java.util.Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
        int keep = 1, prevEnd = intervals[0][1];
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] >= prevEnd) {
                keep++;
                prevEnd = intervals[i][1];
            }
        }
        return intervals.length - keep;
    }
}
```

- **Complexity:** Time O(n log n), Space O(log n)

---

#### Problem: [Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/) (LeetCode #253)

- **Intuition:** Minimum rooms so all meetings can be held. Sweep line: sort starts and ends; when a meeting starts before one ends, need new room.
- **Brute Force:** For each interval, count how many others overlap with it; max overlap equals rooms needed. Time O(n²), Space O(1).
- **Approach:** 1) Extract and sort starts and ends. 2) Two pointers: when starts[s] < ends[e], rooms++; else rooms--, e++. 3) Track max rooms.
- **Java Solution:**

```java
class Solution {
    public int minMeetingRooms(int[][] intervals) {
        int n = intervals.length;
        int[] starts = new int[n], ends = new int[n];
        for (int i = 0; i < n; i++) {
            starts[i] = intervals[i][0];
            ends[i] = intervals[i][1];
        }
        java.util.Arrays.sort(starts);
        java.util.Arrays.sort(ends);
        int rooms = 0, maxRooms = 0, s = 0, e = 0;
        while (s < n) {
            if (starts[s] < ends[e]) {
                rooms++;
                s++;
                maxRooms = Math.max(maxRooms, rooms);
            } else {
                rooms--;
                e++;
            }
        }
        return maxRooms;
    }
}
```

- **Complexity:** Time O(n log n), Space O(n)

---

#### Problem: [Minimum Number of Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/) (LeetCode #452)

- **Intuition:** Intervals = balloons. One vertical arrow bursts all it touches. Min arrows. Greedy: sort by end; shoot at first end; skip overlapping; repeat.
- **Brute Force:** Sort by end, then repeatedly pick the leftmost unburst balloon, shoot at its end, remove all burst balloons; repeat. Time O(n²), Space O(n).
- **Approach:** 1) Sort by end. 2) arrows = 1, pos = points[0][1]. 3) For each: if start > pos, arrows++, pos = end. 4) Return arrows.
- **Java Solution:**

```java
class Solution {
    public int findMinArrowShots(int[][] points) {
        if (points.length == 0) return 0;
        java.util.Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
        int arrows = 1, pos = points[0][1];
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

#### Problem: [Interval List Intersections](https://leetcode.com/problems/interval-list-intersections/) (LeetCode #986)

- **Intuition:** Two lists of disjoint intervals sorted by start. Find all intersections. Two pointers: intersect [max(a.start,b.start), min(a.end,b.end)] if max <= min.
- **Brute Force:** For each pair (A[i], B[j]), compute intersection if overlapping and add to result. Time O(n·m), Space O(1) excluding output.
- **Approach:** 1) i=0, j=0. 2) While both in range: lo = max(A[i][0], B[j][0]), hi = min(A[i][1], B[j][1]). If lo<=hi, add [lo,hi]. 3) Advance pointer of interval with smaller end.
- **Java Solution:**

```java
class Solution {
    public int[][] intervalIntersection(int[][] firstList, int[][] secondList) {
        var result = new java.util.ArrayList<int[]>();
        int i = 0, j = 0;
        while (i < firstList.length && j < secondList.length) {
            int lo = Math.max(firstList[i][0], secondList[j][0]);
            int hi = Math.min(firstList[i][1], secondList[j][1]);
            if (lo <= hi) result.add(new int[]{lo, hi});
            if (firstList[i][1] < secondList[j][1]) i++;
            else j++;
        }
        return result.toArray(new int[0][]);
    }
}
```

- **Complexity:** Time O(n + m), Space O(1) excluding output

---

### Hard (2 problems)

#### Problem: [Employee Free Time](https://leetcode.com/problems/employee-free-time/) (LeetCode #759)

- **Intuition:** Each employee has sorted list of busy intervals. Find free time common to all. Merge all intervals, then gaps between merged intervals are free time.
- **Brute Force:** Flatten and sort all intervals, merge overlapping, then output gaps between consecutive merged intervals. Time O(n log n), Space O(n).
- **Approach:** 1) Flatten all intervals, sort by start. 2) Merge overlapping. 3) Gaps between consecutive merged intervals (merged[i][1] to merged[i+1][0]) are free time.
- **Java Solution:**

```java
/*
// Definition for an Interval.
class Interval {
    public int start;
    public int end;
    public Interval() {}
    public Interval(int _start, int _end) {
        start = _start;
        end = _end;
    }
}
*/

class Solution {
    public java.util.List<Interval> employeeFreeTime(java.util.List<java.util.List<Interval>> schedule) {
        var all = new java.util.ArrayList<Interval>();
        for (var list : schedule) all.addAll(list);
        all.sort((a, b) -> Integer.compare(a.start, b.start));
        var merged = new java.util.ArrayList<Interval>();
        merged.add(all.get(0));
        for (int i = 1; i < all.size(); i++) {
            Interval last = merged.get(merged.size() - 1);
            Interval cur = all.get(i);
            if (cur.start <= last.end)
                last.end = Math.max(last.end, cur.end);
            else
                merged.add(cur);
        }
        var free = new java.util.ArrayList<Interval>();
        for (int i = 1; i < merged.size(); i++)
            free.add(new Interval(merged.get(i - 1).end, merged.get(i).start));
        return free;
    }
}
```

- **Complexity:** Time O(n log n), Space O(n)

---

#### Problem: [Data Stream as Disjoint Intervals](https://leetcode.com/problems/data-stream-as-disjoint-intervals/) (LeetCode #352)

- **Intuition:** Numbers added one by one. getIntervals() returns sorted list of disjoint intervals covering all numbers so far. Use TreeMap: key = start, value = end. When adding val: find邻居, merge if adjacent.
- **Brute Force:** Store all added numbers in a set; on getIntervals(), sort and merge into intervals. Time O(k log k) per getIntervals where k = count, Space O(k).
- **Approach:** 1) TreeMap<Integer,Integer> for [start, end]. 2) addNum: find floor and ceiling of val. Merge with left if val <= leftEnd+1, with right if val >= rightStart-1. Handle both neighbors. 3) getIntervals: convert to list.
- **Java Solution:**

```java
class SummaryRanges {
    private final java.util.TreeMap<Integer, Integer> intervals = new java.util.TreeMap<>();

    public void addNum(int val) {
        Integer left = intervals.floorKey(val);
        Integer right = intervals.ceilingKey(val);
        if (left != null && val <= intervals.get(left)) return;
        boolean mergeLeft = left != null && intervals.get(left) == val - 1;
        boolean mergeRight = right != null && right == val + 1;
        if (mergeLeft && mergeRight) {
            intervals.put(left, intervals.get(right));
            intervals.remove(right);
        } else if (mergeLeft) {
            intervals.put(left, val);
        } else if (mergeRight) {
            intervals.put(val, intervals.get(right));
            intervals.remove(right);
        } else {
            intervals.put(val, val);
        }
    }

    public int[][] getIntervals() {
        return intervals.entrySet().stream()
            .map(e -> new int[]{e.getKey(), e.getValue()})
            .toArray(int[][]::new);
    }
}
```

- **Complexity:** addNum O(log n), getIntervals O(n); Space O(n)

---

## Common Mistakes

- **Meeting Rooms:** Check overlap: intervals[i][0] < intervals[i-1][1].
- **Merge Intervals:** Sort by start; overlap when curr.start <= last.end.
- **Insert Interval:** Handle empty list; merge all overlapping with newInterval.
- **Non-overlapping:** Sort by end for greedy; count kept, return n - kept.
- **Meeting Rooms II:** Sweep: starts[s] < ends[e] means new meeting starts before one ends.
- **Interval Intersections:** Advance the interval with smaller end.
- **Employee Free Time:** Merge all first; sort comparator should use start.
- **Summary Ranges:** Handle merge of three intervals when val connects left and right.

## Pattern Variations

| Variation           | Example   | Key Technique                          |
|---------------------|-----------|----------------------------------------|
| No overlap check    | #252      | Sort, compare consecutive              |
| Merge               | #56, #57  | Sort by start, extend last             |
| Max keep/erase      | #435      | Sort by end, greedy keep                |
| Min resources       | #253      | Sweep: starts + ends sorted             |
| Min arrows          | #452      | Sort by end, shoot at end               |
| Two lists           | #986      | Two pointers, advance smaller end      |
| Free time           | #759      | Merge all, gaps = free                  |
| Streaming           | #352      | TreeMap for O(log n) insert/merge       |
