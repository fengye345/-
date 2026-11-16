package cn.travelog.common;

import java.util.List;

public record PageResult<T>(List<T> items, int page, int size, long total, boolean hasMore) {
    public static <T> PageResult<T> of(List<T> all, int page, int size) {
        int p = Math.max(1, page);
        int s = Math.min(100, Math.max(1, size));
        int from = Math.min(all.size(), (p - 1) * s);
        int to = Math.min(all.size(), from + s);
        return new PageResult<>(all.subList(from, to), p, s, all.size(), to < all.size());
    }
}
