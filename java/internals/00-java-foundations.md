# Phase 0 — Java Foundations: The Knowledge That Separates Professionals from Beginners

> You don't become a senior Java developer by learning frameworks. You become one by understanding the language so deeply that frameworks become obvious.

Most Java developers with 1-5 years of experience know *how* to write Java — they can create classes, implement interfaces, use collections, and write Spring Boot applications. But they don't know *why* Java works the way it does. They don't know why `String` is immutable, why you should prefer composition over inheritance, why `equals()` and `hashCode()` must be overridden together, or why their `ArrayList` throws `ConcurrentModificationException` during iteration. They memorize rules without understanding the reasoning, and when they encounter a situation the rules don't cover, they're lost.

This document builds the deep foundational understanding that makes everything else in Java — concurrency, performance, frameworks, system design — click into place. Every topic is explained not just as "what it is" but "why it exists," "what problem it solves," "what goes wrong when you misuse it," and "how a senior developer thinks about it."

---

## 1. Object-Oriented Programming — What It Actually Means

### Why OOP Exists — The Problem It Solves

Before OOP, programs were written as sequences of procedures operating on shared data structures. This worked for small programs, but as programs grew to thousands and millions of lines, a fundamental problem emerged: **every procedure could modify any data structure, and any change to a data structure could break any procedure that used it.** The cost of change grew exponentially with program size. Adding a field to a struct meant reviewing every function that touched it. A bug in one function could corrupt data that another function depended on. Testing was nearly impossible because everything was connected to everything.

OOP solves this by bundling data and the operations that work on that data into a single unit — the **object**. An object controls access to its own data (encapsulation), exposes only the operations that make sense for its abstraction (information hiding), and can be replaced with a different implementation without changing the code that uses it (polymorphism). This doesn't make programs simpler — it makes programs **manageable** at scale.

The four pillars of OOP are not abstract concepts — they're engineering solutions to specific problems:

- **Encapsulation:** "Don't let anyone corrupt my internal state." Fields are private, access is through methods that enforce invariants.
- **Abstraction:** "Don't make users care about my implementation." Expose what something *does*, not how it does it.
- **Inheritance:** "Don't repeat yourself across similar types." Share common behavior through a parent class.
- **Polymorphism:** "Let me swap implementations without changing the caller." Program to interfaces, not concrete classes.

### Classes and Objects — The Mental Model

A **class** is a blueprint — it defines what fields an object will have and what methods it can perform. An **object** is a specific instance of that class, living on the heap, with its own copy of every instance field. This distinction seems obvious but has deep implications:

```java
// The class is loaded ONCE into Metaspace (class metadata area)
// Each 'new' creates a SEPARATE object on the heap with its own field values

class BankAccount {
    private String owner;     // instance field — each account has its own
    private double balance;   // instance field — each account has its own
    private static int totalAccounts = 0;  // class field — shared by ALL accounts

    public BankAccount(String owner, double initialBalance) {
        this.owner = owner;
        this.balance = initialBalance;
        totalAccounts++;  // shared counter incremented for every new account
    }

    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
        this.balance += amount;  // modifies THIS object's balance, not any other
    }
}

BankAccount alice = new BankAccount("Alice", 1000);  // object 1 on heap
BankAccount bob = new BankAccount("Bob", 2000);       // object 2 on heap (separate!)
alice.deposit(500);  // alice.balance = 1500, bob.balance still 2000
```

**What happens in memory:**

```
Heap:
  ┌─────────────────────────────┐   ┌─────────────────────────────┐
  │ Object: alice                │   │ Object: bob                  │
  │   header: 12 bytes          │   │   header: 12 bytes           │
  │   owner: ref → "Alice"      │   │   owner: ref → "Bob"         │
  │   balance: 1500.0           │   │   balance: 2000.0            │
  └─────────────────────────────┘   └─────────────────────────────┘

Metaspace (shared):
  ┌─────────────────────────────┐
  │ Class: BankAccount           │
  │   totalAccounts: 2           │  ← static field lives here, not in objects
  │   method bytecode            │
  │   field descriptors          │
  └─────────────────────────────┘

Stack (calling thread):
  ┌─────────────────────────────┐
  │ local variable 'alice': ref ──────► heap object 1
  │ local variable 'bob':   ref ──────► heap object 2
  └─────────────────────────────┘
```

### Encapsulation — Why Private Fields Are Non-Negotiable

Encapsulation is not just "use `private` fields with getters and setters." That's the mechanistic view. The real purpose is **protecting invariants** — rules about your object's state that must always be true. A `BankAccount` should never have a negative balance. A `DateRange` should never have `start` after `end`. An `Email` should always contain an `@` sign.

```java
// BAD: public fields — anyone can break invariants
public class DateRange {
    public LocalDate start;
    public LocalDate end;
}

DateRange range = new DateRange();
range.start = LocalDate.of(2025, 12, 31);
range.end = LocalDate.of(2025, 1, 1);  // end BEFORE start — invalid state!
// No error, no exception — the object is silently corrupted
// Every method that uses this range will produce wrong results

// GOOD: encapsulated — invariant enforced at construction and mutation
public class DateRange {
    private final LocalDate start;
    private final LocalDate end;

    public DateRange(LocalDate start, LocalDate end) {
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("start must be before end");
        }
        this.start = start;
        this.end = end;
    }

    // No setters — immutable! Invariant can NEVER be violated after construction.
    public LocalDate getStart() { return start; }
    public LocalDate getEnd() { return end; }
}
```

**The senior developer principle:** A well-encapsulated class makes it impossible to create an invalid object. If every constructor and every mutator method enforces the invariants, then every instance you encounter is guaranteed to be in a valid state. This eliminates entire categories of bugs.

### Inheritance — When to Use It and When NOT To

Inheritance is the most overused and most misunderstood OOP concept. Beginners see it as "code reuse" — put common code in a parent class, extend it in children. But inheritance creates a **permanent, compile-time coupling** between parent and child that is extremely difficult to change later. Every change to the parent class affects every child class. Every internal implementation detail of the parent that the child depends on becomes part of the public contract. Joshua Bloch devotes an entire chapter of *Effective Java* to this, summarized in one sentence: **"Favor composition over inheritance."**

```java
// INHERITANCE: "is-a" relationship — use ONLY when the child IS truly a parent
class Animal {
    void eat() { System.out.println("eating"); }
}
class Dog extends Animal {
    void bark() { System.out.println("woof"); }
}
// A Dog IS an Animal. This is correct inheritance.

// WRONG INHERITANCE: using it for code reuse, not for "is-a"
class Stack extends ArrayList<Object> {
    // Stack IS NOT an ArrayList!
    // By inheriting, Stack exposes add(), get(index), remove(index)...
    // Users can insert in the MIDDLE of a Stack — violating stack semantics
    // This is a real mistake in java.util.Stack (deprecated for this reason)
}

// COMPOSITION: "has-a" relationship — use when you want behavior, not identity
class Stack<T> {
    private final List<T> elements = new ArrayList<>();  // has-a list

    public void push(T item) { elements.add(item); }
    public T pop() { return elements.remove(elements.size() - 1); }
    public T peek() { return elements.get(elements.size() - 1); }
    public boolean isEmpty() { return elements.isEmpty(); }

    // Users can ONLY do stack operations — no access to the underlying list
    // The internal ArrayList can be replaced with LinkedList without affecting users
}
```

**When inheritance IS appropriate:**
- True "is-a" relationships (`Dog extends Animal`, `IOException extends Exception`)
- Template method pattern (abstract class defines algorithm skeleton, subclasses fill in steps)
- Framework extension points designed for inheritance (`HttpServlet`, `AbstractController`)

**When inheritance is WRONG:**
- Code reuse (use composition or delegation instead)
- When the parent class was not designed for inheritance (no protected methods, no documentation of self-use patterns)
- When you want to change the implementation later (composition allows runtime swapping; inheritance is compile-time)

### Polymorphism — The Most Powerful OOP Concept

Polymorphism means "one interface, many implementations." It's the reason large Java systems can be built, maintained, and evolved without rewriting everything when requirements change. At its core, polymorphism lets you write code that works with an abstraction and swap the concrete implementation at runtime.

