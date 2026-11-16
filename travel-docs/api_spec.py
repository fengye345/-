# -*- coding: utf-8 -*-
"""Shared API inventory for the Word doc and the OpenAPI generator."""

MODULES = [
    ("认证与账号", [
        ("POST", "/auth/sms/codes", "发送短信验证码（游客）", "public"),
        ("POST", "/auth/sessions/sms", "手机号 + 验证码登录", "public"),
        ("POST", "/auth/sessions/wechat", "微信 OAuth 登录", "public"),
        ("POST", "/auth/sessions/apple", "Apple ID 登录", "public"),
        ("POST", "/auth/tokens/refresh", "刷新访问令牌（轮换）", "public"),
        ("DELETE", "/auth/sessions/current", "退出当前设备", "user"),
        ("GET", "/me", "当前用户与资料", "user"),
        ("PATCH", "/me/profile", "更新昵称、头像、偏好", "user"),
        ("GET", "/me/settings", "读取隐私与通知设置", "user"),
        ("PUT", "/me/settings", "更新隐私与通知设置", "user"),
        ("POST", "/me/realname/verifications", "提交实名核验", "user"),
        ("GET", "/me/realname", "实名状态", "user"),
        ("POST", "/me/deletion", "申请注销（7 天冷静期）", "user"),
        ("DELETE", "/me/deletion", "撤销注销", "user"),
        ("GET", "/me/devices", "登录设备列表", "user"),
        ("DELETE", "/me/devices/{deviceId}", "下线指定设备", "user"),
    ]),
    ("城市与搜索", [
        ("GET", "/cities", "城市搜索与列表（q / province / lit）", "user"),
        ("GET", "/cities/provinces", "省份与完成度", "user"),
        ("GET", "/cities/current", "当前定位城市", "user"),
        ("GET", "/cities/{adcode}", "城市详情", "user"),
        ("GET", "/cities/{adcode}/card", "城市卡（本人视角）", "user"),
    ]),
    ("定位与到访", [
        ("POST", "/location/points", "批量上报定位点（含风控）", "user"),
        ("GET", "/location/state", "定位权限与判定状态", "user"),
        ("GET", "/visits", "到访列表（按城市 / 时间）", "user"),
        ("GET", "/visits/summary", "到访汇总（城市数 / 天数）", "user"),
        ("GET", "/visits/{visitId}", "到访详情", "user"),
        ("POST", "/visits/manual", "手动补录城市", "user"),
        ("DELETE", "/visits/{visitId}", "删除到访", "user"),
        ("POST", "/visits/{visitId}/appeals", "申诉异常点亮", "user"),
    ]),
    ("旅行与回忆盒", [
        ("GET", "/trips", "旅行列表", "user"),
        ("GET", "/trips/{tripId}", "旅行详情", "user"),
        ("POST", "/trips/{tripId}/merge", "合并旅行", "user"),
        ("POST", "/trips/{tripId}/split", "拆分旅行", "user"),
        ("GET", "/memory-boxes", "回忆盒列表（含回收站）", "user"),
        ("POST", "/memory-boxes", "从旅行生成回忆盒", "user"),
        ("GET", "/memory-boxes/{boxId}", "回忆盒详情", "user"),
        ("PATCH", "/memory-boxes/{boxId}", "更新标题 / 模板 / 封面", "user"),
        ("DELETE", "/memory-boxes/{boxId}", "移入 30 天回收站", "user"),
        ("POST", "/memory-boxes/{boxId}/restore", "从回收站恢复", "user"),
        ("GET", "/memory-boxes/{boxId}/media", "素材列表", "user"),
        ("POST", "/memory-boxes/{boxId}/media", "添加素材", "user"),
        ("DELETE", "/memory-boxes/{boxId}/media/{mediaId}", "移除素材", "user"),
        ("PUT", "/memory-boxes/{boxId}/layout", "保存时间线与排序", "user"),
        ("POST", "/memory-boxes/{boxId}/exports", "创建导出任务", "user"),
        ("GET", "/memory-boxes/{boxId}/exports/{jobId}", "导出任务状态", "user"),
        ("POST", "/memory-boxes/{boxId}/share-links", "生成分享链接", "user"),
        ("DELETE", "/share-links/{linkId}", "撤销分享链接", "user"),
        ("GET", "/share-links/{token}", "访问分享链接（公开）", "public"),
    ]),
    ("媒体", [
        ("POST", "/media/upload-intents", "申请预签名直传地址", "user"),
        ("POST", "/media/{mediaId}/complete", "确认上传并触发处理", "user"),
        ("GET", "/media/{mediaId}", "素材元数据与访问地址", "user"),
        ("DELETE", "/media/{mediaId}", "删除素材", "user"),
    ]),
    ("共享与组队", [
        ("POST", "/share/sessions", "开启共享（24 小时）", "share"),
        ("GET", "/share/sessions/current", "当前共享状态与剩余时间", "share"),
        ("DELETE", "/share/sessions/current", "关闭共享", "share"),
        ("GET", "/share/hall", "同城大厅（筛选 + 理由）", "share"),
        ("POST", "/share/likes", "表达喜欢", "share"),
        ("GET", "/share/likes/received", "收到的喜欢", "share"),
        ("GET", "/share/matches", "匹配列表", "share"),
        ("POST", "/teams", "创建队伍", "share"),
        ("GET", "/teams/{teamId}", "队伍详情", "share"),
        ("POST", "/teams/{teamId}/join-requests", "申请加入", "share"),
        ("POST", "/teams/{teamId}/join-requests/{requestId}/approve", "队长审批", "share"),
        ("DELETE", "/teams/{teamId}/members/{userId}", "移除成员 / 退出", "share"),
        ("POST", "/teams/{teamId}/transfer", "转让队长", "share"),
        ("POST", "/teams/{teamId}/dissolve", "解散队伍", "share"),
        ("GET", "/teams/{teamId}/messages", "队伍消息（增量）", "share"),
        ("POST", "/teams/{teamId}/messages", "发送消息", "share"),
        ("PUT", "/teams/{teamId}/meeting", "设置集合点", "share"),
    ]),
    ("公共内容", [
        ("GET", "/posts", "按城市与类型获取信息流", "user"),
        ("GET", "/posts/{postId}", "内容详情", "user"),
        ("POST", "/posts", "发布此刻 / 今日 / 经验", "user"),
        ("PATCH", "/posts/{postId}", "编辑草稿或未过审内容", "user"),
        ("DELETE", "/posts/{postId}", "删除公共副本", "user"),
        ("POST", "/posts/{postId}/votes", "反馈仍有效 / 已失效", "user"),
        ("POST", "/posts/{postId}/favorites", "收藏", "user"),
        ("DELETE", "/posts/{postId}/favorites", "取消收藏", "user"),
        ("GET", "/posts/{postId}/comments", "评论列表", "user"),
        ("POST", "/posts/{postId}/comments", "发表评论 / 追问", "user"),
        ("POST", "/posts/{postId}/renewals", "续期一次", "user"),
        ("POST", "/posts/{postId}/reports", "举报", "user"),
        ("GET", "/culture-cards", "文化卡列表", "user"),
        ("GET", "/culture-cards/{cardId}", "文化卡详情", "user"),
        ("GET", "/questions", "问答列表", "user"),
        ("POST", "/questions", "提问", "user"),
        ("POST", "/questions/{questionId}/answers", "回答", "user"),
    ]),
    ("AI 助手", [
        ("POST", "/ai/conversations", "创建会话（带入上下文）", "user"),
        ("GET", "/ai/conversations/{conversationId}", "会话与消息", "user"),
        ("POST", "/ai/conversations/{conversationId}/messages", "提问（SSE 流式）", "user"),
        ("POST", "/ai/messages/{messageId}/feedback", "有用 / 无用 / 报错", "user"),
        ("GET", "/ai/quota", "今日额度与重置时间", "user"),
        ("DELETE", "/ai/conversations/{conversationId}", "删除会话", "user"),
    ]),
    ("消息、设置与举报", [
        ("GET", "/notifications", "消息中心", "user"),
        ("POST", "/notifications/read", "批量已读", "user"),
        ("GET", "/notifications/settings", "通知偏好", "user"),
        ("PUT", "/notifications/settings", "更新通知偏好", "user"),
        ("GET", "/blacklist", "黑名单", "user"),
        ("POST", "/blacklist", "拉黑", "user"),
        ("DELETE", "/blacklist/{userId}", "解除拉黑", "user"),
        ("POST", "/reports", "举报用户 / 内容 / 队伍", "user"),
    ]),
    ("管理后台", [
        ("GET", "/admin/reviews", "审核队列", "admin"),
        ("POST", "/admin/reviews/{reviewId}/decision", "审核决定", "admin"),
        ("GET", "/admin/reports", "举报队列", "admin"),
        ("POST", "/admin/reports/{reportId}/decision", "举报处置", "admin"),
        ("GET", "/admin/users", "用户查询", "admin"),
        ("POST", "/admin/users/{userId}/ban", "封禁 / 解封", "admin"),
        ("GET", "/admin/cities", "城市库", "admin"),
        ("PATCH", "/admin/cities/{adcode}", "更新城市配置", "admin"),
        ("POST", "/admin/cities/imports", "导入城市边界", "admin"),
        ("GET", "/admin/flags", "功能开关", "admin"),
        ("PUT", "/admin/flags/{key}", "更新开关", "admin"),
        ("GET", "/admin/metrics/overview", "核心指标", "admin"),
    ]),
]

