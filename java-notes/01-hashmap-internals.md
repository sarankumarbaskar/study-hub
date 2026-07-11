# HashMap Internals — Complete Mentor Guide

> Date: 2026-07-10 | Topic: Java Collections | Connected DSA: Arrays & Hashing
> Coverage: Core 98% | Senior Interview 95% | OpenJDK depth 85%

---

## One-Line

HashMap is an array of buckets where each bucket holds a linked list (or tree) of key-value pairs, and the bucket is chosen by hashing the key.

## Why It Exists

Without HashMap, finding a value by key requires scanning every entry: O(n). HashMap gives O(1) **average** lookup by computing a bucket index from the key's hash code, so you jump directly to where the entry lives.

---

## Internal Structure

```
HashMap<String, Integer>  capacity=16, size=3, loadFactor=0.75

table[] (array of Node)
┌─────────┐
│ index 0 │ → null
├─────────┤
│ index 1 │ → ["cat", 1] → null
├─────────┤
│ index 2 │ → ["dog", 2] → ["bat", 3] → null    ← collision!
├─────────┤
│  ...    │ → null
└─────────┘
```

### Actual Node class from OpenJDK:

```java
static class Node<K,V> {
    final int hash;     // cached hash — never recomputed
    final K key;        // immutable reference
    V value;            // mutable
    Node<K,V> next;     // chain pointer
}
```

Key fields of HashMap:

```java
Node<K,V>[] table;      // bucket array (always power-of-2 size)
int size;               // total entries
float loadFactor;       // default 0.75
int threshold;          // capacity * loadFactor — triggers resize
int modCount;           // structural modification counter (fail-fast)
```

---

## Trace: `map.put("cat", 1)`

Starting with empty HashMap (default capacity 16, load factor 0.75):

```
Step 1: Compute hash
    key = "cat"
    h = "cat".hashCode()         → 98262
    hash = h ^ (h >>> 16)        → 98262  (spread high bits into low bits)

Step 2: Find bucket index
    index = hash & (capacity - 1)
    index = 98262 & 15           → 6

Step 3: Check bucket 6
    table[6] is null             → empty bucket

Step 4: Create node
    table[6] = new Node(hash, "cat", 1, null)

Step 5: Increment size and modCount
    size = 1
    modCount++
    threshold = 16 * 0.75 = 12
    size (1) < threshold (12)    → no resize needed

Done. "cat" lives in bucket 6.
```

---

## Trace: Collision — `map.put("dog", 2)` lands in same bucket

```
Step 1: hash("dog")              → some number
Step 2: index = hash & 15        → 6 (same bucket as "cat"!)

Step 3: Check bucket 6
    table[6] is NOT null          → "cat" is here
    Check: "dog".equals("cat")?   → false
    No more nodes in chain

Step 4: Append to chain
    table[6] = new Node(hash, "dog", 2, existingCatNode)

Bucket 6 now:  ["dog", 2] → ["cat", 1] → null
```

---

## Trace: Update — `map.put("cat", 99)`

```
Step 1: hash("cat")              → 98262
Step 2: index = 98262 & 15       → 6

Step 3: Check bucket 6
    First node: key="dog"
    "cat".equals("dog")?          → false, move to next

    Second node: key="cat"
    "cat".equals("cat")?          → TRUE!

Step 4: Replace value
    node.value = 99               (was 1, now 99)

No new node created. Size unchanged.
```

---

## Trace: `map.get("cat")`

```
Step 1: hash("cat")              → 98262
Step 2: index = 98262 & 15       → 6

Step 3: Check bucket 6
    First node: hash matches? key.equals("cat")?
    If yes → return value
    If no  → follow next pointer, repeat

Found → return 99
```

**The most important sentence about HashMap:**

> `hashCode()` finds the bucket. `equals()` finds the exact entry. Both must be correct.

---

## Why It's NOT Truly O(1)

HashMap is **O(1) on average**, not O(1) guaranteed.