```java
// Without polymorphism — every new payment type requires changing this method:
double calculateFee(String paymentType, double amount) {
    if (paymentType.equals("CREDIT_CARD")) {
        return amount * 0.029;
    } else if (paymentType.equals("BANK_TRANSFER")) {
        return 1.50;
    } else if (paymentType.equals("CRYPTO")) {
        return amount * 0.01;
    }
    // Adding a new type means editing this method (and every other switch/if-else)
    // Violates Open/Closed Principle
}

// With polymorphism — new types are ADDED, not edited:
interface PaymentMethod {
    double calculateFee(double amount);
}

class CreditCard implements PaymentMethod {
    public double calculateFee(double amount) { return amount * 0.029; }
}

class BankTransfer implements PaymentMethod {
    public double calculateFee(double amount) { return 1.50; }
}

class Crypto implements PaymentMethod {
    public double calculateFee(double amount) { return amount * 0.01; }
}

// Caller doesn't know or care which implementation is used:
double fee = paymentMethod.calculateFee(amount);
// Adding a new payment type = add a new class. ZERO changes to existing code.
```

**How polymorphism works at the JVM level:**

```
When you call paymentMethod.calculateFee(amount):

1. JVM reads the object's header → gets the klass pointer
2. Klass pointer → class metadata → vtable (virtual method table)
3. Vtable is an array of method pointers, one per virtual method
4. calculateFee is at vtable index 0 (for example)
5. JVM calls the method pointer at vtable[0]

If paymentMethod is CreditCard: vtable[0] → CreditCard.calculateFee
If paymentMethod is BankTransfer: vtable[0] → BankTransfer.calculateFee

This dispatch happens at RUNTIME (not compile time) — that's why it's "dynamic dispatch"
Cost: one memory indirection (~1-3ns). The JIT often inlines this for monomorphic sites.
```

### Real-World Use Cases — When to Apply Each OOP Concept

Think of OOP concepts as tools in a toolbox. You don't use a hammer for everything — you pick the right tool for the problem. Here's a plain-language guide for everyday decisions:

**Use ENCAPSULATION when:** You have data that can be corrupted if modified incorrectly. Bank balances, user passwords, order statuses, configuration settings — anything where "set to any value" is dangerous. Make fields private, validate in setters or constructors. If the data should never change after creation, make fields `final` and provide no setters (immutable object).

**Use INHERITANCE when:** You genuinely have an "is-a" relationship AND the parent class was designed for extension. `Dog extends Animal` is correct. `PremiumUser extends User` is correct if User was designed with extension in mind. If you're inheriting just to reuse some methods, STOP — use composition instead.

**Use POLYMORPHISM when:** You have multiple ways to do the same thing, and you want to switch between them without changing the code that uses them. Payment processing (credit card, PayPal, crypto), notification sending (email, SMS, push), data export (CSV, JSON, Excel), authentication (LDAP, OAuth, database). These are all perfect polymorphism use cases.

**Use COMPOSITION when:** You want to reuse behavior from another class but the "is-a" test fails. A `Car` is not an `Engine`, but a Car HAS an Engine. A `UserService` is not a `UserRepository`, but it HAS one. Composition lets you swap implementations at runtime and keeps your class hierarchy flat.

### OOP Best Practices — The Rules Senior Developers Follow

```
1. MAKE CLASSES SMALL AND FOCUSED
   Each class should do ONE thing well. If your class has 20+ methods,
   it's probably doing too much. Split it.

2. PREFER IMMUTABILITY
   Make fields final wherever possible. Immutable objects are simpler,
   thread-safe, and can be shared without copying.

3. PROGRAM TO INTERFACES, NOT IMPLEMENTATIONS
   Declare variables as List<String>, not ArrayList<String>.
   Accept parameters as Collection<T>, not ArrayList<T>.
   This lets you change the implementation later without breaking callers.

4. USE THE NARROWEST TYPE POSSIBLE
   If a method only reads from a collection, accept Iterable<T> (not List<T>).
   If it only needs to add elements, accept Collection<T> (not ArrayList<T>).

5. VALIDATE EARLY, FAIL FAST
   Check arguments at the start of public methods.
   Throw IllegalArgumentException with a clear message.
   Don't let invalid data propagate deep into your system.

6. DON'T EXPOSE INTERNALS
   Never return a mutable internal collection from a getter.
   Return an unmodifiable view or a copy.
   
   BAD:  public List<Item> getItems() { return items; }
   GOOD: public List<Item> getItems() { return Collections.unmodifiableList(items); }
   BEST: public List<Item> getItems() { return List.copyOf(items); }
```

---

## 2. The Java Type System — Primitives, References, and the Rules

### Primitives vs Objects — The Fundamental Split

Java has two fundamentally different kinds of values, and understanding the difference prevents a huge number of bugs:

**Primitives** (`int`, `long`, `double`, `boolean`, `byte`, `short`, `char`, `float`) are raw values stored directly in the variable's memory slot — on the stack for local variables, or inline in the containing object for fields. They have no identity, no methods, no null, and no overhead. An `int` is always exactly 4 bytes.

**References** (everything else: `String`, `Integer`, arrays, your classes) are *pointers* to objects on the heap. The variable holds a memory address (4 bytes with compressed oops, 8 bytes without), not the object itself. Multiple variables can point to the same object. References can be `null`. Objects have headers (12-16 bytes of overhead), are managed by the garbage collector, and have identity (`==` compares addresses, not content).

```java
// PRIMITIVE: the variable IS the value
int a = 42;      // stack slot contains: 42 (the actual number)
int b = a;        // stack slot contains: 42 (a COPY of the number)
b = 100;          // only b changes. a is still 42.

// REFERENCE: the variable is a POINTER to the value
List<String> list1 = new ArrayList<>();  // stack slot contains: address of ArrayList
List<String> list2 = list1;               // stack slot contains: SAME address!
list2.add("hello");                       // modifies the SAME object
System.out.println(list1.size());         // 1 — because list1 and list2 point to same object!
```

### Java Is ALWAYS Pass-By-Value — There Are No Exceptions

This is the most misunderstood concept in Java. When you pass a variable to a method, Java copies the **value** in the variable. For primitives, that's the number itself. For references, that's the **address** (the pointer), not the object.

```java
void changeNumber(int x) {
    x = 999;  // modifies the LOCAL COPY. The caller's variable is untouched.
}

int num = 42;
changeNumber(num);
System.out.println(num);  // 42 — unchanged!

void changeList(List<String> list) {
    list.add("added");     // modifies the OBJECT that the reference points to — visible to caller!
    list = new ArrayList<>();  // changes the LOCAL COPY of the reference — invisible to caller!
}

List<String> myList = new ArrayList<>();
changeList(myList);
System.out.println(myList);  // ["added"] — the add was visible, but the reassignment was not
```

**The mental model:** Think of references as remote controls pointing at a TV. When you pass a reference to a method, you give the method a **copy of the remote control**. They can use it to change the channel (modify the object), but if they throw away their remote and get a new one (reassign the variable), your remote still points at the original TV.

### Null — The Billion-Dollar Mistake

Tony Hoare, who invented null references in 1965, calls it his "billion-dollar mistake." In Java, any reference variable can be `null`, meaning it points to nothing. Calling any method on `null` throws `NullPointerException` — the #1 exception in Java production systems.

```java
String name = null;
name.length();  // NullPointerException — there's no object to call length() on

// The problem: null is INVISIBLE in the type system
// String name — does this contain a String or null? The type doesn't tell you.

// DEFENSE STRATEGIES:

// 1. Fail fast — validate at the boundary
public void processUser(User user) {
    Objects.requireNonNull(user, "user must not be null");  // fails immediately with clear message
    // now safe to use user
}

// 2. Use Optional for return types that may be absent
public Optional<User> findUser(String id) {
    User user = database.find(id);
    return Optional.ofNullable(user);  // forces caller to handle absence
}

// 3. Use @Nullable/@NonNull annotations (IDE + static analysis)
public void process(@NonNull String input) { ... }

// 4. Prefer empty collections over null collections
public List<Order> getOrders() {
    return orders != null ? orders : Collections.emptyList();  // never return null
}
```

### Type Casting — Widening, Narrowing, and ClassCastException

