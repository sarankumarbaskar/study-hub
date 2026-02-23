# Java Generics and Collections — Complete Guide

*Comprehensive documentation based on "Java Generics and Collections" by Maurice Naftalin & Philip Wadler*

This guide covers every chapter of the book in depth: **Part I** explores the Java generics type system (type parameters, wildcards, erasure, reification, reflection, and design patterns), while **Part II** dissects the entire Java Collections Framework (Sets, Lists, Queues, Maps, and the Collections utility class) with performance analysis and implementation internals.

---

# Part I — Generics

---

# Chapter 1: Introduction

### 1.1 Generics

Generics allow interfaces and classes to take one or more **type parameters**, written in angle brackets. These parameters must be supplied when declaring variables or creating instances.

Generics provide compile-time type safety: the compiler enforces that you store and retrieve elements of the declared type. Without generics, you must rely on manual casts and programmer discipline—a cast can fail at runtime. With generics, the compiler inserts the same casts automatically, but guarantees they never fail (when no unchecked warnings are issued).

**Implementation by erasure:** The bytecode produced with generics is identical to the bytecode you would write manually without generics. Types like `List<Integer>`, `List<String>`, and `List<List<String>>` are all represented at runtime as `List`. The process "erases" type parameters but adds casts. This keeps the design simple (one implementation per generic type), keeps the class file size small, and eases evolution—legacy nongeneric code and new generic code interoperate seamlessly.

**Reification:** Java reifies array component types but does *not* reify generic type parameters. `new String[size]` creates an array that stores its component type at runtime; `new ArrayList<String>()` does not store the element type in the list. This affects casts, `instanceof`, and array creation with generics.

```java
List<String> words = new ArrayList<String>();
words.add("Hello ");
words.add("world!");
String s = words.get(0) + words.get(1);  // No cast needed
assert s.equals("Hello world!");
```

**Key Points:**
- Type parameters are declared in angle brackets and supplied at use sites.
- Generics are implemented by erasure; runtime sees only raw types.
- Cast-iron guarantee: implicit casts from generics never fail if no unchecked warnings.
- Java generics are invariant: `List<Integer>` is not a subtype of `List<Number>`.
- Syntax resembles C++; semantics differ (erasure vs. C++ template expansion).

---

### 1.2 Boxing and Unboxing

Every Java type is either a reference type or a primitive type. The eight primitives (`byte`, `short`, `int`, `long`, `float`, `double`, `boolean`, `char`) have corresponding wrapper classes in `java.lang` (`Byte`, `Short`, `Integer`, etc.).

**Boxing** converts a primitive to its wrapper type. **Unboxing** converts a wrapper to its primitive. Java inserts these conversions automatically where needed.

Type parameters must bind to reference types, not primitives. So you write `List<Integer>` and `List<int>` is illegal. For results, using primitives (e.g., `int`) is more efficient than wrappers (e.g., `Integer`) because it avoids boxing overhead in loops.

**Subtlety—equality:** On `int`, `==` compares values. On `Integer`, `==` compares object identity. Unboxing can make two `Integer` values compare equal via `==`, but two distinct `Integer` objects representing the same value may not. Never use `==` to compare `Integer` values—use `equals` or unbox first.

**Caching:** Boxing may cache values (required for `int`/`short` in -128..127, `char` in '\u0000'..'\u007f', `byte`, `boolean`). Do not rely on identity for boxed values; use `equals` for value comparison.

```java
List<Integer> ints = new ArrayList<Integer>();
ints.add(1);           // boxing: int -> Integer
int n = ints.get(0);   // unboxing: Integer -> int
```

**Key Points:**
- Boxing converts primitive → wrapper; unboxing does the reverse.
- Type parameters must be reference types; prefer primitives for method results.
- Avoid `==` on wrapper types; use `equals` or unbox.
- Excessive boxing/unboxing in loops degrades performance (e.g., ~60% slower).

---

### 1.3 Foreach

The **foreach** loop (enhanced for) binds a variable to each element of a collection or array. It translates into iterator-based code.

Any type that implements `Iterable<E>` can be used in foreach. `Iterable` requires `Iterator<E> iterator()`. Collections implement this; arrays are special-cased by the compiler.

The translation introduces an iterator, uses `hasNext()` and `next()`, and applies unboxing when the loop variable is a primitive. The foreach form does not expose the iterator, so you cannot call `remove`. For `remove` or parallel iteration over multiple collections, use an explicit iterator.

```java
List<Integer> ints = Arrays.asList(1, 2, 3);
int s = 0;
for (int n : ints) { s += n; }
assert s == 6;
```

**Key Points:**
- Foreach uses `Iterable`/`Iterator` under the hood.
- Unboxing occurs when the loop variable has a primitive type.
- Use an explicit iterator when you need `remove` or parallel iteration.
- Foreach also works on arrays.

---

### 1.4 Generic Methods and Varargs

A **generic method** declares one or more type variables in its signature. The scope of the variable is the method only. A method that takes `T[]` and returns `List<T>` works for any `T`.

**Varargs** (`T...`) is syntactic sugar for a final array parameter. Callers can pass individual arguments (packed into an array) or an array directly. Varargs create arrays—beware when the element type is generic; use varargs only when the argument does not have a generic type (see Section 6.8).

Type parameters can be inferred from arguments, or given explicitly. Inference works when arguments correspond to the type parameter and share a common type. When there are no such arguments or they belong to different subtypes, you must supply the type explicitly.

```java
public static <T> List<T> toList(T... arr) {
  List<T> list = new ArrayList<T>();
  for (T elt : arr) list.add(elt);
  return list;
}
List<Integer> ints = Lists.toList(1, 2, 3);
List<String> words = Lists.toList("hello", "world");
List<Integer> empty = Lists.<Integer>toList();  // explicit type when no args
```

**Key Points:**
- Generic methods declare type variables with `<T>` before the return type.
- Varargs (`T...`) packs arguments into an array; avoid with generic element types.
- Type inference usually suffices; use explicit types when inference fails.
- `Arrays.asList` and `Collections.addAll` are similar utilities in the framework.

---

### 1.5 Assertions

The `assert` statement checks a boolean condition. If assertions are enabled (`-ea`) and the condition is false, an `AssertionError` is thrown with location information.

Assertions should have no side effects that non-assertion code depends on—they may be disabled. For conditions that might not hold (e.g., argument validation), use an explicit check and throw an exception instead.

```java
assert s == 6;
// When enabled: throws AssertionError if s != 6
```

**Key Points:**
- Use `assert` for conditions that should always hold during development.
- Enable with `-ea`; never rely on assertions for production correctness.
- For invalid input, use explicit checks and exceptions.

---

# Chapter 2: Subtyping and Wildcards

### 2.1 Subtyping and the Substitution Principle

**Subtyping** is defined by `extends` and `implements`. It is transitive. If `A` is a subtype of `B`, then `B` is a supertype of `A`.

**Substitution Principle:** Where a value of type `T` is expected, you may provide a value of any subtype of `T`.

For parameterized types, **invariance** applies: `List<Integer>` is *not* a subtype of `List<Number>`, and `List<Number>` is *not* a subtype of `List<Integer>`. Otherwise, you could assign a `List<Integer>` to `List<Number>` and add a `Double`, corrupting the list of integers. The compiler prevents this at compile time.

Arrays behave differently: `Integer[]` *is* a subtype of `Number[]` (covariance). The unsafety is caught at runtime via array store checks.

```java
List<Number> nums = new ArrayList<Number>();
nums.add(2);      // Integer is subtype of Number
nums.add(3.14);   // Double is subtype of Number

List<Integer> ints = new ArrayList<Integer>();
List<Number> nums2 = ints;  // compile-time error: invariance
```

**Key Points:**
- Substitution Principle: subtypes can stand in for supertypes.
- Generic types are invariant: `List<S>` and `List<T>` are unrelated unless S = T.
- Arrays are covariant; generics are invariant for type safety.
- Invariance prevents adding incompatible elements through a supertype reference.

---

### 2.2 Wildcards with extends

A **bounded wildcard** `? extends E` denotes some unknown type that is a subtype of `E`. It enables covariant-like behavior for generics.

With `? extends E`, you can *get* elements out of the structure (they are at least of type `E`), but you cannot *put* arbitrary elements in—the actual element type is unknown and might be a strict subtype of `E`.

```java
List<Number> nums = new ArrayList<Number>();
List<Integer> ints = Arrays.asList(1, 2);
List<Double> dbls = Arrays.asList(2.78, 3.14);
nums.addAll(ints);  // OK: List<Integer> <: Collection<? extends Number>
nums.addAll(dbls);  // OK

List<? extends Number> nums2 = ints;
nums2.add(3.14);   // compile-time error: cannot put into ? extends
```

