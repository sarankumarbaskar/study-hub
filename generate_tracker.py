import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, numbers
from openpyxl.utils import get_column_letter
from openpyxl.formatting.rule import CellIsRule, DataBarRule
from openpyxl.worksheet.datavalidation import DataValidation
from datetime import datetime, timedelta

wb = openpyxl.Workbook()

# ─── Color palette ───
C_BG       = "0A0E17"
C_DARK     = "111827"
C_CARD     = "1A2234"
C_BORDER   = "2D3748"
C_TEXT     = "E2E8F0"
C_MUTED    = "94A3B8"
C_ACCENT   = "60A5FA"
C_GREEN    = "34D399"
C_YELLOW   = "FBBF24"
C_ORANGE   = "FB923C"
C_RED      = "F87171"
C_PINK     = "F472B6"
C_PURPLE   = "A78BFA"
C_WHITE    = "FFFFFF"

FILL_HEADER    = PatternFill("solid", fgColor=C_ACCENT)
FILL_DARK      = PatternFill("solid", fgColor=C_DARK)
FILL_CARD      = PatternFill("solid", fgColor=C_CARD)
FILL_BG        = PatternFill("solid", fgColor=C_BG)
FILL_GREEN_BG  = PatternFill("solid", fgColor="1A3A2A")
FILL_YELLOW_BG = PatternFill("solid", fgColor="3A3520")
FILL_RED_BG    = PatternFill("solid", fgColor="3A1A1A")
FILL_EASY      = PatternFill("solid", fgColor="1A3A2A")
FILL_MEDIUM    = PatternFill("solid", fgColor="3A3520")
FILL_HARD      = PatternFill("solid", fgColor="3A1A1A")

FONT_HEADER = Font(name="Calibri", bold=True, size=11, color=C_WHITE)
FONT_TITLE  = Font(name="Calibri", bold=True, size=14, color=C_ACCENT)
FONT_SUB    = Font(name="Calibri", bold=True, size=12, color=C_TEXT)
FONT_BODY   = Font(name="Calibri", size=11, color=C_TEXT)
FONT_MUTED  = Font(name="Calibri", size=10, color=C_MUTED)
FONT_LINK   = Font(name="Calibri", size=11, color=C_ACCENT, underline="single")
FONT_GREEN  = Font(name="Calibri", bold=True, size=11, color=C_GREEN)
FONT_YELLOW = Font(name="Calibri", bold=True, size=11, color=C_YELLOW)
FONT_RED    = Font(name="Calibri", bold=True, size=11, color=C_RED)

THIN_BORDER = Border(
    left=Side(style="thin", color=C_BORDER),
    right=Side(style="thin", color=C_BORDER),
    top=Side(style="thin", color=C_BORDER),
    bottom=Side(style="thin", color=C_BORDER),
)
ALIGN_CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
ALIGN_LEFT   = Alignment(horizontal="left", vertical="center", wrap_text=True)

def style_header_row(ws, row, max_col):
    for c in range(1, max_col + 1):
        cell = ws.cell(row=row, column=c)
        cell.font = FONT_HEADER
        cell.fill = FILL_HEADER
        cell.alignment = ALIGN_CENTER
        cell.border = THIN_BORDER

def style_body_row(ws, row, max_col, alt=False):
    fill = FILL_CARD if alt else FILL_DARK
    for c in range(1, max_col + 1):
        cell = ws.cell(row=row, column=c)
        cell.font = FONT_BODY
        cell.fill = fill
        cell.alignment = ALIGN_CENTER if c != 2 else ALIGN_LEFT
        cell.border = THIN_BORDER

def add_dropdown(ws, col_letter, min_row, max_row, options):
    dv = DataValidation(type="list", formula1=f'"{",".join(options)}"', allow_blank=True)
    dv.error = "Invalid value"
    dv.prompt = "Select from list"
    ws.add_data_validation(dv)
    dv.add(f"{col_letter}{min_row}:{col_letter}{max_row}")

