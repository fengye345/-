package cn.travelog.service;

import cn.travelog.common.ApiException;
import cn.travelog.model.Models.*;
import cn.travelog.store.DataStore;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ShareService {
    private final DataStore store;

    public ShareService(DataStore store) {
        this.store = store;
    }

    public Map<String, Object> start(String userId, String distanceBand) {
        User user = store.users.get(userId);
        if (user == null) throw ApiException.unauthorized("账号不存在");
        if ("BLOCKED".equals(user.status)) {
            throw ApiException.forbidden("SHARE_403_02", "账号当前不可用");
        }
        if (!"VERIFIED".equals(user.realnameStatus)) {
            throw ApiException.forbidden("SHARE_403_01", "需要完成实名核验后才能开启共享");
        }
        String cityName = store.currentCity.getOrDefault(userId, "杭州");
        City city = store.cityByName(cityName);
        if (city == null || !city.lit) {
            throw ApiException.forbidden("SHARE_403_03", "当前城市尚未点亮，不能开启共享");
        }
        ShareSession existing = store.activeSession(userId);
        if (existing != null) return Views.shareSession(existing);

        ShareSession s = new ShareSession();
        s.id = store.id("share");
        s.userId = userId;
        s.city = cityName;
        s.distanceBand = distanceBand == null ? "ONE_KM" : distanceBand;
        s.expiresAt = Instant.now().plus(Duration.ofHours(24));
        s.card.tags = new ArrayList<>(user.tags);
        s.card.dates = List.of("10.18 — 10.21");
        s.card.distanceBand = s.distanceBand;
        s.card.headline = "在" + cityName + "，找一段同路";
        store.sessions.put(s.id, s);
        return Views.shareSession(s);
    }

    public Map<String, Object> current(String userId) {
        ShareSession s = store.activeSession(userId);
        if (s == null) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("active", false);
            m.put("session", null);
            return m;
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("active", true);
        m.put("session", Views.shareSession(s));
        return m;
    }

    public void stop(String userId) {
        ShareSession s = store.activeSession(userId);
        if (s != null) s.status = "STOPPED";
    }

    public List<Map<String, Object>> hall(String userId, String tag, String distance) {
        ShareSession s = store.activeSession(userId);
        if (s == null) throw ApiException.forbidden("SHARE_403_04", "请先开启共享");
        return store.hall.values().stream()
                .filter(h -> !h.id.equals(userId))
                .filter(h -> tag == null || tag.isBlank() || h.tags.contains(tag))
                .filter(h -> distance == null || distance.isBlank() || h.distanceBand.equals(distance))
                .map(Views::hallUser)
                .toList();
    }

    public Map<String, Object> like(String userId, String toUserId) {
        if (store.activeSession(userId) == null) {
            throw ApiException.forbidden("SHARE_403_04", "请先开启共享");
        }
        if (userId.equals(toUserId)) {
            throw ApiException.unprocessable("SHARE_422_01", "不能喜欢自己");
        }
        HallUser target = store.hall.get(toUserId);
        if (target == null) throw ApiException.notFound("SHARE_404_01", "用户不在大厅");
        boolean exists = store.likes.values().stream()
                .anyMatch(l -> l.fromUserId.equals(userId) && l.toUserId.equals(toUserId));
        if (exists) throw ApiException.conflict("SHARE_409_01", "已经表达过喜欢");

        Like like = new Like();
        like.id = store.id("like");
        like.fromUserId = userId;
        like.toUserId = toUserId;
        store.likes.put(like.id, like);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("liked", true);
        boolean mutual = target.likedYou;
        m.put("mutual", mutual);
        if (mutual) {
            Match match = new Match();
            match.id = store.id("match");
            match.a = userId;
            match.b = toUserId;
            store.matches.put(match.id, match);
            Team team = createMatchTeam(userId, target);
            m.put("matchId", match.id);
            m.put("teamId", team.id);
            m.put("user", Views.hallUser(target));
            m.put("message", "你们互相喜欢，已建立匹配与队伍");
        } else {
            m.put("message", "已表达喜欢，双方同意后才会匹配");
        }
        return m;
    }

    public List<Map<String, Object>> received(String userId) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Like like : store.likes.values()) {
            if (!like.toUserId.equals(userId)) continue;
            HallUser from = store.hall.get(like.fromUserId);
            if (from == null) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("likeId", like.id);
            m.put("user", Views.hallUser(from));
            m.put("createdAt", like.createdAt);
            list.add(m);
        }
        return list;
    }

    public List<Map<String, Object>> matches(String userId) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Match match : store.matches.values()) {
            if (!match.a.equals(userId) && !match.b.equals(userId)) continue;
            String other = match.a.equals(userId) ? match.b : match.a;
            HallUser user = store.hall.get(other);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("matchId", match.id);
            m.put("user", user == null ? null : Views.hallUser(user));
            m.put("team", store.teams.values().stream()
                    .filter(t -> t.members.stream().anyMatch(mm -> mm.userId.equals(other)))
                    .findFirst().map(t -> Views.team(t, userId)).orElse(null));
            m.put("createdAt", match.createdAt);
            list.add(m);
        }
        return list;
    }

    private Team createMatchTeam(String userId, HallUser target) {
        Team team = new Team();
        team.id = store.id("team");
        team.name = target.name + " 的慢走小队";
        team.city = store.currentCity.getOrDefault(userId, "杭州");
        team.leaderId = userId;
        team.capacity = 5;
        team.members.add(member(userId, store.users.get(userId).nickname, true));
        team.members.add(member(target.id, target.name, false));
        Message sys = new Message();
        sys.id = store.id("msg");
        sys.userId = "system";
        sys.name = "system";
        sys.system = true;
        sys.text = "你们互相喜欢 · 队伍已建立，集合点仅成员可见";
        team.messages.add(sys);
        store.teams.put(team.id, team);
        return team;
    }

    private Member member(String userId, String name, boolean leader) {
        Member m = new Member();
        m.userId = userId;
        m.name = name;
        m.initial = name == null || name.isEmpty() ? "旅" : name.substring(0, 1);
        m.leader = leader;
        return m;
    }
}
