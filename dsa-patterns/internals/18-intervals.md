# Intervals — Interview Execution Playbook

> Sort by start, scan left-to-right, merge or track overlaps. Every interval problem reduces to: "after sorting, how do adjacent ranges relate?"

---

## 1. Pattern Recognition Signals

**You're looking at an intervals problem when you see:**

| Signal | Example Phrasing |
|--------|------------------|
| Overlapping ranges | "merge overlapping intervals", "find all intersections" |
| Schedule / calendar conflicts | "can a person attend all meetings", "minimum rooms needed" |
| Insert or remove from sorted ranges | "insert a new interval into non-overlapping list" |
| The word "intervals" in the problem | "given a list of intervals...", "interval list intersections" |
| Free time / gaps | "find common free time across schedules" |
| Coverage or containment | "remove covered intervals", "minimum arrows to burst balloons" |

**Data shape giveaway:** Input is `int[][]` where each element is `[start, end]`. If you see a list of pairs representing ranges on a number line or timeline, this is the pattern.

**Contrast with other patterns:**
- If ranges represent indices into an array and you process elements within → likely **sliding window**
- If you need optimal substructure across ranges → likely **DP on intervals**
- If pairs represent graph edges → likely **graph** problem

---

## 2. Thinking Framework

When you see an intervals problem in an interview, execute this mental pipeline:

### Step 1: Sort

Almost every interval problem starts with sorting. The sort key depends on the goal:

| Goal | Sort By | Why |
|------|---------|-----|
| Merge overlapping | **start** | Process left-to-right, extend the running interval |
| Max non-overlapping / min removals | **end** | Greedy: pick the interval that finishes earliest, leaving maximum room |
| Min rooms / max concurrent | **start** (or sweep events) | Track what's active at each point in time |
| Intersections of two lists | Already sorted (given) | Two-pointer merge |

### Step 2: Process Linearly

After sorting, a single left-to-right pass handles most problems. At each step, compare the current interval with the "active" state:

```
For each interval curr (after sorting):
    Compare curr.start with previous.end
    
    If curr.start <= prev.end → OVERLAP detected
        Action depends on problem: merge, count, skip
    
    If curr.start > prev.end → NO OVERLAP
        Action depends on problem: add gap, start new group, advance pointer
```

### Step 3: Merge, Count, or Track Overlaps

The action in the overlap/no-overlap branch defines the sub-pattern:

| Sub-pattern | On Overlap | On No Overlap |
|-------------|-----------|---------------|
| **Merge** | Extend end: `end = max(end, curr.end)` | Push current as new interval |
| **Count non-overlapping** | Skip (count removal) | Keep (update prevEnd) |
| **Min rooms (heap)** | Push curr end to heap | Pop expired from heap, push curr |
| **Intersection** | Output `[max(starts), min(ends)]` | Advance the pointer with smaller end |

### The Three Core Formulas

```
Overlap detection:     b.start <= a.end        (after sorting by start)
Merge:                 a.end = max(a.end, b.end)
Meeting rooms:         heap.size() = number of concurrent intervals at any point
```

---

## 3. Java Templates

### Template 1: Merge Intervals

The foundational template. Sort by start, walk through, extend or create new.

```java
public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    List<int[]> res = new ArrayList<>();
    res.add(intervals[0]);
    for (int i = 1; i < intervals.length; i++) {
        int[] last = res.get(res.size() - 1);
        if (intervals[i][0] <= last[1])
            last[1] = Math.max(last[1], intervals[i][1]);
        else
            res.add(intervals[i]);
    }
    return res.toArray(new int[0][]);
}
```

**When to use:** Any problem that says "merge", "combine", or "union" of intervals.

### Template 2: Insert Interval

Three-phase pass: add all before, merge overlapping, add all after.

