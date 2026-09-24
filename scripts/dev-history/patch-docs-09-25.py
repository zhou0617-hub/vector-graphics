# -*- coding: utf-8 -*-
"""批量修正文档硬错误（2026-09-25）"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"


def patch(fname, replacements):
    p = DOCS / fname
    if not p.exists():
        print(f"[SKIP] 文件不存在: {fname}")
        return
    content = p.read_text(encoding="utf-8")
    hits = 0
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            hits += 1
            print(f"  [OK] {old[:60]!r}")
        else:
            print(f"  [MISS] {old[:60]!r}")
    p.write_text(content, encoding="utf-8", newline="\n")
    print(f"{fname}: {hits}/{len(replacements)} 处命中\n")


# ---- 01 端口表加 8001 ----
patch("01-技术栈与环境.md", [
    (
        "| 3000 | Next.js 前端 |\n"
        "| 8000 | Python 矢量化 |\n"
        "| 8080 | Spring Boot 后端 |",
        "| 3000 | Next.js 前端 |\n"
        "| 8000 | vectorizer（图片转 SVG） |\n"
        "| 8001 | esrgan-service（图片超分） |\n"
        "| 8080 | Spring Boot 后端 |"
    ),
])

# ---- 02 删除"待实现" ----
patch("02-开发过程.md", [
    (
        "└─ 图片超分 → EsrganClient（待实现）→ esrgan-service（端口 8001）",
        "└─ 图片超分 → EsrganClient → esrgan-service（端口 8001）"
    ),
])

# ---- 03 问题 23 标题 ----
patch("03-问题排查.md", [
    (
        "### 问题 23：esrgan 引擎未启用 GPU（待修复）",
        "### 问题 23：esrgan 引擎未启用 GPU（已于 2026-09-25 修复，见文末附录）"
    ),
])

# ---- 10 头部 ----
patch("10-模块开发进度.md", [
    ("最后更新：2026-09-23", "最后更新：2026-09-25"),
    (
        "## 三、Real-ESRGAN 超分（部分完成）",
        "## 三、Real-ESRGAN 超分（已完成）"
    ),
])