```java
// WIDENING (implicit, always safe): smaller type → larger type
int i = 42;
long l = i;        // int (4 bytes) → long (8 bytes), no data loss
double d = i;      // int → double, no data loss (but may lose precision for very large ints)

// NARROWING (explicit, potentially unsafe): larger type → smaller type
long big = 3_000_000_000L;
int small = (int) big;  // OVERFLOW! 3 billion doesn't fit in int → wraps to negative
// small = -1294967296 (silent data corruption, no exception!)

// REFERENCE WIDENING (always safe): subtype → supertype
String s = "hello";
Object o = s;  // String IS an Object — always safe

// REFERENCE NARROWING (dangerous): supertype → subtype
Object o = "hello";
String s = (String) o;  // works at runtime because the object really IS a String
Integer n = (Integer) o;  // ClassCastException! The object is a String, not an Integer

// SAFE PATTERN: always check before casting
if (o instanceof String str) {  // Java 16+ pattern matching
    System.out.println(str.length());  // 'str' is already cast, guaranteed non-null
}
```

### Use Cases — When to Use Which Type

```
Use PRIMITIVE (int, long, double, boolean) when:
  - You need raw performance (no object overhead)
  - The value can never be null (counters, flags, coordinates)
  - You're doing math-heavy computation (no autoboxing overhead)
  - Loop counters, array indices, boolean flags

Use WRAPPER (Integer, Long, Double, Boolean) when:
  - You need to store in a Collection (List<Integer>, Map<String, Long>)
  - The value CAN be null (database column that allows NULL)
  - You need to use generics (generic types can't use primitives)
  - You're working with APIs that require objects (JSON serialization)

Use BigDecimal when:
  - You're dealing with MONEY (0.1 + 0.2 ≠ 0.3 with double!)
  - You need exact decimal arithmetic
  - Financial calculations, tax computation, currency conversion

Use String when:
  - You have text data (names, IDs, messages)
  - ALWAYS use .equals() for comparison, NEVER ==

Use enum when:
  - You have a FIXED SET of values (Status, DayOfWeek, Color, Permission)
  - Don't use String constants ("ACTIVE", "PENDING") — use enums instead
  - Enums are type-safe, prevent invalid values, support methods
```

### Type Best Practices

```
1. NEVER use float/double for money. Use BigDecimal.
   new BigDecimal("10.50")  // correct
   new BigDecimal(10.50)    // WRONG — 10.50 can't be exactly represented in binary

2. Use .equals() for ALL object comparisons (String, Integer, etc.)
   Use == ONLY for primitives and enum constants.

3. Beware of null when unboxing:
   Integer x = null;
   int y = x;  // NullPointerException! Unboxing null crashes.

4. Use Objects.equals() for null-safe comparison:
   Objects.equals(a, b);  // handles null for both a and b

5. Prefer primitives over wrappers for fields that are NEVER null:
   private int count;      // always has a value — good
   private Integer count;  // can be null — only use if null has meaning
```

---

## 3. Interfaces and Abstract Classes — Designing for Change

### What Interfaces Really Mean

An interface is a **contract** — a promise that an implementing class will provide certain behavior. When you write `implements Sortable`, you're saying "I guarantee that I can be sorted." This is more than a technical mechanism — it's a design tool that enables **loose coupling**: code that depends on the interface doesn't need to know about the implementation, and implementations can be swapped without changing the dependent code.

```java
// The interface defines WHAT, not HOW
interface MessageSender {
    void send(String recipient, String message);
}

// Multiple implementations provide different HOWs
class EmailSender implements MessageSender {
    public void send(String recipient, String message) {
        // SMTP protocol, connect to mail server...
    }
}

class SmsSender implements MessageSender {
    public void send(String recipient, String message) {
        // Twilio API, HTTP request...
    }
}

class SlackSender implements MessageSender {
    public void send(String recipient, String message) {
        // Slack webhook, POST request...
    }
}

// The service depends on the INTERFACE, not the implementation
class NotificationService {
    private final MessageSender sender;  // could be email, SMS, Slack — doesn't matter

    public NotificationService(MessageSender sender) {
        this.sender = sender;  // dependency injection — implementation decided externally
    }

    public void notifyUser(String userId, String msg) {
        sender.send(userId, msg);  // works regardless of which sender is injected
    }
}

// In production: new NotificationService(new EmailSender())
// In testing: new NotificationService(new MockSender())  ← no email sent during tests!
```

### Abstract Classes vs Interfaces — The Decision Framework

```
When to use INTERFACE:
  - Defining a capability that unrelated classes can have
  - Multiple inheritance of type (a class can implement many interfaces)
  - API contracts for external consumers
  - Examples: Comparable, Serializable, Iterable, your business contracts

When to use ABSTRACT CLASS:
  - Sharing code among closely related classes
  - Template Method pattern (algorithm skeleton in parent, steps in children)
  - When you need constructors, instance fields, or non-public methods
  - Examples: AbstractList, HttpServlet, AbstractController

Key differences:
  Interface                          Abstract Class
  ─────────────────────────────────────────────────────
  No constructors                    Has constructors
  No instance fields                 Has instance fields
  Multiple inheritance               Single inheritance
  All methods public                 Any access modifier
  default methods (Java 8+)          Regular method bodies
  static methods (Java 8+)           static and instance methods
  Cannot hold state                  Can hold state
```

### Default Methods — Interface Evolution Without Breaking Changes

Before Java 8, adding a method to an interface broke every class that implemented it. This made interface evolution nearly impossible for library authors. Default methods solve this: they provide an implementation in the interface itself, so existing implementations inherit the default behavior without any code changes.

```java
// Java 7: adding sort() to List would break EVERY List implementation
// Java 8: List.sort() was added as a default method

public interface List<E> extends Collection<E> {
    // ... existing methods ...

    default void sort(Comparator<? super E> c) {
        Object[] a = this.toArray();
        Arrays.sort(a, (Comparator) c);
        ListIterator<E> i = this.listIterator();
        for (Object e : a) {
            i.next();
            i.set((E) e);
        }
    }
}
// Every existing List implementation (ArrayList, LinkedList, custom lists)
// automatically gains sort() without any changes
```

### The Diamond Problem — What Happens with Conflicting Defaults

```java
interface A {
    default void hello() { System.out.println("A"); }
}

interface B {
    default void hello() { System.out.println("B"); }
}

// This class implements both — which hello() does it get?
class C implements A, B {
    // COMPILE ERROR: class C inherits unrelated defaults for hello()
    // You MUST override and choose:

    @Override
    public void hello() {
        A.super.hello();  // explicitly call A's version
        // or B.super.hello();
        // or provide your own implementation
    }
}

// Resolution rules:
// 1. Class always wins over interface (your override beats any default)
// 2. More specific interface wins (if B extends A, B's default beats A's)
// 3. If still ambiguous → compile error, you must override
```

### Real-World Use Cases — Interfaces in Practice

Interfaces are everywhere in professional Java. Here are the patterns you'll use daily:

```java
// USE CASE 1: Strategy Pattern — swap algorithms at runtime
interface PricingStrategy {
    BigDecimal calculatePrice(Product product, Customer customer);
}
class RegularPricing implements PricingStrategy { ... }
class VIPPricing implements PricingStrategy { ... }
class HolidaySalePricing implements PricingStrategy { ... }
// Change pricing strategy without touching any other code

// USE CASE 2: Repository Pattern — abstract database access
interface UserRepository {
    Optional<User> findById(Long id);
    List<User> findByStatus(Status status);
    void save(User user);
}
class JpaUserRepository implements UserRepository { ... }  // production
class InMemoryUserRepository implements UserRepository { ... }  // testing

// USE CASE 3: Observer/Listener Pattern — decouple events from handlers
interface OrderEventListener {
    void onOrderPlaced(Order order);
    void onOrderCancelled(Order order);
}
class InventoryUpdater implements OrderEventListener { ... }
class EmailNotifier implements OrderEventListener { ... }
class AnalyticsTracker implements OrderEventListener { ... }

// USE CASE 4: Adapter Pattern — make incompatible APIs work together
interface PaymentGateway {
    PaymentResult charge(Money amount, CardDetails card);
}
class StripeAdapter implements PaymentGateway {
    private final StripeClient stripeClient;
    public PaymentResult charge(Money amount, CardDetails card) {
        // translate from your domain to Stripe's API
        StripeCharge charge = stripeClient.createCharge(/* Stripe-specific params */);
        return new PaymentResult(charge.getId(), charge.getStatus());
    }
}
```

### Interface Best Practices

