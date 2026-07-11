# equals() and hashCode() — Complete Mentor Guide

> Date: 2026-07-11 | Topic: Core Java / Object Contract | Connected DSA: Arrays & Hashing, HashMap, HashSet

---

## One-Line

`equals()` decides whether two objects are logically the same, and `hashCode()` decides which hash bucket they belong to.

For hash-based collections like `HashMap` and `HashSet`, both must agree.

---

## Why It Exists

Java has two different questions:

```text
1. Are these two references pointing to the exact same object?
2. Are these two different objects logically equal?
```

These are not the same.

Example:

```java
Employee e1 = new Employee(1, "Alice");
Employee e2 = new Employee(1, "Alice");
```

Memory:

```text
Heap:

0x100  Employee{id=1, name="Alice"}   ← e1 points here
0x200  Employee{id=1, name="Alice"}   ← e2 points here
```

Reference comparison:

```java
e1 == e2
```

asks:

```text
Do e1 and e2 point to the same memory object?
```

Answer:

```text
false
```

Logical comparison:

```java
e1.equals(e2)
```

should ask:

```text
Do these two employees represent the same real employee?
```

If employee identity is based on `id`, answer should be:

```text
true
```

That is why `equals()` exists.

And because `HashMap` needs to place equal objects in the same bucket, `hashCode()` exists.

---

## Visual: `==` vs `equals()`

```java
Employee e1 = new Employee(1, "Alice");
Employee e2 = new Employee(1, "Alice");
Employee e3 = e1;
```

Memory:

```text
Stack references:

e1 ─────┐
        │
        ▼
      Object A: Employee{id=1, name="Alice"}
        ▲
        │
e3 ─────┘

e2 ─────────▶ Object B: Employee{id=1, name="Alice"}
```

Results:

```java
e1 == e2        // false  (different objects)
e1 == e3        // true   (same object)

e1.equals(e2)   // depends on your equals() implementation
e1.equals(e3)   // true, because same object should always equal itself
```

If `equals()` is based on `id`:

```java
e1.equals(e2)   // true
```

because both have:

```text
id = 1
```

---

## Default Object Behavior

Every Java class implicitly extends `Object`.

So every class inherits:

```java
public boolean equals(Object obj)
public int hashCode()
public String toString()
```

Default `Object.equals()` behaves like `==`.

Conceptually:

```java
public boolean equals(Object obj) {
    return this == obj;
}
```

Default `Object.hashCode()` is identity-based. It is related to the object identity, not your fields.

So if you do not override anything:

```java
Employee e1 = new Employee(1, "Alice");
Employee e2 = new Employee(1, "Alice");

System.out.println(e1.equals(e2));    // false
System.out.println(e1.hashCode());    // maybe 123456
System.out.println(e2.hashCode());    // maybe 987654
```

Even though fields are identical, Java treats them as different objects.

---

## The Contract

The most important rule:

```text
If a.equals(b) is true,
then a.hashCode() must equal b.hashCode().
```

In code:

```java
if (a.equals(b)) {
    assert a.hashCode() == b.hashCode();
}
```

But the reverse is not required.

This is allowed:

```text
a.hashCode() == b.hashCode()
but
a.equals(b) == false
```

That is just a hash collision.

### Short Version

```text
equals true  -> hashCode must be same
hashCode same -> equals may be true or false
```

### Why?

Because `HashMap` first uses `hashCode()` to find the bucket, then uses `equals()` inside that bucket.

If two equal objects produce different hash codes, they go to different buckets and never meet.

---

## equals() Rules

`equals()` must satisfy five rules.

### 1. Reflexive

An object must equal itself.

```java
a.equals(a) == true
```

Example:

```java
Employee e = new Employee(1, "Alice");
e.equals(e); // must be true
```

### 2. Symmetric

If `a` equals `b`, then `b` must equal `a`.

```java
a.equals(b) == true
b.equals(a) == true
```

Bad example:

