package com.webinnovation.motolink.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Expo push tokens for the mobile app. A token is unique per app install;
 * re-registration by a different user (phone changed hands, re-login) simply
 * reassigns the row to the new user/org.
 */
@Repository
@RequiredArgsConstructor
public class PushTokenRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public void upsert(UUID orgId, UUID userId, String token, String platform) {
        jdbc.update("""
                INSERT INTO push_tokens (org_id, user_id, token, platform)
                VALUES (:orgId, :userId, :token, :platform)
                ON CONFLICT (token) DO UPDATE
                SET org_id = EXCLUDED.org_id,
                    user_id = EXCLUDED.user_id,
                    platform = EXCLUDED.platform,
                    last_seen_at = now()
                """, new MapSqlParameterSource()
                        .addValue("orgId", orgId)
                        .addValue("userId", userId)
                        .addValue("token", token)
                        .addValue("platform", platform));
    }

    /** Delete a token owned by this user (sign-out). Returns true if a row was removed. */
    public boolean deleteForUser(UUID userId, String token) {
        int n = jdbc.update(
                "DELETE FROM push_tokens WHERE user_id = :userId AND token = :token",
                new MapSqlParameterSource("userId", userId).addValue("token", token));
        return n > 0;
    }

    /** All tokens registered by users of the org — push fanout audience. */
    public List<String> listTokensForOrg(UUID orgId) {
        return jdbc.queryForList(
                "SELECT token FROM push_tokens WHERE org_id = :orgId",
                new MapSqlParameterSource("orgId", orgId),
                String.class);
    }

    /** Purge tokens Expo reported as DeviceNotRegistered (app uninstalled). */
    public void deleteAll(List<String> tokens) {
        if (tokens == null || tokens.isEmpty()) return;
        jdbc.update("DELETE FROM push_tokens WHERE token IN (:tokens)",
                new MapSqlParameterSource("tokens", tokens));
    }
}
