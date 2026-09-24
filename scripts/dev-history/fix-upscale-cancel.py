from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "app" / "(main)" / "tools" / "image-upscale" / "page.tsx"
content = path.read_text(encoding="utf-8")

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

old_start = """    setShowProgress(true);
    setProgress(0);
    setError('');
    pendingResultRef.current = null;
    const startTime = Date.now();"""

new_start = """    pendingResultRef.current = null;
    setProgress(0);
    setError('');
    setShowProgress(false);
    await new Promise((r) => setTimeout(r, 50));
    setShowProgress(true);
    const startTime = Date.now();"""

if old_start in content:
    content = content.replace(old_start, new_start, 1)
    print("  [修改] handleUpscale 开头重置状态")
else:
    print("  [警告] 未找到 handleUpscale 开头锚点")

path.write_text(content, encoding="utf-8")
