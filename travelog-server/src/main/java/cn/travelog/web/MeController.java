package cn.travelog.web;

import cn.travelog.common.ApiResponse;
import cn.travelog.common.PageResult;
import cn.travelog.service.MeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class MeController {
    private final MeService me;

    public MeController(MeService me) {
        this.me = me;
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> profile(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(me.profile(userId));
    }

    @PatchMapping("/me/profile")
    public ApiResponse<Map<String, Object>> patch(@RequestAttribute("userId") String userId,
                                                  @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(me.patchProfile(userId, body));
    }

    @GetMapping("/me/settings")
    public ApiResponse<Map<String, Object>> settings(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(me.settings(userId));
    }

    @PutMapping("/me/settings")
    public ApiResponse<Map<String, Object>> settings(@RequestAttribute("userId") String userId,
                                                     @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(me.settings(userId, body));
    }

    public record RealnameRequest(String realName, String idNumber) {
    }

    @PostMapping("/me/realname/verifications")
    public ApiResponse<Map<String, Object>> realname(@RequestAttribute("userId") String userId,
                                                     @RequestBody RealnameRequest request) {
        return ApiResponse.ok(me.realname(userId, request.realName(), request.idNumber()));
    }

    @GetMapping("/me/realname")
    public ApiResponse<Map<String, Object>> realnameStatus(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(me.realnameStatus(userId));
    }

    @PostMapping("/me/deletion")
    public ApiResponse<Map<String, Object>> requestDeletion(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(me.requestDeletion(userId));
    }

    @DeleteMapping("/me/deletion")
    public ApiResponse<Void> cancelDeletion(@RequestAttribute("userId") String userId) {
        me.cancelDeletion(userId);
        return ApiResponse.ok();
    }

    @GetMapping("/me/devices")
    public ApiResponse<List<Map<String, Object>>> devices(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(me.devices(userId));
    }

    @DeleteMapping("/me/devices/{deviceId}")
    public ApiResponse<Void> removeDevice(@RequestAttribute("userId") String userId,
                                          @PathVariable String deviceId) {
        me.removeDevice(userId, deviceId);
        return ApiResponse.ok();
    }

    @GetMapping("/me/favorites")
    public ApiResponse<PageResult<Map<String, Object>>> favorites(@RequestAttribute("userId") String userId,
                                                                  @RequestParam(defaultValue = "1") int page,
                                                                  @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(me.favorites(userId, page, size));
    }

    @GetMapping("/notifications")
    public ApiResponse<Map<String, Object>> notifications(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(me.notifications(userId));
    }

    @PostMapping("/notifications/read")
    public ApiResponse<Map<String, Object>> read(@RequestAttribute("userId") String userId,
                                                 @RequestBody(required = false) Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = body != null && body.get("ids") instanceof List<?> list
                ? (List<String>) list : null;
        return ApiResponse.ok(me.readNotifications(userId, ids));
    }

    @GetMapping("/notifications/settings")
    public ApiResponse<Map<String, Object>> notificationSettings(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(me.notificationSettings(userId, null));
    }

    @PutMapping("/notifications/settings")
    public ApiResponse<Map<String, Object>> notificationSettings(@RequestAttribute("userId") String userId,
                                                                 @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(me.notificationSettings(userId, body));
    }

    @GetMapping("/blacklist")
    public ApiResponse<List<Map<String, Object>>> blacklist(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(me.blacklist(userId));
    }

    @PostMapping("/blacklist")
    public ApiResponse<Map<String, Object>> block(@RequestAttribute("userId") String userId,
                                                  @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(me.block(userId, String.valueOf(body.get("userId"))));
    }

    @DeleteMapping("/blacklist/{userId}")
    public ApiResponse<Void> unblock(@RequestAttribute("userId") String current,
                                     @PathVariable String userId) {
        me.unblock(current, userId);
        return ApiResponse.ok();
    }

    public record ReportRequest(String targetType, String targetId, String reason) {
    }

    @PostMapping("/reports")
    public ApiResponse<Map<String, Object>> report(@RequestAttribute("userId") String userId,
                                                   @RequestBody ReportRequest request) {
        return ApiResponse.ok(me.report(userId, request.targetType(), request.targetId(), request.reason()));
    }
}