```
1. KEEP INTERFACES SMALL (Interface Segregation Principle)
   One interface per capability: Readable, Writable, Closeable
   Don't create god-interfaces with 20 methods

2. NAME INTERFACES AS CAPABILITIES OR CONTRACTS
   Good: Comparable, Serializable, PaymentGateway, MessageSender
   Bad: IUser, UserInterface (don't prefix with I — that's C# convention)

3. USE DEFAULT METHODS SPARINGLY
   Default methods are for backward-compatible interface evolution
   Don't use them to turn interfaces into abstract classes

4. RETURN INTERFACE TYPES FROM METHODS
   public List<User> getUsers()     // GOOD — caller uses List interface
   public ArrayList<User> getUsers() // BAD — leaks implementation detail

5. ACCEPT THE BROADEST USEFUL TYPE AS PARAMETERS
   public void process(Iterable<Item> items)    // best — accepts any iterable
   public void process(Collection<Item> items)  // good — if you need size()
   public void process(List<Item> items)        // ok — if you need index access
   public void process(ArrayList<Item> items)   // BAD — locks caller to ArrayList
```

---

## 4. Exception Handling — What Every Developer Gets Wrong

### The Exception Hierarchy — Why It's Designed This Way

```
                      Throwable
                     /         \
                 Error        Exception
                /     \       /        \
     OutOfMemory  StackOverflow  RuntimeException    IOException
     VirtualMachine             /     |      \       SQLException
     Error                NullPointer Illegal  ClassCast  ...
                          Exception   Argument Exception
                                     Exception

Throwable: the root. Everything throwable extends this.

Error: catastrophic JVM failures. You should NOT catch these.
  OutOfMemoryError: heap exhausted → your app is dying
  StackOverflowError: infinite recursion → fix your code
  These indicate problems so severe that recovery is unlikely.

Exception (checked): problems you CAN and SHOULD handle.
  IOException: file not found, network error → retry or report to user
  SQLException: DB error → rollback transaction, report
  The compiler FORCES you to handle these (catch or declare throws).

RuntimeException (unchecked): programming errors — bugs in YOUR code.
  NullPointerException: you forgot a null check → fix the code
  IllegalArgumentException: bad input → validate at the boundary
  ArrayIndexOutOfBoundsException: off-by-one error → fix the logic
  The compiler does NOT force you to handle these.
```

### Why Checked Exceptions Exist (And Why Many Hate Them)

Checked exceptions force the caller to handle error conditions that are **outside the programmer's control** — network failures, file system errors, database unavailability. The compiler won't let you ignore these errors. This is a safety net: without checked exceptions, a developer might forget that a file operation can fail, and the program crashes in production with an unhandled `IOException`.

The criticism: checked exceptions add verbosity (try-catch blocks or throws declarations everywhere), they don't compose well with lambdas and streams (lambda bodies can't throw checked exceptions), and they're often handled poorly (swallowed with empty catch blocks, or wrapped in meaningless `RuntimeException`).

```java
// BAD: swallowing the exception — the WORST possible pattern
try {
    file.read();
} catch (IOException e) {
    // do nothing — the error is silently lost
    // the program continues with corrupted or missing data
}

// BAD: catching Exception — too broad, catches things you didn't intend
try {
    processOrder(order);
} catch (Exception e) {
    log.error("Error", e);
    // This catches NullPointerException too — a BUG, not an expected error
    // Bugs should crash loudly, not be silently logged
}

// GOOD: catch specific exceptions, handle or propagate meaningfully
try {
    byte[] data = Files.readAllBytes(path);
    return parse(data);
} catch (NoSuchFileException e) {
    return Optional.empty();  // file doesn't exist is a valid case → return empty
} catch (IOException e) {
    throw new UncheckedIOException("Failed to read config: " + path, e);
    // wrap in unchecked, preserve the original cause
}
```

### The Golden Rules of Exception Handling

```
1. NEVER catch and swallow (empty catch block).
   If you catch it, handle it OR rethrow it.

2. Catch the MOST SPECIFIC exception possible.
   Not Exception, not Throwable — catch IOException, catch SpecificBusinessException.

3. Never use exceptions for control flow.
   Throwing an exception is 1000x slower than returning a value.
   Use Optional, return codes, or boolean returns for expected conditions.

4. Include context in exception messages.
   BAD:  throw new RuntimeException("Not found")
   GOOD: throw new NotFoundException("User not found: id=" + userId)

5. Always preserve the original cause.
   BAD:  throw new ServiceException("DB error")
   GOOD: throw new ServiceException("DB error for user " + id, originalException)

6. Use try-with-resources for ALL closeable resources.
   Connections, streams, channels — ALWAYS in try-with-resources.

7. Create custom exceptions for your domain.
   InsufficientBalanceException, SkuNotFoundException, PricingConflictException
   These are more meaningful than generic exceptions.
```

### Real-World Exception Use Cases

```java
// USE CASE 1: REST API Error Handling — translate exceptions to HTTP responses
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(UserNotFoundException ex) {
        return ResponseEntity.status(404)
            .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(400)
            .body(new ErrorResponse("BAD_REQUEST", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);  // log for debugging
        return ResponseEntity.status(500)
            .body(new ErrorResponse("INTERNAL_ERROR", "Something went wrong"));
        // DON'T expose internal details to the client
    }
}

// USE CASE 2: Custom Business Exceptions — domain-specific errors
public class InsufficientBalanceException extends RuntimeException {
    private final BigDecimal currentBalance;
    private final BigDecimal requestedAmount;

    public InsufficientBalanceException(BigDecimal current, BigDecimal requested) {
        super("Insufficient balance: have " + current + ", need " + requested);
        this.currentBalance = current;
        this.requestedAmount = requested;
    }
    // getters for currentBalance and requestedAmount
    // callers can programmatically access the details, not just the message
}

// USE CASE 3: Retry Pattern — handle transient failures
public <T> T withRetry(Supplier<T> operation, int maxRetries) {
    for (int attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return operation.get();
        } catch (TransientException e) {
            if (attempt == maxRetries) throw e;  // exhausted retries
            log.warn("Attempt {} failed, retrying...", attempt);
            Thread.sleep(1000 * attempt);  // exponential backoff
        }
    }
    throw new IllegalStateException("Should not reach here");
}
```

### Exception Best Practices Summary

```
DO:
  ✓ Create custom exceptions for your domain (OrderNotFoundException, etc.)
  ✓ Include context: WHO, WHAT, WHERE (userId, orderId, operation name)
  ✓ Use try-with-resources for ALL closeable resources
  ✓ Log at the BOUNDARY (controller, message handler) — not at every layer
  ✓ Use unchecked exceptions for programming errors (bad arguments, null)
  ✓ Use checked exceptions for recoverable external failures (IO, network)
  ✓ Use @RestControllerAdvice for centralized REST error handling

DON'T:
  ✗ Catch and swallow (empty catch block)
  ✗ Catch Exception/Throwable (too broad)
  ✗ Use exceptions for flow control (if/else is 1000x faster)
  ✗ Log AND rethrow (causes duplicate log entries at every layer)
  ✗ Expose stack traces to end users (security risk)
  ✗ Throw generic RuntimeException (create a specific custom type)
```

---

## 5. The Collections Framework — Choosing the Right Data Structure

### Why This Matters More Than You Think

Choosing the wrong collection is one of the most common performance mistakes in Java. Using a `LinkedList` when you need random access (O(n) per get vs O(1) for `ArrayList`). Using a `HashMap` when you need sorted keys (no ordering vs O(log n) sorted access with `TreeMap`). Using an `ArrayList` to check for membership (O(n) scan vs O(1) for `HashSet`). The first step to choosing correctly is understanding what each collection is optimized for.

### The Decision Tree

```
Do you need key-value pairs?
│
├── YES → Map
│   ├── Need ordering by key? → TreeMap (O(log n) all ops, sorted)
│   ├── Need insertion order? → LinkedHashMap (O(1), maintains order)
│   ├── Keys are enums?       → EnumMap (fastest possible, backed by array)
│   └── Default choice?       → HashMap (O(1) average, no ordering)
│
└── NO → Collection
    │
    ├── Need uniqueness?
    │   ├── YES → Set
    │   │   ├── Need sorted order?    → TreeSet (O(log n))
    │   │   ├── Need insertion order? → LinkedHashSet (O(1))
    │   │   ├── Elements are enums?   → EnumSet (bit manipulation, fastest)
    │   │   └── Default choice?       → HashSet (O(1) average)
    │   │
    │   └── NO → List or Queue
    │       ├── Need FIFO/LIFO?       → ArrayDeque (faster than LinkedList for both!)
    │       ├── Need priority order?  → PriorityQueue (O(log n) insert, O(1) peek min)
    │       ├── Need random access?   → ArrayList (O(1) get, O(n) insert middle)
    │       └── Default choice?       → ArrayList (almost always the right List)
```

