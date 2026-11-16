package cn.travelog.common;

public class ApiException extends RuntimeException {
    private final int status;
    private final String code;
    private final Object data;

    public ApiException(int status, String code, String message) {
        this(status, code, message, null);
    }

    public ApiException(int status, String code, String message, Object data) {
        super(message);
        this.status = status;
        this.code = code;
        this.data = data;
    }

    public int status() {
        return status;
    }

    public String code() {
        return code;
    }

    public Object data() {
        return data;
    }

    public static ApiException notFound(String code, String message) {
        return new ApiException(404, code, message);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(401, "AUTH_401_01", message);
    }

    public static ApiException forbidden(String code, String message) {
        return new ApiException(403, code, message);
    }

    public static ApiException badRequest(String code, String message) {
        return new ApiException(400, code, message);
    }

    public static ApiException conflict(String code, String message) {
        return new ApiException(409, code, message);
    }

    public static ApiException tooMany(String code, String message) {
        return new ApiException(429, code, message);
    }

    public static ApiException unprocessable(String code, String message) {
        return new ApiException(422, code, message);
    }
}