OBJECTS = {
    "User": {
        "id": "u_8821", "nickname": "阿澈", "avatarUrl": "https://cdn.../a.webp",
        "gender": "FEMALE", "birthYear": 2000, "homeCity": "330100",
        "bio": "拍照、徒步、找本地小店", "tags": ["摄影", "徒步", "咖啡"],
        "realnameStatus": "VERIFIED", "status": "ACTIVE", "createdAt": "2023-04-06T10:12:00+08:00",
    },
    "City": {
        "adcode": "330100", "name": "杭州", "province": "浙江省", "provinceAdcode": "330000",
        "pinyin": "hangzhou", "level": "PREFECTURE", "lit": True,
        "visits": 4, "days": 11, "firstVisitAt": "2023-04-06", "lastVisitAt": "2026-10-18",
        "deepLit": True, "hot": True,
    },
    "Visit": {
        "id": "v_100231", "city": {"adcode": "330100", "name": "杭州"},
        "arrivedAt": "2026-10-18T14:20:00+08:00", "leftAt": None,
        "method": "AUTO", "status": "CONFIRMED", "confidence": 0.92,
        "durationMinutes": 47, "createdAt": "2026-10-18T14:52:00+08:00",
    },
    "MemoryBox": {
        "id": "mb_7712", "tripId": "t_991", "title": "杭州 · 秋日漫游",
        "coverUrl": "https://cdn.../cover.webp", "template": "MAGAZINE",
        "status": "DRAFT", "visibility": "PRIVATE", "mediaCount": 18,
        "city": {"adcode": "330100", "name": "杭州"},
        "startAt": "2026-10-18", "endAt": None, "updatedAt": "2026-10-18T20:10:00+08:00",
    },
    "MediaAsset": {
        "id": "m_3201", "type": "PHOTO", "width": 3024, "height": 4032,
        "thumbUrl": "https://cdn.../m_3201_m.webp", "status": "READY",
        "capturedAt": "2026-10-18T16:32:00+08:00", "phash": "9f2c...",
    },
    "ShareLink": {
        "id": "sl_552", "url": "https://trip.app/s/8fh2Kd", "expiresAt": "2026-10-25T20:00:00+08:00",
        "watermark": True, "passwordProtected": False, "status": "ACTIVE",
    },
    "ShareSession": {
        "id": "ss_881", "city": "杭州", "status": "ACTIVE",
        "expiresAt": "2026-10-19T20:00:00+08:00", "distanceBand": "ONE_KM",
        "card": {"ageRange": "25-27", "tags": ["摄影", "徒步"], "lookingFor": "拍照搭子"},
    },
    "Team": {
        "id": "team_1", "name": "周六九溪徒步", "city": "杭州",
        "leaderId": "u_102", "capacity": 8, "memberCount": 4, "status": "OPEN",
        "meeting": {"name": "九溪公交站 C 口", "time": "2026-10-19T08:30:00+08:00"},
    },
    "Post": {
        "id": "p_331", "type": "NOW", "author": {"id": "u_102", "nickname": "陈默"},
        "city": "杭州", "place": "断桥残雪", "area": "西湖景区",
        "content": "断桥这会儿人已经散了……", "status": "PUBLISHED",
        "onSite": True, "publishedAt": "2026-10-18T14:08:00+08:00",
        "expiresAt": "2026-10-18T20:08:00+08:00",
        "stats": {"valid": 12, "invalid": 2, "likes": 34, "comments": 6},
    },
    "AIConversation": {
        "id": "ai_77", "city": "杭州", "createdAt": "2026-10-18T14:20:00+08:00",
        "quota": {"used": 3, "limit": 10, "resetAt": "2026-10-19T00:00:00+08:00"},
    },
    "Notification": {
        "id": "n_1", "type": "TEAM", "title": "Kay 在队伍里提到了你",
        "body": "明早 8:30 九溪公交站，别迟到", "read": False,
        "createdAt": "2026-10-18T21:09:00+08:00",
    },
}

