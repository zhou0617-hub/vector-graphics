# -*- coding: utf-8 -*-
"""
一次性文档更新脚本（2026-09-24）
用法：在项目根目录执行 python scripts/update-docs.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"


def append(fname, text):
    p = DOCS / fname
    with open(p, "r", encoding="utf-8") as f:
        existing = f.read()
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(existing)
        if not existing.endswith("\n"):
            f.write("\n")
        f.write(text)
    print("OK:", fname)


# =========================================================
# 05-接口文档.md
# =========================================================
append("05-接口文档.md", r"""

---

## 附录：2026-09-24 实际接口校准

### POST /api/conversions/upscale（已实现）

**鉴权**：需要

**Content-Type**：multipart/form-data

**表单字段**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| file | File | 是 | 图片，PNG / JPG / WebP，最大 10MB |
| model | String | 否 | anime / general / x2，默认 anime |

**成功响应**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "fileId": 1,
    "status": "success",
    "originalUrl": "/static/uploads/2026/09/a.png",
    "resultUrl": "/static/uploads/2026/09/a_upscaled.png",
    "width": 1600,
    "height": 1200,
    "message": "超分成功"
  }
}
```

**失败响应**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "fileId": 2,
    "status": "failed",
    "originalUrl": "/static/uploads/2026/09/a.png",
    "resultUrl": null,
    "width": null,
    "height": null,
    "message": "超分失败: ..."
  }
}
```

**说明**：与 /convert 一致，失败时 HTTP 200，code 为 0，失败信息在 data.status 和 data.message。

---

### esrgan-service 接口（端口 8001）

**GET /api/health**

**成功响应**

```json
{
  "status": "ok",
  "service": "Real-ESRGAN Service",
  "version": "0.1.0"
}
```

---

**POST /api/upscale**

**Content-Type**：multipart/form-data

**表单字段**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| file | File | 是 | 图片 |
| model | String | 否 | anime / general / x2，默认 anime |

**成功响应**

```json
{
  "success": true,
  "image_base64": "iVBORw0KGgo...",
  "message": null
}
```

**失败响应**

```json
{
  "detail": "不支持的模型: xxx"
}
```

---

**POST /api/upscale/image**

与 /api/upscale 相同，直接返回 image/png 文件流。

**Swagger UI**：http://localhost:8001/docs
""")


# =========================================================
# 03-问题排查.md
# =========================================================
append("03-问题排查.md", r"""

---

## 附录：2026-09-24 新增问题

### 问题 21：PowerShell 读文件中文乱码

**现象**

Get-Content 读 UTF-8 文件时中文显示为乱码。

**原因**

Windows PowerShell 5.1 默认使用 GBK 编码读取文件。

**解决**

```powershell
Get-Content "path\to\file.java" -Encoding UTF8
```

Select-String 同理，加 -Encoding UTF8。

---

### 问题 22：含括号的路径无法用 Get-ChildItem

**现象**

```powershell
Get-ChildItem "$ROOT\frontend\src\app\(main)\tools\image-upscale"
```

报错：找不到接受实际参数"\tools\image-upscale"的位置形式参数。

**原因**

(main) 被 PowerShell 解析为参数表达式。

**解决**

用 -LiteralPath：

```powershell
Get-ChildItem -LiteralPath "$ROOT\frontend\src\app\(main)\tools\image-upscale" -File
```

---

### 问题 23：esrgan 引擎未启用 GPU（待修复）

**现象**

Windows + RTX 5060 上超分速度仍为 1-2 分钟，与 Mac CPU 相当。

**原因**

realesrgan_engine.py 中 RealESRGANer 未传 device 参数，tile=400 和 half=False 写死，始终以 CPU 模式运行。

**修复方案**

```python
import torch
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
use_half = device.type == "cuda"

self._upsampler = RealESRGANer(
    scale=cfg["scale"],
    model_path=cfg["path"],
    model=cfg["arch"],
    tile=0 if device.type == "cuda" else 400,
    tile_pad=10,
    pre_pad=0,
    half=use_half,
    device=device,
)
```

---

### 问题速查表（2026-09-24 新增）

