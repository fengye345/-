package cn.travelog.web;

import cn.travelog.common.ApiException;
import cn.travelog.common.ApiResponse;
import cn.travelog.model.Models.Day;
import cn.travelog.model.Models.MediaAsset;
import cn.travelog.model.Models.MemoryBox;
import cn.travelog.store.DataStore;
import cn.travelog.service.Views;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {
    private final DataStore store;

    public MediaController(DataStore store) {
        this.store = store;
    }

    public record UploadIntent(String boxId, String fileName, String contentType) {
    }

    public record CompleteRequest(String url) {
    }

    @PostMapping("/upload-intents")
    public ApiResponse<Map<String, Object>> intent(@RequestAttribute("userId") String userId,
                                                   @RequestBody UploadIntent request) {
        MemoryBox box = store.boxes.get(request.boxId());
        if (box == null || !box.userId.equals(userId)) {
            throw ApiException.notFound("MEDIA_404_01", "回忆盒不存在");
        }
        MediaAsset asset = new MediaAsset();
        asset.id = store.id("media");
        asset.boxId = box.id;
        asset.userId = userId;
        asset.url = DataStore.photo(1);
        asset.status = "PENDING";
        store.media.put(asset.id, asset);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("mediaId", asset.id);
        m.put("uploadUrl", "http://localhost:8080/api/v1/media/upload/" + asset.id);
        m.put("method", "PUT");
        m.put("headers", Map.of("Content-Type", request.contentType() == null ? "image/jpeg" : request.contentType()));
        m.put("expiresAt", Instant.now().plus(Duration.ofMinutes(15)));
        return ApiResponse.ok(m);
    }

    @PostMapping("/{mediaId}/complete")
    public ApiResponse<Map<String, Object>> complete(@PathVariable String mediaId,
                                                     @RequestAttribute("userId") String userId,
                                                     @RequestBody(required = false) CompleteRequest request) {
        MediaAsset asset = store.media.get(mediaId);
        if (asset == null || !asset.userId.equals(userId)) {
            throw ApiException.notFound("MEDIA_404_01", "素材不存在");
        }
        if (request != null && request.url() != null && !request.url().isBlank()) {
            asset.url = request.url();
        }
        asset.status = "READY";
        MemoryBox box = store.boxes.get(asset.boxId);
        if (box != null) {
            if (!box.photos.contains(asset.url)) {
                box.photos.add(asset.url);
                if (box.days.isEmpty()) {
                    Day day = new Day();
                    day.label = "Day 1";
                    day.date = "今天";
                    day.note = "上传素材";
                    box.days.add(day);
                }
                box.days.get(box.days.size() - 1).photos.add(asset.url);
            }
            box.mediaCount = box.photos.size();
            box.updatedAt = Instant.now();
        }
        return ApiResponse.ok(Views.media(asset));
    }

    @GetMapping("/{mediaId}")
    public ApiResponse<Map<String, Object>> get(@PathVariable String mediaId,
                                                @RequestAttribute("userId") String userId) {
        MediaAsset asset = store.media.get(mediaId);
        if (asset == null || !asset.userId.equals(userId)) {
            throw ApiException.notFound("MEDIA_404_01", "素材不存在");
        }
        return ApiResponse.ok(Views.media(asset));
    }

    @DeleteMapping("/{mediaId}")
    public ApiResponse<Void> delete(@PathVariable String mediaId,
                                    @RequestAttribute("userId") String userId) {
        MediaAsset asset = store.media.get(mediaId);
        if (asset == null || !asset.userId.equals(userId)) {
            throw ApiException.notFound("MEDIA_404_01", "素材不存在");
        }
        store.media.remove(mediaId);
        MemoryBox box = store.boxes.get(asset.boxId);
        if (box != null) {
            box.photos.remove(asset.url);
            box.mediaCount = box.photos.size();
        }
        return ApiResponse.ok();
    }
}
