package cn.travelog.common;

/**
 * Unified response envelope. `code` is 0 for success and a stable string such
 * as POST_403_01 for failures, matching the API document.
 */
public record ApiResponse<T>(Object code, String message, T data, String traceId) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(0, "ok", data, TraceId.current());
    }

    public static ApiResponse<Void> ok() {
        return new ApiResponse<>(0, "ok", null, TraceId.current());
    }

    public static <T> ApiResponse<T> error(String code, String message, T data) {
        return new ApiResponse<>(code, message, data, TraceId.current());
    }

    public static ApiResponse<Void> error(String code, String message) {
        return new ApiResponse<>(code, message, null, TraceId.current());
    }
}
