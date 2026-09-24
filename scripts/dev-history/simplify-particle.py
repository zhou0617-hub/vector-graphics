from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "components" / "particle-progress.tsx"
content = path.read_text(encoding="utf-8")

# 删除 onRegatherComplete 触发逻辑（保留接口兼容，但不再调用）
old = """          if (elapsed >= REGATHER_DURATION && !completed) {
            completed = true;
            onCompleteRef.current?.();
          }"""

new = """          // 重组完成由父组件的 setTimeout 处理，不在这里触发"""

if old in content:
    content = content.replace(old, new, 1)
    path.write_text(content, encoding="utf-8")
    print("  [修改] particle-progress - 移除 onRegatherComplete 触发")
else:
    print("  [警告] particle-progress 未找到锚点")