PROBLEMS = [
    (1, "Two Sum", 1, "Easy", "Arrays & Hashing", "Very High", "Phase 1"),
    (2, "Group Anagrams", 49, "Medium", "Arrays & Hashing", "Very High", "Phase 1"),
    (3, "Product of Array Except Self", 238, "Medium", "Arrays & Hashing", "Very High", "Phase 1"),
    (4, "Longest Consecutive Sequence", 128, "Medium", "Arrays & Hashing", "High", "Phase 1"),
    (5, "Top K Frequent Elements", 347, "Medium", "Arrays & Hashing", "Very High", "Phase 1"),
    (135, "Rotate Image", 48, "Medium", "Arrays & Hashing", "Very High", "Phase 1"),
    (136, "Spiral Matrix", 54, "Medium", "Arrays & Hashing", "Very High", "Phase 1"),
    (6, "Container With Most Water", 11, "Medium", "Two Pointers", "Very High", "Phase 1"),
    (7, "3Sum", 15, "Medium", "Two Pointers", "Very High", "Phase 1"),
    (8, "Sort Colors", 75, "Medium", "Two Pointers", "High", "Phase 1"),
    (9, "Find the Duplicate Number", 287, "Medium", "Two Pointers", "High", "Phase 1"),
    (10, "Longest Palindromic Substring", 5, "Medium", "Two Pointers", "Very High", "Phase 1"),
    (11, "Longest Substring Without Repeating Characters", 3, "Medium", "Sliding Window", "Very High", "Phase 1"),
    (12, "Longest Repeating Character Replacement", 424, "Medium", "Sliding Window", "High", "Phase 1"),
    (13, "Permutation in String", 567, "Medium", "Sliding Window", "High", "Phase 1"),
    (14, "Find All Anagrams in a String", 438, "Medium", "Sliding Window", "High", "Phase 1"),
    (15, "Minimum Window Substring", 76, "Hard", "Sliding Window", "Very High", "Phase 1"),
    (16, "Fruit Into Baskets", 904, "Medium", "Sliding Window", "Medium", "Phase 1"),
    (17, "Max Consecutive Ones III", 1004, "Medium", "Sliding Window", "Medium", "Phase 1"),
    (18, "Subarray Product Less Than K", 713, "Medium", "Sliding Window", "Medium", "Phase 1"),
    (19, "Frequency of the Most Frequent Element", 1838, "Medium", "Sliding Window", "Medium", "Phase 1"),
    (20, "Sliding Window Maximum", 239, "Hard", "Sliding Window", "Very High", "Phase 1"),
    (137, "Best Time to Buy and Sell Stock", 121, "Easy", "Sliding Window", "Very High", "Phase 1"),
    (21, "Search in Rotated Sorted Array", 33, "Medium", "Binary Search", "Very High", "Phase 1"),
    (22, "Find Minimum in Rotated Sorted Array", 153, "Medium", "Binary Search", "High", "Phase 1"),
    (23, "Find Peak Element", 162, "Medium", "Binary Search", "High", "Phase 1"),
    (24, "Koko Eating Bananas", 875, "Medium", "Binary Search", "Very High", "Phase 1"),
    (25, "Capacity To Ship Packages Within D Days", 1011, "Medium", "Binary Search", "High", "Phase 1"),
    (26, "Min Days to Make m Bouquets", 1482, "Medium", "Binary Search", "Medium", "Phase 1"),
    (27, "Split Array Largest Sum", 410, "Hard", "Binary Search", "High", "Phase 1"),
    (28, "Find First and Last Position", 34, "Medium", "Binary Search", "Very High", "Phase 1"),
    (29, "Median of Two Sorted Arrays", 4, "Hard", "Binary Search", "Very High", "Phase 1"),
    (30, "Kth Smallest in Sorted Matrix", 378, "Medium", "Binary Search", "High", "Phase 1"),
    (31, "Single Number", 136, "Easy", "Bit Manipulation", "Very High", "Phase 1"),
    (32, "Number of 1 Bits", 191, "Easy", "Bit Manipulation", "High", "Phase 1"),
    (33, "Counting Bits", 338, "Easy", "Bit Manipulation", "Medium", "Phase 1"),
    (34, "Sum of Two Integers", 371, "Medium", "Bit Manipulation", "Medium", "Phase 1"),
    (35, "Daily Temperatures", 739, "Medium", "Stack", "Very High", "Phase 2"),
    (36, "Next Greater Element II", 503, "Medium", "Stack", "Medium", "Phase 2"),
    (37, "Decode String", 394, "Medium", "Stack", "High", "Phase 2"),
    (38, "Asteroid Collision", 735, "Medium", "Stack", "High", "Phase 2"),
    (39, "Remove K Digits", 402, "Medium", "Stack", "High", "Phase 2"),
    (40, "Largest Rectangle in Histogram", 84, "Hard", "Stack", "Very High", "Phase 2"),
    (41, "Trapping Rain Water", 42, "Hard", "Stack", "Very High", "Phase 2"),
    (42, "Sum of Subarray Minimums", 907, "Medium", "Stack", "Medium", "Phase 2"),
    (43, "Kth Largest Element in an Array", 215, "Medium", "Heap", "Very High", "Phase 2"),
    (44, "Top K Frequent Elements", 347, "Medium", "Heap", "Very High", "Phase 2"),
    (45, "K Closest Points to Origin", 973, "Medium", "Heap", "High", "Phase 2"),
    (46, "Find Median from Data Stream", 295, "Hard", "Heap", "Very High", "Phase 2"),
    (47, "Meeting Rooms II", 253, "Medium", "Heap", "Very High", "Phase 2"),
    (48, "Merge K Sorted Lists", 23, "Hard", "Heap", "Very High", "Phase 2"),
    (49, "Smallest Range Covering K Lists", 632, "Hard", "Heap", "Medium", "Phase 2"),
    (50, "Reverse Linked List", 206, "Easy", "Linked List", "Very High", "Phase 2"),
    (51, "Linked List Cycle", 141, "Easy", "Linked List", "Very High", "Phase 2"),
    (52, "Reorder List", 143, "Medium", "Linked List", "High", "Phase 2"),
    (53, "Remove Nth Node From End", 19, "Medium", "Linked List", "Very High", "Phase 2"),
    (54, "Copy List with Random Pointer", 138, "Medium", "Linked List", "High", "Phase 2"),
    (55, "Add Two Numbers", 2, "Medium", "Linked List", "Very High", "Phase 2"),
    (56, "Reverse Nodes in k-Group", 25, "Hard", "Linked List", "High", "Phase 2"),
    (57, "Merge Intervals", 56, "Medium", "Intervals", "Very High", "Phase 2"),
    (58, "Insert Interval", 57, "Medium", "Intervals", "High", "Phase 2"),
    (59, "Non-overlapping Intervals", 435, "Medium", "Intervals", "High", "Phase 2"),
    (60, "Meeting Rooms", 252, "Easy", "Intervals", "High", "Phase 2"),
    (61, "Binary Tree Level Order Traversal", 102, "Medium", "Trees", "Very High", "Phase 3"),
    (62, "Binary Tree Right Side View", 199, "Medium", "Trees", "Very High", "Phase 3"),
    (63, "Validate Binary Search Tree", 98, "Medium", "Trees", "Very High", "Phase 3"),
    (64, "Kth Smallest Element in a BST", 230, "Medium", "Trees", "High", "Phase 3"),
    (65, "Construct BT from Preorder & Inorder", 105, "Medium", "Trees", "High", "Phase 3"),
    (66, "Diameter of Binary Tree", 543, "Easy", "Trees", "Very High", "Phase 3"),
    (67, "Balanced Binary Tree", 110, "Easy", "Trees", "High", "Phase 3"),
    (68, "LCA of a BST", 235, "Medium", "Trees", "Very High", "Phase 3"),
    (69, "LCA of a Binary Tree", 236, "Medium", "Trees", "Very High", "Phase 3"),
    (70, "House Robber III", 337, "Medium", "Trees", "Medium", "Phase 3"),
    (71, "Binary Tree Maximum Path Sum", 124, "Hard", "Trees", "Very High", "Phase 3"),
    (72, "Serialize and Deserialize BT", 297, "Hard", "Trees", "Very High", "Phase 3"),
    (73, "All Nodes Distance K in BT", 863, "Medium", "Trees", "High", "Phase 3"),
    (74, "Find Duplicate Subtrees", 652, "Medium", "Trees", "Medium", "Phase 3"),
    (75, "Flatten BT to Linked List", 114, "Medium", "Trees", "High", "Phase 3"),
    (76, "Number of Islands", 200, "Medium", "Graphs", "Very High", "Phase 3"),
    (77, "Max Area of Island", 695, "Medium", "Graphs", "High", "Phase 3"),
    (78, "Rotting Oranges", 994, "Medium", "Graphs", "Very High", "Phase 3"),
    (79, "Pacific Atlantic Water Flow", 417, "Medium", "Graphs", "High", "Phase 3"),
    (80, "Course Schedule", 207, "Medium", "Graphs", "Very High", "Phase 3"),
    (81, "Course Schedule II", 210, "Medium", "Graphs", "Very High", "Phase 3"),
    (82, "Clone Graph", 133, "Medium", "Graphs", "High", "Phase 3"),
    (83, "Number of Provinces", 547, "Medium", "Graphs", "High", "Phase 3"),
    (84, "Redundant Connection", 684, "Medium", "Graphs", "Medium", "Phase 3"),
    (85, "Accounts Merge", 721, "Medium", "Graphs", "High", "Phase 3"),
    (86, "Network Delay Time", 743, "Medium", "Graphs", "High", "Phase 3"),
    (87, "Cheapest Flights Within K Stops", 787, "Medium", "Graphs", "High", "Phase 3"),
    (88, "Path With Minimum Effort", 1631, "Medium", "Graphs", "Medium", "Phase 3"),
    (89, "Word Ladder", 127, "Hard", "Graphs", "Very High", "Phase 3"),
    (90, "Graph Valid Tree", 261, "Medium", "Graphs", "High", "Phase 3"),
    (91, "Critical Connections", 1192, "Hard", "Graphs", "Medium", "Phase 3"),
    (92, "Min Cost to Connect All Points", 1584, "Medium", "Graphs", "Medium", "Phase 3"),
    (93, "Connected Components", 323, "Medium", "Graphs", "High", "Phase 3"),
    (94, "Find Eventual Safe States", 802, "Medium", "Graphs", "Medium", "Phase 3"),
    (95, "Alien Dictionary", 269, "Hard", "Graphs", "Very High", "Phase 3"),
    (96, "House Robber", 198, "Medium", "DP", "Very High", "Phase 4"),
    (97, "House Robber II", 213, "Medium", "DP", "High", "Phase 4"),
    (98, "Decode Ways", 91, "Medium", "DP", "Very High", "Phase 4"),
    (99, "Coin Change", 322, "Medium", "DP", "Very High", "Phase 4"),
    (100, "Coin Change II", 518, "Medium", "DP", "High", "Phase 4"),
    (101, "Partition Equal Subset Sum", 416, "Medium", "DP", "High", "Phase 4"),
    (102, "Target Sum", 494, "Medium", "DP", "High", "Phase 4"),
    (103, "Word Break", 139, "Medium", "DP", "Very High", "Phase 4"),
    (104, "Longest Common Subsequence", 1143, "Medium", "DP", "Very High", "Phase 4"),
    (105, "Edit Distance", 72, "Medium", "DP", "Very High", "Phase 4"),
    (106, "Longest Palindromic Subsequence", 516, "Medium", "DP", "Medium", "Phase 4"),
    (107, "Unique Paths", 62, "Medium", "DP", "Very High", "Phase 4"),
    (108, "Minimum Path Sum", 64, "Medium", "DP", "High", "Phase 4"),
    (109, "Maximal Square", 221, "Medium", "DP", "High", "Phase 4"),
    (110, "Longest Increasing Subsequence", 300, "Medium", "DP", "Very High", "Phase 4"),
    (111, "Russian Doll Envelopes", 354, "Hard", "DP", "Medium", "Phase 4"),
    (112, "Best Time to Buy Stock III", 123, "Hard", "DP", "High", "Phase 4"),
    (113, "Buy Stock with Cooldown", 309, "Medium", "DP", "High", "Phase 4"),
    (114, "Burst Balloons", 312, "Hard", "DP", "High", "Phase 4"),
    (115, "Different Ways to Add Parentheses", 241, "Medium", "DP", "Medium", "Phase 4"),
    (138, "Maximum Product Subarray", 152, "Medium", "DP", "Very High", "Phase 4"),
    (139, "Longest Increasing Path in Matrix", 329, "Hard", "DP", "Very High", "Phase 4"),
    (116, "Jump Game", 55, "Medium", "Greedy", "Very High", "Phase 4"),
    (117, "Jump Game II", 45, "Medium", "Greedy", "Very High", "Phase 4"),
    (118, "Gas Station", 134, "Medium", "Greedy", "High", "Phase 4"),
    (119, "Task Scheduler", 621, "Medium", "Greedy", "Very High", "Phase 4"),
    (140, "Maximum Subarray", 53, "Medium", "Greedy", "Very High", "Phase 4"),
    (120, "Combination Sum", 39, "Medium", "Backtracking", "Very High", "Phase 4"),
    (121, "Permutations", 46, "Medium", "Backtracking", "Very High", "Phase 4"),
    (122, "Generate Parentheses", 22, "Medium", "Backtracking", "Very High", "Phase 4"),
    (123, "Word Search", 79, "Medium", "Backtracking", "Very High", "Phase 4"),
    (124, "N-Queens", 51, "Hard", "Backtracking", "High", "Phase 4"),
    (141, "Subsets", 78, "Medium", "Backtracking", "Very High", "Phase 4"),
    (125, "LRU Cache", 146, "Medium", "Design", "Very High", "Phase 5"),
    (126, "LFU Cache", 460, "Hard", "Design", "High", "Phase 5"),
    (127, "Implement Trie", 208, "Medium", "Design", "Very High", "Phase 5"),
    (128, "Design Add and Search Words", 211, "Medium", "Design", "High", "Phase 5"),
    (129, "Time Based Key-Value Store", 981, "Medium", "Design", "High", "Phase 5"),
    (130, "Design HashMap", 706, "Easy", "Design", "High", "Phase 5"),
    (131, "Insert Delete GetRandom O(1)", 380, "Medium", "Design", "Very High", "Phase 5"),
    (132, "Snapshot Array", 1146, "Medium", "Design", "Medium", "Phase 5"),
    (133, "Stock Price Fluctuation", 2034, "Medium", "Design", "Medium", "Phase 5"),
    (134, "Design Search Autocomplete System", 642, "Hard", "Design", "High", "Phase 5"),
    (142, "Word Search II", 212, "Hard", "Design", "Very High", "Phase 5"),
]

