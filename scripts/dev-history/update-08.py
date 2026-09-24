# -*- coding: utf-8 -*-
"""补充 08-部署文档.md 的 esrgan-service 部署章节"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILE = ROOT / "docs" / "08-部署文档.md"

appendix = r"""

---

## 附录：2026-09-24 esrgan-service 补充部署说明

### 端口更新

| 端口 | 服务 |
|---|---|
| 3000 | Next.js 前端 |
| 8000 | vectorizer（图片转 SVG） |
| 8001 | esrgan-service（图片超分） |
| 8080 | Spring Boot 后端 |
| 3306 | MySQL |
| 6379 | Redis |
| 5672 / 15672 | RabbitMQ |

### 后端新增配置

application-dev.yml：

```yaml
app:
  esrgan:
    base-url: http://localhost:8001
```

EsrganProperties 默认值：

| 参数 | 默认 |
|---|---|
| baseUrl | http://localhost:8001 |
| timeoutMs | 300000 |

### 生产部署建议

**CPU 部署**（开发/低并发）

- 与 vectorizer 同规格：1 核 512MB 起
- 512x512 图约 1-2 分钟，不适合线上

**GPU 部署**（生产）

| 平台 | 价格 | 特点 |
|---|---|---|
| AutoDL | 1-2 元/小时 | 国内，RTX 3060 起 |
| 恒源云 | 1-2 元/小时 | 国内，学生优惠 |
| 揽睿星舟 | 2-3 元/小时 | 国内，镜像丰富 |
| RunPod | $0.2-0.5/小时 | 国际 |

**关键点**

- 必须启用 GPU 检测，否则 RTX 5060 也只跑 CPU（详见 03-问题排查.md 问题 23）
- 权重文件（weights/*.pth）需要 COPY 进镜像或挂载 volume
- 建议加 API Key 认证后暴露到公网

### Docker 部署

esrgan-service/Dockerfile：

```dockerfile
FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    -i https://pypi.tuna.tsinghua.edu.cn/simple

COPY app/ app/
COPY weights/ weights/

EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### 速度参考

| 环境 | 512x512 图 |
|---|---|
| Mac CPU | 1-2 分钟 |
| Windows + RTX 3060 | 3 秒 |
| Windows + RTX 5060 | 1-2 秒 |
| 云 GPU RTX 4090 | < 1 秒 |
"""

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

if not content.endswith("\n"):
    content += "\n"
content += appendix

with open(FILE, "w", encoding="utf-8", newline="\n") as f:
    f.write(content)

print("OK: 08-部署文档.md")