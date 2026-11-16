package cn.travelog.service;

import cn.travelog.common.ApiException;
import cn.travelog.common.PageResult;
import cn.travelog.model.Models.*;
import cn.travelog.store.DataStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CityService {
    private final DataStore store;
    private final long shareTtlHours;

    public CityService(DataStore store, @Value("${travelog.share.ttl-hours}") long shareTtlHours) {
        this.store = store;
        this.shareTtlHours = shareTtlHours;
    }

    public PageResult<Map<String, Object>> list(String q, Boolean lit, String province, int page, int size) {
        List<City> found = store.cities.values().stream()
                .filter(c -> q == null || q.isBlank()
                        || c.name.contains(q)
                        || c.pinyin.startsWith(q.toLowerCase())
                        || c.province.contains(q))
                .filter(c -> lit == null || c.lit == lit)
                .filter(c -> province == null || province.isBlank() || c.province.contains(province))
                .sorted(Comparator.comparing((City c) -> !c.lit)
                        .thenComparing(c -> !c.hot)
                        .thenComparing(c -> c.name))
                .toList();
        List<Map<String, Object>> views = found.stream().map(Views::city).toList();
        return PageResult.of(views, page, size);
    }

    public List<Map<String, Object>> provinces() {
        Map<String, List<City>> grouped = new LinkedHashMap<>();
        for (City c : store.cities.values()) {
            grouped.computeIfAbsent(c.province, k -> new ArrayList<>()).add(c);
        }
        List<Map<String, Object>> result = new ArrayList<>();
        grouped.forEach((province, list) -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("adcode", list.get(0).provinceAdcode);
            m.put("name", province);
            m.put("total", list.size());
            m.put("lit", list.stream().filter(c -> c.lit).count());
            m.put("coverage", list.isEmpty() ? 0 : Math.round(100.0 * list.stream().filter(c -> c.lit).count() / list.size()));
            result.add(m);
        });
        return result;
    }

    public Map<String, Object> current(String userId) {
        String name = store.currentCity.getOrDefault(userId, "杭州");
        City city = store.cityByName(name);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("city", Views.city(city));
        m.put("state", locationState(userId));
        return m;
    }

    public Map<String, Object> get(String adcode) {
        City city = store.cityByAdcode(adcode);
        if (city == null) throw ApiException.notFound("CITY_404_01", "城市不存在");
        return Views.city(city);
    }

    public Map<String, Object> card(String adcode, String userId) {
        City city = store.cityByAdcode(adcode);
        if (city == null) throw ApiException.notFound("CITY_404_01", "城市不存在");
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("city", Views.city(city));
        List<Map<String, Object>> visits = store.visitsOf(userId).stream()
                .filter(v -> v.cityAdcode.equals(adcode))
                .map(v -> Views.visit(v, city))
                .toList();
        m.put("visits", visits);
        m.put("memoryBoxCount", store.boxesOf(userId).stream()
                .filter(b -> !b.deleted && adcode.equals(b.cityAdcode)).count());
        m.put("quote", "秋天的西湖，风把桂花吹到了北山街。");
        m.put("privacy", "分享城市卡时不包含精确到访点、同行人和原始轨迹。");
        return m;
    }

    public Map<String, Object> locationState(String userId) {
        LocationState state = store.locations.computeIfAbsent(userId, id -> {
            LocationState s = new LocationState();
            s.userId = id;
            return s;
        });
        City city = store.cityOf(state.cityAdcode);
        Map<String, Object> pending = new LinkedHashMap<>();
        pending.put("minutes", state.pendingMinutes);
        pending.put("points", state.pendingPoints);
        pending.put("accuracy", state.lastAccuracy);
        pending.put("requiredMinutes", 30);
        pending.put("requiredPoints", 2);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("city", Views.city(city));
        m.put("insideCity", true);
        m.put("lit", city.lit);
        m.put("pending", pending);
        m.put("progress", Math.min(1.0, state.pendingMinutes / 30.0));
        m.put("updatedAt", state.lastAt);
        return m;
    }

    public Map<String, Object> addPoints(String userId, List<Point> points) {
        if (points == null || points.isEmpty()) {
            throw ApiException.unprocessable("LOC_422_01", "至少需要一个定位点");
        }
        LocationState state = store.locations.computeIfAbsent(userId, id -> {
            LocationState s = new LocationState();
            s.userId = id;
            return s;
        });
        for (Point p : points) {
            if (p.lat < -90 || p.lat > 90 || p.lng < -180 || p.lng > 180) {
                throw ApiException.unprocessable("LOC_422_02", "定位点坐标不合法");
            }
            state.points.add(p);
        }
        Point latest = points.get(points.size() - 1);
        state.lastAccuracy = latest.accuracy;
        state.lastAt = Instant.now();
        if (state.points.size() > 200) {
            state.points = new ArrayList<>(state.points.subList(state.points.size() - 200, state.points.size()));
        }
        long first = state.points.get(0).capturedAtMs;
        long last = state.points.get(state.points.size() - 1).capturedAtMs;
        state.pendingMinutes = (int) Math.max(0, (last - first) / 60_000);
        state.pendingPoints = state.points.size();

        City city = store.cityOf(state.cityAdcode);
        boolean litNow = false;
        if (!city.lit && state.pendingMinutes >= 30 && state.pendingPoints >= 2) {
            city.lit = true;
            city.visits += 1;
            city.days += 1;
            city.firstVisitAt = Instant.now();
            city.lastVisitAt = Instant.now();
            Visit visit = new Visit();
            visit.id = store.id("v");
            visit.userId = userId;
            visit.cityAdcode = city.adcode;
            visit.arrivedAt = Instant.now().minus(Duration.ofMinutes(state.pendingMinutes));
            visit.method = "AUTO";
            visit.durationMinutes = state.pendingMinutes;
            store.visits.put(visit.id, visit);
            litNow = true;
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("accepted", points.size());
        m.put("duplicate", 0);
        m.put("city", Views.city(city));
        m.put("litNow", litNow);
        m.put("state", locationState(userId));
        return m;
    }

    public PageResult<Map<String, Object>> visits(String userId, int page, int size) {
        List<Map<String, Object>> views = store.visitsOf(userId).stream()
                .map(v -> Views.visit(v, store.cityOf(v.cityAdcode)))
                .toList();
        return PageResult.of(views, page, size);
    }

    public Map<String, Object> visitSummary(String userId) {
        List<City> lit = store.cities.values().stream().filter(c -> c.lit).toList();
        int visits = lit.stream().mapToInt(c -> c.visits).sum();
        int days = lit.stream().mapToInt(c -> c.days).sum();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("litCities", lit.size());
        m.put("provinces", lit.stream().map(c -> c.province).distinct().count());
        m.put("totalProvinces", 34);
        m.put("visits", visits);
        m.put("days", days);
        m.put("coverage", Math.round(100.0 * lit.stream().map(c -> c.province).distinct().count() / 34));
        return m;
    }

    public Map<String, Object> visit(String visitId, String userId) {
        Visit v = store.visits.get(visitId);
        if (v == null || !v.userId.equals(userId)) throw ApiException.notFound("VISIT_404_01", "到访记录不存在");
        return Views.visit(v, store.cityOf(v.cityAdcode));
    }

    public void deleteVisit(String visitId, String userId) {
        Visit v = store.visits.get(visitId);
        if (v == null || !v.userId.equals(userId)) throw ApiException.notFound("VISIT_404_01", "到访记录不存在");
        store.visits.remove(visitId);
        City city = store.cityOf(v.cityAdcode);
        city.visits = Math.max(0, city.visits - 1);
        if (city.visits == 0) city.lit = false;
    }

    public Map<String, Object> manualVisit(String userId, String adcode, Instant arrivedAt, Instant leftAt, String note) {
        City city = store.cityByAdcode(adcode);
        if (city == null) throw ApiException.notFound("CITY_404_01", "城市不存在");
        if (arrivedAt == null) arrivedAt = Instant.now().minus(Duration.ofHours(3));
        if (leftAt != null && leftAt.isBefore(arrivedAt)) {
            throw ApiException.unprocessable("VISIT_422_01", "离开时间不能早于到达时间");
        }
        Visit v = new Visit();
        v.id = store.id("v");
        v.userId = userId;
        v.cityAdcode = adcode;
        v.arrivedAt = arrivedAt;
        v.leftAt = leftAt;
        v.method = "MANUAL";
        v.status = "PENDING_REVIEW";
        v.confidence = 1.0;
        v.durationMinutes = leftAt == null ? 0 : (int) Duration.between(arrivedAt, leftAt).toMinutes();
        v.note = note;
        store.visits.put(v.id, v);

        city.lit = true;
        city.visits += 1;
        city.days += Math.max(1, v.durationMinutes / 1440 + 1);
        if (city.firstVisitAt == null) city.firstVisitAt = arrivedAt;
        city.lastVisitAt = arrivedAt;
        store.currentCity.put(userId, city.name);
        return Views.visit(v, city);
    }

    public Map<String, Object> appeal(String visitId, String userId, String reason) {
        Visit v = store.visits.get(visitId);
        if (v == null || !v.userId.equals(userId)) throw ApiException.notFound("VISIT_404_01", "到访记录不存在");
        v.status = "APPEALING";
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("visitId", visitId);
        m.put("status", v.status);
        m.put("reason", reason);
        m.put("sla", "24 小时内首次响应");
        return m;
    }

    public List<Map<String, Object>> trips(String userId) {
        return store.trips.values().stream()
                .filter(t -> t.userId.equals(userId))
                .map(t -> Views.trip(t, store.cityOf(t.cityAdcode)))
                .toList();
    }

    public Map<String, Object> trip(String tripId, String userId) {
        Trip t = store.trips.get(tripId);
        if (t == null || !t.userId.equals(userId)) throw ApiException.notFound("TRIP_404_01", "旅行不存在");
        Map<String, Object> m = Views.trip(t, store.cityOf(t.cityAdcode));
        m.put("visits", t.visitIds.stream()
                .map(store.visits::get)
                .filter(v -> v != null)
                .map(v -> Views.visit(v, store.cityOf(v.cityAdcode)))
                .toList());
        m.put("boxes", store.boxesOf(userId).stream()
                .filter(b -> tripId.equals(b.tripId))
                .map(b -> Views.box(b, store.cityOf(b.cityAdcode), store))
                .toList());
        return m;
    }

    public Map<String, Object> mergeTrips(String userId, List<String> tripIds) {
        if (tripIds == null || tripIds.size() < 2) {
            throw ApiException.unprocessable("TRIP_422_01", "至少选择两个旅行进行合并");
        }
        List<Trip> list = tripIds.stream().map(store.trips::get).filter(t -> t != null && t.userId.equals(userId)).toList();
        if (list.size() < 2) throw ApiException.notFound("TRIP_404_01", "旅行不存在");
        Trip first = list.get(0);
        for (int i = 1; i < list.size(); i++) {
            first.visitIds.addAll(list.get(i).visitIds);
            first.mediaCount += list.get(i).mediaCount;
            if (list.get(i).endAt != null && (first.endAt == null || list.get(i).endAt.isAfter(first.endAt))) {
                first.endAt = list.get(i).endAt;
            }
            store.trips.remove(list.get(i).id);
        }
        return Views.trip(first, store.cityOf(first.cityAdcode));
    }

    public List<Map<String, Object>> splitTrip(String tripId, String userId, String title, Instant startAt, Instant endAt) {
        Trip source = store.trips.get(tripId);
        if (source == null || !source.userId.equals(userId)) throw ApiException.notFound("TRIP_404_01", "旅行不存在");
        Trip created = new Trip();
        created.id = store.id("trip");
        created.userId = userId;
        created.cityAdcode = source.cityAdcode;
        created.title = title == null ? source.title + " · 拆分" : title;
        created.startAt = startAt;
        created.endAt = endAt;
        created.mediaCount = 0;
        store.trips.put(created.id, created);
        return List.of(Views.trip(created, store.cityOf(created.cityAdcode)));
    }

    public long shareTtlHours() {
        return shareTtlHours;
    }
}
