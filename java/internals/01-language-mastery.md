# Phase 1 — Language Mastery: Behind the Scenes

> You don't really know Java until you know what `javap -c` shows you.

Most Java developers know the syntax — they can write generics, use streams, and create records. But few understand what happens *after* the compiler runs. This phase takes you behind the curtain: you'll learn what bytecode the JVM actually executes, how type erasure rewrites your generics, how `invokedynamic` wires lambdas at runtime, and why certain patterns that look correct can fail catastrophically in production.

The approach here is different from a typical tutorial. Every topic starts with the **mechanism** (what the JVM does), moves to the **implications** (what that means for your code), and ends with **verification** (how to prove it with `javap`, JMH, or a targeted test). By the end of this phase, you won't just write Java — you'll read bytecode, predict JIT behavior, and debug at a level most developers never reach.

---

## Table of Contents

1. [Generics — Type Erasure and Parameterized Types](#1-generics--type-erasure-and-the-truth-behind-parameterized-types)
2. [Streams — Lazy Evaluation, Pipeline Fusion, and Spliterator](#2-streams--lazy-evaluation-pipeline-fusion-and-spliterator)
3. [Functional Interfaces and Lambdas — invokedynamic](#3-functional-interfaces-and-lambdas--invokedynamic-under-the-hood)
4. [Records — How the JVM Stores Them](#4-records--how-the-jvm-stores-them)
5. [Sealed Classes — Class Loading Enforcement](#5-sealed-classes--class-loading-enforcement)
6. [Comparator — Contract Violations and TimSort](#6-comparator--contract-violations-and-timsort)
7. [Optional — Design Intent and Misuse](#7-optional--design-intent-and-misuse)
8. [Switch Expressions — Compilation Strategy](#8-switch-expressions--compilation-strategy)
9. [equals, hashCode, and the Object Contract](#9-equals-hashcode-and-the-object-contract)
10. [Collections Internals](#10-collections-internals)
11. [String Internals — Pool, Compact Strings, Concatenation](#11-string-internals--pool-compact-strings-and-concatenation)
12. [Autoboxing, Caching, and Primitive Type Traps](#12-autoboxing-caching-and-primitive-type-traps)
13. [Enum Deep Dive — More Than Constants](#13-enum-deep-dive--more-than-constants)
14. [Exception Handling Internals](#14-exception-handling-internals--bytecode-cost-and-desugaring)
15. [Pattern Matching — The Modern Java Revolution](#15-pattern-matching--the-modern-java-revolution-java-16-21)
16. [Inner Classes and the JVM](#16-inner-classes-and-the-jvm--synthetic-accessors-and-memory-leaks)
17. [Annotations Internals](#17-annotations-internals--retention-processing-and-runtime-mechanics)
18. [Reflection vs MethodHandles vs VarHandle](#18-reflection-vs-methodhandles-vs-varhandle--performance-hierarchy)
19. [Memory Layout and Object Headers](#19-memory-layout-and-object-headers--what-objects-really-look-like)
20. [var and Local Variable Type Inference](#20-var-and-local-variable-type-inference-java-10)
21. [Text Blocks — String Literal Deep Dive](#21-text-blocks--string-literal-deep-dive-java-15)
22. [Collections Internals — Advanced Data Structures](#22-collections-internals--advanced-data-structures)

**Quick Reference:**
- [Bytecode Instruction Quick Reference](#bytecode-instruction-quick-reference)
- [The "What Does javap Show Me?" Decision Tree](#the-what-does-javap-show-me-decision-tree)
- [Production Debugging Quick Guide](#production-debugging-quick-guide)
- [Comprehensive Resource List](#comprehensive-resource-list--from-senior-to-god-tier)

---

## 1. Generics — Type Erasure and the Truth Behind Parameterized Types

### The History You Need to Understand Everything Else

Generics were not part of Java 1.0. They arrived in Java 5 (2004), a full nine years after the language launched. By that time, there were billions of lines of Java code running in production — all using raw types like `List`, `Map`, and `Set` without any type parameters. The Java designers faced a brutal constraint: **new generic code had to interoperate perfectly with old raw-type code, without recompilation.** If adding generics broke existing binaries, adoption would have been impossible.

The solution was **type erasure**. Instead of encoding generic type information into the bytecode and the JVM's runtime type system (the way C# did with *reification*), Java chose to make generics a pure compile-time mechanism. The compiler checks your types, inserts the necessary casts, and then **strips all generic type information from the class file's bytecode**. The JVM never sees `List<String>` — it only sees `List`. This is not a limitation of the JVM's capability; it's a deliberate design choice that prioritized backward compatibility over runtime type knowledge.

This single decision explains almost every "weird" thing about Java generics: why you can't do `new T()`, why you can't do `instanceof T`, why `List<String>` and `List<Integer>` are the same class at runtime, why you can't create generic arrays, and why frameworks like Jackson need `TypeReference<>` to recover generic types.

Understanding erasure is not optional. If you don't internalize it, you'll spend your career fighting the compiler instead of working with it.

### What the Compiler Actually Does

Java generics are a **compile-time illusion**. The JVM has no concept of `List<String>` — it only sees `List`. The compiler:

1. Checks type safety at compile time
2. Inserts `checkcast` instructions at call sites
3. Erases all type parameters to their bounds (or `Object`)

```java
// What you write:
public class Box<T> {
    private T value;
    public T get() { return value; }
    public void set(T value) { this.value = value; }
}

Box<String> box = new Box<>();
box.set("hello");
String s = box.get();
```

```
// What the JVM sees after erasure (javap -c):
public class Box {
    private Object value;

    public Object get();
        Code:
           0: aload_0
           1: getfield      #2    // Field value:Ljava/lang/Object;
           4: areturn

    public void set(java.lang.Object);
        Code:
           0: aload_0
           1: aload_1
           2: putfield      #2    // Field value:Ljava/lang/Object;
           5: return
}

// At the call site, the compiler inserts a cast:
String s = box.get();
// becomes:
//   invokevirtual Box.get:()Ljava/lang/Object;
//   checkcast     #3    // class java/lang/String
```

**Key insight:** The generic type parameter `T` is completely gone at runtime. The compiler generates the casts for you — that's the entire value proposition of generics.

### Why You Can't Do `new T()` or `instanceof T`

This is the question every Java developer asks when they first hit generics in anger. The answer flows directly from erasure. When you write `new T()`, the JVM needs to know the exact class to instantiate — it needs to allocate the right amount of memory, call the right constructor, and set up the right vtable for method dispatch. But `T` has been erased. At runtime, the JVM sees `Object` (or whatever the bound is). It has absolutely no way to know whether `T` is `String`, `Integer`, `Employee`, or any other class. The same logic applies to `instanceof T` — the JVM would need runtime type information that simply doesn't exist.

The standard workaround is the **class token pattern**: you explicitly pass a `Class<T>` object, which *does* carry runtime type information, and use it for instantiation and type checking. This is the foundation of every dependency injection container, serialization framework, and ORM in Java.

```java
public class Factory<T> {
    // COMPILE ERROR: cannot instantiate type parameter
    public T create() {
        return new T();  // What bytecode would this generate? new Object? new String?
    }

    // COMPILE ERROR: illegal generic type for instanceof
    public boolean isT(Object obj) {
        return obj instanceof T;  // T is erased — this would always be instanceof Object
    }
}
```

**Workaround — Class token:**

```java
public class Factory<T> {
    private final Class<T> type;

    public Factory(Class<T> type) {
        this.type = type;
    }

    public T create() throws Exception {
        return type.getDeclaredConstructor().newInstance();
    }

    public boolean isT(Object obj) {
        return type.isInstance(obj);
    }
}
```

### Bridge Methods — The Compiler's Dirty Secret

This is one of the most subtle consequences of erasure, and understanding it is the key to debugging mysterious `ClassCastException`s in seemingly type-safe code. Here's the problem: when you implement a generic interface with a concrete type, the method signature *you write* differs from the method signature *the JVM expects* after erasure. Polymorphism requires that the overriding method have the same signature as the overridden method. Erasure breaks this contract, so the compiler generates invisible **bridge methods** to restore it.

When a generic class is extended with a concrete type, the compiler generates bridge methods to maintain polymorphism after erasure:

```java
public interface Comparable<T> {
    int compareTo(T o);
}

public class MyString implements Comparable<String> {
    @Override
    public int compareTo(String o) {
        return 0;
    }
}
```

After erasure, `Comparable` has `compareTo(Object)`. But `MyString` has `compareTo(String)`. These have different signatures — polymorphism breaks. So the compiler generates:

```
// javap -c MyString.class shows:
public int compareTo(java.lang.String);    // your real method
    Code:
       0: iconst_0
       1: ireturn

public int compareTo(java.lang.Object);    // bridge method (synthetic)
    Code:
       0: aload_0
       1: aload_1
       2: checkcast     #2   // class java/lang/String
       5: invokevirtual #3   // MyString.compareTo:(Ljava/lang/String;)I
       8: ireturn
```

The bridge method casts `Object` → `String` and delegates. This is why you sometimes see `ClassCastException` in seemingly type-safe code.

### Wildcards and Bounds — The Mental Model

Wildcards are where most developers' understanding of generics breaks down, and it's usually because they're trying to memorize rules instead of building a mental model. Here's the model:

Think of a generic type parameter as a **contract** between the code that creates a value and the code that uses it. When you say `List<String>`, you're making a precise contract: "this list holds exactly `String` objects." But sometimes you need flexibility — you want to accept "any list of things that are at least `Number`" or "any list that can accept `Integer` values." Wildcards express these flexible contracts.

The key insight is that **flexibility in reading and flexibility in writing are opposites**. If you want to read from a collection with type flexibility (covariance), you lose the ability to write. If you want to write to a collection with type flexibility (contravariance), you lose precision in reading. This is not a Java limitation — it's a fundamental property of type systems, known formally as the **Liskov Substitution Principle**.

```
Type                    Meaning                        Read/Write
─────────────────────────────────────────────────────────────────
List<?>                 Unknown type                   Read as Object, cannot write (except null)
List<? extends Number>  Number or subtype (covariant)  Read as Number, cannot write
List<? super Integer>   Integer or supertype (contra)  Read as Object, can write Integer
List<Number>            Exactly Number (invariant)     Read as Number, write Number
```

### PECS — Producer Extends, Consumer Super

Joshua Bloch coined this mnemonic in *Effective Java*, and it's the single most important generics rule for API design. The reasoning is deceptively simple once you get it:

When a data structure **produces** values for you to read, you need to guarantee that everything coming out is *at least* type `T`. That's `? extends T` — the list might hold `String` or any subtype, but you know you can safely read them as `T`. You can't write to it because you don't know the *exact* type the list expects.

When a data structure **consumes** values that you write into it, you need to guarantee it *accepts* type `T`. That's `? super T` — the list might be a `List<Object>` or `List<Number>`, but you know you can safely put a `T` into it. You can only read from it as `Object` because you don't know the exact type stored.

This principle shows up everywhere in the JDK: `Collections.copy()`, `Stream.forEach()`, `Comparator.comparing()`. Every well-designed generic API follows PECS.

```java
// PRODUCER — you're reading FROM it → use extends
public static <T> void copy(List<? extends T> src,    // produces T values
                             List<? super T> dest) {    // consumes T values
    for (T item : src) {
        dest.add(item);
    }
}

// Real example: Collections.copy signature
public static <T> void copy(List<? super T> dest, List<? extends T> src)
```

**Why it works:**
- `? extends T`: the list produces items. You know they're at least `T`. You can read safely.
- `? super T`: the list consumes items. You know it accepts `T`. You can write safely.

### Covariance vs Contravariance

These terms come from category theory, but the concept is straightforward. **Covariance** means the subtyping relationship of the container follows the subtyping of its contents: since `String` is a subtype of `Object`, a covariant `Container<String>` would be a subtype of `Container<Object>`. **Contravariance** is the reverse: the container's subtyping goes in the *opposite* direction from its contents.

Java arrays were designed to be covariant — a `String[]` can be assigned to an `Object[]` variable. This seemed convenient in 1995, but it was a mistake because it allows type-unsafe writes that only fail at runtime with `ArrayStoreException`. When generics were introduced in 2004, the designers learned from this error and made generics **invariant** by default. A `List<String>` is NOT a `List<Object>`. Period. If you need variance, you explicitly opt into it with wildcards, and the compiler enforces the read/write restrictions that make it safe.

```java
// Arrays are COVARIANT (and this is a design mistake):
Object[] arr = new String[10];
arr[0] = 42;  // Compiles! But throws ArrayStoreException at RUNTIME

// Generics are INVARIANT (safe):
List<Object> list = new ArrayList<String>();  // COMPILE ERROR — caught early

// Wildcards give you controlled variance:
List<? extends Object> covariant = new ArrayList<String>();   // OK — covariant read
List<? super String> contravariant = new ArrayList<Object>(); // OK — contravariant write
```

### Reifiable vs Non-Reifiable Types

This concept is central to understanding why certain operations are impossible with generics. A **reifiable** type is one whose full type information survives into runtime — the JVM knows everything about it. A **non-reifiable** type is one that has been partially or fully erased, so the JVM has less information about it at runtime than the compiler had at compile time. All parameterized types (except unbounded wildcards) are non-reifiable. This distinction dictates what you can and can't do with arrays, `instanceof`, and reflection.

```
Reifiable:         int, String, List<?>, Map<?,?>, String[]
Non-reifiable:     List<String>, Map<String, Integer>, T
```

This is why you can't create generic arrays:

```java
// ILLEGAL: generic array creation
T[] array = new T[10];           // T is erased
List<String>[] array = new List<String>[10]; // List<String> not reifiable

// Legal:
List<?>[] array = new List<?>[10];  // Wildcard is reifiable
Object[] array = new Object[10];    // Raw type is reifiable
```

### Type Tokens and Super Type Tokens

Here's a problem that haunts every framework developer: you need to deserialize a JSON string into a `List<Employee>`, but at runtime, generics are erased — the framework sees `List` and has no idea what type the elements should be. You can't pass `List<Employee>.class` because that syntax doesn't exist. The `Class` object for `List<String>` and `List<Integer>` is the same: `List.class`.

Neal Gafter devised the **super type token** pattern to solve this. The trick exploits the fact that while *uses* of generic types are erased, the *declarations* of generic supertypes are preserved in the class file's `Signature` attribute. By creating an anonymous subclass of a generic type, you embed the type argument into the class definition itself — and that information is recoverable via reflection. This is the foundation of Jackson's `TypeReference`, Guice's `TypeLiteral`, Gson's `TypeToken`, and Spring's `ParameterizedTypeReference`.

```java
// Simple type token
Class<String> token = String.class;

// Problem: can't express List<String>.class

// Solution: Super type token (Jackson's TypeReference, Guava's TypeToken)
// Uses anonymous class to preserve generic type in the class file
TypeReference<List<String>> ref = new TypeReference<List<String>>() {};

// How it works: anonymous class captures the generic supertype
// The subclass's generic signature is stored in the Signature attribute
// of the class file — accessible via reflection:
Type type = getClass().getGenericSuperclass();
// → ParameterizedType { rawType=TypeReference, typeArgs=[List<String>] }
```

### Recursive Type Bounds

Recursive type bounds express a self-referential constraint: "T must be a type that can compare itself to other instances of T." This pattern appears throughout the JDK — most prominently in `Comparable<T>` and `Enum<E>`. The bound `<T extends Comparable<T>>` says: "I accept any type T, as long as T knows how to compare itself to other T instances." Without this, you'd have to write methods that accept `Comparable<Object>`, which is both too broad and type-unsafe.

The more flexible variant `<T extends Comparable<? super T>>` uses PECS: the `Comparable` is a *consumer* of T values (it takes them in `compareTo`), so we use `super`. This allows a class like `Apple extends Fruit implements Comparable<Fruit>` to work — `Apple` is comparable to `Fruit`, and since `Apple` is a `Fruit`, it can compare to other `Apple` instances transitively.

```java
// "T must be comparable to itself"
public static <T extends Comparable<T>> T max(Collection<T> coll) {
    T result = null;
    for (T t : coll) {
        if (result == null || t.compareTo(result) > 0) {
            result = t;
        }
    }
    return result;
}

// Even more flexible with wildcards:
public static <T extends Comparable<? super T>> T max(Collection<? extends T> coll)
// This accepts a class that implements Comparable for a supertype
// e.g., if Apple extends Fruit implements Comparable<Fruit>
```

### Heap Pollution — When Generics Lie

Heap pollution occurs when a variable of a parameterized type refers to an object that is NOT of that parameterized type. The JVM can't prevent this because generic types are erased:

```java
// Classic heap pollution via raw types:
List<String> strings = new ArrayList<>();
List rawList = strings;           // unchecked warning
rawList.add(42);                  // no runtime error — list is really just List of Object
String s = strings.get(0);       // ClassCastException HERE, far from the bug

// The corrupted heap state:
// Variable 'strings' claims to be List<String>
// Actual contents: [Integer(42)]
// The lie persists until someone reads with a cast
```

This is why the compiler generates unchecked warnings — they're telling you: "I can't guarantee type safety here. If you're wrong, it'll blow up later."

### @SafeVarargs — Varargs and Generic Arrays

Varargs with generics is inherently unsafe because varargs creates an array, and generic arrays are illegal:

```java
// What the compiler does with varargs:
static <T> List<T> asList(T... elements) {
    // 'elements' is actually Object[] at runtime (not T[])
    // If T=String, the parameter is Object[], not String[]
}

// The danger:
@SafeVarargs  // suppresses the warning — YOU guarantee safety
static <T> void safe(T... elements) {
    // SAFE: only reading from elements
    for (T t : elements) { System.out.println(t); }
}

@SafeVarargs  // LYING — this is NOT safe
static <T> T[] unsafe(T... elements) {
    return elements;  // returns Object[] disguised as T[]
}

String[] result = unsafe("a", "b");  // ClassCastException: Object[] cannot be cast to String[]
```

```java
// Real-world heap pollution via varargs:
static <T> void dangerous(List<T>... lists) {
    // 'lists' is actually List[] at runtime (not List<T>[])
    Object[] arr = lists;           // legal: List[] is Object[]
    arr[0] = List.of(42);          // puts List<Integer> where List<T> expected
    T first = lists[0].get(0);    // ClassCastException if T=String
}
```

**Rule:** Only use `@SafeVarargs` when you never write to the varargs array and never expose it.

### Intersection Types — Multiple Bounds

```java
// A type parameter can have multiple bounds:
<T extends Serializable & Comparable<T> & Cloneable>
//         ^^^^^^^^^^^^   ^^^^^^^^^^^^^^^   ^^^^^^^^^
//         class bound    interface bound   interface bound
//         (must be first if present)

// After erasure, T becomes the FIRST bound (Serializable in this case)
// The compiler inserts checkcast for the other bounds at call sites

// Practical use — constrained lambda:
// "I need something that is both Serializable and Runnable"
private static <T extends Serializable & Runnable> void execute(T task) {
    task.run();
    serialize(task);  // safe because T extends Serializable
}

// Intersection types for lambda casting:
Runnable r = (Runnable & Serializable) () -> System.out.println("hello");
// This lambda is now serializable — used by Spark, Flink, distributed systems
```

### Curiously Recurring Template Pattern (CRTP) — Self-Referential Generics

```java
// The pattern: class extends a generic parameterized by itself
public abstract class Builder<T extends Builder<T>> {
    private String name;

    @SuppressWarnings("unchecked")
    protected T self() { return (T) this; }

    public T withName(String name) {
        this.name = name;
        return self();  // returns the CONCRETE subtype, not Builder
    }

    public abstract Product build();
}

public class ConcreteBuilder extends Builder<ConcreteBuilder> {
    private int count;

    public ConcreteBuilder withCount(int count) {
        this.count = count;
        return this;
    }

    @Override
    public Product build() { return new Product(name, count); }
}

// Method chaining returns the right type:
ConcreteBuilder builder = new ConcreteBuilder()
    .withName("test")    // returns ConcreteBuilder, not Builder
    .withCount(5);       // compiles — because withName returned ConcreteBuilder

// Without CRTP, withName() would return Builder, and you'd need a cast
```

```java
// Java's own Enum uses this:
public abstract class Enum<E extends Enum<E>> implements Comparable<E> {
    public final int compareTo(E o) { ... }
    // Each enum Foo implicitly extends Enum<Foo>
    // So compareTo accepts only the same enum type
}
```

### The Signature Attribute — Runtime Type Preservation

Despite erasure, generic type information IS preserved in the class file's `Signature` attribute:

```java
public class Container<T extends Number> {
    private List<T> items;
    public Map<String, List<T>> getMapping() { return null; }
}
```

```
// javap -v Container.class (look at the Signature attributes):
Signature: #15  // <T:Ljava/lang/Number;>Ljava/lang/Object;
// Field 'items':
Signature: #18  // Ljava/util/List<TT;>;
// Method 'getMapping':
Signature: #20  // ()Ljava/util/Map<Ljava/lang/String;Ljava/util/List<TT;>;>;

// This is how frameworks like Jackson, Gson, Spring recover generic types:
Field field = Container.class.getDeclaredField("items");
ParameterizedType pt = (ParameterizedType) field.getGenericType();
Type[] typeArgs = pt.getActualTypeArguments();  // [T]

// And for concrete subclasses:
class StringContainer extends Container<Integer> {}
Type superclass = StringContainer.class.getGenericSuperclass();
// → ParameterizedType: Container<Integer>
// The type argument Integer is PRESERVED in the Signature attribute
```

**This is the foundation of:** Jackson's `TypeReference`, Guice's `TypeLiteral`, Spring's `ResolvableType`, Gson's `TypeToken`.

### Generic Methods — Type Inference Deep Dive

```java
// The compiler infers T from the arguments:
static <T> List<T> singletonList(T item) { return List.of(item); }

List<String> list = singletonList("hello");  // T inferred as String
List<Object> list = singletonList("hello");  // T inferred as Object (target type)

// Diamond operator (Java 7+) — inference from left-hand side:
Map<String, List<Integer>> map = new HashMap<>();  // inferred from LHS

// Target-type inference (Java 8+) — inference from context:
static <T> T pick(T a, T b) { return a; }
Serializable s = pick("a", 42);  // T = Serializable (common supertype)

// Inference with lambdas:
// The target type determines the lambda's parameter types
List<String> sorted = strings.stream()
    .sorted(Comparator.comparing(s -> s.length()))  // s inferred as String
    .collect(Collectors.toList());

// Inference failure — when the compiler gives up:
static <T> void process(List<T> list, Function<T, T> fn) {}
process(List.of("a"), x -> x.toUpperCase());  // works — T=String
process(List.of("a"), x -> x);                // works — T=String
// process(Collections.emptyList(), x -> x);  // FAILS — can't infer T from empty list
```

---

## 2. Streams — Lazy Evaluation, Pipeline Fusion, and Spliterator

### The Philosophy of Streams

Streams were introduced in Java 8 not just as a convenient way to process collections, but as a fundamental shift in how Java developers express computation. The traditional approach — writing explicit `for` loops with mutable accumulators — is **imperative**: you tell the computer *how* to do something, step by step. Streams are **declarative**: you describe *what* transformation you want, and the library figures out the how.

This distinction matters beyond readability. When you write an imperative loop, the JVM can only optimize what it sees: one loop, one thread, one execution strategy. When you express the same logic as a stream pipeline, you're handing the library a *description* of the computation, which it can execute however it wants — including fusing multiple operations into a single pass, short-circuiting early, or splitting the work across multiple threads. The stream doesn't execute your lambdas when you call `.filter()` or `.map()`. It records them as a linked list of pipeline stages. Only when you call a terminal operation like `.collect()` does the library wire everything together and pull elements through the chain.

This is **lazy evaluation**, and it's the single most important concept to understand about streams. If you think of streams as "fancy for-loops," you'll misuse them. Streams are *recipes for computation*, not computation itself.

### Stream Pipeline Architecture

A stream pipeline has three components:

```
Source (Collection, array, generator)
    ↓
Intermediate Operations (map, filter, sorted, distinct, flatMap)
    ↓
Terminal Operation (collect, forEach, reduce, count, findFirst)
```

**Nothing happens until the terminal operation is called.** Intermediate operations return a new Stream that records the operation — they don't process elements.

```java
// This does ABSOLUTELY NOTHING — no terminal operation
List.of(1, 2, 3, 4, 5)
    .stream()
    .filter(n -> {
        System.out.println("filtering: " + n);  // never printed
        return n > 2;
    })
    .map(n -> {
        System.out.println("mapping: " + n);     // never printed
        return n * 10;
    });
// Zero output. Zero work done.
```

```java
// Now add a terminal operation:
List.of(1, 2, 3, 4, 5)
    .stream()
    .filter(n -> {
        System.out.println("filtering: " + n);
        return n > 2;
    })
    .map(n -> {
        System.out.println("mapping: " + n);
        return n * 10;
    })
    .collect(Collectors.toList());

// Output (notice: element-by-element, NOT filter-all-then-map-all):
// filtering: 1
// filtering: 2
// filtering: 3
// mapping: 3        ← filter passes, immediately maps
// filtering: 4
// mapping: 4
// filtering: 5
// mapping: 5
```

**This is loop fusion:** The stream processes each element through the entire pipeline before moving to the next. There's no intermediate collection.

### How Pipeline Fusion Works Internally

Most developers assume that `stream.filter(p).map(f).collect(toList())` creates an intermediate filtered collection, then maps over it. This is wrong. The stream library uses **loop fusion**: it builds a chain of `Sink` objects (one per pipeline stage), and then pulls each element through the entire chain before moving to the next element. There is no intermediate collection between `filter` and `map`. Each element goes: source → filter's `accept()` → (if it passes) map's `accept()` → collector's `accept()`. This is exactly what a hand-written loop would do, but the library assembles it dynamically from your pipeline description.

The internal structure is a linked list of `AbstractPipeline` nodes. When the terminal operation fires, it walks backwards through the chain, asking each stage to wrap the downstream sink with its own logic. The result is a single composite `Sink` that does everything in one pass.

```
                    AbstractPipeline
                    ┌────────────────┐
  source ──────────►│  Head          │
                    │  (no op)       │
                    └───────┬────────┘
                            │ downstream
                    ┌───────▼────────┐
                    │  filter(pred)  │──► Sink.accept(T) { if(pred.test(t)) downstream.accept(t); }
                    └───────┬────────┘
                            │ downstream
                    ┌───────▼────────┐
                    │  map(fn)       │──► Sink.accept(T) { downstream.accept(fn.apply(t)); }
                    └───────┬────────┘
                            │ downstream
                    ┌───────▼────────┐
                    │  terminal op   │──► Collects/reduces/finds
                    └────────────────┘
```

The key abstraction is `Sink<T>` — each operation wraps the downstream sink:

```java
// Pseudocode of what filter does internally:
Sink<T> filterSink = new Sink<T>() {
    Sink<T> downstream;

    void accept(T t) {
        if (predicate.test(t)) {
            downstream.accept(t);  // pass to next stage
        }
        // else: element dropped, downstream never called
    }
};
```

When the terminal op runs, it calls `Spliterator.forEachRemaining()` which feeds elements into the first sink, which cascades through the chain.

### Spliterator — The Engine Behind Streams

Every stream needs a source of elements, and that source is always a `Spliterator`. If `Iterator` was designed for single-threaded sequential access, `Spliterator` (split-iterator) was designed from the ground up for the parallel world. Its key innovation is the `trySplit()` method: it attempts to divide the remaining elements into two roughly equal halves, returning a new `Spliterator` for one half while retaining the other. The ForkJoinPool can then process both halves concurrently on different threads.

The quality of `trySplit()` directly determines parallel stream performance. An `ArrayList`'s spliterator splits by index in O(1) — excellent. A `LinkedList`'s spliterator must traverse to the midpoint in O(n) — terrible. A `HashSet`'s spliterator splits by internal bucket ranges — decent. This is why the data structure you choose matters enormously for parallel streams, and why `ArrayList` dominates `LinkedList` in parallel scenarios by orders of magnitude.

The other critical aspect is **characteristics** — metadata bits that tell the stream library what optimizations are safe. If a spliterator reports `SIZED`, the library can pre-allocate the output array. If it reports `SORTED`, a `sorted()` operation becomes a no-op. If it reports `DISTINCT`, a `distinct()` call is free. These characteristics flow through the pipeline, being added or removed by intermediate operations.

```java
public interface Spliterator<T> {
    boolean tryAdvance(Consumer<? super T> action);  // process one element
    Spliterator<T> trySplit();                        // split for parallelism
    long estimateSize();                              // remaining elements
    int characteristics();                            // ORDERED, SORTED, SIZED, etc.
}
```

**`trySplit()`** is the key method for parallel streams:

```
Original Spliterator [1, 2, 3, 4, 5, 6, 7, 8]
         │
    trySplit()
         │
    ┌────┴────┐
    ▼         ▼
 [1,2,3,4] [5,6,7,8]    ← two spliterators, processed by different threads
    │         │
 trySplit() trySplit()
    │         │
 [1,2][3,4] [5,6][7,8]  ← four spliterators
```

### Stateless vs Stateful Intermediate Operations

This distinction is critical for both performance and correctness. A **stateless** operation processes each element independently — `filter` looks at one element, decides pass or fail, and moves on. It doesn't need to remember anything about previous elements. A **stateful** operation must accumulate knowledge across elements — `sorted` needs to see every element before it can produce the first output, `distinct` must remember every element it has seen, and `limit` must count how many have passed.

```
Stateless (cheap, parallelizable):     map, filter, flatMap, peek
Stateful (needs buffering/ordering):   sorted, distinct, limit, skip
```

Stateful operations are where stream performance goes to die. `sorted()` must see ALL elements before producing output — this breaks fusion and requires buffering the entire stream into an array, sorting it, then feeding the sorted elements downstream. In a parallel stream, it's worse: each thread sorts its partition, then the results must be merge-sorted — a full synchronization point that eliminates most of the parallel benefit. `distinct()` is similarly expensive: in a parallel stream, each thread maintains its own `ConcurrentHashMap` for deduplication, then results are merged.

The practical lesson: if your pipeline has `sorted()` or `distinct()` in the middle, think hard about whether you actually need it there, or whether you can restructure the pipeline to avoid it.

```java
// This is fine — pure pipeline, no buffering:
stream.filter(x -> x > 0).map(x -> x * 2).collect(toList());

// This buffers everything at sorted():
stream.filter(x -> x > 0).sorted().map(x -> x * 2).collect(toList());
```

### Why parallelStream() Kills Tomcat Threads

This is perhaps the most important production lesson in the entire Streams API, and almost nobody learns it until they get bitten. The problem is architectural: Java's `parallelStream()` submits work to `ForkJoinPool.commonPool()`, which is a **JVM-wide singleton** with a fixed number of threads (default: number of CPU cores minus one). Every parallel stream in your entire application — every request handler, every scheduled task, every library — shares this single pool.

In a web server like Tomcat, you already have a thread pool handling incoming requests. When those request-handling threads call `parallelStream()`, they submit tasks to the common pool and then **block waiting for results**. If multiple requests do this simultaneously, the common pool saturates. New parallel stream tasks queue up. Request threads block. Timeouts cascade. You get thread starvation without ever exceeding your CPU capacity.

The fundamental mistake is using a shared global resource (the common pool) for per-request computation. The fix is to either avoid parallel streams in web apps entirely (use sequential streams — they're fast enough for most workloads) or to submit work to a dedicated `ForkJoinPool` that you control.

```java
// In a web app, this is DANGEROUS:
results = data.parallelStream()
    .map(this::expensiveCall)
    .collect(toList());
```

Why? `parallelStream()` uses `ForkJoinPool.commonPool()`, which is a **JVM-wide singleton**. Every parallel stream, every `CompletableFuture.supplyAsync()` — all share the same pool.

```
Tomcat Thread-1  →  parallelStream()  ─┐
Tomcat Thread-2  →  parallelStream()  ─┼──►  ForkJoinPool.commonPool()
Tomcat Thread-3  →  parallelStream()  ─┤     (default size = Runtime.getRuntime().availableProcessors() - 1)
Tomcat Thread-4  →  parallelStream()  ─┘

If pool size = 7, and 4 requests each submit parallel work...
threads starve, latency spikes, timeouts follow
```

**Fix: Custom ForkJoinPool:**

```java
ForkJoinPool customPool = new ForkJoinPool(4);
List<Result> results = customPool.submit(() ->
    data.parallelStream()
        .map(this::expensiveCall)
        .collect(toList())
).get();  // runs in YOUR pool, not commonPool
```

### Collector Internals

A `Collector` is the stream library's abstraction for *mutable reduction* — building a result by accumulating elements into a mutable container. While `reduce()` works with immutable values (each step produces a new value), collectors work with mutable containers like `ArrayList`, `StringBuilder`, or `HashMap`. This is both more efficient (no intermediate object creation) and more flexible (you can build any data structure).

The `Collector` interface has four functions that define the entire lifecycle of a reduction, plus a set of characteristics that enable optimizations. Understanding these four functions is the key to writing custom collectors — and once you can write custom collectors, you can express any aggregation as a single stream pipeline.

```java
public interface Collector<T, A, R> {
    Supplier<A> supplier();          // create accumulator container
    BiConsumer<A, T> accumulator();  // add element to container
    BinaryOperator<A> combiner();   // merge two containers (parallel)
    Function<A, R> finisher();       // transform container to result
    Set<Characteristics> characteristics(); // CONCURRENT, UNORDERED, IDENTITY_FINISH
}
```

```java
// Collectors.toList() is roughly:
Collector.of(
    ArrayList::new,              // supplier: create new ArrayList
    ArrayList::add,              // accumulator: add to it
    (left, right) -> {           // combiner: merge two lists (parallel)
        left.addAll(right);
        return left;
    },
    Characteristics.IDENTITY_FINISH  // no finisher needed, the list IS the result
);
```

### Performance Traps

```java
// TRAP 1: Autoboxing in streams
IntStream.range(0, 1_000_000).sum();          // primitive — fast
Stream.of(1,2,3).mapToInt(i -> i).sum();      // unbox once — ok
Stream.of(1,2,3).reduce(0, Integer::sum);     // box/unbox per element — slow

// TRAP 2: Small data parallelism
// Parallel overhead > benefit for small collections
List.of(1,2,3).parallelStream()...            // slower than sequential

// TRAP 3: Ordering costs
// parallel + ordered + limit = expensive synchronization
stream.parallel().sorted().limit(10);         // forces merge-sort + coordination

// TRAP 4: LinkedList streams
// Spliterator.trySplit() on LinkedList is terrible — O(n) traversal to find midpoint
linkedList.parallelStream()...                // always worse than ArrayList
```

### Short-Circuiting Operations — How They Stop Early

```java
// findFirst, findAny, anyMatch, allMatch, noneMatch, limit — all short-circuit
Optional<Integer> first = Stream.of(1, 2, 3, 4, 5)
    .filter(n -> {
        System.out.println("testing: " + n);
        return n > 3;
    })
    .findFirst();

// Output:
// testing: 1
// testing: 2
// testing: 3
// testing: 4        ← found it, STOPS HERE
// Never tests 5
```

How it works internally: the terminal operation's `Sink.accept()` returns a `cancellationRequested()` signal:

```java
// Pseudocode of findFirst's Sink:
class FindFirstSink<T> extends Sink<T> {
    T value;
    boolean hasValue = false;

    void accept(T t) {
        if (!hasValue) {
            hasValue = true;
            value = t;
        }
    }

    boolean cancellationRequested() {
        return hasValue;  // once found, tell the spliterator to stop
    }
}
// The Spliterator checks cancellationRequested() between elements
```

### Encounter Order — The Hidden Performance Killer

```
Source           Encounter Order    Parallel Friendly
─────────────────────────────────────────────────────
ArrayList        Yes (index order)   Excellent (splits by index)
HashSet          No                  Good (no ordering constraints)
LinkedHashSet    Yes (insert order)  Poor (ordering + splitting)
TreeSet          Yes (sorted order)  Moderate
Stream.generate  No                  Good

// Encounter order forces parallel streams to preserve ordering:
list.parallelStream()
    .filter(x -> expensive(x))
    .limit(10)           // must find FIRST 10 in encounter order
    .collect(toList());  // even if thread-3 finds matches first, must wait for thread-1

// Dropping encounter order removes the constraint:
list.parallelStream()
    .unordered()         // "I don't care about order"
    .filter(x -> expensive(x))
    .limit(10)           // take ANY 10, whichever threads finish first
    .collect(toList());
```

### Stream.iterate and Stream.generate

```java
// Stream.iterate — stateful, ordered sequence
// Classic: iterate(seed, hasNext, next) — Java 9+
Stream.iterate(0, n -> n < 100, n -> n + 2)  // 0, 2, 4, ..., 98
    .collect(toList());

// Fibonacci with iterate:
Stream.iterate(new long[]{0, 1}, f -> new long[]{f[1], f[0] + f[1]})
    .limit(20)
    .map(f -> f[0])
    .forEach(System.out::println);

// Stream.generate — stateless (or stateful with care), unordered
Stream.generate(Math::random)
    .limit(10)
    .forEach(System.out::println);

// DANGER: stateful generate with parallelStream
AtomicInteger counter = new AtomicInteger();
Stream.generate(counter::incrementAndGet)
    .parallel()
    .limit(10)
    .forEach(System.out::println);
// Output order is unpredictable AND values may not be 1-10
```

### Advanced Collectors — groupingBy, partitioningBy, teeing

```java
// groupingBy — the SQL GROUP BY of streams
Map<Department, List<Employee>> byDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::department));

// groupingBy with downstream collector:
Map<Department, Double> avgSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::department,
        Collectors.averagingDouble(Employee::salary)
    ));

// groupingBy with custom map factory + downstream:
Map<Department, Long> countByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::department,
        TreeMap::new,              // sorted map
        Collectors.counting()
    ));

// Multi-level grouping:
Map<Department, Map<String, List<Employee>>> byDeptThenTitle = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::department,
        Collectors.groupingBy(Employee::title)
    ));

// partitioningBy — special case: boolean key (always has true + false keys)
Map<Boolean, List<Employee>> seniorVsJunior = employees.stream()
    .collect(Collectors.partitioningBy(e -> e.yearsExp() > 10));
// {true=[senior1, senior2], false=[junior1, junior2]}
// Unlike filter, you get BOTH halves

// teeing — combine two collectors into one pass (Java 12+)
record MinMax(int min, int max) {}
MinMax result = IntStream.of(3, 1, 4, 1, 5, 9).boxed()
    .collect(Collectors.teeing(
        Collectors.minBy(Comparator.naturalOrder()),
        Collectors.maxBy(Comparator.naturalOrder()),
        (min, max) -> new MinMax(min.orElseThrow(), max.orElseThrow())
    ));
// MinMax[min=1, max=9] — single pass, two aggregations

// collectingAndThen — post-process the result
List<String> unmodifiable = strings.stream()
    .collect(Collectors.collectingAndThen(
        Collectors.toList(),
        Collections::unmodifiableList
    ));
```

### Custom Collector — Building Your Own

```java
// Collector that builds a comma-separated string with brackets: "[a, b, c]"
Collector<String, StringJoiner, String> bracketJoiner = Collector.of(
    () -> new StringJoiner(", ", "[", "]"),  // supplier
    StringJoiner::add,                        // accumulator
    StringJoiner::merge,                      // combiner (for parallel)
    StringJoiner::toString,                   // finisher
    Collector.Characteristics.UNORDERED       // characteristics
);

String result = Stream.of("a", "b", "c").collect(bracketJoiner);
// "[a, b, c]"

// Collector that builds an ImmutableList (Guava-style):
Collector<T, ?, ImmutableList<T>> toImmutableList() {
    return Collector.of(
        ImmutableList::builder,               // supplier: new Builder
        ImmutableList.Builder::add,           // accumulator: add to builder
        (b1, b2) -> b1.addAll(b2.build()),   // combiner: merge builders
        ImmutableList.Builder::build          // finisher: build immutable list
    );
}
```

### Custom Spliterator — When You Own the Data Source

```java
// Spliterator that reads a CSV file lazily, line by line:
public class CsvSpliterator implements Spliterator<String[]> {
    private final BufferedReader reader;
    private final String delimiter;

    public CsvSpliterator(BufferedReader reader, String delimiter) {
        this.reader = reader;
        this.delimiter = delimiter;
    }

    @Override
    public boolean tryAdvance(Consumer<? super String[]> action) {
        try {
            String line = reader.readLine();
            if (line == null) return false;
            action.accept(line.split(delimiter));
            return true;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @Override
    public Spliterator<String[]> trySplit() {
        return null;  // can't split a sequential file reader
    }

    @Override
    public long estimateSize() { return Long.MAX_VALUE; }  // unknown

    @Override
    public int characteristics() {
        return ORDERED | NONNULL;  // ordered, no nulls, but NOT SIZED
    }
}

// Usage:
Stream<String[]> csvStream = StreamSupport.stream(
    new CsvSpliterator(reader, ","), false
);
```

### mapMulti — Replacing flatMap for Performance (Java 16+)

```java
// flatMap creates intermediate Stream objects for EVERY element:
stream.flatMap(order -> order.getItems().stream())  // N intermediate Streams

// mapMulti avoids intermediate Stream allocation:
stream.<Item>mapMulti((order, consumer) -> {
    for (Item item : order.getItems()) {
        consumer.accept(item);  // push directly to downstream
    }
})

// When to prefer mapMulti over flatMap:
// 1. When each element maps to a SMALL number of output elements
// 2. When you want to filter AND map in one step
// 3. When creating intermediate streams is costly (tight loops)

// Example: filter + transform in one shot
stream.<String>mapMulti((n, consumer) -> {
    if (n > 0) {
        consumer.accept("positive: " + n);
    }
})
// Equivalent to: stream.filter(n -> n > 0).map(n -> "positive: " + n)
// But with one fewer pipeline stage and no intermediate stream
```

### Stream Characteristics and Optimization

```
Characteristic    Meaning                          Optimization
──────────────────────────────────────────────────────────────────
SIZED             Known size (e.g., ArrayList)     toArray() pre-allocates
ORDERED           Elements have encounter order    limit/skip are meaningful
SORTED            Elements in Comparator order     sorted() is a no-op
DISTINCT          No duplicates                    distinct() is a no-op
NONNULL           No null elements                 Skip null checks
SUBSIZED          trySplit() produces SIZED parts  Better parallel decomposition
IMMUTABLE         Source won't be modified          Safe to read without sync
CONCURRENT        Source safe for concurrent mod   No need to buffer
```

```java
// You can inspect characteristics:
Spliterator<String> s = List.of("a", "b").spliterator();
System.out.println(s.hasCharacteristics(Spliterator.SIZED));    // true
System.out.println(s.hasCharacteristics(Spliterator.ORDERED));  // true

// Operations REMOVE characteristics:
// filter → removes SIZED (unknown how many pass)
// map → removes SORTED, DISTINCT (transformation may not preserve them)
// sorted → adds SORTED
// distinct → adds DISTINCT
// unordered → removes ORDERED
```

---

## 3. Functional Interfaces and Lambdas — invokedynamic Under the Hood

### The Design Decision That Changed Java's Future

When Brian Goetz and the Project Lambda team designed lambdas for Java 8, they faced a critical implementation choice: should lambdas be syntactic sugar for anonymous inner classes, or something fundamentally different? They chose the latter, and the reasons reveal deep thinking about language evolution.

Anonymous inner classes have three problems: (1) each one generates a separate `.class` file, which slows down class loading and inflates JAR sizes; (2) each instantiation allocates a new object on the heap, even when the lambda captures nothing; (3) the implementation strategy is baked into the bytecode at compile time, so it can never be improved without recompilation.

The lambda design uses `invokedynamic` — a bytecode instruction originally created for dynamic languages on the JVM — to **defer the implementation strategy to runtime**. The compiler doesn't decide how a lambda is implemented. Instead, it emits an `invokedynamic` instruction that says "I need a `Runnable` whose `run()` method does X" and delegates to `LambdaMetafactory` at runtime to figure out the best way to create it. This means the JVM can (and does) use different strategies depending on the situation: a singleton for non-capturing lambdas, a lightweight wrapper for capturing lambdas, or even a direct method call when the JIT proves it's safe. Future JVM versions can introduce better strategies without any changes to your compiled code.

This is a masterclass in language design: instead of committing to an implementation, commit to a *protocol* that allows the implementation to evolve.

### Lambdas Are NOT Anonymous Inner Classes

This is the single most misunderstood fact. Compare:

```java
// Anonymous inner class — creates a NEW .class file
Runnable r1 = new Runnable() {
    @Override
    public void run() {
        System.out.println("hello");
    }
};

// Lambda — NO .class file generated at compile time
Runnable r2 = () -> System.out.println("hello");
```

What actually happens:

```
Anonymous class:
  1. Compiler creates MyClass$1.class
  2. JVM loads MyClass$1
  3. Every use: new MyClass$1() — heap allocation

Lambda:
  1. Compiler creates a PRIVATE static method in the enclosing class
  2. Compiler emits invokedynamic instruction
  3. First call: LambdaMetafactory bootstrap generates implementation class at RUNTIME
  4. Subsequent calls: reuse the same call site (near-zero overhead)
```

### Bytecode: invokedynamic + LambdaMetafactory

```java
public class LambdaDemo {
    public void run() {
        Runnable r = () -> System.out.println("hello");
        r.run();
    }
}
```

```
// javap -c -p LambdaDemo.class

// The lambda body becomes a private static method:
private static void lambda$run$0();
    Code:
       0: getstatic     #2  // System.out
       3: ldc           #3  // "hello"
       5: invokevirtual #4  // PrintStream.println
       8: return

// The lambda creation uses invokedynamic:
public void run();
    Code:
       0: invokedynamic #5, 0  // InvokeDynamic #0:run:()Ljava/lang/Runnable;
       5: astore_1
       6: aload_1
       7: invokeinterface #6, 1  // Runnable.run:()V
      12: return

// Bootstrap method (in constant pool):
// #0 = InvokeDynamic
//   bootstrap = java.lang.invoke.LambdaMetafactory.metafactory(...)
//   name = "run"
//   type = ()Runnable
//   args: [
//     ()void,                              // SAM method type
//     LambdaDemo.lambda$run$0:()void,     // implementation method
//     ()void                               // instantiated type
//   ]
```

### Capturing vs Non-Capturing Lambdas

The distinction between capturing and non-capturing lambdas has profound performance implications that most developers never consider. A **non-capturing lambda** references nothing from its enclosing scope — it's a pure function of its parameters. The JVM can create a single instance of this lambda and reuse it forever, across all invocations, across all threads. It's effectively a static singleton with zero allocation overhead after the first call.

A **capturing lambda** references something external — a local variable, a method parameter, or the `this` reference of the enclosing class. Because the captured values might differ between invocations, the JVM must create a new lambda instance each time, passing the captured values as constructor arguments. This means heap allocation on every lambda creation, which in a tight loop can generate enormous GC pressure.

This is why experienced Java developers prefer method references to capturing lambdas when possible, and why they structure code to minimize captures. In performance-critical paths (inner loops, high-frequency callbacks), the difference between a non-capturing and a capturing lambda can be the difference between zero allocations and millions of allocations per second.

```java
// NON-CAPTURING: no external state referenced
Runnable r = () -> System.out.println("constant");
// → singleton instance, reused across all invocations
// → zero allocation after first call

// CAPTURING: references local variable or 'this'
String name = "world";
Runnable r = () -> System.out.println("hello " + name);
// → new instance per invocation (must capture 'name')
// → allocation on each lambda creation

// THIS-CAPTURING: references instance method/field
Runnable r = () -> this.doSomething();
// → captures 'this', new instance per invocation
```

**Performance rule:** Non-capturing lambdas are essentially free. Capturing lambdas allocate.

### Method References — Four Kinds

Method references are not just shorthand for lambdas — they're a way to point directly at an existing method rather than wrapping it in an anonymous lambda body. The compiler generates the same `invokedynamic` instruction for both, but method references are clearer in intent ("use this existing method") and can sometimes avoid creating a synthetic `lambda$NNN` method in your class.

There are exactly four kinds, and each has different capturing behavior and bytecode implications:

```java
// 1. Static method reference
Function<String, Integer> f = Integer::parseInt;
// compiles to: invokestatic Integer.parseInt

// 2. Instance method reference (bound)
String str = "hello";
Supplier<Integer> f = str::length;
// captures 'str', calls str.length()

// 3. Instance method reference (unbound / arbitrary)
Function<String, Integer> f = String::length;
// first parameter becomes the receiver: (String s) -> s.length()

// 4. Constructor reference
Supplier<ArrayList> f = ArrayList::new;
// compiles to: invokestatic with constructor as target
```

### Effectively Final

This restriction confuses many developers coming from JavaScript or Python, where closures freely capture mutable variables. But Java's restriction is not arbitrary — it prevents a class of bugs that would be nearly impossible to debug.

Lambdas can only capture variables that are **effectively final** (never reassigned after initialization):

```java
int x = 10;
// x = 20;  // if uncommented, lambda below won't compile
Runnable r = () -> System.out.println(x);

// WHY: lambdas capture the VALUE of x, not a reference to x
// If x could change, the lambda would have a stale copy
// Java chose to ban mutation rather than close over a mutable variable
```

### Built-in Functional Interfaces

```
Interface              Signature                  Use Case
──────────────────────────────────────────────────────────────
Function<T,R>          R apply(T t)               Transform T→R
BiFunction<T,U,R>      R apply(T t, U u)          Two inputs → R
Consumer<T>            void accept(T t)            Side effect
Supplier<T>            T get()                     Factory/lazy value
Predicate<T>           boolean test(T t)           Condition check
UnaryOperator<T>       T apply(T t)                Transform T→T
BinaryOperator<T>      T apply(T t1, T t2)         Reduce two T→T
```

Primitive specializations avoid autoboxing: `IntFunction`, `LongConsumer`, `DoubleSupplier`, `IntPredicate`, etc.

### Serializable Lambdas — For Distributed Systems

```java
// Normal lambdas are NOT serializable:
Runnable r = () -> System.out.println("hello");
// new ObjectOutputStream(out).writeObject(r);  // NotSerializableException

// Cast to intersection type to make it serializable:
Runnable r = (Runnable & Serializable) () -> System.out.println("hello");
// Now serializable — used by Apache Spark, Flink, Hazelcast

// What happens under the hood:
// 1. LambdaMetafactory detects Serializable in the intersection
// 2. Generates a writeReplace() method that returns SerializedLambda
// 3. SerializedLambda captures: implementing class, method name, signature, captured args
// 4. Deserialization calls $deserializeLambda$(SerializedLambda) on the implementing class
// 5. The implementing class validates and reconstructs the lambda

// Security risk: deserialization can execute arbitrary code
// Always validate SerializedLambda fields before reconstructing
```

### Lambda Target Typing and Overload Resolution

```java
// Lambdas have NO inherent type — they take the type of their target:
Runnable r = () -> System.out.println("hi");       // target: Runnable
Callable<String> c = () -> "hello";                 // target: Callable<String>
// Same lambda body, different types

// Overload resolution with lambdas (tricky):
static void execute(Runnable r) { r.run(); }
static <T> T execute(Callable<T> c) throws Exception { return c.call(); }

execute(() -> System.out.println("hi"));  // which overload?
// Runnable — because the lambda is void-compatible (no return value)

execute(() -> "hello");  // which overload?
// Callable<String> — because the lambda is value-compatible (returns String)

execute(() -> { throw new RuntimeException(); });  // which overload?
// AMBIGUOUS — both void-compatible and value-compatible
// Compiler error: reference to execute is ambiguous

// Resolution: explicit cast
execute((Runnable) () -> { throw new RuntimeException(); });
```

### Performance: Lambda vs Anonymous Class vs Method Reference

```
JMH Benchmark Results (typical, JDK 21, -XX:+TieredCompilation):

Benchmark                           Mode  Score    Units
─────────────────────────────────────────────────────────
directCall                          avgt    0.5    ns/op    ← baseline
lambdaNonCapturing                  avgt    0.5    ns/op    ← same as direct (singleton)
methodReferenceStatic               avgt    0.5    ns/op    ← same as direct
lambdaCapturingLocal                avgt    3.2    ns/op    ← allocation per call
methodReferenceBound                avgt    3.1    ns/op    ← captures receiver
anonymousInnerClass                 avgt    3.8    ns/op    ← allocation + class loading
lambdaCapturingThis                 avgt    3.3    ns/op    ← captures this

Key takeaways:
1. Non-capturing lambdas = free (JVM reuses singleton instance)
2. Capturing lambdas ≈ anonymous classes (both allocate per call)
3. Static method references = free (no capture needed)
4. Bound method references ≈ capturing lambdas (capture the receiver)
5. First invocation of any lambda: ~50μs (LambdaMetafactory bootstrap)
   Subsequent invocations: nanoseconds (call site is linked)
```

### Closure Semantics — Why Java Chose Effectively Final

```java
// JavaScript/Python: closures capture the VARIABLE (mutable binding)
// Java: lambdas capture the VALUE (immutable copy)

// Java's choice prevents:
int counter = 0;
// list.forEach(item -> counter++);  // COMPILE ERROR

// Why not allow it?
// 1. Lambda body runs in a DIFFERENT stack frame (possibly different thread)
// 2. The local variable 'counter' lives on the calling thread's stack
// 3. When the calling method returns, that stack frame is destroyed
// 4. The lambda would be reading/writing deallocated memory
// 5. Even without threading: lambda might outlive the method (stored in a field)

// Workarounds (each with trade-offs):
// 1. AtomicInteger (thread-safe, heap-allocated):
AtomicInteger counter = new AtomicInteger();
list.forEach(item -> counter.incrementAndGet());

// 2. Single-element array (not thread-safe, heap-allocated):
int[] counter = {0};
list.forEach(item -> counter[0]++);

// 3. Mutable container (clear intent):
class MutableInt { int value; }
MutableInt counter = new MutableInt();
list.forEach(item -> counter.value++);

// 4. Use reduce/collect instead (functional approach — preferred):
long count = list.stream().filter(predicate).count();
```

---

## 4. Records — How the JVM Stores Them

### The Problem Records Solve

For decades, Java developers have written thousands of lines of boilerplate for simple data-carrying classes: constructors, getters, `equals()`, `hashCode()`, `toString()`. Lombok's `@Value` and `@Data` annotations were a band-aid, but they relied on annotation processing hacks and broke IDE tooling. Kotlin's `data class` demonstrated that a language-level solution was both possible and desirable.

Records, introduced as a preview in Java 14 and finalized in Java 16, are Java's answer. A `record` is a **transparent carrier for a fixed set of values**. The word "transparent" is key: a record's state is entirely determined by its components, and its API (accessors, `equals`, `hashCode`, `toString`) is entirely derived from those components. You can't hide fields or return different values from accessors — the compiler guarantees that the record faithfully represents exactly what it declares.

But records are not just about saving keystrokes. They're a semantic declaration: "this class is its data." This enables the compiler and JVM to make assumptions that are impossible with regular classes — including the `invokedynamic`-based `equals`/`hashCode`/`toString` generation (faster than reflection, more efficient than hand-coded), and the special serialization path (safer than the default `ObjectInputStream` mechanism).

### What a Record Compiles To

```java
public record Point(int x, int y) {}
```

```
// javap -c -p Point.class

public final class Point extends java.lang.Record {
    private final int x;    // immutable
    private final int y;    // immutable

    // Canonical constructor
    public Point(int, int);
        Code:
           0: aload_0
           1: invokespecial #1  // Record.<init>
           4: aload_0
           5: iload_1
           6: putfield      #2  // x:I
           9: aload_0
          10: iload_2
          11: putfield      #3  // y:I
          14: return

    // Accessors (not getX/getY — just x() and y())
    public int x();
    public int y();

    // equals/hashCode/toString — generated via invokedynamic
    public final boolean equals(java.lang.Object);
        Code:
           0: aload_0
           1: aload_1
           2: invokedynamic #4, 0  // ObjectMethods bootstrap
           7: ireturn

    public final int hashCode();
        Code:
           0: aload_0
           1: invokedynamic #5, 0  // ObjectMethods bootstrap
           6: ireturn

    public final java.lang.String toString();
        Code:
           0: aload_0
           1: invokedynamic #6, 0  // ObjectMethods bootstrap
           6: areturn
}
```

**Key insight:** `equals`, `hashCode`, and `toString` use `invokedynamic` with `ObjectMethods` as bootstrap — the JVM generates optimal implementations at runtime, not via reflection.

### Compact Constructors

```java
public record Range(int lo, int hi) {
    // Compact constructor — validation without assigning fields
    public Range {
        if (lo > hi) throw new IllegalArgumentException("lo > hi");
        // Fields are auto-assigned AFTER this block
    }
}
```

### Records vs Classes vs Lombok

```
Feature              Record          Lombok @Value      Manual Class
──────────────────────────────────────────────────────────────────────
Immutable            Yes (final)     Yes (final)        Your choice
equals/hashCode      Auto            Auto               Manual
toString             Auto            Auto               Manual
Constructor          Canonical       All-args           Manual
No-arg constructor   No              No (configurable)  Your choice
Inheritance          No              No                 Yes
Serializable         Yes (special)   Possible           Possible
Custom methods       Yes             Yes                Yes
Pattern matching     Yes             No                 No
```

Use records for: data carriers, DTOs, value objects, algebraic data types.
Don't use for: entities with identity, mutable state, complex hierarchies.

### Record Serialization — Special Treatment

Records have a fundamentally different serialization mechanism than regular classes:

```java
// Regular class deserialization:
// 1. Allocates object WITHOUT calling any constructor
// 2. Reads fields directly via Unsafe/reflection
// 3. Susceptible to serialization attacks (can create invalid objects)

// Record deserialization:
// 1. Reads component values from the stream
// 2. Calls the CANONICAL CONSTRUCTOR with those values
// 3. All validation in the constructor RUNS during deserialization
// 4. Cannot create records in an invalid state

public record Range(int lo, int hi) implements Serializable {
    public Range {
        if (lo > hi) throw new IllegalArgumentException("lo > hi");
    }
}

// Deserializing a corrupted Range(hi=1, lo=10) →
// IllegalArgumentException thrown during deserialization
// The record's invariants are ALWAYS enforced
// This is a massive security improvement over traditional serialization
```

### Local Records — Tuple-Like Inline Types (Java 16+)

```java
// Define records inside methods for ad-hoc groupings:
List<String> topEarners(List<Employee> employees) {
    record NameSalary(String name, double salary) {}  // local record

    return employees.stream()
        .map(e -> new NameSalary(e.name(), e.salary()))
        .sorted(Comparator.comparingDouble(NameSalary::salary).reversed())
        .limit(5)
        .map(NameSalary::name)
        .collect(toList());
}

// Why local records matter:
// Before Java 16: you'd use Map.Entry, Pair<>, Object[], or a top-level class
// Local records give you: named fields, equals/hashCode, toString — all inline
// They're the "named tuple" Java never had
```

### Generic Records

```java
public record Pair<A, B>(A first, B second) {}

Pair<String, Integer> p = new Pair<>("age", 25);
// Works exactly like generic classes — type erasure applies
// After erasure: Pair(Object first, Object second)
// checkcast inserted at usage sites

// Useful for:
public record Result<T>(T value, String error) {
    public static <T> Result<T> success(T value) {
        return new Result<>(value, null);
    }
    public static <T> Result<T> failure(String error) {
        return new Result<>(null, error);
    }
}
```

### Record Patterns — Deconstructing Records (Java 21)

```java
record Point(int x, int y) {}
record Line(Point start, Point end) {}

// Nested record pattern deconstruction:
static double length(Object obj) {
    if (obj instanceof Line(Point(int x1, int y1), Point(int x2, int y2))) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    return 0;
}

// In switch — full deconstruction:
String describe(Object obj) {
    return switch (obj) {
        case Point(int x, int y) when x == 0 && y == 0 -> "origin";
        case Point(int x, int y) when x == 0 -> "on Y-axis at " + y;
        case Point(int x, int y) when y == 0 -> "on X-axis at " + x;
        case Point(int x, int y) -> "point(" + x + ", " + y + ")";
        case Line(Point s, Point e) -> "line from " + s + " to " + e;
        default -> "unknown";
    };
}

// Under the hood: the compiler generates accessor calls and type checks
// case Point(int x, int y) compiles to:
//   if (obj instanceof Point p) { int x = p.x(); int y = p.y(); ... }
```

---

## 5. Sealed Classes — Class Loading Enforcement

### Why Sealed Classes Exist

Before sealed classes, Java had two extremes for controlling inheritance: `final` (nobody can extend this) and regular classes (anybody can extend this). There was no middle ground. If you were designing a library and wanted to say "these three classes are the only valid subtypes," you had no language-level way to enforce it. You could document it, you could make the constructor package-private, but determined users could always subclass your type in unexpected ways.

Sealed classes (finalized in Java 17) fill this gap. A `sealed` class or interface declares its *complete* set of permitted subtypes. The compiler and JVM enforce this: no other class can extend a sealed type. This has two transformative consequences. First, you can model **closed type hierarchies** — essential for domain modeling where a value must be *exactly one of* a known set of types (like JSON values, AST nodes, or protocol messages). Second, the compiler can perform **exhaustiveness checking** in `switch` expressions: if you handle every permitted subtype, you don't need a `default` case, and if you later add a new subtype, every `switch` that doesn't handle it becomes a compile error. This is the kind of compile-time safety that prevents entire categories of production bugs.

### How the JVM Enforces `permits`

```java
public sealed class Shape permits Circle, Rectangle, Triangle {}
public final class Circle extends Shape { double radius; }
public final class Rectangle extends Shape { double w, h; }
public non-sealed class Triangle extends Shape { /* open for further extension */ }
```

```
// javap -v Shape.class
// Contains a PermittedSubclasses attribute:
PermittedSubclasses:
  Circle
  Rectangle
  Triangle
```

When the JVM loads a class that claims to extend `Shape`, it checks:
1. Is the subclass listed in `Shape`'s `PermittedSubclasses` attribute?
2. If not → `IncompatibleClassChangeError` at class loading time

This is enforced at the **JVM level**, not just by the compiler. You can't bypass it with bytecode manipulation.

### Pattern Matching with Sealed Classes

```java
// Exhaustiveness checking — compiler knows all subtypes
double area(Shape shape) {
    return switch (shape) {
        case Circle c    -> Math.PI * c.radius * c.radius;
        case Rectangle r -> r.w * r.h;
        case Triangle t  -> /* ... */ 0;
        // No default needed — sealed hierarchy is exhaustive
    };
}
```

If you add a new subclass to `permits`, every switch over the sealed type will produce a compiler error until you handle the new case. This is **compile-time exhaustiveness checking**.

### Algebraic Data Types (ADTs) — Sealed + Records

The combination of sealed interfaces and records gives Java true algebraic data types:

```java
// Sum type (OR): a value is ONE of these types
public sealed interface Expr permits Literal, Add, Multiply, Negate {

    // Product types (AND): each variant has specific fields
    record Literal(double value) implements Expr {}
    record Add(Expr left, Expr right) implements Expr {}
    record Multiply(Expr left, Expr right) implements Expr {}
    record Negate(Expr operand) implements Expr {}
}

// Exhaustive evaluation with pattern matching:
double eval(Expr expr) {
    return switch (expr) {
        case Expr.Literal(double v) -> v;
        case Expr.Add(Expr l, Expr r) -> eval(l) + eval(r);
        case Expr.Multiply(Expr l, Expr r) -> eval(l) * eval(r);
        case Expr.Negate(Expr e) -> -eval(e);
        // no default needed — compiler knows all cases
    };
}

// This replaces the Visitor pattern entirely:
// - No accept/visit boilerplate
// - Compile-time exhaustiveness checking
// - Adding a new variant → every switch gets a compiler error until handled
```

### Sealed Interfaces — More Flexible Than Sealed Classes

```java
// Sealed interfaces allow multiple implementation styles:
public sealed interface Result<T> {
    record Success<T>(T value) implements Result<T> {}
    record Failure<T>(Exception error) implements Result<T> {}
    record Pending<T>() implements Result<T> {}
}

// Unlike sealed classes, implementations can extend different classes:
public sealed interface JsonValue {
    record JsonString(String value) implements JsonValue {}
    record JsonNumber(double value) implements JsonValue {}
    record JsonBool(boolean value) implements JsonValue {}
    record JsonNull() implements JsonValue {}
    record JsonArray(List<JsonValue> elements) implements JsonValue {}
    record JsonObject(Map<String, JsonValue> fields) implements JsonValue {}
}

// Real-world: state machines
public sealed interface ConnectionState {
    record Disconnected() implements ConnectionState {}
    record Connecting(String host, int port) implements ConnectionState {}
    record Connected(Socket socket) implements ConnectionState {}
    record Failed(IOException error, int retryCount) implements ConnectionState {}
}

ConnectionState handle(ConnectionState state) {
    return switch (state) {
        case Disconnected() -> new Connecting("localhost", 8080);
        case Connecting(String host, int port) -> tryConnect(host, port);
        case Connected(Socket s) when !s.isConnected() -> new Disconnected();
        case Connected(Socket s) -> state;  // stay connected
        case Failed(IOException e, int r) when r < 3 -> new Connecting("localhost", 8080);
        case Failed(_, _) -> new Disconnected();  // give up
    };
}
```

### Sealed Hierarchy Design Rules

```
1. Permitted subclasses must be in the same MODULE (or same package in unnamed module)
2. Each permitted subclass must:
   - Be declared final (no further extension)
   - Be declared sealed (controlled extension continues)
   - Be declared non-sealed (open for extension — escape hatch)

3. Sealed + final records = perfect for value types (no mutation, no extension)
4. Sealed + non-sealed = constrain the top level, open the bottom
5. You can have deeply nested sealed hierarchies

sealed interface Animal permits Mammal, Bird, Fish {}
sealed interface Mammal extends Animal permits Dog, Cat {}
final class Dog implements Mammal {}
final class Cat implements Mammal {}
non-sealed class Bird implements Animal {}  // anyone can extend Bird
final class Fish implements Animal {}
```

---

## 6. Comparator — Contract Violations and TimSort

### Why the Comparator Contract Matters More Than You Think

The `Comparator` interface looks deceptively simple — take two objects, return a negative number, zero, or positive number. But this simplicity hides a rigid mathematical contract, and violating that contract doesn't just give you wrong results — it can crash your application with an `IllegalArgumentException` that seems to come from nowhere.

The reason is `TimSort`, which became the default sorting algorithm in Java 7 (replacing the old merge sort). TimSort is a highly optimized hybrid algorithm that exploits existing order in the data (runs of ascending or descending elements). Its optimizations rely on the mathematical properties of the comparator being correct. When you violate transitivity (if A > B and B > C, then A > C must hold), TimSort's internal assertions detect the inconsistency and throw an exception. This was a deliberate design choice: fail fast with a clear error rather than silently produce garbage output.

Before Java 7, a broken comparator would silently return wrong results. After Java 7, it crashes. This change broke a shocking amount of production code, exposing comparators that had been silently wrong for years.

### The Contract

A comparator must be:
- **Reflexive:** `compare(x, x) == 0`
- **Antisymmetric:** `compare(x, y) > 0` implies `compare(y, x) < 0`
- **Transitive:** `compare(x, y) > 0` and `compare(y, z) > 0` implies `compare(x, z) > 0`

### What Happens When You Break It

```java
// BROKEN comparator — violates transitivity
Comparator<Integer> broken = (a, b) -> {
    if (a == b) return 0;
    return (a > b) ? 1 : -1;  // Looks fine, but...
};

// With nulls or NaN or complex logic, transitivity can break
// TimSort relies on transitivity. When violated:
//   java.lang.IllegalArgumentException: Comparison method violates its general contract!
// This was JDK-7075600 — affected tons of production code when TimSort was introduced in Java 7
```

### The Safe Way

```java
// Always use built-in comparators:
Comparator<Employee> byName = Comparator.comparing(Employee::name);
Comparator<Employee> bySalaryThenName = Comparator
    .comparing(Employee::salary)
    .thenComparing(Employee::name);
Comparator<Employee> nullSafe = Comparator
    .comparing(Employee::name, Comparator.nullsLast(Comparator.naturalOrder()));

// For primitives, avoid subtraction (overflow risk):
// BAD:  (a, b) -> a.age - b.age   // overflow if a.age = Integer.MAX_VALUE, b.age = -1
// GOOD: Comparator.comparingInt(Employee::age)
```

---

## 7. Optional — Design Intent and Misuse

### Brian Goetz's Design Intent — And Why Everyone Misuses Optional

`Optional` is the most misused feature in Java since generics. To understand why, you need to understand what it was designed for and — equally important — what it was NOT designed for.

The motivation was simple: in Java, every method that returns an object can return `null`, and there's no way to tell from the type signature whether a null return is expected or a bug. Tony Hoare called null references his "billion-dollar mistake," and Java inherited that mistake fully. `Optional` was designed as a **return-type-only solution** to this problem: when a method returns `Optional<T>`, it's a clear signal to the caller that the absence of a value is a normal, expected outcome — not an error.

Brian Goetz, the Java language architect, has been very explicit about this. `Optional` was NOT designed for: field types (it adds 16 bytes of overhead per field and is not serializable), method parameters (use `@Nullable` or method overloading), or collection elements (filter nulls instead). When you see `Optional<String> middleName` as a field in a class, that's a design smell — it means someone is using a return-type construct as a storage construct. Joshua Bloch's *Effective Java* reinforces this: Optional should only appear in return positions where the absence of a value needs to be represented.

### Why Optional Exists

```java
// The problem:
public User findUser(String id) {
    return null;  // caller might forget to check → NullPointerException
}

// The solution:
public Optional<User> findUser(String id) {
    return Optional.ofNullable(userMap.get(id));  // forces caller to handle absence
}
```

### When NOT to Use Optional

```java
// BAD: as a field — adds memory overhead, not serializable by default
public class User {
    private Optional<String> middleName;  // Don't. Use @Nullable or empty string.
}

// BAD: as a method parameter
public void process(Optional<String> name) {}  // Don't. Use @Nullable or overload.

// BAD: in collections
List<Optional<String>> names;  // Don't. Filter nulls instead.

// BAD: for performance-critical code
// Optional.of() creates an object on the heap every time
// In a tight loop, this adds GC pressure
```

### Correct Usage Patterns

```java
// Chain operations — avoid nested if-null checks
String city = findUser(id)
    .map(User::getAddress)
    .map(Address::getCity)
    .orElse("Unknown");

// orElse vs orElseGet
opt.orElse(createDefault());          // createDefault() ALWAYS called
opt.orElseGet(() -> createDefault()); // createDefault() called ONLY if empty

// orElseThrow (Java 10+)
User user = findUser(id).orElseThrow();  // throws NoSuchElementException

// Conditional action
findUser(id).ifPresentOrElse(
    user -> System.out.println("Found: " + user),
    () -> System.out.println("Not found")
);
```

---

## 8. Switch Expressions — Compilation Strategy

### How Switch Statements Become Bytecode — And Why It Matters

The `switch` statement is one of the oldest constructs in Java, but its internal compilation strategy is far more sophisticated than most developers realize. The compiler doesn't just generate a series of `if-else` comparisons — it uses two fundamentally different bytecode instructions depending on the distribution of case values, and the choice between them can mean the difference between O(1) and O(log n) dispatch.

Understanding this matters for two reasons. First, in performance-critical code (like parsers, state machines, or protocol handlers), the switch compilation strategy can measurably affect throughput. Second, modern Java's pattern matching extensions (Java 21) layer on top of these same mechanisms, so understanding the bytecode foundation helps you reason about the performance of `switch` with patterns, records, and sealed types.

### tableswitch vs lookupswitch

The compiler chooses based on case density:

```java
// DENSE cases → tableswitch (O(1) jump table)
int result = switch (day) {
    case 1 -> 10;
    case 2 -> 20;
    case 3 -> 30;
    case 4 -> 40;
    default -> 0;
};
```

```
// Bytecode:
tableswitch { // 1 to 4
    1: 28      // jump offsets — direct index into table
    2: 34
    3: 40
    4: 46
    default: 52
}
// O(1) — the JVM uses 'value - low' as an index into the jump table
```

```java
// SPARSE cases → lookupswitch (O(log n) binary search)
int result = switch (code) {
    case 100 -> 1;
    case 500 -> 2;
    case 999 -> 3;
    default -> 0;
};
```

```
// Bytecode:
lookupswitch {
    100: 36
    500: 42
    999: 48
    default: 54
}
// O(log n) — binary search through sorted key-value pairs
```

### String Switch — hashCode + equals

```java
String s = "hello";
switch (s) {
    case "hello" -> System.out.println("hi");
    case "world" -> System.out.println("earth");
}
```

```
// Compiled as (pseudocode):
int hash = s.hashCode();
switch (hash) {
    case 99162322:  // "hello".hashCode()
        if (s.equals("hello")) { ... }
        break;
    case 113318802: // "world".hashCode()
        if (s.equals("world")) { ... }
        break;
}
// Two-phase: hashCode for fast bucketing, equals for collision safety
```

### Enum Switch — Ordinal Jump Table

```java
enum Color { RED, GREEN, BLUE }

switch (color) {
    case RED -> ...;
    case GREEN -> ...;
    case BLUE -> ...;
}
```

```
// Compiled using a synthetic int[] map (one per switch site):
// SyntheticClass.$SwitchMap$Color = new int[Color.values().length];
// $SwitchMap$Color[Color.RED.ordinal()] = 1;
// $SwitchMap$Color[Color.GREEN.ordinal()] = 2;
// $SwitchMap$Color[Color.BLUE.ordinal()] = 3;
//
// Then: tableswitch on $SwitchMap$Color[color.ordinal()]
// This indirection protects against enum ordinal changes across compilation units
```

---

## 9. equals, hashCode, and the Object Contract

### Why This Is the Most Dangerous API in Java

The `equals()` and `hashCode()` methods are the foundation of Java's entire collection framework. `HashMap`, `HashSet`, `LinkedHashMap`, `ConcurrentHashMap` — they all depend on these two methods being correctly implemented according to a strict mathematical contract. Get it wrong, and your objects silently disappear from maps, your sets contain duplicates, and your application produces results that are wrong in ways that are nearly impossible to debug.

The contract between `equals()` and `hashCode()` is: **if two objects are equal according to `equals()`, they MUST have the same `hashCode()`**. The reverse is not required — unequal objects can share a hash code (that's just a collision). But if equal objects have different hash codes, `HashMap.get()` will look in the wrong bucket and return `null` even though the entry exists. The entry is in the map; the lookup just can't find it. This is not a theoretical concern — it's one of the most common and most insidious bugs in Java applications.

Joshua Bloch devotes three chapters of *Effective Java* to `equals`, `hashCode`, and `compareTo` because the consequences of getting them wrong are so severe and the mistakes are so common. The safest approach in modern Java is to use records (which generate correct implementations automatically) or IDE-generated implementations, and to never write these methods by hand unless you have a compelling reason.

### The equals Contract

```
1. Reflexive:   x.equals(x) == true
2. Symmetric:   x.equals(y) == y.equals(x)
3. Transitive:  x.equals(y) && y.equals(z) → x.equals(z)
4. Consistent:  multiple calls return same result (if objects unchanged)
5. Non-null:    x.equals(null) == false
```

### Breaking Symmetry Breaks Collections

```java
// BROKEN: symmetry violation
public class CaseInsensitiveString {
    private String s;

    @Override
    public boolean equals(Object o) {
        if (o instanceof CaseInsensitiveString)
            return s.equalsIgnoreCase(((CaseInsensitiveString) o).s);
        if (o instanceof String)
            return s.equalsIgnoreCase((String) o);  // String.equals won't return true!
        return false;
    }
}

CaseInsensitiveString cis = new CaseInsensitiveString("Hello");
String s = "hello";
cis.equals(s);  // true
s.equals(cis);  // false ← SYMMETRY BROKEN

// Now put cis in a HashSet, then ask contains(s):
// Result is UNDEFINED — depends on which direction equals is called
```

### HashMap's Hash Distribution

```java
// HashMap does NOT use hashCode() directly
// It spreads bits to prevent bucket collisions:
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    // XOR high bits into low bits — prevents clustering when table size is power-of-2
}

// Bucket index = hash & (table.length - 1)
// Since table.length is always a power of 2, this is a fast modulo
```

### Treeification: When Buckets Become Trees

```
HashMap bucket when many collisions:

Entries ≤ 8:  Linked list (O(n) lookup)
Entries > 8:  Red-black tree (O(log n) lookup)  ← TREEIFY_THRESHOLD
Entries < 6:  Shrink back to linked list         ← UNTREEIFY_THRESHOLD

This was added in Java 8 to prevent HashDoS attacks where
an attacker crafts keys with the same hashCode to create O(n) lookups
```

---

## 10. Collections Internals

### Why Understanding Collection Internals Makes You a Better Engineer

Every data structure is a set of trade-offs. `ArrayList` trades insertion speed for random access speed. `LinkedList` trades memory locality for O(1) unlinking. `HashMap` trades memory for O(1) lookups. `TreeMap` trades lookup speed for sorted ordering. If you don't understand these trade-offs at the implementation level, you'll choose the wrong data structure and wonder why your application is slow.

More importantly, understanding internals helps you predict behavior under stress. A `HashMap` that's fine with 100 entries might become a performance nightmare with 10 million entries if the hash function is poor (bucket collisions → O(n) lookups). An `ArrayList` that handles your test data smoothly might cause GC pauses in production because its growth strategy creates large temporary arrays. A `ConcurrentHashMap` that's fast under light contention might bottleneck under heavy write pressure because of bucket-level locking.

The sections below dissect each major collection at the implementation level: what the internal data structure looks like, how each operation works, and where the performance cliffs are.

### ArrayList

```
Internal structure:
    Object[] elementData;  // backing array
    int size;              // logical size (≤ elementData.length)

Growth strategy:
    newCapacity = oldCapacity + (oldCapacity >> 1)  // 1.5x growth
    Uses Arrays.copyOf → System.arraycopy (native memcpy)

add(E):          O(1) amortized — append to end
add(int, E):     O(n) — shift elements right via arraycopy
get(int):        O(1) — direct array index
remove(int):     O(n) — shift elements left via arraycopy
contains(E):     O(n) — linear scan
```

### LinkedList

```
Internal structure: doubly-linked node chain
    class Node<E> {
        E item;
        Node<E> next;
        Node<E> prev;
    }

add(E):          O(1) — append to tail
add(int, E):     O(n) — traverse to index, then link
get(int):        O(n) — traverse from head or tail (whichever is closer)
remove:          O(1) if you have the node, O(n) to find it

WHY IT'S ALMOST ALWAYS WORSE THAN ARRAYLIST:
- Every node is a separate heap object → more GC pressure
- Nodes are scattered in memory → cache misses on traversal
- Even "O(1) add" has object allocation overhead
- ArrayList's cache locality (contiguous memory) beats linked traversal
```

### HashMap

```
Internal structure:
    Node<K,V>[] table;     // bucket array (power-of-2 size)
    int size;              // entry count
    float loadFactor;      // default 0.75
    int threshold;         // size at which to resize = capacity * loadFactor

Resize: when size > threshold, double the table
    Every entry is rehashed to new bucket (hash & (newLength - 1))
    This is O(n) — plan initial capacity to avoid resizing

Put flow:
    1. hash = key.hashCode() ^ (key.hashCode() >>> 16)
    2. index = hash & (table.length - 1)
    3. If bucket empty → create new Node
    4. If bucket has entries:
       a. Check each entry: if key.equals(existingKey) → replace value
       b. If linked list length > 8 → treeify bucket
       c. Else append to list
    5. If size > threshold → resize

Null key: always stored in bucket 0
```

### EnumSet — Bit Vector Magic

```java
// RegularEnumSet (≤ 64 enum constants): backed by a single long
// Each bit represents one enum constant
EnumSet<DayOfWeek> weekend = EnumSet.of(SATURDAY, SUNDAY);
// Internally: long elements = 0b01100000  (bits for SAT and SUN)
// contains():  return (elements & (1L << ordinal)) != 0;   // O(1), no boxing
// add():       elements |= (1L << ordinal);                 // O(1)
// size():      Long.bitCount(elements);                     // single CPU instruction

// JumboEnumSet (> 64 constants): backed by long[]
// Same bit manipulation, just over an array
```

### Unmodifiable Collections

```java
// View wrapper — still backed by original (changes visible):
List<String> unmod = Collections.unmodifiableList(original);
original.add("new");  // unmod now sees "new" too!

// True immutable copies (Java 9+):
List<String> immut = List.of("a", "b", "c");           // immutable, no nulls
List<String> copy  = List.copyOf(original);             // immutable copy
List<String> copy2 = Collections.unmodifiableList(new ArrayList<>(original)); // pre-Java 9

// List.of() uses specialized classes:
// 0 elements: List12 (empty singleton)
// 1-2 elements: List12 (fields E e0, E e1)
// 3+ elements: ListN (Object[] array)
// These are smaller and faster than ArrayList wrappers
```

---

## Common Pitfalls Cheat Sheet

| Pitfall | What Goes Wrong | Fix |
|---------|----------------|-----|
| `List<Object>` = `List<String>` | Compile error — generics are invariant | Use `List<? extends Object>` |
| `new T()` | Type erasure — JVM doesn't know T | Pass `Class<T>` token |
| `array[0] instanceof T` | Illegal generic instanceof | Pass `Class<T>`, use `isInstance()` |
| `.parallelStream()` on small data | Overhead > benefit | Benchmark; use sequential for < 10K |
| `.parallelStream()` in web app | Starves ForkJoinPool.commonPool | Use custom ForkJoinPool |
| Lambda captures mutable var | Compile error (effectively final) | Use AtomicReference or array[0] hack |
| `(a, b) -> a.x - b.x` | Integer overflow in comparator | Use `Comparator.comparingInt()` |
| Mutable keys in HashMap | Hash changes → entry lost forever | Use immutable keys |
| `Optional` as field | Not serializable, adds overhead | Use `@Nullable` |
| `stream.peek()` for side effects | Not guaranteed to execute | Use `forEach` for side effects |

---

*After this phase: when you see Java code, you see bytecode. When you see generics, you see erasure and casts. When you see streams, you see the Spliterator and Sink chain. That's mastery.*

---
---

# Deep Dive Sections — Expert-Level Internals

> The sections below take you beyond language features into how the JVM actually represents, stores, and executes your code. This is the knowledge that separates a senior developer from the person who debugs production issues at 3 AM.

---

## 11. String Internals — Pool, Compact Strings, and Concatenation

`String` is the most used class in Java — by a wide margin. In a typical enterprise application, 25-40% of the heap is `String` objects and their backing `byte[]` arrays. Understanding how strings are stored, interned, and concatenated at the JVM level isn't academic curiosity — it directly impacts your application's memory footprint, GC behavior, and throughput. Every optimization the JVM team has made to `String` in the last decade (compact strings, invokedynamic concatenation, string deduplication) was motivated by real-world measurements showing that strings dominate production heap profiles.

### The String Object Layout

```
// Every String in HotSpot JVM (Java 9+):
String {
    Object header:     12 bytes (mark word + klass pointer, compressed)
    byte[] value:       4 bytes (reference to backing array)
    byte coder:         1 byte  (0 = LATIN1, 1 = UTF16)
    int hash:           4 bytes (cached hashCode, lazily computed)
    padding:            3 bytes (align to 8-byte boundary)
    ─────────────────────────
    Total:             24 bytes (object header + fields)
    + byte[] array:    16 + length bytes (LATIN1) or 16 + length*2 (UTF16)
}

// "hello" in memory:
// String object:  24 bytes
// byte[] array:   16 (header) + 5 (data) + 3 (padding) = 24 bytes
// Total:          48 bytes for a 5-character string
```

### Compact Strings (JEP 254, Java 9+) — The Internal Revolution

This was one of the most impactful JVM changes in the last decade, and it happened entirely under the hood — no API changes, no code modifications required. The insight was simple: the vast majority of strings in real-world applications contain only Latin-1 characters (English text, identifiers, URLs, JSON keys, XML tags). Storing every character in 2 bytes (UTF-16) wastes 50% of the memory for these strings. By detecting at creation time whether a string can fit in Latin-1 encoding, the JVM can store it in half the space.

Before Java 9, every `String` used `char[]` — 2 bytes per character, even for ASCII:

```java
// Java 8: String = char[] (always UTF-16, 2 bytes/char)
"hello" → char[] {'h','e','l','l','o'} → 10 bytes of data

// Java 9+: String = byte[] + coder
"hello" → byte[] {104,101,108,108,111}, coder=LATIN1 → 5 bytes of data (50% savings!)
"日本語"  → byte[] {UTF-16 encoded}, coder=UTF16 → 6 bytes of data (same as before)
```

```java
// How the JVM decides:
// When creating a String, it checks every character:
// - If ALL chars fit in Latin-1 (0x00-0xFF): coder=LATIN1, byte[] with 1 byte/char
// - If ANY char > 0xFF: coder=UTF16, byte[] with 2 bytes/char

// Every String method dispatches on coder:
public int indexOf(int ch) {
    return isLatin1() ? StringLatin1.indexOf(value, ch)
                      : StringUTF16.indexOf(value, ch);
}

// StringLatin1 methods use byte operations (fast, cache-friendly)
// StringUTF16 methods use char operations (decode pairs of bytes)
```

**Production impact:** In typical English-language applications, 95%+ of strings are Latin-1. Compact Strings reduce heap usage by 10-30% and reduce GC pressure proportionally.

### String Interning and the String Pool

String interning is the JVM's mechanism for deduplicating string values. When you write a string literal like `"hello"` in your source code, the compiler places it in the class file's constant pool. When the class is loaded, the JVM checks its internal **string pool** (a native hash table): if an equal string already exists, the existing reference is reused; if not, a new entry is created. This means that all occurrences of the same string literal across your entire application share a single `String` object in memory.

The `intern()` method extends this to dynamically-created strings: it checks the pool, adds the string if absent, and returns the canonical reference. This can save enormous amounts of memory when you have millions of strings with high duplication (like parsing a CSV file where column values repeat). But it comes with a cost: the intern table itself uses memory, and `intern()` requires a hash table lookup plus potential synchronization. Blindly interning every string can actually hurt performance.

```java
// The String pool is a native HashTable in the JVM (not on the Java heap in older JVMs)
// Since Java 7: String pool lives in the heap (can be GC'd)

String s1 = "hello";                  // goes into string pool (compile-time constant)
String s2 = "hello";                  // same reference from pool
String s3 = new String("hello");      // NEW object on heap (NOT pooled)
String s4 = s3.intern();             // explicitly adds to pool / returns existing

s1 == s2   // true  — same pool reference
s1 == s3   // false — s3 is a new heap object
s1 == s4   // true  — intern() returned the pool reference

// Pool size tuning:
// -XX:StringTableSize=60013    (default varies by JDK version)
// Higher = fewer collisions = faster intern()
// Monitor: jcmd <pid> VM.stringtable
```

```
// How String pool works internally:
// - Native C++ StringTable (open hash table with linked list buckets)
// - Bucket = hash(string.value) % StringTableSize
// - G1/ZGC can collect pool entries during concurrent marking
// - Interned strings are weak references (can be GC'd if no strong refs)

// When to intern:
// DO: when you have millions of duplicate strings (e.g., parsing CSV column values)
// DON'T: when strings are unique (intern() overhead > savings)
// DON'T: blindly — measure with -XX:+PrintStringTableStatistics
```

### String Concatenation — The invokedynamic Revolution (JEP 280, Java 9+)

String concatenation with the `+` operator is one of the most common operations in Java, and its implementation has changed dramatically three times across Java's history. In Java 1-4, the compiler generated explicit `StringBuffer` calls (synchronized, slow). In Java 5-8, it switched to `StringBuilder` (unsynchronized, better). In Java 9+, it switched to `invokedynamic` with `StringConcatFactory` — a fundamentally different approach that decouples the compilation strategy from the bytecode, allowing the JVM to choose the optimal concatenation implementation at runtime.

The key insight behind JEP 280 is the same insight behind lambda's use of `invokedynamic`: if you bake the implementation strategy into the bytecode at compile time, you can never improve it without recompilation. By emitting a single `invokedynamic` instruction that says "concatenate these values," the JVM can use whatever strategy is fastest — and improve that strategy in future JDK releases without touching your compiled classes.

```java
// What you write:
String result = "Hello, " + name + "! You are " + age + " years old.";
```

```
// Java 8 compiled this to:
new StringBuilder()
    .append("Hello, ")
    .append(name)
    .append("! You are ")
    .append(age)
    .append(" years old.")
    .toString()
// Problems:
// 1. Verbose bytecode (dozens of instructions)
// 2. JIT had to recognize the StringBuilder pattern to optimize
// 3. StringBuilder allocates char[] then converts to String (double copy)
// 4. No way to improve without recompiling
```

```
// Java 9+ compiles to a SINGLE instruction:
invokedynamic makeConcatWithConstants(String, int)String
    // recipe: "Hello, \1! You are \1 years old."
    // bootstrap: StringConcatFactory.makeConcatWithConstants

// At runtime, StringConcatFactory generates ONE of these strategies:
// 1. BC_SB (default pre-JDK 9): still uses StringBuilder internally
// 2. BC_SB_SIZED: StringBuilder with pre-calculated initial capacity
// 3. BC_SB_SIZED_EXACT: exact size (no growth needed)
// 4. MH_SB_SIZED: MethodHandle-based StringBuilder
// 5. MH_SB_SIZED_EXACT: MethodHandle with exact capacity
// 6. MH_INLINE_SIZED_EXACT (default JDK 9+): 
//    - Calculates exact byte[] size
//    - Allocates once
//    - Copies directly (no StringBuilder, no intermediate char[])
//    - FASTEST possible concatenation
```

```java
// Control the strategy:
// -Djava.lang.invoke.stringConcat=MH_INLINE_SIZED_EXACT (default)
// -Djava.lang.invoke.stringConcat.debug=true (print generated code)

// Performance comparison (JMH):
// "Hello, " + name + "! Age: " + age
// Java 8 StringBuilder:          ~40 ns
// Java 9+ invokedynamic:         ~25 ns  (37% faster)
// Reason: one allocation, exact size, no intermediate copies
```

### String Deduplication in G1 GC

```bash
# G1 can deduplicate String values (the backing byte[]) automatically:
java -XX:+UseG1GC -XX:+UseStringDeduplication -jar app.jar

# How it works:
# 1. During Young GC, G1 identifies Strings that survived
# 2. A background dedup thread compares byte[] contents
# 3. If two Strings have identical byte[], one byte[] is discarded
# 4. Both Strings point to the same byte[] (the String objects remain separate)

# This is NOT the same as interning:
# - Interning: same String reference (s1 == s2)
# - Dedup: different String objects, same backing array (s1 != s2 but s1.equals(s2))

# Monitor: -XX:+PrintStringDeduplicationStatistics
# Tuning: -XX:StringDeduplicationAgeThreshold=3 (dedup after N GC survivals)
```

---

## 12. Autoboxing, Caching, and Primitive Type Traps

Autoboxing, introduced in Java 5, was designed to eliminate the tedious manual conversion between primitive types (`int`, `long`, `double`) and their wrapper classes (`Integer`, `Long`, `Double`). It's syntactic sugar: the compiler inserts `Integer.valueOf()` and `intValue()` calls for you. But this convenience hides real costs — heap allocation, GC pressure, and subtle identity bugs — that bite hard in production systems.

The most insidious aspect of autoboxing is that it makes `==` behavior unpredictable for wrapper types. Due to the wrapper cache (which caches small values but not large ones), `==` sometimes works and sometimes doesn't, depending on the *value* being compared. This creates bugs that pass unit tests (with small test values) and fail in production (with large real values). Every experienced Java developer has been bitten by this at least once.

### The Integer Cache — Why `==` Sometimes Works

```java
Integer a = 127;    // autoboxed: Integer.valueOf(127)
Integer b = 127;    // same call: Integer.valueOf(127)
a == b              // true — SAME OBJECT from cache

Integer c = 128;    // autoboxed: Integer.valueOf(128)
Integer d = 128;    // new object: Integer.valueOf(128)
c == d              // false — DIFFERENT OBJECTS

// Why? Integer caches instances for -128 to 127:
// (from java.lang.Integer source)
private static class IntegerCache {
    static final int low = -128;
    static final int high;  // default 127, tunable with -XX:AutoBoxCacheMax=N
    static final Integer[] cache;

    static {
        int h = 127;
        String integerCacheHighPropValue =
            VM.getSavedProperty("java.lang.Integer.IntegerCache.high");
        if (integerCacheHighPropValue != null) {
            h = Math.max(parseInt(integerCacheHighPropValue), 127);
        }
        high = h;
        cache = new Integer[(high - low) + 1];
        for (int k = low; k <= high; k++)
            cache[k + (-low)] = new Integer(k);
    }
}

public static Integer valueOf(int i) {
    if (i >= IntegerCache.low && i <= IntegerCache.high)
        return IntegerCache.cache[i + (-IntegerCache.low)];
    return new Integer(i);  // heap allocation
}
```

### All Wrapper Caching Behavior

```
Type       Cached Range       Tunable?
────────────────────────────────────────
Byte       -128 to 127       No (all values)
Short      -128 to 127       No
Integer    -128 to 127       Yes: -XX:AutoBoxCacheMax=N
Long       -128 to 127       No
Character  0 to 127           No
Boolean    TRUE, FALSE        No (only 2 values)
Float      NONE               —
Double     NONE               —

// Float and Double are NEVER cached:
Double a = 1.0;
Double b = 1.0;
a == b  // false — ALWAYS false for Float/Double with ==

// Boolean is always cached:
Boolean a = true;
Boolean b = true;
a == b  // true — ALWAYS (there are only two instances)
```

### The Unboxing NPE Trap — Production's Silent Killer

```java
// This is the #1 autoboxing bug in production Java code:
Map<String, Integer> map = new HashMap<>();
int value = map.get("missing_key");  // NullPointerException!

// Why? map.get() returns Integer (null), unboxing null throws NPE
// The decompiled equivalent:
int value = map.get("missing_key").intValue();  // NPE on null.intValue()

// More subtle:
Integer a = null;
int b = 0;
int c = (condition) ? a : b;  // NPE if condition is true
// The ternary forces unboxing of 'a' because 'b' is primitive

// Even worse — autoboxing in equals:
Integer x = null;
if (x == 0) { ... }  // NPE! Unboxes x to compare with primitive 0

// SAFE patterns:
int value = map.getOrDefault("missing_key", 0);
int value = Optional.ofNullable(map.get("key")).orElse(0);
if (x != null && x == 0) { ... }
```

### Autoboxing Performance in Loops — Death by a Thousand Allocations

```java
// TERRIBLE: autoboxing in a tight loop
Long sum = 0L;
for (long i = 0; i < 1_000_000; i++) {
    sum += i;  // sum = Long.valueOf(sum.longValue() + i)
    //          creates a NEW Long object every iteration
    //          1 million objects → massive GC pressure
}

// CORRECT: use primitive
long sum = 0L;
for (long i = 0; i < 1_000_000; i++) {
    sum += i;  // pure primitive arithmetic, no allocation
}

// Performance difference (JMH):
// Boxed loop:    ~6,000 ms (1M Long objects created and GC'd)
// Primitive loop: ~2 ms    (zero allocation)
// That's a 3000x difference.

// HIDDEN autoboxing traps:
List<Integer> list = new ArrayList<>();
for (int i = 0; i < 1_000_000; i++) {
    list.add(i);  // autoboxes every int → Integer
    // Can't avoid this with ArrayList<Integer>
    // Solution: IntStream, int[], or Eclipse Collections IntArrayList
}
```

### Bytecode of Autoboxing

```
// Java code:
Integer x = 42;
int y = x;

// Bytecode:
bipush 42
invokestatic Integer.valueOf:(I)Ljava/lang/Integer;    // autobox
astore_1
aload_1
invokevirtual Integer.intValue:()I                       // unbox
istore_2

// The compiler always uses valueOf() for boxing (enables caching)
// and intValue()/longValue()/etc. for unboxing
```

---

## 13. Enum Deep Dive — More Than Constants

Java enums are one of the most under-appreciated features in the language. Most developers use them as simple constants — a replacement for `public static final int` — and never explore their full power. But under the hood, enums are full-fledged classes. Each enum constant is a singleton instance. Enums can have fields, constructors, methods, and even abstract methods that each constant overrides differently. They can implement interfaces. They have JVM-level guarantees around serialization, reflection safety, and thread safety that no other construct in Java provides.

Understanding enums at the JVM level also reveals why `EnumSet` and `EnumMap` are the fastest collection implementations in the JDK (backed by bit manipulation on primitive `long` values), and why the enum singleton pattern is strictly superior to every other singleton implementation in Java.

### Enums Are Classes — The Full Truth

```java
public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    VENUS(4.869e+24, 6.0518e6),
    EARTH(5.976e+24, 6.37814e6);

    private final double mass;
    private final double radius;

    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
    }

    double surfaceGravity() {
        return 6.67300E-11 * mass / (radius * radius);
    }
}
```

```
// What the compiler generates (javap -c -p Planet.class):

public final class Planet extends java.lang.Enum<Planet> {
    // Each constant is a static final field:
    public static final Planet MERCURY;
    public static final Planet VENUS;
    public static final Planet EARTH;

    // Private array of all values:
    private static final Planet[] $VALUES;

    // Fields you declared:
    private final double mass;
    private final double radius;

    // Static initializer creates ALL instances:
    static {
        MERCURY = new Planet("MERCURY", 0, 3.303e+23, 2.4397e6);
        VENUS   = new Planet("VENUS",   1, 4.869e+24, 6.0518e6);
        EARTH   = new Planet("EARTH",   2, 5.976e+24, 6.37814e6);
        $VALUES = new Planet[] { MERCURY, VENUS, EARTH };
    }

    // values() returns a CLONE of $VALUES every time:
    public static Planet[] values() {
        return $VALUES.clone();  // defensive copy — 
        // THIS ALLOCATES on every call! Cache it if called in a loop.
    }

    // valueOf() delegates to Enum.valueOf():
    public static Planet valueOf(String name) {
        return Enum.valueOf(Planet.class, name);
    }
}
```

### Constant-Specific Method Bodies — Polymorphism in Enums

```java
public enum Operation {
    ADD {
        @Override public double apply(double x, double y) { return x + y; }
    },
    SUBTRACT {
        @Override public double apply(double x, double y) { return x - y; }
    },
    MULTIPLY {
        @Override public double apply(double x, double y) { return x * y; }
    };

    public abstract double apply(double x, double y);
}

// Under the hood:
// Each constant with a body creates an ANONYMOUS INNER CLASS:
// Operation$1.class (ADD), Operation$2.class (SUBTRACT), Operation$3.class (MULTIPLY)
// These extend Operation and override apply()

// Modern alternative (Java 8+) — lambda in constructor:
public enum Operation {
    ADD((x, y) -> x + y),
    SUBTRACT((x, y) -> x - y),
    MULTIPLY((x, y) -> x * y);

    private final DoubleBinaryOperator op;

    Operation(DoubleBinaryOperator op) { this.op = op; }

    public double apply(double x, double y) { return op.applyAsDouble(x, y); }
}
// No anonymous inner classes — cleaner, faster class loading
```

### Enum Singleton — The Best Singleton Pattern in Java

```java
public enum DatabaseConnection {
    INSTANCE;

    private final Connection conn;

    DatabaseConnection() {
        conn = createConnection();
    }

    public Connection getConnection() { return conn; }
}

// Why this is the best singleton:
// 1. THREAD SAFE: JLS §12.4.2 guarantees class initialization is synchronized
//    Only one thread initializes the enum — no double-checked locking needed
// 2. SERIALIZATION SAFE: Enum serialization is handled specially by the JVM
//    Deserializing always returns the SAME instance (not a new copy)
//    readResolve() is not needed
// 3. REFLECTION SAFE: Constructor.newInstance() throws IllegalArgumentException
//    for enum constructors — you CANNOT create extra instances via reflection
// 4. CLONE SAFE: Enum.clone() throws CloneNotSupportedException

// Compare with double-checked locking singleton:
// - Needs volatile field
// - Needs synchronized block
// - Needs readResolve() for serialization
// - Vulnerable to reflection attack
// - More code, more bugs
```

### EnumMap — Array-Based Map (Fastest Possible)

```java
EnumMap<DayOfWeek, String> schedule = new EnumMap<>(DayOfWeek.class);
schedule.put(DayOfWeek.MONDAY, "Meeting");
schedule.put(DayOfWeek.FRIDAY, "Review");

// Internal structure:
// Object[] vals = new Object[DayOfWeek.values().length];  // array indexed by ordinal
// put(key, value) → vals[key.ordinal()] = value;          // O(1), no hashing
// get(key) → vals[key.ordinal()];                          // O(1), direct index

// Performance vs HashMap:
// HashMap: hash → bucket index → linked list/tree traversal
// EnumMap: ordinal → direct array index (single memory access)
// EnumMap is 2-5x faster than HashMap<Enum, V> for all operations

// Memory: EnumMap uses a flat Object[] — no Node objects, no hash table overhead
// A HashMap<DayOfWeek, String> with 7 entries: ~400 bytes
// An EnumMap<DayOfWeek, String> with 7 entries: ~80 bytes
```

### Strategic Enum Patterns

```java
// 1. State Machine:
public enum OrderState {
    PENDING {
        @Override public OrderState next() { return PROCESSING; }
        @Override public boolean canCancel() { return true; }
    },
    PROCESSING {
        @Override public OrderState next() { return SHIPPED; }
        @Override public boolean canCancel() { return false; }
    },
    SHIPPED {
        @Override public OrderState next() { return DELIVERED; }
        @Override public boolean canCancel() { return false; }
    },
    DELIVERED {
        @Override public OrderState next() { throw new IllegalStateException(); }
        @Override public boolean canCancel() { return false; }
    };

    public abstract OrderState next();
    public abstract boolean canCancel();
}

// 2. Strategy Pattern with EnumMap:
Map<FileType, Function<byte[], Document>> parsers = new EnumMap<>(FileType.class);
parsers.put(FileType.PDF, PdfParser::parse);
parsers.put(FileType.CSV, CsvParser::parse);
parsers.put(FileType.JSON, JsonParser::parse);

Document doc = parsers.get(fileType).apply(data);

// 3. Bit flags replacement (use EnumSet):
// Instead of: int flags = READ | WRITE | EXECUTE;
Set<Permission> perms = EnumSet.of(Permission.READ, Permission.WRITE);
perms.contains(Permission.EXECUTE);  // O(1), backed by single long
```

---

## 14. Exception Handling Internals — Bytecode, Cost, and Desugaring

Exception handling is one of the most misunderstood aspects of JVM performance. Many developers believe that `try` blocks are expensive and avoid them in performance-critical code. This is wrong. A `try` block has **zero runtime cost in the happy path**. The JVM doesn't execute any extra instructions for being inside a `try` block — the exception handling metadata is stored in a separate **exception table** that is only consulted when an exception actually occurs.

What IS expensive is **creating and throwing exceptions**. The `Throwable` constructor calls `fillInStackTrace()`, which walks the entire thread stack to build a `StackTraceElement[]` array. On a deep call stack (common in Spring/Jakarta EE applications with dozens of framework layers), this can take tens of microseconds — a million times more expensive than a simple method call. This is why exceptions should never be used for control flow in performance-sensitive code, and why some frameworks define exceptions that skip stack trace filling entirely.

### The Exception Table — How try-catch Really Works

```java
public int divide(int a, int b) {
    try {
        return a / b;
    } catch (ArithmeticException e) {
        return -1;
    }
}
```

```
// javap -c:
public int divide(int, int);
    Code:
       0: iload_1
       1: iload_2
       2: idiv
       3: ireturn                    // normal return
       4: astore_3                   // exception handler starts here
       5: iconst_m1
       6: ireturn
    Exception table:
       from    to  target  type
         0     3     4     Class java/lang/ArithmeticException

// The Exception table is the key:
// - "from" and "to" define the try range (bytecode offsets 0-3)
// - "target" is the catch handler entry point (offset 4)
// - "type" is the exception class to catch
// - If an exception occurs in [from, to) and matches type → jump to target
// - If no match → propagate to caller (unwind the stack frame)

// CRITICAL INSIGHT: try blocks have ZERO runtime cost in the happy path!
// The exception table is metadata — it's NOT executed instruction-by-instruction
// The JVM only consults it WHEN an exception occurs
// This means try-catch around non-throwing code is FREE
```

### Multi-catch Bytecode

```java
try {
    riskyOperation();
} catch (IOException | SQLException e) {
    handle(e);
}
```

```
// javap -c shows TWO entries in exception table, same handler:
Exception table:
   from    to  target  type
     0     5     8     Class java/io/IOException
     0     5     8     Class java/sql/SQLException

// Both exception types jump to the same handler (offset 8)
// The variable 'e' is typed as their common supertype (Exception)
// but the compiler checks that both are effectively final in the catch block
```

### try-with-resources Desugaring — What the Compiler Generates

```java
// What you write:
try (BufferedReader br = new BufferedReader(new FileReader("file.txt"))) {
    return br.readLine();
}
```

```java
// What the compiler generates (simplified):
BufferedReader br = new BufferedReader(new FileReader("file.txt"));
Throwable primaryException = null;
try {
    return br.readLine();
} catch (Throwable t) {
    primaryException = t;
    throw t;
} finally {
    if (br != null) {
        if (primaryException != null) {
            try {
                br.close();
            } catch (Throwable suppressed) {
                primaryException.addSuppressed(suppressed);
            }
        } else {
            br.close();  // if close throws here, it propagates normally
        }
    }
}

// The suppressed exception mechanism:
// If readLine() throws IOException AND close() throws IOException:
// - The readLine() exception is the PRIMARY exception (what you catch)
// - The close() exception is SUPPRESSED (attached to primary)
// - Access via: primaryException.getSuppressed()
// - Without this, the close() exception would REPLACE the real error
//   (Java 6 behavior — the original bug was lost)
```

### The Cost of Throwing Exceptions — Stack Trace is Expensive

```java
// Creating an exception = filling the stack trace
// This is the expensive part (not the throw/catch mechanism)

// Benchmark (JMH):
// throw new Exception():                        ~5,000 ns
// throw new Exception() with 100-frame stack:   ~50,000 ns
// new Exception() without throw:                ~5,000 ns (same — construction is the cost)
// throw pre-created exception:                  ~100 ns (no stack trace fill)

// Stack trace filling calls Throwable.fillInStackTrace():
// - Walks the entire thread stack (native code)
// - Creates StackTraceElement[] array
// - Each element has: class name, method name, file name, line number
// - Deep stacks = proportionally more expensive

// OPTIMIZATION: Skip stack trace for control flow exceptions:
public class ControlFlowException extends RuntimeException {
    // Skip stack trace — this exception is used for flow control, not error reporting
    @Override
    public synchronized Throwable fillInStackTrace() {
        return this;  // no-op — saves the expensive native call
    }

    // Even better: static singleton (zero allocation on throw)
    public static final ControlFlowException INSTANCE = new ControlFlowException();
}

// Used by: Spring's FlowExecutionException, Scala's NonLocalReturnControl
// WARNING: only do this for non-diagnostic exceptions
```

### Checked vs Unchecked — The JVM Doesn't Care

```
// This is a COMPILER-ONLY distinction:
// The JVM has no concept of checked vs unchecked exceptions
// At the bytecode level, any Throwable can be thrown from any method

// Proof — sneaky throw (abusing type erasure):
@SuppressWarnings("unchecked")
static <T extends Throwable> void sneakyThrow(Throwable t) throws T {
    throw (T) t;  // T is erased to Throwable — cast is a no-op
}

// Usage:
sneakyThrow(new IOException("boom"));
// Throws IOException without declaring it!
// Compiles because T is inferred as RuntimeException from the call site
// At runtime, throws IOException (the JVM doesn't check declarations)

// Lombok's @SneakyThrows does exactly this
// Kotlin doesn't have checked exceptions — same principle
```

---

## 15. Pattern Matching — The Modern Java Revolution (Java 16-21+)

Pattern matching is arguably the most significant evolution of the Java language since generics. It transforms how you decompose data, replacing chains of `instanceof` checks and casts with declarative patterns that the compiler can verify for exhaustiveness. Combined with sealed classes and records, pattern matching gives Java something it has never had before: a type-safe, compiler-verified way to handle all the variants of a data type without boilerplate and without the risk of missing a case.

The evolution happened gradually: `instanceof` patterns in Java 16, switch patterns in Java 21, record patterns in Java 21, and unnamed patterns in Java 22. Each step built on the previous one, and the culmination — nested record patterns in sealed switch expressions with guarded `when` clauses — gives Java an expressiveness that rivals functional languages like Scala, Kotlin, and Haskell, while maintaining Java's commitment to type safety and backward compatibility.

At the bytecode level, pattern matching is mostly syntactic sugar — the compiler generates the same `instanceof` checks and `checkcast` instructions you would write manually. The real value is in the **compiler guarantees**: exhaustiveness checking for sealed types, flow-scoped variables that are provably non-null, and type narrowing that eliminates entire classes of `ClassCastException` bugs.

### instanceof Pattern Matching (Java 16)

```java
// Old way (cast after check):
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.length());
}

// New way (binding variable):
if (obj instanceof String s) {
    System.out.println(s.length());
    // 's' is in scope here — already cast, null-checked
}

// 's' is also in scope via flow analysis:
if (obj instanceof String s && s.length() > 5) {
    // s guaranteed non-null and length > 5
}

// But NOT with ||:
// if (obj instanceof String s || s.length() > 5)  // COMPILE ERROR
// 's' might not be bound if left side is false

// Negation pattern:
if (!(obj instanceof String s)) {
    return;  // early exit
}
// s is in scope here! (flow-scoping: compiler knows obj IS a String)
s.length();
```

```
// Bytecode of pattern matching instanceof:
// if (obj instanceof String s)

aload_1                           // load obj
instanceof String                 // type check → boolean
ifeq NOT_STRING                   // if false, jump
aload_1
checkcast String                  // guaranteed safe cast
astore_2                          // store as 's'
// ... use s ...
NOT_STRING:

// It's exactly the same bytecode as the old manual pattern!
// Pattern matching is ONLY syntactic sugar — zero runtime difference
```

### Switch Pattern Matching (Java 21)

```java
// Pattern matching in switch — the most powerful Java feature since generics:
String format(Object obj) {
    return switch (obj) {
        case Integer i    -> String.format("int %d", i);
        case Long l       -> String.format("long %d", l);
        case Double d     -> String.format("double %f", d);
        case String s     -> String.format("String %s", s);
        case int[] arr    -> String.format("int array of length %d", arr.length);
        case null         -> "null";
        default           -> obj.toString();
    };
}

// Guarded patterns with 'when' clause:
String classify(Object obj) {
    return switch (obj) {
        case Integer i when i < 0   -> "negative int";
        case Integer i when i == 0  -> "zero";
        case Integer i              -> "positive int";
        case String s when s.isEmpty() -> "empty string";
        case String s               -> "string: " + s;
        case null                   -> "null";
        default                     -> "other: " + obj;
    };
}

// Order matters! More specific patterns must come first:
// case Integer i        → matches ALL integers (must be AFTER guarded cases)
// case Integer i when i < 0 → matches only negative (must be BEFORE unguarded)
```

### Record Patterns in Switch (Java 21)

```java
sealed interface Shape permits Circle, Rectangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double width, double height) implements Shape {}

// Full deconstruction in switch:
double area(Shape shape) {
    return switch (shape) {
        case Circle(double r) -> Math.PI * r * r;
        case Rectangle(double w, double h) -> w * h;
    };
}

// Nested record patterns:
record Pair<T>(T first, T second) {}

String describe(Pair<Shape> pair) {
    return switch (pair) {
        case Pair(Circle(double r1), Circle(double r2))
            -> "two circles: " + r1 + ", " + r2;
        case Pair(Rectangle(double w, double h), Circle(double r))
            -> "rect " + w + "x" + h + " and circle " + r;
        case Pair(Shape s1, Shape s2)
            -> "shapes: " + s1 + " and " + s2;
    };
}
```

### Unnamed Patterns and Variables (Java 22)

```java
// When you don't need a binding variable:
switch (obj) {
    case Point(int x, _) -> "x=" + x;      // ignore y
    case Line(_, Point end) -> "ends at " + end;  // ignore start
}

// Unnamed variable in catch:
try {
    parse(input);
} catch (ParseException _) {   // don't need the exception object
    return defaultValue;
}

// Unnamed in enhanced for:
int count = 0;
for (var _ : collection) {     // don't need the element
    count++;
}
```

### Pattern Matching Exhaustiveness — Compiler Guarantees

```java
sealed interface Expr permits Literal, BinaryOp {}
record Literal(int value) implements Expr {}
sealed interface BinaryOp extends Expr permits Add, Mul {}
record Add(Expr left, Expr right) implements BinaryOp {}
record Mul(Expr left, Expr right) implements BinaryOp {}

// Compiler PROVES this is exhaustive (no default needed):
int eval(Expr expr) {
    return switch (expr) {
        case Literal(int v)     -> v;
        case Add(Expr l, Expr r) -> eval(l) + eval(r);
        case Mul(Expr l, Expr r) -> eval(l) * eval(r);
    };
}

// If you add a new subtype to the sealed hierarchy:
record Sub(Expr left, Expr right) implements BinaryOp {}
// Every switch over Expr/BinaryOp gets a COMPILE ERROR
// "the switch expression does not cover all possible input values"
// This is compile-time safety for your entire codebase
```

---

## 16. Inner Classes and the JVM — Synthetic Accessors and Memory Leaks

Inner classes are a source of some of the most insidious bugs in Java: memory leaks, unexpected `this` references, and security vulnerabilities caused by synthetic accessor methods. The root cause is that the JVM has no concept of inner classes — they're a compiler fiction. The compiler transforms every inner class into a top-level class with synthetic fields and methods to emulate the source-level semantics. Understanding this transformation is essential for avoiding memory leaks (especially in Android development and long-lived frameworks like Spring) and for understanding why lambdas were such a welcome replacement for many inner class use cases.

### Non-Static Inner Classes — The Hidden `this` Reference

```java
public class Outer {
    private int secret = 42;

    class Inner {
        int getSecret() {
            return secret;  // accesses Outer's private field
        }
    }
}
```

```
// javap -c -p Outer$Inner.class

class Outer$Inner {
    final Outer this$0;   // SYNTHETIC field — hidden reference to enclosing instance

    Outer$Inner(Outer outer) {   // constructor takes Outer as parameter
        this.this$0 = outer;
        super();
    }

    int getSecret() {
        aload_0
        getfield Outer$Inner.this$0     // load enclosing Outer
        invokestatic Outer.access$000   // call SYNTHETIC accessor method
        ireturn
    }
}

// javap -c -p Outer.class (the synthetic accessor):
static int access$000(Outer x0) {  // SYNTHETIC: generated by compiler
    aload_0
    getfield Outer.secret
    ireturn
}
```

**Three JVM realities about inner classes:**
1. The inner class holds a strong reference to the outer instance (`this$0`)
2. Private member access creates synthetic `access$NNN` methods on the outer class
3. These synthetic methods are package-private (any class in the package can call them via reflection)

### The Memory Leak — The Most Common Non-Static Inner Class Bug

```java
public class EventManager {
    private List<byte[]> hugeData = loadGigabytesOfData();

    // Non-static inner class — holds reference to EventManager
    class EventHandler implements Runnable {
        @Override
        public void run() {
            System.out.println("handling event");
            // Doesn't use hugeData at all!
        }
    }

    public Runnable createHandler() {
        return new EventHandler();
        // The returned Runnable secretly holds a reference to 'this'
        // which holds hugeData → gigabytes kept alive by a tiny handler
    }
}

// The fix — make it static:
static class EventHandler implements Runnable {
    @Override
    public void run() {
        System.out.println("handling event");
    }
}
// No this$0 field → no reference to EventManager → hugeData can be GC'd

// Classic real-world leak: Android Activities
// Non-static AsyncTask/Handler inner class holds Activity reference
// Activity can't be GC'd during config changes → OutOfMemoryError
```

### Anonymous Classes — What the Compiler Creates

```java
Runnable r = new Runnable() {
    @Override
    public void run() {
        System.out.println("anonymous");
    }
};
```

```
// Compiler generates: Outer$1.class

class Outer$1 implements Runnable {
    Outer$1() { super(); }    // if non-capturing, simple constructor

    public void run() {
        getstatic System.out
        ldc "anonymous"
        invokevirtual PrintStream.println
        return
    }
}

// Naming: $1, $2, $3... in order of appearance in the source file
// Each anonymous class = separate .class file = separate class loading
// 100 anonymous classes = 100 .class files = 100 class loading events

// Lambda avoids all of this:
Runnable r = () -> System.out.println("lambda");
// No extra .class file
// LambdaMetafactory generates the impl class at runtime
// One bootstrap per call site, then cached
```

### Static Nested Class vs Inner Class vs Local Class vs Anonymous Class

```
Type                 Has this$0?  Generated File    Class Count
───────────────────────────────────────────────────────────────
Static nested        No           Outer$Nested      One per definition
Non-static inner     Yes          Outer$Inner       One per definition
Local class          Yes*         Outer$1Local      One per definition
Anonymous class      Yes*         Outer$1           One per use site
Lambda               No**         None at compile   Generated at runtime

* Captures enclosing 'this' only if used
** Captures as individual fields, not the entire enclosing instance
```

---

## 17. Annotations Internals — Retention, Processing, and Runtime Mechanics

Annotations are metadata — data about data. They carry no behavior of their own; they are inert markers that other code (compilers, annotation processors, frameworks, or your own reflection-based logic) can read and act upon. Despite their simplicity, annotations are the backbone of modern Java frameworks: Spring's `@Autowired`, JPA's `@Entity`, Jackson's `@JsonProperty`, Lombok's `@Data` — all of them work by reading annotations at compile time or runtime and generating or modifying behavior accordingly.

Understanding the three retention policies is critical because they determine *when and where* your annotation is visible. A `SOURCE`-retention annotation exists only in source code and is available only to annotation processors running during compilation (this is how Lombok works). A `CLASS`-retention annotation is written to the `.class` file but not loaded by the JVM at runtime (used by static analysis tools). A `RUNTIME`-retention annotation is loaded into memory and accessible via reflection (used by Spring, JPA, and most runtime frameworks). Choosing the wrong retention policy is a common mistake that results in annotations that silently do nothing.

### Retention Policies — Where Annotations Live

```
@Retention(RetentionPolicy.SOURCE)
// Exists only in .java source
// Discarded by compiler — NOT in .class file
// Used for: @Override, @SuppressWarnings, Lombok annotations
// Annotation processors (javac plugins) can read these during compilation

@Retention(RetentionPolicy.CLASS)
// Written to .class file but NOT loaded by JVM at runtime
// Default retention if not specified
// Used for: static analysis tools that read .class files (SpotBugs, Error Prone)
// Cannot be accessed via reflection at runtime

@Retention(RetentionPolicy.RUNTIME)
// Written to .class file AND loaded by JVM into memory
// Accessible via reflection: clazz.getAnnotation(MyAnnotation.class)
// Used for: Spring (@Autowired), JPA (@Entity), Jackson (@JsonProperty)
// Performance cost: annotation instances created on every getAnnotation() call
//   (the JVM creates a dynamic proxy implementing the annotation interface)
```

### How Runtime Annotations Work Under the Hood

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Timed {
    String value() default "";
}

public class Service {
    @Timed("processOrder")
    public void process() { ... }
}
```

```
// In the .class file, annotations are stored in the RuntimeVisibleAnnotations attribute:
// javap -v Service.class:
RuntimeVisibleAnnotations:
  0: #15(#16=s#17)
      Timed(value="processOrder")

// At runtime, reflection creates a dynamic proxy:
Timed annotation = method.getAnnotation(Timed.class);
// annotation is a Proxy instance implementing Timed
// annotation.value() calls the proxy's invoke handler
// which reads from a Map<String, Object> of element values
```

### TYPE_USE Annotations (Java 8) — Annotate Any Type

```java
// Before Java 8: annotations could only go on declarations
// Java 8 added TYPE_USE — annotate types themselves:

@Target(ElementType.TYPE_USE)
@interface NonNull {}

@Target(ElementType.TYPE_USE)
@interface Nullable {}

// Now you can annotate:
@NonNull String name;                          // field type
List<@NonNull String> names;                   // type argument
String @NonNull [] array;                      // array type
Map<@NonNull String, @Nullable Integer> map;   // multiple type args
@NonNull String @Nullable [] names;            // array: non-null Strings, nullable array

// Method return and parameter types:
@NonNull String getName(@NonNull String id) { ... }

// Throws clause:
void process() throws @Critical IOException { ... }

// Cast:
String s = (@NonNull String) obj;

// instanceof:
if (obj instanceof @NonNull String s) { ... }

// Constructor:
new @Interned String("hello");

// These are used by: Checker Framework, NullAway, Error Prone
// They enable compile-time null-safety checking
```

### Repeatable Annotations (Java 8)

```java
@Repeatable(Schedules.class)  // container annotation
@Retention(RetentionPolicy.RUNTIME)
@interface Schedule {
    String dayOfWeek();
    String hour();
}

@Retention(RetentionPolicy.RUNTIME)
@interface Schedules {
    Schedule[] value();        // container must have value() returning array
}

// Usage:
@Schedule(dayOfWeek = "MON", hour = "09:00")
@Schedule(dayOfWeek = "FRI", hour = "15:00")
public void backup() { ... }

// Under the hood, the compiler wraps them:
@Schedules({
    @Schedule(dayOfWeek = "MON", hour = "09:00"),
    @Schedule(dayOfWeek = "FRI", hour = "15:00")
})
public void backup() { ... }

// Access:
method.getAnnotationsByType(Schedule.class);  // returns Schedule[2]
method.getAnnotation(Schedules.class);        // returns the container
```

### Annotation Processing at Compile Time

```
// Annotation processors run as javac plugins during compilation:
// javac -processor com.example.MyProcessor MyClass.java

// The processor API:
public class MyProcessor extends AbstractProcessor {
    @Override
    public Set<String> getSupportedAnnotationTypes() {
        return Set.of("com.example.GenerateBuilder");
    }

    @Override
    public boolean process(Set<? extends TypeElement> annotations,
                          RoundEnvironment roundEnv) {
        for (Element element : roundEnv.getElementsAnnotatedWith(GenerateBuilder.class)) {
            // Read the annotated class structure
            // Generate NEW source files (cannot modify existing!)
            JavaFileObject file = processingEnv.getFiler()
                .createSourceFile("com.example.MyClassBuilder");
            try (Writer writer = file.openWriter()) {
                writer.write(generateBuilderCode(element));
            }
        }
        return true;  // claim these annotations (no other processor handles them)
    }
}

// Used by: Lombok, MapStruct, Dagger, AutoValue, Immutables
// Lombok is special: it uses internal compiler APIs to MODIFY the AST
// (not standard — this is why Lombok needs special IDE plugins)
```

---

## 18. Reflection vs MethodHandles vs VarHandle — Performance Hierarchy

Reflection has been Java's escape hatch since 1.1 — the ability to inspect and invoke methods, read and write fields, and create objects by name at runtime. Frameworks like Spring, Hibernate, and Jackson are built on reflection. But reflection comes with a heavy performance tax: security checks on every call, boxing of primitive arguments into `Object[]`, and an inability for the JIT compiler to inline across reflection boundaries.

`MethodHandle` (Java 7) and `VarHandle` (Java 9) were designed as the high-performance alternative. A `MethodHandle` is a typed, directly-executable reference to a method, constructor, or field. Unlike reflection, method handles are JIT-friendly: when stored in a `static final` field, the JIT compiler can constant-fold and inline them exactly like a direct method call. `VarHandle` extends the same principle to field access, providing atomic operations (CAS, get-and-add) without the unsafe and unsupported `sun.misc.Unsafe`.

Since Java 18 (JEP 416), the JVM's reflection implementation itself is built on method handles internally. This means traditional `Method.invoke()` is now faster than it was historically, but direct `MethodHandle` usage is still the gold standard for performance-critical reflective operations.

### Traditional Reflection — The Slow Path

```java
// Reflection: flexible but slow
Method method = MyClass.class.getDeclaredMethod("compute", int.class);
method.setAccessible(true);
Object result = method.invoke(instance, 42);

// Why it's slow:
// 1. method.invoke() does:
//    a. Security check (every call unless setAccessible(true))
//    b. Argument validation (correct count, correct types)
//    c. Boxing: primitive 42 → Integer.valueOf(42)
//    d. Varargs: args packed into Object[]
//    e. First 15 calls: native JNI call (very slow)
//    f. After 15 calls: JVM generates bytecode accessor (faster)
//    g. Unboxing the return value
// 2. JIT compiler cannot inline through method.invoke()
//    → no constant folding, no dead code elimination, no escape analysis
```

### MethodHandle — The Fast Path (Java 7+)

```java
MethodHandles.Lookup lookup = MethodHandles.lookup();
MethodHandle mh = lookup.findVirtual(MyClass.class, "compute",
    MethodType.methodType(int.class, int.class));

// Direct invocation — no boxing, no varargs:
int result = (int) mh.invokeExact(instance, 42);

// Why it's fast:
// 1. Type checking done at lookup time (not per call)
// 2. No boxing/unboxing for primitives
// 3. No Object[] varargs allocation
// 4. JIT can inline MethodHandle.invokeExact() like a regular call
// 5. If stored in static final field, JIT constant-folds the entire chain

// Even faster with static final:
private static final MethodHandle MH_COMPUTE;
static {
    try {
        MH_COMPUTE = MethodHandles.lookup().findVirtual(
            MyClass.class, "compute", MethodType.methodType(int.class, int.class));
    } catch (ReflectiveOperationException e) {
        throw new ExceptionInInitializerError(e);
    }
}
// JIT sees this as constant → can inline and optimize like a direct call
```

### JEP 416 — Reflection Now Uses MethodHandles (Java 18+)

```
// Before Java 18: three reflection paths
// 1. Native JNI (first 15 calls)
// 2. Generated bytecode accessor (after 15 calls)
// 3. MethodHandle (if you used it explicitly)

// After Java 18: unified on MethodHandles
// Method.invoke() internally delegates to a MethodHandle
// Benefits:
// - Simpler JVM code (one path instead of three)
// - Better for Project Loom (fewer native frames on virtual threads)
// - Reflection performance approaches MethodHandle performance
// - Security checks still happen (unless setAccessible(true))
```

### VarHandle — Atomic Field Access Without Unsafe (Java 9+)

```java
// VarHandle replaces sun.misc.Unsafe for atomic field operations:

public class Counter {
    private volatile int count;

    private static final VarHandle COUNT;
    static {
        try {
            COUNT = MethodHandles.lookup().findVarHandle(
                Counter.class, "count", int.class);
        } catch (ReflectiveOperationException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    public int increment() {
        return (int) COUNT.getAndAdd(this, 1);
    }

    public boolean compareAndSet(int expected, int newValue) {
        return COUNT.compareAndSet(this, expected, newValue);
    }

    public int getOpaque() {
        return (int) COUNT.getOpaque(this);  // opaque access (weaker than volatile)
    }
}

// VarHandle access modes (memory ordering):
// Plain:      get(), set()         — no ordering guarantees (like non-volatile)
// Opaque:     getOpaque()          — no reordering of same-variable accesses
// Acquire:    getAcquire()         — loads before this can't be reordered after
// Release:    setRelease()         — stores after this can't be reordered before
// Volatile:   getVolatile()        — full volatile semantics (acquire + release)
// CAS:        compareAndSet()      — atomic read-modify-write with volatile semantics
```

### Performance Comparison (JMH Benchmarks)

```
Operation                              Throughput (ops/μs)
──────────────────────────────────────────────────────────
Direct method call:                    ~2000
MethodHandle.invokeExact (static):     ~2000  (same as direct!)
MethodHandle.invokeExact (non-static): ~800
Method.invoke (setAccessible):         ~150
Method.invoke (with security check):   ~50
VarHandle.getVolatile:                 ~1500
Unsafe.getIntVolatile:                 ~1500  (same as VarHandle)
Field.getInt (reflection):             ~100

Takeaway:
- Static final MethodHandle = direct call performance
- VarHandle = Unsafe performance (but safe and supported)
- Reflection is 10-40x slower than direct/MethodHandle
```

---

## 19. Memory Layout and Object Headers — What Objects Really Look Like

Every Java object you create carries invisible overhead. Before your first field, every object has a header — typically 12 bytes on a 64-bit JVM with compressed oops. This header contains the mark word (used for locking, identity hash code, and GC age) and the klass pointer (a reference to the class metadata that enables method dispatch and type checking). For arrays, there's an additional 4 bytes for the length field.

This overhead matters more than you think. An `Integer` object wrapping a 4-byte `int` actually consumes 16 bytes (12 header + 4 data). A `Boolean` wrapping a 1-bit value consumes 16 bytes. An empty `Object` consumes 16 bytes. When you have millions of small objects — which is common in graph algorithms, caches, and financial applications — header overhead can consume 50-70% of your heap.

Understanding object layout is also the key to understanding lock performance (the mark word stores the lock state), GC behavior (the mark word stores the object age for generational collection), and false sharing (objects on the same cache line contend for CPU cache access). Tools like JOL (Java Object Layout) let you inspect the exact memory layout of any class, revealing padding, field reordering, and alignment gaps that the JVM inserts silently.

### Object Header Structure (64-bit HotSpot, Compressed Oops)

```
Every Java object in memory:

┌──────────────────────────────────────────────────────────┐
│  Mark Word (8 bytes)                                     │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Bits 0-24:  identity hashCode (25 bits)             │ │
│  │ Bits 25-28: GC age (4 bits, max 15 → promotion)    │ │
│  │ Bit 29:     unused                                  │ │
│  │ Bits 30-31: lock state (2 bits)                     │ │
│  │ Bits 32-63: thread ID / lock record / monitor ptr   │ │
│  └─────────────────────────────────────────────────────┘ │
│  Klass Pointer (4 bytes, compressed)                     │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Points to class metadata (method table, vtable)     │ │
│  └─────────────────────────────────────────────────────┘ │
│  ═══════════════════════════════════════════════════════  │
│  Instance fields (variable size)                         │
│  Padding (to align to 8-byte boundary)                   │
└──────────────────────────────────────────────────────────┘

Total header: 12 bytes (8 mark + 4 compressed klass)
Minimum object size: 16 bytes (12 header + 4 padding)
```

### Mark Word States — Lock Encoding

```
Lock State         Mark Word Content                    Bits [1:0]
──────────────────────────────────────────────────────────────────
Unlocked           [hashCode | age | 0 | 01]            01
Biased             [thread ID | epoch | age | 1 | 01]   01
Lightweight locked [ptr to lock record on stack | 00]    00
Heavyweight locked [ptr to ObjectMonitor | 10]           10
GC marked          [forwarding pointer | 11]             11

// Lock escalation:
// 1. Biased locking (JDK 15+ disabled by default):
//    First thread to lock an object writes its thread ID into mark word
//    Subsequent locks by SAME thread: just compare thread IDs (very fast)
//    If another thread tries to lock: revoke bias → lightweight

// 2. Lightweight locking (thin lock):
//    Thread copies mark word to its stack frame (displaced header)
//    CAS replaces mark word with pointer to stack frame
//    If CAS succeeds: locked (very fast, no OS kernel call)
//    If CAS fails: contention → inflate to heavyweight

// 3. Heavyweight locking (ObjectMonitor):
//    OS mutex — involves kernel context switch (~10μs)
//    Threads park (sleep) until notified
//    This is what you see in thread dumps as "waiting to lock"
```

### Compressed Oops and Compressed Class Pointers

```
// Without compression (64-bit JVM):
// Object references: 8 bytes each
// Klass pointer: 8 bytes
// Everything is 8 bytes → massive memory waste

// With compressed oops (default for heap < 32GB):
// Object references: 4 bytes (shifted left 3 bits to address 32GB)
// Klass pointer: 4 bytes (from compressed class space)
// -XX:+UseCompressedOops (enabled by default)
// -XX:+UseCompressedClassPointers (enabled by default)

// How compression works:
// JVM aligns all objects to 8-byte boundaries
// So the lowest 3 bits of any address are always 000
// Compressed ref = (real_address >> 3)  → fits in 32 bits
// Real address = (compressed_ref << 3)  → recovers 35-bit address space = 32GB

// Above 32GB heap: compression disabled, everything becomes 8 bytes
// This is why there's a "performance cliff" at 32GB heap size
// A 31GB heap can be more efficient than a 33GB heap!
```

### JEP 450: Compact Object Headers (Java 24 Experimental)

```
// Current header: 12 bytes (8 mark + 4 klass)
// Compact header:  8 bytes (mark word + klass merged)

// Enable: -XX:+UnlockExperimentalVMOptions -XX:+UseCompactObjectHeaders

// How it saves space:
// Mark word reduced from 64 to 32 bits
// Klass pointer encoded in remaining 32 bits
// Identity hashCode stored OUTSIDE the header (only when requested)
// Most objects never call System.identityHashCode() → no storage needed

// Impact: 10-20% heap reduction on real workloads
// Minimum object size drops from 16 to 8 bytes (empty objects)
```

### Field Layout and Padding — Using JOL

```java
// Use JOL (Java Object Layout) to see actual memory layout:
// Dependency: org.openjdk.jol:jol-core:0.17

import org.openjdk.jol.info.ClassLayout;

public class LayoutExample {
    boolean flag;    // 1 byte
    long timestamp;  // 8 bytes
    int count;       // 4 bytes
    char grade;      // 2 bytes
}

System.out.println(ClassLayout.parseClass(LayoutExample.class).toPrintable());
```

```
// Output (HotSpot, 64-bit, compressed oops):
LayoutExample object internals:
OFF  SZ      TYPE DESCRIPTION             VALUE
  0   8           (object header: mark)
  8   4           (object header: klass)
 12   4       int count                    ← 4 bytes
 16   8      long timestamp                ← 8 bytes (aligned to 8-byte boundary)
 24   2      char grade                    ← 2 bytes
 26   1   boolean flag                     ← 1 byte
 27   5           (alignment padding)      ← wasted space to reach 32 bytes
Instance size: 32 bytes

// Notice: the JVM REORDERED the fields!
// You wrote: boolean, long, int, char
// JVM stored: int, long, char, boolean
// Strategy: largest fields first → minimizes alignment padding
// @Contended annotation can force separate cache lines (prevent false sharing)
```

### Array Layout

```
// Arrays have an EXTRA header field:
┌──────────────────┐
│ Mark Word   8B   │
│ Klass Ptr   4B   │
│ Array Length 4B   │  ← extra 4 bytes for arrays
│ ═════════════════│
│ Element 0        │
│ Element 1        │
│ ...              │
│ Padding          │
└──────────────────┘

// int[10] array:
// Header: 16 bytes (8 mark + 4 klass + 4 length)
// Data: 40 bytes (10 × 4)
// Padding: 0 bytes (56 is 8-aligned)
// Total: 56 bytes

// Object[10] array:
// Header: 16 bytes
// Data: 40 bytes (10 × 4 compressed refs)
// Total: 56 bytes

// Empty Object (new Object()):
// Header: 12 bytes
// Padding: 4 bytes
// Total: 16 bytes ← MINIMUM object size
```

---

## 20. var and Local Variable Type Inference (Java 10+)

`var` was one of the most debated features in Java's history. Java had been the last major language without some form of type inference, and developers were writing declarations like `Map<String, List<Employee>> employees = new HashMap<String, List<Employee>>()` — where the type appears twice and adds noise without information. The `var` keyword tells the compiler: "you already know the type from the right-hand side; I don't need to repeat it."

The critical thing to understand is that `var` is **not dynamic typing**. Java remains statically typed. The compiler infers the exact type at compile time, and the bytecode is identical to what you'd get with an explicit type declaration. `var` is purely a source-code convenience. It does not change runtime behavior, does not affect performance, and does not make Java "like JavaScript." The variable's type is fixed at declaration and cannot change.

### What var Does (and Doesn't Do)

```java
// var is a RESERVED TYPE NAME, not a keyword
// It instructs the compiler to infer the type from the initializer

var list = new ArrayList<String>();    // inferred as ArrayList<String>
var stream = list.stream();            // inferred as Stream<String>
var map = Map.of("a", 1, "b", 2);     // inferred as Map<String, Integer>

// CRITICAL: var is compile-time only
// The bytecode is IDENTICAL to explicitly typing:
ArrayList<String> list = new ArrayList<>();
// and:
var list = new ArrayList<String>();
// produce the SAME bytecode — var is erased completely
```

```
// javap shows no difference:
// Both compile to:
new java/util/ArrayList
dup
invokespecial ArrayList.<init>:()V
astore_1
// The local variable table shows: list:Ljava/util/ArrayList;
// Type inference happened entirely at compile time
```

### Where var Is Allowed and Forbidden

```java
// ALLOWED:
var x = 42;                          // local variable
var name = "hello";                  // local variable
var list = List.of(1, 2, 3);        // local variable
for (var item : collection) { }     // enhanced for loop variable
for (var i = 0; i < 10; i++) { }   // traditional for loop variable
try (var is = new FileInputStream("f")) { }  // try-with-resources

// FORBIDDEN:
// var field = "hello";             // fields — NO
// var param = ...;                 // method parameters — NO
// public var getX() { }            // return types — NO
// var x;                           // no initializer — NO (what type?)
// var x = null;                    // null — NO (what type?)
// var x = { 1, 2, 3 };            // array initializer — NO
// var f = () -> 42;                // lambda — NO (which functional interface?)
// var m = String::length;          // method reference — NO (which type?)
```

### var in Lambda Parameters (Java 11)

```java
// Java 11 allows var in lambda parameters (for annotation support):
(@NonNull var x, @NonNull var y) -> x + y

// Without var, you can't annotate lambda params:
// (@NonNull x, @NonNull y) -> x + y  // syntax error
// (String x, String y) -> x + y      // works but verbose

// var in lambdas REQUIRES all-or-nothing:
// (var x, y) -> x + y                // ERROR: must be all var or none
// (var x, String y) -> x + y         // ERROR: can't mix var with explicit
```

### var and Generics — Type Inference Interactions

```java
// var with diamond: intersection of two inferences
var list = new ArrayList<>();              // ArrayList<Object> — diamond has no target type!
var list = new ArrayList<String>();         // ArrayList<String> — explicit type arg
var list = List.of("a", "b");              // List<String> — inferred from elements

// Subtle: var with ternary:
var x = condition ? "hello" : 42;          // Object — common supertype
var x = condition ? "hello" : "world";     // String — common type is String

// var with anonymous class (captures non-denotable type):
var obj = new Object() {
    int x = 10;
    String name = "hello";
};
obj.x = 20;        // WORKS — obj's type includes x and name
obj.name = "world"; // WORKS — you can't write this type explicitly!
// This is the only way to use anonymous class members without casting
```

---

## 21. Text Blocks — String Literal Deep Dive (Java 15)

Text blocks solve a problem that has annoyed Java developers since day one: embedding multi-line text (SQL queries, JSON templates, HTML fragments, regular expressions) in Java source code. Before text blocks, you had to concatenate string literals with `+`, manually insert `\n` for newlines, and escape every quote character. The result was unreadable and error-prone.

Text blocks use triple-quote delimiters (`"""`) to define a string that preserves line breaks and uses a smart indentation-stripping algorithm to remove the common leading whitespace. The position of the closing `"""` determines the left margin of the text. This means you can indent text blocks to match your code's structure without adding unwanted leading spaces to the string content.

### Indentation Stripping Algorithm

```java
String html = """
        <html>
            <body>
                <p>Hello</p>
            </body>
        </html>
        """;

// The compiler strips common leading whitespace:
// Step 1: Split into lines (including the closing """)
// Step 2: Find the minimum leading whitespace across all NON-BLANK lines
//         Including the closing """ line (which has 8 spaces)
// Step 3: Remove that many spaces from each line
// Step 4: Remove trailing whitespace from each line
// Step 5: Join with \n

// Result (no leading spaces, because closing """ defines the margin):
// "<html>\n    <body>\n        <p>Hello</p>\n    </body>\n</html>\n"
```

### Escape Sequences in Text Blocks

```java
// \s — space (prevents trailing whitespace stripping):
String columns = """
        Name   \s
        Age    \s
        Email  \s
        """;
// Each line ends with a visible space (not stripped)

// \ at end of line — line continuation (no newline inserted):
String singleLine = """
        This is a very long string that \
        we want on a single line in the \
        output but readable in source.""";
// Result: "This is a very long string that we want on a single line in the output but readable in source."

// String.formatted() for interpolation:
String json = """
        {
            "name": "%s",
            "age": %d
        }
        """.formatted(name, age);
```

---

## 22. Collections Internals — Advanced Data Structures

This section covers the concurrent and specialized collections that separate a senior Java developer from an expert. `ConcurrentHashMap` is not just "a thread-safe HashMap" — it's a completely different data structure with CAS-based empty-bucket insertion, per-bucket synchronization, lock-free reads, and cooperative resizing. `ArrayDeque` is not just "another List implementation" — it's a circular buffer that outperforms `LinkedList` in every queue and stack scenario by 3-5x due to cache locality. `PriorityQueue` is not a sorted list — it's a binary heap where only the minimum element is accessible in O(1), and everything else requires O(log n) extraction.

Understanding these implementations at the source level lets you choose the right data structure for your use case, predict performance under load, and avoid the common mistakes (like calling `ConcurrentHashMap.size()` in a tight loop, which aggregates distributed counters on every call).

### TreeMap — Red-Black Tree

```
TreeMap internal structure:
    Entry<K,V> root;    // root of red-black tree

    static class Entry<K,V> {
        K key;
        V value;
        Entry<K,V> left;
        Entry<K,V> right;
        Entry<K,V> parent;
        boolean color;     // RED or BLACK
    }

Red-black tree invariants:
    1. Every node is red or black
    2. Root is always black
    3. Every null leaf is black
    4. Red node's children must be black (no red-red)
    5. Every path from root to null has same number of black nodes

These ensure: tree height ≤ 2 * log2(n + 1)
All operations O(log n): get, put, remove, firstKey, lastKey, floorKey, ceilingKey

// When to use TreeMap over HashMap:
// 1. You need sorted iteration (by key)
// 2. You need range queries (subMap, headMap, tailMap)
// 3. You need floor/ceiling/higher/lower key lookups
// 4. Keys don't have a good hashCode but are Comparable

// When NOT to use:
// 1. You only need get/put — HashMap is O(1) vs TreeMap O(log n)
// 2. Keys are not Comparable and you can't provide a Comparator
```

### ConcurrentHashMap — Java 8+ Deep Internals

```
// Structure: Node<K,V>[] table (volatile)
// Each bucket is either:
//   - null (empty)
//   - Node (linked list head)
//   - TreeBin (red-black tree wrapper, when list > 8)
//   - ForwardingNode (during resize — indicates this bucket was moved)

// PUT operation:
// 1. hash = spread(key.hashCode())  — (h ^ (h >>> 16)) & 0x7fffffff
// 2. index = hash & (table.length - 1)
// 3. If bucket is null: CAS a new Node into the slot (lock-free!)
// 4. If bucket is not null: synchronized(firstNodeInBucket) {
//        traverse list/tree, insert or update
//    }
// 5. If list length > TREEIFY_THRESHOLD (8) AND table.length ≥ 64: treeify

// GET operation:
// Entirely LOCK-FREE — uses volatile reads only
// 1. Read table[index] (volatile read of Node[])
// 2. Traverse list/tree (Node.next is volatile)
// 3. Compare keys (hash first, then equals)
// No synchronization, no CAS — just reads

// RESIZE operation:
// 1. New table = 2x old table
// 2. Threads COOPERATIVELY transfer buckets (each thread takes a stripe)
// 3. ForwardingNode placed in old bucket → readers redirected to new table
// 4. Multiple threads can resize simultaneously

// SIZE operation:
// size() is NOT a simple counter (that would be a contention bottleneck)
// Uses CounterCell[] (like LongAdder) — each thread updates its own cell
// size() sums all cells — approximate during concurrent updates
```

```java
// ConcurrentHashMap-specific operations (not in Map interface):

// computeIfAbsent — atomic check-and-insert:
cache.computeIfAbsent(key, k -> expensiveCompute(k));
// Thread-safe: only ONE thread computes for a given key
// WARNING: the computing function runs while holding the bucket lock
//          DO NOT call other ConcurrentHashMap methods inside it (deadlock!)

// forEach with parallelism threshold:
map.forEach(1000, (key, value) -> process(key, value));
// If map.size() > 1000, uses ForkJoinPool for parallel iteration
// Threshold of 1: always parallel; Long.MAX_VALUE: always sequential

// search with parallelism:
String result = map.search(1000, (key, value) -> {
    if (value.matches(pattern)) return key;
    return null;  // null means "keep searching"
});

// reduce with parallelism:
int total = map.reduceValues(1000, v -> v.getCount(), Integer::sum);
```

### ArrayDeque — The Better Stack and Queue

```
// ArrayDeque: circular array-based double-ended queue
// Internal structure:
//     Object[] elements;  // power-of-2 size
//     int head;           // index of first element
//     int tail;           // index AFTER last element

// Circular buffer:
//     [_, _, _, C, D, E, F, _, _]
//              ^head       ^tail
//
// After addFirst(B):
//     [_, _, B, C, D, E, F, _, _]
//           ^head          ^tail
//
// After addLast(G):
//     [_, _, B, C, D, E, F, G, _]
//           ^head             ^tail
//
// Wrapping: when head reaches 0, it wraps to elements.length - 1
//     [H, _, _, _, _, _, F, G]
//        ^tail          ^head

// Performance vs LinkedList:
// ArrayDeque:  O(1) addFirst/addLast/pollFirst/pollLast, excellent cache locality
// LinkedList:  O(1) addFirst/addLast/pollFirst/pollLast, terrible cache locality
// ArrayDeque is 3-5x FASTER than LinkedList for queue/stack operations
// ArrayDeque uses LESS MEMORY (no Node objects, no prev/next pointers)

// Use ArrayDeque for: Stack (push/pop), Queue (offer/poll), Deque (both ends)
// Use LinkedList for: almost never (only if you need null elements or ListIterator)
```

### PriorityQueue — Binary Heap

```
// PriorityQueue: min-heap backed by Object[] array
// Internal structure:
//     Object[] queue;  // heap-ordered array
//     int size;

// Heap property: queue[n] <= queue[2*n+1] and queue[n] <= queue[2*n+2]
// Root (index 0) is always the MINIMUM element

// Binary heap in array form:
//              1              index 0
//            /   \
//           3     2           index 1, 2
//          / \   / \
//         7   4 5   6         index 3, 4, 5, 6

// Array: [1, 3, 2, 7, 4, 5, 6]
// Parent of index i: (i - 1) / 2
// Left child of i:   2 * i + 1
// Right child of i:  2 * i + 2

// Operations:
// offer(e):    O(log n) — add at end, sift UP (swap with parent until heap property restored)
// poll():      O(log n) — remove root, move last to root, sift DOWN
// peek():      O(1) — return queue[0]
// remove(e):   O(n) — linear search + sift
// contains(e): O(n) — linear search (NOT a sorted structure!)

// IMPORTANT: PriorityQueue does NOT provide sorted iteration!
// Heap order ≠ sorted order
// To iterate in sorted order: poll() repeatedly (destructive) or copy + sort
```

### IdentityHashMap — Reference Equality

```java
// Uses == instead of .equals() for key comparison
// Uses System.identityHashCode() instead of .hashCode()

IdentityHashMap<String, Integer> map = new IdentityHashMap<>();
String a = new String("hello");
String b = new String("hello");

map.put(a, 1);
map.put(b, 2);  // different key! a != b (different object)
map.size();      // 2 (not 1)

// Internal structure: FLAT array (linear probing, not chaining)
//     Object[] table;  // alternating key-value pairs
//     table = [key0, val0, key1, val1, key2, val2, ...]
//     Index: hash(System.identityHashCode(key)) & (table.length - 1)
//     Collision: linear probe (check next slot)

// Use cases:
// 1. Topology-preserving object graph traversal (visited set)
// 2. Serialization frameworks (detecting circular references)
// 3. WeakReference-like caching where identity matters
// 4. Intern-style deduplication
```

### WeakHashMap — GC-Aware Map

```java
// Keys are held via WeakReference — GC can collect them
WeakHashMap<Key, Value> cache = new WeakHashMap<>();
Key key = new Key("data");
cache.put(key, computeExpensive(key));

key = null;  // no strong reference to key
System.gc(); // key becomes eligible for GC
// On next cache access: entry is silently removed

// Internal: each Entry extends WeakReference<K>
// A ReferenceQueue receives notifications when keys are GC'd
// On every put/get/size call: expungeStaleEntries() clears dead entries

// Use cases:
// 1. Metadata caches: associate extra data with objects without preventing GC
// 2. ClassLoader-related caches: classes can be unloaded
// 3. Listener registries: listeners auto-deregister when their owner is GC'd

// GOTCHA: String literals are always strongly referenced (interned)
// WeakHashMap<String, ?> with literal keys → entries NEVER collected
```

---
---

# Master Reference — Production-Grade Cheat Sheets

## Bytecode Instruction Quick Reference

```
Category        Instruction               What It Means
──────────────────────────────────────────────────────────────────────
Loading         aload_N                   Load reference from local var N
                iload_N                   Load int from local var N
                ldc "string"              Load constant from pool
                getstatic                 Load static field

Storing         astore_N                  Store reference to local var N
                istore_N                  Store int to local var N
                putfield                  Set instance field
                putstatic                 Set static field

Invoke          invokevirtual             Call instance method (dispatch on type)
                invokeinterface           Call interface method
                invokespecial             Call constructor / super / private method
                invokestatic              Call static method
                invokedynamic             Lambda / string concat / bootstrap

Type            checkcast                 Cast (ClassCastException if wrong)
                instanceof               Type check → boolean

Object          new                       Allocate (uninitialized) object
                dup                       Duplicate top of stack
                athrow                    Throw exception

Array           newarray                  Create primitive array
                anewarray                 Create reference array
                arraylength               Get array length

Monitor         monitorenter              Acquire lock (synchronized block entry)
                monitorexit               Release lock (synchronized block exit)

Switch          tableswitch               Dense switch (O(1) jump table)
                lookupswitch              Sparse switch (O(log n) binary search)
```

## The "What Does javap Show Me?" Decision Tree

```
When you see...         It means...
──────────────────────────────────────────────────────────────
invokedynamic           Lambda, method reference, or string concat (Java 9+)
LambdaMetafactory       Lambda creation bootstrap
StringConcatFactory     String + operator (Java 9+)
checkcast               Generic type cast (type erasure) or explicit cast
monitorenter/exit       synchronized block
tableswitch             Dense switch/case
lookupswitch            Sparse switch/case
aconst_null             null literal
dup                     Chained constructor call (new + dup + init)
bridge method           Generic subclass polymorphism fix
access$NNN              Inner class accessing outer's private member
$VALUES                 Enum's values() backing array
```

## Production Debugging Quick Guide

```bash
# See what any class compiles to:
javac MyClass.java && javap -c -p MyClass.class

# See EVERYTHING (constant pool, line numbers, locals):
javap -v -p MyClass.class

# See lambda implementation methods:
javap -c -p MyClass.class | grep -A 20 "lambda\$"

# See bridge methods:
javap -c -p MyClass.class | grep -B 2 "bridge"

# See string concat strategy:
javap -c MyClass.class | grep "StringConcatFactory"

# Verify record implementations:
javap -c -p MyRecord.class | grep "ObjectMethods"

# Check synchronized implementation:
javap -c MyClass.class | grep "monitor"

# Inspect class at runtime:
jcmd <pid> VM.classloaders                    # class loader hierarchy
jcmd <pid> GC.class_histogram                 # count instances by class
jcmd <pid> Compiler.queue                     # JIT compilation queue
jcmd <pid> VM.flags -all                      # all JVM flags
```

---

## Comprehensive Resource List — From Senior to God-Tier

### Tier 1: Foundation (Must Read/Watch)

| Resource | Type | What It Teaches |
|----------|------|-----------------|
| **Effective Java** — Joshua Bloch (3rd Ed) | Book | How to think about API design, immutability, equals/hashCode, builders, enums |
| **Java Concurrency in Practice** — Brian Goetz | Book | Every concurrency bug you'll ever face, and how to prevent them |
| **Venkat Subramaniam — Java Streams** | Video | Lazy evaluation, pipeline fusion, parallel stream dangers |
| **JVM Anatomy Quarks** — Aleksey Shipilev | Essays | Object layout, GC pauses, lock internals, false sharing |
| **Java Language Specification** (JLS) | Spec | The DEFINITIVE answer to "what does this code actually mean?" |

### Tier 2: Deep Expertise (Should Read)

| Resource | Type | What It Teaches |
|----------|------|-----------------|
| **Java Generics and Collections** — Naftalin & Wadler | Book | Type erasure, PECS, wildcards at a level no tutorial covers |
| **Java Performance** — Scott Oaks (2nd Ed) | Book | GC tuning, JIT internals, CPU profiling, allocation rate |
| **Understanding the JVM** — Zhou Zhiming | Book | Heap layout, stack frames, class loading, JIT compilation |
| **High-Performance Java Persistence** — Vlad Mihalcea | Book | JDBC internals, connection pools, transaction isolation, batch operations |
| **Aleksey Shipilev — JMM Talk** | Video | volatile, happens-before, instruction reordering, CPU cache |

### Tier 3: God-Tier (Elite Resources)

| Resource | Type | What It Teaches |
|----------|------|-----------------|
| **Shipilev's Blog** — [shipilev.net](https://shipilev.net/) | Blog | JVM performance from someone who WRITES the JVM |
| **Doug Lea's concurrency page** | Archive | From the man who wrote java.util.concurrent |
| **HotSpot JVM source code** — [github.com/openjdk/jdk](https://github.com/openjdk/jdk) | Source | How the JVM ACTUALLY implements everything |
| **JOL (Java Object Layout)** — [github.com/openjdk/jol](https://github.com/openjdk/jol) | Tool | See exact memory layout of any object |
| **JMH (Java Microbenchmark Harness)** | Tool | The ONLY correct way to benchmark Java code |
| **JITWatch** — [github.com/AdoptOpenJDK/jitwatch](https://github.com/AdoptOpenJDK/jitwatch) | Tool | Visualize JIT compilation, inlining decisions, hot methods |
| **async-profiler** — [github.com/jvm-profiling-tools/async-profiler](https://github.com/jvm-profiling-tools/async-profiler) | Tool | Production-safe CPU/allocation/lock profiling with flame graphs |

### Tier 4: Living on the Bleeding Edge

| Resource | Type | What It Teaches |
|----------|------|-----------------|
| **Project Valhalla** — [openjdk.org/projects/valhalla](https://openjdk.org/projects/valhalla/) | Project | Value types, primitive classes, generic specialization |
| **Project Loom** — Virtual Threads (Java 21) | Feature | M:N threading, structured concurrency, continuation internals |
| **Project Panama** — Foreign Function & Memory API | Feature | Zero-overhead native interop, replacing JNI |
| **Inside the JVM** — [blogs.oracle.com](https://blogs.oracle.com/javamagazine/) | Blog | Oracle's official deep-dive articles |
| **Baeldung** — [baeldung.com](https://www.baeldung.com/) | Tutorials | Practical code-heavy deep dives on every Java topic |
| **Jenkov Tutorials** — [jenkov.com/tutorials](https://jenkov.com/tutorials/) | Tutorials | Concurrency, NIO, memory model — visual and thorough |

---

*After mastering this material: you don't just write Java — you understand the machine. You see the bytecode behind the syntax, the memory layout behind the objects, the lock states behind synchronized, and the pipeline stages behind streams. When production breaks at 3 AM, you know exactly where to look. That's not a developer. That's an engineer.*
