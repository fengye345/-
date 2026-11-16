# -*- coding: utf-8 -*-
"""Generate OpenAPI 3.1 (JSON + YAML) from the shared endpoint inventory."""
import json
import os
import re

import api_spec as API

HERE = os.path.dirname(os.path.abspath(__file__))


def schema_from(value):
    if isinstance(value, bool):
        return {"type": "boolean"}
    if isinstance(value, int):
        return {"type": "integer"}
    if isinstance(value, float):
        return {"type": "number"}
    if isinstance(value, list):
        return {"type": "array", "items": schema_from(value[0]) if value else {}}
    if isinstance(value, dict):
        return {
            "type": "object",
            "properties": {k: schema_from(v) for k, v in value.items()},
        }
    if isinstance(value, str) and re.match(r"^\d{4}-\d{2}-\d{2}T", value):
        return {"type": "string", "format": "date-time"}
    return {"type": "string"}


SCHEMAS = {name: schema_from(obj) for name, obj in API.OBJECTS.items()}
SCHEMAS.update({
    "Error": {
        "type": "object",
        "properties": {
            "code": {"type": "string"},
            "message": {"type": "string"},
            "data": {"type": "object"},
            "traceId": {"type": "string"},
        },
        "required": ["code", "message", "traceId"],
    },
    "ApiEnvelope": {
        "type": "object",
        "properties": {
            "code": {"type": ["integer", "string"]},
            "message": {"type": "string"},
            "data": {},
            "traceId": {"type": "string"},
        },
        "required": ["code", "message", "traceId"],
    },
    "SmsCodeRequest": {
        "type": "object",
        "properties": {"phone": {"type": "string", "pattern": "^1\\d{10}$"}, "scene": {"type": "string", "enum": ["LOGIN", "BIND"]}},
        "required": ["phone"],
    },
    "SmsLoginRequest": {
        "type": "object",
        "properties": {
            "phone": {"type": "string"},
            "code": {"type": "string"},
            "device": {"type": "object", "properties": {"platform": {"type": "string", "enum": ["IOS", "ANDROID", "WEB"]}, "name": {"type": "string"}, "appVersion": {"type": "string"}}},
        },
        "required": ["phone", "code"],
    },
    "LocationPoint": {
        "type": "object",
        "properties": {
            "lat": {"type": "number"}, "lng": {"type": "number"},
            "accuracy": {"type": "number"},
            "capturedAt": {"type": "string", "format": "date-time"},
            "source": {"type": "string", "enum": ["GPS", "NETWORK", "FUSED"]},
        },
        "required": ["lat", "lng", "accuracy", "capturedAt"],
    },
    "LocationBatchRequest": {
        "type": "object",
        "properties": {
            "points": {"type": "array", "items": {"$ref": "#/components/schemas/LocationPoint"}, "maxItems": 50},
            "device": {"type": "object", "properties": {"mockLocation": {"type": "boolean"}, "rooted": {"type": "boolean"}}},
        },
        "required": ["points"],
    },
    "ManualVisitRequest": {
        "type": "object",
        "properties": {
            "cityAdcode": {"type": "string"},
            "date": {"type": "string", "format": "date"},
            "mediaIds": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["cityAdcode", "date", "mediaIds"],
    },
    "PostCreateRequest": {
        "type": "object",
        "properties": {
            "type": {"type": "string", "enum": ["NOW", "TODAY", "LONG"]},
            "cityAdcode": {"type": "string"},
            "place": {"type": "string"},
            "content": {"type": "string", "maxLength": 500},
            "mediaIds": {"type": "array", "maxItems": 9, "items": {"type": "string"}},
            "location": {"type": "object", "properties": {"lat": {"type": "number"}, "lng": {"type": "number"}, "accuracy": {"type": "number"}}},
            "validity": {"type": "string"},
        },
        "required": ["type", "cityAdcode", "content"],
    },
    "UploadIntentRequest": {
        "type": "object",
        "properties": {
            "fileName": {"type": "string"}, "contentType": {"type": "string"},
            "size": {"type": "integer"}, "sha256": {"type": "string"},
            "scene": {"type": "string", "enum": ["MEMORY_BOX", "POST", "AVATAR"]},
        },
        "required": ["fileName", "contentType", "size", "scene"],
    },
    "ShareLinkRequest": {
        "type": "object",
        "properties": {"expiresInDays": {"type": "integer", "enum": [1, 7, 30]}, "watermark": {"type": "boolean"}, "password": {"type": ["string", "null"]}},
        "required": ["expiresInDays"],
    },
    "AiMessageRequest": {
        "type": "object",
        "properties": {
            "content": {"type": "string", "maxLength": 500},
            "mode": {"type": "string", "enum": ["HALF_DAY", "FULL_DAY", "QUICK_QA"]},
            "pace": {"type": "string", "enum": ["RELAXED", "PACKED"]},
        },
        "required": ["content"],
    },
    "ReviewDecision": {
        "type": "object",
        "properties": {
            "decision": {"type": "string", "enum": ["APPROVE", "REJECT", "REMOVE"]},
            "reason": {"type": "string"},
            "labels": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["decision", "reason"],
    },
    "GenericObject": {"type": "object", "additionalProperties": True},
})

PAGE_OF = {
    "City": {"$ref": "#/components/schemas/City"},
    "Visit": {"$ref": "#/components/schemas/Visit"},
    "MemoryBox": {"$ref": "#/components/schemas/MemoryBox"},
    "Post": {"$ref": "#/components/schemas/Post"},
    "Notification": {"$ref": "#/components/schemas/Notification"},
}


def page(item):
    return {
        "type": "object",
        "properties": {
            "items": {"type": "array", "items": item},
            "nextCursor": {"type": ["string", "null"]},
        },
    }


def data_schema(method, path):
    if path == "/me":
        return {"$ref": "#/components/schemas/User"}
    if path == "/cities":
        return page(PAGE_OF["City"])
    if path == "/cities/{adcode}":
        return {"$ref": "#/components/schemas/City"}
    if path == "/visits":
        return page(PAGE_OF["Visit"])
    if path == "/visits/{visitId}":
        return {"$ref": "#/components/schemas/Visit"}
    if path == "/memory-boxes":
        return page(PAGE_OF["MemoryBox"])
    if path == "/memory-boxes/{boxId}":
        return {"$ref": "#/components/schemas/MemoryBox"}
    if path == "/posts":
        return page(PAGE_OF["Post"])
    if path == "/posts/{postId}":
        return {"$ref": "#/components/schemas/Post"}
    if path == "/teams/{teamId}":
        return {"$ref": "#/components/schemas/Team"}
    if path == "/share/sessions/current":
        return {"$ref": "#/components/schemas/ShareSession"}
    if path == "/ai/conversations/{conversationId}":
        return {"$ref": "#/components/schemas/AIConversation"}
    if path == "/notifications":
        return page(PAGE_OF["Notification"])
    return {"type": "object", "additionalProperties": True}


REQ = {
    "/auth/sms/codes": "SmsCodeRequest",
    "/auth/sessions/sms": "SmsLoginRequest",
    "/location/points": "LocationBatchRequest",
    "/visits/manual": "ManualVisitRequest",
    "/posts": "PostCreateRequest",
    "/media/upload-intents": "UploadIntentRequest",
    "/memory-boxes/{boxId}/share-links": "ShareLinkRequest",
    "/ai/conversations/{conversationId}/messages": "AiMessageRequest",
    "/admin/reviews/{reviewId}/decision": "ReviewDecision",
}


def operation(method, path, summary, scope):
    op = {
        "tags": [TAG_BY_PATH[path]],
        "summary": summary,
        "operationId": re.sub(r"[^a-zA-Z0-9]+", "_", (method + "_" + path).strip("_")).strip("_"),
        "security": [] if scope == "public" else [{"bearerAuth": []}],
    }
    params = []
    for name in re.findall(r"{(\w+)}", path):
        params.append({"name": name, "in": "path", "required": True, "schema": {"type": "string"}})
    if method == "get" and "{" not in path:
        params.append({"name": "cursor", "in": "query", "schema": {"type": "string"}})
        params.append({"name": "limit", "in": "query", "schema": {"type": "integer", "default": 20, "maximum": 50}})
        if path == "/cities":
            params += [
                {"name": "q", "in": "query", "schema": {"type": "string"}},
                {"name": "province", "in": "query", "schema": {"type": "string"}},
                {"name": "lit", "in": "query", "schema": {"type": "boolean"}},
            ]
        if path == "/posts":
            params += [
                {"name": "city", "in": "query", "schema": {"type": "string"}},
                {"name": "type", "in": "query", "schema": {"type": "string", "enum": ["NOW", "TODAY", "LONG", "CULTURE", "QA"]}},
            ]
    if params:
        op["parameters"] = params

    if method in ("post", "patch", "put"):
        ref = REQ.get(path)
        schema = {"$ref": f"#/components/schemas/{ref}"} if ref else {"$ref": "#/components/schemas/GenericObject"}
        op["requestBody"] = {"required": True, "content": {"application/json": {"schema": schema}}}

    status = "200"
    if method == "post" and path in ("/memory-boxes", "/media/upload-intents", "/teams", "/memory-boxes/{boxId}/share-links"):
        status = "201"
    if path == "/posts":
        status = "202"
    response_schema = {
        "allOf": [
            {"$ref": "#/components/schemas/ApiEnvelope"},
            {"type": "object", "properties": {"data": data_schema(method, path)}},
        ]
    }
    op["responses"] = {
        status: {
            "description": "成功",
            "content": {"application/json": {"schema": response_schema}},
        },
        "400": {"$ref": "#/components/responses/BadRequest"},
        "401": {"$ref": "#/components/responses/Unauthorized"},
        "403": {"$ref": "#/components/responses/Forbidden"},
        "404": {"$ref": "#/components/responses/NotFound"},
        "429": {"$ref": "#/components/responses/TooManyRequests"},
        "500": {"$ref": "#/components/responses/ServerError"},
    }
    return op


TAG_BY_PATH = {}
for module, items in API.MODULES:
    for _, path, _, _ in items:
        TAG_BY_PATH[path] = module

paths = {}
for module, items in API.MODULES:
    for method, path, summary, scope in items:
        paths.setdefault(path, {})[method.lower()] = operation(method, path, summary, scope)

spec = {
    "openapi": "3.1.0",
    "info": {
        "title": "旅迹 Travelog API",
        "version": "1.0.0",
        "description": "旅游记录 App 的 REST / SSE 接口。所有响应使用统一信封；城市坐标使用 GCJ-02。",
        "contact": {"name": "旅迹产品与技术组"},
    },
    "servers": [
        {"url": "https://api.travelog.cn/api/v1", "description": "生产"},
        {"url": "https://api-staging.travelog.cn/api/v1", "description": "预发"},
        {"url": "http://localhost:8080/api/v1", "description": "本地"},
    ],
    "tags": [{"name": m, "description": ""} for m, _ in API.MODULES],
    "paths": paths,
    "components": {
        "securitySchemes": {
            "bearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
        },
        "schemas": SCHEMAS,
        "responses": {
            "BadRequest": {"description": "参数错误", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}}},
            "Unauthorized": {"description": "未认证", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}}},
            "Forbidden": {"description": "无权限", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}}},
            "NotFound": {"description": "不存在", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}}},
            "TooManyRequests": {"description": "限流", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}}},
            "ServerError": {"description": "服务异常", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}}},
        },
    },
}