### ArrayList — Your Default List

```java
// ArrayList is backed by an Object[] array
// Get by index: O(1) — direct array access
// Add at end: O(1) amortized — append to array, resize when full (1.5x growth)
// Add at index: O(n) — shift all elements after the index
// Remove: O(n) — shift elements to fill the gap
// Contains: O(n) — linear scan (use HashSet if you need fast contains!)

List<String> names = new ArrayList<>();
names.add("Alice");    // O(1) — append
names.get(0);          // O(1) — direct index
names.contains("Bob"); // O(n) — scans entire list
names.add(0, "Zara");  // O(n) — shifts everything right

// IMPORTANT: set initial capacity if you know the size
List<String> large = new ArrayList<>(10_000);  // avoids ~13 resizes
// Default capacity is 10, grows by 1.5x: 10 → 15 → 22 → 33 → ...
// Each resize copies the entire array (System.arraycopy)
```

### HashMap — Your Default Map

```java
// HashMap is backed by an array of "buckets" (linked lists or trees)
// Put: O(1) average — hash → bucket index → insert into list/tree
// Get: O(1) average — hash → bucket index → find in list/tree
// Remove: O(1) average
// WORST CASE (bad hash function, all keys in one bucket): O(n) or O(log n) with treeification

Map<String, Integer> ages = new HashMap<>();
ages.put("Alice", 30);   // hash("Alice") → bucket index → store entry
ages.get("Alice");        // hash("Alice") → same bucket → find entry → return 30
ages.containsKey("Bob");  // hash("Bob") → check bucket → not found → false

// IMPORTANT: initial capacity and load factor
Map<String, Integer> large = new HashMap<>(1024, 0.75f);
// Capacity: number of buckets (power of 2)
// Load factor: when to resize (0.75 = resize when 75% full)
// Resize = rehash EVERY entry into new, larger array → expensive
// If you know you'll have 1000 entries: new HashMap<>(1334) avoids resize
// (1000 / 0.75 = 1334)
```

### When to Use What — Quick Reference

```
I need to...                          Use this
──────────────────────────────────────────────────────
Store items in order, access by index   ArrayList
Check if item exists                    HashSet (O(1) vs O(n) for List)
Count occurrences of items              HashMap<Item, Integer>
Sort items                              TreeSet or Collections.sort(ArrayList)
Process items FIFO (queue)              ArrayDeque
Process items by priority               PriorityQueue
Store key-value with sorted keys        TreeMap
Store key-value preserving insert order LinkedHashMap
Iterate and remove during iteration     Iterator.remove() (not foreach + remove!)
Thread-safe map                         ConcurrentHashMap (NEVER synchronizedMap)
Thread-safe list (rare writes)          CopyOnWriteArrayList
```

### The ConcurrentModificationException Trap

```java
// THIS CRASHES:
List<String> names = new ArrayList<>(List.of("Alice", "Bob", "Charlie"));
for (String name : names) {
    if (name.equals("Bob")) {
        names.remove(name);  // ConcurrentModificationException!
    }
}

// WHY: the enhanced for-loop uses an Iterator internally
// Modifying the list while iterating invalidates the iterator
// The iterator detects this (via a modification counter) and throws

// FIX 1: Use Iterator.remove()
Iterator<String> it = names.iterator();
while (it.hasNext()) {
    if (it.next().equals("Bob")) {
        it.remove();  // safe — removes through the iterator
    }
}

// FIX 2: Use removeIf (Java 8+) — cleanest
names.removeIf(name -> name.equals("Bob"));

// FIX 3: Collect indices/items to remove, then remove after loop
List<String> toRemove = new ArrayList<>();
for (String name : names) {
    if (name.equals("Bob")) toRemove.add(name);
}
names.removeAll(toRemove);
```

---

## 6. Strings — Immutability and Why It Matters

### Why Strings Are Immutable

`String` is immutable in Java — once created, its content can never change. Every "modification" method (`toUpperCase()`, `substring()`, `replace()`, `concat()`) returns a **new** String, leaving the original unchanged. This is not a limitation — it's a deliberate design choice with profound benefits:

1. **Thread safety:** Immutable objects are inherently thread-safe. A String can be shared between threads without synchronization — no thread can modify it under another thread's feet.

2. **Hash code caching:** String caches its `hashCode()` on first computation. Since the content never changes, the hash never changes, and it only needs to be computed once. This makes Strings extremely fast as HashMap keys.

3. **String pooling:** Because Strings can't change, the JVM can safely share identical strings across the entire program (the String pool). Two variables pointing to `"hello"` can share the same object — saving memory without any risk of one variable's change affecting the other.

4. **Security:** Strings are used for class names, file paths, network URLs, and credentials. If Strings were mutable, a security check could pass validation and then be modified before use — a class of attacks called TOCTOU (time-of-check to time-of-use).

```java
String s = "Hello";
String t = s;           // t and s point to the SAME object (safe because immutable)
String u = s.toUpperCase();  // creates a NEW string "HELLO", s is still "Hello"

System.out.println(s);  // "Hello" — unchanged
System.out.println(u);  // "HELLO" — new object

// String concatenation in a loop — the classic performance mistake:
String result = "";
for (int i = 0; i < 10_000; i++) {
    result += i;  // creates a NEW String every iteration!
    // Iteration 1: "" + "0" → new String "0"
    // Iteration 2: "0" + "1" → new String "01"
    // Iteration 3: "01" + "2" → new String "012"
    // ... 10,000 temporary Strings created and immediately garbage collected
}
// Time: O(n²) because each concatenation copies the entire accumulated string

// FIX: StringBuilder (mutable, not thread-safe, fast)
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 10_000; i++) {
    sb.append(i);  // modifies the SAME buffer, no new objects
}
String result = sb.toString();
// Time: O(n) — each append just extends the buffer
```

---

## 7. The `final` Keyword — Three Different Meanings

The `final` keyword does different things depending on where you use it, and understanding each context deeply prevents common bugs:

```java
// 1. final VARIABLE: the reference cannot be reassigned (but the object CAN be modified!)
final List<String> names = new ArrayList<>();
names.add("Alice");     // LEGAL — modifying the object, not the reference
names.add("Bob");       // LEGAL
// names = new ArrayList<>();  // COMPILE ERROR — cannot reassign the reference

// This is the #1 misunderstanding: final does NOT make objects immutable!
// final means: this variable will always point to the SAME object
// The object itself can still be modified through its methods

// 2. final METHOD: cannot be overridden by subclasses
class Parent {
    public final void criticalMethod() {
        // subclasses CANNOT override this
        // use when the method's behavior must not change
    }
}

// 3. final CLASS: cannot be extended (no subclasses)
public final class String {
    // nobody can extend String
    // guarantees immutability can't be bypassed by a malicious subclass
}
// String, Integer, Long, all wrapper classes are final for this reason
```

---

## 8. The `static` Keyword — Class-Level vs Instance-Level

```java
public class Counter {
    private int instanceCount = 0;        // each Counter object has its own copy
    private static int globalCount = 0;   // ONE copy shared by ALL Counter objects

    public Counter() {
        instanceCount++;  // this object's count (always 1 after construction)
        globalCount++;    // the shared global count (increases with every new Counter)
    }

    public static int getGlobalCount() {
        return globalCount;     // can access static field
        // return instanceCount; // COMPILE ERROR: static method can't access instance field
        // Why? A static method is called on the CLASS, not on an object
        // There's no 'this' — no object — so no instance fields exist
    }
}

Counter a = new Counter();  // instanceCount=1, globalCount=1
Counter b = new Counter();  // instanceCount=1, globalCount=2
Counter c = new Counter();  // instanceCount=1, globalCount=3
Counter.getGlobalCount();   // 3 — called on the CLASS, not on an instance
```

**When to use `static`:**
- Utility methods that don't need instance state: `Math.max()`, `Collections.sort()`
- Constants: `static final double PI = 3.14159`
- Factory methods: `List.of()`, `Optional.of()`, `LocalDate.now()`
- Singletons (use enum singleton pattern instead where possible)

