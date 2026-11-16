# 旅迹 Travelog · Java 后端

Spring Boot 3.4 + Java 21 实现的 Travelog REST API，按 `../travel-docs/openapi.yaml`
的路径、统一信封与错误码组织，覆盖认证、城市/到访、旅行、回忆盒、媒体、共享、组队、
公共内容、AI、通知与后台管理。

## 运行

要求 **JDK 21**、**Maven 3.9+**。

```bash
cd travelog-server
mvn spring-boot:run
# 或
mvn -DskipTests package
java -jar target/travelog-server-1.0.0.jar
```

服务地址：`http://localhost:8080`，API 前缀：`http://localhost:8080/api/v1`。

演示账号（验证码固定，仅本地）：

```json
{"phone":"13800000000","code":"123456"}
```

```bash
curl -s http://localhost:8080/api/v1/health

TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/sessions/sms \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800000000","code":"123456"}' | jq -r '.data.accessToken')

curl -s http://localhost:8080/api/v1/me -H "Authorization: Bearer $TOKEN"
curl -s 'http://localhost:8080/api/v1/cities?q=da&size=10'
curl -s http://localhost:8080/api/v1/memory-boxes -H "Authorization: Bearer $TOKEN"
```

`requests.http` 里有一组可直接在 IntelliJ HTTP Client 里执行的请求。

## 统一约定

**响应信封**

```json
{ "code": 0, "message": "ok", "data": {}, "traceId": "b1f0..." }
```

失败时 `code` 为稳定字符串（如 `POST_403_03`、`AUTH_401_01`），HTTP 状态同步：
400 / 401 / 403 / 404 / 409 / 410 / 422 / 429 / 500。`traceId` 同时写入 `X-Trace-Id` 响应头，
请求可用 `X-Request-Id` 透传。

**认证**：`Authorization: Bearer <accessToken>`，HS256 JWT，access 2 小时、refresh 30 天。
公开接口：健康检查、城市列表/详情、帖子 GET、文化卡、问答 GET、分享链接 GET、`/photos/**`。

**分页**：`{ items, page, size, total, hasMore }`，`page` 从 1 开始，`size` 上限 100。

**CORS**：放行 `http://localhost:*`、`http://127.0.0.1:*`、`capacitor://localhost`、`https://localhost`。

## 已实现接口

| 模块 | 接口 |
|---|---|
| 认证 | 发送验证码、短信/微信/Apple 登录、刷新、退出 |
| 我的 | 资料、设置、实名、注销/撤销、设备、收藏、通知与通知设置、黑名单、举报 |
| 城市 | 城市列表/搜索、省级完成度、当前城市、城市详情、城市卡 |
| 定位到访 | 定位点批量上报（满足 30 分钟 + 2 点自动点亮）、定位状态、到访列表/汇总/详情/删除、手动补录、申诉 |
| 旅行 | 旅行列表/详情、合并、拆分 |
| 回忆盒 | 列表/创建/详情/修改/删除/恢复、素材增删、排版、导出、分享链接创建/撤销/公开访问 |
| 媒体 | 预签名上传意图、完成上传、查询、删除 |
| 共享 | 开启/当前/关闭、同城大厅、喜欢、收到的喜欢、匹配 |
| 组队 | 创建、详情、入队申请、审批、移除、转让、解散、消息、集合点 |
| 公共内容 | 此刻/今日/经验列表、发布、编辑、删除、有效/失效投票、点赞、收藏、评论、续期、举报 |
| 文化/问答 | 文化卡列表/详情、问题列表/提问/回答 |
| AI | 会话创建/查询/删除、提问、反馈、额度 |
| 后台 | 审核列表/决定、举报列表/决定、用户列表/封禁、城市列表/修改/导入、开关、指标 |

共 80+ 个 operation，路径与 OpenAPI 文档一致；少数文档中的扩展字段在 DTO 中按需保留。

