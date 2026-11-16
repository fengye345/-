# 旅迹 Travelog · 交付索引

旅游记录 App 的完整交付：产品原型、技术文档、React 前端、Capacitor Android 壳、Java 后端。

| 目录 | 内容 | 入口 |
|---|---|---|
| `travel-app/` | 高保真原型（原生 HTML/CSS/JS，双击即开） | `travel-app/index.html` |
| `travelog-app/` | React 19 + TypeScript + Vite 前端，含 Capacitor Android 工程 | `travelog-app/README.md` |
| `travelog-server/` | Spring Boot 3.4 + Java 21 后端，实现 OpenAPI 文档中的 80+ 接口 | `travelog-server/README.md` |
| `travel-docs/` | 技术架构、软件需求规格、接口文档、OpenAPI 3.1 | `travel-docs/README.md` |

## 当前运行中的服务

| 服务 | 地址 | 说明 |
|---|---|---|
| Web 前端 | http://127.0.0.1:5173/ | Vite 开发服务器；`?demo=1` 跳过引导 |
| 后端 API | http://localhost:8080/api/v1 | Spring Boot；健康检查 `/health` |

后端演示账号：手机号 `13800000000`，验证码 `123456`（固定，仅本地）。

```bash
curl -s http://localhost:8080/api/v1/health

curl -s -X POST http://localhost:8080/api/v1/auth/sessions/sms \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800000000","code":"123456"}'
```

## 从零运行

**前端**

```bash
cd travelog-app
pnpm install
pnpm dev
```

**后端**

```bash
cd travelog-server
mvn spring-boot:run
# 或
java -jar target/travelog-server-1.0.0.jar
```

要求 JDK 21、Maven 3.9+。本机使用 IntelliJ 自带 JBR 21 与 Maven 3.9.9 构建，
`travelog-server/target/travelog-server-1.0.0.jar` 已生成。

**Android**

```bash
cd travelog-app
pnpm build
npx cap sync android
npx cap open android
```

## 已验证

- 前端：`tsc -b` 通过、Vitest 5 个单测通过、`vite build` 成功、11 个移动端页面与桌面端截图验证。
- 后端：Maven `package` 成功、5 个集成测试通过（登录、拼音搜索、401、发布与自投票 403）；
  手动联调覆盖登录 → 城市 → 回忆盒 → 发布/点赞/评论 → 共享 → 匹配 → 组队 → AI → 后台 → 分享链接。
- 后端重启后种子数据重置，适合反复演示。

## 已知边界

- 后端为内存存储，重启即重置；生产需替换 PostgreSQL + PostGIS、Redis、Kafka、对象存储。
- 验证码/微信/Apple 为演示登录；AI 为规则引擎；未接真实推送与审核队列。
- Android APK 未在本机编译（无 Android SDK），工程与 Kotlin 插件已按 Capacitor 7 规范生成。
