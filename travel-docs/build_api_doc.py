# -*- coding: utf-8 -*-
import os
import sys
import json

sys.path.insert(0, os.path.dirname(__file__))
import docx_kit as K
import api_spec as API

OUT = os.path.join(os.path.dirname(__file__), "03-接口文档.docx")
TOC_JSON = os.path.join(os.path.dirname(__file__), "toc-api.json")


def build():
    doc = K.new_doc("旅迹 Travelog · 接口文档", "REST API V1")
    K.header_footer(doc, "旅迹 Travelog · 接口文档")
    K.cover(
        doc,
        "API REFERENCE · REST / SSE",
        "接口文档",
        "面向 iOS / Android / PWA 与管理后台的 HTTP API · v1",
        [
            ("文档版本", "V1.0（评审稿）"),
            ("接口版本", "v1（/api/v1）"),
            ("编制日期", "2026 年 10 月 24 日"),
            ("阅读对象", "前端、后端、测试、客户端与服务端联调"),
            ("配套文件", "openapi.yaml（OpenAPI 3.1，机器可读）"),
        ],
        "所有接口以 OpenAPI 为准；本文给出业务语义、字段说明与典型示例。破坏性变更需升版本并保留旧版本至少 6 个月。",
    )
    K.toc(doc, json.load(open(TOC_JSON, encoding="utf-8")) if os.path.exists(TOC_JSON) else None)

    b = []
    a = b.append

    a(("h1pb", "1 概述"))
    a(("h2", "1.1 域名与版本"))
    a(("table", ["环境", "Base URL", "说明"], [
        ["生产", "https://api.travelog.cn/api/v1", "仅 HTTPS，TLS 1.3"],
        ["预发", "https://api-staging.travelog.cn/api/v1", "脱敏数据，供联调"],
        ["本地", "http://localhost:8080/api/v1", "Docker Compose"],
    ], [2.6, 9.2, 5.4]))
    a(("p", "路径全部小写、资源用复数名词；版本放在路径中。仅不兼容变更升 `/v2`，新增字段与新增枚举值视为兼容变更。JSON 使用 UTF-8，时间使用 ISO 8601 带时区（`+08:00`）。"))

    a(("h2", "1.2 认证与会话"))
    a(("p", "C 端登录后签发 RS256 JWT。`accessToken` 有效期 30 分钟，`refreshToken` 有效期 30 天且每次刷新轮换；检测到刷新令牌重放时吊销该设备全部会话。"))
    a(("code", """Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
X-Device-Id: 9f2c1a7b...
X-Request-Id: 客户端生成的 UUID（可选）"""))
    a(("table", ["Scope", "含义", "适用"], [
        ["public", "无需登录", "验证码、分享链接访问"],
        ["user", "普通登录用户", "点亮、回忆盒、发布、AI"],
        ["share", "已实名且 18+ 的共享用户", "共享大厅、匹配、队伍"],
        ["admin", "后台账号 + SSO", "审核、封禁、配置"],
    ], [2.8, 7.6, 6.6]))

    a(("h2", "1.3 通用响应"))
    a(("p", "所有接口返回统一信封；HTTP 状态码表达语义，`code` 表达业务错误，`0` 表示成功。"))
    a(("code", """{
  "code": 0,
  "message": "ok",
  "data": { },
  "traceId": "b7c1f0a2e9"
}

// 错误
{
  "code": "POST_403_01",
  "message": "当前不在现场，无法发布此刻",
  "data": { "distanceMeters": 6400, "requiredMeters": 5000 },
  "traceId": "b7c1f0a2e9"
}"""))
    a(("table", ["HTTP", "含义", "客户端处理"], [
        ["200", "查询 / 更新成功", "—"],
        ["201", "创建成功", "读取 Location 或 data.id"],
        ["202", "已受理（异步）", "轮询任务或等待推送"],
        ["400", "参数错误", "展示 fieldErrors"],
        ["401", "未认证 / 令牌过期", "刷新令牌，失败则重新登录"],
        ["403", "无权限 / 未实名 / 未满 18", "引导完成对应条件"],
        ["404", "资源不存在", "返回列表或提示"],
        ["409", "状态冲突", "刷新后重试"],
        ["413 / 415", "文件过大 / 类型不支持", "压缩或更换格式"],
        ["422", "业务校验失败", "展示具体原因"],
        ["429", "限流", "按 Retry-After 退避"],
        ["500 / 503", "服务异常 / 依赖不可用", "重试并上报 traceId"],
    ], [2.2, 7.6, 7.2]))

    a(("h2", "1.4 分页、排序与筛选"))
    a(("bullets", [
        "列表默认游标分页：`cursor`（不透明字符串）+ `limit`（默认 20，最大 50），返回 `nextCursor`；无更多时为 `null`。",
        "排序通过 `sort` 指定，如 `publishedAt:desc`、`score:desc`；只允许白名单字段，避免慢查询。",
        "筛选参数可组合；未识别的参数返回 400，不静默忽略。",
        "管理后台允许页码分页：`page` + `pageSize`，并返回 `total`。",
    ]))

    a(("h2", "1.5 幂等与重试"))
    a(("p", "所有创建类 POST 支持 `Idempotency-Key`，24 小时内相同键返回首次结果。客户端网络超时可安全重试 GET 与带幂等键的 POST；不要重试未带幂等键的写请求。"))
    a(("table", ["场景", "建议", "说明"], [
        ["查询超时", "指数退避重试 2 次", "500ms / 1500ms"],
        ["写请求超时", "携带幂等键重试", "服务端去重"],
        ["429", "按 Retry-After", "不要立即重试"],
        ["5xx", "重试 1 次后上报", "携带 traceId"],
    ], [3.6, 6.0, 7.4]))

    a(("h2", "1.6 限流"))
    a(("table", ["维度", "默认限制", "超限响应"], [
        ["登录 / 验证码", "同号码 60s 1 条，日 10 条", "429 AUTH_429_01"],
        ["普通读接口", "用户 60 次/分钟", "429 COMMON_429_01"],
        ["写接口", "用户 20 次/分钟", "429 COMMON_429_01"],
        ["上传", "20 个/分钟", "429"],
        ["AI", "免费 10 次/日，会员 50 次/日", "429 AI_429_01"],
    ], [3.4, 8.2, 5.4]))

    a(("h2", "1.7 数据格式与隐私"))
    a(("bullets", [
        "坐标统一 GCJ-02；公开内容只返回城市或商圈级位置，不返回精确坐标。",
        "手机号返回脱敏形式（`138****8821`）；证件信息永不下发。",
        "金额使用整数分；比例使用 0–1 小数；布尔字段不用 0/1。",
        "ID 为字符串；城市使用 6 位 adcode；时间不返回本地化字符串。",
        "公共内容中的 EXIF、他人正脸、车牌、门牌在服务端处理，客户端不得自行上传原图到公共区。",
    ]))

    a(("h2", "1.8 错误码"))
    a(("table", ["错误码", "HTTP", "含义", "处理建议"], [
        [e[0], e[1], e[2], e[3]] for e in API.ERRORS
    ], [3.8, 1.4, 7.6, 4.2], {"font_size": 7.8}))

    # modules
    module_sections = [
        ("认证与账号", "2 认证与账号", "登录、实名、设备与注销。除验证码与登录外均需 `user` scope。"),
        ("城市与搜索", "3 城市与搜索", "城市库只读接口。搜索支持中文、拼音与省份，结果按“完全匹配 > 前缀 > 包含”排序。"),
        ("定位与到访", "4 定位与到访", "定位点批量上报；点亮判定在服务端完成。手动补录进入审核，不参与深度点亮。"),
        ("旅行与回忆盒", "5 旅行与回忆盒", "旅行由系统识别，回忆盒可编辑、导出与分享；分享链接为公开接口。"),
        ("媒体", "6 媒体", "客户端直传对象存储：先申请预签名地址，上传后调用 complete 触发转码与审核。"),
        ("共享与组队", "7 共享与组队", "共享会话 24 小时；大厅只返回模糊距离与匹配理由；队伍人数 2–8 人。"),
        ("公共内容", "8 公共内容", "发布返回 202 并进入审核；现场标识由服务端校验，客户端不能指定。"),
        ("AI 助手", "9 AI 助手", "会话需携带城市与位置上下文；回答通过 SSE 流式返回，并带来源与“未能确认”。"),
        ("消息、设置与举报", "10 消息、设置与举报", "消息中心按类型分组；举报统一入口，24 小时内首次响应。"),
        ("管理后台", "11 管理后台", "独立鉴权与审计；所有决定必须带理由，高风险操作二次确认。"),
    ]
    for mi, (key, title, intro) in enumerate(module_sections, start=2):
        items = dict(API.MODULES)[key]
        a(("h2", title))
        a(("p", intro))
        rows = []
        for method, path, desc, scope in items:
            rows.append([method, path, desc, scope])
        a(("table", ["方法", "路径", "说明", "权限"], rows,
           [1.7, 7.6, 6.0, 1.7], {"font_size": 7.8}))
        # detailed example for this module
        prefix_map = {
            2: ["POST /auth/sessions/sms"],
            3: ["GET /cities?q=da"],
            4: ["POST /location/points"],
            5: ["POST /memory-boxes/{boxId}/share-links"],
            6: ["POST /media/upload-intents"],
            7: ["GET /share/hall"],
            8: ["POST /posts"],
            9: ["POST /ai/conversations/{id}/messages"],
            10: [],
            11: ["POST /admin/reviews/{id}/decision"],
        }
        for ex_title, ex_desc, ex_code in API.EXAMPLES:
            if ex_title in prefix_map.get(mi, []):
                a(("h3", f"{mi}.1 {ex_title} · {ex_desc}"))
                a(("code", ex_code))

    # realtime
    a(("pagebreak",))
    a(("h1", "12 实时通道"))
    a(("p", "队伍聊天与通知使用 WebSocket；AI 回答使用 SSE。两者均复用 HTTP 的 JWT 鉴权，连接建立后 30 分钟内必须发送一次心跳。"))
    a(("table", ["通道", "地址", "用途", "鉴权"], [
        ["WebSocket", "wss://api.travelog.cn/ws/v1?token=<access>", "队伍消息、通知、在线状态", "查询参数 token + Origin 校验"],
        ["SSE", "POST /api/v1/ai/conversations/{id}/messages", "AI 流式回答", "Authorization 头"],
    ], [3.0, 7.4, 4.2, 2.4]))
    a(("code", """// WebSocket 客户端 → 服务端
{ "type": "join", "teamId": "team_1", "lastSeq": 128 }
{ "type": "message", "teamId": "team_1", "clientId": "c_91",
  "content": { "kind": "TEXT", "text": "明早见" } }

// 服务端 → 客户端
{ "type": "message", "teamId": "team_1", "seq": 129,
  "messageId": "tm_881", "senderId": "u_8821",
  "content": { "kind": "TEXT", "text": "明早见" }, "sentAt": "2026-10-18T21:09:00+08:00" }
{ "type": "ack", "clientId": "c_91", "seq": 129 }"""))
    a(("p", "消息按 `seq` 严格递增，断线重连时携带 `lastSeq` 拉取增量；服务端保留 7 天消息用于补拉，更早的消息需通过历史接口分页获取。"))

    # callbacks
    a(("h1", "13 回调"))
    a(("table", ["回调", "方向", "说明"], [
        ["POST /callbacks/moderation", "供应商 → 平台", "机器审核结果；校验签名与时间戳"],
        ["POST /callbacks/realname", "供应商 → 平台", "实名结果；仅返回结论与流水号"],
        ["POST /callbacks/storage", "对象存储 → 平台", "上传完成事件；幂等处理"],
    ], [5.6, 4.4, 7.0]))
    a(("p", "回调统一要求 `X-Signature: hmac-sha256(timestamp + body)`，时间窗 5 分钟；重复回调按 `eventId` 幂等。处理失败返回 500 让供应方重试，重试 6 次后进入死信。"))

    # objects
    a(("pagebreak",))
    a(("h1", "14 对象模型"))
    a(("p", "以下为常用对象的字段示例。字段类型、必填与枚举以 OpenAPI 为准。"))
    for name, obj in API.OBJECTS.items():
        a(("h3", name))
        a(("code", json.dumps(obj, ensure_ascii=False, indent=2)))

    a(("h1", "15 枚举"))
    a(("table", ["枚举", "取值", "说明"], [
        [e[0], e[1], e[2]] for e in API.ENUMS
    ], [3.2, 9.0, 4.8], {"font_size": 8.0}))

    a(("h1", "16 OpenAPI 与代码生成"))
    a(("p", "随文档提供 `openapi.yaml`（OpenAPI 3.1），覆盖全部资源与主要字段。建议以契约为唯一事实源："))
    a(("code", """# TypeScript 类型与请求函数
pnpm dlx openapi-typescript ./openapi.yaml -o packages/api-client/src/schema.d.ts
pnpm dlx orval --config orval.config.ts

# Java 接口骨架（只生成一次，后续手写实现）
openapi-generator-cli generate -i openapi.yaml -g spring \\
  -o server/api --additional-properties=interfaceOnly=true,useSpringBoot3=true"""))
    a(("p", "CI 中执行破坏性变更检测（如 `oasdiff`）；任何删除字段、收紧校验、修改枚举含义的变更都必须升级版本并更新本文件。"))

    a(("h1", "17 兼容与废弃"))
    a(("bullets", [
        "新增字段、新增枚举值、新增可选参数视为兼容变更，客户端必须忽略未知字段。",
        "删除字段、修改字段类型、改变默认值、修改错误码语义视为破坏性变更，需升 `/v2`。",
        "废弃接口在响应头返回 `Deprecation` 与 `Sunset`，并至少保留 6 个月。",
        "所有接口变更需更新 OpenAPI、接口文档与变更日志，评审通过后合并。",
    ]))

    K.render(doc, b)
    K.save(doc, OUT)


if __name__ == "__main__":
    build()