```java
public int[][] insert(int[][] intervals, int[] newInterval) {
    List<int[]> res = new ArrayList<>();
    int i = 0, n = intervals.length;

    while (i < n && intervals[i][1] < newInterval[0])
        res.add(intervals[i++]);

    while (i < n && intervals[i][0] <= newInterval[1]) {
        newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
        newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
        i++;
    }
    res.add(newInterval);

    while (i < n)
        res.add(intervals[i++]);
    return res.toArray(new int[0][]);
}
```

**When to use:** Input is already sorted and non-overlapping; you must insert one new interval.

### Template 3: Non-overlapping Count (Activity Selection)

Sort by **end**. Greedily keep intervals that start after or at the previous end.

```java
public int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
    int keep = 1, prevEnd = intervals[0][1];
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] >= prevEnd) {
            keep++;
            prevEnd = intervals[i][1];
        }
    }
    return intervals.length - keep;
}
```

**When to use:** "Minimum removals for non-overlapping", "maximum non-overlapping intervals", "minimum arrows".

### Template 4: Meeting Rooms II (Min-Heap of End Times)

Each heap entry is the end time of an active meeting. Heap size = rooms in use.

```java
public int minMeetingRooms(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (int[] iv : intervals) {
        if (!heap.isEmpty() && heap.peek() <= iv[0])
            heap.poll();
        heap.offer(iv[1]);
        // heap.size() = rooms currently needed
    }
    return heap.size();
}
```

**Why min-heap works:** The heap holds end times of all active meetings. Before adding a new meeting, check if the earliest-ending meeting finishes before this one starts. If yes, that room is freed (poll). Either way, push the new meeting's end. The max heap size seen = answer.

**Alternate approach — sweep line with two sorted arrays:**

```java
public int minMeetingRooms(int[][] intervals) {
    int n = intervals.length;
    int[] starts = new int[n], ends = new int[n];
    for (int i = 0; i < n; i++) {
        starts[i] = intervals[i][0];
        ends[i] = intervals[i][1];
    }
    Arrays.sort(starts);
    Arrays.sort(ends);
    int rooms = 0, maxRooms = 0, s = 0, e = 0;
    while (s < n) {
        if (starts[s] < ends[e]) { rooms++; s++; maxRooms = Math.max(maxRooms, rooms); }
        else                     { rooms--; e++; }
    }
    return maxRooms;
}
```

Both approaches are O(n log n). The heap version is more intuitive for interviews; the sweep line version uses less space conceptually.

### Template 5: Interval List Intersections (Two Pointers)

Both lists are sorted and disjoint. Walk through with two pointers.

```java
public int[][] intervalIntersection(int[][] A, int[][] B) {
    List<int[]> res = new ArrayList<>();
    int i = 0, j = 0;
    while (i < A.length && j < B.length) {
        int lo = Math.max(A[i][0], B[j][0]);
        int hi = Math.min(A[i][1], B[j][1]);
        if (lo <= hi)
            res.add(new int[]{lo, hi});
        if (A[i][1] < B[j][1]) i++;
        else j++;
    }
    return res.toArray(new int[0][]);
}
```

**Key insight:** Intersection of `[a1, a2]` and `[b1, b2]` is `[max(a1,b1), min(a2,b2)]` — valid only when `max(starts) <= min(ends)`. Advance the pointer whose interval ends first because that interval can't intersect with anything else.

---

## 4. Edge Cases

| Edge Case | Why It Matters | How to Handle |
|-----------|---------------|---------------|
| Empty input | `intervals.length == 0` | Return empty array; check before accessing `intervals[0]` |
| Single interval | Nothing to merge/compare | Usually returned as-is; ensure loop bounds are safe |
| All intervals identical | `[[1,3],[1,3],[1,3]]` | Merge collapses to single `[1,3]`; rooms needed = n |
| Touching boundaries | `[1,2],[2,3]` — overlap or not? | **Problem-dependent.** Merge Intervals: `<=` means touching = overlap. Meeting Rooms: if `[0,30],[30,40]` the second starts exactly when first ends — usually NOT a conflict |
| Intervals already sorted | Insert Interval gives sorted input | Skip the sort; recognize the O(n) opportunity |
| Interval fully contains another | `[1,10]` contains `[2,3]` | Merge: `max(end)` handles it. Covered intervals: this is the removal target |
| Very large coordinates | `start = -10^9, end = 10^9` | Use `Integer.compare()` not subtraction (overflow risk with `a[0] - b[0]`) |
| newInterval doesn't overlap anything | Insert at beginning or end of list | The three-phase insert template handles this naturally |