```java
class Money {
    int amount;

    public boolean equals(Object o) {
        if (o instanceof Money) {
            return this.amount == ((Money) o).amount;
        }
        return false;
    }
}

class Voucher extends Money {
    String code;

    public boolean equals(Object o) {
        if (o instanceof Voucher) {
            return this.amount == ((Voucher) o).amount
                && this.code.equals(((Voucher) o).code);
        }
        return false;
    }
}
```

Possible problem:

```text
money.equals(voucher)   -> true
voucher.equals(money)   -> false
```

That breaks symmetry.

### 3. Transitive

If `a == b` logically and `b == c` logically, then `a == c` logically.

```text
if a.equals(b) and b.equals(c)
then a.equals(c) must also be true
```

### 4. Consistent

Repeated calls should return the same result unless fields used in equality change.

```java
a.equals(b)
a.equals(b)
a.equals(b)
```

should not randomly change.

### 5. Non-null

Any object compared to `null` must return false.

```java
a.equals(null) == false
```

Never throw `NullPointerException`.

---

## Correct Implementation

Let's say employee identity is based only on `id`.

Then `equals()` and `hashCode()` should both use `id`.

```java
import java.util.Objects;

class Employee {
    private final int id;
    private final String name;

    Employee(int id, String name) {
        this.id = id;
        this.name = name;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (!(obj instanceof Employee)) {
            return false;
        }

        Employee other = (Employee) obj;
        return this.id == other.id;
    }

    @Override
    public int hashCode() {
        return Integer.hashCode(id);
    }

    @Override
    public String toString() {
        return "Employee{id=" + id + ", name='" + name + "'}";
    }
}
```

### Why each part exists

```java
if (this == obj) return true;
```

Fast path. Same reference means definitely equal.

```java
if (!(obj instanceof Employee)) return false;
```

If the other object is not an `Employee`, it cannot be equal.

```java
Employee other = (Employee) obj;
return this.id == other.id;
```

Compare business identity.

```java
return Integer.hashCode(id);
```

Hash code uses the same field as `equals()`.

That is the contract.

---

## Trace: Correct HashMap Lookup

```java
Map<Employee, String> departments = new HashMap<>();

Employee e1 = new Employee(1, "Alice");
Employee e2 = new Employee(1, "Alice Clone");

departments.put(e1, "Engineering");

System.out.println(departments.get(e2));
```

Expected output:

```text
Engineering
```

Why?

```text
e1.equals(e2) == true
e1.hashCode() == e2.hashCode()
```

HashMap trace:

```text
put(e1):
    e1.hashCode() -> 1
    bucket index -> hash & (capacity - 1)
    store Node(hash=1, key=e1, value="Engineering")

get(e2):
    e2.hashCode() -> 1
    same bucket
    compare e2.equals(e1) -> true
    return "Engineering"
```

Visual:

```text
table[]
┌─────────┐
│ bucket1 │ → [hash=1, key=e1, value="Engineering"]
└─────────┘

get(e2):
  hash=1 -> bucket1
  e2.equals(e1) -> true
  return value
```

This works.

---

## What Breaks 1: Override equals() but NOT hashCode()

Bad class:

```java
class Employee {
    private final int id;
    private final String name;

    Employee(int id, String name) {
        this.id = id;
        this.name = name;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (!(obj instanceof Employee)) {
            return false;
        }

        Employee other = (Employee) obj;
        return this.id == other.id;
    }

    // hashCode() is missing!
}
```

Demo:

```java
Map<Employee, String> departments = new HashMap<>();

Employee e1 = new Employee(1, "Alice");
Employee e2 = new Employee(1, "Alice Clone");

System.out.println(e1.equals(e2)); // true

departments.put(e1, "Engineering");

System.out.println(departments.get(e2)); // null
```

Why?

```text
e1.equals(e2) == true
but
e1.hashCode() != e2.hashCode()
```

