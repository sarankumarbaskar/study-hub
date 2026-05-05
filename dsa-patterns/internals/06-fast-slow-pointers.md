# Fast & Slow Pointers (Floyd's) — Interview Execution Playbook

> Two pointers at different speeds — O(1) space cycle detection, midpoint finding, and implicit-graph traversal. The Swiss Army knife for linked list interviews.

---

## 1. Pattern Recognition Signals

**Reach for fast/slow pointers when you see ANY of these in the problem statement:**

| Signal | Example Problem |
|--------|----------------|
| "cycle", "loop", "circular" in a linked list | #141, #142 |
| "middle of linked list" | #876 |
| "palindrome linked list" (need midpoint + reverse) | #234 |
| "reorder list" (need midpoint + reverse + merge) | #143 |
| Array with values in range `[1, n]` + "find duplicate" + O(1) space | #287 |
| Repeated function application that either terminates or loops | #202 Happy Number |
| "split linked list" for merge sort | Merge sort on linked list |
| O(1) space constraint on a problem that screams HashSet | Any cycle/duplicate problem |

**Speed of recognition matters.** When the interviewer says "linked list" + "cycle", your hand should already be writing `slow = head, fast = head`. When they say "find duplicate in O(1) space", you should immediately say "This array is an implicit linked list — Floyd's algorithm."

---

## 2. Thinking Framework

### Why Does Fast Always Catch Slow? (The Proof You Should Know)

Once both pointers enter a cycle of length `C`:
- Each step, the gap between fast and slow **decreases by exactly 1** (fast gains 1 step per iteration).
- Starting gap is at most `C - 1`.
- After at most `C - 1` iterations, the gap becomes 0 → they meet.

**Key insight to explain in interview:** "Fast gains one position on slow per iteration. Since we're in a finite cycle, the relative distance shrinks by 1 each step. They must meet within one full cycle traversal."

### The Math Behind Finding the Cycle Start (Floyd's Phase 2)

This is the part interviewers love to probe. Here's the proof:

```
Let:
  F = distance from head to cycle entrance
  a = distance from cycle entrance to meeting point (along cycle direction)
  C = cycle length

When slow and fast meet:
  slow traveled: F + a
  fast traveled: F + a + k*C  (for some integer k ≥ 1, fast looped k times)
  fast traveled 2× slow: 2(F + a) = F + a + k*C
  Simplify: F + a = k*C
  Therefore: F = k*C - a = (k-1)*C + (C - a)
```

**What this means:** If you place one pointer at head and one at the meeting point, and advance both by 1, they'll meet at the cycle entrance. The pointer from head travels `F` steps. The pointer from the meeting point travels `(k-1)*C + (C - a)` steps — it completes some full loops then covers the remaining `(C - a)` distance to reach the entrance. Both arrive at the same spot.

**Interview delivery:** "After detection, I reset one pointer to head. Both advance one step at a time. The math guarantees they converge at the cycle entrance because the distance from head to entrance equals the distance from meeting point to entrance modulo cycle length."

### Why Fast/Slow Finds the Middle

When fast reaches the end of a list of length `n`:
- fast has moved `n` (or `n-1`) steps
- slow has moved `n/2` (or `(n-1)/2`) steps → slow is at the middle

