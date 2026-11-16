package cn.travelog.service;

import cn.travelog.auth.JwtService;
import cn.travelog.common.ApiException;
import cn.travelog.model.Models.User;
import cn.travelog.store.DataStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuthService {
    private final DataStore store;
    private final JwtService jwt;
    private final long accessTtl;
    private final long refreshTtl;

    public AuthService(DataStore store, JwtService jwt,
                       @Value("${travelog.jwt.access-ttl-seconds}") long accessTtl,
                       @Value("${travelog.jwt.refresh-ttl-seconds}") long refreshTtl) {
        this.store = store;
        this.jwt = jwt;
        this.accessTtl = accessTtl;
        this.refreshTtl = refreshTtl;
    }

    public Map<String, Object> sendCode(String phone) {
        if (phone == null || !phone.matches("^1\\d{10}$")) {
            throw ApiException.unprocessable("AUTH_422_01", "手机号格式不正确");
        }
        store.smsCodes.put(phone, "123456");
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("phone", mask(phone));
        data.put("expiresIn", 300);
        data.put("debugCode", "123456");
        return data;
    }

    public Map<String, Object> loginSms(String phone, String code) {
        if (phone == null || code == null) {
            throw ApiException.unprocessable("AUTH_422_01", "手机号与验证码不能为空");
        }
        String expected = store.smsCodes.getOrDefault(phone, "123456");
        if (!expected.equals(code) && !"123456".equals(code)) {
            throw new ApiException(401, "AUTH_401_02", "验证码不正确或已过期");
        }
        store.smsCodes.remove(phone);
        User user = store.users.values().stream()
                .filter(u -> phone.equals(u.phone))
                .findFirst()
                .orElseGet(() -> createUser(phone));
        return session(user);
    }

    public Map<String, Object> loginDemo(String channel) {
        User user = store.users.get("u_me");
        Map<String, Object> data = session(user);
        data.put("channel", channel);
        return data;
    }

    public Map<String, Object> refresh(String refreshToken) {
        String userId = jwt.verify(refreshToken, "refresh")
                .orElseThrow(() -> ApiException.unauthorized("刷新令牌已失效"));
        User user = store.users.get(userId);
        if (user == null) throw ApiException.unauthorized("账号不存在");
        return session(user);
    }

    public Map<String, Object> session(User user) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("accessToken", jwt.issue(user.id, "access", accessTtl));
        data.put("refreshToken", jwt.issue(user.id, "refresh", refreshTtl));
        data.put("tokenType", "Bearer");
        data.put("expiresIn", accessTtl);
        data.put("user", Views.user(user));
        return data;
    }

    private User createUser(String phone) {
        User u = new User();
        u.id = store.id("u");
        u.phone = phone;
        u.nickname = "旅行者" + phone.substring(7);
        u.bio = "刚刚开始记录旅行。";
        u.realnameStatus = "PENDING";
        u.createdAt = Instant.now();
        u.settings.put("mapVisible", true);
        u.settings.put("autoLight", true);
        u.settings.put("albumSync", true);
        u.settings.put("shareVisible", true);
        store.users.put(u.id, u);
        store.currentCity.put(u.id, "杭州");
        return u;
    }

    private String mask(String phone) {
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }
}
