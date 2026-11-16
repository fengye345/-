package cn.travelog.store;

import cn.travelog.model.Models.*;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * In-memory store with deterministic demo data. The service boundaries and
 * identifiers mirror the API document so this can be swapped for PostgreSQL +
 * PostGIS repositories without changing controllers.
 */
@Component
public class DataStore {
    public final Map<String, User> users = new ConcurrentHashMap<>();
    public final Map<String, String> smsCodes = new ConcurrentHashMap<>();
    public final Map<String, City> cities = new LinkedHashMap<>();
    public final Map<String, Visit> visits = new ConcurrentHashMap<>();
    public final Map<String, MemoryBox> boxes = new ConcurrentHashMap<>();
    public final Map<String, MediaAsset> media = new ConcurrentHashMap<>();
    public final Map<String, ShareLink> shareLinks = new ConcurrentHashMap<>();
    public final Map<String, Post> posts = new ConcurrentHashMap<>();
    public final Map<String, PostVote> votes = new ConcurrentHashMap<>();
    public final Map<String, Comment> comments = new ConcurrentHashMap<>();
    public final Map<String, ShareSession> sessions = new ConcurrentHashMap<>();
    public final Map<String, HallUser> hall = new LinkedHashMap<>();
    public final Map<String, Like> likes = new ConcurrentHashMap<>();
    public final Map<String, Match> matches = new ConcurrentHashMap<>();
    public final Map<String, Team> teams = new ConcurrentHashMap<>();
    public final Map<String, Notification> notifications = new ConcurrentHashMap<>();
    public final Map<String, AiConversation> conversations = new ConcurrentHashMap<>();
    public final Map<String, Report> reports = new ConcurrentHashMap<>();
    public final Map<String, Review> reviews = new ConcurrentHashMap<>();
    public final Map<String, Trip> trips = new ConcurrentHashMap<>();
    public final Map<String, LocationState> locations = new ConcurrentHashMap<>();
    public final Map<String, Idempotency> idempotency = new ConcurrentHashMap<>();
    public final Map<String, Integer> aiUsage = new ConcurrentHashMap<>();
    public final Map<String, Object> flags = new ConcurrentHashMap<>();
    public final Map<String, String> currentCity = new ConcurrentHashMap<>();
    public final Map<String, java.util.Set<String>> favorites = new ConcurrentHashMap<>();
    public final Map<String, java.util.Set<String>> blacklist = new ConcurrentHashMap<>();
    public final Map<String, Map<String, Object>> exports = new ConcurrentHashMap<>();

    private final AtomicLong seq = new AtomicLong(1000);

    public DataStore() {
        seedUsers();
        seedCities();
        seedVisits();
        seedMemory();
        seedPosts();
        seedSocial();
        seedNotifications();
        seedAdmin();
    }

    public String id(String prefix) {
        return prefix + "_" + Long.toString(System.currentTimeMillis(), 36) + seq.incrementAndGet();
    }

    public static Instant now() {
        return Instant.now();
    }

    public static Instant ago(Duration duration) {
        return Instant.now().minus(duration);
    }

    public static Instant in(Duration duration) {
        return Instant.now().plus(duration);
    }

    public static String photo(int index) {
        return "/photos/pic" + String.format("%02d", index) + ".jpg";
    }

    public City cityByAdcode(String adcode) {
        return cities.get(adcode);
    }

    public City cityByName(String name) {
        return cities.values().stream().filter(c -> c.name.equals(name)).findFirst().orElse(null);
    }

    public City cityOf(String adcode) {
        City c = cities.get(adcode);
        if (c == null) {
            c = cityByName("杭州");
        }
        return c;
    }

    public List<Visit> visitsOf(String userId) {
        return visits.values().stream()
                .filter(v -> v.userId.equals(userId))
                .sorted((a, b) -> b.arrivedAt.compareTo(a.arrivedAt))
                .toList();
    }

    public List<MemoryBox> boxesOf(String userId) {
        return boxes.values().stream()
                .filter(b -> b.userId.equals(userId))
                .sorted(java.util.Comparator
                        .comparing((MemoryBox b) -> !"DRAFT".equals(b.status))
                        .thenComparing((MemoryBox b) -> b.updatedAt, java.util.Comparator.reverseOrder()))
                .toList();
    }

