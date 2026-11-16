package cn.travelog.service;

import cn.travelog.model.Models.*;
import cn.travelog.store.DataStore;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Explicit API projections so internal fields (phone, admin flags) never leak. */
public final class Views {
    private Views() {
    }

    public static Map<String, Object> user(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (u == null) return m;
        m.put("id", u.id);
        m.put("nickname", u.nickname);
        m.put("avatarUrl", u.avatarUrl);
        m.put("gender", u.gender);
        m.put("birthYear", u.birthYear);
        m.put("homeCity", u.homeCity);
        m.put("bio", u.bio);
        m.put("tags", u.tags);
        m.put("realnameStatus", u.realnameStatus);
        m.put("status", u.status);
        m.put("admin", u.admin);
        m.put("createdAt", u.createdAt);
        return m;
    }

    public static Map<String, Object> author(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u == null ? "unknown" : u.id);
        m.put("name", u == null ? "旅行者" : u.nickname);
        m.put("initial", u == null || u.nickname.isEmpty() ? "旅" : u.nickname.substring(0, 1));
        m.put("verified", u != null && "VERIFIED".equals(u.realnameStatus));
        m.put("hue", hue(u == null ? "u0" : u.id));
        return m;
    }

    public static String hue(String id) {
        int[] values = {1, 2, 3, 4, 5, 6};
        return "a" + values[Math.abs(id.hashCode()) % values.length];
    }

    public static Map<String, Object> city(City c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("adcode", c.adcode);
        m.put("name", c.name);
        m.put("province", c.province);
        m.put("provinceAdcode", c.provinceAdcode);
        m.put("pinyin", c.pinyin);
        m.put("level", c.level);
        m.put("lit", c.lit);
        m.put("visits", c.visits);
        m.put("days", c.days);
        m.put("firstVisitAt", c.firstVisitAt);
        m.put("lastVisitAt", c.lastVisitAt);
        m.put("deepLit", c.deepLit);
        m.put("hot", c.hot);
        return m;
    }

    public static Map<String, Object> visit(Visit v, City c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", v.id);
        m.put("city", city(c));
        m.put("arrivedAt", v.arrivedAt);
        m.put("leftAt", v.leftAt);
        m.put("method", v.method);
        m.put("status", v.status);
        m.put("confidence", v.confidence);
        m.put("durationMinutes", v.durationMinutes);
        m.put("note", v.note);
        m.put("createdAt", v.createdAt);
        return m;
    }

    public static Map<String, Object> box(MemoryBox b, City c, DataStore store) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", b.id);
        m.put("tripId", b.tripId);
        m.put("title", b.title);
        m.put("coverUrl", b.coverUrl);
        m.put("template", b.template);
        m.put("status", b.status);
        m.put("visibility", b.visibility);
        m.put("mediaCount", b.mediaCount);
        m.put("city", city(c));
        m.put("startAt", b.startAt);
        m.put("endAt", b.endAt);
        m.put("updatedAt", b.updatedAt);
        m.put("days", b.days);
        m.put("photos", b.photos);
        m.put("shared", b.shareLinkId != null && store.shareLinks.containsKey(b.shareLinkId));
        ShareLink link = b.shareLinkId == null ? null : store.shareLinks.get(b.shareLinkId);
        m.put("shareUrl", link == null ? null : "https://trip.app/s/" + link.token);
        m.put("shareDays", link == null ? null : Math.max(0,
                java.time.Duration.between(Instant.now(), link.expiresAt).toDays()));
        return m;
    }

    public static Map<String, Object> media(MediaAsset a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.id);
        m.put("boxId", a.boxId);
        m.put("url", a.url);
        m.put("type", a.type);
        m.put("width", a.width);
        m.put("height", a.height);
        m.put("status", a.status);
        m.put("createdAt", a.createdAt);
        return m;
    }

    public static Map<String, Object> shareLink(ShareLink l) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", l.id);
        m.put("boxId", l.boxId);
        m.put("token", l.token);
        m.put("url", "https://trip.app/s/" + l.token);
        m.put("expiresAt", l.expiresAt);
        m.put("password", l.password != null);
        m.put("watermark", l.watermark);
        m.put("revoked", l.revoked);
        m.put("createdAt", l.createdAt);
        return m;
    }

    public static Map<String, Object> post(Post p, User author, String currentUserId, boolean liked, boolean saved) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.id);
        m.put("type", p.type);
        m.put("author", author(author));
        m.put("city", p.city);
        m.put("place", p.place);
        m.put("area", p.area);
        m.put("content", p.content);
        m.put("status", statusOf(p));
        m.put("onSite", p.onSite);
        m.put("publishedAt", p.publishedAt);
        m.put("expiresAt", p.expiresAt);
        m.put("imageUrl", p.imageUrl);
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("valid", p.validCount);
        stats.put("invalid", p.invalidCount);
        stats.put("likes", p.likeCount);
        stats.put("comments", p.commentCount);
        stats.put("liked", liked);
        stats.put("saved", saved);
        m.put("stats", stats);
        m.put("mine", p.authorId.equals(currentUserId));
        return m;
    }

    public static String statusOf(Post p) {
        if (p.deleted) return "DELETED";
        if (p.expiresAt != null && p.expiresAt.isBefore(Instant.now())) return "EXPIRED";
        return p.status;
    }

    public static Map<String, Object> shareSession(ShareSession s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.id);
        m.put("city", s.city);
        m.put("status", s.status);
        m.put("expiresAt", s.expiresAt);
        m.put("distanceBand", s.distanceBand);
        m.put("card", s.card);
        return m;
    }

    public static Map<String, Object> hallUser(HallUser h) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", h.id);
        m.put("name", h.name);
        m.put("initial", h.initial);
        m.put("age", h.age);
        m.put("tags", h.tags);
        m.put("distanceBand", h.distanceBand);
        m.put("why", h.why);
        m.put("note", h.note);
        m.put("verified", h.verified);
        m.put("hue", h.hue);
        m.put("likedYou", h.likedYou);
        return m;
    }

    public static Map<String, Object> team(Team t, String currentUserId) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.id);
        m.put("name", t.name);
        m.put("city", t.city);
        m.put("leaderId", t.leaderId);
        m.put("capacity", t.capacity);
        m.put("memberCount", t.members.size());
        m.put("status", t.status);
        m.put("meeting", t.meeting);
        List<Map<String, Object>> members = new ArrayList<>();
        for (Member member : t.members) {
            Map<String, Object> mm = new LinkedHashMap<>();
            mm.put("userId", member.userId);
            mm.put("name", member.name);
            mm.put("initial", member.initial);
            mm.put("leader", member.leader);
            mm.put("me", member.userId.equals(currentUserId));
            members.add(mm);
        }
        m.put("members", members);
        m.put("messages", t.messages);
        m.put("joinRequests", t.joinRequests);
        return m;
    }

    public static Map<String, Object> notification(Notification n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.id);
        m.put("type", n.type);
        m.put("title", n.title);
        m.put("body", n.body);
        m.put("read", n.read);
        m.put("createdAt", n.createdAt);
        return m;
    }

    public static Map<String, Object> conversation(AiConversation c, Object quota) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.id);
        m.put("city", c.city);
        m.put("createdAt", c.createdAt);
        m.put("messages", c.messages);
        m.put("quota", quota);
        return m;
    }

    public static Map<String, Object> quota(int limit, int used) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("limit", limit);
        m.put("used", used);
        m.put("remaining", Math.max(0, limit - used));
        m.put("resetAt", Instant.now().plus(java.time.Duration.ofHours(24)));
        return m;
    }

    public static Map<String, Object> trip(Trip t, City c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.id);
        m.put("title", t.title);
        m.put("city", city(c));
        m.put("startAt", t.startAt);
        m.put("endAt", t.endAt);
        m.put("visitIds", t.visitIds);
        m.put("mediaCount", t.mediaCount);
        return m;
    }

    public static Map<String, Object> report(Report r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.id);
        m.put("targetType", r.targetType);
        m.put("targetId", r.targetId);
        m.put("reason", r.reason);
        m.put("status", r.status);
        m.put("createdAt", r.createdAt);
        return m;
    }

    public static Map<String, Object> review(Review r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.id);
        m.put("targetType", r.targetType);
        m.put("targetId", r.targetId);
        m.put("title", r.title);
        m.put("content", r.content);
        m.put("status", r.status);
        m.put("decision", r.decision);
        m.put("createdAt", r.createdAt);
        return m;
    }
}
