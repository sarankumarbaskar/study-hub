# Intervals — Pattern Guide

## When to Use
- Merging overlapping intervals
- Finding conflicts/overlaps between events
- Inserting into a sorted interval list
- Scheduling and resource allocation
- Greedy selection of non-overlapping intervals

## Recognition Signals
- "Merge overlapping intervals"
- "Insert interval into sorted list"
- "Find non-overlapping intervals" / "minimum removals"
- "Meeting rooms" / "can attend all meetings"
- Input is a list of [start, end] pairs
- Scheduling/calendar problems

## Common Tricks
- Sort by start time (or end time depending on problem variant)
- Merge intervals: sort by start, extend end if overlapping, else add new interval
- Insert interval: three-phase approach — add before, merge overlapping, add after
- Non-overlapping intervals (minimum removals): sort by end time, greedy keep earliest-ending
- Meeting rooms: sort by start, check if any overlap — or use min-heap for room count

## Time Complexity Expectations
| Approach | Time | Space |
|----------|------|-------|
| Brute force (compare all pairs) | O(n²) | O(n) |
| Sort + linear scan | O(n log n) | O(n) |
| Line sweep | O(n log n) | O(n) |

## Interview Tips
- Merge Intervals is one of the most common interview questions across all companies — must be instant
- For "non-overlapping intervals": sort by END time, not start time — this is the greedy insight
- Meeting Rooms I (can attend all?) vs II (min rooms needed) — know the difference
- Insert Interval: handle the three phases cleanly — before overlap, during overlap, after overlap
- Always clarify: are intervals inclusive or exclusive at endpoints? This affects overlap logic

## Common Mistakes
- Sorting by start when you should sort by end (non-overlapping intervals)
- Not handling the case where new interval is before all or after all existing intervals
- Using >= vs > for overlap detection (inclusive vs exclusive endpoints)
- Modifying the input list while iterating over it

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | Merge Intervals | 56 | Medium | Very High |
| 2 | Insert Interval | 57 | Medium | High |
| 3 | Non-overlapping Intervals | 435 | Medium | High |
| 4 | Meeting Rooms | 252 | Easy | High |