---

## 5. Problem Progression

### Level 1: Foundation

#### LC 56 — Merge Intervals

- **Core idea:** Sort by start. Walk through; if `curr.start <= last.end`, extend `last.end = max(last.end, curr.end)`. Otherwise push new interval.
- **Brute force:** Compare all pairs O(n²) and merge repeatedly until stable.
- **Approach:** Sort by start → single merge pass.

```java
class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> res = new ArrayList<>();
        res.add(intervals[0]);
        for (int i = 1; i < intervals.length; i++) {
            int[] last = res.get(res.size() - 1);
            if (intervals[i][0] <= last[1])
                last[1] = Math.max(last[1], intervals[i][1]);
            else
                res.add(intervals[i]);
        }
        return res.toArray(new int[0][]);
    }
}
```

- **Complexity:** Time O(n log n) sort + O(n) scan. Space O(n) for result.

---

#### LC 57 — Insert Interval

- **Core idea:** Input is already sorted and non-overlapping. Three phases: (1) add all intervals ending before newInterval, (2) merge all that overlap with newInterval, (3) add remaining.
- **Brute force:** Append newInterval, sort, merge. O(n log n).
- **Approach:** Linear scan in three phases → O(n).

```java
class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        List<int[]> res = new ArrayList<>();
        int i = 0, n = intervals.length;
        while (i < n && intervals[i][1] < newInterval[0])
            res.add(intervals[i++]);
        while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
            newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
            i++;
        }
        res.add(newInterval);
        while (i < n) res.add(intervals[i++]);
        return res.toArray(new int[0][]);
    }
}
```

- **Complexity:** Time O(n) single pass. Space O(n) for result.

---

### Level 2: Overlap Detection & Counting

#### LC 252 — Meeting Rooms

- **Core idea:** Can one person attend all meetings? Sort by start; any adjacent overlap means "no".
- **Approach:** Sort by start. For each consecutive pair, check `intervals[i][0] < intervals[i-1][1]`.

```java
class Solution {
    public boolean canAttendMeetings(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        for (int i = 1; i < intervals.length; i++)
            if (intervals[i][0] < intervals[i - 1][1])
                return false;
        return true;
    }
}
```

- **Complexity:** Time O(n log n). Space O(log n) sort stack.

---

#### LC 253 — Meeting Rooms II

- **Core idea:** Minimum concurrent rooms = maximum overlap at any point. Use a min-heap of end times: for each meeting (sorted by start), free the earliest-ending room if possible, then allocate.
- **Brute force:** For each interval, count overlaps with all others. O(n²).
- **Approach:** Min-heap of end times.

```java
class Solution {
    public int minMeetingRooms(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int[] iv : intervals) {
            if (!heap.isEmpty() && heap.peek() <= iv[0])
                heap.poll();
            heap.offer(iv[1]);
        }
        return heap.size();
    }
}
```

- **Complexity:** Time O(n log n). Space O(n) for heap.
- **Why heap.peek() <= iv[0]:** If the earliest ending meeting ends at or before the current meeting starts, that room is available. Using `<=` means `[0,30]` and `[30,40]` can share a room (meeting ends exactly when next starts).

---

#### LC 435 — Non-overlapping Intervals

- **Core idea:** Minimum intervals to remove = n - (max non-overlapping you can keep). Sort by **end** (activity selection greedy). Keep an interval if `start >= prevEnd`.
- **Why sort by end?** Choosing the interval that finishes earliest maximizes remaining space — classic greedy proof by exchange argument.

