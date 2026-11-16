package cn.travelog.service;

import cn.travelog.common.ApiException;
import cn.travelog.common.PageResult;
import cn.travelog.model.Models.*;
import cn.travelog.store.DataStore;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MeService {
    private final DataStore store;

    public MeService(DataStore store) {
        this.store = store;
    }

    public User user(String userId) {
        User u = store.users.get(userId);
        if (u == null) throw ApiException.unauthorized("账号不存在");
        return u;
    }

    public Map<String, Object> profile(String userId) {
        User u = user(userId);
        Map<String, Object> m = Views.user(u);
        m.put("phone", mask(u.phone));
        m.put("deletion", u.deletionRequestedAt == null ? null : Map.of(
                "requestedAt", u.deletionRequestedAt,
                "daysLeft", Math.max(0, 7 - Duration.between(u.deletionRequestedAt, Instant.now()).toDays())));
        return m;
    }

    public Map<String, Object> patchProfile(String userId, Map<String, Object> body) {
        User u = user(userId);
        if (body.get("nickname") instanceof String nickname && !nickname.isBlank()) u.nickname = nickname.trim();
        if (body.get("bio") instanceof String bio) u.bio = bio;
        if (body.get("gender") instanceof String gender) u.gender = gender;
        if (body.get("homeCity") instanceof String homeCity) u.homeCity = homeCity;
        if (body.get("birthYear") instanceof Number year) u.birthYear = year.intValue();
        if (body.get("tags") instanceof List<?> tags) {
            u.tags = tags.stream().map(String::valueOf).limit(8).toList();
        }
        return profile(userId);
    }

    public Map<String, Object> settings(String userId) {
        User u = user(userId);
        ensureDefaults(u);
        return u.settings;
    }

    public Map<String, Object> settings(String userId, Map<String, Object> body) {
        User u = user(userId);
        ensureDefaults(u);
        body.forEach((k, v) -> {
            if (Set.of("mapVisible", "autoLight", "albumSync", "shareVisible", "notificationLikes", "notificationTeams").contains(k)) {
                u.settings.put(k, v);
            }
        });
        return u.settings;
    }

    public Map<String, Object> realname(String userId, String realName, String idNumber) {
        User u = user(userId);
        if (realName == null || realName.isBlank()) throw ApiException.unprocessable("ME_422_01", "姓名不能为空");
        if (idNumber == null || !idNumber.matches("\\d{17}[0-9Xx]")) {
            throw ApiException.unprocessable("ME_422_02", "身份证号格式不正确");
        }
        u.realnameStatus = "VERIFIED";
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("status", u.realnameStatus);
        m.put("maskedName", realName.substring(0, 1) + "**");
        m.put("maskedId", idNumber.substring(0, 4) + "**********" + idNumber.substring(14));
        m.put("verifiedAt", Instant.now());
        return m;
    }

    public Map<String, Object> realnameStatus(String userId) {
        User u = user(userId);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("status", u.realnameStatus);
        m.put("requiredForShare", true);
        return m;
    }

    public Map<String, Object> requestDeletion(String userId) {
        User u = user(userId);
        if (u.deletionRequestedAt == null) u.deletionRequestedAt = Instant.now();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("requestedAt", u.deletionRequestedAt);
        m.put("daysLeft", 7);
        m.put("cancellable", true);
        return m;
    }

    public void cancelDeletion(String userId) {
        user(userId).deletionRequestedAt = null;
    }

    public List<Map<String, Object>> devices(String userId) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Device d : user(userId).devices) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", d.id);
            m.put("name", d.name);
            m.put("platform", d.platform);
            m.put("lastActiveAt", d.lastActiveAt);
            m.put("current", d.current);
            list.add(m);
        }
        return list;
    }

    public void removeDevice(String userId, String deviceId) {
        User u = user(userId);
        Device d = u.devices.stream().filter(x -> x.id.equals(deviceId)).findFirst()
                .orElseThrow(() -> ApiException.notFound("ME_404_01", "设备不存在"));
        if (d.current) throw ApiException.unprocessable("ME_422_03", "不能移除当前设备");
        u.devices.remove(d);
    }

    public Map<String, Object> notifications(String userId) {
        List<Notification> list = store.notificationsOf(userId);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("items", list.stream().map(Views::notification).toList());
        m.put("unread", list.stream().filter(n -> !n.read).count());
        return m;
    }

    public Map<String, Object> readNotifications(String userId, List<String> ids) {
        int changed = 0;
        for (Notification n : store.notificationsOf(userId)) {
            if (ids == null || ids.isEmpty() || ids.contains(n.id)) {
                if (!n.read) {
                    n.read = true;
                    changed++;
                }
            }
        }
        return Map.of("changed", changed, "unread", store.notificationsOf(userId).stream().filter(n -> !n.read).count());
    }

    public Map<String, Object> notificationSettings(String userId, Map<String, Object> body) {
        User u = user(userId);
        ensureDefaults(u);
        if (body != null) body.forEach(u.settings::put);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("likes", u.settings.getOrDefault("notificationLikes", true));
        m.put("teams", u.settings.getOrDefault("notificationTeams", true));
        m.put("system", true);
        return m;
    }

    public List<Map<String, Object>> blacklist(String userId) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (String id : store.blacklist.getOrDefault(userId, Set.of())) {
            User u = store.users.get(id);
            if (u == null) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", id);
            m.put("nickname", u.nickname);
            m.put("blockedAt", Instant.now());
            list.add(m);
        }
        return list;
    }

    public Map<String, Object> block(String userId, String targetId) {
        if (userId.equals(targetId)) throw ApiException.unprocessable("ME_422_04", "不能拉黑自己");
        if (!store.users.containsKey(targetId)) throw ApiException.notFound("ME_404_02", "用户不存在");
        store.blacklist.computeIfAbsent(userId, k -> java.util.concurrent.ConcurrentHashMap.newKeySet()).add(targetId);
        return Map.of("userId", targetId, "blocked", true);
    }

    public void unblock(String userId, String targetId) {
        Set<String> set = store.blacklist.get(userId);
        if (set != null) set.remove(targetId);
    }

    public Map<String, Object> report(String userId, String targetType, String targetId, String reason) {
        Report r = new Report();
        r.id = store.id("rep");
        r.reporterId = userId;
        r.targetType = targetType == null ? "USER" : targetType;
        r.targetId = targetId;
        r.reason = reason == null ? "用户举报" : reason;
        store.reports.put(r.id, r);
        return Views.report(r);
    }

    public PageResult<Map<String, Object>> favorites(String userId, int page, int size) {
        List<Map<String, Object>> list = store.favorites.getOrDefault(userId, Set.of()).stream()
                .map(store.posts::get)
                .filter(p -> p != null && !p.deleted)
                .map(p -> Views.post(p, store.users.get(p.authorId), userId,
                        store.votes.containsKey(p.id + ":" + userId + ":LIKE"), true))
                .toList();
        return PageResult.of(list, page, size);
    }

    private void ensureDefaults(User u) {
        u.settings.putIfAbsent("mapVisible", true);
        u.settings.putIfAbsent("autoLight", true);
        u.settings.putIfAbsent("albumSync", true);
        u.settings.putIfAbsent("shareVisible", true);
        u.settings.putIfAbsent("notificationLikes", true);
        u.settings.putIfAbsent("notificationTeams", true);
    }

    private String mask(String phone) {
        if (phone == null || phone.length() < 11) return phone;
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }
}
