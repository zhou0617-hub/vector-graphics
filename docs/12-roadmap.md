# 远期路线图

本文件存放**尚未实现的规划内容**。当前状态见 `00-project-status.md`。

**最后更新**：2026-09-25

---

## 一、生产部署规划

**状态**：规划中，尚未实际部署。

### 1.1 服务拆分

| 服务 | 推荐平台 | 说明 |
|---|---|---|
| 前端 Next.js | Vercel | 零配置部署，自动 CDN |
| 后端 Spring Boot | Railway / Fly.io / 阿里云 ECS | 容器化部署 |
| 矢量化服务 FastAPI | Railway / Fly.io | 独立容器，CPU 即可 |
| 超分服务 FastAPI | 云 GPU（AutoDL / 恒源云 / RunPod） | 需 GPU，按小时付费 |
| MySQL | PlanetScale / AWS RDS / 阿里云 RDS | 托管数据库 |
| Redis | Upstash / 阿里云 Redis | 按量付费 |
| RabbitMQ | CloudAMQP / 阿里云 RabbitMQ | 托管队列 |
| 文件存储 | Cloudflare R2 / 阿里云 OSS | 对象存储 |

### 1.2 后端 Dockerfile

```dockerfile
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline
COPY src/ src/
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 1.3 生产环境变量

| 变量 | 说明 |
|---|---|
| SPRING_PROFILES_ACTIVE | prod |
| SPRING_DATASOURCE_URL | 数据库连接 URL |
| SPRING_DATASOURCE_USERNAME | 数据库用户 |
| SPRING_DATASOURCE_PASSWORD | 数据库密码 |
| SPRING_DATA_REDIS_HOST | Redis 地址 |
| SPRING_RABBITMQ_HOST | RabbitMQ 地址 |
| APP_JWT_SECRET | JWT 密钥（至少 32 字节随机） |
| APP_VECTORIZER_BASE_URL | 矢量化服务地址 |
| APP_ESRGAN_BASE_URL | 超分服务地址 |
| APP_STORAGE_TYPE | r2 或 oss |

### 1.4 存储切换（本地 → R2）

新增 `R2StorageService`，用 `@ConditionalOnProperty` 切换：

```java
@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "r2")
public class R2StorageService implements StorageService {
    // R2 兼容 S3 协议，用 AWS S3 SDK 实现
}
```

`LocalStorageService` 上已有 `matchIfMissing = true`，所以 `type=r2` 时自动不加载。

### 1.5 生产环境检查清单

- [ ] JWT secret 改为 32 字节以上随机字符串
- [ ] 数据库密码改为强密码
- [ ] 存储切换到 R2 或 OSS
- [ ] CORS 只允许前端域名
- [ ] 关闭 Swagger（或加密码）
- [ ] 配置日志收集
- [ ] 配置数据库自动备份
- [ ] 配置 HTTPS
- [ ] 前端 `NEXT_PUBLIC_API_BASE_URL` 指向生产后端
- [ ] 完整链路测试：注册 → 登录 → 上传 → 转换 → 下载

### 1.6 回滚策略

- **后端**：Railway / Fly.io 支持一键回滚到之前版本
- **数据库**：Flyway 社区版不支持自动回滚，需手动反向 SQL 或从备份恢复
- **建议**：每次部署前先备份数据库

---

## 二、待实现功能总清单

### 矢量图形创建

| 功能 | 状态 |
|---|---|
| 栅格图转 SVG | ✅ 已实现 |
| 文本描述生成 SVG | ❌ |
| 手动绘制 SVG | ❌ |
| 多张图合成 SVG | ❌ |
| SuperSVG（GPU 高质量） | ❌ |
| Word-As-Image（文本排版） | ❌ |
| SketchAgent（交互式草图） | ❌ |

### 矢量图形编辑

| 功能 | 状态 |
|---|---|
| 简易 SVG 编辑器 | ❌ |
| 修改填充/描边色 | ❌ |
| 添加基本图形 | ❌ |
| 对齐/分布工具 | ❌ |
| 撤销/重做 | ❌ |
| 快捷键 | ❌ |
| 自动保存草稿 | ❌ |
| 文本描述修改 SVG | ❌ |

### 二维场景合成

| 功能 | 状态 |
|---|---|
| 视觉场景合成 | ❌ |
| 文本场景合成 | ❌ |
| 场景元素布局 | ❌ |

### 二维动画

| 功能 | 状态 |
|---|---|
| SVG 转动画 | ❌ |
| 路径动画 | ❌ |
| 逐帧动画 | ❌ |
| 导出 GIF / MP4 | ❌ |

### 社区与协作

| 功能 | 状态 |
|---|---|
| 发布作品 | ❌ |
| 社区广场 | ❌ |
| 点赞 | ❌ |
| 收藏 | ❌ |
| 评论/回复 | ❌ |
| 标签/分类 | ❌ |
| 搜索/筛选 | ❌ |
| 热门榜 | ❌ |
| 合集/专题 | ❌ |
| 举报 | ❌ |
| 关注/粉丝 | ❌ |
| 私信 | ❌ |
| Fork/二次创作 | ❌ |
| 团队协作 | ❌ |
| 创作者认证 | ❌ |

### 分享与导出

| 功能 | 状态 |
|---|---|
| 下载 SVG / PNG | ✅ 已实现 |
| 分享转换结果 | ❌ |
| 分享链接 | ❌ |
| 导出 PDF | ❌ |
| 嵌入代码 | ❌ |
| 二维码分享 | ❌ |
| 社交媒体分享 | ❌ |

### 商业化

| 功能 | 状态 |
|---|---|
| 免费额度 | ❌ |
| 订阅计划 | ❌ |
| 按量付费 | ❌ |
| 发票/收据 | ❌ |
| 优惠码 | ❌ |
| 邀请奖励 | ❌ |
| 团队版 | ❌ |

### 开放 API

| 功能 | 状态 |
|---|---|
| API 文档 | ❌ |
| API Key 管理 | ❌ |
| 调用额度统计 | ❌ |
| SDK | ❌ |
| Webhook | ❌ |
| 沙盒测试 | ❌ |
| 状态页 | ❌ |

### 管理员与内容治理

| 功能 | 状态 |
|---|---|
| 管理员角色 | 🟡 字段预留 |
| 管理后台 | ❌ |
| 用户管理 | ❌ |
| 作品管理 | ❌ |
| 评论管理 | ❌ |
| 举报处理 | ❌ |
| 标签管理 | ❌ |
| 数据统计 | ❌ |
| 操作日志 | ❌ |
| 敏感词过滤 | ❌ |
| 版权投诉处理 | ❌ |

### 通知系统

| 功能 | 状态 |
|---|---|
| 站内通知 | ❌ |
| 邮件通知 | ❌ |
| 未读标记 | ❌ |
| 通知设置 | ❌ |
| WebSocket 推送 | ❌ |

### 基础设施

| 功能 | 状态 |
|---|---|
| 异步队列 | 🟡 已配置 |
| 批量转换 | ❌ |
| Redis 缓存 | 🟡 已配置 |
| 限流 | ❌ |
| SSE 实时进度 | ❌ |
| 生产存储（R2/OSS） | ❌ |
| CDN 加速 | ❌ |
| 分布式锁 | ❌ |
| SVG 安全清洗 | ❌ |

### 安全与合规

| 功能 | 状态 |
|---|---|
| 邮箱验证 | ❌ |
| 忘记密码 | ❌ |
| 二步验证 | ❌ |
| 登录失败限制 | ❌ |
| 密码强度校验 | ❌ |
| 敏感日志过滤 | ❌ |
| 隐私政策 | ❌ |
| 服务条款 | ❌ |
| Cookie 同意 | ❌ |
| 数据导出 | ❌ |
| 账号注销 | ❌ |

### 部署与运维

| 功能 | 状态 |
|---|---|
| 生产部署 | ❌ |
| CI/CD | ❌ |
| 监控告警 | ❌ |
| 日志收集 | ❌ |
| 数据库自动备份 | ❌ |
| 灰度发布 | ❌ |
| 压测 | ❌ |

### 测试

| 功能 | 状态 |
|---|---|
| 后端单元测试 | ❌ |
| 后端集成测试 | ❌ |
| 前端单元测试 | ❌ |
| 前端 E2E 测试 | ❌ |
| 接口自动化 | ❌ |
| 性能测试 | ❌ |

### 国际化与主题

| 功能 | 状态 |
|---|---|
| 多语言 | ❌ |
| 亮色主题 | ❌ |
| 时区处理 | ❌ |
| 无障碍 | ❌ |

---

## 三、阶段路线图

### 阶段一：产品闭环（近期）

1. 社区模块（发布 → 广场 → 详情 → 互动）
2. SVG 安全清洗
3. 转换进度实时反馈（SSE）
4. 生产部署

### 阶段二：能力增强（中期）

- 简易 SVG 编辑器
- 文本描述生成 SVG
- 管理员后台
- 通知系统
- 异步队列应用
- Redis 缓存应用

### 阶段三：高级功能（远期）

- 高质量矢量化（SuperSVG）
- 二维场景合成
- 二维动画
- 开放 API
- 商业化
- CI/CD + 监控