**Key Points:**
- `? extends E`: read-only from the structure; elements are at least `E`.
- Enables covariant subtyping: `List<Integer>` <: `List<? extends Number>`.
- You cannot add elements (except `null`) to a structure declared with `? extends`.

---

### 2.3 Wildcards with super

A **lower-bounded wildcard** `? super T` denotes some unknown type that is a supertype of `T`. It enables contravariant-like behavior for "put" operations.

With `? super T`, you can *put* values of type `T` into the structure, but when you *get* elements out, you only know they are `Object`.

```java
List<Object> objs = Arrays.<Object>asList(2, 3.14, "four");
List<Integer> ints = Arrays.asList(5, 6);
Collections.copy(objs, ints);  // objs has type List<? super Integer>
assert objs.toString().equals("[5, 6, four]");
```

**Key Points:**
- `? super T`: write-only (put) for values of type `T`; get yields `Object`.
- Enables contravariant subtyping for destinations/consumers.
- Use for copy, add, and similar "put" operations.

---

### 2.4 The Get and Put Principle

**Get and Put Principle:** Use `extends` when you only *get* values from a structure, use `super` when you only *put* values into a structure, and use no wildcard when you both get and put.

This guides API design: source parameters use `? extends T`, destination parameters use `? super T`. When a structure is used for both reading and writing, use a concrete type (no wildcard).

Exceptions: you can put `null` into `? extends T`, and you can get `Object` from `? super T`.

```java
// Get only: use extends
public static double sum(Collection<? extends Number> nums) {
  double s = 0.0;
  for (Number num : nums) s += num.doubleValue();
  return s;
}

// Put only: use super
public static void count(Collection<? super Integer> ints, int n) {
  for (int i = 0; i < n; i++) ints.add(i);
}
```

**Key Points:**
- Get → `extends`; Put → `super`; Both → no wildcard.
- Wildcards do not enforce immutability; use unmodifiable wrappers for that.
- This is also known as PECS: Producer Extends, Consumer Super.

---

### 2.5 Arrays

Arrays use **covariant subtyping**: `S[]` is a subtype of `T[]` when `S` is a subtype of `T`. The problem is caught at *runtime* via an array store check. With generics, the analogous error is caught at *compile time*.

Arrays have reified element types; generics do not. In performance-critical code, primitive arrays avoid boxing; collections require wrappers.

```java
Integer[] ints = new Integer[] {1, 2, 3};
Number[] nums = ints;
nums[2] = 3.14;  // ArrayStoreException at runtime

List<Integer> intList = Arrays.asList(1, 2, 3);
List<Number> numList = intList;  // compile-time error
```

**Key Points:**
- Array subtyping is covariant; errors surface at runtime.
- Generic subtyping is invariant; wildcards add safe covariance/contravariance.
- Prefer collections for flexibility and compile-time safety; use arrays for primitives.

---

### 2.6 Wildcards Versus Type Parameters

The Collections Framework uses `contains(Object o)` and `containsAll(Collection<?> c)`—liberal signatures that allow testing membership with any object. An alternative design would use `contains(E o)` and `containsAll(Collection<? extends E> c)`—stricter typing that catches more errors at compile time.

The trade-off: liberal (framework) vs. strict (compile-time safety). For new APIs without legacy constraints, the stricter design may be preferable.

```java
// Framework style (wildcards)
boolean contains(Object o);
boolean containsAll(Collection<?> c);

// Alternative (type parameters)—stricter
boolean contains(E o);
boolean containsAll(Collection<? extends E> c);
```

**Key Points:**
- Wildcard style: more permissive, backward compatible.
- Type parameter style: stricter, catches more errors at compile time.
- Framework chose permissiveness for evolution; new APIs may prefer strictness.

---

### 2.7 Wildcard Capture

When a generic method is invoked with a wildcard argument, the compiler can **capture** the wildcard by fixing it to a type variable for the duration of the call.

A method like `reverse(List<?> list)` cannot implement reversal directly—the element type is unknown. The solution: expose a public wildcard signature and delegate to a private generic helper. The helper's type parameter captures the wildcard.

```java
public static void reverse(List<?> list) { rev(list); }
private static <T> void rev(List<T> list) {
  List<T> tmp = new ArrayList<T>(list);
  for (int i = 0; i < list.size(); i++)
    list.set(i, tmp.get(list.size() - i - 1));
}
```

**Key Points:**
- Wildcard capture: type parameter matches the unknown wildcard type in a generic method.
- Use a private generic helper when the public API uses a wildcard and needs to read/write.
- "capture of ?" in errors refers to a captured wildcard type.

---

### 2.8 Restrictions on Wildcards

Wildcards may not appear at the **top level** in:
1. **Instance creation:** `new ArrayList<?>()` is illegal.
2. **Explicit type parameters in method calls:** `Lists.<?>factory()` is illegal.
3. **Supertypes:** `extends ArrayList<?>` or `implements List<?>` is illegal.

Nested wildcards (e.g., `ArrayList<List<?>>`) are allowed because the outer type is still concrete.

```java
List<?> list = new ArrayList<Object>();   // OK
List<?> list = new ArrayList<?>();       // compile-time error
class Bad extends ArrayList<?> { }      // compile-time error
List<List<?>> lists = new ArrayList<List<?>>();  // OK: nested
```

**Key Points:**
- No top-level wildcards in `new`, explicit type args, or supertypes.
- Nested wildcards are allowed.
- Create at concrete types; use wildcards for variables and parameters.

---

# Chapter 3: Comparison and Bounds

### 3.1 Comparable

The `Comparable<T>` interface defines natural ordering via `compareTo(T o)`, returning a negative, zero, or positive value. Types typically compare only with the same type.

**Contract:** Antisymmetry, transitivity, reflexivity, and congruence. Recommended: `x.equals(y)` iff `x.compareTo(y) == 0`. `compareTo(null)` must throw `NullPointerException`.

**Implementation pitfall:** Avoid `return this.value - that.value` for `compareTo`—overflow can produce wrong results. Use explicit -1/0/1 comparisons.

```java
interface Comparable<T> {
  public int compareTo(T o);
}
// Correct implementation:
// return (value < i.value) ? -1 : (value == i.value) ? 0 : 1;
// Avoid: return this.value - that.value;  // overflow risk
```

**Key Points:**
- `Comparable<T>` provides natural ordering; use `compareTo` for comparisons.
- Keep natural ordering consistent with `equals` when possible.
- Use -1/0/1 comparisons, not subtraction, to avoid overflow.

---

### 3.2 Maximum of a Collection

To find the maximum of a collection, elements must be comparable. A bounded type variable expresses this: `<T extends Comparable<T>>`.

For flexibility, use `<T extends Comparable<? super T>>` and `Collection<? extends T>` so that subtypes (e.g., `Orange` extending `Fruit` with `Comparable<Fruit>`) are supported.

```java
public static <T extends Comparable<? super T>> T max(Collection<? extends T> coll) {
  T candidate = coll.iterator().next();
  for (T elt : coll)
    if (candidate.compareTo(elt) < 0) candidate = elt;
  return candidate;
}
```

**Key Points:**
- Bounded type variables: `T extends Comparable<? super T>` for maximum flexibility.
- Use `? super T` with `Comparable` to support subtypes comparing via a supertype.
- Use `Collection<? extends T>` when only reading.

---

### 3.3 A Fruity Example

Two designs illustrate comparability choices:

**Prohibit cross-type comparison:** `Apple implements Comparable<Apple>`, `Orange implements Comparable<Orange>`. You can compare apples with apples but not mixed fruit.

**Permit comparison:** `Fruit implements Comparable<Fruit>`, `Apple` and `Orange` extend `Fruit`. All fruits share one ordering (e.g., by size). The `? super T` in `Comparable<? super T>` is necessary so `Orange` satisfies the bound.

```java
abstract class Fruit implements Comparable<Fruit> {
  public int compareTo(Fruit that) {
    return Integer.compare(this.size, that.size);
  }
}
```

**Key Points:**
- Comparable on the base vs. subclasses controls cross-type comparability.
- `? super T` enables subtypes to implement `Comparable` on a supertype.

---

### 3.4 Comparator

`Comparator<T>` provides an *extrinsic* ordering: `int compare(T o1, T o2)`. Use it when `T` does not implement `Comparable` or you want a different ordering.

The libraries offer both `Comparable`-based and `Comparator`-based versions of `max`, `min`, `sort`, etc.