    public List<Post> postsOf(String userId) {
        return posts.values().stream()
                .filter(p -> p.authorId.equals(userId) && !p.deleted)
                .sorted((a, b) -> b.publishedAt.compareTo(a.publishedAt))
                .toList();
    }

    public List<Notification> notificationsOf(String userId) {
        return notifications.values().stream()
                .filter(n -> n.userId.equals(userId))
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .toList();
    }

    public List<Team> teamsOf(String userId) {
        return teams.values().stream()
                .filter(t -> t.members.stream().anyMatch(m -> m.userId.equals(userId)))
                .toList();
    }

    public ShareSession activeSession(String userId) {
        return sessions.values().stream()
                .filter(s -> s.userId.equals(userId) && "ACTIVE".equals(s.status))
                .findFirst().orElse(null);
    }

    public AiConversation conversation(String userId, String city) {
        return conversations.values().stream()
                .filter(c -> c.userId.equals(userId))
                .findFirst()
                .orElseGet(() -> {
                    AiConversation c = new AiConversation();
                    c.id = id("conv");
                    c.userId = userId;
                    c.city = city;
                    conversations.put(c.id, c);
                    return c;
                });
    }

    public int aiUsed(String userId) {
        return aiUsage.getOrDefault(userId, 0);
    }

    // ------------------------------------------------------------------ seed

    private void seedUsers() {
        User me = new User();
        me.id = "u_me";
        me.phone = "13800000000";
        me.nickname = "阿澈";
        me.avatarUrl = null;
        me.gender = "FEMALE";
        me.birthYear = 1999;
        me.homeCity = "杭州";
        me.bio = "拍照、走路、喝咖啡。把去过的地方慢慢点亮。";
        me.tags = List.of("摄影", "徒步", "咖啡", "慢节奏");
        me.realnameStatus = "VERIFIED";
        me.admin = true;
        me.createdAt = Instant.parse("2023-01-08T02:10:00Z");
        me.settings.put("mapVisible", true);
        me.settings.put("autoLight", true);
        me.settings.put("albumSync", true);
        me.settings.put("shareVisible", true);
        Device device = new Device();
        device.id = "dev_1";
        device.name = "iPhone 16 Pro";
        device.platform = "IOS";
        device.current = true;
        me.devices.add(device);
        users.put(me.id, me);
        currentCity.put(me.id, "杭州");

        addUser("u1", "林小满", "FEMALE", 1998, "摄影，咖啡，citywalk", List.of("摄影", "咖啡", "citywalk"), true);
        addUser("u2", "Kay", "FEMALE", 1997, "徒步，日出，露营", List.of("徒步", "日出", "露营"), true);
        addUser("u3", "阿泽", "MALE", 2000, "美食，夜游，livehouse", List.of("美食", "夜游", "livehouse"), false);
        addUser("u4", "小北", "MALE", 1996, "胶片，骑行，旧书店", List.of("胶片", "骑行", "书店"), true);
        addUser("u_chen", "陈默", "MALE", 1994, "在湖边住久了，知道什么时候人少", List.of("本地", "摄影"), true);
        addUser("u_momo", "Momo", "FEMALE", 1999, "寺庙与山", List.of("徒步", "寺庙"), true);
        addUser("u_zhou", "老周", "MALE", 1988, "杭州土著，跑山十年", List.of("跑山", "本地"), true);
    }

    private void addUser(String id, String nickname, String gender, int birthYear, String bio,
                         List<String> tags, boolean verified) {
        User u = new User();
        u.id = id;
        u.phone = "1390000" + id.replace("u_", "").replace("u", "") + "0";
        u.nickname = nickname;
        u.gender = gender;
        u.birthYear = birthYear;
        u.bio = bio;
        u.tags = new ArrayList<>(tags);
        u.realnameStatus = verified ? "VERIFIED" : "PENDING";
        u.createdAt = ago(Duration.ofDays(300));
        users.put(id, u);
    }

