package cn.travelog.service;

import cn.travelog.common.ApiException;
import cn.travelog.common.PageResult;
import cn.travelog.model.Models.*;
import cn.travelog.store.DataStore;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PostService {
    private final DataStore store;

    public PostService(DataStore store) {
        this.store = store;
    }

    public PageResult<Map<String, Object>> list(String type, String city, String sort, String status,
                                                int page, int size, String userId) {
        List<Post> found = store.posts.values().stream()
                .filter(p -> !p.deleted)
                .filter(p -> type == null || type.isBlank() || p.type.equalsIgnoreCase(type))
                .filter(p -> city == null || city.isBlank() || p.city.equals(city))
                .filter(p -> status == null || status.isBlank() || Views.statusOf(p).equalsIgnoreCase(status))
                .sorted("hot".equalsIgnoreCase(sort)
                        ? Comparator.comparingInt((Post p) -> p.likeCount + p.validCount).reversed()
                        : Comparator.comparing((Post p) -> p.publishedAt).reversed())
                .toList();
        List<Map<String, Object>> views = found.stream()
                .map(p -> view(p, userId))
                .toList();
        return PageResult.of(views, page, size);
    }

    public Map<String, Object> view(Post p, String userId) {
        boolean liked = userId != null && store.votes.containsKey(p.id + ":" + userId + ":LIKE");
        boolean saved = userId != null && store.favorites.getOrDefault(userId, java.util.Set.of()).contains(p.id);
        return Views.post(p, store.users.get(p.authorId), userId == null ? "" : userId, liked, saved);
    }

    public Map<String, Object> create(String userId, String type, String city, String place, String area,
                                      String content, Boolean onSite, String imageUrl, String memoryBoxId) {
        if (content == null || content.isBlank()) {
            throw ApiException.unprocessable("POST_422_01", "内容不能为空");
        }
        if (content.length() > 500) {
            throw ApiException.unprocessable("POST_422_02", "内容超过 500 字");
        }
        String normalized = type == null ? "NOW" : type.toUpperCase();
        if (!List.of("NOW", "TODAY", "LONG").contains(normalized)) {
            throw ApiException.unprocessable("POST_422_03", "不支持的内容类型");
        }
        boolean onsite = onSite == null || onSite;
        if (!onsite && normalized.equals("NOW")) {
            normalized = "LONG";
        }
        Post p = new Post();
        p.id = store.id("post");
        p.type = normalized;
        p.authorId = userId;
        p.city = city == null || city.isBlank() ? "杭州" : city;
        p.place = place == null ? "西湖景区" : place;
        p.area = area == null ? "西湖景区" : area;
        p.content = content.trim();
        p.onSite = onsite;
        p.imageUrl = imageUrl;
        if (memoryBoxId != null) {
            MemoryBox box = store.boxes.get(memoryBoxId);
            if (box != null && box.userId.equals(userId)) {
                p.imageUrl = box.coverUrl;
            }
        }
        p.publishedAt = Instant.now();
        p.expiresAt = switch (normalized) {
            case "NOW" -> p.publishedAt.plus(Duration.ofHours(6));
            case "TODAY" -> p.publishedAt.plus(Duration.ofHours(24));
            default -> p.publishedAt.plus(Duration.ofDays(30));
        };
        p.status = "PUBLISHED";
        store.posts.put(p.id, p);
        return view(p, userId);
    }

    public Post require(String postId) {
        Post p = store.posts.get(postId);
        if (p == null || p.deleted) throw ApiException.notFound("POST_404_01", "内容不存在");
        return p;
    }

    public Map<String, Object> get(String postId, String userId) {
        return view(require(postId), userId);
    }

    public Map<String, Object> patch(String postId, String userId, Map<String, Object> body) {
        Post p = require(postId);
        if (!p.authorId.equals(userId)) throw ApiException.forbidden("POST_403_01", "只能编辑自己的内容");
        if (body.get("content") instanceof String content && !content.isBlank()) {
            if (content.length() > 500) throw ApiException.unprocessable("POST_422_02", "内容超过 500 字");
            p.content = content;
        }
        if (body.get("place") instanceof String place) p.place = place;
        return view(p, userId);
    }

    public void delete(String postId, String userId) {
        Post p = require(postId);
        User user = store.users.get(userId);
        if (!p.authorId.equals(userId) && (user == null || !user.admin)) {
            throw ApiException.forbidden("POST_403_02", "无权删除该内容");
        }
        p.deleted = true;
    }

    public Map<String, Object> vote(String postId, String userId, String kind) {
        Post p = require(postId);
        if (p.authorId.equals(userId)) {
            throw ApiException.forbidden("POST_403_03", "不能给自己的内容投票");
        }
        String normalized = kind == null ? "" : kind.toUpperCase();
        if (!List.of("VALID", "INVALID").contains(normalized)) {
            throw ApiException.unprocessable("POST_422_04", "投票类型不支持");
        }
        String key = postId + ":" + userId + ":" + normalized;
        if (store.votes.containsKey(key)) {
            throw ApiException.conflict("POST_409_01", "已经投过票");
        }
        PostVote vote = new PostVote();
        vote.postId = postId;
        vote.userId = userId;
        vote.kind = normalized;
        store.votes.put(key, vote);
        if (normalized.equals("VALID")) p.validCount++;
        else p.invalidCount++;
        return view(p, userId);
    }

    public Map<String, Object> favorite(String postId, String userId, boolean add) {
        Post p = require(postId);
        var set = store.favorites.computeIfAbsent(userId, k -> java.util.concurrent.ConcurrentHashMap.newKeySet());
        if (add) {
            if (set.add(postId)) p.favoriteCount++;
        } else {
            if (set.remove(postId)) p.favoriteCount = Math.max(0, p.favoriteCount - 1);
        }
        return view(p, userId);
    }

    public Map<String, Object> like(String postId, String userId) {
        Post p = require(postId);
        String key = postId + ":" + userId + ":LIKE";
        boolean liked;
        if (store.votes.containsKey(key)) {
            store.votes.remove(key);
            p.likeCount = Math.max(0, p.likeCount - 1);
            liked = false;
        } else {
            PostVote vote = new PostVote();
            vote.postId = postId;
            vote.userId = userId;
            vote.kind = "LIKE";
            store.votes.put(key, vote);
            p.likeCount++;
            liked = true;
        }
        Map<String, Object> m = view(p, userId);
        m.put("liked", liked);
        return m;
    }

    public List<Map<String, Object>> comments(String postId) {
        require(postId);
        List<Map<String, Object>> list = new ArrayList<>();
        for (Comment c : store.comments.values().stream()
                .filter(c -> c.postId.equals(postId))
                .sorted(Comparator.comparing(c -> c.createdAt))
                .toList()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.id);
            m.put("author", Views.author(store.users.get(c.userId)));
            m.put("content", c.content);
            m.put("createdAt", c.createdAt);
            list.add(m);
        }
        return list;
    }

    public Map<String, Object> addComment(String postId, String userId, String content) {
        Post p = require(postId);
        if (content == null || content.isBlank()) throw ApiException.unprocessable("POST_422_05", "评论不能为空");
        Comment c = new Comment();
        c.id = store.id("cmt");
        c.postId = postId;
        c.userId = userId;
        c.content = content;
        store.comments.put(c.id, c);
        p.commentCount++;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.id);
        m.put("author", Views.author(store.users.get(userId)));
        m.put("content", c.content);
        m.put("createdAt", c.createdAt);
        return m;
    }

    public Map<String, Object> renew(String postId, String userId) {
        Post p = require(postId);
        if (!p.authorId.equals(userId)) throw ApiException.forbidden("POST_403_01", "只能续期自己的内容");
        if (p.renewCount >= 1) throw ApiException.conflict("POST_409_02", "该内容已续期");
        p.renewCount++;
        p.expiresAt = Instant.now().plus(Duration.ofHours("NOW".equals(p.type) ? 6 : 24));
        p.status = "PUBLISHED";
        Map<String, Object> m = view(p, userId);
        m.put("renewed", true);
        return m;
    }

    public Map<String, Object> report(String postId, String userId, String reason) {
        Post p = require(postId);
        Report r = new Report();
        r.id = store.id("rep");
        r.reporterId = userId;
        r.targetType = "POST";
        r.targetId = postId;
        r.reason = reason == null ? "用户举报" : reason;
        store.reports.put(r.id, r);
        Review review = new Review();
        review.id = store.id("rev");
        review.targetType = "POST";
        review.targetId = postId;
        review.title = p.place + " · 用户举报";
        review.content = r.reason;
        store.reviews.put(review.id, review);
        return Views.report(r);
    }
}