```java
Comparator<String> sizeOrder = (s1, s2) ->
  s1.length() != s2.length()
    ? Integer.compare(s1.length(), s2.length())
    : s1.compareTo(s2);
```

**Key Points:**
- Use `Comparator` for custom or extrinsic orderings.
- Prefer `Comparator<? super T>` for flexibility.

---

### 3.5 Enumerated Types

Each `enum` declaration expands into a class extending `java.lang.Enum<E>`, with `E extends Enum<E>`. This recursive bound ensures each enum type compares only with itself.

`Enum<E extends Enum<E>>` implements `Comparable<E>`, so `Season` implements `Comparable<Season>`—you can compare seasons with seasons but not with other enums.

```java
enum Season { WINTER, SPRING, SUMMER, FALL }
// Expands to: final class Season extends Enum<Season> implements Comparable<Season>
```

**Key Points:**
- `Enum<E extends Enum<E>>` enforces type-safe enum comparison.
- Each constant is a singleton; ordinals define comparison order.

---

### 3.6 Multiple Bounds

A type variable can have multiple bounds: `<T extends A & B & C>`. Use `&` to separate bounds. The first bound is used for erasure.

The `Object & Comparable<? super T>` pattern ensures the erased signature of `max` returns `Object` instead of `Comparable`, preserving binary compatibility.

```java
public static <S extends Readable & Closeable, T extends Appendable & Closeable>
void copy(S src, T trg, int size) throws IOException {
  // Can call src.read(), src.close(), trg.append(), trg.close()
}
```

**Key Points:**
- Multiple bounds: `T extends A & B & C`.
- First bound determines erasure; affects binary compatibility.
- Use when a type must implement several interfaces.

---

### 3.7 Bridges

When a class implements `Comparable<Integer>`, it declares `compareTo(Integer)`, but the erased interface has `compareTo(Object)`. The compiler generates a **bridge method** that overrides `compareTo(Object)`, casts to `Integer`, and delegates.

```java
// Source
class Integer implements Comparable<Integer> {
  public int compareTo(Integer i) { ... }
}
// Compiler generates bridge:
// public int compareTo(Object o) { return compareTo((Integer)o); }
```

**Key Points:**
- Bridges preserve overriding under erasure.
- Generated automatically; visible via reflection.

---

### 3.8 Covariant Overriding

In Java 5+, an overriding method may have a **more specific return type** (covariant return). This is implemented via a bridge method.

```java
class Point {
  public int x, y;
  public Point clone() { return new Point(x, y); }  // covariant
}
Point q = p.clone();  // no cast needed
```

**Key Points:**
- Covariant overriding: overriding method may narrow the return type.
- Implemented with bridges; enables more precise return types without casting.

---

# Chapter 4: Declarations

### 4.1 Constructors

In a generic class, type parameters appear in the class header, not in the constructor. The compiler infers type safety from the class declaration.

```java
class Pair<T, U> {
  private final T first;
  private final U second;
  public Pair(T first, U second) { this.first=first; this.second=second; }
  public T getFirst() { return first; }
  public U getSecond() { return second; }
}

Pair<String, Integer> pair = new Pair<String, Integer>("one", 2);
```

**Key Points:**
- Type parameters are declared on the class, not the constructor.
- Omitting type parameters produces a raw type and triggers unchecked warnings.

---

### 4.2 Static Members

Because generics use erasure, `List<Integer>`, `List<String>`, and `List<List<String>>` all map to the same class `List` at runtime. Static members are shared across all instantiations. Static members cannot refer to type parameters.

```java
class Cell<T> {
  private static int count = 0;
  private static synchronized int nextId() { return count++; }
  private final int id;
  private final T value;
  public Cell(T value) { this.value=value; id=nextId(); }
}

Cell<String> a = new Cell<String>("one");
Cell<Integer> b = new Cell<Integer>(2);
assert Cell.getCount() == 2;  // shared across instantiations
```

**Key Points:**
- Static fields and methods are shared by all instantiations of the generic class.
- Static members cannot reference type parameters.
- Access static members via the raw class name only.

---

### 4.3 Nested Classes

**Non-static nested classes** share the type parameters of the enclosing class. **Static nested classes** do not; they need their own type parameters.

```java
// Non-static: E is in scope from enclosing class
public class LinkedCollection<E> extends AbstractCollection<E> {
  private class Node {
    private E element;
    private Node next = null;
  }
}

// Static: must declare its own type parameter
class LinkedCollection<E> extends AbstractCollection<E> {
  private static class Node<T> {
    private T element;
    private Node<T> next = null;
  }
  private Node<E> first = new Node<E>(null);
}
```

**Key Points:**
- Non-static inner classes can use the outer class's type parameters.
- Static nested classes require their own parameters; avoid hidden reference to enclosing instance.

---

### 4.4 How Erasure Works

Erasure removes type parameters from parameterized types and substitutes type variables with the erasure of their bound (or `Object` if unbound, or the leftmost bound if multiple).

```java
// Erasure examples:
// List<Integer>, List<String>  →  List
// T with no bound  →  Object
// T with bound Comparable<? super T>  →  Comparable
// T with bound Object & Comparable<T>  →  Object (leftmost bound)
// S with bound Readable & Closeable  →  Readable
```

**Signature constraints:** Two methods cannot have the same erasure. A class cannot implement two interfaces whose erasures are identical.

```java
// Not allowed: same erasure
class Overloaded {
  public static boolean allZero(List<Integer> ints) { ... }  // clash
  public static boolean allZero(List<String> strings) { ... }  // same erasure
}

// Not allowed: two interfaces with same erasure
class Integer implements Comparable<Integer>, Comparable<Long> { ... }  // error
```

**Key Points:**
- Overloading and interface implementation require distinct erasure.
- Return type alone can distinguish overloaded methods, but parameter erasure must not conflict.

---

# Chapter 5: Evolution, Not Revolution

### 5.1 Legacy Library with Legacy Client

The baseline is pre-generics Java 1.4: interfaces and classes use `Object`, explicit boxing/unboxing, and raw collections.

```java
interface Stack {
  public boolean empty();
  public void push(Object elt);
  public Object pop();
}
```

---

### 5.2 Generic Library with Generic Client

Migrating to generics involves adding type parameters and replacing `Object` with type variables. The resulting bytecode is effectively the same as legacy code.

```java
interface Stack<E> {
  public boolean empty();
  public void push(E elt);
  public E pop();
}
// Client: stack.push(i); int top = stack.pop();  // boxing/unboxing implicit
```

**Key Points:**
- Conversion is mostly mechanical: add type parameters and replace `Object`.
- Legacy and generic versions produce equivalent class files (binary compatibility).

---

### 5.3 Generic Library with Legacy Client

**Raw types** are the unparameterized counterparts of generic types. Any parameterized type is a subtype of its raw type. Passing a raw type where a parameterized type is expected triggers unchecked conversion warnings.

**Key Points:**
- Raw types exist to support gradual migration.
- Use `-Xlint:unchecked` to surface unchecked usage.
- Suppress expected unchecked warnings with `@SuppressWarnings("unchecked")`.

---

### 5.4 Legacy Library with Generic Client

When the client is generic but the library is legacy, three options exist:

**5.4.1 Minimal Changes:** Update library signatures only—add type parameters, add casts, suppress expected unchecked warnings. Preferred when source is available.

```java
@SuppressWarnings("unchecked")
class ArrayStack<E> implements Stack<E> {
  private List list;  // unchanged
  public void push(E elt) { list.add(elt); }
  public E pop() { return (E)list.remove(list.size()-1); }
}
```

**5.4.2 Stubs:** Create stub classes with generic signatures and empty methods. Compile the client against stubs; run against legacy class files. Use when source is unavailable.

**5.4.3 Wrappers (Not Recommended):** Introduce a parallel generic hierarchy delegating to legacy types. Breaks object identity and adds complexity. Avoid.

---

### 5.5 Conclusions

**Key Points:**
- Erasure enables binary compatibility between legacy and generic code.
- Migration can proceed in either direction (library or client first).
- Java's erasure-based approach makes evolution simpler than C#'s separation of legacy and generic types.

---

# Chapter 6: Reification

### 6.1 Reifiable Types

A type is **reifiable** if it is fully represented at runtime (erasure does not remove any needed information).

**Reifiable:** Primitive types, non-parameterized classes (`Number`, `String`), parameterized types with only unbounded wildcards (`List<?>`, `Map<?, ?>`), raw types (`List`), arrays of reifiable types (`int[]`, `Number[]`).

**Non-reifiable:** Type variables (`T`), parameterized types with concrete arguments (`List<Number>`), parameterized types with bounds (`List<? extends Number>`).

---

### 6.2 Instance Tests and Casts

