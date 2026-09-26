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

## 十三、开新会话时提供什么

新会话开始前，按下面清单准备信息，AI 能在 2-5 分钟内进入工作状态。

### 13.1 必须给的（缺一不可）

**1. 两条路径**

```
项目路径：C:\Users\z1804\Desktop\vector-graphics
文档路径：C:\Users\z1804\Desktop\vector-graphics\docs
```

**2. 两份核心文档**

直接把文件**拖进聊天窗口**（比复制粘贴快）：

| 文档 | 为什么必须 |
|---|---|
| `00-project-status.md` | 项目当前状态速查（定位、账号、端口、已做/未做） |
| `07-ai开发规范.md` | 输出格式、PowerShell 陷阱、用户偏好 |

其他文档（01-06、08-12）**不用主动给**，AI 需要时再找。

**3. 当前任务**

一句话说清：

- 要做什么（例：开发社区模块的发布作品功能）
- 为什么做（例：阶段一第一步）
- 有没有约束（例：后端不改数据库表结构）

### 13.2 最好给的（能省好几轮问答）

**4. 服务状态**

```
- vectorizer (8000)：在跑 / 没跑
- esrgan (8001)：在跑 / 没跑
- backend (8080)：在跑 / 没跑
- frontend (3000)：在跑 / 没跑
- Docker 中间件：在跑 / 没跑
```

或者跑一遍命令，把输出贴给 AI：

```powershell
Get-NetTCPConnection -LocalPort 3000,8000,8001,8080 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalPort
```

**5. 有没有报错**

有报错直接贴日志，**比描述一百句都强**：

- 后端：终端里 `[backend] ERROR` 附近的内容
- 前端：浏览器 Console 的红色报错
- Python：Traceback 完整栈

**6. Git 状态**

```powershell
cd C:\Users\z1804\Desktop\vector-graphics
git status
git log --oneline -3
```

### 13.3 开场模板（直接复制）

```
项目路径：C:\Users\z1804\Desktop\vector-graphics
文档路径：C:\Users\z1804\Desktop\vector-graphics\docs

附件：
【1】00-project-status.md（已拖入）
【2】07-ai开发规范.md（已拖入）

当前任务：
<一句话说明要做什么>

服务状态：
- vectorizer (8000)：<在跑/没跑>
- esrgan (8001)：<在跑/没跑>
- backend (8080)：<在跑/没跑>
- frontend (3000)：<在跑/没跑>
- Docker：<在跑/没跑>

报错：
<有就贴日志，没有就写"无">

Git：
<贴 git status 和 git log --oneline -3 输出>

要求：
严格按 07-ai开发规范.md 执行。特别记住：
1. 写 md 文件内容用四条反引号包裹，纯 Markdown，不嵌脚本
2. 写 Python / Java 文件不要用 Set-Content -Encoding UTF8，用 UTF8Encoding($false)
3. 修改文件前先读原文件，大改动先备份
4. 每步先确认输出，再进下一步
5. 代码注释要写全：Java 类头 Javadoc，Python 函数 docstring，复杂逻辑行内注释
```

### 13.4 最小示例

假设要开发社区模块的发布作品功能，直接发这样一段：

```
项目路径：C:\Users\z1804\Desktop\vector-graphics
文档路径：C:\Users\z1804\Desktop\vector-graphics\docs

附件：
（把 00 和 07 两份文档拖进聊天窗口）

当前任务：
开发社区模块第一部分：发布作品。
- 后端：modules/community 建 Post 实体 + PostMapper + PostService + PostController
- 后端：POST /api/community/posts 发布作品，接收 title + description + fileIds
- 前端：(main)/community/publish 页面，选自己的文件，填标题描述，提交
- 导航栏加"社区"入口

服务状态：
- vectorizer (8000)：在跑
- esrgan (8001)：在跑
- backend (8080)：在跑
- frontend (3000)：在跑
- Docker：在跑

报错：无

Git：
working tree clean，最新提交 39ce0dd

要求：
严格按 07-ai开发规范.md 执行。
1. 先看 posts 表结构再写代码
2. 后端写 Javadoc，前端组件写用途注释
3. 每写一个文件先确认，再写下一个
4. 不要一次给 5 个方案，给最推荐的
```

### 13.5 投入对比

| 你给的信息 | AI 进入状态需要 |
|---|---|
| 只说"我要开发社区模块" | 20-30 分钟（反复问） |
| 给 00 + 07 + 任务 | 5 分钟（直接开工） |
| 给 00 + 07 + 任务 + 服务状态 + git | 2 分钟（立即写代码） |

**最省时间的做法**：把 `docs\00-project-status.md` 和 `docs\07-ai开发规范.md` 两个文件**直接拖进聊天窗口**，再加上当前任务的一句话说明。

### 13.6 AI 收到信息后应该做的

AI 拿到上述信息后，第一步不是直接写代码，而是：

1. **复述任务**：用一句话确认理解正确
2. **列出计划**：要改哪些文件，分几步
3. **等确认**：用户说"开始"后再动手
4. **逐步执行**：每步先读原文件，改完给验证方式
5. **同步文档**：功能完成后更新 `00-project-status.md`

如果 AI 跳过了前 3 步直接开始改文件，用户可以提醒它回到 `07-ai开发规范.md` 的「二、会话开始固定流程」。




---

## 附录：2026-09-26 社区模块完成

### 一、已实现功能（新增）

| 模块 | 后端 | 前端 |
|---|---|---|
| 社区发布（标题+描述+多文件+标签） | ✅ | ✅ |
| 社区广场（Banner + 三按钮 + 最新作品） | — | ✅ |
| 公开作品页（排序/热度/标签筛选/分页） | ✅ | ✅ |
| 作品详情（大图/多图切换/点赞/收藏/评论） | ✅ | ✅ |
| 标签页 + 标签筛选 | ✅ | ✅ |
| 搜索页（关键词 + 时间 + 格式 + 标签包含/排除 + 历史） | ✅ | ✅ |
| 热度排行（日/周/月/年/总） | ✅ | ✅ |
| 个人中心（左右结构 + 4 统计 + 公开作品/动态） | ✅ | ✅ |
| 收藏夹（创建/编辑/删除/按夹收藏） | ✅ | ✅ |
| 随机作品 | ✅ | ✅ |

### 二、数据库迁移

| 版本 | 内容 |
|---|---|
| V3 | 扩展社区表（view_count / post_files 快照字段 / tags.usage_count） |
| V4 | 互动索引 |
| V5 | 收藏夹表 + favorites.folder_id |

### 三、关键修复

| 问题 | 解决方案 |
|---|---|
| MyBatis-Plus 分页 total 恒为 0 | 补 `MybatisPlusConfig` 注册 `PaginationInnerInterceptor` |
| React StrictMode 双调用导致浏览量 +2 | 拆出 `POST /posts/{id}/view`，前端用 `useRef` 守卫 |
| 换账号后个人中心残留上一个用户数据 | `useEffect([username])` 清空所有状态 |

### 四、待开发

| 模块 | 状态 |
|---|---|
| 管理员后台（权限已预留） | 未开始 |
| 通知系统 | 未开始 |
| SVG 安全清洗 | 未开始 |
| 生产存储（R2/OSS） | 未开始 |
| Redis / RabbitMQ 业务接入 | 已配置未使用 |