Because without overriding `hashCode()`, Java uses `Object.hashCode()`, which is identity-based.

Trace:

```text
put(e1):
    e1.hashCode() -> 12345
    bucket -> 9
    store e1 in bucket 9

get(e2):
    e2.hashCode() -> 98765
    bucket -> 4
    bucket 4 is empty
    return null
```

Visual:

```text
table[]
┌──────────┐
│ bucket 4 │ → null                       ← get(e2) looks here
├──────────┤
│ bucket 9 │ → [e1, "Engineering"]        ← put(e1) stored here
└──────────┘
```

They never meet.

This is the classic interview bug.

---

## What Breaks 2: Mutable Key

Even if `equals()` and `hashCode()` are correct, a mutable key can still break `HashMap`.

Bad class:

```java
class Employee {
    int id;
    String name;

    Employee(int id, String name) {
        this.id = id;
        this.name = name;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (!(obj instanceof Employee)) {
            return false;
        }

        Employee other = (Employee) obj;
        return this.id == other.id;
    }

    @Override
    public int hashCode() {
        return Integer.hashCode(id);
    }
}
```

Demo:

```java
Map<Employee, String> map = new HashMap<>();

Employee e = new Employee(1, "Alice");

map.put(e, "Engineering");

System.out.println(map.get(e)); // Engineering

e.id = 2; // dangerous mutation

System.out.println(map.get(e)); // null
```

Why?

When inserted:

```text
id = 1
hashCode = 1
bucket = bucket 1
```

After mutation:

```text
id = 2
hashCode = 2
HashMap now searches bucket 2
```

But the node is still physically stored in bucket 1.

Visual:

```text
Before mutation:

bucket 1 → [Employee{id=1}, "Engineering"]

After mutation:

same object now has id=2

bucket 1 → [Employee{id=2}, "Engineering"]

get(e):
  e.hashCode() = 2
  goes to bucket 2
  bucket 2 is empty
  returns null
```

The entry is now "lost" inside the map.

It still exists, but normal lookup cannot find it.

### Rule

Fields used in `equals()` and `hashCode()` should be immutable.

Best practice:

```java
private final int id;
```

---

## What Breaks 3: Arrays as Keys

Arrays do not override `equals()` and `hashCode()`.

So:

```java
int[] a = {1, 2};
int[] b = {1, 2};

System.out.println(a == b);          // false
System.out.println(a.equals(b));     // false
System.out.println(Arrays.equals(a, b)); // true
```

Why?

```text
a.equals(b)
```

uses `Object.equals()`, which behaves like:

```text
a == b
```

They are different array objects, so false.

This breaks HashMap:

```java
Map<int[], String> map = new HashMap<>();

int[] a = {1, 2};
int[] b = {1, 2};

map.put(a, "hello");

System.out.println(map.get(b)); // null
```

Trace:

```text
put(a):
    a.hashCode() -> identity hash 100
    bucket 4

get(b):
    b.hashCode() -> identity hash 200
    bucket 8

not found
```

Correct alternatives:

```java
String key = Arrays.toString(a);
```

or create a wrapper class that overrides `equals()` and `hashCode()`.

This is exactly why `Group Anagrams` cannot use `int[]` directly as the key.

---

## What Breaks 4: Inconsistent Fields

If `equals()` uses `id`, then `hashCode()` must use `id`.

Bad:

```java
class Employee {
    int id;
    String name;

    @Override
    public boolean equals(Object obj) {
        if (!(obj instanceof Employee)) {
            return false;
        }

        Employee other = (Employee) obj;
        return this.id == other.id;
    }

    @Override
    public int hashCode() {
        return Objects.hash(name); // wrong field
    }
}
```

Problem:

```java
Employee e1 = new Employee(1, "Alice");
Employee e2 = new Employee(1, "Alicia");
```

If equality is based on `id`:

```text
e1.equals(e2) == true
```

But hash codes use `name`:

```text
e1.hashCode() != e2.hashCode()
```

