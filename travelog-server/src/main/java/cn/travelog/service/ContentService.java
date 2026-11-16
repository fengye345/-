package cn.travelog.service;

import cn.travelog.common.ApiException;
import cn.travelog.store.DataStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class ContentService {
    private final DataStore store;
    private final List<Map<String, Object>> questions = new CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> cultureCards = new ArrayList<>();

    public ContentService(DataStore store, @Value("${travelog.seed-demo:false}") boolean seedDemo) {
        this.store = store;
        if (!seedDemo) return;
        cultureCards.add(culture("cul_1", "西湖十景，为什么是这十个", "城市文化 · 官方",
                "南宋画师从 800 年前的湖山取景，选出十个最佳观看位置。今天你仍然可以按图索骥，只是季节和人流改变了「最佳」。",
                "杭州市文旅局 · 认证创作者 · 2026.09 修订"));
        cultureCards.add(culture("cul_2", "西湖绸伞：一把伞的 18 道工序", "非遗 · 手工艺",
                "从选竹到穿线，杭州人把雨天做成了手艺。伞面以素色为主，讲究「撑开一把伞，收拢一节竹」。",
                "杭州非遗保护中心 · 2026.08 修订"));
        questions.add(question("q_1", "灵隐寺周一闭馆吗？", "计划周一去，看到有人说闭馆，想确认一下。",
                "u_chen", "杭州", "今天 09:12", List.of(
                        answer("u_chen", "陈默", "灵隐寺每天开放，17:00 停止入场；飞来峰景区 18:30 停止售票。周一不闭馆。", true, "3 小时前"),
                        answerAi("周一不闭馆，但 17:00 后停止入场。建议 15:00 前到，避开旅行团高峰。", "2 小时前"))));
        questions.add(question("q_2", "西湖骑行一圈大概多久？", "不赶时间，想慢慢骑。",
                "u_me", "杭州", "昨天 18:40", List.of(
                        answer("u_zhou", "老周", "环湖约 13 公里，慢骑 1.5 小时。北山街人多，建议早上 7 点前或晚上 8 点后。", true, "昨天 19:02"))));
    }

    public List<Map<String, Object>> cultureCards() {
        return cultureCards;
    }

    public Map<String, Object> cultureCard(String id) {
        return cultureCards.stream().filter(c -> id.equals(c.get("id"))).findFirst()
                .orElseThrow(() -> ApiException.notFound("CONTENT_404_01", "文化卡不存在"));
    }

    public List<Map<String, Object>> questions() {
        return questions;
    }

    public Map<String, Object> ask(String userId, String title, String body, String city) {
        if (title == null || title.isBlank()) throw ApiException.unprocessable("QUESTION_422_01", "问题不能为空");
        Map<String, Object> q = question(store.id("q"), title, body == null ? "" : body,
                userId, city == null ? "杭州" : city, "刚刚", new ArrayList<>());
        questions.add(0, q);
        return q;
    }

    public Map<String, Object> answer(String questionId, String userId, String text) {
        Map<String, Object> q = questions.stream()
                .filter(x -> questionId.equals(x.get("id")))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("QUESTION_404_01", "问题不存在"));
        if (text == null || text.isBlank()) throw ApiException.unprocessable("QUESTION_422_02", "回答不能为空");
        var user = store.users.get(userId);
        Map<String, Object> a = answer(userId, user == null ? "旅行者" : user.nickname, text, false, "刚刚");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> answers = (List<Map<String, Object>>) q.get("answers");
        answers.add(a);
        return a;
    }

    private Map<String, Object> culture(String id, String title, String kicker, String summary, String source) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("title", title);
        m.put("kicker", kicker);
        m.put("summary", summary);
        m.put("source", source);
        m.put("coverUrl", DataStore.photo(14));
        m.put("updatedAt", Instant.parse("2026-09-20T02:00:00Z"));
        return m;
    }

    private Map<String, Object> question(String id, String title, String body, String userId, String city,
                                         String createdAt, List<Map<String, Object>> answers) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("title", title);
        m.put("body", body);
        m.put("city", city);
        m.put("author", Views.author(store.users.get(userId)));
        m.put("status", "OPEN");
        m.put("createdAt", createdAt);
        m.put("expiresAt", Instant.now().plus(java.time.Duration.ofDays(7)));
        m.put("answers", answers);
        return m;
    }

    private Map<String, Object> answer(String userId, String name, String text, boolean verified, String time) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", store.id("ans"));
        m.put("userId", userId);
        m.put("name", name);
        m.put("text", text);
        m.put("verified", verified);
        m.put("ai", false);
        m.put("time", time);
        return m;
    }

    private Map<String, Object> answerAi(String text, String time) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", store.id("ans"));
        m.put("userId", "ai");
        m.put("name", "AI 助手");
        m.put("text", text);
        m.put("verified", false);
        m.put("ai", true);
        m.put("time", time);
        return m;
    }
}
