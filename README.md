# Vector Graphics Platform

图片转 SVG 工具 + 社区分享平台。

## 项目结构

- `frontend/`   Next.js 前端
- `backend/`    Spring Boot 后端
- `vectorizer/` Python FastAPI 矢量化服务
- `scripts/`    跨平台辅助脚本
- `docs/`       项目文档

## 环境要求

- Node.js >= 20
- Java 21
- Python 3.10+
- Docker Desktop（用于本地 MySQL / Redis / RabbitMQ）

## 快速开始

```bash
npm install
docker compose up -d
npm run dev
```

## 各服务端口

| 服务 | 端口 | 说明 |
|---|---|---|
| 前端 Next.js | 3000 | http://localhost:3000 |
| 后端 Spring Boot | 8080 | http://localhost:8080 |
| 矢量化 FastAPI | 8000 | http://localhost:8000 |
| MySQL | 3306 | vg / vg123456 |
| Redis | 6379 | - |
| RabbitMQ | 5672 | 管理: http://localhost:15672 |
