# Trees — Pattern Guide

## When to Use
- Traversal problems (level order, inorder, preorder, postorder)
- BST property validation or search
- Tree construction from traversal sequences
- Path problems (diameter, max path sum, LCA)
- Serialization/deserialization

## Recognition Signals
- "Level order traversal" / "right side view" (BFS on tree)
- "Validate BST" / "Kth smallest in BST" (BST property)
- "Construct tree from preorder + inorder"
- "Diameter" / "maximum path sum" / "balanced tree" (bottom-up DFS)
- "Lowest common ancestor" (LCA)
- "Serialize and deserialize" / "flatten to linked list"

## Common Tricks
- BFS with queue for level-order; track level size for per-level processing
- Inorder traversal of BST gives sorted order — use for Kth smallest
- Recursive DFS returning height/value for bottom-up computation (diameter, max path sum)
- LCA of BST: exploit BST property (if both < node, go left; both > node, go right; else current is LCA)
- LCA of Binary Tree: post-order DFS — if left and right both return non-null, current node is LCA
- Tree serialization: BFS or preorder with null markers
- HashMap of inorder index for O(1) lookup during tree construction

## Time Complexity Expectations
| Approach | Time | Space |
|----------|------|-------|
| DFS traversal | O(n) | O(h) where h = height |
| BFS traversal | O(n) | O(w) where w = max width |
| BST search | O(h) | O(1) iterative, O(h) recursive |
| Tree construction | O(n) | O(n) |
| Serialization | O(n) | O(n) |

## Interview Tips
- Binary Tree Maximum Path Sum: the key insight is that at each node, you can either extend the path upward OR form a complete path through the node — track both
- Serialize/Deserialize is a design question in disguise — choose BFS or preorder and be consistent
- For LCA problems: always ask "is it a BST or general binary tree?" — solutions differ significantly
- Diameter of Binary Tree = max(leftHeight + rightHeight) across all nodes — classic post-order DFS
- "All Nodes Distance K": convert tree to graph (parent pointers), then BFS from target

## Common Mistakes
- Confusing BST LCA with general Binary Tree LCA (different algorithms)
- In max path sum: not clamping negative paths to zero (you can choose not to extend)
- Forgetting null checks in recursive calls
- In tree construction: using linear search for inorder index instead of HashMap
- Not handling single-child nodes correctly in serialization

## Problems in This Pattern
| # | Problem | LC# | Difficulty | Frequency |
|---|---------|-----|-----------|-----------|
| 1 | Binary Tree Level Order Traversal | 102 | Medium | Very High |
| 2 | Binary Tree Right Side View | 199 | Medium | Very High |
| 3 | Validate Binary Search Tree | 98 | Medium | Very High |
| 4 | Kth Smallest Element in a BST | 230 | Medium | High |
| 5 | Construct Binary Tree from Preorder and Inorder Traversal | 105 | Medium | High |
| 6 | Diameter of Binary Tree | 543 | Easy | Very High |
| 7 | Balanced Binary Tree | 110 | Easy | High |
| 8 | Lowest Common Ancestor of a BST | 235 | Medium | Very High |
| 9 | Lowest Common Ancestor of a Binary Tree | 236 | Medium | Very High |
| 10 | House Robber III | 337 | Medium | Medium |
| 11 | Binary Tree Maximum Path Sum | 124 | Hard | Very High |
| 12 | Serialize and Deserialize Binary Tree | 297 | Hard | Very High |
| 13 | All Nodes Distance K in Binary Tree | 863 | Medium | High |
| 14 | Find Duplicate Subtrees | 652 | Medium | Medium |
| 15 | Flatten Binary Tree to Linked List | 114 | Medium | High |