What actually happens during `get(key)`:

```
1. Compute hashCode()            O(1)
2. Spread hash bits              O(1)
3. Calculate bucket index        O(1)
4. Go to that bucket             O(1)
5. Traverse nodes in bucket      O(k) where k = chain length
```

Step 5 is NOT O(1). It's a linear scan of the chain.

### Why books say O(1)

With capacity = 1,000,000 and size = 750,000:

```
Average entries per bucket = 750000 / 1000000 = 0.75
```

Most buckets contain 0 or 1 entries. So chain traversal is constant in practice.

### True complexity expression

```
get() = O(1) + O(k)

where k = entries in that bucket

Since Java keeps k ≈ constant through resizing and good hash distribution:

O(1 + constant) = O(1) amortized
```

### Worst case

All keys hash to the same bucket:

```
bucket[5] → [A] → [B] → [C] → ... → [I]

Lookup = O(n)                    ← linked list
Lookup = O(log n)                ← after treeification
```

### Complexity table

| Operation | Average | Worst (list) | Worst (tree) |
|-----------|---------|-------------|--------------|
| `put`     | O(1)    | O(n)        | O(log n)     |
| `get`     | O(1)    | O(n)        | O(log n)     |
| `remove`  | O(1)    | O(n)        | O(log n)     |

### Two-stage mental model

```
Stage 1: Hash → Find bucket         O(1)

Stage 2: Search inside bucket
          Linked List  → O(k)
          Red-Black Tree → O(log k)
```

---

## Why Hash Spreading: `h ^ (h >>> 16)`

Many classes have poor hash functions where useful information is concentrated in the upper bits.

```
Example hash:  1000000000000001 (binary)
Capacity = 16

Without spreading:
    index = hash & 15           → uses only lower 4 bits
    Upper bits are IGNORED      → many collisions

With spreading:
    hash = h ^ (h >>> 16)       → mixes upper 16 bits into lower 16 bits
    Lower bits now carry information from the entire hash
    Better bucket distribution
```

This is a common senior interview question: "Why does HashMap spread hash bits?"

---

## Why Capacity Is Always a Power of Two

Instead of `hash % capacity` (expensive division), HashMap uses:

```
hash & (capacity - 1)
```

This only works when capacity is a power of two:

```
Capacity   = 16    = 10000  (binary)
Capacity-1 = 15    = 01111  (binary)

hash & 01111  → extracts lower 4 bits → bucket index 0-15

Much faster than hash % 16 (modulo requires division)
```

That's why capacity is always 16 → 32 → 64 → 128. Never 20, 50, or 100.

---

## Why Load Factor Is 0.75

Trade-off:

```
Low load factor (e.g. 0.5):
    Memory   ↑  (more empty buckets)
    Collisions ↓
    Speed    ↑

High load factor (e.g. 1.0):
    Memory   ↓  (denser packing)
    Collisions ↑
    Speed    ↓
```

At 0.75, collisions per bucket follow a Poisson distribution:

```
Probability of bucket having:
0 entries:  47.2%
1 entry:    35.4%
2 entries:  13.3%
3 entries:   3.3%
8+ entries:  0.00000006%    ← treeification almost never needed
```

0.75 is the empirically optimal balance between memory and speed.

---

## Null Key Handling

```
HashMap:
    null key   → allowed (always stored in bucket 0)
    null value → allowed

Hashtable:
    null key   → NullPointerException
    null value → NullPointerException

ConcurrentHashMap:
    null key   → NullPointerException
    null value → NullPointerException
```

Why ConcurrentHashMap rejects null: in concurrent code, `map.get(key)` returning `null` is ambiguous — does the key not exist, or is the value null? With no nulls allowed, `null` always means "not found."

---

## What Breaks: Missing `hashCode()`

```java
class Employee {
    int id;
    String name;

    Employee(int id, String name) {
        this.id = id;
        this.name = name;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Employee)) return false;
        return this.id == ((Employee) o).id;
    }

    // FORGOT to override hashCode()!
}
```

