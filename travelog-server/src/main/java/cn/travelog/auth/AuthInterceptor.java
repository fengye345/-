package cn.travelog.auth;

import cn.travelog.common.ApiException;
import cn.travelog.model.Models.User;
import cn.travelog.store.DataStore;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

@Component
public class AuthInterceptor implements HandlerInterceptor {
    private static final Set<String> PUBLIC_PREFIXES = Set.of(
            "/api/v1/auth/", "/api/v1/culture-cards",
            "/api/v1/health", "/actuator/", "/photos/"
    );

    private final JwtService jwt;
    private final DataStore store;

    public AuthInterceptor(JwtService jwt, DataStore store) {
        this.jwt = jwt;
        this.store = store;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        String path = request.getRequestURI();
        if (PUBLIC_PREFIXES.stream().anyMatch(path::startsWith)) return true;
        if ("GET".equalsIgnoreCase(request.getMethod())) {
            if (path.equals("/api/v1/cities") || path.equals("/api/v1/cities/provinces")
                    || path.matches("/api/v1/cities/\\d+")) {
                return true;
            }
            if (path.startsWith("/api/v1/posts") || path.startsWith("/api/v1/questions")) return true;
            if (path.startsWith("/api/v1/share-links/")) return true;
        }

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw ApiException.unauthorized("请先登录");
        }
        String token = header.substring(7).trim();
        String userId = jwt.verify(token, "access")
                .orElseThrow(() -> ApiException.unauthorized("登录已失效，请重新登录"));
        User user = store.users.get(userId);
        if (user == null || !"ACTIVE".equals(user.status)) {
            throw ApiException.unauthorized("账号不可用");
        }
        request.setAttribute("userId", userId);
        request.setAttribute("user", user);
        return true;
    }
}
