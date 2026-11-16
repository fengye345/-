package cn.travelog.web;

import cn.travelog.common.ApiResponse;
import cn.travelog.common.PageResult;
import cn.travelog.service.MemoryService;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class MemoryController {
    private final MemoryService memories;

    public MemoryController(MemoryService memories) {
        this.memories = memories;
    }

    public record CreateBox(String title, String cityAdcode, Instant startAt, Instant endAt, String template) {
    }

    public record MediaRequest(List<String> urls) {
    }

    public record LayoutRequest(String layout) {
    }

    public record ExportRequest(String format) {
    }

    public record ShareLinkRequest(Integer days, String password, Boolean watermark) {
    }

    @GetMapping("/memory-boxes")
    public ApiResponse<PageResult<Map<String, Object>>> list(@RequestAttribute("userId") String userId,
                                                             @RequestParam(required = false) String status,
                                                             @RequestParam(defaultValue = "1") int page,
                                                             @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(memories.list(userId, status, page, size));
    }

    @PostMapping("/memory-boxes")
    public ApiResponse<Map<String, Object>> create(@RequestAttribute("userId") String userId,
                                                   @RequestBody CreateBox request) {
        return ApiResponse.ok(memories.create(userId, request.title(), request.cityAdcode(),
                request.startAt(), request.endAt(), request.template()));
    }

    @GetMapping("/memory-boxes/{boxId}")
    public ApiResponse<Map<String, Object>> get(@PathVariable String boxId,
                                                @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(memories.get(boxId, userId));
    }

    @PatchMapping("/memory-boxes/{boxId}")
    public ApiResponse<Map<String, Object>> patch(@PathVariable String boxId,
                                                  @RequestAttribute("userId") String userId,
                                                  @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(memories.patch(boxId, userId, body));
    }

    @DeleteMapping("/memory-boxes/{boxId}")
    public ApiResponse<Void> delete(@PathVariable String boxId,
                                    @RequestAttribute("userId") String userId) {
        memories.delete(boxId, userId);
        return ApiResponse.ok();
    }

    @PostMapping("/memory-boxes/{boxId}/restore")
    public ApiResponse<Map<String, Object>> restore(@PathVariable String boxId,
                                                    @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(memories.restore(boxId, userId));
    }

    @GetMapping("/memory-boxes/{boxId}/media")
    public ApiResponse<List<Map<String, Object>>> media(@PathVariable String boxId,
                                                        @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(memories.media(boxId, userId));
    }

    @PostMapping("/memory-boxes/{boxId}/media")
    public ApiResponse<Map<String, Object>> addMedia(@PathVariable String boxId,
                                                     @RequestAttribute("userId") String userId,
                                                     @RequestBody MediaRequest request) {
        return ApiResponse.ok(memories.addMedia(boxId, userId, request.urls()));
    }

    @DeleteMapping("/memory-boxes/{boxId}/media/{mediaId}")
    public ApiResponse<Void> removeMedia(@PathVariable String boxId, @PathVariable String mediaId,
                                         @RequestAttribute("userId") String userId) {
        memories.removeMedia(boxId, userId, mediaId);
        return ApiResponse.ok();
    }

    @PutMapping("/memory-boxes/{boxId}/layout")
    public ApiResponse<Map<String, Object>> layout(@PathVariable String boxId,
                                                   @RequestAttribute("userId") String userId,
                                                   @RequestBody LayoutRequest request) {
        return ApiResponse.ok(memories.layout(boxId, userId, request.layout()));
    }

    @PostMapping("/memory-boxes/{boxId}/exports")
    public ApiResponse<Map<String, Object>> export(@PathVariable String boxId,
                                                   @RequestAttribute("userId") String userId,
                                                   @RequestBody(required = false) ExportRequest request) {
        return ApiResponse.ok(memories.createExport(boxId, userId, request == null ? "VIDEO" : request.format()));
    }

    @GetMapping("/memory-boxes/{boxId}/exports/{jobId}")
    public ApiResponse<Map<String, Object>> exportStatus(@PathVariable String boxId, @PathVariable String jobId,
                                                         @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(memories.export(boxId, userId, jobId));
    }

    @PostMapping("/memory-boxes/{boxId}/share-links")
    public ApiResponse<Map<String, Object>> createLink(@PathVariable String boxId,
                                                       @RequestAttribute("userId") String userId,
                                                       @RequestBody(required = false) ShareLinkRequest request) {
        return ApiResponse.ok(memories.createShareLink(boxId, userId,
                request == null ? 7 : request.days(),
                request == null ? null : request.password(),
                request == null ? true : request.watermark()));
    }

    @DeleteMapping("/share-links/{linkId}")
    public ApiResponse<Void> revoke(@PathVariable String linkId,
                                    @RequestAttribute("userId") String userId) {
        memories.revokeShareLink(linkId, userId);
        return ApiResponse.ok();
    }

    @GetMapping("/share-links/{token}")
    public ApiResponse<Map<String, Object>> publicLink(@PathVariable String token,
                                                       @RequestParam(required = false) String password) {
        return ApiResponse.ok(memories.publicLink(token, password));
    }
}