    private void seedCities() {
        city("北京", "北京市", "beijing", "110100", true);
        city("上海", "上海市", "shanghai", "310100", true);
        city("天津", "天津市", "tianjin", "120100", false);
        city("重庆", "重庆市", "chongqing", "500100", true);
        city("杭州", "浙江省", "hangzhou", "330100", true);
        city("宁波", "浙江省", "ningbo", "330200", false);
        city("温州", "浙江省", "wenzhou", "330300", false);
        city("苏州", "江苏省", "suzhou", "320500", false);
        city("南京", "江苏省", "nanjing", "320100", true);
        city("无锡", "江苏省", "wuxi", "320200", false);
        city("扬州", "江苏省", "yangzhou", "321000", false);
        city("成都", "四川省", "chengdu", "510100", true);
        city("绵阳", "四川省", "mianyang", "510700", false);
        city("乐山", "四川省", "leshan", "511100", false);
        city("昆明", "云南省", "kunming", "530100", false);
        city("大理", "云南省", "dali", "532900", true);
        city("丽江", "云南省", "lijiang", "530700", true);
        city("香格里拉", "云南省", "xianggelila", "533400", false);
        city("西双版纳", "云南省", "xishuangbanna", "532800", false);
        city("厦门", "福建省", "xiamen", "350200", true);
        city("福州", "福建省", "fuzhou", "350100", false);
        city("泉州", "福建省", "quanzhou", "350500", false);
        city("广州", "广东省", "guangzhou", "440100", false);
        city("深圳", "广东省", "shenzhen", "440300", false);
        city("珠海", "广东省", "zhuhai", "440400", false);
        city("汕头", "广东省", "shantou", "440500", false);
        city("西安", "陕西省", "xian", "610100", true);
        city("延安", "陕西省", "yanan", "610600", false);
        city("青岛", "山东省", "qingdao", "370200", true);
        city("济南", "山东省", "jinan", "370100", false);
        city("烟台", "山东省", "yantai", "370600", false);
        city("长沙", "湖南省", "changsha", "430100", true);
        city("张家界", "湖南省", "zhangjiajie", "430800", true);
        city("武汉", "湖北省", "wuhan", "420100", false);
        city("宜昌", "湖北省", "yichang", "420500", false);
        city("郑州", "河南省", "zhengzhou", "410100", false);
        city("洛阳", "河南省", "luoyang", "410300", false);
        city("哈尔滨", "黑龙江省", "haerbin", "230100", false);
        city("沈阳", "辽宁省", "shenyang", "210100", false);
        city("大连", "辽宁省", "dalian", "210200", false);
        city("长春", "吉林省", "changchun", "220100", false);
        city("呼和浩特", "内蒙古自治区", "huhehaote", "150100", false);
        city("乌鲁木齐", "新疆维吾尔自治区", "wulumuqi", "650100", false);
        city("拉萨", "西藏自治区", "lasa", "540100", true);
        city("兰州", "甘肃省", "lanzhou", "620100", false);
        city("敦煌", "甘肃省", "dunhuang", "620900", true);
        city("西宁", "青海省", "xining", "630100", false);
        city("银川", "宁夏回族自治区", "yinchuan", "640100", false);
        city("太原", "山西省", "taiyuan", "140100", false);
        city("石家庄", "河北省", "shijiazhuang", "130100", false);
        city("秦皇岛", "河北省", "qinhuangdao", "130300", false);
        city("南昌", "江西省", "nanchang", "360100", false);
        city("景德镇", "江西省", "jingdezhen", "360200", true);
        city("合肥", "安徽省", "hefei", "340100", false);
        city("黄山", "安徽省", "huangshan", "341000", true);
        city("南宁", "广西壮族自治区", "nanning", "450100", false);
        city("桂林", "广西壮族自治区", "guilin", "450300", true);
        city("海口", "海南省", "haikou", "460100", false);
        city("三亚", "海南省", "sanya", "460200", true);
        city("贵阳", "贵州省", "guiyang", "520100", false);
        city("遵义", "贵州省", "zunyi", "520300", false);
        city("香港", "香港特别行政区", "xianggang", "810000", false);
        city("澳门", "澳门特别行政区", "aomen", "820000", false);
        city("台北", "台湾省", "taibei", "710000", false);

        lit("杭州", 4, 11, "2023-04-06", "今天", true);
        lit("上海", 2, 4, "2024-02-11", "2025-11-02", false);
        lit("成都", 1, 3, "2025-12-28", "2025-12-30", false);
        lit("大理", 2, 6, "2024-08-02", "2026-05-06", true);
        lit("厦门", 1, 3, "2026-03-21", "2026-03-23", false);
        lit("北京", 1, 2, "2024-02-11", "2024-02-12", false);
        currentCity.put("u_me", "杭州");
    }