Instance tests and casts require reifiable types at runtime.

```java
// Works: Integer is reifiable
if (o instanceof Integer) { ... }

// Fails: List<E> is not reifiable
if (o instanceof List<E>) { ... }  // compile-time error

// Correct: use List<?>
if (o instanceof List<?>) {
  Iterator<?> it = ((List<?>)o).iterator();
}
```

**Unchecked casts:** The compiler permits casts to non-reifiable types but emits unchecked warnings. Minimize and document them.

**Key Points:**
- Use `instanceof` and casts only with reifiable types where possible.
- Prefer `List<?>` over raw `List` for stronger static guarantees.
- Casts inserted by erasure can fail far from the original unchecked cast.

---

### 6.3 Exception Handling

Exception types interact with reification in two important ways. First, `catch` clauses rely on runtime type checks (`instanceof`), so the caught type must be reifiable. You cannot write `catch (ParametricException<Integer> e)` because the JVM cannot distinguish `ParametricException<Integer>` from `ParametricException<String>` at runtime — both erase to `ParametricException`.

Second, and more fundamentally, you cannot create a generic exception class at all. A class like `class ParametricException<T> extends Exception` is illegal because if it were allowed, you could catch parameterized exception types, which requires non-reifiable `instanceof` checks.

However, type variables *are* allowed in `throws` clauses. A generic method can declare `throws X` where `X extends Throwable` is a type parameter. This is useful in the Function pattern (Chapter 9) where a function object may throw a checked exception determined by the caller.

```java
// Not allowed: generic exception class
class ParametricException<T> extends Exception { ... }  // compile-time error

// Allowed: type variable in throws clause
interface Action<X extends Exception> {
  void perform() throws X;
}
```

**Key Points:**
- Exception classes cannot be generic; `catch` requires reifiable types.
- Type variables in `throws` clauses are allowed and useful for generic functional interfaces.
- The restriction prevents ambiguous catch blocks that could not be distinguished at runtime.

---

### 6.4 Array Creation

Arrays reify their component type. Creating arrays whose component type is not reifiable is forbidden.

```java
T[] a = new T[c.size()];  // compile-time error: generic array creation
return new List<Integer>[] {a, b};  // compile-time error
```

**Key Points:**
- Prefer collections over arrays for generic types.
- When arrays are needed, use the Principle of Truth in Advertising (Section 6.5).

---

### 6.5 The Principle of Truth in Advertising

**Principle:** The runtime (reified) type of an array must be a subtype of the erasure of its static type.

```java
// Wrong: reified type is Object[], but static type is String[]
public static <T> T[] toArray(Collection<T> c) {
  T[] a = (T[])new Object[c.size()];  // ClassCastException at call site!
}

// Right: pass array or Class to obtain correct reified type
public static <T> T[] toArray(Collection<T> c, T[] a) {
  if (a.length < c.size())
    a = (T[])java.lang.reflect.Array.newInstance(
        a.getClass().getComponentType(), c.size());
  int i=0; for (T x : c) a[i++] = x;
  return a;
}
String[] a = toArray(strings, new String[0]);
```

**Key Points:**
- Obtain arrays from an existing array or a `Class` token to get the right reified type.
- The `toArray(T[] a)` pattern in `Collection` follows this principle.

---

### 6.6 The Principle of Indecent Exposure

**Principle:** Never publicly expose an array whose component type is not reifiable.

Array store checks cannot enforce parameterized component types—the reified type is only `List`, so wrong lists can be stored, causing `ClassCastException` where no explicit cast appears.

**Key Points:**
- Keep non-reifiable arrays private (e.g., internal storage in `ArrayList`).
- Violations can cause errors far from the source.

---

### 6.7 How to Define ArrayList

`ArrayList` uses a private `Object[]` cast to `E[]`. The array never escapes, so it does not violate the principles. The `toArray` methods follow Truth in Advertising.

```java
class ArrayList<E> extends AbstractList<E> {
  private E[] arr;  // never exposed
  public ArrayList(int cap) {
    arr = (E[])new Object[cap];  // unchecked cast, but private
  }
}
```

---

### 6.8 Array Creation and Varargs

Varargs (`T...`) are syntactic sugar for an array parameter (`T[]`). When the vararg element type is not reifiable (e.g., `List<Integer>`), the JVM must create an array of a non-reifiable component type, which triggers an unchecked generic array creation warning.

This is unavoidable with methods like `Arrays.asList(T...)` when called with parameterized types. The array created at the call site has component type `List` (erased), not `List<Integer>`. If the array escapes the method and is stored in a field typed as `Object[]`, wrong elements could be inserted.

Java 7 introduced `@SafeVarargs` to suppress these warnings on methods that do not store or expose the varargs array. Methods like `Arrays.asList`, `Collections.addAll`, and `EnumSet.of` are annotated with `@SafeVarargs` because they only read from the array.

```java
List<Integer> a = Arrays.asList(1, 2);
List<Integer> b = Arrays.asList(3, 4);
List<List<Integer>> x = Arrays.asList(a, b);  // generic array creation warning

@SafeVarargs
static <T> List<T> safeList(T... elements) {
  return Arrays.asList(elements);  // safe: only reads from array
}
```

**Key Points:**
- Varargs create arrays; non-reifiable element types trigger warnings.
- Use `@SafeVarargs` on methods that only read from the varargs array.
- Avoid varargs with non-reifiable types when the array could escape or be written to.

---

### 6.9 Arrays as a Deprecated Type?

Given the many restrictions on generic arrays (no creation, no covariant safety, exposure risks), collections are often preferable to arrays. Collections offer richer typing (`List<? extends T>`, `List<? super T>`), more flexibility (dynamic sizing, richer APIs), and avoidance of reification issues entirely.

The main cases where arrays are still justified: primitive arrays (`int[]`, `double[]`) for performance-critical code where boxing overhead matters; interop with APIs that require arrays (e.g., `main(String[] args)`, some legacy frameworks); and `varargs`, which are inherently array-based.

Some JDK APIs (e.g., `TypeVariable<D>.getBounds()` returning `Type[]`) actually violate the Principle of Indecent Exposure — returning arrays of non-reifiable component types. This is a known wart in the API.

**Key Points:**
- Prefer collections as the default container; arrays for primitives and legacy interop.
- Generic arrays are fraught with restrictions; collections avoid all of them.
- Even the JDK has a few APIs that expose non-reifiable arrays inappropriately.

---

# Chapter 7: Reflection

### 7.1 Generics for Reflection

`Class` is now generic: `Class<T>`. Class literals and `getClass()` provide type parameters that help avoid casts and catch type mistakes at compile time.

```java
Class<Integer> ki = Integer.class;
Number n = new Integer(42);
Class<? extends Number> kn = n.getClass();
assert ki == kn;
```

Key `Class<T>` methods: `newInstance()`, `cast(Object)`, `getSuperclass()`, `asSubclass(Class<U>)`, `getAnnotation(Class<A>)`.

**Key Points:**
- `T.class` has type `Class<T>` when `T` has no type parameters.
- `e.getClass()` has type `Class<? extends T>` when `e` has type `T`.
- `Class<T>` improves type safety for reflection, annotations, and checked collections.

---

### 7.2 Reflected Types are Reifiable Types

Reflection exposes reified type information. Parameterized types collapse to their raw types at runtime.

```java
List<Integer> ints = new ArrayList<Integer>();
List<String> strs = new ArrayList<String>();
assert ints.getClass() == strs.getClass();  // same Class object
assert ints.getClass() == ArrayList.class;
```

**Key Points:**
- Class literals and `getClass()` always yield reifiable types.
- `List<Integer>.class` and `List<?>.class` are illegal.

---

### 7.3 Reflection for Primitive Types

Primitive types have class literals. `int.class` is typed as `Class<Integer>`, which can be misleading for `cast` and `newInstance`.

```java
// int.class.cast(o) throws; int has no instances
// Array.newInstance(int.class, size) returns int[], not Integer[]
```

---

### 7.4 A Generic Reflection Library

Encapsulate unchecked reflection in a small library so application code stays free of unchecked casts.

```java
class GenericReflection {
  public static <T> T newInstance(T obj) throws Exception {
    return (T) obj.getClass().getConstructor().newInstance();
  }
  public static <T> T[] newArray(Class<? extends T> k, int size) {
    return (T[]) java.lang.reflect.Array.newInstance(k, size);
  }
}
```

**Key Points:**
- Centralize unchecked casts in a few reflection helpers.
- Check `isPrimitive()` when allocating arrays via `Class`.

---

### 7.5 Reflection for Generics

The reflection API can inspect generic signatures. Use `toString` for erased types and `toGenericString` for generic signatures.