```java
Map<Employee, String> map = new HashMap<>();

Employee e1 = new Employee(1, "Alice");
Employee e2 = new Employee(1, "Alice");

System.out.println(e1.equals(e2));   // true — same id

map.put(e1, "Engineering");
System.out.println(map.get(e2));     // null!
```

Why `null`?

```
put(e1):
    hash = e1.hashCode()    → Object.hashCode() → 7823
    bucket = 7823 & 15      → 3
    Stored in bucket 3

get(e2):
    hash = e2.hashCode()    → Object.hashCode() → 4510  (DIFFERENT object!)
    bucket = 4510 & 15      → 14
    Looks in bucket 14       → empty → returns null
```

```
table[]
┌─────────┐
│    3    │ → [e1, "Engineering"]     ← e1 is HERE
├─────────┤
│   ...   │
├─────────┤
│   14    │ → null                    ← e2 looks HERE
└─────────┘
```

**Fix:** override `hashCode()` using same fields as `equals()`:

```java
@Override
public int hashCode() {
    return Integer.hashCode(id);
}
```

---

## Treeification

When a bucket's linked list grows beyond **8 nodes** AND table capacity is **>= 64**, HashMap converts the chain to a **Red-Black Tree**.

```
Before (linked list, 9 collisions):

bucket[6] → [A] → [B] → [C] → [D] → [E] → [F] → [G] → [H] → [I]
Lookup: O(n)

After (Red-Black Tree):

bucket[6] →
                [E]
               /   \
             [C]   [G]
            / \    / \
          [B] [D] [F] [H]
          /             \
        [A]             [I]
Lookup: O(log n)
```

**Why it exists:** Hash collision DoS attack. Attacker crafts keys that all hash to same bucket, degrading O(1) to O(n). Treeification limits damage to O(log n).

**Why untreeify at 6 (not 8)?** Hysteresis. Gap of 2 prevents thrashing between list and tree at the boundary.

**Why only when capacity >= 64?** If the table is small (e.g., 16 buckets), the long chain is likely caused by insufficient capacity, not bad hashing. Java resizes the table first. Only if the table is already large and collisions persist does it treeify.

---

## Resize

When `size > capacity * loadFactor`, HashMap doubles the array:

```
Before resize: capacity=4, threshold=3

table[4]
┌───┐
│ 0 │ → [A]
│ 1 │ → [B] → [C]
│ 2 │ → [D]
│ 3 │ → null
└───┘
size = 4 > threshold 3 → RESIZE!

After resize: capacity=8, threshold=6

table[8]
┌───┐
│ 0 │ → [A]          ← stays (hash & 7 == 0)
│ 1 │ → [B]          ← stays
│ 2 │ → [D]          ← stays
│ 3 │ → null
│ 4 │ → null
│ 5 │ → [C]          ← moved! (hash & 7 == 5)
│ 6 │ → null
│ 7 │ → null
└───┘
```

### Resize optimization (advanced)

Java does NOT recompute `hashCode()` during resize. The stored hash value is reused. Each node either:

- **Stays** at the same index, or
- **Moves** to `oldIndex + oldCapacity`

This is determined by checking one bit: `hash & oldCapacity`. If 0, stays. If 1, moves. Much faster than rehashing every key.

---

## Fail-Fast Iterator

HashMap maintains `modCount` — incremented on every structural modification (put, remove).

```java
Iterator<Map.Entry<String, Integer>> it = map.entrySet().iterator();

map.put("new", 42);    // modCount changes

it.next();              // ConcurrentModificationException!
```

The iterator snapshots `modCount` at creation. On each `next()`, it checks if `modCount` changed. If so, it throws immediately rather than returning corrupted data.

**Safe alternatives:**
- Use `ConcurrentHashMap` for concurrent access
- Use `iterator.remove()` instead of `map.remove()` during iteration

