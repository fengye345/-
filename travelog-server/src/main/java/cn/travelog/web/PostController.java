package cn.travelog.web;

import cn.travelog.common.ApiResponse;
import cn.travelog.common.PageResult;
import cn.travelog.service.PostService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/posts")
public class PostController {
    private final PostService posts;

    public PostController(PostService posts) {
        this.posts = posts;
    }

    public record CreatePost(String type, String city, String place, String area, String content,
                             Boolean onSite, String imageUrl, String memoryBoxId) {
    }

    public record VoteRequest(String kind) {
    }

    public record CommentRequest(String content) {
    }

    public record ReportRequest(String reason) {
    }

    @GetMapping
    public ApiResponse<PageResult<Map<String, Object>>> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestAttribute(value = "userId", required = false) String userId) {
        return ApiResponse.ok(posts.list(type, city, sort, status, page, size, userId));
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@RequestAttribute("userId") String userId,
                                                   @RequestBody CreatePost request) {
        return ApiResponse.ok(posts.create(userId, request.type(), request.city(), request.place(),
                request.area(), request.content(), request.onSite(), request.imageUrl(), request.memoryBoxId()));
    }

    @GetMapping("/{postId}")
    public ApiResponse<Map<String, Object>> get(@PathVariable String postId,
                                                @RequestAttribute(value = "userId", required = false) String userId) {
        return ApiResponse.ok(posts.get(postId, userId));
    }

    @PatchMapping("/{postId}")
    public ApiResponse<Map<String, Object>> patch(@PathVariable String postId,
                                                  @RequestAttribute("userId") String userId,
                                                  @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(posts.patch(postId, userId, body));
    }

    @DeleteMapping("/{postId}")
    public ApiResponse<Void> delete(@PathVariable String postId,
                                    @RequestAttribute("userId") String userId) {
        posts.delete(postId, userId);
        return ApiResponse.ok();
    }

    @PostMapping("/{postId}/votes")
    public ApiResponse<Map<String, Object>> vote(@PathVariable String postId,
                                                 @RequestAttribute("userId") String userId,
                                                 @RequestBody VoteRequest request) {
        return ApiResponse.ok(posts.vote(postId, userId, request.kind()));
    }

    @PostMapping("/{postId}/favorites")
    public ApiResponse<Map<String, Object>> favorite(@PathVariable String postId,
                                                     @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(posts.favorite(postId, userId, true));
    }

    @DeleteMapping("/{postId}/favorites")
    public ApiResponse<Map<String, Object>> unfavorite(@PathVariable String postId,
                                                       @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(posts.favorite(postId, userId, false));
    }

    @PostMapping("/{postId}/likes")
    public ApiResponse<Map<String, Object>> like(@PathVariable String postId,
                                                 @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(posts.like(postId, userId));
    }

    @GetMapping("/{postId}/comments")
    public ApiResponse<List<Map<String, Object>>> comments(@PathVariable String postId) {
        return ApiResponse.ok(posts.comments(postId));
    }

    @PostMapping("/{postId}/comments")
    public ApiResponse<Map<String, Object>> comment(@PathVariable String postId,
                                                    @RequestAttribute("userId") String userId,
                                                    @RequestBody CommentRequest request) {
        return ApiResponse.ok(posts.addComment(postId, userId, request.content()));
    }

    @PostMapping("/{postId}/renewals")
    public ApiResponse<Map<String, Object>> renew(@PathVariable String postId,
                                                  @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(posts.renew(postId, userId));
    }

    @PostMapping("/{postId}/reports")
    public ApiResponse<Map<String, Object>> report(@PathVariable String postId,
                                                   @RequestAttribute("userId") String userId,
                                                   @RequestBody(required = false) ReportRequest request) {
        return ApiResponse.ok(posts.report(postId, userId, request == null ? null : request.reason()));
    }
}
