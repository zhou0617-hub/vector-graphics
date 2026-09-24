from pathlib import Path

FE = Path(__file__).parent / "frontend" / "src"
path = FE / "app" / "(main)" / "tools" / "image-to-svg" / "page.tsx"

content = path.read_text(encoding="utf-8")

old = """  ultra: {
    label: '超高清',
    short: '极致细节',
    description: '最大程度还原细节，文件最大，适合专业场景',
    suitable: '需要印刷、专业设计',
    output: '文件最大，细节最全',
    params: {
      color_precision: 8,
      layer_difference: 4,
      length_threshold: 1.5,
      filter_speckle: 1,
      max_iterations: 30,
      splice_threshold: 20,
    },
  },"""

new = """  ultra: {
    label: '超高清',
    short: '极致细节',
    description: '最大程度还原细节，渐变过渡更平滑，文件最大，适合专业场景',
    suitable: '需要印刷、专业设计',
    output: '文件最大，渐变最平滑',
    params: {
      color_precision: 8,
      layer_difference: 2,
      length_threshold: 1.0,
      filter_speckle: 0,
      max_iterations: 40,
      splice_threshold: 15,
    },
  },"""

if old in content:
    content = content.replace(old, new, 1)
    path.write_text(content, encoding="utf-8")
    print("  [修改] image-to-svg/page.tsx - 超高清参数微调")
else:
    print("  [警告] 未找到锚点，参数可能已被改过")
    print("  当前文件内容（ultra 部分）:")
    import re
    m = re.search(r"ultra:\s*\{[^}]*\}", content, re.DOTALL)
    if m:
        print(m.group(0))
