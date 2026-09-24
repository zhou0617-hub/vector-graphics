from pathlib import Path

for page in ["image-to-svg", "image-upscale"]:
    path = Path(__file__).parent / "frontend" / "src" / "app" / "(main)" / "tools" / page / "page.tsx"
    content = path.read_text(encoding="utf-8")
    if "router.push('/router')" in content:
        content = content.replace("router.push('/router')", "router.push('/login')")
        path.write_text(content, encoding="utf-8")
        print(f"  [修改] {page}/page.tsx - router.push('/router') → '/login'")
    else:
        print(f"  [跳过] {page}/page.tsx - 无 /router")