ERRORS = [
    ("AUTH_401_01", "401", "未登录或访问令牌已过期", "调用 /auth/tokens/refresh"),
    ("AUTH_401_02", "401", "验证码错误或已过期", "重新获取验证码"),
    ("AUTH_403_01", "403", "无权访问该资源", "检查资源归属"),
    ("AUTH_403_02", "403", "未完成实名核验", "先完成 FR-ACC-05"),
    ("AUTH_403_03", "403", "未满 18 周岁", "不开放陌生人匹配"),
    ("AUTH_429_01", "429", "验证码请求过于频繁", "60 秒后重试"),
    ("COMMON_400_01", "400", "参数校验失败", "查看 fieldErrors"),
    ("COMMON_404_01", "404", "资源不存在", "检查 ID"),
    ("COMMON_409_01", "409", "当前状态不允许该操作", "刷新后重试"),
    ("COMMON_429_01", "429", "请求频率超限", "按 Retry-After 重试"),
    ("COMMON_500_01", "500", "服务内部异常", "携带 traceId 反馈"),
    ("CITY_404_01", "404", "城市不存在或未上线", "检查 adcode"),
    ("CITY_409_01", "409", "城市已点亮，无需重复点亮", "—"),
    ("VISIT_422_01", "422", "不满足点亮条件", "查看 progress"),
    ("VISIT_403_01", "403", "到访不属于当前用户", "—"),
    ("MEM_404_01", "404", "回忆盒不存在或已删除", "检查回收站"),
    ("MEM_403_01", "403", "无权访问该回忆盒", "—"),
    ("MEM_409_01", "409", "分享链接已撤销或过期", "重新生成"),
    ("MEDIA_413_01", "413", "文件超过大小限制", "单文件 ≤ 20MB"),
    ("MEDIA_415_01", "415", "不支持的文件类型", "仅 jpg/png/heic/mp4"),
    ("SHARE_403_01", "403", "未满足共享开启条件", "点亮 / 定位 / 实名 / 年龄"),
    ("SHARE_409_01", "409", "共享会话已结束", "重新开启"),
    ("SHARE_429_01", "429", "喜欢操作过于频繁", "24 小时后重试"),
    ("TEAM_409_01", "409", "队伍已满或已解散", "选择其他队伍"),
    ("TEAM_403_01", "403", "仅队长可执行该操作", "联系队长"),
    ("POST_403_01", "403", "当前不在现场，无法发布此刻", "改为长期经验"),
    ("POST_422_01", "422", "内容超出长度或图片数量限制", "≤ 500 字 / 9 图"),
    ("POST_409_01", "409", "内容已过期或已下架", "—"),
    ("AI_429_01", "429", "今日 AI 额度已用尽", "次日 00:00 恢复"),
    ("AI_503_01", "503", "模型服务暂不可用", "使用缓存方案"),
    ("AI_422_01", "422", "问题涉及不安全内容", "调整提问"),
    ("ADMIN_403_01", "403", "非审核员或权限不足", "联系管理员"),
]

