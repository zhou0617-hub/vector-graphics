# 项目当前状态

> **AI 新会话第一份必读文档。** 读完这份即可开始工作，需要细节时再查其他文档。

**最后更新**：2026-09-25

---

## 一、一句话定位

图片转 SVG + 图片超分 + 社区分享的 Web 平台。

---

## 二、项目根目录

```
C:\Users\z1804\Desktop\vector-graphics
```

Windows 路径，中划线，全小写。

---

## 三、技术栈与端口

| 层 | 技术 | 端口 |
|---|---|---|
| 前端 | Next.js 16 + React 19 + Tailwind 4 + Zustand + TanStack Query | 3000 |
| 后端 | Spring Boot 3.3.5 + Java 21 + MyBatis-Plus + Flyway + JWT | 8080 |
| 矢量化 | Python 3.11 + FastAPI + VTracer | 8000 |
| 超分 | Python 3.11 + FastAPI + PyTorch + Real-ESRGAN | 8001 |
| 中间件 | MySQL 8.0 + Redis 7 + RabbitMQ 3 | 3306 / 6379 / 5672 |

---

## 四、启动方式

```powershell
cd C:\Users\z1804\Desktop\vector-graphics
node scripts/start-dev.js
```

脚本依次启动：vectorizer（8000）→ esrgan（8001）→ backend（8080）→ frontend（3000）。

Docker 中间件需先启动：

```powershell
cd C:\Users\z1804\Desktop\vector-graphics
docker compose up -d
```

---

## 五、数据库账号（重要）

| 项 | 值 |
|---|---|
| Host | localhost:3306 |
| Database | vector_graphics |
| **Username** | **znyh** |
| **Password** | **Znyh617617** |
| Root Password | root |

**注意**：MySQL 账号是 `znyh`，不是 `vg`。RabbitMQ 仍是 `vg / vg123456`。

数据库命令：

```powershell
docker exec vg-mysql mysql -uznyh -pZnyh617617 vector_graphics -e "SHOW TABLES;"
```

---

## 六、测试账号

| 项 | 值 |
|---|---|
| 邮箱 | 111@qq.com |
| 密码 | 111111 |
| 用户名 | pipi |

---

## 七、已实现功能

| 模块 | 后端 | 前端 |
|---|---|---|
| 用户认证（注册/登录/JWT） | ✅ | ✅ |
| 用户资料（头像/简介/改用户名/改密码） | ✅ | ✅ |
| 图片转 SVG（三档精度） | ✅ | ✅ |
| AI 放大（GPU + 三档模型） | ✅ | ✅ |
| 文件管理（分页/批量删除） | ✅ | ✅ |
| 图片查看器（缩放/拖拽） | — | ✅ |
| 登录守卫 + 持久化 | — | ✅ |
| 粒子动画（鼠标排斥 + 点击涟漪 + 互斥） | — | ✅ |
| 全局异常处理（400/401/403/500） | ✅ | — |

---

## 八、待开发功能

| 模块 | 状态 |
|---|---|
| 社区模块（posts/comments/likes/favorites/tags） | 数据表已建，无代码 |
| 管理员后台 | 未开始 |
| 通知系统 | 未开始 |
| SVG 安全清洗 | 未开始 |
| 生产存储（R2/OSS） | 未开始 |
| Redis 缓存应用 | 已配置未使用 |
| RabbitMQ 异步队列 | 已配置未使用 |

详见 `12-roadmap.md`。

---

## 九、关键配置（当前实际值）

### application-dev.yml

- MySQL：`znyh / Znyh617617`
- Redis：`localhost:6379`
- RabbitMQ：`vg / vg123456`
- JWT secret：`local-dev-secret-key-change-in-production-please-32bytes`
- JWT 有效期：7 天（604800000ms）
- vectorizer URL：`http://localhost:8000`
- esrgan URL：`http://localhost:8001`，超时 5 分钟
- 存储：本地 `./data/uploads`，URL 前缀 `/static/uploads`

### 其它

- 上传大小限制：10MB
- WebClient 缓冲：200MB
- Jackson 最大字符串：200MB
- esrgan tile：按显存自适应（<6GB=200, 6-12GB=400, >12GB=512）

---

## 十、硬件环境

| 项 | 值 |
|---|---|
| 操作系统 | Windows |
| 显卡 | NVIDIA RTX 5060 Laptop（8GB 显存） |
| CUDA | 12.8+ |
| PyTorch | cu128 |
| 系统内存 | 32GB |
| 超分速度 | 512x256 图 2.6 秒 |

---

## 十一、GitHub

https://github.com/zhou0617-hub/vector-graphics

主分支：`main`

---

## 十二、文档索引

| 文档 | 作用 |
|---|---|
| `00-project-status.md` | **当前状态速查（本文件）** |
| `01-技术栈与环境.md` | 技术栈版本、环境要求 |
| `02-开发过程.md` | 从零搭建的阶段记录 |
| `03-问题排查.md` | 已解决问题的排查库 |
| `04-开发过程-文件级别.md` | 每个文件干什么 |
| `05-接口文档.md` | 所有 API 定义 |
| `06-数据库设计.md` | 表结构、迁移规范 |
| `07-ai开发规范.md` | AI 协作规范（输出格式、PowerShell 陷阱） |
| `08-部署文档.md` | 部署说明 |
| `09-开发规范.md` | 编码规范 |
| `10-模块开发进度.md` | 详细进度表 |
| `11-code-map.md` | 功能→文件定位 |
| `12-roadmap.md` | 远期规划 |

---

## 十三、给 AI 的开场提示

新会话第一句：

```
项目路径：C:\Users\z1804\Desktop\vector-graphics

附件：00-project-status.md + 07-ai开发规范.md（其他文档按需索取）

当前任务：<说明>

当前状态：<服务是否在跑、有无报错、有无未提交改动>

要求：见 07-ai开发规范.md
```

AI 读完 `00` 和 `07` 后，应能立即开始工作。