# ═══════════════════════════════════════════════════════════════════════════
# SHEET 1: DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════
ws = wb.active
ws.title = "Dashboard"
ws.sheet_properties.tabColor = C_ACCENT

for col in range(1, 12):
    ws.column_dimensions[get_column_letter(col)].width = 16
ws.column_dimensions["A"].width = 22
ws.column_dimensions["B"].width = 14

ws.merge_cells("A1:K1")
ws["A1"] = "INTERVIEW PREPARATION TRACKER"
ws["A1"].font = Font(name="Calibri", bold=True, size=20, color=C_ACCENT)
ws["A1"].fill = FILL_BG
ws["A1"].alignment = Alignment(horizontal="center", vertical="center")

ws.merge_cells("A2:K2")
ws["A2"] = "5 YoE Java Backend @ Red Hat  |  Target: SDE-2 / Senior SWE  |  40+ LPA Tier-1 Companies"
ws["A2"].font = FONT_MUTED
ws["A2"].fill = FILL_BG
ws["A2"].alignment = Alignment(horizontal="center")

r = 4
ws.merge_cells(f"A{r}:B{r}")
ws[f"A{r}"] = "OVERVIEW"
ws[f"A{r}"].font = FONT_SUB
ws[f"A{r}"].fill = FILL_BG

