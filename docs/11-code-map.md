# 代码地图

本文件用于快速定位：**给定一个功能，涉及哪些文件**。

新会话开始时，AI 通过这张表快速找到相关代码，避免满仓库搜索。

---

## 一、后端功能定位

### 用户认证

| 层 | 文件 |
|---|---|
| 接口 | `modules/auth/controller/AuthController.java` |
| 业务 | `modules/auth/service/AuthService.java` |
| DTO | `modules/auth/dto/RegisterRequest.java`、`LoginRequest.java`、`LoginResponse.java` |
| 实体 | `modules/user/entity/User.java` |
| 数据 | `modules/user/repository/UserMapper.java` |
| JWT | `security/JwtTokenProvider.java`、`JwtAuthenticationFilter.java` |
| 安全配置 | `config/SecurityConfig.java` |

**端点**：`POST /api/auth/register`、`POST /api/auth/login`

### 用户资料

| 层 | 文件 |
|---|---|
| 接口 | `modules/user/controller/UserController.java` |
| 业务 | `modules/user/service/UserService.java` |
| DTO | `modules/user/dto/UserResponse.java`、`UpdateProfileRequest.java`、`UpdateUsernameRequest.java`、`UpdatePasswordRequest.java` |
| 转换 | `modules/user/converter/UserConverter.java` |

**端点**：`GET/PATCH /api/users/me`、`PATCH /api/users/me/username`、`PATCH /api/users/me/password`、`POST /api/users/me/avatar`、`GET /api/users/{username}`

### 图片转 SVG

| 层 | 文件 |
|---|---|
| 接口 | `modules/conversion/controller/ConversionController.java#convert` |
| 业务 | `modules/conversion/service/ConversionService.java#convert` |
| Python 客户端 | `infrastructure/vectorizer/VectorizerClient.java` |
| 配置 | `infrastructure/vectorizer/VectorizerProperties.java` |
| Python 服务 | `vectorizer/app/api/routes.py`、`app/services/engines/vtracer_engine.py` |

**端点**：`POST /api/conversions/convert`

### AI 放大（超分）

| 层 | 文件 |
|---|---|
| 接口 | `modules/conversion/controller/ConversionController.java#upscale` |
| 业务 | `modules/conversion/service/ConversionService.java#upscale` |
| Python 客户端 | `infrastructure/esrgan/EsrganClient.java` |
| 配置 | `infrastructure/esrgan/EsrganProperties.java` |
| Python 服务 | `esrgan-service/app/api/routes.py`、`app/services/engines/realesrgan_engine.py` |

**端点**：`POST /api/conversions/upscale`

### 转换记录查询

| 层 | 文件 |
|---|---|
| 接口 | `modules/conversion/controller/ConversionController.java#getById` |
| 业务 | `modules/conversion/service/ConversionService.java#getById` |
| DTO | `modules/conversion/dto/ConversionResponse.java` |

**端点**：`GET /api/conversions/{id}`

### 文件管理

| 层 | 文件 |
|---|---|
| 接口 | `modules/file/controller/FileController.java` |
| 业务 | `modules/file/service/FileService.java` |
| DTO | `modules/file/dto/FileResponse.java`、`BatchDeleteRequest.java` |
| 转换 | `modules/file/converter/FileConverter.java` |
| 实体 | `modules/file/entity/FileEntity.java` |
| 数据 | `modules/file/repository/FileMapper.java` |

**端点**：`GET /api/files/my`、`DELETE /api/files/{id}`、`POST /api/files/batch-delete`

### 文件存储

| 层 | 文件 |
|---|---|
| 接口 | `infrastructure/storage/StorageService.java` |
| 本地实现 | `infrastructure/storage/LocalStorageService.java` |
| 配置 | `infrastructure/storage/StorageProperties.java` |
| 静态映射 | `config/WebMvcConfig.java` |

---

## 二、前端功能定位

### 页面

| 路由 | 文件 |
|---|---|
| `/` | `app/page.tsx` |
| `/login` | `app/(auth)/login/page.tsx` |
| `/register` | `app/(auth)/register/page.tsx` |
| `/tools/image-to-svg` | `app/(main)/tools/image-to-svg/page.tsx` |
| `/tools/image-upscale` | `app/(main)/tools/image-upscale/page.tsx` |
| `/my/files` | `app/(main)/my/files/page.tsx` |
| `/profile/[username]` | `app/(main)/profile/[username]/page.tsx` |
| `/settings` | `app/(main)/settings/page.tsx` |

### API 调用

