from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "app" / "(main)" / "tools" / "image-to-svg" / "page.tsx"
content = path.read_text(encoding="utf-8")

old = """      const res = await convertImage(file, MODES[mode].params, controller.signal);
      if (res.status === 'success' && res.originalUrl && res.svgUrl) {
        // 先预加载两张图
        try {
          await Promise.all([preloadImage(assetUrl(res.originalUrl)), preloadImage(assetUrl(res.svgUrl))]);
        } catch (err) { console.warn('预加载失败', err); }
        // 保存结果，等粒子重组完成后显示
        pendingResultRef.current = res;
        // 进度到 100%，粒子开始重组
        setProgress(100);
      } else {"""

new = """      const res = await convertImage(file, MODES[mode].params, controller.signal);
      if (res.status === 'success' && res.originalUrl && res.svgUrl) {
        // 先预加载两张图
        try {
          await Promise.all([preloadImage(assetUrl(res.originalUrl)), preloadImage(assetUrl(res.svgUrl))]);
        } catch (err) { console.warn('预加载失败', err); }
        // 进度到 100%，粒子开始重组
        setProgress(100);
        // 等 2.2 秒（粒子重组 1.5s + 缓冲），然后直接显示结果
        await new Promise((r) => setTimeout(r, 2200));
        // 直接 setResult，不依赖 onRegatherComplete 回调
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
    print("  [修改] image-to-svg - 用 setTimeout 替代 onRegatherComplete")
else:
    print("  [警告] image-to-svg 未找到锚点")