    private void city(String name, String province, String pinyin, String adcode, boolean hot) {
        City c = new City();
        c.adcode = adcode;
        c.name = name;
        c.province = province;
        c.provinceAdcode = provinceAdcode(province);
        c.pinyin = pinyin;
        c.hot = hot;
        cities.put(adcode, c);
    }

    private String provinceAdcode(String province) {
        return switch (province) {
            case "北京市" -> "110000";
            case "上海市" -> "310000";
            case "天津市" -> "120000";
            case "重庆市" -> "500000";
            case "浙江省" -> "330000";
            case "江苏省" -> "320000";
            case "四川省" -> "510000";
            case "云南省" -> "530000";
            case "福建省" -> "350000";
            case "广东省" -> "440000";
            case "陕西省" -> "610000";
            case "山东省" -> "370000";
            case "湖南省" -> "430000";
            case "湖北省" -> "420000";
            case "河南省" -> "410000";
            case "黑龙江省" -> "230000";
            case "辽宁省" -> "210000";
            case "吉林省" -> "220000";
            case "内蒙古自治区" -> "150000";
            case "新疆维吾尔自治区" -> "650000";
            case "西藏自治区" -> "540000";
            case "甘肃省" -> "620000";
            case "青海省" -> "630000";
            case "宁夏回族自治区" -> "640000";
            case "山西省" -> "140000";
            case "河北省" -> "130000";
            case "江西省" -> "360000";
            case "安徽省" -> "340000";
            case "广西壮族自治区" -> "450000";
            case "海南省" -> "460000";
            case "贵州省" -> "520000";
            case "香港特别行政区" -> "810000";
            case "澳门特别行政区" -> "820000";
            case "台湾省" -> "710000";
            default -> "990000";
        };
    }

    private void lit(String name, int visitsCount, int days, String first, String last, boolean deep) {
        City c = cityByName(name);
        if (c == null) return;
        c.lit = true;
        c.deepLit = deep;
        c.visits = visitsCount;
        c.days = days;
        c.firstVisitAt = first.equals("今天") ? ago(Duration.ofDays(1)) : Instant.parse(first + "T02:00:00Z");
        c.lastVisitAt = last.equals("今天") ? now() : Instant.parse(last + "T09:00:00Z");
    }

    private void seedVisits() {
        visit("杭州", 4, "AUTO", "2026-10-18T02:10:00Z", null, 47, 0.94);
        visit("上海", 2, "AUTO", "2025-11-02T05:00:00Z", "2025-11-03T10:00:00Z", 1740, 0.91);
        visit("成都", 1, "AUTO", "2025-12-28T04:00:00Z", "2025-12-30T08:00:00Z", 3120, 0.9);
        visit("大理", 2, "AUTO", "2026-05-02T03:00:00Z", "2026-05-06T06:00:00Z", 5940, 0.93);
        visit("厦门", 1, "MANUAL", "2026-03-21T02:00:00Z", "2026-03-23T05:00:00Z", 3060, 1.0);
        visit("北京", 1, "AUTO", "2024-02-11T02:00:00Z", "2024-02-12T09:00:00Z", 1860, 0.88);

        Trip trip = new Trip();
        trip.id = "trip_hz";
        trip.userId = "u_me";
        trip.cityAdcode = "330100";
        trip.title = "杭州 · 秋日漫游";
        trip.startAt = Instant.parse("2026-10-18T02:00:00Z");
        trip.endAt = null;
        trip.mediaCount = 18;
        trip.visitIds.add("v_杭州_4");
        trips.put(trip.id, trip);

        Trip dali = new Trip();
        dali.id = "trip_dali";
        dali.userId = "u_me";
        dali.cityAdcode = "532900";
        dali.title = "大理 · 风花雪月";
        dali.startAt = Instant.parse("2026-05-02T03:00:00Z");
        dali.endAt = Instant.parse("2026-05-06T06:00:00Z");
        dali.mediaCount = 42;
        dali.visitIds.add("v_大理_2");
        trips.put(dali.id, dali);

        LocationState state = new LocationState();
        state.userId = "u_me";
        state.cityAdcode = "330100";
        state.pendingMinutes = 47;
        state.pendingPoints = 3;
        state.lastAccuracy = 38;
        state.points.add(new Point(30.2573, 120.1503, 38, System.currentTimeMillis() - 47 * 60_000));
        state.points.add(new Point(30.2581, 120.1511, 35, System.currentTimeMillis() - 25 * 60_000));
        state.points.add(new Point(30.2588, 120.1522, 42, System.currentTimeMillis() - 4 * 60_000));
        locations.put(state.userId, state);
    }