r = 5
stats = [("Total Problems", 142), ("Easy", 11), ("Medium", 98), ("Hard", 33)]
for i, (label, val) in enumerate(stats):
    c = 1 + i * 2
    ws.cell(row=r, column=c, value=label).font = FONT_MUTED
    ws.cell(row=r, column=c).fill = FILL_CARD
    ws.cell(row=r, column=c).border = THIN_BORDER
    ws.cell(row=r, column=c + 1, value=val).font = FONT_GREEN
    ws.cell(row=r, column=c + 1).fill = FILL_CARD
    ws.cell(row=r, column=c + 1).border = THIN_BORDER
    ws.cell(row=r, column=c + 1).alignment = ALIGN_CENTER

r = 7
ws.merge_cells(f"A{r}:B{r}")
ws[f"A{r}"] = "TRACK ALLOCATION"
ws[f"A{r}"].font = FONT_SUB
ws[f"A{r}"].fill = FILL_BG

tracks = [("DSA", "30%", "~4.5h/wk"), ("Java & Backend", "25%", "~3.75h/wk"),
          ("System Design + DDIA", "25%", "~3.75h/wk"), ("Kafka & Redis", "10%", "~1.5h/wk"),
          ("Cloud & Platform", "10%", "~1.5h/wk")]
headers_t = ["Track", "Weight", "Hours/Week"]
for i, h in enumerate(headers_t):
    ws.cell(row=r+1, column=1+i, value=h).font = FONT_HEADER
    ws.cell(row=r+1, column=1+i).fill = FILL_HEADER
    ws.cell(row=r+1, column=1+i).border = THIN_BORDER
    ws.cell(row=r+1, column=1+i).alignment = ALIGN_CENTER