| 功能 | 文件 |
|---|---|
| 通用请求 | `lib/api/client.ts` |
| 认证 | `lib/api/auth.ts` |
| 用户 | `lib/api/users.ts` |
| 转换 | `lib/api/conversion.ts` |
| 超分 | `lib/api/upscale.ts` |
| 文件 | `lib/api/files.ts` |

### 状态管理

| 状态 | 文件 |
|---|---|
| 认证态 | `stores/auth-store.ts`（Zustand + localStorage 持久化） |
| 服务端状态 | TanStack Query（Provider 在 `components/providers.tsx`） |

### 关键组件

| 组件 | 文件 | 作用 |
|---|---|---|
| 导航栏 | `components/layout/header.tsx` | 卡片式导航 + 头像下拉框 |
| 全局 Provider | `components/providers.tsx` | QueryClient + hydrate |
| 登录守卫 | `components/require-auth.tsx` | 未登录跳 /login |
| 图片查看器 | `components/image-viewer.tsx` | 全屏 + 缩放 + 拖拽 |
| 头像裁剪 | `components/avatar-cropper.tsx` | react-easy-crop |
| 粒子动画 | `components/particle-progress.tsx` | 超分进度效果 |

---

## 三、数据库表定位

| 表 | 相关 Java 文件 |
|---|---|
| `users` | `modules/user/` |
| `files` | `modules/file/` |
| `conversions` | `modules/conversion/` |
| `posts` / `comments` / `likes` / `favorites` / `tags` / `post_tags` / `reports` | ⏳ 预留，无代码 |

**迁移脚本**：`backend/src/main/resources/db/migration/`

---

## 四、Python 服务定位

### vectorizer（端口 8000）

| 功能 | 文件 |
|---|---|
| 入口 | `app/main.py` |
| 路由 | `app/api/routes.py` |
| 引擎接口 | `app/services/engines/base.py` |
| VTracer 实现 | `app/services/engines/vtracer_engine.py` |
| 服务层 | `app/services/vectorizer.py` |

### esrgan-service（端口 8001）

| 功能 | 文件 |
|---|---|
| 入口 | `app/main.py` |
| 路由 | `app/api/routes.py` |
| 引擎接口 | `app/services/engines/base.py` |
| Real-ESRGAN 实现 | `app/services/engines/realesrgan_engine.py` |
| 服务层 | `app/services/upscaler.py` |
| 权重目录 | `weights/` |

---

## 五、配置文件定位

| 文件 | 作用 |
|---|---|
| `backend/src/main/resources/application.yml` | 主配置（端口、上传限制、MyBatis-Plus） |
| `backend/src/main/resources/application-dev.yml` | 开发环境（MySQL、Redis、RabbitMQ、JWT、esrgan） |
| `frontend/.env.local` | 前端环境变量（API 地址） |
| `vectorizer/.env` | 矢量化服务配置 |
| `esrgan-service/.env` | 超分服务配置 |
| `docker-compose.yml` | 中间件容器定义 |
| `scripts/start-dev.js` | 一键启动脚本 |

---

## 六、常用数据库操作

```powershell
# 查看所有表
docker exec vg-mysql mysql -uznyh -pZnyh617617 vector_graphics -e "SHOW TABLES;"

# 查看用户
docker exec vg-mysql mysql -uznyh -pZnyh617617 vector_graphics -e "SELECT id, email, username FROM users;"

# 查看最近转换
docker exec vg-mysql mysql -uznyh -pZnyh617617 vector_graphics -e "SELECT id, file_id, source_format, target_format, status FROM conversions ORDER BY id DESC LIMIT 5;"

# 查看迁移历史
docker exec vg-mysql mysql -uznyh -pZnyh617617 vector_graphics -e "SELECT version, description, success FROM flyway_schema_history;"
```

---

## 七、功能→文件速查

| 想改什么 | 打开哪个文件 |
|---|---|
| 登录逻辑 | `modules/auth/service/AuthService.java` |
| JWT 有效期 | `application-dev.yml` 的 `app.jwt.expiration` |
| 上传大小限制 | `application.yml` 的 `spring.servlet.multipart.max-file-size` |
| SVG 转换参数 | `modules/conversion/service/ConversionService.java#convert` |
| 超分模型选择 | `esrgan-service/app/api/routes.py` |
| 超分 tile 大小 | `esrgan-service/app/services/engines/realesrgan_engine.py#_detect_device` |
| 首页文案 | `app/page.tsx` |
| 导航栏 | `components/layout/header.tsx` |
| 超分粒子动画 | `components/particle-progress.tsx` |
| 数据库新字段 | `backend/src/main/resources/db/migration/V{N}__*.sql` |
| 新增 API | `modules/{模块}/controller/` + `service/` + `dto/` |