## 代码结构

```
travelog-server/
├─ src/main/java/cn/travelog/
│  ├─ auth/        JWT 签发校验、登录拦截器
│  ├─ common/      ApiResponse / ApiException / 全局异常 / TraceId / 分页
│  ├─ config/      CORS、拦截器、静态资源
│  ├─ model/       Models.java（领域模型，公共字段）
│  ├─ service/     Auth / City / Memory / Post / Share / Team / AI / Me / Admin / Content / Views
│  ├─ store/       DataStore：内存仓储 + 演示种子数据
│  └─ web/         11 个 Controller
├─ src/main/resources/
│  ├─ application.yml
│  └─ static/photos/  演示图片（API 返回 /photos/picXX.jpg）
└─ src/test/java/  ApiSmokeTest（5 个集成测试）
```

请求链路：`TraceIdFilter → AuthInterceptor → Controller → Service → DataStore`，
异常统一由 `GlobalExceptionHandler` 转为信封，`Views` 负责对外投影（不泄露手机号与 admin 标志）。

## 数据与存储

当前使用 `DataStore` 的并发 Map，**重启即重置**，方便本地演示与前端联调。
种子数据包括 64 个城市、6 个已点亮城市、6 条到访、4 个回忆盒、6 条公共内容、
6 位同城用户、1 支队伍、4 条通知、2 条审核任务。

生产化时按技术文档替换：

| 当前 | 生产 |
|---|---|
| `DataStore` Map | PostgreSQL 16 + PostGIS + pgvector，Spring Data JPA |
| 内存 token/验证码 | Redis（验证码、refresh 黑名单、限流） |
| 同步事件 | Kafka / Spring Modulith 事件 |
| `/photos` 静态图 | MinIO / OSS 预签名上传 |
| 规则式 AI | Python FastAPI AI 服务（`AI_SERVICE_URL`） |
| 单机限流 | Bucket4j / 网关限流 + `Idempotency-Key` 持久化 |

## 测试

```bash
mvn test
```

结果：**5 tests passed**，覆盖健康检查、登录与资料、拼音城市搜索、未登录 401、发布内容与自投票 403。
Maven 已排除 Mockito（本机沙箱禁止 ByteBuddy 自附加），测试使用 `TestRestTemplate` 走真实 HTTP。

手动联调已覆盖：登录 → 当前城市 → 回忆盒 → 发布/点赞/评论 → 开启共享 → 大厅 → 互相喜欢 →
自动建队 → 队伍消息 → AI 路线 → 管理后台指标 → 公开分享链接。

## 已知边界

- 内存存储，无持久化、无多实例会话共享。
- 验证码固定 `123456`，微信/Apple 为演示登录；未接真实短信与 OAuth。
- 上传只返回本地假预签名地址，未接对象存储。
- AI 为规则引擎，未调用大模型；接口形状与来源字段已按文档保留。
- 未实现 SSE 流式输出、`Idempotency-Key` 响应重放、真实风控与内容审核队列。
- 抖音/小红书式推荐、PostGIS 边界判定、Geofencing 需在生产实现。

## 与前端联调

前端 `travelog-app` 当前使用本地 mock。切换时在 `src/api/index.ts` 保留方法签名，
把内部实现改为 `fetch(VITE_API_BASE_URL + path)`，并：

1. 登录后保存 `accessToken`，请求头加 `Authorization: Bearer ...`；
2. 统一解包 `{ code, message, data, traceId }`，非 0 抛错；
3. 分页接口使用 `items/page/size/total/hasMore`；
4. 城市、回忆盒、帖子字段可直接映射到现有 `types.ts`，图片使用后端 `/photos/...`。

Android 壳访问本机后端：模拟器用 `http://10.0.2.2:8080`，真机用局域网 IP；
`network_security_config.xml` 已放行 `10.0.2.2` 与 `localhost` 的明文（仅开发）。
