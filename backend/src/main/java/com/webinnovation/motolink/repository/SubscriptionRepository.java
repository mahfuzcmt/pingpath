package com.webinnovation.motolink.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Read access to the subscriptions table (defined in V1). Surfaces each device's
 * current subscription status + expiry so the device API can show "Expires on …".
 */
@Repository
@RequiredArgsConstructor
public class SubscriptionRepository {

    private final NamedParameterJdbcTemplate jdbc;

    /** Minimal per-device subscription state for the device view. */
    public record SubInfo(String status, LocalDate nextDueAt) {}

    /** One row per device (the one with the furthest next_due_at), keyed by IMEI. */
    public Map<String, SubInfo> latestByOrg(UUID orgId) {
        return jdbc.query("""
                SELECT DISTINCT ON (device_imei) device_imei, status, next_due_at
                FROM subscriptions
                WHERE org_id = :orgId
                ORDER BY device_imei, next_due_at DESC
                """, new MapSqlParameterSource("orgId", orgId), rs -> {
            Map<String, SubInfo> out = new HashMap<>();
            while (rs.next()) {
                out.put(rs.getString("device_imei"),
                        new SubInfo(rs.getString("status"), rs.getObject("next_due_at", LocalDate.class)));
            }
            return out;
        });
    }

    public Optional<SubInfo> latestForImei(UUID orgId, String imei) {
        try {
            SubInfo s = jdbc.queryForObject("""
                    SELECT status, next_due_at
                    FROM subscriptions
                    WHERE org_id = :orgId AND device_imei = :imei
                    ORDER BY next_due_at DESC
                    LIMIT 1
                    """,
                    new MapSqlParameterSource("orgId", orgId).addValue("imei", imei),
                    (rs, rn) -> new SubInfo(rs.getString("status"), rs.getObject("next_due_at", LocalDate.class)));
            return Optional.ofNullable(s);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}