For even-length lists: `while (fast != null && fast.next != null)` lands slow on the **second middle** node (what LeetCode expects for #876). For problems like palindrome/reorder where you want to split into equal halves, use `while (fast.next != null && fast.next.next != null)` to land slow on the **first middle** (last node of the first half).

---

## 3. Java Templates

### Standard ListNode Definition

```java
public class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
```

### Template A: Cycle Detection (LC #141)

```java
public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}
```

**Guard condition:** `fast != null && fast.next != null` prevents NPE on `fast.next.next`. This is the single most important line — get it wrong and you crash.

### Template B: Find Cycle Start (LC #142)

```java
public ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            // Phase 2: find entrance
            slow = head;
            while (slow != fast) {
                slow = slow.next;
                fast = fast.next;
            }
            return slow;
        }
    }
    return null;
}
```

**Two-phase structure:** Phase 1 detects. Phase 2 finds the entrance. Both are O(n) and O(1) space.

### Template C: Find Middle of Linked List (LC #876)

```java
// Returns second middle for even-length lists (LeetCode convention)
public ListNode middleNode(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}
```

```java
// Returns first middle (for split-based problems: palindrome, reorder, merge sort)
public ListNode firstMiddle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast.next != null && fast.next.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}
```

**Which middle?** Use "second middle" for #876. Use "first middle" for #234 (palindrome), #143 (reorder), and merge sort — you need `slow` to be the last node of the first half so you can cut with `slow.next = null`.

### Template D: Cycle Detection on Implicit Graph (LC #287 / LC #202)

**Array as linked list (Find Duplicate Number):**

```java
public int findDuplicate(int[] nums) {
    int slow = 0, fast = 0;

    // Phase 1: detect cycle
    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow != fast);

    // Phase 2: find entrance (the duplicate value)
    slow = 0;
    while (slow != fast) {
        slow = nums[slow];
        fast = nums[fast];
    }
    return slow;
}
```

**Why this works:** Array indices are "nodes", `nums[i]` is the "next pointer". Since values are in `[1, n]` and there are `n+1` entries, by pigeonhole there's a duplicate. The duplicate value is the cycle entrance — two different indices point to the same value.

**Sequence as implicit graph (Happy Number):**

```java
public boolean isHappy(int n) {
    int slow = n, fast = n;
    do {
        slow = digitSquareSum(slow);
        fast = digitSquareSum(digitSquareSum(fast));
    } while (slow != fast);
    return slow == 1;
}

private int digitSquareSum(int n) {
    int sum = 0;
    while (n > 0) {
        int d = n % 10;
        sum += d * d;
        n /= 10;
    }
    return sum;
}
```

**Why this works:** The sequence of digit-square-sums either reaches 1 (and stays at 1 forever — a trivial cycle) or enters a cycle that never includes 1. Fast/slow detects the cycle; we just check if the meeting value is 1.

---

## 4. Edge Cases

| Edge Case | What Happens | Handle With |
|-----------|-------------|-------------|
| `head == null` | No list at all | Guard at top: `if (head == null) return ...` |
| Single node, no cycle | `fast.next` is null immediately → loop never executes | Returns false/returns the node itself |
| Single node, self-loop (`1 → 1`) | `slow = fast` on first iteration | Correctly detected by cycle check |
| Two nodes, cycle (`1 → 2 → 1`) | Fast wraps, meets slow | Works normally |
| Even-length list (middle) | `slow` at second middle vs. first middle | Choose correct while-condition (see Template C) |
| All identical values in array (#287) | Cycle still exists in index graph | Works — we compare indices, not values |
| `n = 1` for Happy Number | `digitSquareSum(1) = 1` → trivially happy | `slow == fast == 1` → returns true |
| Very long tail before cycle | Phase 1 takes O(F + C) steps | Still O(n) overall |

**The edge case that burns people most:** Even vs. odd length for middle-finding. Draw out a 4-node and 5-node list on paper. Trace slow/fast positions. Know which while-condition gives which middle.

---

## 5. Problem Progression

### Tier 1: Core Mechanics (Do These First)

| # | Problem | Difficulty | Core Technique | Key Insight |
|---|---------|-----------|----------------|-------------|
| 141 | [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/) | Easy | Template A | Fast/slow meet → cycle exists |
| 876 | [Middle of Linked List](https://leetcode.com/problems/middle-of-the-linked-list/) | Easy | Template C | When fast finishes, slow is at middle |

### Tier 2: Floyd's Full Algorithm

| # | Problem | Difficulty | Core Technique | Key Insight |
|---|---------|-----------|----------------|-------------|
| 142 | [Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/) | Medium | Template B | Phase 2: reset to head, both advance 1 → cycle entrance |
| 202 | [Happy Number](https://leetcode.com/problems/happy-number/) | Easy | Template D | Digit-square sequence is an implicit graph; cycle to non-1 = unhappy |
| 287 | [Find the Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/) | Medium | Template D | Array as implicit linked list; duplicate = cycle entrance |

### Tier 3: Middle as a Building Block

| # | Problem | Difficulty | Core Technique | Key Insight |
|---|---------|-----------|----------------|-------------|
| 234 | [Palindrome Linked List](https://leetcode.com/problems/palindrome-linked-list/) | Easy | Template C + reverse | Find middle → reverse second half → compare |
| 143 | [Reorder List](https://leetcode.com/problems/reorder-list/) | Medium | Template C + reverse + merge | Find middle → reverse second half → interleave merge |

### Full Solutions for Tier 2 and Tier 3 Problems

---

#### LC #234 — Palindrome Linked List

**Approach:** Find the first middle → reverse second half → compare node by node.

```java
class Solution {
    public boolean isPalindrome(ListNode head) {
        if (head == null || head.next == null) return true;

        ListNode slow = head, fast = head;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }

        ListNode secondHalf = reverse(slow.next);
        ListNode firstHalf = head;

        while (secondHalf != null) {
            if (firstHalf.val != secondHalf.val) return false;
            firstHalf = firstHalf.next;
            secondHalf = secondHalf.next;
        }
        return true;
    }

    private ListNode reverse(ListNode head) {
        ListNode prev = null;
        while (head != null) {
            ListNode next = head.next;
            head.next = prev;
            prev = head;
            head = next;
        }
        return prev;
    }
}
```

**Complexity:** Time O(n), Space O(1). Three linear passes: find middle, reverse, compare.

**Interview note:** If asked "should you restore the list?", say yes for production code, but clarify with the interviewer whether it's needed. Restoring means reversing the second half again after comparison.

---

#### LC #143 — Reorder List

**Approach:** Find middle → cut → reverse second half → interleave merge.

```java
class Solution {
    public void reorderList(ListNode head) {
        if (head == null || head.next == null) return;

        // Find first middle (last node of first half)
        ListNode slow = head, fast = head;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }

        // Cut and reverse second half
        ListNode second = reverse(slow.next);
        slow.next = null;

        // Interleave merge
        ListNode first = head;
        while (second != null) {
            ListNode tmp1 = first.next, tmp2 = second.next;
            first.next = second;
            second.next = tmp1;
            first = tmp1;
            second = tmp2;
        }
    }

    private ListNode reverse(ListNode head) {
        ListNode prev = null;
        while (head != null) {
            ListNode next = head.next;
            head.next = prev;
            prev = head;
            head = next;
        }
        return prev;
    }
}
```

**Complexity:** Time O(n), Space O(1). The interleave merge is the tricky part — trace through a 4-node example to internalize the pointer dance.

---

#### Using Fast/Slow for Merge Sort on Linked Lists

Finding the middle is the key step that enables merge sort on linked lists without random access:

```java
public ListNode sortList(ListNode head) {
    if (head == null || head.next == null) return head;

    // Split at middle
    ListNode mid = firstMiddle(head);
    ListNode right = mid.next;
    mid.next = null;

    // Recurse
    ListNode left = sortList(head);
    right = sortList(right);

    // Merge sorted halves
    return merge(left, right);
}

private ListNode firstMiddle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast.next != null && fast.next.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}

private ListNode merge(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0), tail = dummy;
    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) { tail.next = l1; l1 = l1.next; }
        else { tail.next = l2; l2 = l2.next; }
        tail = tail.next;
    }
    tail.next = (l1 != null) ? l1 : l2;
    return dummy.next;
}
```

---

## 6. Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|-------------|-----|
| Starting `fast` at `head.next` instead of `head` | Off-by-one for short lists, wrong middle calculation | Always `slow = head, fast = head` |
| Checking only `fast != null` without `fast.next != null` | NPE on `fast.next.next` when list has even length | Always `while (fast != null && fast.next != null)` |
| Using wrong while-condition for "first middle" vs. "second middle" | Wrong split point for palindrome/reorder — comparison fails or nodes get lost | `fast != null && fast.next != null` → second middle; `fast.next != null && fast.next.next != null` → first middle |
| Forgetting `slow.next = null` after finding middle (for split problems) | The two halves remain connected → infinite loop or wrong result during merge/reverse | Always cut: `slow.next = null` |
| In #287, starting at index `nums[0]` instead of index `0` | Misses the "head" of the implicit list; wrong cycle entrance | `slow = 0, fast = 0` — index 0 is the virtual head, not part of the cycle |
| In #287, using `do-while` in phase 2 | Phase 2 must use `while` — if you use `do-while`, you skip checking the initial position | Phase 1: `do-while` (need at least one step). Phase 2: `while` (check immediately) |
| Not handling `head == null` in split-based problems | NPE on `fast.next` | Guard clause at the top |
| Confusing `slow == fast` (reference equality) with value equality | For linked lists, we compare node references (same object), not values | Use `==` for nodes (correct in Java for reference comparison) |

---

## 7. Interview Strategy

### Opening (First 2 Minutes)

1. **Confirm input/output.** "So I'm given a linked list head, and I need to return whether there's a cycle — true or false?"
2. **State the pattern.** "This is a classic fast-and-slow-pointer problem. I'll use Floyd's cycle detection — O(n) time, O(1) space."
3. **Briefly mention brute force.** "We could use a HashSet to track visited nodes — that's O(n) time and O(n) space. But Floyd's avoids the extra space."

### Implementation (Minutes 2-10)

4. **Write the code.** Template A/B/C/D depending on the problem. These are short — you should be able to write any of them from memory in under 2 minutes.
5. **Narrate while coding.** "Both pointers start at head. Fast moves two steps, slow moves one. If they meet, there's a cycle. If fast hits null, no cycle."
6. **State the guard condition explicitly.** "I check `fast != null && fast.next != null` before accessing `fast.next.next` to avoid a null pointer exception."

### Trace & Verify (Minutes 10-15)

7. **Dry run on a small example.** Draw a 4-5 node list with a cycle, trace slow/fast positions. Show they meet.
8. **Run through edge cases.** Null head, single node, two nodes with/without cycle.
9. **State complexity.** "Time is O(n) because fast traverses at most 2n nodes before meeting slow or hitting null. Space is O(1) — just two pointers."

### If Asked for the Proof (Bonus Points)

10. **Explain the relative-speed argument.** "Once both are in the cycle, fast closes the gap by 1 each step. They must meet within C iterations, where C is the cycle length."
11. **Explain phase 2 for cycle start.** "After meeting, slow has traveled F + a, fast has traveled F + a + kC. Since fast moves 2x slow, F + a = kC, so F = kC - a. If I reset one pointer to head and both advance by 1, they'll converge at the cycle entrance."

### Complexity Summary to State Aloud

| Problem | Time | Space |
|---------|------|-------|
| Cycle detection (#141) | O(n) | O(1) |
| Cycle start (#142) | O(n) | O(1) |
| Middle of list (#876) | O(n) | O(1) |
| Happy Number (#202) | O(log n) per step, bounded iterations | O(1) |
| Find Duplicate (#287) | O(n) | O(1) |
| Palindrome List (#234) | O(n) | O(1) |
| Reorder List (#143) | O(n) | O(1) |

---

## 8. Revision + Quick Reference

### 30-Second Recall Drill

1. **Cycle detection:** Both start at head. Slow +1, fast +2. Meet → cycle. Null → no cycle.
2. **Cycle start:** After meeting, reset slow to head. Both +1. They meet at entrance.
3. **Middle:** Both start at head. Slow +1, fast +2. When fast done, slow = middle.
4. **Implicit graph:** Array index → value is a "next pointer". Floyd's finds the duplicate/cycle.

### Pattern Decision Tree

```
Is there a cycle to detect?
├── Linked list cycle? → Template A (#141) or Template B (#142)
├── Number sequence loops? → Template D with custom next() (#202)
└── Array with values in [1,n], find duplicate? → Template D with nums[i] as next (#287)

Need the middle of a linked list?
├── Just return middle? → Template C, second middle (#876)
└── Need to split for further processing?
    ├── Palindrome check? → First middle + reverse + compare (#234)
    ├── Reorder list? → First middle + reverse + interleave (#143)
    └── Merge sort on list? → First middle + recursive sort + merge
```

### The Four Templates on One Page

```
Template A (Detect Cycle):      while (fast && fast.next) { slow++; fast+=2; if meet → cycle }
Template B (Find Cycle Start):  Template A + reset slow to head, both +1 until meet
Template C (Find Middle):       while (fast && fast.next) { slow++; fast+=2 } → slow is middle
Template D (Implicit Graph):    same as B but next = nums[i] or f(x) instead of node.next
```

### Connections to Other Patterns

| Pattern | How Fast/Slow Connects |
|---------|----------------------|
| **Two Pointers** | Fast/slow IS a two-pointer technique — just with unequal speeds |
| **Linked List Reversal** | Palindrome (#234) and Reorder (#143) combine middle-finding with in-place reversal |
| **Merge Sort** | Finding middle via fast/slow enables merge sort on linked lists without random access |
| **Hash Map** | HashSet is the brute-force alternative Floyd's replaces — mention it, then optimize |
| **Math/Number Theory** | Happy Number (#202) uses Floyd's on a mathematical sequence |

### Must-Memorize Checklist

- [ ] Template A: 5 lines, cycle detection
- [ ] Template B: Template A + 5 more lines for phase 2
- [ ] Template C: 4 lines, middle finding (know both while-conditions)
- [ ] Template D: Floyd's on array/sequence — `do-while` for phase 1, `while` for phase 2
- [ ] The proof: `F = kC - a` → why phase 2 works
- [ ] Even vs. odd middle: which while-condition gives which middle
- [ ] #287 insight: array indices form implicit linked list, duplicate = cycle entrance
