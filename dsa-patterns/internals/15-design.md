# Design — Pattern Guide

## When to Use
- Building data structures with specific time complexity guarantees
- Cache implementations (LRU, LFU)
- Trie-based string operations
- Combining multiple data structures for custom behavior
- System-level data structure design

## Recognition Signals
- "Design a data structure that supports..." with O(1) or O(log n) constraints
- "LRU Cache" / "LFU Cache" (eviction policies)
- "Implement Trie" / "prefix search" / "autocomplete"
- "Design HashMap" (from scratch)
- "Insert, Delete, GetRandom in O(1)"
- "Snapshot" / "version history"
- "Stock price" / "real-time data stream processing"

## Common Tricks
- LRU Cache: HashMap + Doubly Linked List — O(1) get and put with eviction
- LFU Cache: HashMap + frequency buckets (each bucket is a LinkedHashSet or DLL)
- Trie: TrieNode with children array/map + isEnd flag — supports prefix queries
- Design Add and Search Words: Trie with DFS for wildcard '.' matching
- Insert Delete GetRandom O(1): ArrayList + HashMap (element → index); swap with last for O(1) delete
- Snapshot Array: store only diffs per snap — TreeMap<snapId, value> per index
- Time-Based KV Store: HashMap<key, TreeMap<timestamp, value>> — floorKey for queries

## Time Complexity Expectations
| Data Structure | Get/Search | Insert/Put | Delete | Space |
|---------------|-----------|------------|--------|-------|
| LRU Cache | O(1) | O(1) | O(1) | O(capacity) |
| LFU Cache | O(1) | O(1) | O(1) | O(capacity) |
| Trie | O(L) | O(L) | O(L) | O(N × L) |
| HashMap (custom) | O(1) avg | O(1) avg | O(1) avg | O(n) |
| Insert/Delete/GetRandom | O(1) | O(1) | O(1) | O(n) |
| Snapshot Array | O(log S) | O(1) | — | O(S × n) |
| Time-Based KV | O(log T) | O(1) | — | O(n × T) |

## Interview Tips
- LRU Cache is the single most important design problem — code it perfectly in 15 minutes
- LFU Cache is harder but builds on LRU — understand the frequency bucket concept
- Trie: know when to use array (fixed alphabet) vs HashMap (dynamic alphabet) for children
- Design HashMap: discuss bucket sizing, hash function, collision handling (chaining vs open addressing)
- Insert Delete GetRandom: the swap-with-last trick for O(1) array deletion is a universal technique
- Autocomplete System: Trie + priority queue/sorting — discuss trade-offs of pre-computing vs on-demand ranking
- For all design problems: discuss trade-offs, edge cases, and how you'd extend the design

## Common Mistakes
- LRU Cache: not updating the position of a node on GET (it should move to most recent)
- LFU Cache: not handling the tie-breaking on frequency (evict least recently used among same frequency)
- Trie: not marking end-of-word nodes (search returns true for prefixes)
- HashMap: poor hash function leading to all collisions (mention load factor and rehashing)
- GetRandom: not maintaining the invariant after delete (index mapping must stay consistent)
- Snapshot Array: storing full copies instead of diffs (memory explosion)

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | LRU Cache | 146 | Medium | Very High |
| 2 | LFU Cache | 460 | Hard | High |
| 3 | Implement Trie (Prefix Tree) | 208 | Medium | Very High |
| 4 | Design Add and Search Words Data Structure | 211 | Medium | High |
| 5 | Time Based Key-Value Store | 981 | Medium | High |
| 6 | Design HashMap | 706 | Easy | High |
| 7 | Insert Delete GetRandom O(1) | 380 | Medium | Very High |
| 8 | Snapshot Array | 1146 | Medium | Medium |
| 9 | Stock Price Fluctuation | 2034 | Medium | Medium |
| 10 | Design Search Autocomplete System | 642 | Hard | High |
