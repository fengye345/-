# 旅迹 Travelog · 技术文档集

依据《旅游记录 App 产品需求文档 V1.0》，面向 **Java 21 + Spring Boot 3.4 + React 19/TypeScript + Python 3.12** 技术栈编写的可实施文档集。

## 文档清单

| 文档 | 页数 | 内容 | 适合谁 |
|---|---|---|---|
| [01-技术架构与技术栈.docx](01-技术架构与技术栈.docx) | 34 | 总体架构、技术选型与理由、模块边界、关键算法、数据/部署/安全、演进路线 | 架构、后端、前端、运维 |
| [02-软件需求规格说明书.docx](02-软件需求规格说明书.docx) | 28 | 70+ 条功能需求、业务规则、状态机、非功能要求、16 条验收标准、追踪矩阵 | 产品、研发、测试、法务 |
| [03-接口文档.docx](03-接口文档.docx) | 23 | 93 个路径 / 112 个操作、认证与错误码、11 个模块、SSE/WebSocket、对象模型 | 前后端联调、测试 |
| [openapi.yaml](openapi.yaml) / [openapi.json](openapi.json) | — | OpenAPI 3.1 机器可读规范，可直接生成 TS 类型与 Java 接口 | 研发、CI |

每份 Word 文档同时提供同名 `.pdf`，用于评审与归档。

## 建议阅读顺序

1. **产品/评审**：需求规格 → 技术架构第 1–2 章 → 接口文档第 1 章。
2. **后端**：技术架构第 2–5 章 → 需求规格第 4–6 章 → 接口文档全部。
3. **前端**：接口文档 → 需求规格验收标准 → 技术架构第 3.3 节。
4. **测试**：需求规格第 9 章（AC-01–16）→ 接口文档错误码 → 状态机。

## 核心技术决策

| 决策 | 结论 |
|---|---|
| 服务形态 | 模块化单体（Spring Modulith），按 `auth / city / memory / media / share / content / ai / admin` 划分，预留拆分 |
| 前端 | React 19 + TypeScript + Vite + TanStack Query + Zustand，PWA 与 Capacitor 原生壳共用代码 |
| AI | 独立 Python FastAPI 服务，负责 RAG、模型路由与 SSE；不持有业务主数据 |
| 数据 | PostgreSQL 16 + PostGIS + pgvector，Redis 7，MinIO/OSS，Kafka 3.8 |
| 接口 | REST `/api/v1`，统一信封 `{code,message,data,traceId}`，JWT + 刷新令牌轮换，`Idempotency-Key` |
| 异步 | 事务 Outbox + Kafka，消费者按 eventId 幂等 |
| 部署 | Docker + Kubernetes 3 AZ，GitLab CI + Argo CD 灰度 |

## 关键约定

- **城市搜索**：中文 / 拼音前缀 / 省份三路匹配，`GET /api/v1/cities?q=`；已点亮与热门加权。
- **点亮判定**：服务端完成，30 分钟 + 2 个定位点 + 精度 ≤ 200m，同城 24h 去重。
- **AI 边界**：每条事实带来源与更新时间，无法确认必须输出「未能确认」，不编造营业时间与价格。
- **隐私**：原始定位点 7 天降精度；公共副本去 EXIF；私密与公共两套删除逻辑。

## 重新生成

文档由 Python 脚本生成，可重复构建：

```bash
python build_tech_doc.py      # 生成 docx（首次无目录）
python finalize_doc.py build_tech_doc "01-技术架构与技术栈.docx" toc-tech.json
# 同理：build_srs_doc.py / build_api_doc.py
python build_openapi.py       # 生成 openapi.json / openapi.yaml
```

`finalize_doc.py` 会先导出 PDF、解析每页文本定位章节页码，再重建带静态目录的文档，因此目录页码与 PDF 排版一致。

## 待确认事项

需求规格第 10.1 节列出 6 项待决策问题（首发城市、城市粒度、共享实名、队伍语音、定价与额度、供应商合同），建议在立项评审会上逐项确认后再冻结 M1 范围。