---

## Thread Safety

```
HashMap:             ❌ Not synchronized. Use for single-threaded code.

Hashtable:           ✅ Synchronized (every method). Legacy. Never use in new code.

ConcurrentHashMap:   ✅ Concurrent. Lock-free reads, per-node CAS + synchronized on writes (Java 8+).
```

**Interview question:** "Which Map for multithreaded code?"

> ConcurrentHashMap. Never Hashtable. HashMap is not thread-safe — concurrent puts can corrupt the internal structure. In JDK 7, concurrent resize could cause an infinite loop due to linked list reversal. JDK 8 fixed this but HashMap is still not safe for concurrent use.

---

## HashMap vs LinkedHashMap vs TreeMap

```
HashMap:       No order guaranteed
               O(1) get/put
               Use when: you just need fast lookup

LinkedHashMap: Insertion order preserved (or access order)
               O(1) get/put
               Use when: iteration in insertion order
               Use when: LRU Cache (access-order mode with removeEldestEntry)

TreeMap:       Sorted by key (natural order or Comparator)
               O(log n) get/put (Red-Black Tree)
               Use when: sorted keys or range queries (subMap, headMap, tailMap)
```

---

## Interview Answer (30 seconds)

> HashMap uses an array of buckets. When I call `put(key, value)`, it computes `key.hashCode()`, spreads the hash bits by XORing upper 16 bits into lower 16 bits, and finds a bucket index using bitwise AND with capacity minus one — which works because capacity is always a power of two. If the bucket is empty, it inserts a new node. If occupied, it walks the linked list checking `equals()` — if the key exists, it updates the value; otherwise it appends. If the chain exceeds 8 nodes and capacity is at least 64, it treeifies to a Red-Black Tree for O(log n) worst case. When size exceeds capacity times load factor (default 0.75), it doubles the array and repositions entries using a single-bit check rather than rehashing. Correctness depends on the `equals`/`hashCode` contract — if two equal objects return different hash codes, lookups fail silently. HashMap is not thread-safe; for concurrent access, use ConcurrentHashMap.

---

## Practice Exercise

Write this yourself without looking:

1. Create a class `Product` with fields: `int id`, `String name`
2. Override `equals()` by `id` only
3. Override `hashCode()` by `id` only
4. Create a `HashMap<Product, Double>` for prices
5. Put a product with id=1
6. Get it using a DIFFERENT Product object with id=1
7. Verify it returns the correct price
8. Remove the `hashCode()` override and observe it breaks
9. Bonus: mutate the `id` field after insertion and observe lookup failure

---

## Interview Q&A — 46 Questions

### Level 1: Basics

**Q1. What is a HashMap?**

A hash table implementation that stores key-value pairs. Internally it uses an array of buckets where each bucket holds a linked list or Red-Black Tree of nodes.

**Q2. Why do we need HashMap?**

Without HashMap, finding an element requires scanning every entry — O(n). HashMap computes a bucket index using `hashCode()` so it jumps directly to the correct bucket, making lookups O(1) on average.

**Q3. Is HashMap ordered?**

No. It does not maintain insertion order or sorted order. Use `LinkedHashMap` for insertion order, `TreeMap` for sorted order.

**Q4. Does HashMap allow null?**

Yes. One null key (always stored in bucket 0) and multiple null values.

**Q5. Is HashMap synchronized?**

No. It is not thread-safe. Use `ConcurrentHashMap` for concurrent access.

---

### Internal Structure

**Q6. What is inside a HashMap?**

```
Node<K,V>[] table  →  Buckets  →  Linked List  →  Tree (after 8 collisions)
```

**Q7. What is a bucket?**

One slot in the internal `Node[]` array. `table[5]` is bucket 5.

**Q8. What is Node?**

```java
static class Node<K,V> {
    final int hash;      // cached hash — never recomputed
    final K key;
    V value;
    Node<K,V> next;      // chain pointer
}
```

---