    private void visit(String cityName, int nth, String method, String arrived, String left, int minutes, double confidence) {
        City c = cityByName(cityName);
        Visit v = new Visit();
        v.id = "v_" + cityName + "_" + nth;
        v.userId = "u_me";
        v.cityAdcode = c.adcode;
        v.method = method;
        v.arrivedAt = Instant.parse(arrived);
        v.leftAt = left == null ? null : Instant.parse(left);
        v.durationMinutes = minutes;
        v.confidence = confidence;
        v.status = "CONFIRMED";
        visits.put(v.id, v);
    }

    private void seedMemory() {
        box("box-hz", "杭州 · 秋日漫游", 4, "DRAFT", "magazine", "330100",
                "2026-10-18T02:00:00Z", null, 18,
                List.of(
                        new Day("Day 1", "10.18 周六", "西湖 · 河坊街", List.of(photo(4), photo(14), photo(1), photo(16), photo(10), photo(2))),
                        new Day("Day 2", "10.19 周日", "灵隐 · 龙井", List.of(photo(15), photo(6), photo(12))),
                        new Day("Day 3", "10.20 周一", "待记录", List.of())
                ));
        box("box-dali", "大理 · 风花雪月", 2, "DONE", "film", "532900",
                "2026-05-02T03:00:00Z", "2026-05-06T06:00:00Z", 42,
                List.of(new Day("Day 1", "05.02 周六", "洱海 · 才村", List.of(photo(2), photo(5), photo(8), photo(11)))));
        box("box-xm", "厦门 · 海边三日", 1, "DONE", "minimal", "350200",
                "2026-03-21T02:00:00Z", "2026-03-23T05:00:00Z", 31,
                List.of(new Day("Day 1", "03.21 周六", "环岛路 · 沙坡尾", List.of(photo(7), photo(9), photo(13)))));
        box("box-qz", "泉州 · 半城烟火", 1, "DONE", "magazine", "350500",
                "2025-10-01T02:00:00Z", "2025-10-03T05:00:00Z", 26,
                List.of(new Day("Day 1", "10.01 周三", "西街 · 开元寺", List.of(photo(3), photo(17), photo(18)))));

        for (String p : List.of(photo(4), photo(14), photo(1), photo(16), photo(10), photo(2))) {
            MediaAsset m = new MediaAsset();
            m.id = id("media");
            m.boxId = "box-hz";
            m.userId = "u_me";
            m.url = p;
            media.put(m.id, m);
        }

        ShareLink link = new ShareLink();
        link.id = "link_dali";
        link.boxId = "box-dali";
        link.userId = "u_me";
        link.token = "dali7k9";
        link.expiresAt = in(Duration.ofDays(7));
        link.watermark = true;
        shareLinks.put(link.id, link);
        boxes.get("box-dali").shareLinkId = link.id;
    }

    private void box(String id, String title, int nth, String status, String template, String adcode,
                     String start, String end, int count, List<Day> days) {
        MemoryBox b = new MemoryBox();
        b.id = id;
        b.userId = "u_me";
        b.title = title;
        b.status = status;
        b.template = template;
        b.cityAdcode = adcode;
        b.startAt = Instant.parse(start);
        b.endAt = end == null ? null : Instant.parse(end);
        b.mediaCount = count;
        b.coverUrl = days.isEmpty() || days.get(0).photos.isEmpty() ? photo(1) : days.get(0).photos.get(0);
        b.photos = days.stream().flatMap(d -> d.photos.stream()).toList();
        b.days = new ArrayList<>(days);
        b.updatedAt = ago(Duration.ofHours(nth * 6L));
        boxes.put(id, b);
    }

