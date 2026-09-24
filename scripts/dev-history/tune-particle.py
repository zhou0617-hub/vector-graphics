from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "components" / "particle-progress.tsx"
content = path.read_text(encoding="utf-8")

# 图片最大边长 260 → 420
content = content.replace("const MAX = 260;", "const MAX = 420;")

# 采样步长 7 → 5（粒子数约增加 2 倍）
content = content.replace("const step = 7;", "const step = 5;")

path.write_text(content, encoding="utf-8")
print("  [修改] particle-progress.tsx - MAX: 260→420, step: 7→5")