for j, (track, weight, hours) in enumerate(tracks):
    row = r + 2 + j
    for ci, val in enumerate([track, weight, hours], 1):
        cell = ws.cell(row=row, column=ci, value=val)
        cell.font = FONT_BODY
        cell.fill = FILL_CARD if j % 2 == 0 else FILL_DARK
        cell.border = THIN_BORDER
        cell.alignment = ALIGN_CENTER if ci > 1 else ALIGN_LEFT

r = 15
ws.merge_cells(f"A{r}:B{r}")
ws[f"A{r}"] = "PATTERN SUMMARY"
ws[f"A{r}"].font = FONT_SUB
ws[f"A{r}"].fill = FILL_BG

from collections import Counter
pattern_counts = Counter(p[4] for p in PROBLEMS)
patterns_list = ["Arrays & Hashing", "Two Pointers", "Sliding Window", "Binary Search",
                 "Bit Manipulation", "Stack", "Heap", "Linked List", "Intervals",
                 "Trees", "Graphs", "DP", "Greedy", "Backtracking", "Design"]
ps_headers = ["Pattern", "Count", "Solved", "% Done"]
for i, h in enumerate(ps_headers):
    ws.cell(row=r+1, column=1+i, value=h).font = FONT_HEADER
    ws.cell(row=r+1, column=1+i).fill = FILL_HEADER
    ws.cell(row=r+1, column=1+i).border = THIN_BORDER
    ws.cell(row=r+1, column=1+i).alignment = ALIGN_CENTER