def scalar(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return json.dumps(str(v), ensure_ascii=False)


def yaml_dump(obj, indent=0):
    pad = "  " * indent
    lines = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            key = json.dumps(str(k), ensure_ascii=False)
            if isinstance(v, dict):
                if not v:
                    lines.append(f"{pad}{key}: {{}}")
                else:
                    lines.append(f"{pad}{key}:")
                    lines.append(yaml_dump(v, indent + 1))
            elif isinstance(v, list):
                if not v:
                    lines.append(f"{pad}{key}: []")
                else:
                    lines.append(f"{pad}{key}:")
                    lines.append(yaml_dump(v, indent + 1))
            else:
                lines.append(f"{pad}{key}: {scalar(v)}")
    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, dict):
                if not item:
                    lines.append(f"{pad}- {{}}")
                else:
                    lines.append(f"{pad}-")
                    lines.append(yaml_dump(item, indent + 1))
            elif isinstance(item, list):
                lines.append(f"{pad}-")
                lines.append(yaml_dump(item, indent + 1))
            else:
                lines.append(f"{pad}- {scalar(item)}")
    return "\n".join(lines)


if __name__ == "__main__":
    with open(os.path.join(HERE, "openapi.json"), "w", encoding="utf-8") as f:
        json.dump(spec, f, ensure_ascii=False, indent=2)
    with open(os.path.join(HERE, "openapi.yaml"), "w", encoding="utf-8") as f:
        f.write(yaml_dump(spec) + "\n")
    print("paths:", len(paths), "operations:", sum(len(v) for v in paths.values()))
    print("schemas:", len(SCHEMAS))