### put()

**Q9. Explain put() step by step.**

1. Compute `key.hashCode()`
2. Spread hash: `hash = h ^ (h >>> 16)`
3. Calculate bucket index: `hash & (capacity - 1)`
4. If bucket empty → insert new Node
5. If bucket occupied → traverse chain, check `equals()` for each key
6. If key exists → update value
7. If key not found → append new Node
8. If chain length > 8 and capacity >= 64 → treeify
9. If `size > threshold` → resize

**Q10. Why store hash inside Node?**

Hash comparison (`node.hash == hash`) is a cheap integer check. HashMap does this first before calling the expensive `equals()` method. If hashes differ, `equals()` is skipped entirely.

---

### get()

**Q11. Explain get() step by step.**

1. Compute hash
2. Find bucket: `hash & (capacity - 1)`
3. Traverse bucket chain
4. For each node: compare hash first, then `equals()`
5. If match → return value
6. If end of chain → return null

**Q12. Why doesn't HashMap search every element?**

Hashing directly identifies the bucket. Only nodes in that single bucket are searched, not the entire map.

---

### hashCode()

**Q13. Why is hashCode() needed?**

`hashCode()` tells HashMap which bucket to store or search. Without it, every lookup would require scanning all entries — O(n).

**Q14. Does every class have hashCode()?**

Yes. Every class extends `Object`, which defines `hashCode()`. Default implementation returns a value derived from the object's memory address.

**Q15. Does String override hashCode()?**

Yes. Formula: `h = 31 * h + c` for each character `c`.

**Q16. Why 31?**

- It's an odd prime — good hash distribution
- JVM optimizes `31 * x` to `(x << 5) - x` (bit shift is faster than multiplication)

**Q17. Can two different objects have the same hashCode()?**

Yes. That's called a **collision**. They land in the same bucket and form a chain.

**Q18. Can two equal objects have different hashCode()?**

No. That **breaks** HashMap. If `a.equals(b)` is true but `a.hashCode() != b.hashCode()`, they go to different buckets and `get()` can never find one using the other.

---

### equals()

**Q19. Why is equals() needed?**

`hashCode()` identifies the bucket. `equals()` identifies the exact key within that bucket. Multiple keys can share a bucket, so `equals()` disambiguates.

**Q20. Why must equals() and hashCode() be overridden together?**

The contract:

```
a.equals(b) == true  →  a.hashCode() == b.hashCode()  (MUST)
a.hashCode() == b.hashCode()  →  a.equals(b)           (NOT required, just a collision)
```

If you override `equals()` without `hashCode()`, two logically equal objects may hash to different buckets, making lookup fail silently.

---

### Bucket Calculation

**Q21. How is the bucket index calculated?**

```java
index = hash & (capacity - 1)
```

**Q22. Why not use `%` (modulo)?**

Modulo requires integer division — expensive. Bitwise AND is a single CPU instruction. `hash & (capacity - 1)` is equivalent to `hash % capacity` when capacity is a power of two.

**Q23. Why is capacity always a power of two?**

Because `hash & (capacity - 1)` only produces correct uniform distribution when capacity is a power of two:

```
capacity   = 16  = 10000 (binary)
capacity-1 = 15  = 01111 (binary)

hash & 01111  →  extracts lower 4 bits  →  index 0-15
```

---

### Hash Spreading

**Q24. Why does HashMap do `hash ^ (hash >>> 16)`?**

To mix the upper 16 bits into the lower 16 bits. Since bucket index uses only the lower bits (`hash & (capacity-1)`), without spreading, the upper bits are wasted. This reduces collisions when keys have poor hash functions.

**Q25. Why not use hashCode() directly?**

Some classes produce hash codes where all variation is in the upper bits. Direct use would cause many keys to collide in the same few buckets. Hash spreading distributes entries more evenly.

---

### Collision Handling

**Q26. What is a collision?**

Two different keys map to the same bucket index.

**Q27. How are collisions handled?**

