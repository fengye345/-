package cn.travelog.web;

import cn.travelog.common.ApiResponse;
import cn.travelog.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    public record SmsCodeRequest(String phone) {
    }

    public record SmsLoginRequest(String phone, String code) {
    }

    public record RefreshRequest(String refreshToken) {
    }

    @PostMapping("/sms/codes")
    public ApiResponse<Map<String, Object>> sendCode(@RequestBody SmsCodeRequest request) {
        return ApiResponse.ok(auth.sendCode(request.phone()));
    }

    @PostMapping("/sessions/sms")
    public ApiResponse<Map<String, Object>> loginSms(@RequestBody SmsLoginRequest request) {
        return ApiResponse.ok(auth.loginSms(request.phone(), request.code()));
    }

    @PostMapping("/sessions/wechat")
    public ApiResponse<Map<String, Object>> wechat(@RequestBody(required = false) Map<String, Object> body) {
        return ApiResponse.ok(auth.loginDemo("WECHAT"));
    }

    @PostMapping("/sessions/apple")
    public ApiResponse<Map<String, Object>> apple(@RequestBody(required = false) Map<String, Object> body) {
        return ApiResponse.ok(auth.loginDemo("APPLE"));
    }

    @PostMapping("/tokens/refresh")
    public ApiResponse<Map<String, Object>> refresh(@RequestBody RefreshRequest request) {
        return ApiResponse.ok(auth.refresh(request.refreshToken()));
    }

    @DeleteMapping("/sessions/current")
    public ApiResponse<Void> logout() {
        return ApiResponse.ok();
    }
}
