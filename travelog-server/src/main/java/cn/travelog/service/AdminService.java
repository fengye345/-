package cn.travelog.service;

import cn.travelog.common.ApiException;
import cn.travelog.common.PageResult;
import cn.travelog.model.Models.*;
import cn.travelog.store.DataStore;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {
    private final DataStore store;

    public AdminService(DataStore store) {
        this.store = store;
    }

    public void requireAdmin(User user) {
        if (user == null || !user.admin) {
            throw ApiException.forbidden("ADMIN_403_01", "需要管理员权限");
        }
    }

    public PageResult<Map<String, Object>> reviews(String status, int page, int size) {
        List<Map<String, Object>> list = store.reviews.values().stream()
                .filter(r -> status == null || status.isBlank() || r.status.equalsIgnoreCase(status))
                .sorted(Comparator.comparing(r -> r.createdAt))
                .map(Views::review)
                .toList();
        return PageResult.of(list, page, size);
    }

    public Map<String, Object> decideReview(String reviewId, String decision, String reason) {
        Review r = store.reviews.get(reviewId);
        if (r == null) throw ApiException.notFound("ADMIN_404_01", "审核任务不存在");
        String normalized = decision == null ? "" : decision.toUpperCase();
        if (!List.of("APPROVE", "REJECT", "REMOVE").contains(normalized)) {
            throw ApiException.unprocessable("ADMIN_422_01", "不支持的审核决定");
        }
        r.status = "RESOLVED";
        r.decision = normalized;
        if ("POST".equals(r.targetType)) {
            Post p = store.posts.get(r.targetId);
            if (p != null) {
                if ("REMOVE".equals(normalized)) p.deleted = true;
                if ("APPROVE".equals(normalized)) p.status = "PUBLISHED";
            }
        }
        Map<String, Object> m = Views.review(r);
        m.put("reason", reason);
        m.put("decidedAt", Instant.now());
        return m;
    }

    public PageResult<Map<String, Object>> reports(String status, int page, int size) {
        List<Map<String, Object>> list = store.reports.values().stream()
                .filter(r -> status == null || status.isBlank() || r.status.equalsIgnoreCase(status))
                .sorted(Comparator.comparing(r -> r.createdAt))
                .map(Views::report)
                .toList();
        return PageResult.of(list, page, size);
    }

    public Map<String, Object> decideReport(String reportId, String decision, String reason) {
        Report r = store.reports.get(reportId);
        if (r == null) throw ApiException.notFound("ADMIN_404_02", "举报不存在");
        String normalized = decision == null ? "" : decision.toUpperCase();
        if (!List.of("RESOLVE", "DISMISS", "BAN").contains(normalized)) {
            throw ApiException.unprocessable("ADMIN_422_02", "不支持的举报决定");
        }
        r.status = "RESOLVED";
        if ("BAN".equals(normalized) && "USER".equals(r.targetType)) {
            User target = store.users.get(r.targetId);
            if (target != null) target.status = "BLOCKED";
        }
        Map<String, Object> m = Views.report(r);
        m.put("decision", normalized);
        m.put("reason", reason);
        m.put("decidedAt", Instant.now());
        return m;
    }

    public PageResult<Map<String, Object>> users(String q, int page, int size) {
        List<Map<String, Object>> list = store.users.values().stream()
                .filter(u -> q == null || q.isBlank() || u.nickname.contains(q) || u.id.contains(q))
                .sorted(Comparator.comparing(u -> u.createdAt))
                .map(u -> {
                    Map<String, Object> m = Views.user(u);
                    m.put("phone", u.phone == null ? null : u.phone.substring(0, 3) + "****" + u.phone.substring(7));
                    return m;
                })
                .toList();
        return PageResult.of(list, page, size);
    }

    public Map<String, Object> ban(String userId, boolean banned, String reason) {
        User u = store.users.get(userId);
        if (u == null) throw ApiException.notFound("ADMIN_404_03", "用户不存在");
        u.status = banned ? "BLOCKED" : "ACTIVE";
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userId", userId);
        m.put("status", u.status);
        m.put("reason", reason);
        m.put("updatedAt", Instant.now());
        return m;
    }

    public PageResult<Map<String, Object>> cities(String q, int page, int size) {
        List<Map<String, Object>> list = store.cities.values().stream()
                .filter(c -> q == null || q.isBlank() || c.name.contains(q) || c.pinyin.startsWith(q.toLowerCase()))
                .sorted(Comparator.comparing(c -> c.adcode))
                .map(Views::city)
                .toList();
        return PageResult.of(list, page, size);
    }

    public Map<String, Object> patchCity(String adcode, Map<String, Object> body) {
        City c = store.cities.get(adcode);
        if (c == null) throw ApiException.notFound("ADMIN_404_04", "城市不存在");
        if (body.get("hot") instanceof Boolean hot) c.hot = hot;
        if (body.get("level") instanceof String level) c.level = level;
        if (body.get("lit") instanceof Boolean lit) c.lit = lit;
        return Views.city(c);
    }

    public Map<String, Object> importCities(List<Map<String, Object>> items) {
        int created = 0;
        for (Map<String, Object> item : items == null ? List.<Map<String, Object>>of() : items) {
            String adcode = String.valueOf(item.getOrDefault("adcode", ""));
            if (adcode.isBlank() || store.cities.containsKey(adcode)) continue;
            City c = new City();
            c.adcode = adcode;
            c.name = String.valueOf(item.getOrDefault("name", "未命名"));
            c.province = String.valueOf(item.getOrDefault("province", "未知"));
            c.pinyin = String.valueOf(item.getOrDefault("pinyin", ""));
            c.hot = Boolean.TRUE.equals(item.get("hot"));
            store.cities.put(adcode, c);
            created++;
        }
        return Map.of("created", created, "total", store.cities.size());
    }

    public Map<String, Object> flags() {
        return store.flags;
    }

    public Map<String, Object> putFlag(String key, Object value) {
        if (key == null || key.isBlank()) throw ApiException.unprocessable("ADMIN_422_03", "开关名不能为空");
        store.flags.put(key, value);
        return Map.of("key", key, "value", value, "updatedAt", Instant.now());
    }

    public Map<String, Object> metrics() {
        long pending = store.reviews.values().stream().filter(r -> "PENDING".equals(r.status)).count();
        long reports = store.reports.values().stream().filter(r -> "PENDING".equals(r.status)).count();
        long activeShares = store.sessions.values().stream().filter(s -> "ACTIVE".equals(s.status)).count();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("users", store.users.size());
        m.put("litCities", store.cities.values().stream().filter(c -> c.lit).count());
        m.put("posts", store.posts.values().stream().filter(p -> !p.deleted).count());
        m.put("memoryBoxes", store.boxes.values().stream().filter(b -> !b.deleted).count());
        m.put("activeShares", activeShares);
        m.put("pendingReviews", pending);
        m.put("pendingReports", reports);
        m.put("aiRequestsToday", store.aiUsage.values().stream().mapToInt(Integer::intValue).sum());
        m.put("dau", 1280);
        m.put("series", List.of(
                Map.of("date", "10-22", "users", 1120, "posts", 86),
                Map.of("date", "10-23", "users", 1188, "posts", 94),
                Map.of("date", "10-24", "users", 1210, "posts", 90),
                Map.of("date", "10-25", "users", 1322, "posts", 108),
                Map.of("date", "10-26", "users", 1410, "posts", 132),
                Map.of("date", "10-27", "users", 1366, "posts", 121),
                Map.of("date", "10-28", "users", 1280, "posts", 98)));
        return m;
    }
}
