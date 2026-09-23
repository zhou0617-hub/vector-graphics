#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "$0")/.." && pwd)/docs"

if ! command -v pandoc >/dev/null 2>&1; then
  echo "未安装 pandoc，请先执行：brew install pandoc"
  exit 1
fi

cd "$DIR"

if [ $# -eq 0 ]; then
  for f in *.md; do
    [ -e "$f" ] || continue
    out="${f%.md}.docx"
    echo "转换 $f -> $out"
    pandoc "$f" -o "$out" --from gfm
  done
else
  for f in "$@"; do
    [ -f "$f" ] || { echo "跳过：$f 不存在"; continue; }
    out="${f%.md}.docx"
    echo "转换 $f -> $out"
    pandoc "$f" -o "$out" --from gfm
  done
fi

echo "完成"