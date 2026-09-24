from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "app" / "(main)" / "tools" / "image-to-svg" / "page.tsx"
content = path.read_text(encoding="utf-8")

# 1. 等待时间 2200 → 4000
if "setTimeout(r, 2200)" in content:
    content = content.replace("setTimeout(r, 2200)", "setTimeout(r, 4000)")
    print("  [修改] 等待时间 2200 → 4000")
else:
    print("  [跳过] 未找到 setTimeout(r, 2200)")

# 2. 结果页原图加 lazy + async
old1 = '<img src={assetUrl(result.originalUrl)} alt="原图" className="absolute inset-0 w-full h-full object-contain p-2" />'
new1 = '<img src={assetUrl(result.originalUrl)} alt="原图" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-contain p-2" />'
if old1 in content:
    content = content.replace(old1, new1, 1)
    print("  [修改] 原图加 lazy + async")

# 3. 结果页 SVG 加 lazy + async
old2 = '<img src={assetUrl(result.svgUrl)} alt="SVG" className="absolute inset-0 w-full h-full object-contain p-2" />'
new2 = '<img src={assetUrl(result.svgUrl)} alt="SVG" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-contain p-2" />'
if old2 in content:
    content = content.replace(old2, new2, 1)
    print("  [修改] SVG 加 lazy + async")

path.write_text(content, encoding="utf-8")
