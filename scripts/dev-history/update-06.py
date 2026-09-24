# -*- coding: utf-8 -*-
"""补充 06-数据库设计.md 的 V2 迁移记录"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILE = ROOT / "docs" / "06-数据库设计.md"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

# 替换当前版本号
content = content.replace(
    "当前版本：`V1__init_schema.sql`",
    "当前版本：`V2__add_source_to_files.sql`"
)

appendix = r"""

---

## 附录：2026-09-24 数据库变更记录

### 迁移版本

| 版本 | 文件 | 说明 |
|---|---|---|
| V1 | V1__init_schema.sql | 初始 schema，建 11 张表 |
| V2 | V2__add_source_to_files.sql | files 表新增 source 字段 |

### V2 迁移内容

```sql
ALTER TABLE files
ADD COLUMN source VARCHAR(32) NOT NULL DEFAULT 'convert'
COMMENT '来源: convert / upscale'
AFTER format;
```

**用途**：区分文件是由「图片转 SVG」（convert）还是「AI 放大」（upscale）产生的。

**取值**

| 值 | 来源 |
|---|---|
| convert | 图片转 SVG（默认） |
| upscale | AI 放大 |

**影响范围**

| 层 | 文件 | 改动 |
|---|---|---|
| 迁移 | V2__add_source_to_files.sql | 新增 |
| 实体 | modules/file/entity/FileEntity.java | 新增 source 字段 |
| DTO | modules/file/dto/FileResponse.java | 新增 source 字段 |
| 转换器 | modules/file/converter/FileConverter.java | 映射 source |
| Service | ConversionService.convert | 写入 source="convert" |
| Service | ConversionService.upscale | 写入 source="upscale" |
"""

if not content.endswith("\n"):
    content += "\n"
content += appendix

with open(FILE, "w", encoding="utf-8", newline="\n") as f:
    f.write(content)

print("OK: 06-数据库设计.md")