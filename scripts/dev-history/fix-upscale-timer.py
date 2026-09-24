from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "app" / "(main)" / "tools" / "image-upscale" / "page.tsx"
content = path.read_text(encoding="utf-8")

# 1. 加 progressTimerRef
old_ref = """  const abortRef = useRef<AbortController | null>(null);
  const pendingResultRef = useRef<UpscaleResponse | null>(null);"""
new_ref = """  const abortRef = useRef<AbortController | null>(null);
  const pendingResultRef = useRef<UpscaleResponse | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);"""

if old_ref in content:
    content = content.replace(old_ref, new_ref, 1)
    print("  [修改] 加 progressTimerRef")

# 2. handleUpscale 里用 progressTimerRef
old_timer = """    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90;
        const elapsed = Date.now() - startTime;
        const target = elapsed < 3000 ? (elapsed / 3000) * 60 : 60 + Math.min(30, (elapsed - 3000) / 10000 * 30);
        return Math.min(90, Math.max(p, target));
      });
    }, 200);"""

new_timer = """    const startTime = Date.now();
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90;
        const elapsed = Date.now() - startTime;
        const target = elapsed < 3000 ? (elapsed / 3000) * 60 : 60 + Math.min(30, (elapsed - 3000) / 10000 * 30);
        return Math.min(90, Math.max(p, target));
      });
    }, 200);"""

if old_timer in content:
    content = content.replace(old_timer, new_timer, 1)
    print("  [修改] handleUpscale 用 progressTimerRef")

# 3. finally 里不再 clearInterval
old_finally = """    } finally {
      abortRef.current = null;
    }
  };"""
new_finally = """    } finally {
      abortRef.current = null;
    }
  };"""
# 不变，但确保一致

# 4. handleRegatherComplete 里清 timer
old_regather = """  const handleRegatherComplete = () => {
    const res = pendingResultRef.current;
    if (res) {
      setResult(res);
      pendingResultRef.current = null;
    }
    setLoading(false);
    setShowProgress(false);
    setProgress(0);
  };"""
new_regather = """  const handleRegatherComplete = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    const res = pendingResultRef.current;
    if (res) {
      setResult(res);
      pendingResultRef.current = null;
    }
    setLoading(false);
    setShowProgress(false);
    setProgress(0);
  };"""
if old_regather in content:
    content = content.replace(old_regather, new_regather, 1)
    print("  [修改] handleRegatherComplete 清理 timer")

# 5. handleCancel 里清 timer
old_cancel = """  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    pendingResultRef.current = null;
    setProgress(0);
    setShowProgress(false);
    setLoading(false);
  };"""
new_cancel = """  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    pendingResultRef.current = null;
    setProgress(0);
    setShowProgress(false);
    setLoading(false);
  };"""
if old_cancel in content:
    content = content.replace(old_cancel, new_cancel, 1)
    print("  [修改] handleCancel 清理 timer")

# 6. 错误分支里也清 timer
old_error = """      } else {
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
    } finally {"""
new_error = """      } else {
        setError(res.message || '超分失败');
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
        setLoading(false);
        setShowProgress(false);
      }
    } catch (err) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setLoading(false);
      setShowProgress(false);
      if (err instanceof Error && err.name === 'AbortError') {
        // 用户主动取消
      } else {
        setError(err instanceof Error ? err.message : '超分失败');
      }
    } finally {"""
if old_error in content:
    content = content.replace(old_error, new_error, 1)
    print("  [修改] 错误分支清理 timer")

path.write_text(content, encoding="utf-8")
print()
print("  image-upscale/page.tsx 修复完成")
