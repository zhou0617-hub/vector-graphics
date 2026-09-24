/**
 * 预加载图片，返回 Promise
 * 带超时保护：超过 8 秒未加载完成自动 resolve，避免卡住
 */
export function preloadImage(url: string, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    // 超时保险
    const timer = setTimeout(() => {
      console.warn('preloadImage 超时:', url);
      done();
    }, timeoutMs);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      done();
    };
    img.onerror = () => {
      clearTimeout(timer);
      console.warn('preloadImage 失败:', url);
      done();
    };
    img.src = url;
  });
}