Contract broken.

Rule:

```text
Fields used in equals() must also be used in hashCode().
```

---

## `Objects.equals()` and `Objects.hash()`

For nullable object fields, use `Objects.equals()`.

Example:

```java
import java.util.Objects;

class Employee {
    private final int id;
    private final String email;

    Employee(int id, String email) {
        this.id = id;
        this.email = email;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (!(obj instanceof Employee)) {
            return false;
        }

        Employee other = (Employee) obj;
        return this.id == other.id
            && Objects.equals(this.email, other.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, email);
    }
}
```

Why `Objects.equals()`?

It is null-safe.

```java
Objects.equals(a, b)
```

means:

```text
if both null -> true
if one null -> false
else -> a.equals(b)
```

Without it:

```java
this.email.equals(other.email)
```

can throw `NullPointerException` if `email` is null.

### Caution about `Objects.hash()`

```java
Objects.hash(id, email)
```

is convenient but creates an array internally:

```java
Object... values
```

For normal business objects, fine.

For high-performance code, write manual hash:

```java
int result = Integer.hashCode(id);
result = 31 * result + Objects.hashCode(email);
return result;
```

---

## `instanceof` vs `getClass()`

Two common styles:

### Style 1: `instanceof`

```java
if (!(obj instanceof Employee)) {
    return false;
}
```

Allows subclass equality.

### Style 2: `getClass()`

```java
if (obj == null || obj.getClass() != this.getClass()) {
    return false;
}
```

Requires exact same class.

### Which one to use?

For most domain entities, prefer `getClass()` if inheritance equality is tricky.

For simple final classes, either is fine.

Best simple approach:

```java
final class Employee {
    ...
}
```

If the class is `final`, no subclass can break symmetry.

---

## Java Records

Records automatically generate correct `equals()` and `hashCode()`.

```java
record Employee(int id, String name) {}
```

Java generates:

```text
constructor
accessors
equals()
hashCode()
toString()
```

Demo:

```java
Employee e1 = new Employee(1, "Alice");
Employee e2 = new Employee(1, "Alice");

System.out.println(e1.equals(e2)); // true
System.out.println(e1.hashCode() == e2.hashCode()); // true
```

Records compare all components.

If you want equality only by `id`, do not blindly use record-generated equality unless all fields define identity.

---

## Full Runnable Demo

```java
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class EqualsHashCodeDemo {
    public static void main(String[] args) {
        correctKeyWorks();
        equalsWithoutHashCodeBreaks();
        mutableKeyBreaks();
        arrayKeyBreaks();
    }

    private static void correctKeyWorks() {
        Map<Employee, String> map = new HashMap<>();

        Employee e1 = new Employee(1, "Alice");
        Employee e2 = new Employee(1, "Alice Clone");

        map.put(e1, "Engineering");

        System.out.println("Correct key:");
        System.out.println(map.get(e2)); // Engineering
    }

    private static void equalsWithoutHashCodeBreaks() {
        Map<BrokenEmployee, String> map = new HashMap<>();

        BrokenEmployee e1 = new BrokenEmployee(1, "Alice");
        BrokenEmployee e2 = new BrokenEmployee(1, "Alice Clone");

        map.put(e1, "Engineering");

        System.out.println("Broken hashCode:");
        System.out.println(map.get(e2)); // null
    }

    private static void mutableKeyBreaks() {
        Map<MutableEmployee, String> map = new HashMap<>();

        MutableEmployee e = new MutableEmployee(1, "Alice");

        map.put(e, "Engineering");
        System.out.println("Before mutation:");
        System.out.println(map.get(e)); // Engineering

        e.id = 2;

        System.out.println("After mutation:");
        System.out.println(map.get(e)); // null
    }

    private static void arrayKeyBreaks() {
        Map<int[], String> map = new HashMap<>();

        int[] a = {1, 2};
        int[] b = {1, 2};

        map.put(a, "hello");

        System.out.println("Array key:");
        System.out.println(map.get(b)); // null
    }

    static final class Employee {
        private final int id;
        private final String name;

        Employee(int id, String name) {
            this.id = id;
            this.name = name;
        }

        @Override
        public boolean equals(Object obj) {
            if (this == obj) {
                return true;
            }

            if (!(obj instanceof Employee)) {
                return false;
            }

            Employee other = (Employee) obj;
            return this.id == other.id;
        }

        @Override
        public int hashCode() {
            return Integer.hashCode(id);
        }
    }

    static final class BrokenEmployee {
        private final int id;
        private final String name;

        BrokenEmployee(int id, String name) {
            this.id = id;
            this.name = name;
        }

        @Override
        public boolean equals(Object obj) {
            if (this == obj) {
                return true;
            }

            if (!(obj instanceof BrokenEmployee)) {
                return false;
            }

            BrokenEmployee other = (BrokenEmployee) obj;
            return this.id == other.id;
        }

        // hashCode missing intentionally
    }

    static final class MutableEmployee {
        int id;
        String name;

        MutableEmployee(int id, String name) {
            this.id = id;
            this.name = name;
        }

        @Override
        public boolean equals(Object obj) {
            if (this == obj) {
                return true;
            }

            if (!(obj instanceof MutableEmployee)) {
                return false;
            }

            MutableEmployee other = (MutableEmployee) obj;
            return this.id == other.id;
        }

        @Override
        public int hashCode() {
            return Integer.hashCode(id);
        }
    }
}
```