**When NOT to use `static`:**
- When the method's behavior depends on the object's state
- When you want polymorphism (static methods can't be overridden — they're resolved at compile time, not runtime)
- When you need testability (static methods are harder to mock)

---

## 9. Memory Basics — Stack vs Heap for Everyday Developers

### Where Things Live

```
STACK (per thread, automatic):
  - Primitive local variables: int x = 42; → 42 lives on the stack
  - Reference local variables: List<String> list = ... → the REFERENCE lives on stack
  - Method parameters
  - Created when method is called, destroyed when method returns
  - Very fast (just move a pointer)
  - Limited size (default ~512KB-1MB per thread)

HEAP (shared, garbage-collected):
  - ALL objects: new ArrayList<>(), new String("hello"), new MyClass()
  - ALL arrays: new int[100], new String[50]
  - Static fields (logically, stored in Metaspace which is native memory)
  - Created with 'new', destroyed by garbage collector when unreachable
  - Slower than stack (allocation + GC overhead)
  - Large (configurable: -Xmx4g for 4GB)
```

```java
void example() {
    int age = 25;                           // 'age' → stack (primitive, 4 bytes)
    String name = "Alice";                  // 'name' → stack (reference, 4 bytes)
                                            // String object → heap (24+ bytes)
    List<String> items = new ArrayList<>();  // 'items' → stack (reference, 4 bytes)
                                            // ArrayList object → heap (44+ bytes)
    items.add("phone");                     // String "phone" → heap
                                            // reference stored inside ArrayList's array → heap
}
// When example() returns:
// - Stack frame is popped (age, name, items references gone instantly)
// - Heap objects become unreachable (eligible for GC)
// - GC will reclaim them at some future point
```

### What Causes Memory Leaks in Java

Java has garbage collection, so many developers assume memory leaks are impossible. They're wrong. A memory leak in Java occurs when objects remain **reachable** (referenced) but are no longer **needed**. The GC can't collect reachable objects, even if your code will never use them again.

```java
// LEAK 1: Forgotten collection entries
Map<Long, Session> sessionCache = new HashMap<>();
void onLogin(User user) {
    sessionCache.put(user.getId(), new Session(user));
}
// Sessions are NEVER removed → cache grows forever → OutOfMemoryError

// LEAK 2: Listener registration without removal
eventBus.register(this);  // registers this object as a listener
// If you never call eventBus.unregister(this), this object can never be GC'd
// because the eventBus holds a strong reference to it

// LEAK 3: ThreadLocal without removal (in thread pools)
threadLocal.set(largeObject);
// In a thread pool, the thread is REUSED — the value persists across requests

// LEAK 4: Inner class holding outer class reference
class Outer {
    byte[] hugeData = new byte[100_000_000];

    Runnable getTask() {
        return new Runnable() {  // non-static inner class
            public void run() { System.out.println("task"); }
            // secretly holds a reference to Outer (and its 100MB!)
        };
    }
}
```

---

## 10. equals() and hashCode() — The Contract You Must Not Break

### Why Override Both

When you put objects into a `HashMap`, `HashSet`, or any hash-based collection, the collection uses `hashCode()` to determine which bucket to store the object in, and `equals()` to check if two objects in the same bucket are the "same" object. If you override `equals()` without overriding `hashCode()`, two "equal" objects can end up in different buckets — and the collection will be unable to find objects you put into it.

```java
class Employee {
    String id;
    String name;

    // Override equals: two Employees with same id are "equal"
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Employee e)) return false;
        return Objects.equals(id, e.id);
    }

    // MUST override hashCode: equal objects MUST have the same hash code
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}

// WITHOUT hashCode override:
Employee e1 = new Employee("E001", "Alice");
Employee e2 = new Employee("E001", "Alice");
e1.equals(e2);  // true — same id

Set<Employee> set = new HashSet<>();
set.add(e1);
set.contains(e2);  // FALSE without hashCode override!
// e1 and e2 have different default hashCodes (based on memory address)
// e2 looks in a different bucket → not found

// WITH hashCode override:
set.contains(e2);  // TRUE — same hashCode → same bucket → equals() confirms match
```

---

## 11. Comparable and Comparator — Ordering Objects

### Comparable — Natural Ordering (Built Into the Class)

```java
// Your class defines its own "natural" order
public class Employee implements Comparable<Employee> {
    private String name;
    private double salary;

    @Override
    public int compareTo(Employee other) {
        return Double.compare(this.salary, other.salary);  // natural order: by salary
    }
}

Collections.sort(employees);  // uses compareTo — sorted by salary
```

### Comparator — External Ordering (Separate From the Class)

```java
// Define ordering OUTSIDE the class — flexible, composable
Comparator<Employee> byName = Comparator.comparing(Employee::getName);
Comparator<Employee> bySalaryDesc = Comparator.comparing(Employee::getSalary).reversed();
Comparator<Employee> bySalaryThenName = Comparator
    .comparing(Employee::getSalary)
    .thenComparing(Employee::getName);

employees.sort(byName);            // sort by name
employees.sort(bySalaryDesc);      // sort by salary descending
employees.sort(bySalaryThenName);  // sort by salary, break ties by name

// Handle nulls safely:
Comparator<Employee> nullSafe = Comparator.comparing(
    Employee::getName,
    Comparator.nullsLast(Comparator.naturalOrder())
);

// NEVER do subtraction for comparison (integer overflow risk):
// BAD:  (a, b) -> a.getAge() - b.getAge()
// If a.age = Integer.MAX_VALUE and b.age = -1, the subtraction OVERFLOWS
// GOOD: Comparator.comparingInt(Employee::getAge)
```

---

## 12. The Date/Time API (java.time) — The Modern Way

The old `java.util.Date` and `Calendar` classes are broken by design: `Date` is mutable (a threading hazard), months are 0-indexed (January = 0, a constant source of bugs), and `SimpleDateFormat` is not thread-safe. The `java.time` package (Java 8+) fixes all of this with immutable, clear, well-designed classes.

```java
// Immutable — all "modification" methods return new objects
LocalDate today = LocalDate.now();                    // 2026-02-21
LocalDate birthday = LocalDate.of(1990, Month.MARCH, 15);
LocalDate nextWeek = today.plusWeeks(1);              // new object, today unchanged

LocalTime lunchTime = LocalTime.of(12, 30);           // 12:30
LocalDateTime meeting = LocalDateTime.of(today, lunchTime); // 2026-02-21T12:30

// Time zones matter for real-world times:
ZonedDateTime nyTime = ZonedDateTime.now(ZoneId.of("America/New_York"));
ZonedDateTime tokyoTime = nyTime.withZoneSameInstant(ZoneId.of("Asia/Tokyo"));

// Duration (time-based: hours, minutes, seconds):
Duration duration = Duration.between(startTime, endTime);
long minutes = duration.toMinutes();

// Period (date-based: years, months, days):
Period age = Period.between(birthday, today);
System.out.println(age.getYears() + " years old");

// Formatting:
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
String formatted = today.format(fmt);  // "21-Feb-2026"
LocalDate parsed = LocalDate.parse("21-Feb-2026", fmt);

// Key rule: use LocalDate for dates, LocalTime for times,
// LocalDateTime for date+time WITHOUT timezone,
// ZonedDateTime for date+time WITH timezone,
// Instant for machine timestamps (epoch millis)
```

---

## 13. SOLID Principles — Designing Code That Survives Change

These five principles, coined by Robert C. Martin, guide the design of classes and modules that are easy to understand, change, test, and extend. They're not academic — they're the distilled wisdom of decades of software engineering.

**S — Single Responsibility Principle:** A class should have one reason to change. If your `UserService` handles authentication AND email sending AND database access, a change to email logic risks breaking authentication. Split into `AuthService`, `EmailService`, `UserRepository`.

**O — Open/Closed Principle:** Classes should be open for extension but closed for modification. The polymorphism example above (PaymentMethod interface) demonstrates this: add new payment types by creating new classes, not by modifying existing code.

**L — Liskov Substitution Principle:** Subtypes must be substitutable for their base types without breaking the program. If `Square extends Rectangle` and you set width=5 on a Rectangle, the height shouldn't silently change. If it does, `Square` is not a valid subtype.

**I — Interface Segregation Principle:** Don't force clients to depend on methods they don't use. If your `Printer` interface has `print()`, `scan()`, `fax()`, a simple printer that can't scan or fax must implement useless methods. Split into `Printable`, `Scannable`, `Faxable`.

