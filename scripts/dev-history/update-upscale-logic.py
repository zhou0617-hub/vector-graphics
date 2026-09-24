from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "app" / "(main)" / "tools" / "image-upscale" / "page.tsx"
content = path.read_text(encoding="utf-8")

# 1. 加 pendingResultRef
old_ref = """  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const abortRef = useRef<AbortController | null>(null);"""
new_ref = """  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pendingResultRef = useRef<UpscaleResponse | null>(null);"""

if old_ref in content:
    content = content.replace(old_ref, new_ref, 1)
    print("  [修改] 加 pendingResultRef")

# 2. 替换 handleUpscale
old_upscale = """  const handleUpscale = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) { router.push('/login'); return; }
    if (!file) { setError('请先选择图片'); return; }

    setShowProgress(true);
    setProgress(0);
    setError('');
    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90;
        const elapsed = Date.now() - startTime;
        const target = elapsed < 3000 ? (elapsed / 3000) * 60 : 60 + Math.min(30, (elapsed - 3000) / 10000 * 30);
        return Math.min(90, Math.max(p, target));
      });
    }, 200);

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await upscaleImage(file, mode, controller.signal);
      if (res.status === 'success' && res.originalUrl && res.resultUrl) {
        setProgress(100);
        await new Promise((r) => setTimeout(r, 600));
        try {
          await Promise.all([preloadImage(assetUrl(res.originalUrl)), preloadImage(assetUrl(res.resultUrl))]);
        } catch (err) { console.warn('预加载失败', err); }
        setResult(res);
      } else {
        setError(res.message || '超分失败');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 用户主动取消
      } else {
        setError(err instanceof Error ? err.message : '超分失败');
      }
    } finally {
      clearInterval(progressTimer);
      setLoading(false);
      setShowProgress(false);
      abortRef.current = null;
    }
  };"""

new_upscale = """  const handleUpscale = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) { router.push('/login'); return; }
    if (!file) { setError('请先选择图片'); return; }

    setShowProgress(true);
    setProgress(0);
    setError('');
    pendingResultRef.current = null;
    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90;
        const elapsed = Date.now() - startTime;
        const target = elapsed < 3000 ? (elapsed / 3000) * 60 : 60 + Math.min(30, (elapsed - 3000) / 10000 * 30);
        return Math.min(90, Math.max(p, target));
      });
    }, 200);

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await upscaleImage(file, mode, controller.signal);
      if (res.status === 'success' && res.originalUrl && res.resultUrl) {
        try {
          await Promise.all([preloadImage(assetUrl(res.originalUrl)), preloadImage(assetUrl(res.resultUrl))]);
        } catch (err) { console.warn('预加载失败', err); }
        pendingResultRef.current = res;
        setProgress(100);
      } else {
        setError(res.message || '超分失败');
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
        setError(err instanceof Error ? err.message : '超分失败');
      }
    } finally {
      abortRef.current = null;
    }
  };

  const handleRegatherComplete = () => {
    const res = pendingResultRef.current;
    if (res) {
      setResult(res);
      pendingResultRef.current = null;
    }
    setLoading(false);
    setShowProgress(false);
    setProgress(0);
  };"""

if old_upscale in content:
    content = content.replace(old_upscale, new_upscale, 1)
    path.write_text(content, encoding="utf-8")
    print("  [修改] image-upscale/page.tsx - handleUpscale + handleRegatherComplete")
else:
    print("  [警告] image-upscale 未找到 handleUpscale 锚点")
