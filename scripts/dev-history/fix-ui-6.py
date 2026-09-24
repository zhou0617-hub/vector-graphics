import os
from pathlib import Path

ROOT = Path(__file__).parent
FE = ROOT / "frontend" / "src"

def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  [重写] {path.relative_to(ROOT)}")

print("=" * 60)
print("前端 4 项修改")
print("=" * 60)
print()

# ============ 1. Header：改文字 ============
print("[1/4] Header 导航文字")
header_path = FE / "components" / "layout" / "header.tsx"
content = header_path.read_text(encoding="utf-8")
content = content.replace(
    "{ href: '/tools/image-upscale', label: '图片超分' },",
    "{ href: '/tools/image-upscale', label: 'AI 放大' },"
)
header_path.write_text(content, encoding="utf-8")
print(f"  [修改] {header_path.relative_to(ROOT)} - 图片超分 → AI 放大")

# ============ 2. 首页：改文字 ============
print("\n[2/4] 首页卡片文字")
home_path = FE / "app" / "page.tsx"
content = home_path.read_text(encoding="utf-8")
content = content.replace('title: \'图片超分\',', 'title: \'AI 放大\',')
content = content.replace('subtitle: \'AI 放大\',', 'subtitle: \'画质增强\',')
content = content.replace('图片转 SVG · AI 图片超分 · 一站式矢量图形创作平台', '图片转 SVG · AI 图片放大 · 一站式矢量图形创作平台')
content = content.replace('Vector Graphics · 图片转 SVG + AI 超分', 'Vector Graphics · 图片转 SVG + AI 放大')
content = content.replace('基于 RTX 系列 GPU 的 AI 推理，512×512 图片约 1-3 秒完成 4 倍放大', '基于 RTX 系列 GPU 的 AI 推理，512×512 图片约 1-3 秒完成 4 倍放大')
home_path.write_text(content, encoding="utf-8")
print(f"  [修改] {home_path.relative_to(ROOT)} - 首页卡片文字更新")

# ============ 3. image-to-svg：加标签 + 图标变化 ============
print("\n[3/4] image-to-svg 页面")
svg_path = FE / "app" / "(main)" / "tools" / "image-to-svg" / "page.tsx"
content = svg_path.read_text(encoding="utf-8")

# 3.1 加 VTracer 标签
old_title = '''          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">图片转 SVG</h1>
            <p className="text-[#f2f2f2]/50">上传图片，一键生成矢量图形</p>
          </div>'''
new_title = '''          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#f2f2f2]/70 mb-4">
              <Sparkles className="w-4 h-4 text-[#f9cf00]" />
              VTracer 矢量化
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">图片转 SVG</h1>
            <p className="text-[#f2f2f2]/50">上传图片，一键生成矢量图形</p>
          </div>'''
content = content.replace(old_title, new_title, 1)

# 3.2 图标改为 ImagePlus + FolderUp 切换
old_icon = '''                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-[#f2f2f2]/40" />
                      </div>'''
new_icon = '''                      <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                        <ImagePlus className={`absolute w-10 h-10 text-[#f2f2f2]/40 transition-opacity duration-500 ${isDragActive ? 'opacity-0' : 'opacity-100 group-hover/upload:opacity-0'}`} />
                        <FolderUp className={`absolute w-10 h-10 text-[#f9cf00] transition-opacity duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover/upload:opacity-100'}`} />
                      </div>'''
content = content.replace(old_icon, new_icon, 1)

# 3.3 更新 import
content = content.replace(
    "import { Image as ImageIcon, Download, X, ArrowRight, Loader2, ZoomIn, RefreshCw, Sparkles } from 'lucide-react';",
    "import { ImagePlus, FolderUp, Download, X, ArrowRight, Loader2, ZoomIn, RefreshCw, Sparkles } from 'lucide-react';"
)

svg_path.write_text(content, encoding="utf-8")
print(f"  [修改] {svg_path.relative_to(ROOT)} - 加标签 + 图标变化")

# ============ 4. image-upscale：改标题 + 图标变化 ============
print("\n[4/4] image-upscale 页面")
upscale_path = FE / "app" / "(main)" / "tools" / "image-upscale" / "page.tsx"
content = upscale_path.read_text(encoding="utf-8")

# 4.1 改标题
content = content.replace(
    '<h1 className="text-3xl md:text-4xl font-bold mb-3">图片超分</h1>',
    '<h1 className="text-3xl md:text-4xl font-bold mb-3">AI 放大</h1>'
)
content = content.replace(
    '<p className="text-[#f2f2f2]/50">AI 放大图片，保留细节，提升清晰度</p>',
    '<p className="text-[#f2f2f2]/50">AI 放大图片，保留细节，提升清晰度</p>'
)

# 4.2 图标变化
content = content.replace(old_icon, new_icon, 1)

# 4.3 更新 import
content = content.replace(
    "import { Image as ImageIcon, Download, X, ArrowRight, Loader2, ZoomIn, RefreshCw, Sparkles } from 'lucide-react';",
    "import { ImagePlus, FolderUp, Download, X, ArrowRight, Loader2, ZoomIn, RefreshCw, Sparkles } from 'lucide-react';"
)

upscale_path.write_text(content, encoding="utf-8")
print(f"  [修改] {upscale_path.relative_to(ROOT)} - 标题 + 图标变化")

print()
print("=" * 60)
print("完成！")
print("=" * 60)