```java
class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
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

- **Complexity:** Time O(n log n). Space O(log n).

---

### Level 3: Two-Pointer & Multi-List

#### LC 986 — Interval List Intersections

- **Core idea:** Two sorted disjoint lists. Two pointers. Intersection = `[max(starts), min(ends)]` when valid. Advance the pointer whose interval ends first.
- **Approach:** No sorting needed (given sorted). O(n + m) two-pointer merge.

```java
class Solution {
    public int[][] intervalIntersection(int[][] firstList, int[][] secondList) {
        List<int[]> res = new ArrayList<>();
        int i = 0, j = 0;
        while (i < firstList.length && j < secondList.length) {
            int lo = Math.max(firstList[i][0], secondList[j][0]);
            int hi = Math.min(firstList[i][1], secondList[j][1]);
            if (lo <= hi) res.add(new int[]{lo, hi});
            if (firstList[i][1] < secondList[j][1]) i++;
            else j++;
        }
        return res.toArray(new int[0][]);
    }
}
```

- **Complexity:** Time O(n + m). Space O(1) excluding output.

---

#### LC 1288 — Remove Covered Intervals

- **Core idea:** Interval `[a,b]` is covered by `[c,d]` if `c <= a` and `b <= d`. Sort by start ascending, then by end **descending** (so among same-start intervals, the widest comes first). Track the running max end; any interval with `end <= maxEnd` is covered.
- **Why sort end descending for same start?** If `[1,4]` and `[1,2]` have same start, we want `[1,4]` first so `[1,2]` is correctly identified as covered.

```java
class Solution {
    public int removeCoveredIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) ->
            a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(b[1], a[1]));
        int count = 0, maxEnd = 0;
        for (int[] iv : intervals) {
            if (iv[1] > maxEnd) {
                count++;
                maxEnd = iv[1];
            }
        }
        return count;
    }
}
```

- **Complexity:** Time O(n log n). Space O(log n).

---

### Level 4: Advanced

#### LC 759 — Employee Free Time

- **Core idea:** Multiple employees each have sorted busy intervals. Find gaps common to all. Flatten all intervals → sort by start → merge → gaps between merged intervals = free time.
- **Approach:** Merge all intervals from all employees, then extract gaps.

```java
class Solution {
    public List<Interval> employeeFreeTime(List<List<Interval>> schedule) {
        List<Interval> all = new ArrayList<>();
        for (List<Interval> emp : schedule)
            all.addAll(emp);
        all.sort((a, b) -> Integer.compare(a.start, b.start));

        List<Interval> merged = new ArrayList<>();
        merged.add(all.get(0));
        for (int i = 1; i < all.size(); i++) {
            Interval last = merged.get(merged.size() - 1);
            Interval cur = all.get(i);
            if (cur.start <= last.end)
                last.end = Math.max(last.end, cur.end);
            else
                merged.add(cur);
        }

        List<Interval> free = new ArrayList<>();
        for (int i = 1; i < merged.size(); i++)
            free.add(new Interval(merged.get(i - 1).end, merged.get(i).start));
        return free;
    }
}
```

- **Complexity:** Time O(n log n) where n = total intervals across all employees. Space O(n).
- **Heap alternative:** Use a min-heap with one interval per employee (k-way merge). Same time complexity but avoids flattening. Overkill for interviews unless asked.

---

## 6. Common Mistakes

### Mistake 1: Not Sorting (or Sorting by Wrong Key)

```
❌ Trying to merge intervals without sorting first
❌ Sorting by start when doing activity selection (need sort by end)
❌ Sorting by end when merging (need sort by start)
```

**Rule of thumb:** Merge → sort by start. Max non-overlapping → sort by end. Meeting rooms → sort by start.

### Mistake 2: Wrong Merge/Overlap Condition

```
❌ Using < instead of <= for overlap detection
   [1,5] and [5,8]: these DO overlap for merge purposes (touching = overlapping)
   