    private void seedPosts() {
        post("p1", "NOW", "u_chen", "杭州", "断桥残雪", "西湖景区",
                "断桥这会儿人已经散了，现在过来刚刚好。湖边风大，记得带件外套。",
                photo(5), 12, 12, 2, 34, 6);
        post("p2", "NOW", "u_momo", "杭州", "灵隐寺", "灵隐景区",
                "灵隐寺今日 17:00 停止入场，飞来峰景区正常。排队约 25 分钟，建议从后山进。",
                photo(6), 46, 8, 0, 21, 4);
        post("p3", "TODAY", "u_zhou", "杭州", "九溪烟树", "西湖景区",
                "九溪的水量这周刚好。从林海亭走到理安寺大约 40 分钟，石板路湿，穿防滑的鞋。",
                photo(7), 180, 5, 1, 18, 3);
        post("p4", "TODAY", "u1", "杭州", "河坊街", "上城区",
                "河坊街晚上 8 点后小吃摊最全，但主街人挤人。拐进大井巷会安静很多。",
                photo(8), 300, 3, 0, 12, 2);
        post("p5", "LONG", "u3", "杭州", "武林夜市", "拱墅区",
                "武林夜市 18:30 开摊，先吃再逛。停车建议停西湖文化广场，走过来 8 分钟。",
                photo(9), 2880, 22, 2, 56, 11);
        post("p6", "LONG", "u4", "大理", "才村码头", "洱海西岸",
                "拍洱海日出别去网红点。才村码头往北 500 米有一片浅滩，人少，风也小。",
                photo(10), 8640, 31, 1, 88, 9);
    }

    private void post(String id, String type, String authorId, String city, String place, String area,
                      String content, String image, int minutesAgo, int valid, int invalid, int likes, int comments) {
        Post p = new Post();
        p.id = id;
        p.type = type;
        p.authorId = authorId;
        p.city = city;
        p.place = place;
        p.area = area;
        p.content = content;
        p.imageUrl = image;
        p.publishedAt = ago(Duration.ofMinutes(minutesAgo));
        p.expiresAt = switch (type) {
            case "NOW" -> p.publishedAt.plus(Duration.ofHours(6));
            case "TODAY" -> p.publishedAt.plus(Duration.ofHours(24));
            default -> p.publishedAt.plus(Duration.ofDays(30));
        };
        p.validCount = valid;
        p.invalidCount = invalid;
        p.likeCount = likes;
        p.commentCount = comments;
        posts.put(id, p);

        Comment c = new Comment();
        c.id = id("cmt");
        c.postId = id;
        c.userId = "u2";
        c.content = type.equals("NOW") ? "刚去过，确实人少了。" : "记下了，周末去。";
        c.createdAt = ago(Duration.ofMinutes(Math.max(1, minutesAgo - 3)));
        this.comments.put(c.id, c);
    }

    private void seedSocial() {
        hallUser("u1", "林小满", "满", 24, List.of("摄影", "咖啡", "citywalk"), "ONE_KM",
                "你们都在杭州，都喜欢人文摄影；她今天下午也打算去 <b>河坊街</b>，停留时间重叠 2 天。",
                "想找：拍照搭子 · 慢节奏", "a1", true);
        hallUser("u2", "Kay", "K", 28, List.of("徒步", "日出", "露营"), "THREE_KM",
                "你们都早起去 <b>九溪</b>，出行节奏一致（紧凑 / 每日 1.5 万步），队伍还差 2 人。",
                "想找：徒步搭子 · 早出发", "a2", false);
        hallUser("u3", "阿泽", "泽", 26, List.of("美食", "夜游", "livehouse"), "SAME_CITY",
                "你们都在杭州，都收藏了 <b>武林夜市</b>；他今晚想去听 livehouse，时间重叠 4 小时。",
                "想找：夜游搭子 · 不赶时间", "a3", true);
        hallUser("u4", "小北", "北", 29, List.of("胶片", "骑行", "书店"), "ONE_KM",
                "他在 <b>南山路</b> 一带拍胶片，和你一样偏好阴天和旧街道。",
                "想找：扫街搭子 · 各拍各的", "a4", false);
        hallUser("u5", "Yuki", "Y", 25, List.of("咖啡", "展览", "建筑"), "THREE_KM",
                "你们都计划去 <b>中国美院</b> 看展，且都选了工作日下午避开人流。",
                "想找：看展搭子 · 安静", "a5", true);
        hallUser("u6", "程野", "程", 31, List.of("跑步", "本地", "徒步"), "SAME_CITY",
                "他常跑 <b>苏堤</b>，熟悉清晨 6 点的路线；你们配速接近。",
                "想找：晨跑搭子", "a6", false);

        Team team = new Team();
        team.id = "team_hz";
        team.name = "西湖慢走小队";
        team.city = "杭州";
        team.leaderId = "u1";
        team.capacity = 5;
        team.members.add(member("u1", "林小满", "满", true));
        team.members.add(member("u_me", "阿澈", "澈", false));
        team.members.add(member("u2", "Kay", "K", false));
        team.messages.add(systemMessage("队伍已创建 · 集合点仅成员可见"));
        team.messages.add(message("u1", "林小满", "16:30 九溪公交站 C 口，别走错到 B 口。"));
        team.messages.add(message("u2", "Kay", "我提前十分钟到，带了驱蚊水。"));
        team.messages.add(message("u_me", "阿澈", "好，我从西湖边过去，大概 20 分钟。"));
        teams.put(team.id, team);

        Like like = new Like();
        like.id = id("like");
        like.fromUserId = "u1";
        like.toUserId = "u_me";
        likes.put(like.id, like);
    }