---

## Interview Answer — 30 Seconds

> In Java, `==` checks whether two references point to the same object, while `equals()` checks logical equality if the class overrides it. `hashCode()` is used by hash-based collections like `HashMap` and `HashSet` to choose the bucket. The contract is: if two objects are equal according to `equals()`, they must return the same hash code. If this is violated, a `HashMap` may store an object in one bucket and later search for an equal object in a different bucket, causing lookup failure. Also, fields used in `equals()` and `hashCode()` should be immutable while the object is used as a key, otherwise the object can become unreachable inside the map.

---

## Why hashCode() Returns int, Not Bucket Index

`hashCode()` returns a 32-bit `int`.

It does **not** return the bucket index.

Example:

```java
int hash = employee.hashCode();
```

This hash can be any `int` value:

```text
-2,147,483,648 to 2,147,483,647
```

But a `HashMap` table may have only:

```text
16 buckets
32 buckets
64 buckets
```

So Java must convert the 32-bit hash into a valid bucket index.

HashMap does this:

```java
index = (n - 1) & hash;
```

where:

```text
n = table capacity
```

Example:

```text
n = 16
n - 1 = 15

index = hash & 15
```

This produces an index from:

```text
0 to 15
```

So the flow is:

```text
object fields
   ↓
hashCode() returns 32-bit int
   ↓
HashMap spreads hash bits
   ↓
HashMap converts hash to bucket index
```

Interview sentence:

> `hashCode()` does not directly decide the bucket. It returns a 32-bit integer, and HashMap maps that integer into the table range using `(n - 1) & hash`.

---

## Simplified HashMap get() Algorithm

This is the clearest way to connect `hashCode()` and `equals()`.

Simplified logic:

```java
V get(Object key) {
    int h = key.hashCode();
    int hash = h ^ (h >>> 16);
    int index = (table.length - 1) & hash;

    Node<K,V> current = table[index];

    while (current != null) {
        if (current.hash == hash && key.equals(current.key)) {
            return current.value;
        }

        current = current.next;
    }

    return null;
}
```

Important order:

```text
1. hashCode() decides candidate bucket
2. stored hash is compared first
3. equals() confirms exact key
```

Why compare hash before `equals()`?

Because integer comparison is cheap:

```java
current.hash == hash
```

Calling `equals()` may be expensive, especially if it compares many fields.

So HashMap first asks:

```text
Could this be the same key based on hash?
```

