from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "app" / "(main)" / "tools" / "image-to-svg" / "page.tsx"
content = path.read_text(encoding="utf-8")

# 修复 handleCancel：加状态重置
old_cancel = """  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };"""

new_cancel = """  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    pendingResultRef.current = null;
    setProgress(0);
    setShowProgress(false);
    setLoading(false);
  };"""

if old_cancel in content:
    content = content.replace(old_cancel, new_cancel, 1)
    print("  [修改] handleCancel 加状态重置")
else:
    print("  [警告] 未找到 handleCancel 锚点")

# 修复 handleConvert 开头：先重置再开始
old_start = """    // 启动伪进度
    setShowProgress(true);
    setProgress(0);
    setError('');
    pendingResultRef.current = null;
    const startTime = Date.now();"""

new_start = """    // 重置所有状态（防止上次残留）
    pendingResultRef.current = null;
    setProgress(0);
    setError('');
    // 让进度条重新挂载
    setShowProgress(false);
    await new Promise((r) => setTimeout(r, 50));
    setShowProgress(true);
    const startTime = Date.now();"""

if old_start in content:
    content = content.replace(old_start, new_start, 1)
    print("  [修改] handleConvert 开头重置状态")
else:
    print("  [警告] 未找到 handleConvert 开头锚点")

path.write_text(content, encoding="utf-8")