    private Member member(String userId, String name, String initial, boolean leader) {
        Member m = new Member();
        m.userId = userId;
        m.name = name;
        m.initial = initial;
        m.leader = leader;
        return m;
    }

    private Message message(String userId, String name, String text) {
        Message m = new Message();
        m.id = id("msg");
        m.userId = userId;
        m.name = name;
        m.text = text;
        m.createdAt = ago(Duration.ofMinutes(30 - teams.size()));
        return m;
    }

    private Message systemMessage(String text) {
        Message m = new Message();
        m.id = id("msg");
        m.userId = "system";
        m.name = "system";
        m.text = text;
        m.system = true;
        m.createdAt = ago(Duration.ofHours(2));
        return m;
    }

    private void hallUser(String id, String name, String initial, int age, List<String> tags,
                          String distance, String why, String note, String hue, boolean likedYou) {
        HallUser h = new HallUser();
        h.id = id;
        h.name = name;
        h.initial = initial;
        h.age = age;
        h.tags = new ArrayList<>(tags);
        h.distanceBand = distance;
        h.why = why;
        h.note = note;
        h.hue = hue;
        h.likedYou = likedYou;
        hall.put(id, h);
    }

    private void seedNotifications() {
        notification("n1", "LIKE", "有人喜欢了你的共享名片", "林小满 在杭州喜欢了你的名片，双方同意后才会匹配。", false);
        notification("n2", "TEAM", "队伍集合点已更新", "西湖慢走小队 · 16:30 九溪公交站 C 口。", false);
        notification("n3", "POST", "你的「此刻」仍被标记有效", "断桥残雪 · 已有 12 人确认仍然有效。", true);
        notification("n4", "SYSTEM", "定位精度已降级为城市级", "7 天前的原始定位点已按隐私策略降精度。", true);
    }

    private void notification(String id, String type, String title, String body, boolean read) {
        Notification n = new Notification();
        n.id = id;
        n.userId = "u_me";
        n.type = type;
        n.title = title;
        n.body = body;
        n.read = read;
        n.createdAt = ago(Duration.ofHours(read ? 36 : 2));
        notifications.put(id, n);
    }

    private void seedAdmin() {
        Review r1 = new Review();
        r1.id = "rev_1";
        r1.targetType = "POST";
        r1.targetId = "p1";
        r1.title = "断桥残雪 · 现场内容";
        r1.content = "用户举报：内容疑似广告（附带民宿二维码）。";
        r1.createdAt = ago(Duration.ofHours(3));
        reviews.put(r1.id, r1);

        Review r2 = new Review();
        r2.id = "rev_2";
        r2.targetType = "POST";
        r2.targetId = "p4";
        r2.title = "河坊街 · 今日推荐";
        r2.content = "机器审核：图片检测到 1 处人脸，已自动模糊。";
        r2.createdAt = ago(Duration.ofHours(5));
        reviews.put(r2.id, r2);

        Report report = new Report();
        report.id = "rep_1";
        report.reporterId = "u_me";
        report.targetType = "USER";
        report.targetId = "u3";
        report.reason = "在队伍聊天中反复索要联系方式";
        report.createdAt = ago(Duration.ofHours(8));
        reports.put(report.id, report);

        flags.put("ai_enabled", true);
        flags.put("share_requires_realname", true);
        flags.put("post_first_three_review", false);
        flags.put("max_team_capacity", 8);
    }
}