for j, pat in enumerate(patterns_list):
    row = r + 2 + j
    ws.cell(row=row, column=1, value=pat).font = FONT_BODY
    ws.cell(row=row, column=1).fill = FILL_CARD if j % 2 == 0 else FILL_DARK
    ws.cell(row=row, column=1).border = THIN_BORDER
    ws.cell(row=row, column=2, value=pattern_counts.get(pat, 0)).font = FONT_BODY
    ws.cell(row=row, column=2).fill = FILL_CARD if j % 2 == 0 else FILL_DARK
    ws.cell(row=row, column=2).border = THIN_BORDER
    ws.cell(row=row, column=2).alignment = ALIGN_CENTER
    ws.cell(row=row, column=3, value=0).font = FONT_BODY
    ws.cell(row=row, column=3).fill = FILL_CARD if j % 2 == 0 else FILL_DARK
    ws.cell(row=row, column=3).border = THIN_BORDER
    ws.cell(row=row, column=3).alignment = ALIGN_CENTER
    ws.cell(row=row, column=4, value="0%").font = FONT_MUTED
    ws.cell(row=row, column=4).fill = FILL_CARD if j % 2 == 0 else FILL_DARK
    ws.cell(row=row, column=4).border = THIN_BORDER
    ws.cell(row=row, column=4).alignment = ALIGN_CENTER

# ═══════════════════════════════════════════════════════════════════════════
# SHEET 2: DSA PROBLEM TRACKER
# ═══════════════════════════════════════════════════════════════════════════
ws2 = wb.create_sheet("DSA Problems")
ws2.sheet_properties.tabColor = C_PINK

headers = ["#", "Problem", "LC#", "Difficulty", "Pattern", "Phase", "Frequency",
           "Status", "Date Attempted", "Date Solved", "Time (min)", "Approach",
           "Solved First Try?", "Confidence (1-5)", "Rev 1", "Rev 2", "Rev 3",
           "LeetCode URL", "Notes"]
widths = [5, 38, 6, 11, 18, 9, 12, 12, 14, 14, 11, 14, 14, 14, 12, 12, 12, 42, 30]

for i, (h, w) in enumerate(zip(headers, widths), 1):
    ws2.cell(row=1, column=i, value=h)
    ws2.column_dimensions[get_column_letter(i)].width = w
style_header_row(ws2, 1, len(headers))
ws2.freeze_panes = "A2"
ws2.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{len(PROBLEMS)+1}"

for idx, (num, name, lc, diff, pattern, freq, phase) in enumerate(PROBLEMS):
    r = idx + 2
    url = f"https://leetcode.com/problems/{name.lower().replace(' ', '-').replace('(', '').replace(')', '').replace(',', '')}/"
    ws2.cell(row=r, column=1, value=num)
    ws2.cell(row=r, column=2, value=name)
    ws2.cell(row=r, column=3, value=lc)
    ws2.cell(row=r, column=4, value=diff)
    ws2.cell(row=r, column=5, value=pattern)
    ws2.cell(row=r, column=6, value=phase)
    ws2.cell(row=r, column=7, value=freq)
    ws2.cell(row=r, column=18, value=url)
    ws2.cell(row=r, column=18).font = FONT_LINK
    style_body_row(ws2, r, len(headers), alt=(idx % 2 == 0))
    diff_cell = ws2.cell(row=r, column=4)
    if diff == "Easy":
        diff_cell.font = FONT_GREEN
    elif diff == "Medium":
        diff_cell.font = FONT_YELLOW
    else:
        diff_cell.font = FONT_RED

data_end = len(PROBLEMS) + 1
add_dropdown(ws2, "H", 2, data_end, ["Not Started", "Attempted", "Solved", "Revisit", "Mastered"])
add_dropdown(ws2, "L", 2, data_end, ["Brute Force", "Optimal", "Saw Solution", "Hint Used"])
add_dropdown(ws2, "M", 2, data_end, ["Yes", "No"])
add_dropdown(ws2, "N", 2, data_end, ["1", "2", "3", "4", "5"])

# ═══════════════════════════════════════════════════════════════════════════
# SHEET 3: DAILY LOG
# ═══════════════════════════════════════════════════════════════════════════
ws3 = wb.create_sheet("Daily Log")
ws3.sheet_properties.tabColor = C_GREEN

daily_headers = ["Date", "Day", "Track", "Activity", "Problem / Topic",
                 "Time (min)", "Outcome", "Key Learning", "Mood (1-5)", "Total Hours Today"]
daily_widths = [12, 10, 18, 22, 35, 11, 14, 40, 11, 14]

for i, (h, w) in enumerate(zip(daily_headers, daily_widths), 1):
    ws3.cell(row=1, column=i, value=h)
    ws3.column_dimensions[get_column_letter(i)].width = w
style_header_row(ws3, 1, len(daily_headers))
ws3.freeze_panes = "A2"

today = datetime.now().date()
for d in range(90):
    dt = today + timedelta(days=d)
    r = d + 2
    ws3.cell(row=r, column=1, value=dt.strftime("%Y-%m-%d"))
    ws3.cell(row=r, column=2, value=dt.strftime("%a"))
    style_body_row(ws3, r, len(daily_headers), alt=(d % 2 == 0))
    ws3.cell(row=r, column=1).number_format = "YYYY-MM-DD"
    if dt.strftime("%a") in ("Sat", "Sun"):
        ws3.cell(row=r, column=2).font = FONT_GREEN