```java
// toString:     private java.lang.Object Cell.value
// toGenericString: private E Cell.value
```

---

### 7.6 Reflecting Generic Types

The `Type` hierarchy models generic types:
- **Class** — primitive or raw type
- **ParameterizedType** — e.g., `List<String>`, with `getRawType()`, `getActualTypeArguments()`
- **TypeVariable** — type variable with bounds
- **GenericArrayType** — generic array
- **WildcardType** — `? extends T`, `? super T`

```java
public static void printType(Type type) {
  if (type instanceof Class) {
    out.print(((Class)type).getName());
  } else if (type instanceof ParameterizedType) {
    ParameterizedType p = (ParameterizedType)type;
    out.print(((Class)p.getRawType()).getName());
  } else if (type instanceof TypeVariable<?>) {
    out.print(((TypeVariable<?>)type).getName());
  } else if (type instanceof GenericArrayType) {
    printType(((GenericArrayType)type).getGenericComponentType());
    out.print("[]");
  }
}
```

**Key Points:**
- Use `Field.getGenericType()`, `Method.getGenericReturnType()` for generic info.
- `TypeVariable<D>` is parameterized by its declaring element.

---

# Chapter 8: Effective Generics

### 8.1 Take Care when Calling Legacy Code

Legacy code that uses raw types can break type safety. Use checked collections to detect wrong types at the boundary.

```java
// Naive: ClassCastException far from cause
List<Integer> list = new ArrayList<Integer>();
LegacyLibrary.addItems(list);
for (int i : list) s += i;  // boom

// Wary: detect at boundary
List<Integer> view = Collections.checkedList(list, Integer.class);
LegacyLibrary.addItems(view);  // ClassCastException at addItems
```

---

### 8.2 Use Checked Collections to Enforce Security

Generic types do not enforce security in untrusted code. Checked collections add runtime checks at add/set operations.

```java
List<AuthenticatedOrder> orders = new ArrayList<>();
supplier.addOrders(Collections.checkedList(orders, AuthenticatedOrder.class));
```

---

### 8.3 Specialize to Create Reifiable Types

Create reifiable wrapper types for instance tests, casts, and arrays when parameterized types are not reifiable.

**Delegation (wrapper):**
```java
interface ListString extends List<String> {}
class ListStrings {
  public static ListString wrap(final List<String> list) { ... }
}
ListString[] array = new ListString[2];  // legal: ListString is reifiable
```

**Inheritance:**
```java
class ArrayListString extends ArrayList<String> implements ListString { }
```

**Key Points:**
- Delegation adds a view; inheritance creates a new list.
- Delegation is safer: raw-type add on a delegated list fails.

---

### 8.4 Maintain Binary Compatibility

When generifying code, erasure of signatures must match legacy bytecode. Watch erasure, bridge methods, and covariant overrides.

```java
// Wrong erasure:
public static <T extends Comparable<? super T>> T max(Collection<? extends T> coll)
// erasure: Comparable max(Collection) — doesn't match legacy Object max(Collection)

// Correct: multiple bounds controls erasure
public static <T extends Object & Comparable<? super T>> T max(Collection<? extends T> coll)
// erasure: Object max(Collection) — matches
```

**Key Points:**
- Erasure of new signatures must match legacy signatures.
- Use multiple bounds (`Object & Comparable<...>`) to control erasure.
- Partial generification can cause subtle behavioral bugs.

---

# Chapter 9: Design Patterns

### 9.1 Visitor

The Visitor pattern adds new operations without changing the data structure. Each case dispatches to a visitor method. Generics make the visitor type-safe by parameterizing on element type `E` and result type `R`.

```java
abstract class Tree<E> {
  public interface Visitor<E, R> {
    public R leaf(E elt);
    public R branch(R left, R right);
  }
  public abstract <R> R visit(Visitor<E, R> v);

  public static <T> Tree<T> leaf(final T e) {
    return new Tree<T>() {
      public <R> R visit(Visitor<T, R> v) { return v.leaf(e); }
    };
  }
  public static <T> Tree<T> branch(final Tree<T> l, final Tree<T> r) {
    return new Tree<T>() {
      public <R> R visit(Visitor<T, R> v) {
        return v.branch(l.visit(v), r.visit(v));
      }
    };
  }
}

String s = t.visit(new Tree.Visitor<Integer, String>() {
  public String leaf(Integer e) { return e.toString(); }
  public String branch(String l, String r) { return "("+l+"^"+r+")"; }
});
```

**Key Points:**
- Visitor has two type parameters: element type `E` and result type `R`.
- Without generics, visitors often return `Object` and need casts.
- New operations are added by new visitor implementations.

---

### 9.2 Interpreter

Expressions can be typed by their result. `Exp<Integer>` evaluates to an integer; `Exp<Pair<A,B>>` to a pair.

```java
abstract class Exp<T> {
  abstract public T eval();
  static Exp<Integer> lit(final int i) {
    return new Exp<Integer>() { public Integer eval() { return i; } };
  }
  static Exp<Integer> plus(final Exp<Integer> e1, final Exp<Integer> e2) {
    return new Exp<Integer>() { public Integer eval() {
      return e1.eval() + e2.eval();
    } };
  }
  static <A, B> Exp<Pair<A, B>> pair(final Exp<A> e1, final Exp<B> e2) {
    return new Exp<Pair<A, B>>() { public Pair<A, B> eval() {
      return new Pair<A, B>(e1.eval(), e2.eval());
    } };
  }
}
```

**Key Points:**
- Expression types are parameterized by their value type.
- Type-safe interpretation without casts.

---

### 9.3 Function

Model functions as objects with a type parameter for the exception type in `throws`.

```java
interface Function<A, B, X extends Throwable> {
  public B apply(A x) throws X;
}

public static <A, B, X extends Throwable>
List<B> applyAll(Function<A, B, X> f, List<A> list) throws X {
  List<B> result = new ArrayList<B>(list.size());
  for (A x : list) result.add(f.apply(x));
  return result;
}
```

**Key Points:**
- Use `Error` or `RuntimeException` when no checked exceptions are thrown.
- Call sites must handle the declared exception type.

---

### 9.4 Strategy

Decouple algorithms from the types they operate on using parallel hierarchies and recursive bounds.

```java
abstract class TaxPayer<P extends TaxPayer<P>> {
  private TaxStrategy<P> strategy;
  protected abstract P getThis();
  public long computeTax() { return strategy.computeTax(getThis()); }
}
final class Person extends TaxPayer<Person> {
  protected Person getThis() { return this; }
}
```

**Key Points:**
- Recursive bound `P extends TaxPayer<P>` ties the strategy to the concrete subtype.
- `getThis()` gives `this` the more specific type `P` in the base class.
- Similar pattern to `Comparable<T>` and `Enum<E>`.

---

### 9.5 Subject-Observer

Subject-Observer uses mutually recursive type parameters for subject, observer, and notification type.

```java
public class Observable<S extends Observable<S,O,A>,
                        O extends Observer<S,O,A>, A> { ... }
public interface Observer<S extends Observable<S,O,A>,
                          O extends Observer<S,O,A>, A> {
  public void update(S subject, A argument);
}
```

**Key Points:**
- `S`, `O`, and `A` are mutually recursive in their bounds.
- Both `S` and `O` are needed so each can refer to the other in method parameters.

---

# Part II — Collections

---

# Chapter 10: The Main Interfaces of the Java Collections Framework

The Java Collections Framework is built around a hierarchy of interfaces that define contracts for different kinds of collections.

```
Iterable<T>
  └── Collection<E>
        ├── Set<E> → SortedSet<E> → NavigableSet<E>
        ├── List<E>
        ├── Queue<E> → Deque<E>
        │                  ├── BlockingQueue<E>
        │                  └── BlockingDeque<E>
Map<K,V>
  ├── SortedMap<K,V> → NavigableMap<K,V>
  └── ConcurrentMap<K,V> → ConcurrentNavigableMap<K,V>
```

- **Collection** contains the core functionality for any collection other than a map.
- **Set** — no duplicates, order not significant. Extended by **SortedSet** (sorted iteration) and **NavigableSet** (closest-match navigation).
- **Queue** — accepts at tail, yields at head. Extended by **Deque** (both ends), **BlockingQueue** and **BlockingDeque** (concurrent blocking).
- **List** — ordered collection that permits duplicates.
- **Map** — key-value associations. Extended by **ConcurrentMap**, **SortedMap**, **NavigableMap**, **ConcurrentNavigableMap**.

**Key Points:**
- Collection defines behavior for all non-map collections.
- Interfaces define contracts; implementations vary in performance and behavior.

