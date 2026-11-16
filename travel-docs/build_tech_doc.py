# -*- coding: utf-8 -*-
import os
import sys
import json

sys.path.insert(0, os.path.dirname(__file__))
import docx_kit as K

OUT = os.path.join(os.path.dirname(__file__), "01-技术架构与技术栈.docx")
TOC_JSON = os.path.join(os.path.dirname(__file__), "toc-tech.json")
ASSETS = os.path.join(os.path.dirname(__file__), "assets")


def build():
    doc = K.new_doc("旅迹 Travelog · 技术架构与技术栈", "Java + TypeScript 技术方案")
    K.header_footer(doc, "旅迹 Travelog · 技术架构与技术栈")
    K.cover(
        doc,
        "TECHNICAL DESIGN DOCUMENT · 技术方案",
        "技术架构与技术栈",
        "Java 21 + Spring Boot 模块化单体 · React 19 + TypeScript · Python AI 服务",
        [
            ("文档版本", "V1.0（评审稿）"),
            ("编制日期", "2026 年 10 月 24 日"),
            ("适用阶段", "立项评审、M1–M3 开发与上线"),
            ("阅读对象", "架构、后端、前端、测试、运维、安全与法务"),
            ("关联文档", "《软件需求规格说明书》《接口文档》"),
        ],
        "本文件定义系统的总体架构、技术选型、模块边界、数据与部署方案；需求口径以 SRS 为准，接口字段以接口文档与 OpenAPI 为准。",
    )
    K.toc(doc, json.load(open(TOC_JSON, encoding="utf-8")) if os.path.exists(TOC_JSON) else None)

    blocks = []
    a = blocks.append

    # ---------------- 1 ----------------
    a(("h1pb", "1 摘要与范围"))
    a(("h2", "1.1 文档目的"))
    a(("p", "本文回答四个问题：系统由哪些部分组成、为什么这样选型、每个领域的边界与关键算法是什么、如何部署与演进。它面向即将开始的 M1 开发，要求读者能据此拆分任务、评估工作量并做技术评审，而不是一份泛化的架构科普。"))
    a(("p", "产品范围严格对齐《旅游记录 App 产品需求文档 V1.0》与《软件需求规格说明书》：首版覆盖城市点亮、回忆盒、共享组队、公共区域与 AI 助手五个模块，仅面向中国大陆城市与中文用户，不做站内交易、不做陌生人私信、不做直播与长视频。"))

    a(("h2", "1.2 设计范围"))
    a(("table", ["范围", "包含", "不包含（本期）"], [
        ["终端", "移动端 PWA / H5、iOS 与 Android 原生壳、运营管理后台", "桌面客户端、小程序首发"],
        ["后端", "账号、城市与到访、旅行与回忆盒、共享与队伍、公共内容、AI 编排、通知、审核后台", "机票酒店交易、支付与退改、IM 私信"],
        ["数据", "PostgreSQL + PostGIS、Redis、对象存储、Kafka", "数据仓库与实时数仓（二期）"],
        ["AI", "行程规划、实时问答、附近推荐、游记草稿、来源标注", "模型训练、语音对话、图像生成"],
        ["地域", "中国大陆城市（地级及以上行政区）", "海外城市、多语言、多币种"],
    ], [3.0, 8.6, 5.2]))

    a(("h2", "1.3 关键决策一览"))
    a(("table", ["决策点", "选择", "理由与代价"], [
        ["服务形态", "模块化单体优先（Spring Modulith），按领域边界预留拆分", "首版 6–8 人团队，单体交付最快；模块边界与事件解耦保证后续可拆。代价是进程内耦合需要靠架构测试约束。"],
        ["前端形态", "React + TypeScript 的 PWA，Capacitor 套壳上架", "一套代码覆盖 H5、iOS、Android 与后台；地图与相册桥接由原生插件补齐。"],
        ["AI 位置", "独立 Python 服务，Java 只做业务编排与权限", "模型与 RAG 生态在 Python 更成熟；Python 不持有业务主数据，故障时可降级。"],
        ["主数据库", "PostgreSQL + PostGIS + pgvector", "城市边界、地理围栏、向量检索共用一套库，减少组件数量。"],
        ["异步", "事务 Outbox + Kafka", "避免双写不一致；媒体处理、审核、通知、统计全部异步化。"],
        ["接口契约", "OpenAPI 3.1 为唯一事实源，生成 TS 类型与 Java 接口", "前后端并行开发，减少字段漂移。"],
    ], [3.0, 6.2, 7.6]))

    a(("h2", "1.4 术语"))
    a(("table", ["术语", "含义"], [
        ["点亮", "用户真实到达城市并满足停留条件后，城市在地图上长期高亮"],
        ["到访 Visit", "一次连续停留记录，同城 24 小时内只生成一条"],
        ["旅行 Trip", "由时间与地点自动识别的一段出行，可包含多个城市"],
        ["回忆盒", "一次旅行的私密素材合集，含照片、视频、文字与地点"],
        ["公共副本", "从私密内容显式发布到公共区域时创建的独立副本，权限与生命周期独立"],
        ["共享会话", "用户在已点亮城市内开启的 24 小时临时社交状态"],
        ["现场标识", "发布时定位在城市内且距地点 ≤ 5 公里，经服务端校验后展示"],
    ], [3.0, 13.8]))

    # ---------------- 2 ----------------
    a(("pagebreak",))
    a(("h1", "2 架构总览"))
    a(("h2", "2.1 设计原则"))
    a(("bullets", [
        "**先单体、后拆分**：以领域模块为单位组织代码，模块间只通过应用服务接口与领域事件通信，禁止跨模块直接访问数据表。",
        "**契约优先**：所有对外接口先写 OpenAPI，再生成前端类型与后端接口骨架；接口变更走版本与兼容性检查。",
        "**私密优先**：私密与公共是两套数据空间；任何对外展示都经过显式的“公共副本 + 位置模糊”流程。",
        "**异步解耦**：媒体处理、内容审核、通知、统计、导出不阻塞主链路，统一走 Outbox 事件。",
        "**可降级**：地图、天气、AI、内容审核任一外部依赖不可用时，主流程仍有兜底路径。",
        "**可观测**：每个请求带 traceId，关键业务事件带业务单号；日志默认脱敏。",
    ]))

    a(("h2", "2.2 逻辑架构"))
    a(("img", os.path.join(ASSETS, "arch.png"), 16.6, "图 2-1 旅迹总体逻辑架构"))
    a(("p", "系统分为五层。客户端层由同一套 React 代码构建 PWA/H5 与 Capacitor 原生壳，后台独立打包；接入层负责 TLS、WAF、路由与统一鉴权；应用层是 Spring Boot 模块化单体、Python AI 服务与异步 Worker；数据层承载主数据、缓存、对象存储与事件流；外部服务层全部为持牌合规供应商。"))

    a(("h2", "2.3 分层职责"))
    a(("table", ["层", "职责", "关键约束"], [
        ["客户端", "交互、离线缓存、定位与相册桥接、埋点", "不参与点亮判定；不在本地保存他人精确位置"],
        ["接入层", "TLS 终止、WAF、限流、JWT 校验、灰度路由", "统一注入 traceId；拒绝未签名内部调用"],
        ["应用层", "领域编排、权限校验、事务、事件发布", "模块间不共享表；跨模块只调用应用服务"],
        ["AI 服务", "Prompt 编排、RAG 检索、模型路由、流式输出", "无业务写权限；只读授权上下文"],
        ["数据层", "持久化、缓存、对象存储、消息", "生产数据不落本地磁盘；静态加密"],
        ["外部服务", "地图、天气、短信、实名、审核、模型", "全部经适配层封装，可替换"],
    ], [2.6, 7.6, 6.6]))

    a(("h2", "2.4 请求链路"))
    a(("p", "以“发布一条此刻”为例，一次写请求的完整路径如下："))
    a(("code", """Client (React)
  └─ POST /api/v1/posts            Authorization: Bearer <JWT>
      └─ Nginx Ingress             TLS / 限流 / traceId
          └─ Spring Security       JWT 解析 → 用户上下文
              └─ content 模块       参数校验 → 现场校验 → 生成公共副本
                  ├─ PostgreSQL     写 posts / post_media（同一事务）
                  ├─ Outbox         写 outbox_event（同一事务）
                  └─ 返回 202         { status: "REVIEWING", postId }
Kafka → moderation-worker
  ├─ 调内容安全接口（文本 + 图片）
  ├─ 通过：posts.status = PUBLISHED，写审核记录
  └─ 不通过：status = REJECTED，通知作者并保留草稿"""))

    a(("h2", "2.5 为什么首版不做微服务"))
    a(("callout", "架构取舍", "首版团队 6–8 人、日活预估 9 万，拆分 8 个微服务会带来网关、注册中心、分布式事务、链路排查与多套流水线的固定成本。模块化单体在代码层已经按领域隔离，配合 Spring Modulith 的依赖校验与事件机制，后续可按“内容审核”“AI”“媒体”三个高负载模块优先拆出。", "info"))
    a(("p", "触发拆分量化条件：单模块独立发布频率高于每周 2 次、或该模块峰值 QPS 超过整体 40%、或团队规模超过 15 人。达到任一条件再评估，不为“架构先进”提前付费。"))

    a(("h2", "2.6 代码仓库结构"))
    a(("p", "采用 pnpm + Gradle 的混合 monorepo：前端与共享类型在 `apps/`、`packages/`，后端在 `server/`，Python 服务在 `ai/`。共享的 OpenAPI 与设计令牌放在 `contracts/`。"))
    a(("code", """travelog/
├─ apps/
│  ├─ mobile/                 # React 19 + Vite PWA
│  ├─ admin/                  # React + Ant Design Pro
│  └─ native-shell/           # Capacitor 工程与原生插件
├─ packages/
│  ├─ api-client/             # OpenAPI 生成的 TS 类型与请求函数
│  ├─ ui/                     # 设计系统与通用组件
│  └─ config/                 # ESLint / TS / Tailwind 共享配置
├─ server/
│  ├─ api/                    # Spring Boot 启动模块
│  ├─ modules/
│  │  ├─ auth/  city/  memory/  media/
│  │  ├─ share/ content/  ai/  admin/
│  │  └─ shared/              # 通用内核：错误码、事件、幂等
│  └─ build.gradle.kts
├─ ai/                        # FastAPI 服务
│  ├─ app/  routers/  rag/  providers/
│  └─ pyproject.toml
├─ worker/                    # Java 异步任务（与 api 共享模块）
├─ contracts/
│  ├─ openapi.yaml
│  └─ events/                 # 领域事件 schema
└─ deploy/                    # Helm / K8s / Flyway"""))

    # ---------------- 3 ----------------
    a(("pagebreak",))
    a(("h1", "3 技术栈"))
    a(("h2", "3.1 总体选型"))
    a(("table", ["层", "技术", "版本", "用途"], [
        ["语言", "Java", "21 LTS", "后端主语言，虚拟线程"],
        ["框架", "Spring Boot + Spring Modulith", "3.4.x / 1.3.x", "Web、事务、模块边界与事件"],
        ["安全", "Spring Security 6 + JJWT", "6.4.x", "JWT、OAuth2、方法级鉴权"],
        ["持久化", "Spring Data JPA + jOOQ", "3.4.x", "CRUD 用 JPA，复杂查询与地理用 jOOQ"],
        ["迁移", "Flyway", "10.x", "数据库版本化，向前兼容"],
        ["接口文档", "springdoc-openapi", "2.7.x", "生成 OpenAPI 3.1"],
        ["前端", "React + TypeScript", "19 / 5.7", "PWA、H5、后台"],
        ["构建", "Vite + pnpm + Turborepo", "6.x / 9.x", "开发与增量构建"],
        ["数据请求", "TanStack Query", "5.x", "缓存、重试、离线状态"],
        ["状态", "Zustand", "5.x", "轻量全局状态"],
        ["样式", "Tailwind CSS + Radix UI", "4.x", "设计令牌与无障碍组件"],
        ["地图", "高德 JS API 2.0 + MapLibre（备用）", "—", "底图、POI、行政区"],
        ["AI 服务", "Python + FastAPI", "3.12 / 0.115", "RAG、模型路由、SSE"],
        ["数据库", "PostgreSQL + PostGIS + pgvector", "16 / 3.4 / 0.7", "主数据、地理、向量"],
        ["缓存", "Redis", "7.4", "缓存、限流、GEO、会话"],
        ["消息", "Kafka（KRaft）", "3.8", "领域事件与异步任务"],
        ["对象存储", "MinIO（自建）/ 阿里云 OSS", "—", "原图、转码、导出物"],
        ["可观测", "OpenTelemetry + Prometheus + Grafana + Loki", "—", "指标、日志、链路"],
        ["部署", "Docker + Kubernetes + Argo CD", "—", "多环境与灰度"],
    ], [2.2, 6.6, 2.8, 5.2]))

    a(("h2", "3.2 后端选型说明"))
    a(("p", "**Java 21**：使用虚拟线程承载 I/O 密集型请求（地图逆地理、对象存储签名、审核回调），在 2C4G 规格下可稳定支撑 800–1000 并发连接，避免过早引入 WebFlux 带来的复杂度。"))
    a(("p", "**Spring Modulith**：用包结构与 `@ApplicationModule` 声明模块，`ApplicationModules.of()` 做架构测试，禁止跨模块引用内部类型；模块间同步调用走 `@NamedInterface` 暴露的应用服务，异步走事件。"))
    a(("p", "**JPA + jOOQ 并存**：普通聚合用 JPA，避免手写 SQL；城市边界相交、附近内容、排行榜等复杂查询用 jOOQ，类型安全且可读。禁止在 Controller 直接拼 SQL。"))
    a(("p", "**Spring Security**：统一 JWT 过滤器，方法级 `@PreAuthorize`；共享、发布、审核等敏感动作额外做资源级校验（当前用户是否拥有该对象）。"))
    a(("p", "**Resilience4j**：对地图、天气、审核、LLM 四类外部依赖配置熔断、超时与重试；重试只用于幂等读操作。"))

    a(("h2", "3.3 前端选型说明"))
    a(("p", "**React 19 + TypeScript 严格模式**：`strict: true`、`noUncheckedIndexedAccess` 开启；接口类型全部由 OpenAPI 生成，禁止手写重复类型。"))
    a(("p", "**TanStack Query**：统一管理服务端状态、缓存失效与重试；离线场景配合 IndexedDB 队列，将定位点、草稿与待发布内容暂存。"))
    a(("p", "**PWA 与壳**：Workbox 做静态资源与图片缓存；Capacitor 提供定位、相册、相机、推送与安全存储插件；上架包与 H5 共用业务代码，仅桥接层不同。"))
    a(("p", "**地图**：高德 JS API 2.0 作为主底图（GCJ-02 坐标），MapLibre 仅用于内部调试与海外预留；所有坐标在服务端统一转为 GCJ-02 后入库，避免坐标系混用。"))
    a(("p", "**设计系统**：Tailwind 令牌与 `packages/ui` 组件保持一致；移动端以 390×844 为基准，支持安全区与字体缩放。"))

    a(("h2", "3.4 Python 辅助服务"))
    a(("p", "Python 只承担三类职责，且不持有业务主数据："))
    a(("table", ["服务", "职责", "边界"], [
        ["ai-service", "Prompt 模板、RAG 检索、模型路由、流式输出、来源校验", "只读 PostgreSQL / pgvector；不写业务表"],
        ["integration-adapters", "少数无 Java SDK 的供应商适配（如特定审核、天气聚合）", "无状态，超时 3s，失败降级"],
        ["data-jobs", "城市边界导入、POI 同步、内容过期扫描、指标汇总", "离线批处理，写库需走 Java 服务或受控账号"],
    ], [4.2, 8.0, 4.8]))
    a(("p", "技术栈为 Python 3.12、FastAPI、Pydantic v2、httpx、tenacity、APScheduler、psycopg 3、pgvector、OpenAI 兼容 SDK。内部调用使用 HMAC-SHA256 签名 + 时间戳，生产环境叠加 mTLS；Python 服务不直接暴露公网。"))

    a(("h2", "3.5 数据与中间件"))
    a(("p", "**PostgreSQL** 是唯一事实源；PostGIS 存城市边界与定位点，pgvector 存内容与回忆盒的向量，减少独立向量库的运维成本。**Redis** 承担热点缓存、分布式锁、限流计数、共享大厅的 GEO 查询与会话。**Kafka** 承担跨模块事件与异步任务，主题按领域划分。**MinIO/OSS** 存原图、转码产物与导出文件，数据库只存对象键与元数据。"))

    a(("h2", "3.6 基础设施与可观测"))
    a(("table", ["能力", "方案", "说明"], [
        ["容器与编排", "Docker 27 + Kubernetes 1.31", "生产 3 AZ，HPA 按 CPU 与队列长度"],
        ["入口", "SLB + Nginx Ingress", "TLS 1.3，WAF 规则按 OWASP Top 10"],
        ["CI/CD", "GitLab CI + Harbor + Argo CD", "镜像扫描、SBOM、灰度发布"],
        ["指标", "Micrometer → Prometheus → Grafana", "按模块与接口维度"],
        ["日志", "Loki + 结构化 JSON", "traceId、userId 脱敏后输出"],
        ["链路", "OpenTelemetry + Tempo", "跨 Java / Python 传播 W3C TraceContext"],
        ["前端监控", "Sentry", "错误、慢加载、白屏"],
        ["告警", "Alertmanager → 企业微信 / 电话", "P1 5 分钟、P2 30 分钟"],
    ], [3.2, 7.4, 6.4]))

    a(("h2", "3.7 版本与升级策略"))
    a(("p", "所有运行时使用 LTS 版本；Spring Boot 每季度评估一次小版本升级，跟随安全补丁；前端依赖每月由 Renovate 提 PR，主版本升级需单独评审。数据库扩展（PostGIS、pgvector）随 RDS 版本走，不单独升级。"))

    # ---------------- 4 ----------------
    a(("pagebreak",))
    a(("h1", "4 领域模块设计"))
    a(("h2", "4.1 模块边界"))
    a(("table", ["模块", "职责", "拥有数据", "对外接口"], [
        ["auth", "登录、实名、设备、注销", "users, auth_identities, devices, realname", "/auth, /me"],
        ["city", "城市库、搜索、到访判定、城市卡", "cities, visits, visit_points", "/cities, /visits, /location"],
        ["memory", "旅行识别、回忆盒、素材编排、导出", "trips, memory_boxes, box_media", "/trips, /memory-boxes"],
        ["media", "上传、转码、去重、审核", "media_assets, moderation_tasks", "/media"],
        ["share", "共享会话、大厅、匹配、队伍与聊天", "share_sessions, likes, teams, team_messages", "/share, /teams"],
        ["content", "公共内容、文化卡、问答、互动、举报", "posts, comments, votes, reports", "/posts, /culture-cards, /questions"],
        ["ai", "会话、配额、来源、反馈", "ai_conversations, ai_messages", "/ai"],
        ["admin", "审核台、城市库、配置、看板", "admin_users, feature_flags, audit_logs", "/admin"],
    ], [2.0, 5.6, 5.0, 4.4]))

    a(("h2", "4.2 城市、到访与搜索"))
    a(("h3", "4.2.1 点亮判定"))
    a(("p", "客户端每 5 分钟或位移超过 200 米上报一次定位点，进入城市边界后开始累计。判定完全在服务端完成，客户端不参与“是否点亮”的计算。"))
    a(("code", """// 伪代码：服务端停留判定
onLocationBatch(userId, points):
    city = cityAt(points.last)                 // PostGIS ST_Contains
    if city == null: return
    points = filter(points, accuracy <= 200m)  // 精度门槛
    if points.size < 2: return
    span = points.last.time - points.first.time
    dwell = sum(overlap(points, city.boundary, gap <= 10min))
    if span < 30min or dwell < 30min: return
    if isTransit(points) or isSpoofed(points): // 高速移动、模拟定位
        riskEvent(userId, "LIGHTUP_REJECTED"); return
    if existsVisit(userId, city, last24h): return  // 24h 去重
    visit = createVisit(userId, city, points.first, points.last, AUTO)
    outbox.publish(VisitCreated(visit.id))"""))
    a(("p", "定位点按 `visit_points` 分区表存储，默认保留 7 天原始精度，之后由定时任务将坐标聚合到城市质心并删除原始点。用户可在设置中关闭自动点亮，关闭后不再上报后台定位。"))

    a(("h3", "4.2.2 城市搜索"))
    a(("p", "搜索是本期新增的明确需求。城市库共 34 个省级行政区、333 个地级行政区，数据量小，采用 PostgreSQL 即可，不引入 Elasticsearch。"))
    a(("bullets", [
        "**匹配字段**：城市名、拼音全拼、拼音首字母、省份名、别名（如“鹏城”）。",
        "**索引**：`cities(name gin_trgm_ops)`、`cities(pinyin text_pattern_ops)`、`cities(province)`。",
        "**排序**：完全匹配 > 前缀匹配 > 包含匹配；同级按“已点亮 > 热门 > 行政级别”排序。",
        "**性能**：结果缓存 Redis 10 分钟，p95 目标 80ms；支持游标分页，不返回总数。",
        "**权限**：未点亮城市也可搜索，返回 `lit=false` 与“手动补录”入口，不泄露他人到访。",
    ]))
    a(("code", """GET /api/v1/cities?q=da&limit=20
{
  "items": [
    { "adcode": "532900", "name": "大理", "province": "云南省",
      "pinyin": "dali", "lit": true, "visits": 2, "days": 6 },
    { "adcode": "210200", "name": "大连", "province": "辽宁省",
      "pinyin": "dalian", "lit": false }
  ],
  "nextCursor": null
}"""))

    a(("h2", "4.3 旅行识别与回忆盒"))
    a(("p", "旅行识别采用可解释的规则，而非黑盒聚类，便于客服解释与用户手动纠正："))
    a(("numbers", [
        "以常住城市为原点，离开 50 公里以上进入另一城市，记为一次旅行开始。",
        "连续 24 小时没有新位置，或回到常住城市，记为旅行结束；单次旅行最长 30 天。",
        "旅行内的照片按拍摄时间与地点聚类到“天 + 500 米网格”，同一天同一地点合并为一个段落。",
        "去除重复照片（pHash 距离 ≤ 6）、截图（尺寸与状态栏特征）、明显模糊（拉普拉斯方差阈值）。",
        "按地点覆盖率与画质推荐封面，生成杂志、胶片、极简三套模板。",
    ]))
    a(("p", "素材处理是异步流水线：客户端申请预签名 URL 直传对象存储 → 回调 `complete` → 病毒扫描 → 去 EXIF → 生成 3 档缩略图 → pHash 去重 → 内容安全扫描 → 写入 `media_assets`。任一环节失败进入重试队列，超过 3 次标记失败并通知用户。"))
    a(("p", "导出视频由 Worker 使用 FFmpeg 合成，任务状态存 `export_jobs`，产物放对象存储并生成 24 小时有效的下载链接；导出不阻塞编辑，用户可继续修改。"))

    a(("h2", "4.4 共享与组队"))
    a(("p", "共享会话开启需同时满足：城市已点亮、定位仍在城市内、实名核验通过、年满 18 周岁。会话默认 24 小时，离开城市 5 公里自动暂停。"))
    a(("p", "匹配分由五个维度加权，与 PRD 一致：同城与时间重叠 35、兴趣标签 25、出行节奏 15、队伍结构 15、资料与信用 10。得分低于 60 不进入推荐；同一用户 24 小时内最多被推荐 20 次，避免骚扰。"))
    a(("code", """score = 0.35 * cityTimeOverlap   // 同城且停留重叠 >= 4h
      + 0.25 * tagJaccard         // 兴趣标签 Jaccard 相似度
      + 0.15 * paceSimilarity     // 早起/随性、紧凑/松弛、步数强度
      + 0.15 * teamFit            // 人数、性别偏好、是否接受单人
      + 0.10 * credit             // 资料完整度、实名、举报记录
if score < 60: skip
rank by score desc, then distance band asc, then lastActive desc"""))
    a(("p", "队伍人数 2–8 人，队长可审批、移除、转让与解散。聊天只支持文字、图片与集合点，不共享实时位置；消息经敏感词与图片审核，解散后保留 30 天用于投诉处理。"))

    a(("h2", "4.5 公共区域与内容治理"))
    a(("p", "内容分五类，时效不同：此刻 6 小时、今日推荐 24 小时、长期经验 30 天、文化卡长期、问答 7 天。排序权重：时效 40%、现场与可信度 25%、距离 15%、互动 10%、质量 10%，由运营配置，不按广告单独改变。"))
    a(("table", ["状态", "触发", "可见性"], [
        ["DRAFT", "用户保存未提交", "仅作者"],
        ["REVIEWING", "提交审核 / 新用户前 3 条", "仅作者"],
        ["PUBLISHED", "机器 + 人工审核通过", "公开"],
        ["FOLDED", "到期或被多次标记失效", "折叠，作者可续期一次"],
        ["REJECTED", "审核不通过", "仅作者，保留草稿"],
        ["REMOVED", "违法或侵权下架", "不可见，留存记录"],
    ], [3.0, 7.4, 6.4]))
    a(("p", "公共副本发布时去除 EXIF 精确坐标，位置精度降为城市或商圈级；人脸、车牌、门牌、二维码自动模糊或提示用户处理。删除公共副本不影响私密原件，删除私密原件时可选择是否同时下架副本。"))

    a(("h2", "4.6 AI 助手"))
    a(("p", "AI 的定位是“有来源的现场建议”，不是通用聊天。调用链为：Java 组装授权上下文（城市、时间、天气、偏好、公开内容 ID）→ Python 检索 pgvector 与公共内容 → 生成结构化任务卡 → 流式返回 → Java 记录来源与反馈。"))
    a(("bullets", [
        "**检索**：按城市与时效过滤，向量召回 20 条，重排取 8 条；文化卡与官方数据优先。",
        "**生成**：要求每条建议带 `sourceId` 与 `updatedAt`；无法确认营业时间、价格、管制时必须输出 `uncertain: true`。",
        "**安全**：不提供危险路线、医疗、法律、警务建议；输出经敏感词与事实一致性校验。",
        "**额度**：免费用户每日 10 次，会员 50 次；超限返回明确提示与次日恢复时间。",
        "**降级**：模型超时 8 秒或不可用时，返回缓存路线与搜索入口，不阻塞页面。",
    ]))
    a(("p", "对话默认仅本人可见，可随时删除；私密照片与对话不进入公共区域，不在未单独同意的情况下用于训练。"))

    a(("h2", "4.7 通知与异步事件"))
    a(("table", ["事件", "生产者", "消费者", "动作"], [
        ["VisitCreated", "city", "memory, notification", "触发旅行识别；点亮提示"],
        ["MediaUploaded", "media", "media", "转码、去重、审核"],
        ["PostSubmitted", "content", "moderation", "机器审核 → 人工队列"],
        ["PostExpired", "worker", "content", "折叠并通知作者"],
        ["MatchCreated", "share", "notification", "双方推送"],
        ["TeamMessage", "share", "notification", "未读与推送"],
        ["AiAnswered", "ai", "analytics", "质量评估与采纳率"],
    ], [3.2, 3.4, 4.4, 6.0]))
    a(("p", "所有事件先写本地 Outbox 表，再由 Debezium 或定时发布器投递 Kafka，消费者按 `eventId` 幂等。跨模块不共享事务，允许最终一致。"))

    a(("h2", "4.8 管理后台"))
    a(("p", "后台只服务内部运营，独立域名、独立登录（企业 SSO + 二次验证），与 C 端账号体系隔离。审核队列按风险分与等待时长排序；封禁、下架、申诉、配置变更全部写审计日志，高风险操作需二次确认。"))

    # ---------------- 5 ----------------
    a(("pagebreak",))
    a(("h1", "5 数据架构"))
    a(("h2", "5.1 存储职责"))
    a(("table", ["存储", "内容", "一致性", "备份"], [
        ["PostgreSQL", "用户、城市、到访、旅行、回忆盒、内容、队伍、审核", "强一致（单库事务）", "每日全量 + WAL 归档，保留 7 天"],
        ["Redis", "热点缓存、限流、会话、GEO、分布式锁", "最终一致", "AOF everysec，可从库重建"],
        ["对象存储", "原图、转码、导出物", "强一致读后写", "跨区域复制（生产）"],
        ["Kafka", "领域事件、异步任务", "至少一次", "副本 3，保留 7 天"],
        ["pgvector", "内容与回忆盒向量", "随主库", "随 PostgreSQL"],
    ], [3.0, 8.0, 3.6, 2.8]))

    a(("h2", "5.2 核心实体"))
    a(("table", ["实体", "关键字段", "说明"], [
        ["users", "id, phone_enc, nickname, avatar, status, created_at", "账号主体，手机号加密存储"],
        ["user_profiles", "user_id, gender, birthday, home_city, bio, tags", "资料与偏好"],
        ["realname_verifications", "user_id, provider, result, verified_at", "实名结果，不存证件原图"],
        ["cities", "adcode, name, province, boundary, pinyin, status", "城市库与边界"],
        ["visits", "user_id, city_adcode, arrived_at, left_at, method, confidence", "一次连续停留"],
        ["visit_points", "visit_id, geog, accuracy, captured_at", "原始定位点，分区表"],
        ["trips", "user_id, start_at, end_at, status, home_city", "自动识别的旅行"],
        ["memory_boxes", "trip_id, title, cover, template, status, visibility", "私密合集"],
        ["media_assets", "owner_id, object_key, type, width, height, phash, exif", "素材元数据"],
        ["share_links", "box_id, token, expires_at, password_hash, watermark", "回忆盒分享链接"],
        ["share_sessions", "user_id, city, expires_at, status, geog", "共享状态"],
        ["teams", "city, leader_id, capacity, status", "队伍"],
        ["team_members", "team_id, user_id, role, joined_at", "成员与角色"],
        ["posts", "author_id, city, type, content, geog, area, status, expires_at", "公共内容"],
        ["ai_conversations", "user_id, city, context, created_at", "AI 会话"],
        ["reports", "reporter_id, target_type, target_id, reason, status", "举报与处置"],
    ], [4.4, 8.2, 4.8]))

    a(("h2", "5.3 索引、分区与约束"))
    a(("bullets", [
        "`visits` 唯一约束 `(user_id, city_adcode, date(arrived_at))`，保证同城 24 小时一条。",
        "`visit_points` 按 `captured_at` 月分区，7 天后由任务聚合删除原始点。",
        "`posts` 建 `(city_adcode, type, status, published_at desc)` 复合索引，支撑信息流。",
        "`share_sessions` 建 `(city, status, expires_at)` 与 `geog` 上的 GiST 索引，支撑同城大厅。",
        "`cities.boundary` 使用 `geometry(MultiPolygon, 4326)` 与 GiST 索引。",
        "所有业务表带 `created_at`、`updated_at`、`version`（乐观锁）；删除采用软删 `deleted_at`。",
    ]))

    a(("h2", "5.4 缓存 Key 规范"))
    a(("table", ["Key 模式", "内容", "TTL", "失效"], [
        ["city:meta:{adcode}", "城市基本信息与边界摘要", "24h", "城市库更新"],
        ["city:search:{hash(q)}", "搜索结果 ID 列表", "10min", "城市库更新"],
        ["city:card:{userId}:{adcode}", "城市卡聚合", "30min", "新增到访"],
        ["feed:{city}:{type}:{cursor}", "信息流首页", "60s", "新内容发布"],
        ["post:detail:{id}", "内容详情", "5min", "编辑 / 审核"],
        ["share:hall:{city}", "同城大厅候选 ID", "30s", "共享状态变化"],
        ["ai:quota:{userId}:{date}", "AI 剩余额度", "当日", "每次调用自增"],
        ["rate:{scope}:{key}", "限流计数", "窗口", "自动过期"],
    ], [5.2, 7.4, 2.4, 3.0]))

    a(("h2", "5.5 对象存储目录"))
    a(("code", """s3://travelog-prod/
├─ u/{userId}/original/{yyyymm}/{mediaId}.jpg     # 原图，私有
├─ u/{userId}/thumb/{mediaId}_{s|m|l}.webp        # 缩略图
├─ u/{userId}/video/{mediaId}.mp4                 # 转码视频
├─ exports/{userId}/{jobId}.mp4                   # 回忆盒导出
├─ public/{postId}/{mediaId}.webp                 # 公共副本，去 EXIF
└─ admin/imports/{yyyy}/{file}                    # 城市边界导入"""))

    a(("h2", "5.6 消息主题"))
    a(("table", ["主题", "分区键", "消费方", "保留"], [
        ["travelog.visit.events", "userId", "memory, notification", "7d"],
        ["travelog.media.events", "mediaId", "media-worker", "7d"],
        ["travelog.content.events", "postId", "moderation, search", "7d"],
        ["travelog.share.events", "city", "notification, analytics", "7d"],
        ["travelog.ai.events", "userId", "analytics", "7d"],
        ["travelog.notify", "userId", "push-worker", "3d"],
    ], [5.4, 3.2, 5.4, 2.0]))

    a(("h2", "5.7 数据保留与删除"))
    a(("table", ["数据", "保留期", "到期处理"], [
        ["原始定位点", "7 天", "聚合为城市级后删除"],
        ["到访记录", "用户主动删除前长期", "删除后城市状态重算"],
        ["回忆盒", "长期", "删除进 30 天回收站，分享链接立即失效"],
        ["公共内容", "按类型 6h / 24h / 30d", "折叠，作者可续期一次"],
        ["队伍聊天", "解散后 30 天", "仅用于投诉与安全处理，之后删除"],
        ["AI 对话", "用户主动删除前长期", "删除后不可恢复"],
        ["审核与审计日志", "3 年", "依法留存，脱敏"],
        ["注销账号", "7 天冷静期", "删除个人信息，公共内容去标识化"],
    ], [3.8, 5.2, 7.6]))

    a(("h2", "5.8 一致性策略"))
    a(("p", "跨模块采用“本地事务 + Outbox + 幂等消费”。例如点亮城市时，`visits` 写入与 `VisitCreated` 事件在同一事务提交；memory 模块消费事件后创建旅行与回忆盒草稿；若消费失败，按指数退避重试，超过 5 次进入死信队列并告警。所有消费者以 `eventId` 去重，保证至少一次语义下不重复处理。"))

    # ---------------- 6 ----------------
    a(("pagebreak",))
    a(("h1", "6 接口规范与集成"))
    a(("h2", "6.1 REST 规范"))
    a(("table", ["项", "约定"], [
        ["Base URL", "`https://api.travelog.cn/api/v1`（生产），路径全小写、复数名词"],
        ["版本", "路径版本 `/v1`；不兼容变更升 `/v2`，旧版本至少保留 6 个月"],
        ["认证", "`Authorization: Bearer <access_token>`；access 30 分钟，refresh 30 天轮换"],
        ["响应包", "`{ code, message, data, traceId }`；HTTP 状态码表达语义，code 表达业务错误"],
        ["分页", "游标分页 `cursor` + `limit`，返回 `nextCursor`；管理后台可用页码"],
        ["时间", "ISO 8601 带时区，如 `2026-10-18T14:20:00+08:00`"],
        ["ID", "字符串；城市使用 6 位 adcode；不暴露自增主键"],
        ["幂等", "POST 支持 `Idempotency-Key`，24 小时内相同键返回首次结果"],
        ["限流", "按用户 + 接口维度；超限返回 429 与 `Retry-After`"],
        ["追踪", "响应头 `X-Trace-Id`；日志与事件均带同一 traceId"],
    ], [3.2, 13.6]))

    a(("h2", "6.2 认证与授权"))
    a(("p", "C 端使用手机号验证码登录，支持微信与 Apple 第三方登录；登录成功后签发 RS256 JWT，包含 `sub`（userId）、`did`（设备）、`scope`、`exp`。Refresh Token 一次性轮换，检测到重放立即吊销该设备全部会话。"))
    a(("p", "后台使用独立账号体系 + 企业 SSO，权限按角色（审核员、运营管理员、超级管理员）与资源范围控制；所有写操作记录操作人、IP、UA 与变更前后值。"))
    a(("p", "资源级校验是硬要求：即使角色允许，也必须校验对象归属（如回忆盒、队伍、内容作者），防止越权 ID 遍历。"))

    a(("h2", "6.3 第三方集成"))
    a(("table", ["能力", "首选", "备用 / 降级", "超时与重试"], [
        ["地图底图与 POI", "高德地图 JS API 2.0 / Web 服务", "天地图", "3s，读操作重试 1 次"],
        ["行政区与边界", "高德行政区划 + 民政部数据", "本地城市库（权威）", "启动时导入，不实时依赖"],
        ["天气", "和风天气", "高德天气", "2s，失败展示“暂无天气”"],
        ["短信", "阿里云短信", "腾讯云短信", "3s，同号码 60s 一条"],
        ["实名认证", "阿里云实人认证", "腾讯云慧眼", "10s，失败转人工"],
        ["内容审核", "阿里云内容安全", "本地模型 + 人工", "3s，超时进人工队列"],
        ["大模型", "通义千问 qwen-plus", "DeepSeek-V3", "8s 首包，失败返回缓存"],
        ["推送", "厂商通道 + 极光", "站内消息", "异步，不阻塞"],
    ], [3.4, 5.4, 4.6, 3.4]))

    a(("h2", "6.4 Python 服务契约"))
    a(("p", "Java 与 Python 之间只通过三个内部接口通信，全部要求 HMAC 签名与 5 秒时间窗："))
    a(("table", ["接口", "方向", "说明"], [
        ["POST /internal/v1/ai/answer", "Java → Python", "输入上下文与问题，SSE 返回结构化任务卡与来源"],
        ["POST /internal/v1/ai/embed", "Java → Python", "文本向量化，批量 ≤ 64 条"],
        ["POST /internal/v1/moderation/scan", "Java → Python", "文本与图片二次校验，返回风险分与标签"],
    ], [6.2, 3.6, 7.0]))
    a(("code", """POST /internal/v1/ai/answer
X-Internal-Timestamp: 1760000000
X-Internal-Signature: hmac_sha256(secret, timestamp + "." + body)
{
  "userId": "u_8821",
  "city": "杭州",
  "locale": "zh-CN",
  "question": "今天下午去哪",
  "context": { "lat": 30.25, "lng": 120.16, "weather": "多云 22°" },
  "allowedSources": ["post:p1", "culture:c8"]
}"""))

    a(("h2", "6.5 限流与防刷"))
    a(("table", ["场景", "限制", "处置"], [
        ["验证码", "同号码 60s 1 条，日 10 条；同 IP 日 100 条", "超限 429，图形验证"],
        ["登录", "同账号 5 次/分钟", "失败锁定 15 分钟"],
        ["发布", "普通用户 10 条/日；新用户前 3 条先审", "超限提示，风控标记"],
        ["共享喜欢", "100 次/日，同对象 1 次", "超限冷却 24 小时"],
        ["AI", "免费 10 次/日，会员 50 次/日", "超限提示次日恢复"],
        ["上传", "20 张/分钟，单文件 20MB", "超限排队或拒绝"],
    ], [3.4, 8.0, 5.4]))

    # ---------------- 7 ----------------
    a(("pagebreak",))
    a(("h1", "7 非功能设计"))
    a(("h2", "7.1 性能目标"))
    a(("table", ["场景", "指标", "目标"], [
        ["冷启动", "首屏可交互", "≤ 2.5s（4G，中端机）"],
        ["地图首屏", "底图 + 已点亮省份", "≤ 2.0s"],
        ["列表首屏", "回忆盒 / 信息流", "≤ 1.5s"],
        ["普通读接口", "p95", "≤ 200ms"],
        ["普通写接口", "p95", "≤ 300ms"],
        ["城市搜索", "p95", "≤ 250ms（缓存命中 ≤ 80ms）"],
        ["AI 首字", "p95", "≤ 2.0s，完整回答 ≤ 15s"],
        ["图片上传", "成功率达到", "≥ 99.5%"],
    ], [4.0, 6.0, 6.8]))

    a(("h2", "7.2 容量估算"))
    a(("p", "按首年 30 万 MAU、9 万 DAU、峰值同时在线 1.5 万估算："))
    a(("table", ["维度", "估算", "依据"], [
        ["读 QPS", "峰值 1200", "人均 40 次/日，峰值系数 8"],
        ["写 QPS", "峰值 180", "发布、点赞、定位上报合计"],
        ["接口带宽", "峰值 80Mbps", "JSON 为主，图片走 CDN"],
        ["数据库", "首年 800GB", "内容与到访为主，媒体不落库"],
        ["对象存储", "首年 27TB", "30 万 × 30 张 × 3MB"],
        ["Kafka", "日均 600 万条事件", "定位、媒体、内容、通知"],
        ["Redis", "8GB 峰值", "缓存 + 会话 + 限流"],
    ], [3.6, 5.0, 8.2]))

    a(("h2", "7.3 可用性与降级"))
    a(("table", ["依赖", "故障表现", "降级策略"], [
        ["地图服务", "底图空白 / 逆地理失败", "使用缓存城市边界与最近一次城市，点亮不受影响"],
        ["天气", "无天气数据", "AI 不引用天气，提示“天气暂不可用”"],
        ["内容审核", "审核延迟", "先审后发转人工队列，作者可见“审核中”"],
        ["AI 模型", "超时 / 限流", "返回缓存路线 + 搜索入口，保留额度不扣减"],
        ["对象存储", "上传失败", "本地队列重试，草稿不丢失"],
        ["Kafka", "事件积压", "Outbox 保留，恢复后补投，业务主链路不受阻"],
    ], [3.6, 6.2, 7.2]))
    a(("p", "核心服务月度可用性目标 99.9%，允许每月 43 分钟不可用；AI 服务目标 99.5%，且不计入主链路可用性。"))

    a(("h2", "7.4 安全设计"))
    a(("bullets", [
        "**传输**：全站 TLS 1.3，内部服务 mTLS；HSTS 与证书固定（App）。",
        "**存储**：手机号、证件信息字段级 AES-256-GCM 加密，密钥由 KMS 托管并按季度轮换。",
        "**鉴权**：JWT + 资源级校验；后台 RBAC + 二次验证；敏感操作二次确认。",
        "**注入与越权**：参数化查询、类型校验、对象归属校验、越权扫描用例纳入 CI。",
        "**风控**：模拟定位、设备农场、刷量、撞库；规则与模型结合，命中进人工复核。",
        "**审计**：审核、封禁、配置变更、数据导出全部留痕，日志不可篡改，保留 3 年。",
        "**供应链**：依赖锁定、镜像扫描、SBOM、许可证白名单。",
    ]))

    a(("h2", "7.5 隐私与合规"))
    a(("table", ["要求", "落地措施"], [
        ["个人信息保护法", "单独同意（定位、相册）、最小必要、可撤回、可删除、可导出"],
        ["数据安全法 / 网络安全法", "分类分级、等保二级、日志留存不少于 6 个月"],
        ["实名制", "发布与共享前完成实名核验，结果仅用于合规与风控"],
        ["未成年人保护", "共享与陌生人匹配仅限 18 岁以上；未成年人模式关闭相关入口"],
        ["生成式 AI", "算法备案、内容标识、不训练用户私密数据、输出可追溯"],
        ["内容审核", "机器 + 人工双审，违法内容立即下架并留存记录"],
        ["数据出境", "首版不涉及；海外版单独评估"],
    ], [4.2, 12.6]))

    a(("h2", "7.6 可访问性与兼容性"))
    a(("p", "支持 iOS 15+、Android 10+、主流浏览器最近两个大版本；字体缩放 200% 不破版；关键信息对比度 ≥ 4.5:1；状态不只靠颜色表达；读屏可访问所有主要操作。低端机降低动画与图片质量，保留核心流程。"))

    # ---------------- 8 ----------------
    a(("pagebreak",))
    a(("h1", "8 部署与运维"))
    a(("h2", "8.1 环境划分"))
    a(("table", ["环境", "用途", "数据", "规格"], [
        ["dev", "本地开发与联调", "合成数据", "Docker Compose"],
        ["staging", "集成测试、验收、压测", "脱敏数据", "生产 1/2"],
        ["prod", "生产", "真实数据", "3 AZ 多副本"],
    ], [3.0, 6.6, 4.2, 3.0]))

    a(("h2", "8.2 部署拓扑"))
    a(("img", os.path.join(ASSETS, "deploy.png"), 16.6, "图 8-1 生产部署拓扑"))
    a(("p", "生产采用同城三可用区：入口经 SLB 与 Ingress 分发，`travel-api` 至少 3 副本、`ai-service` 2 副本、`worker` 2 副本；数据库主备 + 只读副本，Redis 主从 + 哨兵，Kafka 3 副本。所有密钥通过 KMS 与 Secret 注入，不写镜像。"))

    a(("h2", "8.3 CI/CD"))
    a(("numbers", [
        "提交触发：Lint、单测、架构测试、OpenAPI 变更检查、依赖与镜像扫描。",
        "合并主干：构建镜像并推送 Harbor，生成 SBOM 与版本号。",
        "部署 staging：Flyway 迁移 → 冒烟测试 → 契约测试 → E2E 关键路径。",
        "灰度生产：10% 流量 30 分钟，观察错误率、p95、业务指标，再全量。",
        "回滚：镜像回滚 ≤ 5 分钟；数据库迁移必须向前兼容，禁止破坏性变更。",
    ]))

    a(("h2", "8.4 监控与告警"))
    a(("table", ["SLI", "SLO", "告警阈值"], [
        ["接口成功率", "≥ 99.9%", "5 分钟 < 99.5% 告警"],
        ["读接口 p95", "≤ 200ms", "10 分钟 > 400ms 告警"],
        ["写接口 p95", "≤ 300ms", "10 分钟 > 600ms 告警"],
        ["AI 首字 p95", "≤ 2s", "10 分钟 > 4s 告警"],
        ["上传成功率", "≥ 99.5%", "15 分钟 < 98% 告警"],
        ["Kafka 积压", "< 1 万条", "> 5 万条告警"],
        ["审核队列时长", "≤ 30 分钟", "> 2 小时告警"],
    ], [4.0, 5.4, 7.6]))

    a(("h2", "8.5 备份与容灾"))
    a(("bullets", [
        "PostgreSQL 每日全量 + WAL 连续归档，RPO ≤ 5 分钟，RTO ≤ 30 分钟。",
        "对象存储开启版本与跨区域复制，误删可恢复 7 天。",
        "每季度做一次故障演练：数据库主备切换、Kafka 节点故障、AZ 不可用。",
        "密钥与配置独立备份，恢复流程写入 Runbook。",
    ]))

    a(("h2", "8.6 成本量级"))
    a(("p", "首年生产环境月成本量级 6–9 万元：计算与容器约 3 万元，数据库与缓存约 1.5 万元，对象存储与 CDN 约 1.5 万元，第三方服务（地图、短信、实名、审核、模型）约 1–2 万元，监控与日志约 0.5 万元。实际以试点城市规模校准。"))

    # ---------------- 9 ----------------
    a(("pagebreak",))
    a(("h1", "9 研发规范"))
    a(("h2", "9.1 分支与提交"))
    a(("p", "主干开发 + 短分支：`feat/<模块>-<简述>`、`fix/<模块>-<简述>`；提交信息采用 Conventional Commits；合并需 1 名同模块 reviewer 与 CI 通过。"))
    a(("h2", "9.2 代码结构"))
    a(("p", "Java 模块内部统一分层：`api`（Controller/DTO）、`app`（应用服务/事务）、`domain`（聚合/领域服务）、`infra`（Repository/外部适配）。禁止 Controller 直接调用 Repository。"))
    a(("code", """com.travelog.city
├─ api/            CityController, VisitController
├─ app/            CityQueryService, VisitApplicationService
├─ domain/         City, Visit, VisitPolicy, LightUpService
└─ infra/          CityRepository, VisitRepository, PostgisCityLocator"""))
    a(("p", "前端按 feature 组织：`features/city`、`features/memory`、`features/share`、`features/content`、`features/ai`；通用组件进 `packages/ui`，请求与类型全部来自 `packages/api-client`。"))

    a(("h2", "9.3 契约优先"))
    a(("numbers", [
        "在 `contracts/openapi.yaml` 修改或新增接口，PR 中附变更说明。",
        "CI 校验：OpenAPI 合法性、破坏性变更检测、示例响应校验。",
        "生成 TypeScript 类型与请求函数（`openapi-typescript` + `orval`）。",
        "生成 Java 接口与 DTO 骨架（`openapi-generator`，仅生成一次，后续手写实现）。",
        "契约测试：前端 mock 与后端实现均以同一份 OpenAPI 为准。",
    ]))

    a(("h2", "9.4 测试策略"))
    a(("table", ["层", "工具", "覆盖目标"], [
        ["单元测试", "JUnit 5 + AssertJ + Mockito", "领域规则 ≥ 80% 行覆盖"],
        ["集成测试", "Testcontainers（PG / Redis / Kafka）", "关键 Repository 与事务"],
        ["契约测试", "springdoc + OpenAPI 校验", "所有对外接口"],
        ["架构测试", "ArchUnit + Spring Modulith", "模块边界与依赖方向"],
        ["E2E", "Playwright", "点亮、成盒、发布、组队、AI 五条主链路"],
        ["前端组件", "Vitest + Testing Library", "核心组件与 hooks"],
        ["Python", "pytest + httpx", "AI 服务契约与降级"],
        ["压测", "k6", "峰值 QPS 1.5 倍，p95 达标"],
    ], [3.0, 7.6, 6.4]))

    a(("h2", "9.5 质量门禁"))
    a(("bullets", [
        "单测与集成测试全部通过，覆盖率不低于阈值。",
        "SonarQube 无阻断级问题，重复率 < 3%，圈复杂度超标的函数需说明。",
        "依赖漏洞无 High/Critical；许可证白名单。",
        "OpenAPI 无破坏性变更，或已完成版本升级与前端适配。",
        "数据库迁移在空库与生产快照上均可执行。",
    ]))

    # ---------------- 10 ----------------
    a(("pagebreak",))
    a(("h1", "10 风险与演进"))
    a(("h2", "10.1 主要风险"))
    a(("table", ["风险", "影响", "应对"], [
        ["定位耗电与权限拒绝", "点亮率低", "地理围栏低功耗唤醒、透明说明、手动补录、关闭自动点亮仍可用"],
        ["冷启动内容不足", "公共区域空", "3–5 个试点城市、官方与种子创作者、AI 官方数据兜底"],
        ["陌生人社交安全", "骚扰与线下风险", "实名、18+、模糊距离、双向同意、一键求助、公共场所集合"],
        ["内容审核成本", "审核不及时", "新用户先审后发、机器 + 人工、敏感词库、分级处罚"],
        ["AI 幻觉", "错误营业时间与路线", "检索增强、来源与时间标注、不确定提示、人工抽检"],
        ["地图合规", "底图与坐标问题", "使用持牌供应商，统一 GCJ-02，禁自采测绘数据"],
        ["单体腐化", "模块耦合", "Modulith 架构测试、模块负责人、季度边界评审"],
    ], [4.4, 4.8, 7.8]))

    a(("h2", "10.2 演进路线"))
    a(("table", ["阶段", "架构动作", "触发条件"], [
        ["M1", "模块化单体 + Worker，单区域部署", "立项"],
        ["M2", "拆出审核与媒体 Worker；引入 ES 支撑内容检索", "内容量 > 50 万或搜索 p95 > 500ms"],
        ["M3", "拆出 share 服务（大厅与聊天独立扩容）", "共享 QPS 占比 > 40% 或团队 > 15 人"],
        ["M4", "多语言、海外城市、独立 AI 推理集群", "海外版立项"],
    ], [2.6, 8.8, 5.6]))

    a(("h2", "10.3 待决策问题"))
    a(("bullets", [
        "首发城市数量与试点范围，直接影响审核人力与内容运营成本。",
        "共享模式是否强制实名、是否只开放 18 岁以上（本文按“是”设计）。",
        "队伍聊天首版是否必须，是否需要语音消息（本文按“文字 + 图片 + 集合点”设计）。",
        "免费存储额度、会员定价与 AI 每日额度。",
        "地图、天气、审核、模型供应商的最终商务合同与 SLA。",
        "是否需要在 M1 就支持相册视频，视频转码成本较高。",
    ]))

    # ---------------- 附录 ----------------
    a(("pagebreak",))
    a(("h1", "附录 A 技术选型对比"))
    a(("table", ["决策", "选择", "备选", "结论"], [
        ["后端框架", "Spring Boot", "Quarkus / Micronaut", "团队熟悉度与生态优先；虚拟线程已足够"],
        ["服务形态", "模块化单体", "微服务", "首版交付效率优先，边界清晰可拆"],
        ["前端框架", "React", "Vue 3", "跨端与组件生态更成熟；团队可迁移"],
        ["Python 框架", "FastAPI", "Flask / Django", "异步、类型与 OpenAPI 原生支持"],
        ["主库", "PostgreSQL", "MySQL", "PostGIS / pgvector / JSONB 一体化"],
        ["搜索", "PostgreSQL + ES（二期）", "Elasticsearch 首发", "城市量小，先用 PG 降低运维成本"],
        ["消息", "Kafka", "RocketMQ", "生态与云托管成熟；事件溯源友好"],
        ["对象存储", "OSS / MinIO", "Ceph", "托管优先，私有化用 MinIO"],
    ], [3.0, 4.2, 4.6, 5.2]))

    a(("h2", "附录 B 参考规范"))
    a(("bullets", [
        "OpenAPI Specification 3.1；JSON:API 风格仅借鉴分页与错误结构。",
        "OWASP ASVS 4.0（Level 2）与 OWASP API Security Top 10。",
        "《个人信息保护法》《数据安全法》《网络安全法》与生成式人工智能服务管理暂行办法。",
        "Spring Modulith 官方参考文档；Spring Boot 3.4 参考文档。",
    ]))

    K.render(doc, blocks)
    K.save(doc, OUT)


if __name__ == "__main__":
    build()