By chaining: nodes in the same bucket form a linked list. Each `put()` appends to the chain; each `get()` traverses it.

**Q28. What happens when the chain exceeds 8 nodes?**

If table capacity >= 64, the linked list is converted to a **Red-Black Tree**. Lookup improves from O(n) to O(log n) for that bucket.

**Q29. Why does treeification require capacity >= 64?**

If the table is small, collisions are likely due to insufficient capacity, not bad hashing. Java prefers resizing the table first. Only when the table is already large and collisions persist does it build the more expensive tree structure.

---

### Resize

**Q30. When does resize happen?**

When `size > capacity * loadFactor`. Default: `size > 16 * 0.75 = 12`.

**Q31. What is the default capacity?**

16.

**Q32. What is the default load factor?**

0.75.

**Q33. Why 0.75?**

Empirically optimal balance:

```
Lower (0.5): fewer collisions, more memory, faster
Higher (1.0): more collisions, less memory, slower
0.75: best tradeoff — Poisson distribution gives ~0.00000006% chance of 8+ collisions per bucket
```

**Q34. What is the complexity of resize?**

O(n). Every entry is repositioned. But Java optimizes: it reuses the stored hash and checks a single bit (`hash & oldCapacity`) to decide if a node stays or moves to `oldIndex + oldCapacity`. No `hashCode()` recalculation.

---

### Complexity

**Q35. put() complexity?**

Average O(1). Worst O(n), or O(log n) after treeification.

**Q36. get() complexity?**

Average O(1). Worst O(n), or O(log n) after treeification.

**Q37. remove() complexity?**

Average O(1). Worst O(n), or O(log n) after treeification.

---

### Chain and Treeification Details

**Q38. What is chain length?**

Number of nodes in one bucket's linked list.

**Q39. Is threshold the same as chain length limit?**

No. `threshold` controls resize (total entries). Chain length of 8 controls treeification (per-bucket).

**Q40. Is there a maximum chain length?**

No hard limit. Even after treeification, thousands of nodes can exist in one bucket — they're stored as a balanced Red-Black Tree with O(log n) operations.

---

### Advanced

**Q41. Why store hash in Node instead of recomputing?**

Avoids calling `hashCode()` repeatedly. During `get()`, `put()`, and resize, the cached hash is reused for fast integer comparison before the more expensive `equals()`.

**Q42. What happens if hashCode() always returns 1?**

Every key goes to the same bucket. HashMap degrades to a linked list (or tree after 8 entries). Worst-case lookup becomes O(n) or O(log n).

**Q43. Why is HashMap average O(1) even though it traverses the chain?**

Because the average chain length stays near the load factor (0.75). HashMap resizes before chains grow long. With good hash distribution, most buckets have 0 or 1 entries.

**Q44. Why treeify at 8 but untreeify at 6?**

Hysteresis. If both thresholds were 8, a bucket at exactly 8 entries would flip between list and tree on every add/remove. The gap of 2 prevents this thrashing.

**Q45. Difference between HashMap and Hashtable?**

| | HashMap | Hashtable |
|---|---|---|
| Synchronized | No | Yes (every method) |
| Null key | Allowed (one) | NullPointerException |
| Null value | Allowed | NullPointerException |
| Performance | Faster | Slower |
| Usage | Modern code | Legacy — never use |

**Q46. Difference between HashMap and ConcurrentHashMap?**

| | HashMap | ConcurrentHashMap |
|---|---|---|
| Thread-safe | No | Yes |
| Null key/value | Allowed | NullPointerException |
| Locking | None | Per-node CAS + synchronized (Java 8+) |
| Read performance | Fast | Fast (lock-free reads) |
| Write performance | Fast | Slightly slower (synchronization overhead) |
| Use case | Single-threaded | Multi-threaded |

ConcurrentHashMap rejects null because in concurrent code, `get()` returning `null` is ambiguous — does the key not exist, or is the value null?
