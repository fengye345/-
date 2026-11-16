package cn.travelog.web;

import cn.travelog.common.ApiResponse;
import cn.travelog.common.PageResult;
import cn.travelog.model.Models.User;
import cn.travelog.service.AdminService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {
    private final AdminService admin;

    public AdminController(AdminService admin) {
        this.admin = admin;
    }

    public record DecisionRequest(String decision, String reason) {
    }

    public record BanRequest(Boolean banned, String reason) {
    }

    public record ImportRequest(List<Map<String, Object>> cities) {
    }

    @GetMapping("/reviews")
    public ApiResponse<PageResult<Map<String, Object>>> reviews(@RequestAttribute("user") User user,
                                                               @RequestParam(required = false) String status,
                                                               @RequestParam(defaultValue = "1") int page,
                                                               @RequestParam(defaultValue = "20") int size) {
        admin.requireAdmin(user);
        return ApiResponse.ok(admin.reviews(status, page, size));
    }

    @PostMapping("/reviews/{reviewId}/decision")
    public ApiResponse<Map<String, Object>> decideReview(@RequestAttribute("user") User user,
                                                         @PathVariable String reviewId,
                                                         @RequestBody DecisionRequest request) {
        admin.requireAdmin(user);
        return ApiResponse.ok(admin.decideReview(reviewId, request.decision(), request.reason()));
    }

    @GetMapping("/reports")
    public ApiResponse<PageResult<Map<String, Object>>> reports(@RequestAttribute("user") User user,
                                                                @RequestParam(required = false) String status,
                                                                @RequestParam(defaultValue = "1") int page,
                                                                @RequestParam(defaultValue = "20") int size) {
        admin.requireAdmin(user);
        return ApiResponse.ok(admin.reports(status, page, size));
    }

    @PostMapping("/reports/{reportId}/decision")
    public ApiResponse<Map<String, Object>> decideReport(@RequestAttribute("user") User user,
                                                         @PathVariable String reportId,
                                                         @RequestBody DecisionRequest request) {
        admin.requireAdmin(user);
        return ApiResponse.ok(admin.decideReport(reportId, request.decision(), request.reason()));
    }

    @GetMapping("/users")
    public ApiResponse<PageResult<Map<String, Object>>> users(@RequestAttribute("user") User user,
                                                              @RequestParam(required = false) String q,
                                                              @RequestParam(defaultValue = "1") int page,
                                                              @RequestParam(defaultValue = "20") int size) {
        admin.requireAdmin(user);
        return ApiResponse.ok(admin.users(q, page, size));
    }

    @PostMapping("/users/{userId}/ban")
    public ApiResponse<Map<String, Object>> ban(@RequestAttribute("user") User user,
                                                @PathVariable String userId,
                                                @RequestBody BanRequest request) {
        admin.requireAdmin(user);
        boolean banned = request.banned() == null || request.banned();
        return ApiResponse.ok(admin.ban(userId, banned, request.reason()));
    }

    @GetMapping("/cities")
    public ApiResponse<PageResult<Map<String, Object>>> cities(@RequestAttribute("user") User user,
                                                               @RequestParam(required = false) String q,
                                                               @RequestParam(defaultValue = "1") int page,
                                                               @RequestParam(defaultValue = "50") int size) {
        admin.requireAdmin(user);
        return ApiResponse.ok(admin.cities(q, page, size));
    }

    @PatchMapping("/cities/{adcode}")
    public ApiResponse<Map<String, Object>> patchCity(@RequestAttribute("user") User user,
                                                      @PathVariable String adcode,
                                                      @RequestBody Map<String, Object> body) {
        admin.requireAdmin(user);
        return ApiResponse.ok(admin.patchCity(adcode, body));
    }

    @PostMapping("/cities/imports")
    public ApiResponse<Map<String, Object>> imports(@RequestAttribute("user") User user,
                                                    @RequestBody ImportRequest request) {
        admin.requireAdmin(user);
        return ApiResponse.ok(admin.importCities(request.cities()));
    }

    @GetMapping("/flags")
    public ApiResponse<Map<String, Object>> flags(@RequestAttribute("user") User user) {
        admin.requireAdmin(user);
        return ApiResponse.ok(admin.flags());
    }

    @PutMapping("/flags/{key}")
    public ApiResponse<Map<String, Object>> flag(@RequestAttribute("user") User user,
                                                 @PathVariable String key,
                                                 @RequestBody Map<String, Object> body) {
        admin.requireAdmin(user);
        return ApiResponse.ok(admin.putFlag(key, body.get("value")));
    }

    @GetMapping("/metrics/overview")
    public ApiResponse<Map<String, Object>> metrics(@RequestAttribute("user") User user) {
        admin.requireAdmin(user);
        return ApiResponse.ok(admin.metrics());
    }
}