---

# Chapter 11: Preliminaries

### 11.1 Iterable and Iterators

An iterator implements `Iterator<E>` with `hasNext()`, `next()`, and `remove()`. Collection classes implement `Iterable<E>`, which supplies an `Iterator<E>` for foreach.

General-purpose collections use **fail-fast** iterators that throw `ConcurrentModificationException` when they detect structural modifications since iteration began.

```java
class Counter implements Iterable<Integer> {
  private int count;
  public Counter(int count) { this.count = count; }
  public Iterator<Integer> iterator() {
    return new Iterator<Integer>() {
      private int i = 0;
      public boolean hasNext() { return i < count; }
      public Integer next() { return ++i; }
      public void remove() { throw new UnsupportedOperationException(); }
    };
  }
}
for (int i : new Counter(3)) { total += i; }
```

**Key Points:**
- `Iterable<T>` provides `Iterator<T>`; required for foreach.
- Fail-fast iterators throw `ConcurrentModificationException` on structural change.
- Use `Iterator.remove()` when modifying during iteration.
- Concurrent collections use different policies (weakly consistent, snapshot).

---

### 11.2 Implementations

Four main backing structures:

| Structure | Strengths | Used By |
|-----------|-----------|---------|
| **Arrays** | Fast random access, fast iteration | ArrayList, ArrayDeque, EnumSet |
| **Linked lists** | O(1) insert/remove by reference | LinkedList, ConcurrentLinkedQueue |
| **Hash tables** | O(1) content access, unordered | HashSet, HashMap, ConcurrentHashMap |
| **Trees** | O(log n) sorted access | TreeSet, TreeMap |

**Key Points:**
- Choose implementations based on dominant operations.
- No single "best" implementation; trade-offs depend on usage patterns.

---

### 11.3 Efficiency and the O-Notation

| Time | Effect when N doubles | Example |
|------|----------------------|---------|
| O(1) | Unchanged | Hash table insertion |
| O(log N) | + constant | Tree insertion |
| O(N) | Doubled | Linear search |
| O(N log N) | Doubled + proportional | Merge sort |
| O(N²) | Fourfold | Bubble sort |

**Amortized cost** matters when operations vary. Adding to ArrayList is usually O(1), but occasional resizes are O(N). Over many additions, the amortized cost per add is O(1).

---

### 11.4 Contracts

Interfaces define contracts: preconditions and postconditions. **Optional operations** (e.g., `add`, `remove`) may throw `UnsupportedOperationException` when unsupported.

```java
List<String> fixed = Arrays.asList("a", "b", "c");
fixed.add("d");  // UnsupportedOperationException
```

---

### 11.5 Collections and Thread Safety

**Legacy (JDK 1.0):** Vector and Hashtable synchronize every method—costly, avoid.

**JDK 1.2 — Synchronized wrappers:** Wrap unsynchronized collections with `Collections.synchronizedList()`, etc. Test-then-act requires client-side locking.

```java
synchronized(stack) {
  if (!stack.isEmpty()) { stack.pop(); }
}
```

**Java 5+ — Concurrent collections:** ConcurrentHashMap, CopyOnWriteArrayList, etc. Mechanisms include:
- **Copy-on-write:** Immutable backing; writes create new copy.
- **Compare-and-swap (CAS):** Lock-free updates.
- **Fine-grained locking:** Lock only affected segments.

**Iterator policies:**
- **Fail-fast:** Structural change → ConcurrentModificationException
- **Snapshot:** Iterator sees state at creation (CopyOnWrite collections)
- **Weakly consistent:** May see some concurrent changes; no CME

---

# Chapter 12: The Collection Interface

### 12.1 The Collection Methods

Collection defines four groups of methods:

**Adding:** `add(E e)`, `addAll(Collection<? extends E> c)` — return whether collection changed.

**Removing:** `remove(Object)`, `clear()`, `removeAll(Collection<?>)`, `retainAll(Collection<?>)`.

**Querying:** `contains(Object)`, `containsAll(Collection<?>)`, `isEmpty()`, `size()`.

**Making contents available:** `iterator()`, `toArray()`, `toArray(T[] a)`.

```java
Collection<String> cs = ...;
String[] sa = cs.toArray(new String[0]);

// Primitive array: manual copy
List<Integer> list = Arrays.asList(0, 1, 2);
int[] a = new int[list.size()];
for (int i = 0; i < list.size(); i++) a[i] = list.get(i);
```

**Key Points:**
- Add methods use parametric type E; remove/contains use Object/Collection<?>.
- `toArray(T[])` requires reference type T; no direct support for primitive arrays.
- Remove during iteration: use `Iterator.remove()`, not collection remove.

---

### 12.2 Using the Methods of Collection

For **removal during iteration**, use `Iterator.remove()`:

```java
// Wrong: ConcurrentModificationException
for (Task t : tasks) {
  if (t instanceof PhoneTask) tasks.remove(t);
}

// Correct: use iterator's remove
for (Iterator<Task> it = tasks.iterator(); it.hasNext(); ) {
  Task t = it.next();
  if (t instanceof PhoneTask) it.remove();
}
```

**Key Points:**
- `removeAll(x)` removes intersection; `retainAll(x)` keeps intersection.
- Structural changes during iteration require `Iterator.remove()`.

---

### 12.3 Implementing Collection and Collection Constructors

`AbstractCollection` provides a skeletal implementation. Most concrete classes implement Set, List, or Queue, not Collection directly.

Most implementations share two constructor forms: a default constructor and a **conversion constructor** taking `Collection<? extends E>`.

```java
public HashSet()
public HashSet(Collection<? extends E> c)
```

---

# Chapter 13: Sets

### 13.1 HashSet

The most common Set implementation. Uses a hash table with chaining for collisions. Good hash functions spread values evenly; collisions are handled by linked lists in each bucket.

**Performance:** add, remove, contains: O(1) expected. Iteration: O(capacity + n). Order is unspecified.

```java
Set<Character> s1 = new HashSet<>(8);
s1.add('a'); s1.add('b'); s1.add('j');
// Order undefined
```

**Key Points:**
- O(1) expected for add, remove, contains.
- Iteration cost depends on table capacity, not just size.
- Not thread-safe; fail-fast iterators.

---

### 13.2 LinkedHashSet

Extends HashSet and adds **insertion-order** iteration via a doubly linked list alongside the hash table. `next()` is O(1) per element.

```java
Set<Character> s2 = new LinkedHashSet<>(8);
Collections.addAll(s2, 'a', 'b', 'j');
assert s2.toString().equals("[a, b, j]");
```

**Key Points:**
- Insertion-order guarantee.
- Choose over HashSet when order or iteration speed matter.

---

### 13.3 CopyOnWriteArraySet

Backed by CopyOnWriteArrayList. Every write creates a new backing array. add and contains are O(n). Iteration uses a snapshot—never throws CME.

**Key Points:**
- Good when reads greatly outnumber writes (e.g., observer lists).
- Lock-free reads; snapshot iterators; remove not supported on iterator.

---

### 13.4 EnumSet

Optimized for enum element types using a bit vector. add, remove, contains are O(1) bit operations. For small enums (≤64), a single long is used.

```java
EnumSet<Priority> highAndMedium = EnumSet.range(Priority.HIGH, Priority.MEDIUM);
EnumSet<Priority> all = EnumSet.allOf(Priority.class);
```

**Key Points:**
- Use only for enum element types.
- Factory methods instead of constructors.
- Natural-order iteration; weakly consistent iterators.

---

### 13.5 SortedSet and NavigableSet

**SortedSet** guarantees ascending iteration order. Range views: `subSet(from, to)` [from, to), `headSet(to)`, `tailSet(from)`.

**NavigableSet** (Java 6) extends SortedSet with flexible navigation: `ceiling(e)`, `floor(e)`, `higher(e)`, `lower(e)`, `pollFirst()`, `pollLast()`, `descendingSet()`, and inclusive/exclusive range views.

```java
NavigableSet<String> strings = new TreeSet<>();
Collections.addAll(strings, "abc", "cde", "x-ray", "zed");
String last = strings.floor("x-ray");  // "x-ray"
String lower = strings.lower(last);    // "cde"
```

**Key Points:**
- Prefer NavigableSet over SortedSet for new code.
- ceiling/floor/higher/lower for closest-match navigation.
- null used for "not found"; avoid null elements.

---

### 13.6 TreeSet

NavigableSet backed by a red-black tree. add, remove, contains are O(log n). Iteration is in sorted order.

```java
Set<Task> ordered = new TreeSet<>(mondayTasks);
ordered.addAll(tuesdayTasks);
```

