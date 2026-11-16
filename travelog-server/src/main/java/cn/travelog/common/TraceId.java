package cn.travelog.common;

import org.slf4j.MDC;

import java.util.UUID;

/** Per-request trace id used in every envelope and in the X-Trace-Id header. */
public final class TraceId {
    public static final String KEY = "traceId";
    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    private TraceId() {
    }

    public static String start(String incoming) {
        String id = (incoming == null || incoming.isBlank()) ? UUID.randomUUID().toString().replace("-", "") : incoming;
        CURRENT.set(id);
        MDC.put(KEY, id);
        return id;
    }

    public static String current() {
        String id = CURRENT.get();
        if (id == null) {
            id = UUID.randomUUID().toString().replace("-", "");
            CURRENT.set(id);
        }
        return id;
    }

    public static void clear() {
        CURRENT.remove();
        MDC.remove(KEY);
    }
}
