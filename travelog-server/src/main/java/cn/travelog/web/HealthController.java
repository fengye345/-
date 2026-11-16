package cn.travelog.web;

import cn.travelog.common.ApiResponse;
import cn.travelog.common.TraceId;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("status", "UP");
        m.put("service", "travelog-server");
        m.put("version", "1.0.0");
        m.put("time", Instant.now());
        m.put("traceId", TraceId.current());
        m.put("demoLogin", Map.of(
                "phone", "13800000000",
                "code", "123456",
                "note", "验证码固定为 123456，仅用于本地演示"));
        m.put("modules", List.of("auth", "cities", "visits", "trips", "memory", "media",
                "share", "teams", "posts", "content", "ai", "notifications", "admin"));
        return ApiResponse.ok(m);
    }
}
