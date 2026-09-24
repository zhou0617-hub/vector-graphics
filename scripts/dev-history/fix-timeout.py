from pathlib import Path

ROOT = Path(__file__).parent
BE = ROOT / "backend"
JAVA = BE / "src" / "main" / "java" / "com" / "svgplatform"
RES = BE / "src" / "main" / "resources"

def patch(path, old, new, desc=""):
    if not path.exists():
        print(f"  [跳过] {path.relative_to(ROOT)} 不存在")
        return False
    content = path.read_text(encoding="utf-8")
    if new in content:
        print(f"  [已存在] {path.relative_to(ROOT)}")
        return False
    if old not in content:
        print(f"  [警告] {path.relative_to(ROOT)} 未找到锚点: {desc}")
        return False
    content = content.replace(old, new, 1)
    path.write_text(content, encoding="utf-8")
    print(f"  [修改] {path.relative_to(ROOT)} - {desc}")
    return True

print("=" * 60)
print("提高超时 + 参数微调")
print("=" * 60)
print()

# 1. VectorizerProperties 默认超时
print("[1/3] VectorizerProperties 默认超时")
patch(
    JAVA / "infrastructure" / "vectorizer" / "VectorizerProperties.java",
    "private int timeoutMs = 60000;",
    "private int timeoutMs = 300000;",
    "默认超时 60s → 300s"
)

# 2. application-dev.yml 显式配置
print("\n[2/3] application-dev.yml 显式超时")
dev_yml = RES / "application-dev.yml"
content = dev_yml.read_text(encoding="utf-8")
if "timeout-ms" not in content:
    content = content.replace(
        "  vectorizer:\n    base-url: http://localhost:8000",
        "  vectorizer:\n    base-url: http://localhost:8000\n    timeout-ms: 300000",
        1
    )
    dev_yml.write_text(content, encoding="utf-8")
    print(f"  [修改] {dev_yml.relative_to(ROOT)} - 加 timeout-ms: 300000")
else:
    print(f"  [已存在] {dev_yml.relative_to(ROOT)}")

# 3. 前端超高清参数微调（略微回收，平衡速度和质量）
print("\n[3/3] 前端超高清参数微调")
fe_path = ROOT / "frontend" / "src" / "app" / "(main)" / "tools" / "image-to-svg" / "page.tsx"
content = fe_path.read_text(encoding="utf-8")

old = """    params: {
      color_precision: 8,
      layer_difference: 2,
      length_threshold: 1.0,
      filter_speckle: 0,
      max_iterations: 40,
      splice_threshold: 15,
    },"""

new = """    params: {
      color_precision: 8,
      layer_difference: 2,
      length_threshold: 1.2,
      filter_speckle: 0,
      max_iterations: 30,
      splice_threshold: 20,
    },"""

if old in content:
    content = content.replace(old, new, 1)
    fe_path.write_text(content, encoding="utf-8")
    print(f"  [修改] {fe_path.relative_to(ROOT)} - 参数微调")
else:
    print(f"  [警告] 未找到超高清参数锚点")

print()
print("=" * 60)
print("完成！")
print("=" * 60)