ENUMS = [
    ("PostType", "NOW / TODAY / LONG / CULTURE / QA", "此刻 / 今日 / 经验 / 文化 / 问答"),
    ("PostStatus", "DRAFT / REVIEWING / PUBLISHED / FOLDED / REJECTED / REMOVED", "内容状态"),
    ("VisitMethod", "AUTO / MANUAL", "自动点亮 / 手动补录"),
    ("VisitStatus", "PENDING / CONFIRMED / REJECTED / DELETED", "到访状态"),
    ("MemoryStatus", "DRAFT / READY / SHARED / RECYCLED / DELETED", "回忆盒状态"),
    ("ShareStatus", "ACTIVE / PAUSED / ENDED", "共享会话状态"),
    ("TeamStatus", "OPEN / FULL / DISSOLVED / DELETED", "队伍状态"),
    ("DistanceBand", "SAME_CITY / THREE_KM / ONE_KM", "距离三档"),
    ("ReportStatus", "PENDING / PROCESSING / RESOLVED / DISMISSED / APPEALING", "举报状态"),
]

EXAMPLES = [
    ("POST /auth/sessions/sms", "手机号验证码登录", """POST /api/v1/auth/sessions/sms
Content-Type: application/json

{
  "phone": "13800138821",
  "code": "482913",
  "device": { "platform": "IOS", "name": "iPhone 15 Pro", "appVersion": "1.0.0" }
}

200 OK
{
  "code": 0,
  "message": "ok",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "rt_9f2c...",
    "expiresIn": 1800,
    "user": { "id": "u_8821", "nickname": "阿澈", "realnameStatus": "VERIFIED" }
  },
  "traceId": "b7c1f0a2e9"
}"""),
    ("GET /cities?q=da", "城市搜索（拼音前缀）", """GET /api/v1/cities?q=da&limit=20
Authorization: Bearer <token>

200 OK
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      { "adcode": "532900", "name": "大理", "province": "云南省",
        "pinyin": "dali", "lit": true, "visits": 2, "days": 6, "deepLit": false },
      { "adcode": "210200", "name": "大连", "province": "辽宁省",
        "pinyin": "dalian", "lit": false, "visits": 0, "days": 0 }
    ],
    "nextCursor": null
  },
  "traceId": "b7c1f0a2e9"
}"""),
    ("POST /location/points", "批量定位上报与停留判定", """POST /api/v1/location/points
Authorization: Bearer <token>
Idempotency-Key: loc_20261018_1420

{
  "points": [
    { "lat": 30.2588, "lng": 120.1499, "accuracy": 38,
      "capturedAt": "2026-10-18T14:20:00+08:00", "source": "GPS" },
    { "lat": 30.2591, "lng": 120.1503, "accuracy": 42,
      "capturedAt": "2026-10-18T14:32:00+08:00", "source": "GPS" }
  ],
  "device": { "mockLocation": false, "rooted": false }
}

200 OK
{
  "code": 0, "message": "ok",
  "data": {
    "city": { "adcode": "330100", "name": "杭州" },
    "progress": { "dwellMinutes": 32, "points": 3, "requiredMinutes": 30, "requiredPoints": 2 },
    "result": "LIT_UP",
    "visitId": "v_100231",
    "risk": { "level": "LOW", "flags": [] }
  },
  "traceId": "b7c1f0a2e9"
}"""),
    ("POST /posts", "发布一条「此刻」", """POST /api/v1/posts
Authorization: Bearer <token>
Idempotency-Key: post_20261018_1408

{
  "type": "NOW",
  "cityAdcode": "330100",
  "place": "断桥残雪",
  "content": "断桥这会儿人已经散了，现在过来刚刚好。湖边风大，记得带件外套。",
  "mediaIds": ["m_3201", "m_3202"],
  "location": { "lat": 30.2591, "lng": 120.1503, "accuracy": 32 },
  "validity": "PT6H"
}

202 Accepted
{
  "code": 0, "message": "ok",
  "data": {
    "postId": "p_331", "status": "REVIEWING", "onSite": true,
    "area": "西湖景区", "expiresAt": "2026-10-18T20:08:00+08:00"
  },
  "traceId": "b7c1f0a2e9"
}"""),
    ("POST /media/upload-intents", "申请预签名直传", """POST /api/v1/media/upload-intents
Authorization: Bearer <token>

{
  "fileName": "IMG_2031.HEIC",
  "contentType": "image/heic",
  "size": 4823104,
  "sha256": "9f2c1a...",
  "scene": "MEMORY_BOX"
}

200 OK
{
  "code": 0, "message": "ok",
  "data": {
    "mediaId": "m_3201",
    "uploadUrl": "https://oss.../u/u_8821/original/202610/m_3201.heic?Signature=...",
    "method": "PUT",
    "headers": { "Content-Type": "image/heic" },
    "expiresIn": 900
  },
  "traceId": "b7c1f0a2e9"
}"""),
    ("POST /memory-boxes/{boxId}/share-links", "生成回忆盒分享链接", """POST /api/v1/memory-boxes/mb_7712/share-links
Authorization: Bearer <token>

{ "expiresInDays": 7, "watermark": true, "password": null }

201 Created
{
  "code": 0, "message": "ok",
  "data": {
    "id": "sl_552",
    "url": "https://trip.app/s/8fh2Kd",
    "expiresAt": "2026-10-25T20:00:00+08:00",
    "watermark": true,
    "passwordProtected": false
  },
  "traceId": "b7c1f0a2e9"
}"""),
    ("GET /share/hall", "同城大厅与匹配理由", """GET /api/v1/share/hall?city=330100&tags=摄影&distance=ONE_KM&limit=20
Authorization: Bearer <token>

200 OK
{
  "code": 0, "message": "ok",
  "data": {
    "items": [
      {
        "userId": "u_1", "nickname": "林小满", "ageRange": "24-25",
        "tags": ["摄影", "咖啡"], "distanceBand": "ONE_KM",
        "score": 86,
        "reasons": [
          { "code": "SAME_CITY", "text": "你们都在杭州" },
          { "code": "TIME_OVERLAP", "text": "停留时间重叠 2 天" },
          { "code": "TAG_MATCH", "text": "3 个共同兴趣" }
        ],
        "liked": false
      }
    ],
    "remainingLikes": 18,
    "nextCursor": null
  },
  "traceId": "b7c1f0a2e9"
}"""),
    ("POST /ai/conversations/{id}/messages", "AI 提问（SSE）", """POST /api/v1/ai/conversations/ai_77/messages
Authorization: Bearer <token>
Accept: text/event-stream
Content-Type: application/json

{ "content": "今天下午去哪", "mode": "HALF_DAY", "pace": "RELAXED" }

200 OK  text/event-stream
event: meta
data: {"messageId":"am_91","quota":{"used":4,"limit":10}}

event: delta
data: {"text":"先给你一条不绕路的半日线："}

event: card
data: {"type":"ITINERARY","title":"周六下午 · 半日路线","stops":[{"time":"13:30","name":"中国美院象山校区"}],"sources":[{"id":"post:p1","updatedAt":"2026-10-18T14:08:00+08:00"}],"uncertain":["象山校区今日是否开放夜场"]}

event: done
data: {"messageId":"am_91","finishReason":"STOP"}"""),
    ("POST /admin/reviews/{id}/decision", "审核决定", """POST /api/v1/admin/reviews/rv_201/decision
Authorization: Bearer <admin token>

{
  "decision": "APPROVE",
  "reason": "内容真实，无敏感信息",
  "labels": ["TRAVEL_NOTE"]
}

200 OK
{
  "code": 0, "message": "ok",
  "data": { "reviewId": "rv_201", "postId": "p_331", "postStatus": "PUBLISHED", "decidedAt": "2026-10-18T14:09:30+08:00" },
  "traceId": "b7c1f0a2e9"
}"""),
]
