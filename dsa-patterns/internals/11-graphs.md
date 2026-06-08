# Graphs — Pattern Guide

## When to Use
- Grid/matrix traversal (islands, rotten oranges)
- Connectivity and component detection
- Shortest path in weighted/unweighted graphs
- Cycle detection in directed/undirected graphs
- Topological ordering of dependencies

## Recognition Signals
- "Number of islands" / "connected components"
- "Course schedule" / "prerequisites" (topological sort)
- "Shortest path" / "minimum cost" / "network delay"
- "Clone graph" / "deep copy graph"
- "Union-Find" / "accounts merge" / "redundant connection"
- Grid with 0/1 values + "count regions" / "spread from source"
- "Alien dictionary" / "ordering based on constraints"

## Common Tricks
- BFS for shortest path in unweighted graphs (Rotting Oranges, Word Ladder)
- DFS for exploring all connected components (Number of Islands, Pacific Atlantic)
- Topological Sort (Kahn's BFS or DFS) for dependency ordering (Course Schedule)
- Union-Find for dynamic connectivity (Redundant Connection, Accounts Merge, Components)
- Dijkstra's for weighted shortest path (Network Delay Time, Path With Minimum Effort)
- Bellman-Ford / modified Dijkstra for K-stop constraints (Cheapest Flights)
- Tarjan's algorithm for bridges/articulation points (Critical Connections)
- Kruskal's / Prim's for MST (Min Cost to Connect All Points)
- Reverse graph edges for "eventual safe states" / "water flow" problems

## Time Complexity Expectations
| Approach | Time | Space |
|----------|------|-------|
| BFS/DFS on grid | O(m × n) | O(m × n) |
| BFS/DFS on adjacency list | O(V + E) | O(V + E) |
| Topological Sort | O(V + E) | O(V + E) |
| Union-Find (with rank + path compression) | O(α(n)) per operation ≈ O(1) | O(V) |
| Dijkstra's (min-heap) | O((V + E) log V) | O(V + E) |
| Bellman-Ford | O(V × E) | O(V) |
| Kruskal's MST | O(E log E) | O(V) |
| Tarjan's bridges | O(V + E) | O(V) |

## Interview Tips
- Number of Islands: start DFS/BFS from every unvisited '1', mark visited — this is the warm-up
- Course Schedule: classic topological sort — know both Kahn's (BFS with in-degree) and DFS cycle detection
- Alien Dictionary: topological sort on characters — build graph from adjacent word comparisons
- Union-Find: always implement with path compression + union by rank — interviewers expect it
- For "cheapest flights within K stops": modified Bellman-Ford (K+1 relaxations) or BFS with pruning
- Critical Connections uses Tarjan's bridge-finding — understand discovery time and low-link values
- "Find Eventual Safe States": reverse topological sort — nodes not in any cycle are safe

## Common Mistakes
- Forgetting to mark nodes as visited before adding to BFS queue (causes duplicate processing)
- In topological sort: not detecting cycles (check if all nodes were processed)
- Union-Find: forgetting path compression or union by rank (degrades to O(n))
- In Dijkstra's: revisiting already-finalized nodes (check if already in shortest path set)
- In grid problems: not checking array bounds before accessing neighbors
- Alien Dictionary: not handling the edge case where a longer word comes before its prefix (invalid ordering)
- Confusing directed vs undirected graph cycle detection (different algorithms)

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | Number of Islands | 200 | Medium | Very High |
| 2 | Max Area of Island | 695 | Medium | High |
| 3 | Rotting Oranges | 994 | Medium | Very High |
| 4 | Pacific Atlantic Water Flow | 417 | Medium | High |
| 5 | Course Schedule | 207 | Medium | Very High |
| 6 | Course Schedule II | 210 | Medium | Very High |
| 7 | Clone Graph | 133 | Medium | High |
| 8 | Number of Provinces | 547 | Medium | High |
| 9 | Redundant Connection | 684 | Medium | Medium |
| 10 | Accounts Merge | 721 | Medium | High |
| 11 | Network Delay Time | 743 | Medium | High |
| 12 | Cheapest Flights Within K Stops | 787 | Medium | High |
| 13 | Path With Minimum Effort | 1631 | Medium | Medium |
| 14 | Word Ladder | 127 | Hard | Very High |
| 15 | Graph Valid Tree | 261 | Medium | High |
| 16 | Critical Connections in a Network | 1192 | Hard | Medium |
| 17 | Min Cost to Connect All Points | 1584 | Medium | Medium |
| 18 | Number of Connected Components in an Undirected Graph | 323 | Medium | High |
| 19 | Find Eventual Safe States | 802 | Medium | Medium |
| 20 | Alien Dictionary | 269 | Hard | Very High |
