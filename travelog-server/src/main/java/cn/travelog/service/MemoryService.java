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
public class MemoryService {
    private final DataStore store;

    public MemoryService(DataStore store) {
        this.store = store;
    }

    public PageResult<Map<String, Object>> list(String userId, String status, int page, int size) {
        List<Map<String, Object>> views = store.boxesOf(userId).stream()
                .filter(b -> !b.deleted)
                .filter(b -> status == null || status.isBlank() || b.status.equalsIgnoreCase(status))
                .map(b -> Views.box(b, store.cityOf(b.cityAdcode), store))
                .toList();
        return PageResult.of(views, page, size);
    }

    public Map<String, Object> create(String userId, String title, String adcode, Instant startAt,
                                      Instant endAt, String template) {
        City city = store.cityByAdcode(adcode);
        if (city == null) city = store.cityByName("杭州");
        MemoryBox b = new MemoryBox();
        b.id = store.id("box");
        b.userId = userId;
        b.cityAdcode = city.adcode;
        b.title = (title == null || title.isBlank()) ? city.name + " · 新的回忆" : title;
        b.template = template == null ? "magazine" : template;
        b.startAt = startAt == null ? Instant.now() : startAt;
        b.endAt = endAt;
        b.status = "DRAFT";
        b.mediaCount = 4;
        b.coverUrl = DataStore.photo(15);
        b.photos = new ArrayList<>(List.of(DataStore.photo(15), DataStore.photo(14), DataStore.photo(5), DataStore.photo(8)));
        b.days.add(new Day("Day 1", "今天", "自动识别", new ArrayList<>(b.photos)));
        store.boxes.put(b.id, b);

        for (String url : b.photos) {
            MediaAsset a = new MediaAsset();
            a.id = store.id("media");
            a.boxId = b.id;
            a.userId = userId;
            a.url = url;
            store.media.put(a.id, a);
        }
        return Views.box(b, city, store);
    }

    public MemoryBox require(String boxId, String userId) {
        MemoryBox b = store.boxes.get(boxId);
        if (b == null || b.deleted || !b.userId.equals(userId)) {
            throw ApiException.notFound("BOX_404_01", "回忆盒不存在");
        }
        return b;
    }

    public Map<String, Object> get(String boxId, String userId) {
        MemoryBox b = require(boxId, userId);
        Map<String, Object> m = Views.box(b, store.cityOf(b.cityAdcode), store);
        m.put("media", store.media.values().stream()
                .filter(a -> a.boxId.equals(boxId))
                .sorted(Comparator.comparing(a -> a.createdAt))
                .map(Views::media)
                .toList());
        return m;
    }

    public Map<String, Object> patch(String boxId, String userId, Map<String, Object> body) {
        MemoryBox b = require(boxId, userId);
        if (body.get("title") instanceof String title && !title.isBlank()) b.title = title;
        if (body.get("template") instanceof String template) b.template = template;
        if (body.get("status") instanceof String status) b.status = status.toUpperCase();
        if (body.get("visibility") instanceof String visibility) b.visibility = visibility.toUpperCase();
        if (body.get("coverUrl") instanceof String cover) b.coverUrl = cover;
        b.updatedAt = Instant.now();
        return Views.box(b, store.cityOf(b.cityAdcode), store);
    }

    public void delete(String boxId, String userId) {
        MemoryBox b = require(boxId, userId);
        b.deleted = true;
        b.deletedAt = Instant.now();
        b.updatedAt = Instant.now();
    }

    public Map<String, Object> restore(String boxId, String userId) {
        MemoryBox b = store.boxes.get(boxId);
        if (b == null || !b.userId.equals(userId)) throw ApiException.notFound("BOX_404_01", "回忆盒不存在");
        b.deleted = false;
        b.deletedAt = null;
        b.updatedAt = Instant.now();
        return Views.box(b, store.cityOf(b.cityAdcode), store);
    }

    public List<Map<String, Object>> media(String boxId, String userId) {
        require(boxId, userId);
        return store.media.values().stream()
                .filter(a -> a.boxId.equals(boxId))
                .map(Views::media)
                .toList();
    }

    public Map<String, Object> addMedia(String boxId, String userId, List<String> urls) {
        MemoryBox b = require(boxId, userId);
        if (urls == null || urls.isEmpty()) {
            throw ApiException.unprocessable("MEDIA_422_01", "至少选择一张素材");
        }
        List<Map<String, Object>> added = new ArrayList<>();
        for (String url : urls) {
            MediaAsset a = new MediaAsset();
            a.id = store.id("media");
            a.boxId = boxId;
            a.userId = userId;
            a.url = url;
            store.media.put(a.id, a);
            added.add(Views.media(a));
            if (b.days.isEmpty()) b.days.add(new Day("Day 1", "今天", "手动添加", new ArrayList<>()));
            b.days.get(b.days.size() - 1).photos.add(url);
            b.photos.add(url);
        }
        b.mediaCount = b.photos.size();
        b.updatedAt = Instant.now();
        return Map.of("added", added, "mediaCount", b.mediaCount);
    }

