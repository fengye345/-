package cn.travelog.service;

import cn.travelog.common.ApiException;
import cn.travelog.model.Models.*;
import cn.travelog.store.DataStore;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class TeamService {
    private final DataStore store;

    public TeamService(DataStore store) {
        this.store = store;
    }

    public Map<String, Object> create(String userId, String name, String city, Integer capacity, Map<String, Object> meeting) {
        User user = store.users.get(userId);
        Team t = new Team();
        t.id = store.id("team");
        t.name = name == null || name.isBlank() ? "西湖慢走小队" : name;
        t.city = city == null ? store.currentCity.getOrDefault(userId, "杭州") : city;
        t.leaderId = userId;
        t.capacity = capacity == null ? 5 : Math.max(2, Math.min(8, capacity));
        Member m = new Member();
        m.userId = userId;
        m.name = user.nickname;
        m.initial = user.nickname.substring(0, 1);
        m.leader = true;
        t.members.add(m);
        if (meeting != null) {
            if (meeting.get("place") instanceof String place) t.meeting.place = place;
            if (meeting.get("time") instanceof String time) t.meeting.time = time;
            if (meeting.get("note") instanceof String note) t.meeting.note = note;
        }
        Message sys = new Message();
        sys.id = store.id("msg");
        sys.userId = "system";
        sys.name = "system";
        sys.system = true;
        sys.text = "队伍已创建 · 集合点仅成员可见";
        t.messages.add(sys);
        store.teams.put(t.id, t);
        return Views.team(t, userId);
    }

    public Team require(String teamId, String userId) {
        Team t = store.teams.get(teamId);
        if (t == null) throw ApiException.notFound("TEAM_404_01", "队伍不存在");
        boolean member = t.members.stream().anyMatch(m -> m.userId.equals(userId));
        if (!member) throw ApiException.forbidden("TEAM_403_01", "仅队伍成员可以查看");
        return t;
    }

    public Map<String, Object> get(String teamId, String userId) {
        return Views.team(require(teamId, userId), userId);
    }

    public Map<String, Object> joinRequest(String teamId, String userId) {
        Team t = store.teams.get(teamId);
        if (t == null) throw ApiException.notFound("TEAM_404_01", "队伍不存在");
        if (t.members.size() >= t.capacity) throw ApiException.conflict("TEAM_409_01", "队伍人数已满");
        if (t.members.stream().anyMatch(m -> m.userId.equals(userId))) {
            throw ApiException.conflict("TEAM_409_02", "已经在队伍中");
        }
        if (t.joinRequests.stream().anyMatch(r -> r.userId.equals(userId) && "PENDING".equals(r.status))) {
            throw ApiException.conflict("TEAM_409_03", "申请正在等待队长处理");
        }
        User user = store.users.get(userId);
        JoinRequest request = new JoinRequest();
        request.id = store.id("join");
        request.userId = userId;
        request.name = user.nickname;
        t.joinRequests.add(request);
        return Map.of("requestId", request.id, "status", request.status, "teamId", t.id);
    }

    public Map<String, Object> approve(String teamId, String requestId, String userId, boolean approve) {
        Team t = store.teams.get(teamId);
        if (t == null) throw ApiException.notFound("TEAM_404_01", "队伍不存在");
        if (!t.leaderId.equals(userId)) throw ApiException.forbidden("TEAM_403_02", "仅队长可以审批");
        JoinRequest request = t.joinRequests.stream()
                .filter(r -> r.id.equals(requestId))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("TEAM_404_02", "申请不存在"));
        if (!"PENDING".equals(request.status)) throw ApiException.conflict("TEAM_409_04", "申请已处理");
        if (approve) {
            if (t.members.size() >= t.capacity) throw ApiException.conflict("TEAM_409_01", "队伍人数已满");
            request.status = "APPROVED";
            User user = store.users.get(request.userId);
            Member m = new Member();
            m.userId = user.id;
            m.name = user.nickname;
            m.initial = user.nickname.substring(0, 1);
            t.members.add(m);
        } else {
            request.status = "REJECTED";
        }
        return Views.team(t, userId);
    }

    public void removeMember(String teamId, String memberId, String userId) {
        Team t = store.teams.get(teamId);
        if (t == null) throw ApiException.notFound("TEAM_404_01", "队伍不存在");
        if (!t.leaderId.equals(userId)) throw ApiException.forbidden("TEAM_403_02", "仅队长可以移除成员");
        if (memberId.equals(t.leaderId)) throw ApiException.unprocessable("TEAM_422_01", "队长不能移除自己，请先转让");
        t.members.removeIf(m -> m.userId.equals(memberId));
    }

    public Map<String, Object> transfer(String teamId, String toUserId, String userId) {
        Team t = store.teams.get(teamId);
        if (t == null) throw ApiException.notFound("TEAM_404_01", "队伍不存在");
        if (!t.leaderId.equals(userId)) throw ApiException.forbidden("TEAM_403_02", "仅队长可以转让");
        Member target = t.members.stream().filter(m -> m.userId.equals(toUserId)).findFirst()
                .orElseThrow(() -> ApiException.notFound("TEAM_404_03", "目标成员不在队伍中"));
        t.members.forEach(m -> m.leader = false);
        target.leader = true;
        t.leaderId = toUserId;
        return Views.team(t, userId);
    }

    public void dissolve(String teamId, String userId) {
        Team t = store.teams.get(teamId);
        if (t == null) throw ApiException.notFound("TEAM_404_01", "队伍不存在");
        if (!t.leaderId.equals(userId)) throw ApiException.forbidden("TEAM_403_02", "仅队长可以解散");
        t.status = "DISSOLVED";
    }

    public List<Map<String, Object>> messages(String teamId, String userId) {
        Team t = require(teamId, userId);
        List<Map<String, Object>> list = new ArrayList<>();
        for (Message m : t.messages) {
            list.add(messageView(m, userId));
        }
        return list;
    }

    public Map<String, Object> send(String teamId, String userId, String text) {
        Team t = require(teamId, userId);
        if (text == null || text.isBlank()) throw ApiException.unprocessable("TEAM_422_02", "消息不能为空");
        Message m = new Message();
        m.id = store.id("msg");
        m.userId = userId;
        m.name = store.users.get(userId).nickname;
        m.text = text.trim();
        t.messages.add(m);
        return messageView(m, userId);
    }

    public Map<String, Object> meeting(String teamId, String userId, Map<String, Object> body) {
        Team t = require(teamId, userId);
        if (!t.leaderId.equals(userId)) throw ApiException.forbidden("TEAM_403_02", "仅队长可以修改集合点");
        if (body.get("place") instanceof String place) t.meeting.place = place;
        if (body.get("time") instanceof String time) t.meeting.time = time;
        if (body.get("note") instanceof String note) t.meeting.note = note;
        Message sys = new Message();
        sys.id = store.id("msg");
        sys.userId = "system";
        sys.system = true;
        sys.text = "集合点已更新 · " + t.meeting.time + " " + t.meeting.place;
        sys.createdAt = Instant.now();
        t.messages.add(sys);
        return Map.of("meeting", t.meeting);
    }

    private Map<String, Object> messageView(Message m, String userId) {
        Map<String, Object> mm = new java.util.LinkedHashMap<>();
        mm.put("id", m.id);
        mm.put("userId", m.userId);
        mm.put("name", m.name);
        mm.put("text", m.text);
        mm.put("system", m.system);
        mm.put("me", m.userId.equals(userId));
        mm.put("time", m.createdAt);
        return mm;
    }
}