| 现象 | 原因 | 解决位置 |
|---|---|---|
| PowerShell 中文乱码 | 默认 GBK | 问题 21 |
| 括号路径报错 | 被当作参数 | 问题 22 |
| 超分速度慢 | 未启用 GPU | 问题 23 |
""")


# =========================================================
# 02-开发过程.md
# =========================================================
append("02-开发过程.md", r"""

---

## 附录：2026-09-24 实际进度校准

### ESRGAN 集成实际完成情况

文档此前记录的"阶段七：Real-ESRGAN 超分服务"实际上已经完成了前后端全链路集成。

**已完成**

| 层级 | 文件 | 状态 |
|---|---|---|
| Python 引擎 | esrgan-service/app/services/engines/realesrgan_engine.py | 完成，但未启用 GPU |
| Python 路由 | esrgan-service/app/api/routes.py | 完成 |
| Java 客户端 | infrastructure/esrgan/EsrganClient.java | 完成，500MB 缓冲 |
| Java 配置 | infrastructure/esrgan/EsrganProperties.java | 完成 |
| Java 接口 | POST /api/conversions/upscale | 完成 |
| Java 服务 | ConversionService.upscale | 完成 |
| 数据库 | V2__add_source_to_files.sql | 完成 |
| 前端页面 | app/(main)/tools/image-upscale/page.tsx | 完成 |
| 前端 API | lib/api/upscale.ts | 完成 |
| 导航入口 | Header "AI 放大" | 完成 |
| 粒子动画 | components/particle-progress.tsx | 完成 |

**待修复**

| 项 | 说明 |
|---|---|
| GPU 自动检测 | realesrgan_engine.py 写死 CPU |
| upscale 的 conversions 记录 | 未插入 |
| getById 返回 DTO | 直接返回实体 |
| SVG_WIDTH 死代码 | 未使用常量 |

---

### 数据流更新

```
浏览器（Next.js）
    ↓ HTTP + JWT
Spring Boot 后端
    ├─ JWT 校验
    ├─ 文件 → backend/data/uploads/
    ├─ 数据库 → MySQL
    ├─ 图片转 SVG → VectorizerClient → vectorizer（8000）
    └─ 图片超分 → EsrganClient → esrgan-service（8001）
```
""")


# =========================================================
# 04-开发过程-文件级别.md
# =========================================================
append("04-开发过程-文件级别.md", r"""

---

## 附录：2026-09-24 实际状态校准

### 后端新增（ESRGAN 集成）

| 文件 | 作用 |
|---|---|
| infrastructure/esrgan/EsrganClient.java | 调用 Python 超分服务，500MB 缓冲 + Jackson 大字符串 |
| infrastructure/esrgan/EsrganProperties.java | 配置 app.esrgan.base-url、timeout-ms |
| modules/conversion/dto/UpscaleResponse.java | 超分响应体 |

### 后端修改

| 文件 | 改动 |
|---|---|
| modules/file/entity/FileEntity.java | 新增 source 字段 |
| modules/file/dto/FileResponse.java | 新增 source 字段 |
| modules/file/converter/FileConverter.java | 映射 source |
| modules/conversion/controller/ConversionController.java | 新增 POST /api/conversions/upscale |
| modules/conversion/service/ConversionService.java | 新增 upscale() 方法 |
| resources/db/migration/V2__add_source_to_files.sql | 新增迁移脚本 |
| resources/application-dev.yml | 新增 app.esrgan.base-url: http://localhost:8001 |

### 前端新增

| 文件 | 作用 |
|---|---|
| app/(main)/tools/image-upscale/page.tsx | AI 放大工作台，三档模式 + 粒子动画 |
| lib/api/upscale.ts | 超分 API |
| lib/utils/preload.ts | 图片预加载 |
| components/particle-progress.tsx | 基于 delaunator 的粒子进度动画 |

### 前端修改

| 文件 | 改动 |
|---|---|
| components/layout/header.tsx | 新增 "AI 放大" 导航项 |
| types/api.ts | 新增 UpscaleResponse，FileItem 新增 source |
| package.json | 新增 delaunator |

