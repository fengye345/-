package cn.travelog.web;

import cn.travelog.common.ApiResponse;
import cn.travelog.service.ShareService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/share")
public class ShareController {
    private final ShareService share;

    public ShareController(ShareService share) {
        this.share = share;
    }

    public record StartRequest(String distanceBand) {
    }

    public record LikeRequest(String toUserId) {
    }

    @PostMapping("/sessions")
    public ApiResponse<Map<String, Object>> start(@RequestAttribute("userId") String userId,
                                                  @RequestBody(required = false) StartRequest request) {
        return ApiResponse.ok(share.start(userId, request == null ? "ONE_KM" : request.distanceBand()));
    }

    @GetMapping("/sessions/current")
    public ApiResponse<Map<String, Object>> current(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(share.current(userId));
    }

    @DeleteMapping("/sessions/current")
    public ApiResponse<Void> stop(@RequestAttribute("userId") String userId) {
        share.stop(userId);
        return ApiResponse.ok();
    }

    @GetMapping("/hall")
    public ApiResponse<List<Map<String, Object>>> hall(@RequestAttribute("userId") String userId,
                                                       @RequestParam(required = false) String tag,
                                                       @RequestParam(required = false) String distance) {
        return ApiResponse.ok(share.hall(userId, tag, distance));
    }

    @PostMapping("/likes")
    public ApiResponse<Map<String, Object>> like(@RequestAttribute("userId") String userId,
                                                 @RequestBody LikeRequest request) {
        return ApiResponse.ok(share.like(userId, request.toUserId()));
    }

    @GetMapping("/likes/received")
    public ApiResponse<List<Map<String, Object>>> received(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(share.received(userId));
    }

    @GetMapping("/matches")
    public ApiResponse<List<Map<String, Object>>> matches(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(share.matches(userId));
    }
}
