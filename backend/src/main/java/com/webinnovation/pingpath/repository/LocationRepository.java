package com.webinnovation.pingpath.repository;

import com.webinnovation.pingpath.domain.Location;
import com.webinnovation.pingpath.protocol.LocationData;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class LocationRepository {

    private final NamedParameterJdbcTemplate jdbc;

    private static final String SELECT_FIELDS = """
            id, device_imei, org_id, ts, received_at, latitude, longitude,
            speed, course, altitude, satellites, valid, acc_on, voltage_mv, mileage_m,
            gsm_signal, engine_hours_seconds
            """;

    private static final RowMapper<Location> ROW_MAPPER = (rs, rn) -> new Location(
            rs.getLong("id"),
            rs.getString("device_imei"),
            rs.getObject("org_id", UUID.class),
            rs.getObject("ts", OffsetDateTime.class).toInstant(),
            rs.getObject("received_at", OffsetDateTime.class).toInstant(),
            rs.getDouble("latitude"),
            rs.getDouble("longitude"),
            rs.getInt("speed"),
            rs.getInt("course"),
            (Integer) rs.getObject("altitude"),
            (Integer) rs.getObject("satellites"),
            rs.getBoolean("valid"),
            (Boolean) rs.getObject("acc_on"),
            (Integer) rs.getObject("voltage_mv"),
            (Long) rs.getObject("mileage_m"),
            (Integer) rs.getObject("gsm_signal"),
            (Integer) rs.getObject("engine_hours_seconds")
    );

    /**
     * Hot-path insert. Uses ST_MakePoint instead of WKT parsing for speed.
     * Called once per location packet — performance-critical (CLAUDE.md §3.2 rule 1).
     */
    public void insert(LocationData d) {
        Integer engineHours = d.getAccOnTimeSeconds() == null ? null : d.getAccOnTimeSeconds().intValue();
        var params = new MapSqlParameterSource()
                .addValue("imei", d.getImei())
                .addValue("orgId", d.getOrgId())
                .addValue("ts", Timestamp.from(d.getTimestamp()))
                .addValue("lat", d.getLatitude())
                .addValue("lng", d.getLongitude())
                .addValue("speed", d.getSpeed())
                .addValue("course", d.getCourse())
                .addValue("satellites", d.getSatellites())
                .addValue("valid", d.isValid())
                .addValue("accOn", d.getAccOn())
                .addValue("voltageMv", d.getVoltageMv())
                .addValue("mileage", d.getMileageMeters())
                .addValue("gsmSignal", d.getGsmSignal())
                .addValue("engineHours", engineHours)
                .addValue("rawPayload", d.getRawPayload());

        jdbc.update("""
                INSERT INTO locations
                  (device_imei, org_id, ts, geom, latitude, longitude,
                   speed, course, satellites, valid, acc_on, voltage_mv, mileage_m,
                   gsm_signal, engine_hours_seconds, raw_payload)
                VALUES
                  (:imei, :orgId, :ts,
                   ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                   :lat, :lng, :speed, :course, :satellites, :valid,
                   :accOn, :voltageMv, :mileage,
                   :gsmSignal, :engineHours, :rawPayload)
                """, params);
    }

    public Optional<Location> findLastForImei(String imei) {
        try {
            Location l = jdbc.queryForObject(
                    "SELECT " + SELECT_FIELDS + " FROM locations WHERE device_imei = :imei ORDER BY ts DESC LIMIT 1",
                    new MapSqlParameterSource("imei", imei), ROW_MAPPER);
            return Optional.ofNullable(l);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Location> findHistory(UUID orgId, String imei, Instant from, Instant to, int limit) {
        var params = new MapSqlParameterSource()
                .addValue("orgId", orgId)
                .addValue("imei", imei)
                .addValue("from", Timestamp.from(from))
                .addValue("to", Timestamp.from(to))
                .addValue("limit", limit);
        return jdbc.query(
                "SELECT " + SELECT_FIELDS + " FROM locations" +
                        " WHERE org_id = :orgId AND device_imei = :imei" +
                        " AND ts >= :from AND ts < :to ORDER BY ts ASC LIMIT :limit",
                params, ROW_MAPPER);
    }

    public List<Location> findAllLastKnownForOrg(UUID orgId) {
        return jdbc.query("""
                SELECT DISTINCT ON (device_imei) %s
                FROM locations
                WHERE org_id = :orgId
                ORDER BY device_imei, ts DESC
                """.formatted(SELECT_FIELDS),
                new MapSqlParameterSource("orgId", orgId), ROW_MAPPER);
    }
}
