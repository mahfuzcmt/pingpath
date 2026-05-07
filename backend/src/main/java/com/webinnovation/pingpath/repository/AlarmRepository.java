package com.webinnovation.pingpath.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.webinnovation.pingpath.domain.Alarm;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.postgresql.util.PGobject;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
@Slf4j
public class AlarmRepository {

    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    private static final String SELECT_FIELDS = """
            SELECT id, org_id, device_imei, type, severity, ts, latitude, longitude,
                   acknowledged, acknowledged_by, acknowledged_at, metadata, created_at
            FROM alarms
            """;

    private final RowMapper<Alarm> rowMapper = (rs, rn) -> {
        Object lat = rs.getObject("latitude");
        Object lng = rs.getObject("longitude");
        OffsetDateTime ackedAt = rs.getObject("acknowledged_at", OffsetDateTime.class);
        Object metaObj = rs.getObject("metadata");
        Map<String, Object> metadata = parseMetadata(metaObj);
        return new Alarm(
                rs.getObject("id", UUID.class),
                rs.getObject("org_id", UUID.class),
                rs.getString("device_imei"),
                rs.getString("type"),
                rs.getString("severity"),
                rs.getObject("ts", OffsetDateTime.class).toInstant(),
                lat == null ? null : rs.getDouble("latitude"),
                lng == null ? null : rs.getDouble("longitude"),
                rs.getBoolean("acknowledged"),
                rs.getObject("acknowledged_by", UUID.class),
                ackedAt == null ? null : ackedAt.toInstant(),
                metadata,
                rs.getObject("created_at", OffsetDateTime.class).toInstant()
        );
    };

    public UUID insert(UUID orgId, String imei, String type, String severity,
                       Instant ts, Double lat, Double lng, Map<String, Object> metadata) {
        UUID id = UUID.randomUUID();
        var params = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("orgId", orgId)
                .addValue("imei", imei)
                .addValue("type", type)
                .addValue("severity", severity)
                .addValue("ts", Timestamp.from(ts))
                .addValue("lat", lat)
                .addValue("lng", lng)
                .addValue("metadata", toJsonb(metadata));
        jdbc.update("""
                INSERT INTO alarms
                  (id, org_id, device_imei, type, severity, ts, geom, latitude, longitude, metadata)
                VALUES
                  (:id, :orgId, :imei, :type, :severity, :ts,
                   CASE WHEN :lng IS NOT NULL AND :lat IS NOT NULL
                        THEN ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
                        ELSE NULL END,
                   :lat, :lng, :metadata)
                """, params);
        return id;
    }

    public Optional<Alarm> findByOrgAndId(UUID orgId, UUID id) {
        try {
            Alarm a = jdbc.queryForObject(
                    SELECT_FIELDS + " WHERE org_id = :orgId AND id = :id",
                    new MapSqlParameterSource("orgId", orgId).addValue("id", id),
                    rowMapper);
            return Optional.ofNullable(a);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Alarm> listForOrg(UUID orgId, Boolean onlyUnacked, int limit, int offset) {
        var params = new MapSqlParameterSource()
                .addValue("orgId", orgId)
                .addValue("limit", limit)
                .addValue("offset", offset);
        StringBuilder sql = new StringBuilder(SELECT_FIELDS).append(" WHERE org_id = :orgId");
        if (Boolean.TRUE.equals(onlyUnacked)) {
            sql.append(" AND acknowledged = false");
        }
        sql.append(" ORDER BY ts DESC LIMIT :limit OFFSET :offset");
        return jdbc.query(sql.toString(), params, rowMapper);
    }

    public List<Alarm> listForDevice(UUID orgId, String imei, int limit, int offset) {
        var params = new MapSqlParameterSource()
                .addValue("orgId", orgId)
                .addValue("imei", imei)
                .addValue("limit", limit)
                .addValue("offset", offset);
        return jdbc.query(SELECT_FIELDS + """
                 WHERE org_id = :orgId AND device_imei = :imei
                 ORDER BY ts DESC
                 LIMIT :limit OFFSET :offset
                """, params, rowMapper);
    }

    public List<Alarm> findInRange(UUID orgId, Instant from, Instant to) {
        var params = new MapSqlParameterSource()
                .addValue("orgId", orgId)
                .addValue("from", Timestamp.from(from))
                .addValue("to", Timestamp.from(to));
        return jdbc.query(SELECT_FIELDS + """
                 WHERE org_id = :orgId AND ts >= :from AND ts < :to
                 ORDER BY ts ASC
                """, params, rowMapper);
    }

    public boolean acknowledge(UUID orgId, UUID alarmId, UUID userId) {
        int n = jdbc.update("""
                UPDATE alarms
                SET acknowledged = true, acknowledged_by = :uid, acknowledged_at = now()
                WHERE org_id = :orgId AND id = :id AND acknowledged = false
                """, new MapSqlParameterSource("orgId", orgId)
                        .addValue("id", alarmId)
                        .addValue("uid", userId));
        return n > 0;
    }

    private PGobject toJsonb(Map<String, Object> metadata) {
        try {
            PGobject obj = new PGobject();
            obj.setType("jsonb");
            obj.setValue(objectMapper.writeValueAsString(metadata == null ? Map.of() : metadata));
            return obj;
        } catch (JsonProcessingException | SQLException e) {
            log.warn("Failed to encode alarm metadata as jsonb: {}", e.getMessage());
            try {
                PGobject empty = new PGobject();
                empty.setType("jsonb");
                empty.setValue("{}");
                return empty;
            } catch (SQLException ignored) {
                return null;
            }
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseMetadata(Object raw) {
        if (raw == null) return Collections.emptyMap();
        try {
            String json = raw instanceof PGobject pg ? pg.getValue() : raw.toString();
            if (json == null || json.isBlank()) return Collections.emptyMap();
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            log.debug("alarm metadata parse failed: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}