    public void removeMedia(String boxId, String userId, String mediaId) {
        MemoryBox b = require(boxId, userId);
        MediaAsset a = store.media.get(mediaId);
        if (a == null || !a.boxId.equals(boxId)) throw ApiException.notFound("MEDIA_404_01", "素材不存在");
        store.media.remove(mediaId);
        b.photos.remove(a.url);
        b.days.forEach(d -> d.photos.remove(a.url));
        b.mediaCount = b.photos.size();
        b.updatedAt = Instant.now();
    }

    public Map<String, Object> layout(String boxId, String userId, String layoutJson) {
        MemoryBox b = require(boxId, userId);
        b.layoutJson = layoutJson;
        b.updatedAt = Instant.now();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("boxId", boxId);
        m.put("layout", layoutJson);
        m.put("updatedAt", b.updatedAt);
        return m;
    }

    public Map<String, Object> createExport(String boxId, String userId, String format) {
        MemoryBox b = require(boxId, userId);
        String jobId = store.id("export");
        Map<String, Object> job = new LinkedHashMap<>();
        job.put("jobId", jobId);
        job.put("boxId", b.id);
        job.put("format", format == null ? "VIDEO" : format);
        job.put("status", "DONE");
        job.put("progress", 100);
        job.put("url", "/exports/" + jobId + ".mp4");
        job.put("createdAt", Instant.now());
        store.exports.put(jobId, job);
        return job;
    }

    public Map<String, Object> export(String boxId, String userId, String jobId) {
        require(boxId, userId);
        Map<String, Object> job = store.exports.get(jobId);
        if (job == null) throw ApiException.notFound("EXPORT_404_01", "导出任务不存在");
        return job;
    }

    public Map<String, Object> createShareLink(String boxId, String userId, Integer days,
                                               String password, Boolean watermark) {
        MemoryBox b = require(boxId, userId);
        if (b.shareLinkId != null && store.shareLinks.containsKey(b.shareLinkId)) {
            ShareLink existing = store.shareLinks.get(b.shareLinkId);
            if (!existing.revoked && existing.expiresAt.isAfter(Instant.now())) {
                return Views.shareLink(existing);
            }
        }
        ShareLink link = new ShareLink();
        link.id = store.id("link");
        link.boxId = boxId;
        link.userId = userId;
        link.token = Long.toString(System.currentTimeMillis(), 36) + Integer.toString(Math.abs(boxId.hashCode()), 36);
        link.token = link.token.substring(Math.max(0, link.token.length() - 8));
        link.expiresAt = Instant.now().plus(Duration.ofDays(days == null ? 7 : Math.max(1, Math.min(30, days))));
        link.password = (password == null || password.isBlank()) ? null : password;
        link.watermark = watermark == null || watermark;
        store.shareLinks.put(link.id, link);
        b.shareLinkId = link.id;
        b.updatedAt = Instant.now();
        return Views.shareLink(link);
    }

    public void revokeShareLink(String linkId, String userId) {
        ShareLink link = store.shareLinks.get(linkId);
        if (link == null || !link.userId.equals(userId)) {
            throw ApiException.notFound("LINK_404_01", "分享链接不存在");
        }
        link.revoked = true;
        MemoryBox b = store.boxes.get(link.boxId);
        if (b != null && linkId.equals(b.shareLinkId)) b.shareLinkId = null;
    }

    public Map<String, Object> publicLink(String token, String password) {
        ShareLink link = store.shareLinks.values().stream()
                .filter(l -> l.token.equals(token))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("LINK_404_01", "分享链接不存在或已失效"));
        if (link.revoked || link.expiresAt.isBefore(Instant.now())) {
            throw new ApiException(410, "LINK_410_01", "分享链接已失效");
        }
        if (link.password != null && !link.password.equals(password)) {
            throw ApiException.forbidden("LINK_403_01", "访问口令不正确");
        }
        MemoryBox b = store.boxes.get(link.boxId);
        if (b == null || b.deleted) throw ApiException.notFound("BOX_404_01", "回忆盒不存在");
        Map<String, Object> m = Views.box(b, store.cityOf(b.cityAdcode), store);
        m.put("owner", Views.user(store.users.get(b.userId)));
        m.put("watermark", link.watermark);
        m.put("expiresAt", link.expiresAt);
        m.remove("shareUrl");
        return m;
    }
}