add_dropdown(ws3, "C", 2, 91, ["DSA", "Java & Backend", "System Design", "DDIA", "Kafka", "Redis", "Docker", "K8s", "AWS", "CI/CD", "Blog Reading"])
add_dropdown(ws3, "D", 2, 91, ["New Problem", "Revision", "Pattern Study", "Book Reading", "Video Course", "System Design Practice", "Mock Interview", "Blog Reading", "Coding Practice"])
add_dropdown(ws3, "G", 2, 91, ["Solved", "Partial", "Failed", "Completed", "In Progress"])
add_dropdown(ws3, "I", 2, 91, ["1", "2", "3", "4", "5"])

# ═══════════════════════════════════════════════════════════════════════════
# SHEET 4: WEEKLY REVIEW
# ═══════════════════════════════════════════════════════════════════════════
ws4 = wb.create_sheet("Weekly Review")
ws4.sheet_properties.tabColor = C_PURPLE

week_headers = ["Week #", "Start Date", "End Date",
                "DSA Problems Solved", "DSA Review Problems", "DSA Hours",
                "Java/Backend Hours", "System Design Hours", "Kafka/Redis Hours", "Cloud Hours",
                "Total Hours", "Blogs Read",
                "Best Achievement", "Biggest Struggle", "Next Week Focus"]
week_widths = [8, 12, 12, 18, 18, 11, 16, 16, 14, 12, 12, 11, 30, 30, 30]

for i, (h, w) in enumerate(zip(week_headers, week_widths), 1):
    ws4.cell(row=1, column=i, value=h)
    ws4.column_dimensions[get_column_letter(i)].width = w
style_header_row(ws4, 1, len(week_headers))
ws4.freeze_panes = "A2"

for w in range(32):
    r = w + 2
    ws4.cell(row=r, column=1, value=w + 1)
    start = today + timedelta(weeks=w)
    end = start + timedelta(days=6)
    ws4.cell(row=r, column=2, value=start.strftime("%Y-%m-%d"))
    ws4.cell(row=r, column=3, value=end.strftime("%Y-%m-%d"))
    style_body_row(ws4, r, len(week_headers), alt=(w % 2 == 0))

# ═══════════════════════════════════════════════════════════════════════════
# SHEET 5: REVISION TRACKER
# ═══════════════════════════════════════════════════════════════════════════
ws5 = wb.create_sheet("Revision Tracker")
ws5.sheet_properties.tabColor = C_YELLOW

rev_headers = ["#", "Problem", "Pattern", "Date Solved",
               "Day 1 Rev", "Day 3 Rev", "Day 7 Rev", "Day 14 Rev", "Day 30 Rev",
               "Times Forgotten", "Mastered?"]
rev_widths = [5, 38, 18, 13, 12, 12, 12, 12, 12, 14, 12]

for i, (h, w) in enumerate(zip(rev_headers, rev_widths), 1):
    ws5.cell(row=1, column=i, value=h)
    ws5.column_dimensions[get_column_letter(i)].width = w
style_header_row(ws5, 1, len(rev_headers))
ws5.freeze_panes = "A2"

for idx, (num, name, lc, diff, pattern, freq, phase) in enumerate(PROBLEMS):
    r = idx + 2
    ws5.cell(row=r, column=1, value=num)
    ws5.cell(row=r, column=2, value=name)
    ws5.cell(row=r, column=3, value=pattern)
    ws5.cell(row=r, column=10, value=0)
    style_body_row(ws5, r, len(rev_headers), alt=(idx % 2 == 0))

rev_end = len(PROBLEMS) + 1
add_dropdown(ws5, "K", 2, rev_end, ["Yes", "No"])

# ═══════════════════════════════════════════════════════════════════════════
# SHEET 6: MOCK INTERVIEWS
# ═══════════════════════════════════════════════════════════════════════════
ws6 = wb.create_sheet("Mock Interviews")
ws6.sheet_properties.tabColor = C_ORANGE

mock_headers = ["Date", "Type", "Platform", "Company Target",
                "Question 1", "Pattern", "Difficulty", "Solved?", "Time (min)",
                "Question 2", "Pattern", "Difficulty", "Solved?", "Time (min)",
                "Overall Score (1-10)", "Mistakes Made", "Lessons Learned"]
mock_widths = [12, 14, 14, 16, 30, 14, 11, 9, 10, 30, 14, 11, 9, 10, 16, 35, 35]

for i, (h, w) in enumerate(zip(mock_headers, mock_widths), 1):
    ws6.cell(row=1, column=i, value=h)
    ws6.column_dimensions[get_column_letter(i)].width = w
style_header_row(ws6, 1, len(mock_headers))
ws6.freeze_panes = "A2"

for r in range(2, 32):
    style_body_row(ws6, r, len(mock_headers), alt=(r % 2 == 0))

