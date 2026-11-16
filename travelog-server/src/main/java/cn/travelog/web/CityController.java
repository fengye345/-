package cn.travelog.web;

import cn.travelog.common.ApiResponse;
import cn.travelog.common.PageResult;
import cn.travelog.model.Models.Point;
import cn.travelog.service.CityService;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class CityController {
    private final CityService cities;

    public CityController(CityService cities) {
        this.cities = cities;
    }

    @GetMapping("/cities")
    public ApiResponse<PageResult<Map<String, Object>>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean lit,
            @RequestParam(required = false) String province,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(cities.list(q, lit, province, page, size));
    }

    @GetMapping("/cities/provinces")
    public ApiResponse<List<Map<String, Object>>> provinces() {
        return ApiResponse.ok(cities.provinces());
    }

    @GetMapping("/cities/current")
    public ApiResponse<Map<String, Object>> current(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(cities.current(userId));
    }

    @GetMapping("/cities/{adcode}")
    public ApiResponse<Map<String, Object>> city(@PathVariable String adcode) {
        return ApiResponse.ok(cities.get(adcode));
    }

    @GetMapping("/cities/{adcode}/card")
    public ApiResponse<Map<String, Object>> card(@PathVariable String adcode,
                                                 @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(cities.card(adcode, userId));
    }

    public record PointsRequest(List<Point> points) {
    }

    @PostMapping("/location/points")
    public ApiResponse<Map<String, Object>> points(@RequestAttribute("userId") String userId,
                                                   @RequestBody PointsRequest request) {
        return ApiResponse.ok(cities.addPoints(userId, request.points()));
    }

    @GetMapping("/location/state")
    public ApiResponse<Map<String, Object>> locationState(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(cities.locationState(userId));
    }

    @GetMapping("/visits")
    public ApiResponse<PageResult<Map<String, Object>>> visits(@RequestAttribute("userId") String userId,
                                                               @RequestParam(defaultValue = "1") int page,
                                                               @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(cities.visits(userId, page, size));
    }

    @GetMapping("/visits/summary")
    public ApiResponse<Map<String, Object>> summary(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(cities.visitSummary(userId));
    }

    @GetMapping("/visits/{visitId}")
    public ApiResponse<Map<String, Object>> visit(@PathVariable String visitId,
                                                  @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(cities.visit(visitId, userId));
    }

    @DeleteMapping("/visits/{visitId}")
    public ApiResponse<Void> deleteVisit(@PathVariable String visitId,
                                         @RequestAttribute("userId") String userId) {
        cities.deleteVisit(visitId, userId);
        return ApiResponse.ok();
    }

    public record ManualVisit(String cityAdcode, Instant arrivedAt, Instant leftAt, String note) {
    }

    @PostMapping("/visits/manual")
    public ApiResponse<Map<String, Object>> manual(@RequestAttribute("userId") String userId,
                                                   @RequestBody ManualVisit request) {
        return ApiResponse.ok(cities.manualVisit(userId, request.cityAdcode(), request.arrivedAt(),
                request.leftAt(), request.note()));
    }

    @PostMapping("/visits/{visitId}/appeals")
    public ApiResponse<Map<String, Object>> appeal(@PathVariable String visitId,
                                                   @RequestAttribute("userId") String userId,
                                                   @RequestBody(required = false) Map<String, Object> body) {
        String reason = body == null ? null : String.valueOf(body.getOrDefault("reason", ""));
        return ApiResponse.ok(cities.appeal(visitId, userId, reason));
    }

    @GetMapping("/trips")
    public ApiResponse<List<Map<String, Object>>> trips(@RequestAttribute("userId") String userId) {
        return ApiResponse.ok(cities.trips(userId));
    }

    @GetMapping("/trips/{tripId}")
    public ApiResponse<Map<String, Object>> trip(@PathVariable String tripId,
                                                 @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(cities.trip(tripId, userId));
    }

    @PostMapping("/trips/{tripId}/merge")
    public ApiResponse<Map<String, Object>> merge(@PathVariable String tripId,
                                                  @RequestAttribute("userId") String userId,
                                                  @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.getOrDefault("tripIds", List.of());
        return ApiResponse.ok(cities.mergeTrips(userId, ids));
    }

    public record SplitRequest(String title, Instant startAt, Instant endAt) {
    }

    @PostMapping("/trips/{tripId}/split")
    public ApiResponse<List<Map<String, Object>>> split(@PathVariable String tripId,
                                                        @RequestAttribute("userId") String userId,
                                                        @RequestBody SplitRequest request) {
        return ApiResponse.ok(cities.splitTrip(tripId, userId, request.title(), request.startAt(), request.endAt()));
    }
}
