# -*- coding: utf-8 -*-
"""Generate architecture / deployment / flow diagrams for the docs."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(OUT, exist_ok=True)

FONT_PATH = r"C:\Windows\Fonts\msyh.ttc"
BOLD_PATH = r"C:\Windows\Fonts\msyhbd.ttc"
if not os.path.exists(BOLD_PATH):
    BOLD_PATH = FONT_PATH

INK = (26, 31, 28)
MUTED = (111, 118, 111)
JADE = (27, 102, 83)
JADE_DARK = (12, 52, 42)
JADE_LIGHT = (232, 240, 234)
PAPER = (247, 244, 236)
CARD = (255, 254, 250)
LINE = (216, 210, 194)
GOLD = (174, 132, 52)
CLAY = (188, 90, 55)
BLUE = (76, 124, 147)

S = 2


def font(size, bold=False):
    return ImageFont.truetype(BOLD_PATH if bold else FONT_PATH, size * S)


def text(draw, xy, s, size=26, color=INK, bold=False, anchor="la", spacing=8):
    draw.multiline_text(xy, s, font=font(size, bold), fill=color, anchor=anchor, spacing=spacing * S)


def rr(draw, xy, radius, fill, outline, width=2):
    draw.rounded_rectangle(xy, radius=radius * S, fill=fill, outline=outline, width=width * S)


def arrow(draw, x1, y1, x2, y2, color=MUTED, width=2, head=10):
    import math
    draw.line((x1, y1, x2, y2), fill=color, width=width * S)
    ang = math.atan2(y2 - y1, x2 - x1)
    for sign in (-1, 1):
        a = ang + sign * 2.6
        draw.line((x2, y2, x2 + math.cos(a) * head * S, y2 + math.sin(a) * head * S),
                  fill=color, width=width * S)


def canvas(w, h):
    img = Image.new("RGB", (w * S, h * S), PAPER)
    return img, ImageDraw.Draw(img)


def save(img, name, w, h):
    img = img.resize((w, h), Image.LANCZOS)
    p = os.path.join(OUT, name)
    img.save(p, optimize=True)
    print("saved", p, img.size)


def arch():
    W, H = 1800, 1130
    img, d = canvas(W, H)

    def band(y, h, name, sub):
        d.rounded_rectangle((40 * S, y * S, 1760 * S, (y + h) * S), radius=18 * S,
                            outline=(226, 221, 208), width=2 * S)
        text(d, (64 * S, (y + 14) * S), name, 20, JADE, True)
        text(d, (64 * S, (y + 42) * S), sub, 13, MUTED)

    # 1 client
    band(48, 150, "客户端层", "React 19 + TypeScript · 同一套设计令牌")
    clients = [
        ("移动端 PWA / H5", "React + Vite + TanStack Query", "离线缓存 · 安装到桌面"),
        ("原生壳 iOS / Android", "Capacitor · 推送 · 定位桥", "城市点亮 / 相册 / 相机"),
        ("运营管理后台", "React + Ant Design Pro", "审核 · 城市库 · 配置"),
    ]
    for i, (t, s, s2) in enumerate(clients):
        x = 64 + i * 560
        rr(d, (x * S, 116 * S, (x + 540) * S, 182 * S), 12, CARD, LINE)
        text(d, ((x + 20) * S, 126 * S), t, 20, INK, True)
        text(d, ((x + 20) * S, 154 * S), s + " · " + s2, 14, MUTED)

    # 2 access
    band(230, 124, "接入层", "TLS 1.3 · 统一鉴权 · 限流与审计")
    access = [
        ("CDN + WAF", "静态资源 / 防爬 / 限流"),
        ("Nginx Ingress", "灰度 / 路由 / mTLS"),
        ("API 网关能力", "JWT 校验 / 配额 / 审计"),
        ("OpenAPI 契约", "→ TS / Java 代码生成"),
    ]
    for i, (t, s) in enumerate(access):
        x = 64 + i * 420
        rr(d, (x * S, 296 * S, (x + 396) * S, 342 * S), 10, CARD, LINE)
        text(d, ((x + 16) * S, 306 * S), t, 18, INK, True)
        text(d, ((x + 16) * S, 328 * S), s, 13, MUTED)

    # 3 application
    band(386, 344, "应用层", "Spring Boot 模块化单体 + Python AI 服务 + 异步 Worker")
    d.rounded_rectangle((64 * S, 454 * S, 1150 * S, 690 * S), radius=14 * S,
                        fill=(250, 252, 248), outline=(192, 212, 196), width=2 * S)
    text(d, (84 * S, 468 * S), "travel-api  ·  Spring Boot 3.4 / Java 21", 20, JADE_DARK, True)
    text(d, (84 * S, 494 * S), "Spring Modulith 模块化单体，按领域边界可拆分", 13, MUTED)
    mods = [
        ("auth", "登录 / 实名 / 设备"), ("city", "城市 / 点亮 / 搜索"),
        ("memory", "旅行 / 回忆盒"), ("media", "上传 / 转码 / 审核"),
        ("share", "共享 / 匹配 / 队伍"), ("content", "此刻 / 文化 / 问答"),
        ("ai", "AI 编排 / 来源"), ("admin", "审核 / 配置 / 看板"),
    ]
    for i, (t, s) in enumerate(mods):
        col, row = i % 4, i // 4
        x = 84 + col * 260
        y = 524 + row * 78
        rr(d, (x * S, y * S, (x + 242) * S, (y + 66) * S), 9, CARD, LINE)
        text(d, ((x + 12) * S, (y + 9) * S), t, 17, JADE, True)
        text(d, ((x + 12) * S, (y + 34) * S), s, 12, MUTED)

    rr(d, (1180 * S, 454 * S, 1712 * S, 564 * S), 12, (252, 246, 235), (224, 208, 176))
    text(d, (1200 * S, 468 * S), "ai-service · Python FastAPI", 18, (122, 84, 24), True)
    text(d, (1200 * S, 496 * S), "LLM 路由 / RAG 检索 / 来源校验", 13, MUTED)
    text(d, (1200 * S, 520 * S), "SSE 流式输出 / 内容安全二次校验", 13, MUTED)

    rr(d, (1180 * S, 580 * S, 1712 * S, 690 * S), 12, (252, 246, 235), (224, 208, 176))
    text(d, (1200 * S, 594 * S), "worker · Java + Python", 18, (122, 84, 24), True)
    text(d, (1200 * S, 622 * S), "聚类 / 导出 / 过期折叠 / 通知", 13, MUTED)
    text(d, (1200 * S, 646 * S), "审核回调 / 城市边界导入 / 指标汇总", 13, MUTED)

    arrow(d, 1152 * S, 509 * S, 1176 * S, 509 * S, GOLD, 2, 7)
    text(d, (1164 * S, 494 * S), "HMAC", 10, GOLD, False, "mm")

    # 4 data
    band(762, 168, "数据层", "主数据、缓存、对象存储与事件流")
    data = [
        ("PostgreSQL 16", "PostGIS 3.4 · pgvector 0.7"),
        ("Redis 7", "缓存 / 限流 / GEO / 会话"),
        ("MinIO / OSS", "原图 · 转码 · 导出物"),
        ("Kafka 3.8", "Outbox 事件 · 异步任务"),
        ("Elasticsearch", "公共内容检索（二期）"),
    ]
    for i, (t, s) in enumerate(data):
        x = 64 + i * 336
        rr(d, (x * S, 830 * S, (x + 312) * S, 900 * S), 10, CARD, LINE)
        text(d, ((x + 16) * S, 840 * S), t, 18, INK, True)
        text(d, ((x + 16) * S, 868 * S), s, 12, MUTED)

    # 5 external
    band(962, 140, "外部服务", "全部为持牌合规供应商，密钥托管在配置中心")
    ext = ["高德地图 / 天地图", "和风天气", "阿里云短信", "实人认证", "内容安全", "通义 / DeepSeek"]
    for i, t in enumerate(ext):
        x = 64 + i * 272
        rr(d, (x * S, 1022 * S, (x + 252) * S, 1074 * S), 10, (252, 250, 244), (226, 220, 206))
        text(d, ((x + 126) * S, 1048 * S), t, 14, INK, False, "mm")

    # layer arrows
    for y1, y2 in ((198, 228), (354, 384), (730, 760), (930, 960)):
        arrow(d, 900 * S, y1 * S, 900 * S, y2 * S, MUTED, 2, 7)

    save(img, "arch.png", W, H)


def deploy():
    W, H = 1800, 1010
    img, d = canvas(W, H)

    rr(d, (40 * S, 130 * S, 240 * S, 280 * S), 14, CARD, LINE)
    text(d, (140 * S, 168 * S), "用户", 22, INK, True, "ma")
    text(d, (140 * S, 206 * S), "App / PWA\n管理后台", 15, MUTED, False, "ma")

    rr(d, (290 * S, 110 * S, 500 * S, 300 * S), 14, (250, 252, 248), (196, 214, 200))
    text(d, (395 * S, 146 * S), "边缘接入", 19, JADE, True, "ma")
    text(d, (395 * S, 182 * S), "CDN / WAF\nSLB\nNginx Ingress", 15, MUTED, False, "ma")

    rr(d, (540 * S, 60 * S, 1420 * S, 470 * S), 16, (247, 250, 246), (176, 202, 184))
    text(d, (980 * S, 86 * S), "Kubernetes · prod namespace（3 AZ）", 20, JADE_DARK, True, "ma")
    pods = [("travel-api ×3", "2C4G · HPA 3-12"), ("ai-service ×2", "2C4G · GPU 可选"), ("worker ×2", "2C4G · 队列长度")]
    for i, (t, s) in enumerate(pods):
        x = 580 + i * 270
        rr(d, (x * S, 120 * S, (x + 240) * S, 210 * S), 10, CARD, LINE)
        text(d, ((x + 16) * S, 138 * S), t, 18, INK, True)
        text(d, ((x + 16) * S, 168 * S), s, 13, MUTED)

    for i, (t, s) in enumerate([
        ("对象存储 OSS", "原图 / 转码 / 导出"),
        ("消息队列 Kafka", "Outbox → 消费"),
        ("缓存 Redis", "会话 / 限流 / GEO"),
    ]):
        x = 580 + i * 270
        rr(d, (x * S, 240 * S, (x + 240) * S, 320 * S), 10, (252, 250, 243), (226, 220, 206))
        text(d, ((x + 16) * S, 258 * S), t, 17, INK, True)
        text(d, ((x + 16) * S, 288 * S), s, 13, MUTED)

    rr(d, (580 * S, 350 * S, 1120 * S, 420 * S), 10, (252, 250, 243), (226, 220, 206))
    text(d, (600 * S, 368 * S), "RDS PostgreSQL 16 · 主备 + 只读副本 · 自动备份 7 天", 16, INK, True)
    text(d, (600 * S, 396 * S), "pgvector 扩展 · 慢查询告警 · 连接池 HikariCP", 12, MUTED)

    rr(d, (540 * S, 520 * S, 950 * S, 680 * S), 14, CARD, LINE)
    text(d, (566 * S, 542 * S), "可观测性", 18, JADE, True)
    text(d, (566 * S, 574 * S), "OpenTelemetry → Prometheus / Grafana\nLoki 日志 · Tempo 链路 · Sentry 前端\n告警：P1 5 分钟 / P2 30 分钟", 13, MUTED, spacing=7)

    rr(d, (980 * S, 520 * S, 1400 * S, 680 * S), 14, CARD, LINE)
    text(d, (1006 * S, 542 * S), "交付流水线", 18, JADE, True)
    text(d, (1006 * S, 574 * S), "GitLab CI → 单测 / 契约 / 镜像扫描\nHarbor → Argo CD → 灰度 10% → 全量\n数据库迁移：Flyway（向前兼容）", 13, MUTED, spacing=7)

    for i, (t, s, color) in enumerate([
        ("dev", "本地 Docker Compose", (226, 220, 206)),
        ("staging", "1/2 规格 · 脱敏数据", (226, 220, 206)),
        ("prod", "3 AZ · 多副本 · 灰度", (176, 202, 184)),
    ]):
        x = 540 + i * 292
        rr(d, (x * S, 740 * S, (x + 270) * S, 830 * S), 12, CARD, color)
        text(d, ((x + 16) * S, 758 * S), t, 19, INK, True)
        text(d, ((x + 16) * S, 792 * S), s, 13, MUTED)

    arrow(d, 245 * S, 205 * S, 286 * S, 205 * S, MUTED, 2, 7)
    arrow(d, 505 * S, 205 * S, 536 * S, 205 * S, MUTED, 2, 7)

    text(d, (760 * S, 900 * S), "生产环境数据不落本地磁盘；对象存储与数据库开启静态加密，密钥由 KMS 托管。", 14, MUTED, False, "mm")
    save(img, "deploy.png", W, H)


def flow():
    W, H = 1800, 480
    img, d = canvas(W, H)
    steps = [
        ("01", "定位上报", "前台 1 次 / 5 分钟\n位移 > 200m 追加\n地理围栏低功耗唤醒"),
        ("02", "停留判定", "城市边界内累计 ≥ 30 分钟\n≥ 2 个定位点，间隔 ≥ 10 分钟\n精度 ≤ 200m"),
        ("03", "风控校验", "模拟定位 / 越狱 root\n速度与瞬移检测\n低置信度转人工"),
        ("04", "写入到访", "同城 24h 去重\nvisit + Outbox 事件\n更新城市统计"),
        ("05", "点亮与卡片", "首次点亮动画\n城市卡 / 省份进度\n触发回忆盒识别"),
    ]
    for i, (n, t, s) in enumerate(steps):
        x = 40 + i * 350
        rr(d, (x * S, 50 * S, (x + 300) * S, 280 * S), 16, CARD, (208, 222, 210))
        d.ellipse(((x + 22) * S, 72 * S, (x + 62) * S, 112 * S), fill=JADE_LIGHT)
        text(d, ((x + 42) * S, 84 * S), n, 15, JADE, True, "mm")
        text(d, ((x + 22) * S, 132 * S), t, 21, INK, True)
        text(d, ((x + 22) * S, 172 * S), s, 13, MUTED, spacing=8)
        if i < 4:
            arrow(d, (x + 302) * S, 165 * S, (x + 338) * S, 165 * S, JADE, 3, 8)
    text(d, (900 * S, 340 * S), "判定在服务端完成；客户端只上报原始点，不参与“是否点亮”的计算。", 15, MUTED, False, "mm")
    text(d, (900 * S, 378 * S), "原始定位点保留 7 天后降精度为城市级；用户可关闭自动点亮并删除历史。", 15, MUTED, False, "mm")
    save(img, "flow.png", W, H)


if __name__ == "__main__":
    arch()
    deploy()
    flow()