### esrgan-service

| 文件 | 作用 |
|---|---|
| app/main.py | FastAPI 入口 |
| app/api/routes.py | /health、/upscale、/upscale/image |
| app/api/schemas.py | 请求/响应模型 |
| app/core/config.py | 配置 |
| app/services/upscaler.py | 服务层，引擎缓存 |
| app/services/engines/base.py | 引擎抽象接口 |
| app/services/engines/realesrgan_engine.py | Real-ESRGAN 引擎（未启用 GPU） |
| weights/*.pth | 三个模型权重（不入 Git） |

### 已知问题

1. realesrgan_engine.py 写死 CPU 模式
2. ConversionService.upscale 未创建 conversions 记录
3. ConversionService.getById 返回实体而非 DTO
4. ConversionService.convert 中 SVG_WIDTH 未使用
""")


# =========================================================
# 01-技术栈与环境.md
# =========================================================
append("01-技术栈与环境.md", r"""

---

## 附录：2026-09-24 实际状态校准

### 端口占用（补充标注）

| 端口 | 服务 | 状态 |
|---|---|---|
| 3000 | Next.js 前端 | 运行中 |
| 8000 | vectorizer（图片转 SVG） | 运行中 |
| 8001 | esrgan-service（图片超分） | 已集成 |
| 8080 | Spring Boot 后端 | 运行中 |
| 3306 | MySQL | 运行中 |
| 6379 | Redis | 已配置未使用 |
| 5672 / 15672 | RabbitMQ | 已配置未使用 |

### 后端应用配置新增

application-dev.yml 新增：

```yaml
app:
  esrgan:
    base-url: http://localhost:8001
```

EsrganProperties 默认值：

| 参数 | 默认 | 说明 |
|---|---|---|
| baseUrl | http://localhost:8001 | Python 超分服务地址 |
| timeoutMs | 300000 | 超时 5 分钟 |

### 一键启动

scripts/start-dev.js 已支持 4 个服务：

| 服务 | 端口 |
|---|---|
| vectorizer | 8000 |
| esrgan | 8001 |
| backend | 8080 |
| frontend | 3000 |

```powershell
cd C:\Users\z1804\Desktop\vector-graphics
node scripts/start-dev.js
```
""")


# =========================================================
# 10-模块开发进度.md（替换 + 追加）
# =========================================================
p10 = DOCS / "10-模块开发进度.md"
with open(p10, "r", encoding="utf-8") as f:
    c10 = f.read()

old_line = "| Real-ESRGAN 超分 | 🟡 | ❌ | 🟡 后端完成，前端未集成 |"
new_line = "| Real-ESRGAN 超分 | ✅ | ✅ | ✅ 完成（GPU 检测待补） |"

if old_line in c10:
    c10 = c10.replace(old_line, new_line)
    print("REPLACED: 10-模块开发进度.md 总览表")
else:
    print("WARN: 未找到总览表旧行，可能已经修改过")

appendix = r"""

---

## 附录：2026-09-24 状态修正

### ESRGAN 前后端集成完成

**已完成**

| 项 | 状态 |
|---|---|
| Python 服务 | 完成 |
| 三档模型 | 完成 |
| Java EsrganClient | 完成 |
| Java 接口 /api/conversions/upscale | 完成 |
| 前端 image-upscale 页面 | 完成 |
| 三档模式选择器 | 完成 |
| ParticleProgress 粒子动画 | 完成 |
| 终止转换 | 完成 |
| files.source 字段 | 完成 |
| 导航栏 "AI 放大" 入口 | 完成 |

**待修复**

| 项 | 说明 |
|---|---|
| GPU 自动检测 | realesrgan_engine.py 写死 CPU |
| upscale 的 conversions 记录 | 未插入 |
| getById 返回 DTO | 直接返回实体 |
| SVG_WIDTH 死代码 | 未使用常量 |
"""

if not c10.endswith("\n"):
    c10 += "\n"
c10 += appendix

with open(p10, "w", encoding="utf-8", newline="\n") as f:
    f.write(c10)
print("OK: 10-模块开发进度.md")

print()
print("全部文档已更新")