Only then:

```text
Is this logically the same key based on equals?
```

---

## Hash Spreading

HashMap does not use `hashCode()` directly.

It spreads the hash:

```java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
```

Why?

HashMap bucket index uses lower bits:

```java
index = (n - 1) & hash;
```

If `n = 16`, only the lower 4 bits are used:

```text
n - 1 = 15 = 0000 1111
```

Problem:

Some `hashCode()` implementations have useful variation in upper bits but poor variation in lower bits.

Without spreading:

```text
upper bits may be ignored
lower bits decide bucket
many keys collide
```

With spreading:

```text
h ^ (h >>> 16)
```

mixes high bits into low bits.

This improves bucket distribution.

Interview sentence:

> HashMap spreads the hash because table indexing uses lower bits. Mixing upper bits into lower bits reduces collisions when hashCode implementations have poor lower-bit distribution.

---

## Why 31 Is Common in hashCode()

Manual hash code often looks like:

```java
int result = Integer.hashCode(id);
result = 31 * result + Objects.hashCode(email);
return result;
```

Why `31`?

### 1. It is an odd prime

Prime numbers tend to distribute combinations better than many composite numbers.

### 2. It reduces simple collision patterns

If you combine fields with a small or even multiplier, different field combinations can collide more easily.

### 3. It is efficient

The JVM can optimize:

```java
31 * x
```

as:

```text
(x << 5) - x
```

because:

```text
32x - x = 31x
```

### 4. It is a Java convention

Many JDK classes historically used `31`, especially `String.hashCode()`.

You do not need to worship `31`.

The important idea is:

```text
combine all fields used in equals()
use stable deterministic logic
avoid terrible distribution
```

---

## Objects.hash() vs Manual hashCode()

Convenient version:

```java
@Override
public int hashCode() {
    return Objects.hash(id, email);
}
```

This is readable and fine for normal business classes.

But internally it uses varargs:

```java
Object... values
```

That means an array is created.

For most backend domain objects:

```text
Objects.hash() is fine.
```

For performance-critical classes used millions of times:

```text
manual hashCode() is better.
```

Manual version:

```java
@Override
public int hashCode() {
    int result = Integer.hashCode(id);
    result = 31 * result + Objects.hashCode(email);
    return result;
}
```

Rule:

```text
Business code:          Objects.hash() is okay
Performance hot path:   write manual hashCode()
```

---

## HashSet Example

`HashSet` uses `HashMap` internally.

Conceptually:

```java
set.add(employee)
```

behaves like:

```java
map.put(employee, PRESENT)
```

where `PRESENT` is a dummy object.

Correct example:

```java
Set<Employee> set = new HashSet<>();

set.add(new Employee(1, "Alice"));
set.add(new Employee(1, "Alice Clone"));

System.out.println(set.size()); // 1
```

Why `1`?

Because:

```text
first Employee goes into bucket based on id hash
second Employee has same hash
equals() returns true
HashSet treats it as duplicate
```

Broken example: `equals()` without `hashCode()`.

```java
Set<BrokenEmployee> set = new HashSet<>();

set.add(new BrokenEmployee(1, "Alice"));
set.add(new BrokenEmployee(1, "Alice Clone"));

System.out.println(set.size()); // 2
```

Why `2`?

Because both objects may land in different buckets, so the set never discovers they are logically equal.

Interview sentence:

> HashSet uniqueness depends on the same equals/hashCode contract as HashMap keys, because HashSet is backed by HashMap.

---

## IdentityHashMap

`IdentityHashMap` is different from `HashMap`.

```text
HashMap:
    uses equals()
    uses hashCode()

IdentityHashMap:
    uses ==
    uses System.identityHashCode()
```

Example:

```java
Map<Employee, String> map = new IdentityHashMap<>();

Employee e1 = new Employee(1, "Alice");
Employee e2 = new Employee(1, "Alice");

map.put(e1, "first");
map.put(e2, "second");

System.out.println(map.size()); // 2
```

