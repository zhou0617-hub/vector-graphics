from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "app" / "(main)" / "tools" / "image-to-svg" / "page.tsx"
content = path.read_text(encoding="utf-8")

# 1. 加一个 ref 保存待显示的结果
old_ref = """  // 进度条
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const abortRef = useRef<AbortController | null>(null);"""

new_ref = """  // 进度条
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pendingResultRef = useRef<ConvertResponse | null>(null);"""

if old_ref in content:
    content = content.replace(old_ref, new_ref, 1)
    print("  [修改] 加 pendingResultRef")

# 2. 替换 handleConvert
old_convert = """  const handleConvert = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) { router.push('/login'); return; }
    if (!file) { setError('请先选择图片'); return; }

    // 启动伪进度
    setShowProgress(true);
    setProgress(0);
    setError('');
    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90;
        const elapsed = Date.now() - startTime;
        // 前 5 秒涨到 60%，之后慢涨到 90%
        const target = elapsed < 5000 ? (elapsed / 5000) * 60 : 60 + Math.min(30, (elapsed - 5000) / 20000 * 30);
        return Math.min(90, Math.max(p, target));
      });
    }, 200);

    // 创建 AbortController
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await convertImage(file, MODES[mode].params, controller.signal);
      if (res.status === 'success' && res.originalUrl && res.svgUrl) {
        // 进度瞬间到 100%
        setProgress(100);
        await new Promise((r) => setTimeout(r, 600));
        // 预加载两张图
        try {
          await Promise.all([preloadImage(assetUrl(res.originalUrl)), preloadImage(assetUrl(res.svgUrl))]);
        } catch (err) { console.warn('预加载失败', err); }
        setResult(res);
      } else {
        setError(res.message || '转换失败');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 用户主动取消，不显示错误
      } else {
        setError(err instanceof Error ? err.message : '转换失败');
      }
    } finally {
      clearInterval(progressTimer);
      setLoading(false);
      setShowProgress(false);
      abortRef.current = null;
    }
  };"""

new_convert = """  const handleConvert = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) { router.push('/router'); return; }
    if (!file) { setError('请先选择图片'); return; }

    // 启动伪进度
    setShowProgress(true);
    setProgress(0);
    setError('');
    pendingResultRef.current = null;
    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90;
        const elapsed = Date.now() - startTime;
        // 前 5 秒涨到 60%，之后慢涨到 90%
        const target = elapsed < 5000 ? (elapsed / 5000) * 60 : 60 + Math.min(30, (elapsed - 5000) / 20000 * 30);
        return Math.min(90, Math.max(p, target));
      });
    }, 200);

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await convertImage(file, MODES[mode].params, controller.signal);
      if (res.status === 'success' && res.originalUrl && res.svgUrl) {
        // 先预加载两张图
        try {
          await Promise.all([preloadImage(assetUrl(res.originalUrl)), preloadImage(assetUrl(res.svgUrl))]);
        } catch (err) { console.warn('预加载失败', err); }
        // 保存结果，等粒子重组完成后显示
        pendingResultRef.current = res;
        // 进度到 100%，粒子开始重组
        setProgress(100);
      } else {
        setError(res.message || '转换失败');
        clearInterval(progressTimer);
        setLoading(false);
        setShowProgress(false);
      }
    } catch (err) {
      clearInterval(progressTimer);
      setLoading(false);
      setShowProgress(false);
      if (err instanceof Error && err.name === 'AbortError') {
        // 用户主动取消
      } else {
        setError(err instanceof Error ? err.message : '转换失败');
      }
    } finally {
      // 不清 progressTimer，等重组完成后再清
      abortRef.current = null;
    }
  };

  const handleRegatherComplete = () => {
    // 粒子重组完成，显示结果
    const res = pendingResultRef.current;
    if (res) {
      setResult(res);
      pendingResultRef.current = null;
    }
    setLoading(false);
    setShowProgress(false);
    setProgress(0);
  };"""

if old_convert in content:
    content = content.replace(old_convert, new_convert, 1)
    path.write_text(content, encoding="utf-8")
    print("  [修改] image-to-svg/page.tsx - handleConvert + handleRegatherComplete")
else:
    print("  [警告] image-to-svg 未找到 handleConvert 锚点")
