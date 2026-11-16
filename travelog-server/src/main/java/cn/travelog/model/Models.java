package cn.travelog.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Domain model for the demo backend. Public fields keep the in-memory store and
 * Jackson serialization simple; a production build would split these into JPA
 * entities plus DTOs.
 */
public final class Models {
    private Models() {
    }

    public static class User {
        public String id;
        public String phone;
        public String nickname;
        public String avatarUrl;
        public String gender = "FEMALE";
        public Integer birthYear;
        public String homeCity = "杭州";
        public String bio = "";
        public List<String> tags = new ArrayList<>();
        public String realnameStatus = "VERIFIED";
        public String status = "ACTIVE";
        public boolean admin;
        public Instant createdAt = Instant.now();
        public Instant deletionRequestedAt;
        public Map<String, Object> settings = new LinkedHashMap<>();
        public List<Device> devices = new ArrayList<>();
    }

    public static class Device {
        public String id;
        public String name;
        public String platform;
        public Instant lastActiveAt = Instant.now();
        public boolean current;
    }

    public static class City {
        public String adcode;
        public String name;
        public String province;
        public String provinceAdcode;
        public String pinyin;
        public String level = "CITY";
        public boolean lit;
        public boolean deepLit;
        public boolean hot;
        public int visits;
        public int days;
        public Instant firstVisitAt;
        public Instant lastVisitAt;
    }

    public static class Visit {
        public String id;
        public String userId;
        public String cityAdcode;
        public Instant arrivedAt;
        public Instant leftAt;
        public String method = "AUTO";
        public String status = "CONFIRMED";
        public double confidence = 0.92;
        public int durationMinutes;
        public String note;
        public Instant createdAt = Instant.now();
    }

    public static class MemoryBox {
        public String id;
        public String userId;
        public String tripId;
        public String title;
        public String coverUrl;
        public String template = "magazine";
        public String status = "DRAFT";
        public String visibility = "PRIVATE";
        public int mediaCount;
        public String cityAdcode;
        public Instant startAt;
        public Instant endAt;
        public Instant updatedAt = Instant.now();
        public Instant createdAt = Instant.now();
        public boolean deleted;
        public Instant deletedAt;
        public String layoutJson;
        public String shareLinkId;
        public List<Day> days = new ArrayList<>();
        public List<String> photos = new ArrayList<>();
    }

    public static class Day {
        public String label;
        public String date;
        public String note;
        public List<String> photos = new ArrayList<>();

        public Day() {
        }

        public Day(String label, String date, String note, List<String> photos) {
            this.label = label;
            this.date = date;
            this.note = note;
            this.photos = photos;
        }
    }

    public static class MediaAsset {
        public String id;
        public String boxId;
        public String userId;
        public String url;
        public String type = "IMAGE";
        public int width = 1200;
        public int height = 1600;
        public String status = "READY";
        public Instant createdAt = Instant.now();
    }

    public static class ShareLink {
        public String id;
        public String boxId;
        public String userId;
        public String token;
        public Instant expiresAt;
        public String password;
        public boolean watermark = true;
        public boolean revoked;
        public Instant createdAt = Instant.now();
    }

    public static class Post {
        public String id;
        public String type = "NOW";
        public String authorId;
        public String city = "杭州";
        public String place;
        public String area = "西湖景区";
        public String content;
        public String status = "PUBLISHED";
        public boolean onSite = true;
        public Instant publishedAt = Instant.now();
        public Instant expiresAt;
        public int validCount;
        public int invalidCount;
        public int likeCount;
        public int favoriteCount;
        public int commentCount;
        public int renewCount;
        public String imageUrl;
        public boolean deleted;
    }

    public static class PostVote {
        public String postId;
        public String userId;
        public String kind;
        public Instant createdAt = Instant.now();
    }

    public static class Comment {
        public String id;
        public String postId;
        public String userId;
        public String content;
        public Instant createdAt = Instant.now();
    }

    public static class ShareSession {
        public String id;
        public String userId;
        public String city = "杭州";
        public String status = "ACTIVE";
        public Instant expiresAt;
        public String distanceBand = "ONE_KM";
        public Card card = new Card();
        public Set<String> likedUserIds = new LinkedHashSet<>();
        public Instant createdAt = Instant.now();
    }