❌ Using a.start < b.end instead of b.start <= a.end
   Overlap check is always: does the NEXT interval's start fall within the PREVIOUS interval's range?

✅ Overlap (merge):     curr.start <= last.end
✅ Overlap (conflict):  curr.start < last.end  (strict, for meeting rooms)
```

**Note the subtlety:** "Touching at boundary" (`[1,5],[5,8]`) counts as overlapping for merge but often NOT a conflict for meetings. Read the problem statement carefully.

### Mistake 3: Off-by-One on Boundaries

```
❌ heap.peek() < iv[0]  →  should be heap.peek() <= iv[0] for meeting rooms
   If a meeting ends at 10 and next starts at 10, same room works.

❌ Forgetting to handle the case where newInterval goes at the very end or very start

❌ Using intervals[i][0] - intervals[j][0] for comparator
   Integer overflow if values are near Integer.MIN_VALUE / MAX_VALUE.
   Always use Integer.compare(a[0], b[0]).
```

### Mistake 4: Forgetting to Update State After Merge

```
❌ Merging but not updating the end:
   last[1] = intervals[i][1]         // WRONG: might shrink the interval
   last[1] = Math.max(last[1], intervals[i][1])  // CORRECT: always extend
```

### Mistake 5: Activity Selection — Returning Wrong Value

```
❌ Returning the count of intervals kept (that's max non-overlapping)
   When the problem asks for MINIMUM REMOVALS: return n - keep
```

### Mistake 6: Remove Covered — Wrong Sort Tiebreaker

```
❌ Sorting by (start ASC, end ASC)
   [1,2] comes before [1,4] → [1,4] is NOT identified as covering [1,2]

✅ Sort by (start ASC, end DESC)
   [1,4] comes first → [1,2].end <= maxEnd → correctly counted as covered
```

---

## 7. Interview Strategy

### Communication Script

**After reading the problem (30 seconds):**
> "This is an intervals problem. I see we have `[start, end]` pairs and need to [merge/count/find rooms]. My approach: sort by [start/end], then process linearly with [merge/greedy/heap]."

**Before coding (1 minute):**
> "Let me trace through the example: after sorting we get [...]. Walking through: first interval is [...], next one [overlaps/doesn't overlap] because [start <= end / start > end], so we [merge/keep/skip]..."

**While coding (stay narrated):**
> "I'll sort by start using Integer.compare to avoid overflow... Now I iterate, comparing each interval's start against the last merged interval's end..."

### Time Allocation (35-minute problem)

| Phase | Time | Action |
|-------|------|--------|
| Understand + examples | 3 min | Identify sub-pattern (merge/rooms/select/intersect) |
| Approach + trace | 4 min | State sort key, walk through example, confirm with interviewer |
| Code | 12 min | Write the template, adapt to problem specifics |
| Test | 6 min | Trace through given example, then edge cases |
| Optimize discussion | 5 min | Discuss alternatives (heap vs sweep, O(n) vs O(n log n)) |
| Buffer | 5 min | Handle follow-ups |

### Follow-Up Questions to Expect

| Question | Response |
|----------|----------|
| "Can you do this without extra space?" | Merge in-place by tracking a write pointer instead of using ArrayList |
| "What if intervals are streaming?" | Use a TreeMap or balanced BST for O(log n) insert + merge (LC 352) |
| "What if we need to support delete too?" | TreeMap or segment tree; discuss trade-offs |
| "How would you parallelize this?" | Partition intervals, merge within partitions, then merge results across partitions (MapReduce-style) |

### Pattern Matching Cheat Sheet for Interview

| Keyword in Problem | Sub-pattern | Sort By | Template |
|---------------------|-------------|---------|----------|
| "merge intervals" | Merge | start | Template 1 |
| "insert interval" | Insert | already sorted | Template 2 |
| "non-overlapping", "min remove" | Activity Selection | **end** | Template 3 |
| "meeting rooms", "min rooms", "max concurrent" | Min-Heap | start | Template 4 |
| "intersection of two lists" | Two Pointers | already sorted | Template 5 |
| "covered intervals" | Coverage | start ASC, end DESC | Track maxEnd |
| "free time", "gaps" | Merge + Gaps | start | Template 1 → extract gaps |

---

## 8. Revision + Quick Reference

### The Five Rules of Intervals

```
1. SORT FIRST — almost always by start (except activity selection → by end)
2. OVERLAP = b.start <= a.end (after sorting by start)
3. MERGE = a.end = max(a.end, b.end)
4. MEETING ROOMS = min-heap of end times; heap.size() = concurrent count
5. INTERSECTION = [max(starts), min(ends)] valid when max(starts) <= min(ends)
```

### Complexity Summary

| Problem | Time | Space | Technique |
|---------|------|-------|-----------|
| LC 56 Merge Intervals | O(n log n) | O(n) | Sort by start + merge pass |
| LC 57 Insert Interval | O(n) | O(n) | Three-phase linear scan |
| LC 252 Meeting Rooms | O(n log n) | O(log n) | Sort by start + adjacent check |
| LC 253 Meeting Rooms II | O(n log n) | O(n) | Sort by start + min-heap of ends |
| LC 435 Non-overlapping | O(n log n) | O(log n) | Sort by end + greedy keep |
| LC 986 Intersections | O(n + m) | O(1)* | Two pointers, advance smaller end |
| LC 1288 Remove Covered | O(n log n) | O(log n) | Sort start ASC/end DESC + maxEnd |
| LC 759 Employee Free | O(n log n) | O(n) | Flatten + merge + extract gaps |

*Excluding output space.

### 30-Second Recall Drill

```
Q: How do you merge intervals?
A: Sort by start. If curr.start <= last.end, set last.end = max(ends). Else push new.

Q: How do you find minimum meeting rooms?
A: Sort by start. Min-heap of end times. For each meeting, pop if heap.peek() <= start.
   Answer = max heap size = heap.size() at end.

Q: How do you find max non-overlapping intervals?
A: Sort by END. Greedy: keep if start >= prevEnd. Answer = count kept.

Q: How do you intersect two interval lists?
A: Two pointers. Intersection = [max(starts), min(ends)]. Advance pointer with smaller end.

Q: Merge vs conflict — what's the boundary condition difference?
A: Merge: curr.start <= last.end (touching = overlap)
   Conflict: curr.start < last.end (touching = no conflict)
```

### Visual Mental Model

```
Sorted intervals:     [---]  [-----]  [--]     [------]
                       1  3   2    6   5  7     10   14

After merge:          [----------]              [------]
                       1         7              10   14

Rooms needed at peak:  |  |  |||  |   
                       Time →    (3 overlapping at once = 3 rooms)

Min-heap tracks:      [3] → [3,6] → [6,7] → [7,14]
                       ^      ^        ^
                      size 1  size 2   poll 3 (<=5), push 7 → size 2
```

### Pattern Decision Flowchart

```
Input: list of [start, end] pairs
              │
     What does the problem ask?
              │
    ┌─────────┼──────────┬──────────────┬───────────────┐
    ▼         ▼          ▼              ▼               ▼
  MERGE    CAN ALL    HOW MANY     MAX KEEP /      INTERSECT
 overlaps  FIT w/o    ROOMS?       MIN REMOVE?     two lists?
           overlap?
    │         │          │              │               │
 Sort by   Sort by    Sort by       Sort by          Two
 start     start      start         END              pointers
    │         │          │              │               │
 Merge     Check     Min-heap       Greedy          max/min
 pass     adjacent   of ends        keep             formula
    │         │          │              │               │
 Template  LC 252    Template 4     Template 3      Template 5
   1                  LC 253         LC 435          LC 986
 LC 56
 LC 57
```
