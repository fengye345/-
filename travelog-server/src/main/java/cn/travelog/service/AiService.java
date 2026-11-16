package cn.travelog.service;

import cn.travelog.common.ApiException;
import cn.travelog.model.Models.*;
import cn.travelog.store.DataStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService {
    private final DataStore store;
    private final int quota;

    public AiService(DataStore store, @Value("${travelog.ai.daily-quota}") int quota) {
        this.store = store;
        this.quota = quota;
    }

    public Map<String, Object> createConversation(String userId, String city) {
        AiConversation c = new AiConversation();
        c.id = store.id("conv");
        c.userId = userId;
        c.city = city == null ? store.currentCity.getOrDefault(userId, "杭州") : city;
        store.conversations.put(c.id, c);
        return Views.conversation(c, quota(userId));
    }

    public Map<String, Object> get(String conversationId, String userId) {
        AiConversation c = store.conversations.get(conversationId);
        if (c == null || !c.userId.equals(userId)) throw ApiException.notFound("AI_404_01", "会话不存在");
        return Views.conversation(c, quota(userId));
    }

    public void delete(String conversationId, String userId) {
        AiConversation c = store.conversations.get(conversationId);
        if (c == null || !c.userId.equals(userId)) throw ApiException.notFound("AI_404_01", "会话不存在");
        store.conversations.remove(conversationId);
    }

    public Map<String, Object> message(String conversationId, String userId, String text) {
        AiConversation c = store.conversations.get(conversationId);
        if (c == null || !c.userId.equals(userId)) throw ApiException.notFound("AI_404_01", "会话不存在");
        if (text == null || text.isBlank()) throw ApiException.unprocessable("AI_422_01", "问题不能为空");
        int used = store.aiUsed(userId);
        if (used >= quota) throw ApiException.tooMany("AI_429_01", "今日 AI 额度已用尽");

        AiMessage user = new AiMessage();
        user.id = store.id("aim");
        user.role = "USER";
        user.content = text.trim();
        user.kind = "TEXT";
        c.messages.add(user);

        AiMessage answer = buildAnswer(text.trim(), c.city);
        c.messages.add(answer);
        store.aiUsage.put(userId, used + 1);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("conversationId", c.id);
        m.put("message", answer);
        m.put("quota", quota(userId));
        return m;
    }

    public Map<String, Object> feedback(String messageId, String userId, String value, String comment) {
        AiConversation found = store.conversations.values().stream()
                .filter(c -> c.userId.equals(userId))
                .filter(c -> c.messages.stream().anyMatch(m -> m.id.equals(messageId)))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("AI_404_02", "消息不存在"));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("messageId", messageId);
        m.put("value", value);
        m.put("comment", comment);
        m.put("status", "RECORDED");
        m.put("conversationId", found.id);
        return m;
    }

    public Map<String, Object> quota(String userId) {
        return Views.quota(quota, store.aiUsed(userId));
    }

    private AiMessage buildAnswer(String text, String city) {
        AiMessage m = new AiMessage();
        m.id = store.id("aim");
        m.role = "ASSISTANT";
        m.createdAt = Instant.now();
        if (text.matches(".*(人多|排队|值得|开放|开门|现在去).*")) {
            m.kind = "CROWD";
            m.content = "值得去，但建议 30 分钟内到。当前在园人数约为周末均值的 38%，断桥人流已明显回落。";
            Map<String, Object> card = new LinkedHashMap<>();
            card.put("kind", "crowd");
            card.put("title", "现在值得去吗");
            card.put("verdict", "值得去，但建议 30 分钟内到");
            card.put("detail", "断桥此刻人流已明显回落；湖滨银泰停车仍满，建议地铁 1 号线到龙翔桥。日落 17:32，长桥公园比雷峰塔更适合看。");
            card.put("confidence", 0.78);
            m.cards = card;
            m.sources.add(new Source("现场反馈", "12 分钟前 · 现场标识", "断桥这会儿人已经散了，湖边风大"));
            m.sources.add(new Source("景区客流", "14:00 更新", "当前在园 1.8 万人，约为周末均值 38%"));
        } else if (text.matches(".*(吃|餐厅|美食|咖啡|附近).*")) {
            m.kind = "FOOD";
            m.content = "附近步行 15 分钟内有 3 个选择，按现在的时间更推荐先去 Cycle & Cycle，再走去湖边。";
            Map<String, Object> card = new LinkedHashMap<>();
            card.put("kind", "food");
            card.put("title", "附近 3 个选择");
            List<Map<String, Object>> items = new ArrayList<>();
            items.add(food("弄堂里（湖滨店）", "杭帮菜 · 人均 68", "420m · 步行 6 分钟", "现场等位 12 桌，可线上取号"));
            items.add(food("Cycle & Cycle", "面包咖啡 · 人均 35", "260m · 步行 4 分钟", "现在有位，靠窗可看街景"));
            items.add(food("新白鹿（西湖店）", "杭帮菜 · 人均 55", "850m · 步行 12 分钟", "排队约 25 分钟，建议 17:00 前到"));
            card.put("items", items);
            m.cards = card;
            m.sources.add(new Source("公开商户信息", "今日 12:00 同步", "价格与营业状态可能调整"));
        } else {
            m.kind = "ROUTE";
            m.content = "按今天剩下的 3 个半小时，给你排一条不绕路的半日线：先看展，再去长桥等日落。";
            m.cards = routeCard(city);
            m.sources.add(new Source("杭州气象", "今日 06:00 更新", "晴转多云，日落 17:32，东南风 2 级"));
            m.sources.add(new Source("公共区域 · 陈默", "12 分钟前 · 现场标识", "断桥这会儿人已经散了，湖边风大"));
        }
        return m;
    }

    private Map<String, Object> food(String name, String tag, String distance, String note) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", name);
        m.put("tag", tag);
        m.put("distance", distance);
        m.put("note", note);
        return m;
    }

    private Map<String, Object> routeCard(String city) {
        Map<String, Object> card = new LinkedHashMap<>();
        card.put("kind", "route");
        card.put("title", "半日湖山线");
        card.put("total", "3h20m · 6.8km");
        Map<String, Object> weather = new LinkedHashMap<>();
        weather.put("desc", "多云转晴");
        weather.put("temp", "22°");
        card.put("weather", weather);
        List<Map<String, Object>> stops = new ArrayList<>();
        stops.add(stop("中国美院象山校区", "14:30", "先看「湖山志」特展，室内 60 分钟，避开午后日晒。", "公交 20 分钟", "场馆公告 · 今日"));
        stops.add(stop("长桥公园", "16:40", "沿南山路走 15 分钟，17:00 前到长桥西侧，日落位置最好。", "步行 15 分钟", "杭州气象 · 06:00"));
        stops.add(stop("河坊街 · 大井巷", "18:10", "从长桥打车 10 分钟，避开主街，从大井巷进。", "打车 10 分钟", "公共区域 · 林小满"));
        card.put("stops", stops);
        card.put("unknown", "未能确认：今晚湖滨音乐喷泉是否开放。建议出发前查看景区公告。");
        card.put("city", city);
        card.put("generatedAt", Instant.now());
        return card;
    }

    private Map<String, Object> stop(String name, String time, String desc, String walk, String src) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", name);
        m.put("time", time);
        m.put("desc", desc);
        m.put("walk", walk);
        m.put("src", src);
        return m;
    }

    public int used(String userId) {
        return store.aiUsed(userId);
    }

    public Duration resetIn() {
        return Duration.ofHours(24);
    }
}