**Key Points:**
- Red-black tree; O(log n) operations.
- SortedSet constructor preserves comparator; Collection constructor uses natural order.

---

### 13.7 ConcurrentSkipListSet

Concurrent NavigableSet backed by a skip list. O(log n) operations. Lock-free concurrent algorithms. Weakly consistent iterators.

**Key Points:**
- Use when you need a concurrent sorted set; TreeSet for single-threaded.

---

### 13.8 Comparing Set Implementations

| Implementation | add | contains | next | Notes |
|---|---|---|---|---|
| HashSet | O(1) | O(1) | O(h/n) | General purpose |
| LinkedHashSet | O(1) | O(1) | O(1) | Insertion order |
| CopyOnWriteArraySet | O(n) | O(n) | O(1) | Read-heavy, thread-safe |
| EnumSet | O(1) | O(1) | O(1) | Enum types only |
| TreeSet | O(log n) | O(log n) | O(log n) | Sorted |
| ConcurrentSkipListSet | O(log n) | O(log n) | O(1) | Concurrent, sorted |

---

# Chapter 14: Queues

### 14.1 Using the Methods of Queue

Queue adds six methods in three pairs: add, inspect, and remove. Each pair has one exception-throwing method and one value-returning method.

| Operation | Throws on failure | Returns value |
|-----------|-------------------|---------------|
| Add | `add(e)` | `offer(e)` |
| Inspect | `element()` | `peek()` |
| Remove | `remove()` | `poll()` |

```java
if (!queue.offer(task)) { /* queue full */ }
Task t = queue.poll();
if (t == null) { /* queue empty */ }
```

**Key Points:**
- Use `offer`/`poll`/`peek` for bounded queues; `add`/`remove`/`element` when failure is exceptional.
- Avoid `null` elements—`poll` and `peek` return `null` to signal emptiness.

---

### 14.2 PriorityQueue

Non-thread-safe queue ordering elements by priority (natural ordering or Comparator). Backed by a binary heap. Head access is O(1); insertion and removal are O(log n).

```java
Queue<PriorityTask> pq = new PriorityQueue<>(10, comp);
pq.add(task);
PriorityTask next = pq.poll();
```

**Key Points:**
- Binary heap: each node has higher priority than its children.
- `remove(Object)` and `contains` are O(n).
- Use PriorityBlockingQueue for concurrency.

---

### 14.3 ConcurrentLinkedQueue

Unbounded, thread-safe, FIFO queue using CAS-based wait-free algorithm. O(1) insertion/removal; `size()` is O(n).

**Key Points:**
- Non-blocking; no take/put-style waiting.
- Weakly consistent iterators.

---

### 14.4 BlockingQueue

Extends Queue with blocking and timed variants:

| Operation | Blocking | Timed |
|-----------|----------|-------|
| Add | `put(e)` | `offer(e, timeout, unit)` |
| Remove | `take()` | `poll(timeout, unit)` |

**Implementations:**

**LinkedBlockingQueue:** FIFO, unbounded by default. O(1) queue operations. Default choice for unbounded blocking queues.

**ArrayBlockingQueue:** Circular array, always bounded. O(1) for head/tail operations. Fair mode available but costly.

**PriorityBlockingQueue:** Thread-safe blocking version of PriorityQueue. O(log n) add/remove.

**DelayQueue:** Orders elements by delay expiration. Only expired elements can be taken. Ideal for scheduled reminders.

```java
public class DelayedTask implements Delayed {
    private long endTime;
    public long getDelay(TimeUnit unit) {
        return unit.convert(endTime - System.currentTimeMillis(), TimeUnit.MILLISECONDS);
    }
    public int compareTo(Delayed other) {
        return Long.compare(getDelay(TimeUnit.MILLISECONDS),
            other.getDelay(TimeUnit.MILLISECONDS));
    }
}
```

**SynchronousQueue:** Zero capacity. Producer blocks until consumer is ready. Acts as a rendezvous between threads.

---

### 14.5 Deque

Double-ended queue allowing insertion and removal at both ends. Used at one end only → FIFO queue; same end for add and remove → LIFO stack.

```java
Deque<String> deque = new ArrayDeque<>();
deque.offerFirst("a");
deque.offerLast("b");
String first = deque.pollFirst();
```

**ArrayDeque:** Circular array, O(1) at both ends. Preferred for single-threaded FIFO and LIFO. Replaces `Stack` and `LinkedList` for queue/stack use.

**LinkedList:** Implements both List and Deque. O(1) at ends; O(n) for indexed access. Only standard implementation that allows `null`.

**LinkedBlockingDeque:** Blocking deque for work-stealing patterns; idle threads steal from the tail of another thread's deque.

---

### 14.6 Comparing Queue Implementations

| Implementation | Ordering | Thread-Safe | Blocking | offer | poll |
|---|---|---|---|---|---|
| ArrayDeque | FIFO | No | No | O(1) | O(1) |
| PriorityQueue | Priority | No | No | O(log n) | O(log n) |
| ConcurrentLinkedQueue | FIFO | Yes | No | O(1) | O(1) |
| LinkedBlockingQueue | FIFO | Yes | Yes | O(1) | O(1) |
| ArrayBlockingQueue | FIFO | Yes | Yes | O(1) | O(1) |
| PriorityBlockingQueue | Priority | Yes | Yes | O(log n) | O(log n) |
| DelayQueue | Delay | Yes | Yes | O(log n) | O(log n) |
| SynchronousQueue | N/A | Yes | Yes | O(1) | O(1) |

---

# Chapter 15: Lists

### 15.1 Using the Methods of List

List extends Collection with positional access, search, range-view, and list-iterator operations.

**Positional access:** `add(int, E)`, `get(int)`, `remove(int)`, `set(int, E)`.

**Search:** `indexOf(Object)`, `lastIndexOf(Object)`.

**Range view:** `subList(fromIndex, toIndex)` returns a backed view—modifications write through.

**ListIterator:** Adds `hasPrevious`, `previous`, `nextIndex`, `previousIndex`, `add(E)`, `set(E)`.

```java
List<String> list = new ArrayList<>();
list.add(0, "first");
List<String> sub = list.subList(1, 3);
sub.set(0, "modified");  // reflected in list
```

**Key Points:**
- `subList` is a view, not a copy; changes propagate.
- `ListIterator.set` and `remove` require a prior `next()` or `previous()`.

---

### 15.2 ArrayList

Backs a List with a resizable array. `get` and `set` are O(1); `add(index, e)` and `remove(index)` are O(n) due to shifting. Amortized O(1) add at end.

```java
List<Character> chars = new ArrayList<>();
Collections.addAll(chars, 'a', 'b', 'c');
chars.remove(1);  // shifts elements
```

**Key Points:**
- Best for random access and end-only insertions/removals.
- Consider ArrayDeque if operations are mainly at the start.

---

### 15.3 LinkedList

Doubly linked list implementing both List and Deque. O(1) for add/remove at ends; O(n) for indexed access.

**Key Points:**
- Faster than ArrayList for frequent insertions/removals in the middle via iterator.
- Slower for random access.
- Allows `null`; ArrayDeque does not.

---

### 15.4 CopyOnWriteArrayList

Thread-safe reads with copy-on-write semantics. Every mutation creates a new backing array. Optimized for read-heavy, write-rare workloads. Snapshot iterators never throw CME.

```java
List<StoppableTaskQueue> schedule = new CopyOnWriteArrayList<>();
schedule.get(day);  // fast, no locking
schedule.add(newQueue);  // copies array
```

---

### 15.5 Comparing List Implementations

| Operation | ArrayList | LinkedList | CopyOnWriteArrayList |
|---|---|---|---|
| get | O(1) | O(n) | O(1) |
| add (end) | O(1) amortized | O(1) | O(n) |
| contains | O(n) | O(n) | O(n) |
| remove(0) | O(n) | O(1) | O(n) |
| iterator.remove | O(n) | O(1) | O(n) |

**Selection:** Thread safety + rare writes → CopyOnWriteArrayList. Random access → ArrayList. Frequent middle operations via iterator → LinkedList.

---

# Chapter 16: Maps

### 16.1 Using the Methods of Map

Map models key-value associations with unique keys. Operations: add (`put`, `putAll`), remove (`clear`, `remove`), query (`get`, `containsKey`, `containsValue`, `size`, `isEmpty`), views (`keySet`, `values`, `entrySet`).

Views are backed by the map—changes to views affect the map. `Map.Entry` has `setValue` for in-place updates.

```java
Map<Priority, Queue<Task>> taskMap = new EnumMap<>(Priority.class);
for (Priority p : Priority.values()) {
    taskMap.put(p, new ArrayDeque<>());
}
```