Even if:

```java
e1.equals(e2) == true
```

`IdentityHashMap` treats them as different because:

```java
e1 == e2
```

is false.

Use cases:

```text
object graph traversal
serialization frameworks
proxy tracking
cycle detection by object identity
```

Do not use it for normal business key lookup.

---

## System.identityHashCode()

Normally:

```java
obj.hashCode()
```

may call your overridden `hashCode()`.

But:

```java
System.identityHashCode(obj)
```

returns an identity-based hash code, ignoring overrides.

Example:

```java
Employee e1 = new Employee(1, "Alice");
Employee e2 = new Employee(1, "Alice");

System.out.println(e1.hashCode());                 // 1, if overridden by id
System.out.println(e2.hashCode());                 // 1

System.out.println(System.identityHashCode(e1));   // different identity hash
System.out.println(System.identityHashCode(e2));   // different identity hash
```

This helps when debugging object identity vs logical equality.

---

## Lombok @EqualsAndHashCode

Modern Java projects often use Lombok:

```java
import lombok.EqualsAndHashCode;

@EqualsAndHashCode
class Employee {
    private int id;
    private String name;
    private String department;
}
```

This generates `equals()` and `hashCode()` automatically.

But be careful.

By default, Lombok may include all non-static fields.

That may be wrong.

Example:

```text
Employee identity should be id
but Lombok includes name and department
```

Then changing department can change equality and hash code.

Better:

```java
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
class Employee {
    @EqualsAndHashCode.Include
    private final int id;

    private String name;
    private String department;
}
```

Rule:

```text
Lombok saves typing, not thinking.
You still decide identity fields.
```

---

## IDE Generation

Most developers do not manually write these methods every time.

In IntelliJ:

```text
Right click
Generate
equals() and hashCode()
Choose fields
```

This is useful.

But the IDE cannot decide business identity for you.

You must decide:

```text
Should equality use id?
email?
all fields?
```

Generated code is only as correct as your field selection.

---

## Object Documentation Contract

These rules are not style preferences.

They come from Java's `Object.equals()` and `Object.hashCode()` specifications.

`equals()` must be:

```text
reflexive
symmetric
transitive
consistent
false for null
```

`hashCode()` must be:

```text
consistent during execution if equality fields do not change
same for equal objects
not necessarily different for unequal objects
```

This is a language-level contract.

Collections like `HashMap`, `HashSet`, and `Hashtable` rely on it.

---

## Deep Equality for Arrays

For one-dimensional arrays:

```java
int[] a = {1, 2};
int[] b = {1, 2};

Arrays.equals(a, b);    // true
Arrays.hashCode(a);     // content-based hash
```

For nested arrays:

```java
String[][] a = {
    {"A", "B"},
    {"C", "D"}
};

String[][] b = {
    {"A", "B"},
    {"C", "D"}
};
```

Use:

```java
Arrays.deepEquals(a, b);
Arrays.deepHashCode(a);
```

Why?

For object arrays, normal `Arrays.equals()` compares elements using `equals()`.

But if those elements are arrays, their `equals()` is still reference equality.

So nested arrays need `deepEquals()`.

---

## Mutability Best Practice

Only immutable fields should participate in `equals()` and `hashCode()`.

Good:

```java
class Employee {
    private final int id;
    private String name;
    private String address;

    // equals/hashCode use only id
}
```

Risky:

```java
class Employee {
    private int id;
    private String name;
    private String address;

    // equals/hashCode use name and address
}
```

Why risky?

Names and addresses can change.

If the object is inside a `HashSet` or used as a `HashMap` key, changing those fields can make the object unreachable.

Rule:

```text
Mutable fields should usually not be part of equality/hash.
```

---

## Business Identity vs Database Identity

This is a senior-level design question.

Example:

```java
class Employee {
    Long id;        // database id
    String email;   // business identifier
    String name;
    BigDecimal salary;
}
```

