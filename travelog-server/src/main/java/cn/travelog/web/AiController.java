package cn.travelog.web;

import cn.travelog.common.ApiResponse;
import cn.travelog.service.AiService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {
    private final AiService ai;

    public AiController(AiService ai) {
        this.ai = ai;
    }

    public record CreateConversation(String city) {
    }

    public record MessageRequest(String text, String content) {
    }

    public record FeedbackRequest(String value, String comment) {
    }

    @PostMapping("/conversations")
    public ApiResponse<Map<String, Object>> create(@RequestAttribute("userId") String userId,
                                                   @RequestBody(required = false) CreateConversation request) {
        return ApiResponse.ok(ai.createConversation(userId, request == null ? null : request.city()));
    }

    @GetMapping("/conversations/{conversationId}")
    public ApiResponse<Map<String, Object>> get(@PathVariable String conversationId,
                                                @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(ai.get(conversationId, userId));
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ApiResponse<Void> delete(@PathVariable String conversationId,
                                    @RequestAttribute("userId") String userId) {
        ai.delete(conversationId, userId);
        return ApiResponse.ok();
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ApiResponse<Map<String, Object>> message(@PathVariable String conversationId,
                                                    @RequestAttribute("userId") String userId,
                                                    @RequestBody MessageRequest request) {
        String text = request.text() != null ? request.text() : request.content();
        return ApiResponse.ok(ai.message(conversationId, userId, text));
    }

    @PostMapping("/messages/{messageId}/feedback")
    public ApiResponse<Map<String, Object>> feedback(@PathVariable String messageId,
                                                     @RequestAttribute("userId") String userId,
                                                     @RequestBody FeedbackRequest request) {
        return ApiResponse.ok(ai.feedback(messageId, userId, request.value(), request.comment()));
    }

    @GetMapping("/quota")
    public ApiResponse<Map<String, Object>> quota(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(ai.quota(userId));
    }
}
