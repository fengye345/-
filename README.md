# 旅迹 Travelog · 交付索引

旅游记录 App 的完整交付：产品原型归档、技术文档、React 前端、Capacitor Android 壳、Java 后端。

> **全局规则：默认无预置假数据。** 新注册用户的点亮、回忆盒、发布、消息、共享大厅、
> 收藏、行程与队伍全部为空；各页面单独渲染空状态。城市索引、地图与景区目录是系统内容，
> 不含用户历史。早期静态原型已停用，入口只保留说明页。

| 目录 | 内容 | 入口 |
|---|---|---|
| `travel-app/` | 早期静态原型（已停用，保留设计存档） | `travel-app/index.html`（停用说明） |
| `travelog-app/` | React 19 + TypeScript + Vite 前端，含 Capacitor Android 工程 | `travelog-app/README.md` |
| `travelog-server/` | Spring Boot 3.4 + Java 21 后端，实现 OpenAPI 文档中的 80+ 接口 | `travelog-server/README.md` |
| `travel-docs/` | 技术架构、软件需求规格、接口文档、OpenAPI 3.1 | `travel-docs/README.md` |

## 当前运行中的服务

| 服务 | 地址 | 说明 |
|---|---|---|
| Web 前端 | http://127.0.0.1:5173/ | Vite 开发服务器；新账号默认空数据 |
| 后端 API | http://localhost:8080/api/v1 | Spring Boot；默认不加载演示种子 |

后端默认是空数据。若要做接口契约演示，显式开启种子：

```bash
java -jar target/travelog-server-1.0.0.jar --travelog.seed-demo=true
```

演示账号（仅在开启种子时）：手机号 `13800000000`，验证码 `123456`（固定，仅本地）。

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

- 前端：`tsc -b` 通过、Vitest **17 个单测通过**、`vite build` 成功；空白账号下地图、
  回忆、发现、共享、我的均独立截图验证。
- 后端：Maven `package` 成功、**5 个集成测试通过**（测试显式开启 `travelog.seed-demo=true`）；
  默认运行不加载演示用户、回忆、发布或大厅数据。
- 前端注册流程端到端验证：注册 → 资料 → 城市（可跳过）→ 点亮/不点亮 → 相册（可跳过）→
  权限 → 进入；关闭浏览器重开直接进入，无需再次登录。

## 已知边界

- 后端为内存存储，默认空数据；`travelog.seed-demo=true` 时才加载接口契约演示种子。
- 验证码/微信/Apple 为演示登录；AI 为规则引擎；未接真实推送与审核队列。
- Android APK 未在本机编译（无 Android SDK），工程与 Kotlin 插件已按 Capacitor 7 规范生成。