What should equality use?

Options:

```text
id?
email?
all fields?
```

Answer:

```text
Equality should reflect business identity.
```

If `email` uniquely identifies an employee before persistence, use email.

If database `id` is assigned only after saving, using `id` can be tricky for transient objects.

If you use all fields, changing `name` or `salary` changes equality, which is usually wrong.

Typical guidance:

```text
Entities: choose stable business key carefully, or use DB id only after persistence with caution.
Value Objects: compare all meaningful fields.
DTOs/Records: all-field equality is often fine.
```

Example:

```text
Money(amount=10, currency=USD)
```

is a value object. Equality should use all fields.

```text
Employee(id=123, name=Alice, salary=100000)
```

is an entity. Equality should usually not depend on salary.

---

## Poor Hash Function Impact

Bad hash function:

```java
@Override
public int hashCode() {
    return 1;
}
```

Now every object goes to the same bucket.

Visual:

```text
bucket[1] → A → B → C → D → E → F → G → H → I
```

Lookup becomes:

```text
O(n)
```

because HashMap must traverse the chain.

Since Java 8, heavily-collided buckets can treeify:

```text
linked list → red-black tree
```

Then worst-case lookup improves to:

```text
O(log n)
```

But good hashing is still important because:

```text
tree nodes use more memory
tree operations are slower than normal O(1) bucket lookup
collisions hurt cache locality
```

Interview sentence:

> A poor hash function increases collisions, which increases bucket traversal and degrades expected O(1) lookup toward O(n), or O(log n) after Java 8 treeification.

---

## Interview Q&A

### Q1. What is the difference between `==` and `equals()`?

`==` compares references. It checks whether both variables point to the exact same object.

`equals()` checks logical equality if the class overrides it.

### Q2. What is the default behavior of `Object.equals()`?

It behaves like `==`.

Conceptually:

```java
return this == obj;
```

### Q3. What is the default behavior of `Object.hashCode()`?

It is identity-based. Two different objects usually have different hash codes even if their fields are identical.

### Q4. What is the equals/hashCode contract?

If two objects are equal using `equals()`, they must have the same `hashCode()`.

```text
a.equals(b) == true  ->  a.hashCode() == b.hashCode()
```

### Q5. If two objects have same hashCode(), must they be equal?

No.

Same hash code can happen because of collision.

```text
same hashCode does not guarantee equals()
```

### Q6. Why override both together?

Because `HashMap` uses `hashCode()` first to find the bucket and `equals()` second to find the exact key.

If `equals()` says two objects are equal but `hashCode()` differs, lookups fail.

### Q7. What happens if you override equals() but not hashCode()?

Two logically equal objects may go to different HashMap buckets.

Then:

```java
map.put(e1, value);
map.get(e2);
```

can return `null` even if:

```java
e1.equals(e2) == true
```

### Q8. Can hashCode collisions happen?

Yes.

Two unequal objects can have the same hash code.

HashMap handles this by storing them in the same bucket and using `equals()` to distinguish them.

### Q9. Why should HashMap keys be immutable?

If a field used in `hashCode()` changes after insertion, the object's bucket location becomes wrong. The object remains in the old bucket, but lookup searches the new bucket.

### Q10. Do arrays override equals() and hashCode()?

No.

Arrays use reference equality.

Use:

```java
Arrays.equals(a, b)
Arrays.hashCode(a)
```

or convert to a content-based key like `Arrays.toString(a)`.

---

## Practice Exercise

Write this without looking:

1. Create `Product` with `id` and `name`
2. Implement `equals()` based only on `id`
3. Implement `hashCode()` based only on `id`
4. Put `new Product(1, "Phone")` into `HashMap<Product, Integer>`
5. Retrieve using `new Product(1, "iPhone")`
6. Confirm it works
7. Remove `hashCode()` and observe lookup failure
8. Make `id` mutable, mutate after insert, observe lookup failure

Can you explain this back to me?
