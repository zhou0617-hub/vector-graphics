from pathlib import Path

ROOT = Path(__file__).parent
FE = ROOT / "frontend" / "src"
path = FE / "lib" / "utils" / "preload.ts"
path.parent.mkdir(parents=True, exist_ok=True)

path.write_text("""/**
 * 预加载图片，返回 Promise
 * 用于在跳转到结果页前，确保图片已加载完成，避免闪烁
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('图片加载失败: ' + url));
    img.src = url;
  });
}
""", encoding="utf-8")

print(f"  [创建] {path.relative_to(ROOT)}")