    public static class Card {
        public String headline = "在杭州，找一段同路";
        public List<String> tags = new ArrayList<>();
        public List<String> dates = new ArrayList<>();
        public String intent = "拍照 / 看展搭子";
        public String distanceBand = "ONE_KM";
        public String note = "名片不展示手机号、社交账号和精确位置。";
    }

    public static class HallUser {
        public String id;
        public String name;
        public String initial;
        public int age;
        public List<String> tags = new ArrayList<>();
        public String distanceBand = "ONE_KM";
        public String why;
        public String note;
        public boolean verified = true;
        public String hue = "a1";
        public boolean likedYou;
    }

    public static class Like {
        public String id;
        public String fromUserId;
        public String toUserId;
        public Instant createdAt = Instant.now();
    }

    public static class Match {
        public String id;
        public String a;
        public String b;
        public Instant createdAt = Instant.now();
    }

    public static class Team {
        public String id;
        public String name = "西湖慢走小队";
        public String city = "杭州";
        public String leaderId;
        public int capacity = 5;
        public String status = "ACTIVE";
        public Meeting meeting = new Meeting();
        public Instant createdAt = Instant.now();
        public List<Member> members = new ArrayList<>();
        public List<Message> messages = new ArrayList<>();
        public List<JoinRequest> joinRequests = new ArrayList<>();
    }

    public static class Member {
        public String userId;
        public String name;
        public String initial;
        public boolean leader;
        public Instant joinedAt = Instant.now();
    }

    public static class JoinRequest {
        public String id;
        public String userId;
        public String name;
        public String status = "PENDING";
        public Instant createdAt = Instant.now();
    }

    public static class Message {
        public String id;
        public String userId;
        public String name;
        public String text;
        public boolean system;
        public Instant createdAt = Instant.now();
    }

    public static class Meeting {
        public String place = "九溪公交站 C 口";
        public String time = "今天 16:30";
        public String note = "公共场所集合，迟到 15 分钟请在群里说一声";
    }

    public static class Notification {
        public String id;
        public String userId;
        public String type = "SYSTEM";
        public String title;
        public String body;
        public boolean read;
        public Instant createdAt = Instant.now();
    }

    public static class AiConversation {
        public String id;
        public String userId;
        public String city = "杭州";
        public Instant createdAt = Instant.now();
        public List<AiMessage> messages = new ArrayList<>();
    }

    public static class AiMessage {
        public String id;
        public String role = "ASSISTANT";
        public String content;
        public String kind = "TEXT";
        public Instant createdAt = Instant.now();
        public Object cards;
        public List<Source> sources = new ArrayList<>();
    }

    public static class Source {
        public String title;
        public String meta;
        public String detail;

        public Source() {
        }

        public Source(String title, String meta, String detail) {
            this.title = title;
            this.meta = meta;
            this.detail = detail;
        }
    }

    public static class Quota {
        public int limit;
        public int used;
        public int remaining;
        public Instant resetAt;
    }

    public static class Report {
        public String id;
        public String reporterId;
        public String targetType;
        public String targetId;
        public String reason;
        public String status = "PENDING";
        public Instant createdAt = Instant.now();
    }

    public static class Review {
        public String id;
        public String targetType;
        public String targetId;
        public String title;
        public String content;
        public String status = "PENDING";
        public String decision;
        public Instant createdAt = Instant.now();
    }

    public static class Trip {
        public String id;
        public String userId;
        public String cityAdcode;
        public String title;
        public Instant startAt;
        public Instant endAt;
        public List<String> visitIds = new ArrayList<>();
        public int mediaCount;
    }

    public static class Point {
        public double lat;
        public double lng;
        public double accuracy;
        public long capturedAtMs;

        public Point() {
        }

        public Point(double lat, double lng, double accuracy, long capturedAtMs) {
            this.lat = lat;
            this.lng = lng;
            this.accuracy = accuracy;
            this.capturedAtMs = capturedAtMs;
        }
    }

    public static class LocationState {
        public String userId;
        public String cityAdcode = "330100";
        public List<Point> points = new ArrayList<>();
        public double lastAccuracy = 38;
        public Instant lastAt = Instant.now();
        public int pendingMinutes = 47;
        public int pendingPoints = 3;
    }

    public static class Idempotency {
        public String key;
        public Instant createdAt = Instant.now();
        public String result;
    }
}
