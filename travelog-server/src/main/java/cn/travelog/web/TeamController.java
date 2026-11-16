package cn.travelog.web;

import cn.travelog.common.ApiResponse;
import cn.travelog.service.TeamService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/teams")
public class TeamController {
    private final TeamService teams;

    public TeamController(TeamService teams) {
        this.teams = teams;
    }

    public record CreateTeam(String name, String city, Integer capacity, Map<String, Object> meeting) {
    }

    public record ApproveRequest(Boolean approve) {
    }

    public record TransferRequest(String toUserId) {
    }

    public record MessageRequest(String text) {
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@RequestAttribute("userId") String userId,
                                                   @RequestBody CreateTeam request) {
        return ApiResponse.ok(teams.create(userId, request.name(), request.city(),
                request.capacity(), request.meeting()));
    }

    @GetMapping("/{teamId}")
    public ApiResponse<Map<String, Object>> get(@PathVariable String teamId,
                                                @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(teams.get(teamId, userId));
    }

    @PostMapping("/{teamId}/join-requests")
    public ApiResponse<Map<String, Object>> join(@PathVariable String teamId,
                                                 @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(teams.joinRequest(teamId, userId));
    }

    @PostMapping("/{teamId}/join-requests/{requestId}/approve")
    public ApiResponse<Map<String, Object>> approve(@PathVariable String teamId,
                                                    @PathVariable String requestId,
                                                    @RequestAttribute("userId") String userId,
                                                    @RequestBody(required = false) ApproveRequest request) {
        boolean approve = request == null || request.approve() == null || request.approve();
        return ApiResponse.ok(teams.approve(teamId, requestId, userId, approve));
    }

    @DeleteMapping("/{teamId}/members/{memberId}")
    public ApiResponse<Void> remove(@PathVariable String teamId, @PathVariable String memberId,
                                    @RequestAttribute("userId") String userId) {
        teams.removeMember(teamId, memberId, userId);
        return ApiResponse.ok();
    }

    @PostMapping("/{teamId}/transfer")
    public ApiResponse<Map<String, Object>> transfer(@PathVariable String teamId,
                                                     @RequestAttribute("userId") String userId,
                                                     @RequestBody TransferRequest request) {
        return ApiResponse.ok(teams.transfer(teamId, request.toUserId(), userId));
    }

    @PostMapping("/{teamId}/dissolve")
    public ApiResponse<Void> dissolve(@PathVariable String teamId,
                                      @RequestAttribute("userId") String userId) {
        teams.dissolve(teamId, userId);
        return ApiResponse.ok();
    }

    @GetMapping("/{teamId}/messages")
    public ApiResponse<List<Map<String, Object>>> messages(@PathVariable String teamId,
                                                           @RequestAttribute("userId") String userId) {
        return ApiResponse.ok(teams.messages(teamId, userId));
    }

    @PostMapping("/{teamId}/messages")
    public ApiResponse<Map<String, Object>> send(@PathVariable String teamId,
                                                 @RequestAttribute("userId") String userId,
                                                 @RequestBody MessageRequest request) {
        return ApiResponse.ok(teams.send(teamId, userId, request.text()));
    }

    @PutMapping("/{teamId}/meeting")
    public ApiResponse<Map<String, Object>> meeting(@PathVariable String teamId,
                                                    @RequestAttribute("userId") String userId,
                                                    @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(teams.meeting(teamId, userId, body));
    }
}
