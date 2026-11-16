package cn.travelog;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "travelog.seed-demo=true")
class ApiSmokeTest {

    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate rest;

    private String base() {
        return "http://127.0.0.1:" + port + "/api/v1";
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> body(ResponseEntity<Map> response) {
        return (Map<String, Object>) response.getBody();
    }

    private String login() {
        ResponseEntity<Map> response = rest.postForEntity(base() + "/auth/sessions/sms",
                Map.of("phone", "13800000000", "code", "123456"), Map.class);
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        Map<String, Object> data = (Map<String, Object>) body(response).get("data");
        return (String) data.get("accessToken");
    }

    @Test
    void healthIsPublic() {
        ResponseEntity<Map> response = rest.getForEntity(base() + "/health", Map.class);
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(body(response).get("code")).isEqualTo(0);
    }

    @Test
    void loginAndProfile() {
        String token = login();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        ResponseEntity<Map> response = rest.exchange(base() + "/me", HttpMethod.GET,
                new HttpEntity<>(headers), Map.class);
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        Map<String, Object> data = (Map<String, Object>) body(response).get("data");
        assertThat(data.get("nickname")).isEqualTo("阿澈");
        assertThat(data.get("phone")).isEqualTo("138****0000");
    }

    @Test
    void citySearchMatchesPinyinPrefix() {
        ResponseEntity<Map> response = rest.getForEntity(base() + "/cities?q=da&size=10", Map.class);
        Map<String, Object> data = (Map<String, Object>) body(response).get("data");
        List<Map<String, Object>> items = (List<Map<String, Object>>) data.get("items");
        assertThat(items).extracting(i -> i.get("name")).containsExactlyInAnyOrder("大理", "大连");
        assertThat(items).extracting(i -> i.get("name")).doesNotContain("青岛");
    }

    @Test
    void protectedEndpointRequiresToken() {
        ResponseEntity<Map> response = rest.getForEntity(base() + "/memory-boxes", Map.class);
        assertThat(response.getStatusCode().value()).isEqualTo(401);
        assertThat(body(response).get("code")).isEqualTo("AUTH_401_01");
        assertThat(body(response).get("traceId")).isNotNull();
    }

    @Test
    void createPostAndRejectSelfVote() {
        String token = login();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> request = Map.of(
                "type", "NOW",
                "city", "杭州",
                "place", "断桥",
                "content", "后端自动化测试内容",
                "onSite", true);
        ResponseEntity<Map> created = rest.exchange(base() + "/posts", HttpMethod.POST,
                new HttpEntity<>(request, headers), Map.class);
        assertThat(created.getStatusCode().value()).isEqualTo(200);
        Map<String, Object> post = (Map<String, Object>) body(created).get("data");
        assertThat(post.get("status")).isEqualTo("PUBLISHED");

        ResponseEntity<Map> vote = rest.exchange(base() + "/posts/" + post.get("id") + "/votes",
                HttpMethod.POST, new HttpEntity<>(Map.of("kind", "VALID"), headers), Map.class);
        assertThat(vote.getStatusCode().value()).isEqualTo(403);
        assertThat(body(vote).get("code")).isEqualTo("POST_403_03");
    }
}