**D — Dependency Inversion Principle:** High-level modules should depend on abstractions, not low-level details. Your `OrderService` should depend on `PaymentGateway` (interface), not on `StripePaymentGateway` (implementation). This enables testing, configuration, and future changes.

---

## 14. Access Modifiers — Who Can See What

Understanding access modifiers is understanding **information hiding** — the idea that each piece of code should expose only what others need and hide everything else. This prevents unintended dependencies, makes refactoring safe, and keeps your API surface small.

```
Modifier      Class   Package   Subclass   World    Use When
────────────────────────────────────────────────────────────────────
private         ✓       ✗         ✗         ✗     Internal state, helper methods
(package)       ✓       ✓         ✗         ✗     Implementation shared within package
protected       ✓       ✓         ✓         ✗     Extension points for subclasses
public          ✓       ✓         ✓         ✓     API — the contract you promise to maintain
```

**The rule of thumb: start with the most restrictive access and open up only when needed.**

```
Best Practices:
  - Fields: ALWAYS private (no exceptions in production code)
  - Helper methods: private (they're implementation details)
  - Methods called by tests: package-private (same package in test dir)
  - Extension points: protected (document them — they're part of your contract)
  - API methods: public (think carefully — once public, you can't remove it)
  
  A good class has: many private members, few public methods,
  and a clear contract between the two.
```

---

## 15. Constructor Best Practices — Creating Objects Right

How you create objects determines whether they're valid, immutable, and easy to use. Most Java bugs related to object creation come from constructors that don't validate, objects that are partially initialized, or APIs that are confusing to call.

```java
// PRACTICE 1: Validate ALL arguments in constructors
public class User {
    private final String name;
    private final String email;

    public User(String name, String email) {
        this.name = Objects.requireNonNull(name, "name must not be null");
        this.email = Objects.requireNonNull(email, "email must not be null");
        if (!email.contains("@")) {
            throw new IllegalArgumentException("Invalid email: " + email);
        }
    }
}
// Every User instance is GUARANTEED to have a valid name and email.
// You can never create a User("", null) without an immediate exception.

// PRACTICE 2: Use static factory methods instead of constructors
// When you have many ways to create the same type:
public class Money {
    private final BigDecimal amount;
    private final Currency currency;

    private Money(BigDecimal amount, Currency currency) {  // private constructor
        this.amount = amount;
        this.currency = currency;
    }

    public static Money dollars(double amount) {
        return new Money(BigDecimal.valueOf(amount), Currency.USD);
    }

    public static Money euros(double amount) {
        return new Money(BigDecimal.valueOf(amount), Currency.EUR);
    }

    public static Money of(BigDecimal amount, Currency currency) {
        return new Money(amount, currency);
    }
}

// Usage: Money price = Money.dollars(9.99);
// Much clearer than: Money price = new Money(BigDecimal.valueOf(9.99), Currency.USD);

// PRACTICE 3: Use Builder pattern when you have many optional parameters
public class HttpRequest {
    private final String url;
    private final String method;
    private final Map<String, String> headers;
    private final String body;
    private final Duration timeout;

    private HttpRequest(Builder builder) {
        this.url = Objects.requireNonNull(builder.url);
        this.method = builder.method;
        this.headers = Map.copyOf(builder.headers);
        this.body = builder.body;
        this.timeout = builder.timeout;
    }

    public static class Builder {
        private final String url;              // required
        private String method = "GET";         // default
        private Map<String, String> headers = new HashMap<>();
        private String body;
        private Duration timeout = Duration.ofSeconds(30);

        public Builder(String url) { this.url = url; }

        public Builder method(String method) { this.method = method; return this; }
        public Builder header(String key, String value) { headers.put(key, value); return this; }
        public Builder body(String body) { this.body = body; return this; }
        public Builder timeout(Duration timeout) { this.timeout = timeout; return this; }

        public HttpRequest build() { return new HttpRequest(this); }
    }
}

// Usage — readable, flexible, impossible to mix up parameter order:
HttpRequest request = new HttpRequest.Builder("https://api.example.com/users")
    .method("POST")
    .header("Content-Type", "application/json")
    .body("{\"name\": \"Alice\"}")
    .timeout(Duration.ofSeconds(10))
    .build();
```

```
When to use which creation pattern:

Constructor:          1-3 required parameters, simple object
Static factory:       Need descriptive names, caching, or polymorphic return
Builder:              4+ parameters, many optional, fluent API needed
Record:               Pure data carrier, no mutable state, automatic equals/hashCode
```

---

## 16. Method Design — Writing Methods That Don't Confuse

```
NAMING:
  - Methods that DO something: verb + noun (sendEmail, calculateTotal, validateInput)
  - Methods that RETURN something: noun or get + noun (getBalance, size, isEmpty)
  - Boolean methods: is/has/can/should (isEmpty, hasPermission, canProceed)
  
  BAD:  data(), process(), handle(), doStuff()     — too vague
  GOOD: fetchUserById(), calculateShippingCost()   — tells you exactly what it does

PARAMETERS:
  - Keep parameter count LOW (0-3 ideal, 4+ means use a parameter object)
  - Use SPECIFIC types (Money instead of BigDecimal, UserId instead of String)
  - Never use boolean parameters — use enum or two separate methods
  
  BAD:  createUser(String name, boolean isAdmin, boolean sendEmail)
        // What does createUser("Alice", true, false) mean? Nobody knows.
  GOOD: createAdmin("Alice")
        createRegularUser("Alice")

RETURN VALUES:
  - Return Optional<T> when "no result" is a NORMAL outcome (findById)
  - Return empty collection, never null (getOrders → return List.of())
  - Return specific types (Money, not BigDecimal; UserId, not String)

METHOD LENGTH:
  - A method should fit on ONE SCREEN (~20-30 lines)
  - If it's longer, extract smaller methods with descriptive names
  - Each method should do ONE THING at ONE LEVEL OF ABSTRACTION
  
  BAD:  processOrder() that validates, calculates tax, charges payment,
        sends email, updates inventory — all in 200 lines
  
  GOOD: processOrder() that calls:
        validateOrder(order);
        Money total = calculateTotal(order);
        chargePayment(order.getCustomer(), total);
        sendConfirmation(order);
        updateInventory(order);
        // Each sub-method is focused and testable
```

---

## 17. Immutability — The Best Practice That Solves 50% of Bugs

Immutability means: once an object is created, it can never be changed. This one principle prevents: threading bugs (immutable objects need no synchronization), defensive copying (you can share them freely), accidental corruption (nobody can modify your data), and makes reasoning about code dramatically easier (the value you see is the value that will always be there).

```java
// HOW TO MAKE A CLASS IMMUTABLE:
public final class Address {                    // 1. Class is final (no subclass can add mutation)
    private final String street;                // 2. All fields are final
    private final String city;
    private final String zipCode;
    private final List<String> phoneNumbers;

    public Address(String street, String city, String zipCode, List<String> phoneNumbers) {
        this.street = Objects.requireNonNull(street);       // 3. Validate in constructor
        this.city = Objects.requireNonNull(city);
        this.zipCode = Objects.requireNonNull(zipCode);
        this.phoneNumbers = List.copyOf(phoneNumbers);      // 4. Defensive copy of mutable inputs
    }

    public String getStreet() { return street; }
    public String getCity() { return city; }
    public String getZipCode() { return zipCode; }
    public List<String> getPhoneNumbers() { return phoneNumbers; }  // 5. List.copyOf is already unmodifiable

    // NO SETTERS — this object can never change after construction
}

// OR just use a Record (Java 16+) — immutable by design:
public record Address(String street, String city, String zipCode, List<String> phoneNumbers) {
    public Address {
        Objects.requireNonNull(street);
        Objects.requireNonNull(city);
        phoneNumbers = List.copyOf(phoneNumbers);  // still need defensive copy for mutable types
    }
}
```

```
Where to use immutable objects:
  - DTOs / Value Objects (data passed between layers)
  - Configuration objects (loaded once, used everywhere)
  - Map keys and Set elements (hash code must not change!)
  - Objects shared between threads (no synchronization needed)
  - Domain objects that represent facts (a Date, an Address, a Price)
  - Method return values (callers can't corrupt your internal state)

Where mutable objects are OK:
  - Builders (accumulate state, then build an immutable result)
  - Entities with identity (JPA entities must be mutable for ORM)
  - Performance-critical buffers (StringBuilder, ByteBuffer)
  - Local-only objects that never escape the method
```