add_dropdown(ws6, "B", 2, 31, ["Timed Solo", "Peer Mock", "Platform Mock", "Company Prep"])
add_dropdown(ws6, "C", 2, 31, ["LeetCode", "Pramp", "Interviewing.io", "Peer", "Self"])

# ═══════════════════════════════════════════════════════════════════════════
# SHEET 7: BOOKS & RESOURCES
# ═══════════════════════════════════════════════════════════════════════════
ws7 = wb.create_sheet("Books & Resources")
ws7.sheet_properties.tabColor = C_ACCENT

books = [
    ("Effective Java", "Joshua Bloch", "Java & Backend", "Month 3", "90 items", ""),
    ("Head First Design Patterns", "Various", "Java & Backend", "Month 4", "14 chapters", ""),
    ("DDIA (Ch 1-9)", "Martin Kleppmann", "Distributed Systems", "Month 6", "9 chapters", ""),
    ("System Design Interview", "Alex Xu", "System Design", "Month 5", "16 chapters", ""),
    ("Docker Deep Dive", "Nigel Poulton", "Cloud/Platform", "Month 4", "20 chapters", ""),
    ("Spring Start Here", "Laurentiu Spilca", "Java & Backend", "Month 5", "14 chapters", ""),
    ("Spring Security in Action", "Laurentiu Spilca", "Java & Backend", "Month 6", "20 chapters", ""),
]
book_headers = ["Book", "Author", "Track", "Target Completion", "Total Units", "Completed Units",
                "% Done", "Current Chapter/Item", "Start Date", "Last Read Date", "Notes"]
book_widths = [32, 20, 18, 16, 14, 14, 10, 22, 12, 14, 30]

for i, (h, w) in enumerate(zip(book_headers, book_widths), 1):
    ws7.cell(row=1, column=i, value=h)
    ws7.column_dimensions[get_column_letter(i)].width = w
style_header_row(ws7, 1, len(book_headers))

for idx, (title, author, track, target, units, _) in enumerate(books):
    r = idx + 2
    ws7.cell(row=r, column=1, value=title)
    ws7.cell(row=r, column=2, value=author)
    ws7.cell(row=r, column=3, value=track)
    ws7.cell(row=r, column=4, value=target)
    ws7.cell(row=r, column=5, value=units)
    style_body_row(ws7, r, len(book_headers), alt=(idx % 2 == 0))

# ═══════════════════════════════════════════════════════════════════════════
# SHEET 8: APPLICATIONS
# ═══════════════════════════════════════════════════════════════════════════
ws8 = wb.create_sheet("Applications")
ws8.sheet_properties.tabColor = C_RED

app_headers = ["Company", "Role", "Level", "CTC Target", "Status",
               "Applied Date", "Referral?", "Recruiter Contact",
               "OA Date", "OA Result",
               "Round 1 Date", "Round 1 Type", "Round 1 Result",
               "Round 2 Date", "Round 2 Type", "Round 2 Result",
               "Round 3 Date", "Round 3 Type", "Round 3 Result",
               "Offer?", "CTC Offered", "Notes"]
app_widths = [16, 22, 8, 12, 14, 12, 10, 20, 12, 12, 12, 14, 12, 12, 14, 12, 12, 14, 12, 10, 12, 30]

for i, (h, w) in enumerate(zip(app_headers, app_widths), 1):
    ws8.cell(row=1, column=i, value=h)
    ws8.column_dimensions[get_column_letter(i)].width = w
style_header_row(ws8, 1, len(app_headers))
ws8.freeze_panes = "A2"

target_companies = ["Amazon", "Microsoft", "Google", "Uber", "Airbnb", "Atlassian",
                    "Stripe", "Databricks", "Rubrik", "Confluent", "Razorpay", "Flipkart",
                    "Swiggy", "PhonePe", "Zerodha", "Groww"]
for idx, company in enumerate(target_companies):
    r = idx + 2
    ws8.cell(row=r, column=1, value=company)
    ws8.cell(row=r, column=3, value="SDE-2")
    ws8.cell(row=r, column=4, value="40+ LPA")
    ws8.cell(row=r, column=5, value="Not Applied")
    style_body_row(ws8, r, len(app_headers), alt=(idx % 2 == 0))

add_dropdown(ws8, "E", 2, 20, ["Not Applied", "Applied", "OA Scheduled", "Interview", "Offer", "Rejected", "Withdrew"])

# ═══════════════════════════════════════════════════════════════════════════
# SAVE
# ═══════════════════════════════════════════════════════════════════════════
filepath = "/Users/sbaskar/Personal/Interview-Preparation-Tracker.xlsx"
wb.save(filepath)
print(f"Created: {filepath}")
print(f"Sheets: {wb.sheetnames}")
print(f"Problems: {len(PROBLEMS)}")
