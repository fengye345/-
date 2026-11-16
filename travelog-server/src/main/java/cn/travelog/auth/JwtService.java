package cn.travelog.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/** Minimal HS256 JWT implementation; no external crypto dependency. */
@Service
public class JwtService {
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private static final String HEADER = ENCODER.encodeToString(
            "{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

    private final ObjectMapper mapper;
    private final byte[] secret;

    public JwtService(ObjectMapper mapper,
                      @Value("${travelog.jwt.secret}") String secret) {
        this.mapper = mapper;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String issue(String userId, String type, long ttlSeconds) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", userId);
            payload.put("typ", type);
            payload.put("iat", Instant.now().getEpochSecond());
            payload.put("exp", Instant.now().plusSeconds(ttlSeconds).getEpochSecond());
            String body = ENCODER.encodeToString(mapper.writeValueAsBytes(payload));
            String content = HEADER + "." + body;
            return content + "." + sign(content);
        } catch (Exception e) {
            throw new IllegalStateException("could not issue token", e);
        }
    }

    public Optional<String> verify(String token, String expectedType) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return Optional.empty();
            String content = parts[0] + "." + parts[1];
            if (!MessageDigest.isEqual(sign(content).getBytes(StandardCharsets.UTF_8),
                    parts[2].getBytes(StandardCharsets.UTF_8))) {
                return Optional.empty();
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = mapper.readValue(DECODER.decode(parts[1]), Map.class);
            if (expectedType != null && !expectedType.equals(payload.get("typ"))) return Optional.empty();
            Number exp = (Number) payload.get("exp");
            if (exp == null || exp.longValue() < Instant.now().getEpochSecond()) return Optional.empty();
            Object sub = payload.get("sub");
            return sub == null ? Optional.empty() : Optional.of(sub.toString());
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private String sign(String content) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return ENCODER.encodeToString(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
    }
}
