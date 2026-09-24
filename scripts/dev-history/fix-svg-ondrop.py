from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "app" / "(main)" / "tools" / "image-to-svg" / "page.tsx"
content = path.read_text(encoding="utf-8")

old = """  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    setPreview(URL.createObjectURL(f));
  }, []);"""

new = """  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    // 立即更新 UI 状态（按钮可用）
    setFile(f);
    setResult(null);
    setError('');
    setPreview('');
    // 延迟生成预览，避免阻塞主线程
    setTimeout(() => {
      setPreview(URL.createObjectURL(f));
    }, 0);
  }, []);"""

if old in content:
    content = content.replace(old, new, 1)
    path.write_text(content, encoding="utf-8")
    print("  [修改] image-to-svg onDrop 异步生成预览")
else:
    print("  [警告] image-to-svg 未找到 onDrop 锚点")
