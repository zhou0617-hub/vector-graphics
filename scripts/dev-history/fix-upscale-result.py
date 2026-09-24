from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "app" / "(main)" / "tools" / "image-upscale" / "page.tsx"
content = path.read_text(encoding="utf-8")

old = """      const res = await upscaleImage(file, mode, controller.signal);
      if (res.status === 'success' && res.originalUrl && res.resultUrl) {
        try {
          await Promise.all([preloadImage(assetUrl(res.originalUrl)), preloadImage(assetUrl(res.resultUrl))]);
        } catch (err) { console.warn('预加载失败', err); }
        pendingResultRef.current = res;
        setProgress(100);
      } else {"""

new = """      const res = await upscaleImage(file, mode, controller.signal);
      if (res.status === 'success' && res.originalUrl && res.resultUrl) {
        try {
          await Promise.all([preloadImage(assetUrl(res.originalUrl)), preloadImage(assetUrl(res.resultUrl))]);
        } catch (err) { console.warn('预加载失败', err); }
        setProgress(100);
        await new Promise((r) => setTimeout(r, 2200));
        setResult(res);
        setShowProgress(false);
        setLoading(false);
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
      } else {"""

if old in content:
    content = content.replace(old, new, 1)
    path.write_text(content, encoding="utf-8")
    print("  [修改] image-upscale - 用 setTimeout 替代 onRegatherComplete")
else:
    print("  [警告] image-upscale 未找到锚点")