---

## 18. Naming Conventions — Code That Reads Like English

Good naming is the most underrated skill in programming. Code is read 10x more than it is written. A well-named method eliminates the need for comments. A poorly-named variable wastes minutes of every reader's time.

```
CLASSES:
  Nouns, PascalCase, specific
  GOOD: OrderService, PricingEngine, UserRepository, EmailValidator
  BAD:  Manager, Handler, Data, Info, Helper  (too vague — what does it manage?)

INTERFACES:
  Capability or contract names
  GOOD: Comparable, Serializable, PaymentGateway, MessageSender
  BAD:  IUser, UserInterface  (don't prefix with I)

METHODS:
  Verbs (actions) or nouns (getters), camelCase
  GOOD: calculateTotal(), findUserById(), isValid(), getBalance()
  BAD:  calc(), find(), check(), data()

VARIABLES:
  Descriptive nouns, camelCase
  GOOD: customerName, orderTotal, maxRetryCount, isActive
  BAD:  n, temp, data, str, x  (acceptable only in tiny scopes like lambdas)

CONSTANTS:
  SCREAMING_SNAKE_CASE
  GOOD: MAX_CONNECTIONS, DEFAULT_TIMEOUT_MS, API_BASE_URL
  BAD:  maxConnections, max_connections

PACKAGES:
  Lowercase, reverse domain
  GOOD: com.mycompany.order.service, com.mycompany.pricing.engine
  BAD:  com.mycompany.utils  (catch-all packages become dumping grounds)

BOOLEANS:
  Always readable as a question
  GOOD: isActive, hasPermission, canDelete, shouldRetry
  BAD:  active, flag, status, check
```

---

## 19. Real-World Design Patterns Every Java Developer Uses

You don't need to memorize all 23 Gang of Four patterns. In real-world Java, you use about 6-8 regularly. Here they are in simple language:

**Strategy Pattern (most common):** "I want to swap algorithms at runtime."
Use when: different pricing strategies, different sorting algorithms, different validation rules, different notification channels. Implement with interfaces and dependency injection.

**Factory Method:** "I want to create objects without specifying the exact class."
Use when: creating objects based on a type string, configuration, or environment. `LocalDate.of()`, `List.of()`, `Optional.of()` are all factory methods.

**Builder Pattern:** "I have too many constructor parameters."
Use when: 4+ parameters, many optional ones, or when you want a fluent API. HttpRequest.Builder, StringBuilder, Stream.builder().

**Observer/Listener:** "I want to notify multiple objects when something happens."
Use when: event systems, UI updates, audit logging, cache invalidation. Spring's `@EventListener`, `ApplicationEventPublisher`.

**Template Method:** "All subclasses follow the same algorithm, but customize specific steps."
Use when: a base class defines the flow (validate → process → notify) and subclasses override specific steps. `HttpServlet.doGet()`, `AbstractController`.

**Decorator:** "I want to add behavior to an object without changing its class."
Use when: wrapping streams (`BufferedInputStream` wrapping `FileInputStream`), adding logging or metrics to services, adding caching to repositories.

**Singleton:** "I need exactly one instance in the entire application."
Use when: configuration holders, connection pools, thread pools. In modern Java, use enum singleton or let Spring manage it (`@Service` is a singleton by default).

---

## 20. Code Organization — Structuring a Real Project

```
src/main/java/com/mycompany/myapp/
├── config/                  # Configuration classes (@Configuration, @Bean)
│   ├── SecurityConfig.java
│   └── DataSourceConfig.java
├── controller/              # REST endpoints (@RestController)
│   ├── UserController.java
│   └── OrderController.java
├── service/                 # Business logic (@Service)
│   ├── UserService.java
│   └── OrderService.java
├── repository/              # Database access (@Repository)
│   ├── UserRepository.java
│   └── OrderRepository.java
├── model/                   # Domain entities and value objects
│   ├── entity/              # JPA entities (mutable, with @Entity)
│   │   ├── User.java
│   │   └── Order.java
│   └── dto/                 # Data Transfer Objects (immutable, for API)
│       ├── UserRequest.java
│       └── UserResponse.java
├── exception/               # Custom exceptions
│   ├── UserNotFoundException.java
│   └── InsufficientBalanceException.java
└── util/                    # Utility classes (use sparingly!)
    └── DateUtils.java

RULES:
  - Controllers: thin. Validate input, call service, return response.
  - Services: ALL business logic lives here. Transaction boundaries here.
  - Repositories: ONLY data access. No business logic.
  - DTOs: separate from entities. API shape ≠ database shape.
  - Never let a controller call a repository directly (skip the service).
  - Never put business logic in entities (keep them as data holders).
```

---

## 21. Testing Mindset — Writing Code That Can Be Tested

You don't need to be a testing expert to benefit from thinking about testability. Code that is easy to test is also easy to understand, easy to change, and has fewer bugs. The key principle is: **if it's hard to test, the design is wrong.**

```java
// HARD TO TEST (static methods, hidden dependencies):
public class OrderService {
    public void placeOrder(Order order) {
        Database.getConnection().execute("INSERT ...");  // static call — can't mock
        EmailClient.send(order.getEmail(), "Order placed"); // static call — sends real email in tests!
    }
}

// EASY TO TEST (dependency injection, interfaces):
public class OrderService {
    private final OrderRepository orderRepo;       // injected
    private final NotificationService notifier;    // injected

    public OrderService(OrderRepository orderRepo, NotificationService notifier) {
        this.orderRepo = orderRepo;
        this.notifier = notifier;
    }

    public void placeOrder(Order order) {
        orderRepo.save(order);           // in test: mock that verifies save was called
        notifier.sendConfirmation(order); // in test: mock that verifies notification was sent
    }
}

// Test:
@Test
void placeOrder_savesAndNotifies() {
    OrderRepository mockRepo = mock(OrderRepository.class);
    NotificationService mockNotifier = mock(NotificationService.class);
    OrderService service = new OrderService(mockRepo, mockNotifier);

    Order order = new Order("item1", Money.dollars(9.99));
    service.placeOrder(order);

    verify(mockRepo).save(order);
    verify(mockNotifier).sendConfirmation(order);
}
```

```
TESTABILITY RULES:
  1. Inject dependencies — don't create them inside the class
  2. Use interfaces — so you can mock implementations
  3. Avoid static calls to external systems (database, network, filesystem)
  4. Keep methods small — small methods have fewer test cases
  5. Separate pure logic from side effects:
     - Pure: calculateTotal(items) — easy to test (input → output)
     - Side effect: saveToDatabase(order) — needs mocking
  6. Don't test private methods — test the public behavior
     If you feel the need to test a private method,
     it should probably be extracted to its own class
```

---

## 22. Common Pitfalls — The Bugs That Bite Every Java Developer

| Pitfall | What Happens | Fix |
|---------|-------------|-----|
| `==` on Strings | Compares references, not content | Use `.equals()` always |
| `==` on Integer > 127 | Cache miss — different objects | Use `.equals()` for wrappers |
| Mutable objects as Map keys | Hash changes → entry lost | Use immutable keys |
| `equals()` without `hashCode()` | HashMap can't find equal objects | Always override both |
| String concat in loop | O(n²), massive GC pressure | Use `StringBuilder` |
| `catch (Exception e) {}` | Swallowed error, silent corruption | Handle or rethrow |
| Raw types (`List` not `List<String>`) | No type safety, ClassCastException | Always use generics |
| Returning `null` from collections | NullPointerException for callers | Return `Collections.emptyList()` |
| Modifying list during iteration | ConcurrentModificationException | Use `removeIf()` or Iterator |
| `SimpleDateFormat` in multithreaded code | Corrupted dates, silent bugs | Use `DateTimeFormatter` (immutable) |
| `float`/`double` for money | Rounding errors (0.1 + 0.2 ≠ 0.3) | Use `BigDecimal` |
| Not closing resources | Connection leaks, file handle leaks | Use try-with-resources |

---

*After mastering this material: you understand WHY Java is designed the way it is, not just HOW to write it. You choose the right collection without thinking. You write encapsulated, immutable, well-tested code by default. You debug NullPointerException, ClassCastException, and ConcurrentModificationException in seconds because you understand the mechanics behind them. You're ready for the advanced material in Phases 1-5.*
