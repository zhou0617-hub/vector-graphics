# -*- coding: utf-8 -*-
"""修正 04-开发过程-文件级别.md 中重复的 2026-09-24 附录"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILE = ROOT / "docs" / "04-开发过程-文件级别.md"

MARKER = "## 附录：2026-09-24 实际状态校准"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

first = content.find(MARKER)
if first == -1:
    print("未找到标记，无需修正")
    raise SystemExit(0)

second = content.find(MARKER, first + 1)
if second == -1:
    print("只有一段，无需修正")
    raise SystemExit(0)

before = content.rfind("---", 0, second)
cut = before if before != -1 else second

new_content = content[:cut].rstrip() + "\n"
with open(FILE, "w", encoding="utf-8", newline="\n") as f:
    f.write(new_content)

print(f"已删除重复附录")
print(f"  原文件 {len(content)} 字符")
print(f"  新文件 {len(new_content)} 字符")