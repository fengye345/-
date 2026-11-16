package cn.travelog.web;

import cn.travelog.common.ApiResponse;
import cn.travelog.service.ContentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class ContentController {
    private final ContentService content;

    public ContentController(ContentService content) {
        this.content = content;
    }

    public record AskRequest(String title, String body, String city) {
    }

    public record AnswerRequest(String text) {
    }

    @GetMapping("/culture-cards")
    public ApiResponse<List<Map<String, Object>>> cultureCards() {
        return ApiResponse.ok(content.cultureCards());
    }

    @GetMapping("/culture-cards/{cardId}")
    public ApiResponse<Map<String, Object>> cultureCard(@PathVariable String cardId) {
        return ApiResponse.ok(content.cultureCard(cardId));
    }

    @GetMapping("/questions")
    public ApiResponse<List<Map<String, Object>>> questions() {
        return ApiResponse.ok(content.questions());
    }

    @PostMapping("/questions")
    public ApiResponse<Map<String, Object>> ask(@RequestAttribute("userId") String userId,
                                                @RequestBody AskRequest request) {
        return ApiResponse.ok(content.ask(userId, request.title(), request.body(), request.city()));
    }

    @PostMapping("/questions/{questionId}/answers")
    public ApiResponse<Map<String, Object>> answer(@PathVariable String questionId,
                                                   @RequestAttribute("userId") String userId,
                                                   @RequestBody AnswerRequest request) {
        return ApiResponse.ok(content.answer(questionId, userId, request.text()));
    }
}