**Key Points:**
- `null` as key/value is implementation-dependent.
- View iterators can become invalid on concurrent modification.

---

### 16.2 HashMap

Hash table with chaining. O(1) expected for get/put. Iteration is O(capacity + size). Default load factor 0.75.

```java
Map<Task, Client> billing = new HashMap<>();
billing.put(task, client);
```

**Key Points:**
- Keys must have consistent `hashCode` and `equals`.
- Not thread-safe; fail-fast iterators.

---

### 16.3 LinkedHashMap

Extends HashMap with predictable iteration order. Two modes: **insertion order** (default) or **access order** (for LRU caches). Override `removeEldestEntry` to evict.

```java
class LRUCache<K,V> extends LinkedHashMap<K,V> {
    private int maxEntries;
    LRUCache(int max) {
        super(16, 0.75f, true);  // access order
        this.maxEntries = max;
    }
    protected boolean removeEldestEntry(Map.Entry<K,V> eldest) {
        return size() > maxEntries;
    }
}
```

**Key Points:**
- Use access order for LRU caches.
- Iteration is O(n), independent of capacity.

---

### 16.4 WeakHashMap

Holds keys via `WeakReference`. Keys can be reclaimed by GC when no other strong references exist; entries are removed lazily.

```java
Map<Resource, Client> cache = new WeakHashMap<>();
```

**Key Points:**
- Values can still hold strong references to keys, preventing reclamation.
- Use for caches tolerant of eviction or to avoid memory leaks.

---

### 16.5 IdentityHashMap

Compares keys by reference (`==`), not `equals`. Uses linear probing instead of chaining. Used for graph traversal, serialization, and identity-based operations.

```java
Map<Node, VisitInfo> visited = new IdentityHashMap<>();
```

**Key Points:**
- Violates Map's usual equality contract.
- Use `expectedMaxSize` constructor for proper sizing.

---

### 16.6 EnumMap

Uses enum ordinals as array indices. O(1) for get/put. Iteration follows enum declaration order. Keys must be from a single enum.

```java
EnumMap<Priority, Queue<Task>> byPriority = new EnumMap<>(Priority.class);
```

**Key Points:**
- Compact and fast for enum keys.
- No null keys; null values allowed.

---

### 16.7 SortedMap, NavigableMap, and TreeMap

**SortedMap** guarantees ascending key order. Methods: `firstKey()`, `lastKey()`, `subMap(from, to)`, `headMap(to)`, `tailMap(from)`.

**NavigableMap** (Java 6) extends SortedMap with: `firstEntry`/`lastEntry`, `pollFirstEntry`/`pollLastEntry`, `ceilingEntry`/`floorEntry`, `descendingMap`, and inclusive/exclusive range views.

**TreeMap** implements NavigableMap via a red-black tree. O(log n) for get, put, remove.

```java
NavigableMap<String, Integer> map = new TreeMap<>();
Map.Entry<String, Integer> e = map.ceilingEntry("key");
```

**Key Points:**
- NavigableMap supersedes SortedMap in Java 6+.
- TreeSet is implemented atop TreeMap.

---

### 16.8 ConcurrentMap and ConcurrentHashMap

**ConcurrentMap** adds atomic compound operations: `putIfAbsent`, `remove(K,V)`, `replace(K,V)`, `replace(K,oldV,newV)`.

**ConcurrentHashMap** uses lock striping (segments). Reads are generally non-blocking; writes lock only the affected segment.

```java
ConcurrentMap<String, Long> cache = new ConcurrentHashMap<>();
cache.putIfAbsent(key, value);
```

**Key Points:**
- No single lock for the entire map; cannot lock for multi-key operations.
- Prefer over `Collections.synchronizedMap` for concurrent access.

---

### 16.9 ConcurrentSkipListMap

Implements ConcurrentNavigableMap with a skip list. O(log n) operations. Thread-safe, ordered alternative to TreeMap.

**Key Points:**
- Use when you need concurrent access and sorted order.
- ConcurrentSkipListSet is backed by ConcurrentSkipListMap.

---

### 16.10 Comparing Map Implementations

| Implementation | get/containsKey | Ordering | Thread-Safe | Notes |
|---|---|---|---|---|
| HashMap | O(1) | None | No | General purpose |
| LinkedHashMap | O(1) | Insert/Access | No | LRU, predictable iter |
| WeakHashMap | O(1) | None | No | GC-reclaimable keys |
| IdentityHashMap | O(1) | None | No | Identity comparison |
| EnumMap | O(1) | Enum order | No | Enum keys only |
| TreeMap | O(log n) | Sorted | No | Ordered, single-thread |
| ConcurrentHashMap | O(1) | None | Yes | High concurrency |
| ConcurrentSkipListMap | O(log n) | Sorted | Yes | Concurrent + ordered |

---

# Chapter 17: The Collections Class

### 17.1 Generic Algorithms

#### 17.1.1 Changing the Order of List Elements

Methods: `reverse(list)`, `rotate(list, distance)`, `shuffle(list)`, `sort(list)`, `sort(list, Comparator)`, `swap(list, i, j)`.

`sort` copies to an array, merge-sorts in O(n log n), then copies back. Others are O(n).

```java
List<Integer> list = Arrays.asList(3, 1, 4, 1, 5);
Collections.sort(list);
Collections.reverse(list);
Collections.shuffle(list);
```

---

#### 17.1.2 Changing the Contents of a List

Methods: `copy(dest, src)`, `fill(list, obj)`, `replaceAll(list, oldVal, newVal)`.

`copy` writes into the destination which must be large enough. Signatures follow the Get and Put Principle.

---

#### 17.1.3 Finding Extreme Values

`min` and `max` have overloads using natural ordering or a supplied Comparator. Both run in O(n).

```java
String max = Collections.max(strings);
Task minTask = Collections.min(tasks, priorityComparator);
```

---

#### 17.1.4 Finding Specific Values in a List

`binarySearch` requires a sorted list; O(log n). Returns the index if found; otherwise `-(insertion point) - 1`.

`indexOfSubList` and `lastIndexOfSubList` locate a sublist without requiring sorting.

```java
int idx = Collections.binarySearch(sortedList, key);
if (idx < 0) list.add(-idx - 1, key);  // insert in sorted order
```

---

### 17.2 Collection Factories

`emptyList()`, `emptySet()`, `emptyMap()` — immutable, shared. `singleton(o)`, `singletonList(o)`, `singletonMap(k, v)` — single-element. `nCopies(n, o)` — immutable list of n references to the same object.

```java
return Collections.emptyList();
clients.removeAll(Collections.singleton(acme));
List<Object> padding = Collections.nCopies(10, " ");
```

---

### 17.3 Wrappers

#### 17.3.1 Synchronized Collections

`synchronizedCollection`, `synchronizedSet`, `synchronizedList`, `synchronizedMap`, etc. Each method acquires the wrapper's lock. Iteration must be in a synchronized block.

```java
List<String> syncList = Collections.synchronizedList(new ArrayList<>());
synchronized (syncList) {
    for (String s : syncList) { /* ... */ }
}
```

---

#### 17.3.2 Unmodifiable Collections

`unmodifiableCollection`, `unmodifiableSet`, `unmodifiableList`, `unmodifiableMap`, etc. Any structural change throws `UnsupportedOperationException`. Does not prevent changes to mutable elements.

---

#### 17.3.3 Checked Collections

`checkedCollection`, `checkedList`, `checkedSet`, `checkedMap`, etc. Each takes a `Class` for runtime type checks. Add operations verify element type and throw `ClassCastException` on violation.

```java
List<String> checked = Collections.checkedList(rawList, String.class);
```

---

### 17.4 Other Methods

- **addAll(c, elements...)** — add multiple elements.
- **asLifoQueue(deque)** — view a Deque as a LIFO Queue.
- **disjoint(c1, c2)** — true if no elements in common.
- **enumeration(c)** / **list(Enumeration)** — convert between Collection and Enumeration.
- **frequency(c, o)** — count occurrences.
- **newSetFromMap(map)** — set backed by a map (e.g., WeakHashMap for a weak set).
- **reverseOrder()** / **reverseOrder(Comparator)** — comparators for reverse order.

```java
Collections.addAll(list, 1, 2, 3);
Queue<T> lifo = Collections.asLifoQueue(deque);
Set<Object> weakSet = Collections.newSetFromMap(new WeakHashMap<>());
SortedSet<Integer> reversed = new TreeSet<>(Collections.reverseOrder());
```

**Key Points:**
- `newSetFromMap` requires an empty map; do not access the map directly afterward.
- `reverseOrder(null)` reverses natural order.

