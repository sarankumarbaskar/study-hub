# Fast & Slow Pointers

> Two pointers moving at different speeds reveal cycles, middles, and structural properties—without extra space or multiple passes.

## What Is This Pattern?

The **Fast & Slow Pointers** pattern (also known as the **tortoise and hare** or **Floyd's cycle detection**) uses two pointers traversing a sequence at different speeds. Typically, the **slow pointer** advances by one step per iteration while the **fast pointer** advances by two. This asymmetry creates a predictable relationship: if there is a cycle, the fast pointer will eventually "lap" the slow one and meet it inside the cycle.

**Visual intuition:** Imagine a circular track with a tortoise and a hare. The hare runs twice as fast. If they start from the same point, the hare will eventually catch the tortoise from behind—proof of a loop. If the track is straight (no cycle), the hare simply reaches the end first. In linked lists or array-as-graph structures, we don't need to hash nodes or count steps; the meeting point (or its absence) tells us everything we need.

The pattern generalizes beyond cycle detection: when the fast pointer reaches the end of a linked list, the slow pointer is at the **middle** (or one step past it). We can also use it to find the **k-th element from the end** by giving the fast pointer a head start. These applications share one idea: **relative positioning** through differential speed—no extra data structures, often O(1) space.

## When to Use This Pattern

- **Cycle detection** in linked lists or implicit linked structures (e.g., array indices as "next" pointers)
- **Finding the middle** of a linked list in one pass
- **Finding the k-th node from the end** without knowing the length
- **Palindrome checks** on linked lists (find middle, reverse second half, compare)
- **Reordering / restructuring** linked lists (split at middle, reverse, merge)
- **Problems where** you need positional info (middle, nth-from-end) but can't afford multiple passes or O(n) extra space

## How to Identify This Pattern

- "Detect cycle" / "has cycle" / "circular"
- "Middle of the linked list"
- "Nth node from the end"
- "Palindrome linked list"
- "Reorder list" / "in-place reorder"
- Array with values in range [1, n] and "find duplicate" (array becomes implicit linked list)
- "Happy number" (repeated squaring leads to a cycle)
- Single pass, O(1) space, linked list or array-as-graph

## Core Template (Pseudocode)

### Cycle Detection
```
slow = head
fast = head
WHILE fast != null AND fast.next != null:
    slow = slow.next
    fast = fast.next.next
    IF slow == fast:
        RETURN true  // cycle exists
RETURN false
```

### Find Middle
```
slow = head
fast = head
WHILE fast != null AND fast.next != null:
    slow = slow.next
    fast = fast.next.next
RETURN slow  // middle (or second of two middles for even length)
```

### Find Cycle Start (after detection)
```
// After slow and fast meet inside cycle:
slow = head
WHILE slow != fast:
    slow = slow.next
    fast = fast.next
RETURN slow  // cycle entrance
```

## Core Template (Java)

### Cycle Detection
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

### Find Middle
```java
public ListNode findMiddle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}
```

### Cycle Start (Floyd's Algorithm)
```java
// After detecting cycle: slow and fast met
public ListNode detectCycleStart(ListNode head, ListNode slow, ListNode fast) {
    slow = head;
    while (slow != fast) {
        slow = slow.next;
        fast = fast.next;
    }
    return slow;
}
```

## Complexity Cheat Sheet

| Use Case              | Time | Space | Notes                           |
|-----------------------|------|-------|---------------------------------|
| Cycle detection       | O(n) | O(1)  | Fast catches slow in ≤ n steps  |
| Find middle           | O(n) | O(1)  | One pass                        |
| Find cycle start      | O(n) | O(1)  | After detection, ≤ n more steps |
| Nth from end          | O(n) | O(1)  | Fast gets n-step head start     |
| Reorder / Palindrome  | O(n) | O(1)  | Middle + reverse + merge        |
| Find Duplicate (#287) | O(n) | O(1)  | Array as implicit linked list   |

---

## Problems (Progressive Difficulty)

### Standard ListNode Definition (for linked list problems)

```java
// LeetCode standard ListNode - include when solving linked list problems
public class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
```

---

### Easy (2 problems)

#### Problem: [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/) (LeetCode #141)

- **Brute Force:** Use a HashSet to store visited nodes; if we encounter a node already in the set, a cycle exists. Time O(n), Space O(n).
- **Intuition:** If the list has a cycle, the fast pointer will eventually meet the slow pointer. If there is no cycle, the fast pointer reaches the end (null) first.
- **Approach:**
  1. Initialize both pointers at `head`
  2. Move slow by 1, fast by 2 each iteration
  3. If `slow == fast`, a cycle exists
  4. If fast (or fast.next) becomes null, no cycle
- **Java Solution:**

```java
public class Solution {
    public boolean hasCycle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Middle of the Linked List](https://leetcode.com/problems/middle-of-the-linked-list/) (LeetCode #876)

- **Brute Force:** Traverse once to get the length, then traverse again to the middle node. Time O(n), Space O(1).
- **Intuition:** When the fast pointer reaches the end (or past it), the slow pointer is exactly at the middle. For even-length lists, slow ends at the second middle node (as per LeetCode).
- **Approach:**
  1. Both start at `head`
  2. While `fast != null && fast.next != null`, move slow by 1, fast by 2
  3. When the loop exits, `slow` is the middle node
- **Java Solution:**

```java
class Solution {
    public ListNode middleNode(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

### Medium (4 problems)

#### Problem: [Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/) (LeetCode #142)

- **Brute Force:** Use a HashSet to store visited nodes; the first node we see twice is the cycle entrance. Time O(n), Space O(n).
- **Intuition:** After detecting a cycle (slow meets fast), reset slow to head. Move both one step at a time until they meet again—that meeting point is the cycle entrance. (Proof: distance from head to cycle start = distance from meeting point to cycle start.)
- **Approach:**
  1. Use Floyd's cycle detection to find the meeting point
  2. If no cycle, return null
  3. Set slow = head, keep fast at meeting point
  4. Move both one step until they meet; return that node
- **Java Solution:**

```java
public class Solution {
    public ListNode detectCycle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {
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
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Happy Number](https://leetcode.com/problems/happy-number/) (LeetCode #202)

- **Brute Force:** Use a HashSet to store seen numbers in the digit-sum sequence; if we see a repeat before reaching 1, the number is not happy. Time O(log n) per step, Space O(log n).
- **Intuition:** Repeatedly replacing n by the sum of squares of its digits creates a sequence. If we ever reach 1, we're happy. Otherwise we enter a cycle (numbers are bounded). Use fast/slow: if fast reaches 1, happy; if slow meets fast and neither is 1, not happy.
- **Approach:**
  1. Slow and fast both start at n
  2. slow = next(slow), fast = next(next(fast))
  3. If fast == 1, return true
  4. If slow == fast (and both != 1), return false
- **Java Solution:**

```java
class Solution {
    public boolean isHappy(int n) {
        int slow = n, fast = n;
        do {
            slow = sumOfSquares(slow);
            fast = sumOfSquares(sumOfSquares(fast));
            if (fast == 1) return true;
        } while (slow != fast);
        return false;
    }

    private int sumOfSquares(int n) {
        int sum = 0;
        while (n > 0) {
            int d = n % 10;
            sum += d * d;
            n /= 10;
        }
        return sum;
    }
}
```

- **Complexity:** Time O(log n) per digit op, Space O(1)

---

#### Problem: [Reorder List](https://leetcode.com/problems/reorder-list/) (LeetCode #143)

- **Brute Force:** Copy all nodes into an array, then reorder by alternating indices (0, n-1, 1, n-2, ...) and rebuild the list. Time O(n), Space O(n).
- **Intuition:** Reorder L0→L1→…→Ln-1 to L0→Ln→L1→Ln-1→… Use fast/slow to find the middle, reverse the second half, then merge the two lists alternately.
- **Approach:**
  1. Find middle with fast/slow
  2. Reverse the second half (from middle.next onward)
  3. Merge: alternate nodes from first half and reversed second half
- **Java Solution:**

```java
class Solution {
    public void reorderList(ListNode head) {
        if (head == null || head.next == null) return;

        // Find middle
        ListNode slow = head, fast = head;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }

        // Reverse second half
        ListNode second = reverse(slow.next);
        slow.next = null;

        // Merge
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

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) (LeetCode #19)

- **Brute Force:** Two passes: first get the list length, then traverse to the (length - n)th node and remove it. Time O(n), Space O(1).
- **Intuition:** Give the fast pointer an n-step head start. When fast reaches the last node (or past it), slow is at the node before the one to remove.
- **Approach:**
  1. Use a dummy node to handle removal of head
  2. Move fast n+1 steps ahead (so when fast is at null, slow is at predecessor of Nth-from-end)
  3. Move both until fast == null
  4. Remove slow.next
- **Java Solution:**

```java
class Solution {
    public ListNode removeNthFromEnd(ListNode head, int n) {
        ListNode dummy = new ListNode(0);
        dummy.next = head;
        ListNode fast = dummy, slow = dummy;
        for (int i = 0; i <= n; i++) {
            fast = fast.next;
        }
        while (fast != null) {
            slow = slow.next;
            fast = fast.next;
        }
        slow.next = slow.next.next;
        return dummy.next;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

### Hard (2 problems)

#### Problem: [Find the Duplicate Number](https://leetcode.com/problems/find-the-duplicate-number/) (LeetCode #287)

- **Brute Force:** Use a HashSet; the first number we see twice is the duplicate. Time O(n), Space O(n).
- **Intuition:** The array maps index i → nums[i], forming an implicit linked list. Because there's exactly one duplicate, there's exactly one node with two incoming edges—a cycle. Use Floyd's cycle detection: find meeting point, then find cycle entrance.
- **Approach:**
  1. Treat slow = nums[slow], fast = nums[nums[fast]] as pointer moves
  2. Find meeting point (cycle exists guaranteed)
  3. Reset slow = 0 (head), move both one step; meeting point is the duplicate
- **Java Solution:**

```java
class Solution {
    public int findDuplicate(int[] nums) {
        int slow = 0, fast = 0;
        do {
            slow = nums[slow];
            fast = nums[nums[fast]];
        } while (slow != fast);

        slow = 0;
        while (slow != fast) {
            slow = nums[slow];
            fast = nums[fast];
        }
        return slow;
    }
}
```

- **Complexity:** Time O(n), Space O(1)

---

#### Problem: [Palindrome Linked List](https://leetcode.com/problems/palindrome-linked-list/) (LeetCode #234)

- **Brute Force:** Copy the list values into an array, then use two pointers to check if the array is a palindrome. Time O(n), Space O(n).
- **Intuition:** Find the middle with fast/slow, reverse the second half, then compare first half with reversed second half node-by-node.
- **Approach:**
  1. Find middle (slow)
  2. Reverse from slow (or slow.next for odd length—handle even/odd)
  3. Compare first half with reversed second half
  4. (Optional) Restore the list by reversing again
- **Java Solution:**

```java
class Solution {
    public boolean isPalindrome(ListNode head) {
        if (head == null || head.next == null) return true;

        // Find middle (first of second half for even length)
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }

        // Reverse second half
        ListNode second = reverse(slow);
        ListNode first = head;

        // Compare
        while (second != null) {
            if (first.val != second.val) return false;
            first = first.next;
            second = second.next;
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

- **Complexity:** Time O(n), Space O(1)

---

## Common Mistakes & Edge Cases

| Mistake | Fix |
|--------|-----|
| Starting fast at `head.next` | Both should start at `head`; otherwise off-by-one for short lists |
| Checking only `fast != null` | Check `fast != null && fast.next != null` before `fast.next.next` to avoid NPE |
| Forgetting dummy for Remove Nth | Use dummy when removing head (n = length) |
| Wrong middle for even-length | LeetCode #876: slow ends at second middle. For "first middle" use different condition |
| Modifying list without restoring | Palindrome: if you must preserve list, reverse second half again after comparison |
| Array index 0 in #287 | Indices 0..n; nums[i] in 1..n. Start slow=0, fast=0; next is nums[slow] |
| Assuming cycle always exists | #141: return false when fast reaches null |

**Edge Cases:**
- Empty list (`head == null`)
- Single node (no cycle possible; middle is that node)
- Two nodes (cycle: 1→2→1; middle: second node per #876)
- n = length in Remove Nth (removes head—use dummy)
- All same values in array (#287 still works—cycle in implicit graph)

## Pattern Variations

| Variation | Example | Key Technique |
|-----------|---------|---------------|
| **Cycle detection** | Linked List Cycle (#141, #142) | slow +1, fast +2; meeting ⇒ cycle |
| **Find cycle start** | Linked List Cycle II (#142), Find Duplicate (#287) | Reset slow to head; move both +1 until meet |
| **Find middle** | Middle of List (#876), Reorder (#143), Palindrome (#234) | slow +1, fast +2; slow is middle when fast at end |
| **Nth from end** | Remove Nth Node (#19) | Fast gets n-step head start |
| **Implicit linked list** | Find Duplicate (#287) | Index → value forms graph; cycle detection finds duplicate |
| **Sequence as graph** | Happy Number (#202) | Digit sum sequence; cycle ⇒ not happy |
| **Split + reverse + merge** | Reorder List (#143), Palindrome (#234) | Middle → reverse second half → merge or compare |
